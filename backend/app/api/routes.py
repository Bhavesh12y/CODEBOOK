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

import sys
from app.dependencies import kernel_router, kernel_manager, notebook_repository

from app.ai.service import (
    build_runtime_context,
    create_ai_service_for_provider,
    create_ai_service_from_request,
    probe_ai_provider_key,
)
from app.config import get_settings
from app.execution.process_utils import minimal_environment, terminate_process_tree
from app.execution.cpp_kernel import _parse_diagnostics as parse_cpp_diagnostics
from app.execution.cpp_source import build_execution_source as build_cpp_source
from app.execution.c_kernel import _parse_diagnostics as parse_c_diagnostics
from app.execution.c_source import build_execution_source as build_c_source
from app.execution.java_kernel import _parse_diagnostics as parse_java_diagnostics
from app.execution.java_source import build_execution_source as build_java_source
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


@router.get("/toolchain")
def get_toolchain(language: str = "cpp") -> object:
    return kernel_router.detect_toolchain(language)

@router.get("/toolchains")
def get_all_toolchains() -> object:
    return kernel_router.detect_all_toolchains()

@router.get("/compiler")
def compiler() -> object:
    return kernel_router.detect_toolchain("cpp")


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
    return kernel_router.execute(request)


@router.post("/execute/all", response_model=ExecuteAllResponse)
def execute_all(request: ExecuteAllRequest) -> ExecuteAllResponse:
    return kernel_router.execute_all(request)


@router.websocket("/execute/interactive")
async def execute_interactive(websocket: WebSocket) -> None:
    await websocket.accept()
    process: subprocess.Popen[bytes] | None = None
    receiver_task: asyncio.Task | None = None
    started = time.perf_counter()

    try:
        initial = await websocket.receive_json()
        language = str(initial.get("language") or "cpp")
        request = ExecuteRequest(
            notebookId=str(initial.get("notebookId") or "unsaved"),
            cellId=str(initial.get("cellId") or ""),
            code=str(initial.get("code") or ""),
            language=language,
            cells=[ExecutionCell(**cell) for cell in initial.get("cells", [])],
        )
        cells = list(request.cells) or [ExecutionCell(id=request.cellId, type="code", source=request.code)]

        with tempfile.TemporaryDirectory(prefix="codebook-live-", ignore_cleanup_errors=True) as temp_root:
            temp_dir = Path(temp_root)
            spawn_args: list[str] = []

            if language == "cpp":
                toolchain = kernel_router.detect_toolchain("cpp")
                if not toolchain.available or not toolchain.path:
                    await websocket.send_json({"type": "error", "text": toolchain.error or "C++ compiler is not available."})
                    await websocket.send_json({"type": "exit", "code": None, "elapsed": round(time.perf_counter() - started, 4)})
                    return

                await websocket.send_json({"type": "status", "status": "compiling"})
                generated = build_cpp_source(cells, request.cellId)
                source_path = temp_dir / "main.cpp"
                binary_path = temp_dir / ("notebook.exe" if os.name == "nt" else "notebook")
                source_path.write_text(generated.source, encoding="utf-8")
                compile_cmd = [
                    toolchain.path,
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
                    diagnostics = parse_cpp_diagnostics(compile_result.stderr, generated)
                    await websocket.send_json({
                        "type": "stderr",
                        "text": compile_result.stderr,
                        "diagnostics": [item.model_dump() if hasattr(item, "model_dump") else item.dict() for item in diagnostics],
                    })
                    await websocket.send_json({"type": "exit", "code": compile_result.returncode, "elapsed": round(time.perf_counter() - started, 4)})
                    return
                spawn_args = [str(binary_path)]

            elif language == "c":
                toolchain = kernel_router.detect_toolchain("c")
                if not toolchain.available or not toolchain.path:
                    await websocket.send_json({"type": "error", "text": toolchain.error or "C compiler is not available."})
                    await websocket.send_json({"type": "exit", "code": None, "elapsed": round(time.perf_counter() - started, 4)})
                    return

                await websocket.send_json({"type": "status", "status": "compiling"})
                generated = build_c_source(cells, request.cellId)
                source_path = temp_dir / "main.c"
                binary_path = temp_dir / ("notebook.exe" if os.name == "nt" else "notebook")
                source_path.write_text(generated.source, encoding="utf-8")
                compile_cmd = [
                    toolchain.path,
                    f"-std={get_settings().c_standard}",
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
                    diagnostics = parse_c_diagnostics(compile_result.stderr, generated)
                    await websocket.send_json({
                        "type": "stderr",
                        "text": compile_result.stderr,
                        "diagnostics": [item.model_dump() if hasattr(item, "model_dump") else item.dict() for item in diagnostics],
                    })
                    await websocket.send_json({"type": "exit", "code": compile_result.returncode, "elapsed": round(time.perf_counter() - started, 4)})
                    return
                spawn_args = [str(binary_path)]

            elif language == "java":
                toolchain = kernel_router.detect_toolchain("java")
                if not toolchain.available or not toolchain.path:
                    await websocket.send_json({"type": "error", "text": toolchain.error or "Java toolchain is not available."})
                    await websocket.send_json({"type": "exit", "code": None, "elapsed": round(time.perf_counter() - started, 4)})
                    return

                await websocket.send_json({"type": "status", "status": "compiling"})
                generated = build_java_source(cells, request.cellId)
                source_path = temp_dir / "Main.java"
                source_path.write_text(generated.source, encoding="utf-8")
                compile_cmd = [toolchain.path, "-encoding", "UTF-8", "Main.java"]
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
                    diagnostics = parse_java_diagnostics(compile_result.stderr, generated)
                    await websocket.send_json({
                        "type": "stderr",
                        "text": compile_result.stderr,
                        "diagnostics": [item.model_dump() if hasattr(item, "model_dump") else item.dict() for item in diagnostics],
                    })
                    await websocket.send_json({"type": "exit", "code": compile_result.returncode, "elapsed": round(time.perf_counter() - started, 4)})
                    return
                spawn_args = ["java", "-Dfile.encoding=UTF-8", "-cp", ".", "Main"]

            elif language == "python":
                toolchain = kernel_router.detect_toolchain("python")
                if not toolchain.available:
                    await websocket.send_json({"type": "error", "text": toolchain.error or "Python interpreter is not available."})
                    await websocket.send_json({"type": "exit", "code": None, "elapsed": round(time.perf_counter() - started, 4)})
                    return

                code_cells = [c for c in cells if c.type == "code"]
                target_index = next((i for i, c in enumerate(code_cells) if c.id == request.cellId), len(code_cells) - 1)
                prior_cells = [c for i, c in enumerate(code_cells) if i < target_index and c.committed and c.source.strip()]
                target_cell = next((c for c in code_cells if c.id == request.cellId), None)
                target_code = target_cell.source if target_cell else request.code

                script_lines: list[str] = [
                    "import sys, os",
                ]
                if prior_cells:
                    script_lines.extend([
                        "_cb_null = open(os.devnull, 'w', encoding='utf-8')",
                        "_cb_out = sys.stdout",
                        "_cb_err = sys.stderr",
                        "sys.stdout = _cb_null",
                        "sys.stderr = _cb_null",
                    ])
                    for c in prior_cells:
                        script_lines.append(f"# ===== Prior Cell {c.id} =====")
                        script_lines.append(c.source)
                    script_lines.extend([
                        "_cb_null.flush()",
                        "sys.stdout = _cb_out",
                        "sys.stderr = _cb_err",
                        "_cb_null.close()",
                    ])

                script_lines.append(f"# ===== Target Interactive Cell {request.cellId} =====")
                script_lines.append(target_code)

                source_path = temp_dir / "main.py"
                source_path.write_text("\n".join(script_lines), encoding="utf-8")
                py_bin = (toolchain.path if (toolchain and toolchain.available and toolchain.path and "WindowsApps" not in toolchain.path) else None) or sys.executable
                spawn_args = [py_bin, "-u", str(source_path)]

            else:
                await websocket.send_json({"type": "error", "text": f"Unsupported language: {language}"})
                await websocket.send_json({"type": "exit", "code": None, "elapsed": round(time.perf_counter() - started, 4)})
                return

            await websocket.send_json({"type": "status", "status": "running"})

            _STREAM_DONE = object()
            output_queue: queue.Queue[dict | object] = queue.Queue()

            process = subprocess.Popen(
                spawn_args,
                cwd=str(temp_dir),
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=0,
                env=minimal_environment(temp_dir),
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
                        if process.poll() is not None:
                            return
                        continue
                    except (WebSocketDisconnect, RuntimeError, asyncio.CancelledError):
                        return
                    if message.get("type") == "stdin" and process.stdin:
                        try:
                            text = str(message.get("text", ""))
                            process.stdin.write((text + "\n").encode("utf-8", errors="replace"))
                            process.stdin.flush()
                        except OSError:
                            pass
                    elif message.get("type") == "interrupt":
                        terminate_process_tree(process)
                        return

            receiver_task = asyncio.create_task(_receive_input())

            streams_done = 0
            while streams_done < 2:
                try:
                    item = output_queue.get_nowait()
                except queue.Empty:
                    try:
                        await asyncio.sleep(0.015)
                    except asyncio.CancelledError:
                        break
                    continue
                if item is _STREAM_DONE:
                    streams_done += 1
                elif isinstance(item, dict) and item.get("type") in {"stdout", "stderr"}:
                    try:
                        await websocket.send_json(item)
                    except (WebSocketDisconnect, RuntimeError):
                        break

            if process.poll() is None:
                try:
                    await asyncio.to_thread(process.wait, 2)
                except (asyncio.CancelledError, Exception):
                    pass

            if receiver_task and not receiver_task.done():
                receiver_task.cancel()
            try:
                await websocket.send_json({"type": "exit", "code": process.returncode, "elapsed": round(time.perf_counter() - started, 4)})
            except (WebSocketDisconnect, RuntimeError):
                pass
    except (asyncio.CancelledError, WebSocketDisconnect):
        if process and process.poll() is None:
            terminate_process_tree(process)
    except Exception as exc:
        if process and process.poll() is None:
            terminate_process_tree(process)
        try:
            await websocket.send_json({"type": "error", "text": str(exc)})
            await websocket.send_json({"type": "exit", "code": None, "elapsed": round(time.perf_counter() - started, 4)})
        except (WebSocketDisconnect, RuntimeError):
            pass
    finally:
        if receiver_task and not receiver_task.done():
            receiver_task.cancel()
        if process and process.poll() is None:
            terminate_process_tree(process)


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
    allowed_exts = (".cpp", ".cc", ".cxx", ".hpp", ".h", ".c", ".py", ".java", ".cppnb", ".cbnb")
    if not file.filename or not file.filename.lower().endswith(allowed_exts):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload a supported source or notebook file.")
    content = (await file.read()).decode("utf-8", errors="replace")
    if file.filename.lower().endswith((".cppnb", ".cbnb")):
        try:
            import json
            notebook = NotebookDocument(**json.loads(content))
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Malformed notebook file.") from exc
        return notebook_repository.save(notebook)
    return notebook_repository.import_source(file.filename, content)


@router.get("/notebooks/{notebook_id}/export")
def export_notebook(notebook_id: str) -> Response:
    try:
        notebook = notebook_repository.load(notebook_id)
        from app.models.execution import ExecutionCell
        cells = [ExecutionCell(id=cell.id, type=cell.type, source=cell.source) for cell in notebook.cells]
        
        language = (notebook.metadata.language or "cpp").lower()
        if language == "c":
            from app.notebook.exporter import export_notebook_c
            source = export_notebook_c(cells)
            ext, media = "c", "text/x-csrc"
        elif language == "python":
            from app.notebook.exporter import export_notebook_python
            source = export_notebook_python(cells)
            ext, media = "py", "text/x-python"
        elif language == "java":
            from app.notebook.exporter import export_notebook_java
            source = export_notebook_java(cells)
            ext, media = "java", "text/x-java-source"
        else:
            source = notebook_repository.export_cpp(notebook_id)
            ext, media = "cpp", "text/x-c++src"
            
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notebook not found") from exc
    
    filename = f"{notebook_id}.{ext}"
    return Response(
        content=source,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/notebooks/{notebook_id}/export/cbnb")
def export_cbnb(notebook_id: str) -> Response:
    try:
        from app.notebook.repository import _dump_model
        from app.notebook.exporter import export_notebook_cbnb
        notebook = notebook_repository.load(notebook_id)
        payload = export_notebook_cbnb(_dump_model(notebook))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notebook not found") from exc
    filename = f"{notebook_id}.cbnb"
    return Response(
        content=payload,
        media_type="application/json",
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


def _ai_runtime_context(language: str = "cpp") -> str:
    info = kernel_router.detect_toolchain(language)
    return build_runtime_context(
        language=language,
        toolchain_name=info.name or info.compiler,
        toolchain_version=info.version,
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
    runtime_context = _ai_runtime_context(request.language)
    service = create_ai_service_from_request(
        language=request.language,
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
        runtime_context = _ai_runtime_context(request.language)
        service = create_ai_service_from_request(
            language=request.language,
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
            language="cpp",
            runtime_context=_ai_runtime_context("cpp"),
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
