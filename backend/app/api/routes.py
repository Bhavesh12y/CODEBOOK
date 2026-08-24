from __future__ import annotations

import asyncio
import os
import queue
import subprocess
import tempfile
import threading
import time
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Response, UploadFile, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel

from app.dependencies import kernel_manager, notebook_repository
from app.ai.service import (
    build_runtime_context,
    create_ai_service_for_provider,
    create_ai_service_from_request,
    probe_ai_provider_key,
)
from app.config import get_settings
from app.execution.compiler import CompilerDetector
from app.execution.cpp_kernel import _minimal_environment, _parse_diagnostics, _terminate_process_tree
from app.execution.cpp_source import build_execution_source
from app.models.ai import (
    AIActionRequest,
    AIActionResponse,
    AIChatRequest,
    AIChatResponse,
    AIConnectionTestRequest,
    AIConnectionTestResponse,
)
from app.models.execution import ExecuteAllRequest, ExecuteAllResponse, ExecuteRequest, ExecutionCell, ExecutionResult
from app.models.notebook import NotebookDocument, NotebookSummary, ProjectFile
from app.notebook.repository import NotebookFormatError


router = APIRouter(prefix="/api")


class RenameNotebookRequest(BaseModel):
    name: str


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/compiler")
def compiler() -> object:
    return CompilerDetector().detect()


@router.post("/kernel/start")
def kernel_start() -> dict[str, str]:
    return kernel_manager.start()


@router.post("/kernel/restart")
def kernel_restart() -> dict[str, str]:
    return kernel_manager.restart()


@router.post("/kernel/stop")
def kernel_stop() -> dict[str, str]:
    return kernel_manager.stop()


@router.post("/kernel/interrupt")
def kernel_interrupt() -> dict[str, str]:
    return kernel_manager.interrupt()


@router.post("/execute", response_model=ExecutionResult)
def execute(request: ExecuteRequest) -> ExecutionResult:
    return kernel_manager.execute(request)


@router.post("/execute/all", response_model=ExecuteAllResponse)
def execute_all(request: ExecuteAllRequest) -> ExecuteAllResponse:
    return kernel_manager.execute_all(request)


@router.websocket("/execute/interactive")
async def execute_interactive(websocket: WebSocket) -> None:
    await websocket.accept()
    process: subprocess.Popen[bytes] | None = None
    receiver_task: asyncio.Task | None = None
    started = time.perf_counter()

    try:
        initial = await websocket.receive_json()
        request = ExecuteRequest(
            notebookId=str(initial.get("notebookId") or "unsaved"),
            cellId=str(initial.get("cellId") or ""),
            code=str(initial.get("code") or ""),
            cells=[ExecutionCell(**cell) for cell in initial.get("cells", [])],
        )
        cells = list(request.cells) or [ExecutionCell(id=request.cellId, type="code", source=request.code)]
        generated = build_execution_source(cells, request.cellId)
        compiler = CompilerDetector().detect()
        if not compiler.available or not compiler.path:
            await websocket.send_json({"type": "error", "text": compiler.error or "C++ compiler is not available."})
            await websocket.send_json({"type": "exit", "code": None, "elapsed": round(time.perf_counter() - started, 4)})
            return

        await websocket.send_json({"type": "status", "status": "compiling"})
        with tempfile.TemporaryDirectory(prefix="cppbook-live-", ignore_cleanup_errors=True) as temp_root:
            temp_dir = Path(temp_root)
            source_path = temp_dir / "main.cpp"
            binary_path = temp_dir / ("notebook.exe" if os.name == "nt" else "notebook")
            source_path.write_text(generated.source, encoding="utf-8")
            compile_cmd = [
                compiler.path,
                f"-std={get_settings().cpp_standard}",
                "-O0",
                "-g",
                str(source_path),
                "-o",
                str(binary_path),
            ]
            compile_result = await asyncio.to_thread(
                subprocess.run,
                compile_cmd,
                cwd=str(temp_dir),
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=20,
                check=False,
            )
            if compile_result.returncode != 0:
                diagnostics = _parse_diagnostics(compile_result.stderr, generated)
                await websocket.send_json({
                    "type": "stderr",
                    "text": compile_result.stderr,
                    "diagnostics": [item.model_dump() if hasattr(item, "model_dump") else item.dict() for item in diagnostics],
                })
                await websocket.send_json({"type": "exit", "code": compile_result.returncode, "elapsed": round(time.perf_counter() - started, 4)})
                return

            await websocket.send_json({"type": "status", "status": "running"})

            # output_queue carries output chunks plus _STREAM_DONE sentinels.
            # Each reader thread pushes one sentinel when it's done.
            # We wait for both sentinels before sending "exit".
            _STREAM_DONE = object()
            output_queue: queue.Queue[dict | object] = queue.Queue()

            process = subprocess.Popen(
                [str(binary_path)],
                cwd=str(temp_dir),
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=0,
                env=_minimal_environment(temp_dir),
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
                preexec_fn=None if os.name == "nt" else os.setsid,
            )

            def _reader(name: str, stream) -> None:
                """Read *stream* in 4096-byte chunks and push to output_queue."""
                try:
                    while True:
                        chunk = stream.read(4096)
                        if not chunk:
                            break
                        output_queue.put({"type": name, "text": chunk.decode("utf-8", errors="replace")})
                finally:
                    output_queue.put(_STREAM_DONE)

            threading.Thread(target=_reader, args=("stdout", process.stdout), daemon=True).start()
            threading.Thread(target=_reader, args=("stderr", process.stderr), daemon=True).start()

            async def _receive_input() -> None:
                """Forward stdin / interrupt messages from the websocket to the process."""
                while True:
                    try:
                        message = await asyncio.wait_for(websocket.receive_json(), timeout=0.5)
                    except asyncio.TimeoutError:
                        # Check if process has exited so we stop waiting
                        if process.poll() is not None:
                            return
                        continue
                    except (WebSocketDisconnect, RuntimeError):
                        return
                    if message.get("type") == "stdin" and process.stdin:
                        try:
                            text = str(message.get("text", ""))
                            process.stdin.write((text + "\n").encode("utf-8", errors="replace"))
                            process.stdin.flush()
                        except OSError:
                            pass
                    elif message.get("type") == "interrupt":
                        _terminate_process_tree(process)
                        return

            receiver_task = asyncio.create_task(_receive_input())

            # Drain output until both reader threads signal done
            streams_done = 0
            while streams_done < 2:
                try:
                    item = output_queue.get_nowait()
                except queue.Empty:
                    await asyncio.sleep(0.015)
                    continue
                if item is _STREAM_DONE:
                    streams_done += 1
                elif isinstance(item, dict) and item.get("type") in {"stdout", "stderr"}:
                    await websocket.send_json(item)

            # Both streams fully drained — wait for process to finish (should be instant)
            if process.poll() is None:
                await asyncio.to_thread(process.wait, 2)

            if receiver_task:
                receiver_task.cancel()
            await websocket.send_json({"type": "exit", "code": process.returncode, "elapsed": round(time.perf_counter() - started, 4)})
    except asyncio.CancelledError:
        if process and process.poll() is None:
            _terminate_process_tree(process)
        raise
    except WebSocketDisconnect:
        if process and process.poll() is None:
            _terminate_process_tree(process)
    except Exception as exc:
        if process and process.poll() is None:
            _terminate_process_tree(process)
        try:
            await websocket.send_json({"type": "error", "text": str(exc)})
            await websocket.send_json({"type": "exit", "code": None, "elapsed": round(time.perf_counter() - started, 4)})
        except WebSocketDisconnect:
            pass
    finally:
        if receiver_task:
            receiver_task.cancel()
        if process and process.poll() is None:
            _terminate_process_tree(process)


@router.get("/notebooks", response_model=list[NotebookSummary])
def list_notebooks() -> list[NotebookSummary]:
    return notebook_repository.list()


@router.get("/notebooks/{notebook_id}", response_model=NotebookDocument)
def get_notebook(notebook_id: str) -> NotebookDocument:
    try:
        return notebook_repository.load(notebook_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notebook not found") from exc
    except NotebookFormatError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.post("/notebooks", response_model=NotebookDocument, status_code=status.HTTP_201_CREATED)
def create_notebook(notebook: NotebookDocument) -> NotebookDocument:
    return notebook_repository.save(notebook, notebook_id=None)


@router.put("/notebooks/{notebook_id}", response_model=NotebookDocument)
def update_notebook(notebook_id: str, notebook: NotebookDocument) -> NotebookDocument:
    return notebook_repository.save(notebook, notebook_id=notebook_id)


@router.delete("/notebooks/{notebook_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notebook(notebook_id: str) -> Response:
    try:
        notebook_repository.delete(notebook_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notebook not found") from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/notebooks/{notebook_id}/rename", response_model=NotebookDocument)
def rename_notebook(notebook_id: str, request: RenameNotebookRequest) -> NotebookDocument:
    name = request.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Notebook name is required.")
    try:
        return notebook_repository.rename(notebook_id, name)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notebook not found") from exc


@router.post("/notebooks/import", response_model=NotebookDocument, status_code=status.HTTP_201_CREATED)
async def import_cpp(file: UploadFile = File(...)) -> NotebookDocument:
    if not file.filename or not file.filename.lower().endswith((".cpp", ".cc", ".cxx", ".hpp", ".h", ".cppnb")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload a .cpp, .hpp, or .cppnb file.")
    content = (await file.read()).decode("utf-8", errors="replace")
    if file.filename.lower().endswith(".cppnb"):
        try:
            import json

            notebook = NotebookDocument(**json.loads(content))
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Malformed .cppnb file.") from exc
        return notebook_repository.save(notebook)
    return notebook_repository.import_cpp(file.filename, content)


@router.get("/notebooks/{notebook_id}/export")
def export_cpp(notebook_id: str) -> Response:
    try:
        source = notebook_repository.export_cpp(notebook_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notebook not found") from exc
    filename = f"{notebook_id}.cpp"
    return Response(
        content=source,
        media_type="text/x-c++src",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/notebooks/{notebook_id}/export/cppnb")
def export_cppnb(notebook_id: str) -> Response:
    try:
        payload = notebook_repository.export_cppnb(notebook_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notebook not found") from exc
    filename = f"{notebook_id}.cppnb"
    return Response(
        content=payload,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/notebooks/{notebook_id}/export/pdf")
def export_pdf(notebook_id: str) -> Response:
    try:
        pdf_bytes = notebook_repository.export_pdf(notebook_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notebook not found") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(exc)) from exc
    filename = f"{notebook_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _ai_runtime_context() -> str:
    info = CompilerDetector().detect()
    settings = get_settings()
    return build_runtime_context(
        compiler_name=info.compiler,
        compiler_version=info.version,
        compiler_path=info.path,
        cpp_standard=settings.cpp_standard,
    )


@router.post("/ai/action", response_model=AIActionResponse)
async def ai_action(request: AIActionRequest) -> AIActionResponse:
    class _Context:
        def __init__(self, notebook_id: str, cell_id: str, source: str) -> None:
            self.notebook_id = notebook_id
            self.cell_id = cell_id
            self.source = source

    source = request.notebookSource if request.scope == "notebook" else request.source
    context = _Context(
        notebook_id=request.notebookId,
        cell_id=request.cellId or "notebook",
        source=source,
    )
    runtime_context = _ai_runtime_context()
    service = create_ai_service_from_request(
        enabled=request.aiEnabled,
        provider=request.aiProvider,
        groq_api_key=request.groqApiKey,
        gemini_api_key=request.geminiApiKey,
        groq_model=request.groqModel,
        gemini_model=request.geminiModel,
        legacy_model=request.aiModel,
        legacy_api_keys=request.apiKeys,
        runtime_context=runtime_context,
    )
    try:
        if request.task == "fix":
            suggestion = await service.fix_error(context, request.stderr)
        elif request.task == "optimize":
            suggestion = await service.optimize_cell(context)
        elif request.task == "enhance":
            suggestion = await service.enhance_cell(context)
        else:
            suggestion = await service.explain_cell(context)
        return AIActionResponse(status="ok", suggestion=suggestion)
    except RuntimeError as exc:
        return AIActionResponse(status="error", suggestion=str(exc))


@router.post("/ai/chat", response_model=AIChatResponse)
async def ai_chat(request: AIChatRequest) -> AIChatResponse:
    try:
        runtime_context = _ai_runtime_context()
        service = create_ai_service_from_request(
            enabled=request.aiEnabled,
            provider=request.aiProvider,
            groq_api_key=request.groqApiKey,
            gemini_api_key=request.geminiApiKey,
            groq_model=request.groqModel,
            gemini_model=request.geminiModel,
            legacy_model=request.aiModel,
            legacy_api_keys=request.apiKeys,
            runtime_context=runtime_context,
        )
        messages = [{"role": item.role, "content": item.content} for item in request.messages if item.role != "system"]
        reply = await service.chat(messages, request.notebookSource)
        return AIChatResponse(status="ok", message=reply)
    except RuntimeError as exc:
        return AIChatResponse(status="error", message=str(exc))


@router.post("/ai/test", response_model=AIConnectionTestResponse)
async def ai_test_connection(request: AIConnectionTestRequest) -> AIConnectionTestResponse:
    try:
        probe_ai_provider_key(provider=request.provider, api_key=request.apiKey)
        service = create_ai_service_for_provider(
            provider=request.provider,
            api_key=request.apiKey,
            model=request.model,
            runtime_context=_ai_runtime_context(),
        )
        await service.chat([{"role": "user", "content": "Reply with OK only."}], "")
        return AIConnectionTestResponse(
            status="connected",
            provider=request.provider,
            message=f"{request.provider.title()} connection works.",
        )
    except Exception as exc:
        message = str(exc)
        if "key is valid" not in message:
            try:
                probe_ai_provider_key(provider=request.provider, api_key=request.apiKey)
                return AIConnectionTestResponse(
                    status="limited",
                    provider=request.provider,
                    message=f"{request.provider.title()} key is valid, but the model request failed: {message}",
                )
            except Exception:
                pass
        return AIConnectionTestResponse(
            status="invalid",
            provider=request.provider,
            message=message,
        )


@router.get("/project/files", response_model=list[ProjectFile])
def project_files() -> list[ProjectFile]:
    return notebook_repository.list_project_files()
