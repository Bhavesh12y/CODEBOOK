from __future__ import annotations

import os
import re
import shutil
import signal
import subprocess
import tempfile
import threading
import time
from dataclasses import dataclass
from pathlib import Path

from app.config import Settings, get_settings
from app.execution.toolchain import ToolchainDetector
from app.execution.java_source import JavaGeneratedSource, build_execution_source
from app.models.execution import (
    ExecuteAllCellResult,
    ExecuteAllRequest,
    ExecuteAllResponse,
    ExecuteRequest,
    ExecutionCell,
    ExecutionDiagnostic,
    ExecutionResult,
)


@dataclass
class ProcessOutcome:
    stdout: str
    stderr: str
    exit_code: int | None
    timed_out: bool = False
    interrupted: bool = False


class JavaKernelManager:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.toolchain_detector = ToolchainDetector(self.settings)
        self._lock = threading.Lock()
        self._current_process: subprocess.Popen[str] | None = None
        self._interrupted = False

    def start(self) -> dict[str, str]:
        return {"status": "ready", "mode": "compile-replay"}

    def restart(self) -> dict[str, str]:
        self.interrupt()
        return {"status": "ready", "mode": "compile-replay", "message": "Kernel state cleared."}

    def stop(self) -> dict[str, str]:
        self.interrupt()
        return {"status": "stopped"}

    def interrupt(self) -> dict[str, str]:
        with self._lock:
            process = self._current_process
            if process and process.poll() is None:
                self._interrupted = True
                _terminate_process_tree(process)
                return {"status": "stopping"}
        return {"status": "idle"}

    def execute(self, request: ExecuteRequest) -> ExecutionResult:
        start = time.perf_counter()
        cells = _normalize_cells(request)
        target = next((cell for cell in cells if cell.id == request.cellId), None)
        if target and _source_reads_stdin(target.source) and not request.stdin.strip():
            return ExecutionResult(
                status="error",
                stderr="Interactive input required. Run this cell in the interactive console and send stdin while the program is running.",
                exitCode=None,
                executionTime=_elapsed(start),
                message="Interactive input required",
            )
        
        toolchain = self.toolchain_detector.detect("java")
        if not toolchain.available or not toolchain.path:
            return ExecutionResult(
                status="error",
                stderr=toolchain.error or "Java toolchain is not available.",
                exitCode=None,
                executionTime=_elapsed(start),
                message="Java unavailable",
            )

        javac_path = toolchain.path
        # Derive java path
        java_path = str(Path(javac_path).parent / ("java.exe" if os.name == "nt" else "java"))
        if not Path(java_path).exists():
             java_path = shutil.which("java") or "java"

        generated = build_execution_source(cells, request.cellId)
        
        with tempfile.TemporaryDirectory(prefix="codebook-java-") as temp_root:
            temp_dir = Path(temp_root)
            source_path = temp_dir / "Main.java"
            source_path.write_text(generated.source, encoding="utf-8")

            compile_cmd = [
                javac_path,
                "-encoding", "UTF-8",
                "Main.java"
            ]
            
            compile_outcome = self._run_process(
                compile_cmd,
                cwd=temp_dir,
                timeout=max(4.0, min(self.settings.execution_timeout, 20.0)),
            )
            if compile_outcome.timed_out or compile_outcome.interrupted:
                return ExecutionResult(
                    status="stopped",
                    stdout=compile_outcome.stdout,
                    stderr=compile_outcome.stderr or "Compilation was stopped.",
                    exitCode=compile_outcome.exit_code,
                    executionTime=_elapsed(start),
                    message="Compilation stopped",
                )
            if compile_outcome.exit_code != 0:
                diagnostics = _parse_diagnostics(compile_outcome.stderr, generated)
                return ExecutionResult(
                    status="error",
                    stdout=compile_outcome.stdout,
                    stderr=_friendly_stderr(compile_outcome.stderr, generated, "Compilation Error"),
                    exitCode=compile_outcome.exit_code,
                    executionTime=_elapsed(start),
                    diagnostics=diagnostics,
                    message="Compilation Error",
                )

            run_cmd = [
                java_path,
                "-Dfile.encoding=UTF-8",
                "-cp", ".",
                "Main"
            ]
            run_outcome = self._run_process(
                run_cmd,
                cwd=temp_dir,
                timeout=self.settings.execution_timeout,
                stdin=request.stdin,
            )
            if run_outcome.timed_out or run_outcome.interrupted:
                return ExecutionResult(
                    status="stopped",
                    stdout=run_outcome.stdout,
                    stderr=run_outcome.stderr or "Execution stopped before completion.",
                    exitCode=run_outcome.exit_code,
                    executionTime=_elapsed(start),
                    message="Execution stopped",
                )

            status = "success" if run_outcome.exit_code == 0 else "error"
            message = None if status == "success" else f"Runtime Error (exit code {run_outcome.exit_code})"
            return ExecutionResult(
                status=status,
                stdout=run_outcome.stdout,
                stderr=run_outcome.stderr,
                exitCode=run_outcome.exit_code,
                executionTime=_elapsed(start),
                message=message,
            )

    def execute_all(self, request: ExecuteAllRequest) -> ExecuteAllResponse:
        started = time.perf_counter()
        results: list[ExecuteAllCellResult] = []
        cells = [
            ExecutionCell(id=cell.id, type=cell.type, source=cell.source, committed=cell.committed)
            for cell in request.cells
        ]
        code_cells = [cell for cell in cells if cell.type == "code"]
        final_status = "success"
        for cell in code_cells:
            result = self.execute(
                ExecuteRequest(
                    notebookId=request.notebookId,
                    cellId=cell.id,
                    code=cell.source,
                    cells=cells,
                    stdin=request.stdin,
                )
            )
            results.append(ExecuteAllCellResult(cellId=cell.id, result=result))
            for index, item in enumerate(cells):
                if item.id == cell.id:
                    cells[index] = ExecutionCell(
                        id=item.id,
                        type=item.type,
                        source=item.source,
                        committed=result.status == "success",
                    )
                    break
            if result.status != "success":
                final_status = result.status
                if not request.continueOnError:
                    break
        return ExecuteAllResponse(status=final_status, results=results, executionTime=_elapsed(started))

    def _run_process(self, cmd: list[str], cwd: Path, timeout: float, stdin: str = "") -> ProcessOutcome:
        env = _minimal_environment(cwd)
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0
        preexec_fn = None if os.name == "nt" else os.setsid

        with self._lock:
            self._interrupted = False

        try:
            process = subprocess.Popen(
                cmd,
                cwd=str(cwd),
                stdin=subprocess.PIPE if stdin else subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding="utf-8",
                errors="replace",
                env=env,
                creationflags=creationflags,
                preexec_fn=preexec_fn,
            )
        except OSError as exc:
            return ProcessOutcome("", str(exc), None)

        with self._lock:
            self._interrupted = False
            self._current_process = process

        try:
            stdout, stderr = process.communicate(stdin if stdin else None, timeout=timeout)
            with self._lock:
                interrupted = self._interrupted
            return ProcessOutcome(stdout, stderr, process.returncode, interrupted=interrupted)
        except subprocess.TimeoutExpired:
            _terminate_process_tree(process)
            stdout, stderr = process.communicate()
            return ProcessOutcome(stdout, stderr, process.returncode, timed_out=True)
        finally:
            with self._lock:
                if self._current_process is process:
                    self._current_process = None
                self._interrupted = False


def _normalize_cells(request: ExecuteRequest) -> list[ExecutionCell]:
    cells = list(request.cells)
    if not cells:
        return [ExecutionCell(id=request.cellId, type="code", source=request.code, committed=False)]

    found = False
    for index, cell in enumerate(cells):
        if cell.id == request.cellId:
            cells[index] = ExecutionCell(
                id=cell.id,
                type=cell.type,
                source=request.code or cell.source,
                committed=False,
            )
            found = True
            break
    if not found:
        cells.append(ExecutionCell(id=request.cellId, type="code", source=request.code, committed=False))
    return cells


STDIN_RE = re.compile(r"\bnew\s+Scanner\s*\(|\bSystem\.in\b|\bBufferedReader\b|\bConsole\b")

def _source_reads_stdin(source: str) -> bool:
    return STDIN_RE.search(source) is not None


def _minimal_environment(temp_dir: Path) -> dict[str, str]:
    keep = [
        "PATH", "SystemRoot", "WINDIR", "ComSpec", "PATHEXT",
        "JAVA_HOME",
        "HOME", "USER", "LOGNAME", "SHELL", "LANG",
    ]
    env = {key: value for key in keep if (value := os.environ.get(key))}
    env["TMP"] = str(temp_dir)
    env["TEMP"] = str(temp_dir)
    env["TMPDIR"] = str(temp_dir)
    return env


def _terminate_process_tree(process: subprocess.Popen[str]) -> None:
    if process.poll() is not None:
        return
    if os.name == "nt":
        taskkill = shutil.which("taskkill")
        if taskkill:
            try:
                subprocess.run(
                    [taskkill, "/F", "/T", "/PID", str(process.pid)],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    check=False,
                    timeout=2,
                )
            except subprocess.SubprocessError:
                pass
        if process.poll() is None:
            process.terminate()
        try:
            process.wait(timeout=1)
        except subprocess.TimeoutExpired:
            process.kill()
    else:
        try:
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        except ProcessLookupError:
            return
        try:
            process.wait(timeout=1)
        except subprocess.TimeoutExpired:
            os.killpg(os.getpgid(process.pid), signal.SIGKILL)


def _elapsed(start: float) -> float:
    return round(time.perf_counter() - start, 4)


DIAGNOSTIC_RE = re.compile(
    r"(?P<file>Main\.java):(?P<line>\d+):\s*(?P<severity>error|warning):\s*(?P<message>.*)"
)


def _parse_diagnostics(stderr: str, generated: JavaGeneratedSource) -> list[ExecutionDiagnostic]:
    diagnostics: list[ExecutionDiagnostic] = []
    for raw in stderr.splitlines():
        match = DIAGNOSTIC_RE.search(raw)
        if not match:
            continue
        line_num = int(match.group("line"))
        mapped = generated.line_map.get(line_num)
        
        cell_id = mapped[0] if mapped else "unknown"
        mapped_line = mapped[1] if mapped else line_num

        diagnostics.append(
            ExecutionDiagnostic(
                cellId=cell_id,
                line=mapped_line,
                column=None,
                severity=match.group("severity"),
                message=match.group("message"),
                raw=raw,
            )
        )
    return diagnostics


def _friendly_stderr(stderr: str, generated: JavaGeneratedSource, title: str) -> str:
    rewritten: list[str] = [title, ""]
    for raw in stderr.splitlines():
        match = DIAGNOSTIC_RE.search(raw)
        if not match:
            if raw.strip() and not raw.strip().startswith("^"):
                rewritten.append(raw)
            continue
        
        line_num = int(match.group("line"))
        mapped = generated.line_map.get(line_num)
        
        if mapped:
            cell_id, orig_line = mapped
            cell_number = generated.cell_order.get(cell_id)
            label = f"Cell {cell_number}" if cell_number else cell_id
            location = f"{label}, line {orig_line}"
        else:
            location = f"Main.java, line {line_num}"

        rewritten.append(f"{location}: {match.group('severity')}: {match.group('message')}")
    return "\n".join(rewritten).strip() + "\n"
