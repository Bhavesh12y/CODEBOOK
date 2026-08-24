from __future__ import annotations

import subprocess
import threading
import json
import sys
import time
from pathlib import Path
from app.execution.process_utils import terminate_process_tree
from app.models.execution import (
    ExecuteRequest, ExecutionResult, ExecutionDiagnostic,
    ExecuteAllRequest, ExecuteAllResponse, ExecuteAllCellResult, ExecutionCell
)
from app.config import Settings

import os
import shutil
import tempfile

WORKER_CODE = '''import sys
import json
import io
import traceback
import contextlib

globals_dict = {"__name__": "__main__", "__doc__": None}

def main():
    global globals_dict
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError:
            continue
            
        action = req.get("action")
        if action == "ping":
            print(json.dumps({"status": "pong"}))
            sys.stdout.flush()
            continue
        elif action == "reset":
            globals_dict = {"__name__": "__main__", "__doc__": None}
            print(json.dumps({"status": "success"}))
            sys.stdout.flush()
            continue
            
        cell_id = req.get("cellId", "unknown")
        code = req.get("code", "")
        stdin_data = req.get("stdin", "")
        
        stdout_buf = io.StringIO()
        stderr_buf = io.StringIO()
        stdin_buf = io.StringIO(stdin_data)
        
        status = "success"
        exit_code = 0
        diagnostics = []
        message = None
        
        try:
            with contextlib.redirect_stdout(stdout_buf), contextlib.redirect_stderr(stderr_buf):
                old_stdin = sys.stdin
                sys.stdin = stdin_buf
                try:
                    code_obj = compile(code, f"<cell-{cell_id}>", "exec")
                    exec(code_obj, globals_dict)
                finally:
                    sys.stdin = old_stdin
        except Exception as e:
            status = "error"
            exit_code = 1
            
            tb = traceback.extract_tb(e.__traceback__)
            line_number = None
            for frame in tb:
                if frame.filename == f"<cell-{cell_id}>":
                    line_number = frame.lineno
                    
            if line_number is None:
                line_number = getattr(e, 'lineno', 1) or 1
                
            msg = f"{type(e).__name__}: {str(e)}"
            diagnostics.append({
                "cellId": cell_id,
                "line": line_number,
                "message": msg,
                "severity": "error"
            })
            
            filtered_tb = []
            for frame in tb:
                if frame.filename.startswith("<cell-"):
                    filtered_tb.append(frame)
            
            if hasattr(traceback, "StackSummary"):
                summary = traceback.StackSummary.from_list(filtered_tb)
                tb_lines = summary.format()
                tb_str = "".join(tb_lines)
            else:
                tb_str = ""
            
            error_msg = f"Traceback (most recent call last):\\n{tb_str}{type(e).__name__}: {str(e)}\\n"
            stderr_buf.write(error_msg)
            
        resp = {
            "status": status,
            "stdout": stdout_buf.getvalue(),
            "stderr": stderr_buf.getvalue(),
            "exitCode": exit_code,
            "diagnostics": diagnostics,
            "message": message
        }
        
        print(json.dumps(resp))
        sys.stdout.flush()

if __name__ == "__main__":
    main()
'''


class PythonKernelManager:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._workers: dict[str, subprocess.Popen] = {}
        self._lock = threading.Lock()
        
    def start(self) -> dict[str, str]:
        return {"status": "ready", "mode": "persistent-process"}
        
    def _resolve_python_exe(self) -> str:
        if self.settings.python_path:
            p = shutil.which(self.settings.python_path) or self.settings.python_path
            if Path(p).exists():
                return str(p)
        from app.execution.toolchain import ToolchainDetector
        toolchain = ToolchainDetector(self.settings).detect("python")
        if toolchain.available and toolchain.path:
            return toolchain.path
        if not getattr(sys, "frozen", False) and sys.executable:
            return sys.executable
        for cmd in ["python3", "python", "py"]:
            p = shutil.which(cmd)
            if p and "WindowsApps" not in p:
                return p
        return "python"

    def _resolve_worker_path(self) -> str:
        if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
            p = Path(sys._MEIPASS) / "app" / "execution" / "python_worker.py"
            if p.exists():
                return str(p)
        p = Path(__file__).resolve().parent / "python_worker.py"
        if p.exists():
            return str(p)
        if getattr(sys, "frozen", False):
            exe_dir = Path(sys.executable).resolve().parent
            candidates = [
                exe_dir.parent / "backend-source" / "app" / "execution" / "python_worker.py",
                exe_dir.parent / "resources" / "backend-source" / "app" / "execution" / "python_worker.py",
                exe_dir / "backend-source" / "app" / "execution" / "python_worker.py",
            ]
            for c in candidates:
                if c.exists():
                    return str(c)
        temp_worker = Path(tempfile.gettempdir()) / "codebook_python_worker.py"
        if not temp_worker.exists():
            try:
                temp_worker.write_text(WORKER_CODE, encoding="utf-8")
            except Exception:
                pass
        return str(temp_worker)

    def _get_or_create_worker(self, notebook_id: str) -> subprocess.Popen:
        with self._lock:
            if notebook_id in self._workers:
                worker = self._workers[notebook_id]
                if worker.poll() is None:
                    return worker
                else:
                    self._kill_worker(notebook_id, lock_acquired=True)
            
            py_exe = self._resolve_python_exe()
            worker_path = self._resolve_worker_path()
            worker = subprocess.Popen(
                [py_exe, str(worker_path)],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1  # line buffered
            )
            self._workers[notebook_id] = worker
            return worker
            
    def _kill_worker(self, notebook_id: str, lock_acquired=False):
        def _do_kill():
            if notebook_id in self._workers:
                worker = self._workers[notebook_id]
                terminate_process_tree(worker)
                del self._workers[notebook_id]
                
        if lock_acquired:
            _do_kill()
        else:
            with self._lock:
                _do_kill()

    def execute(self, request: ExecuteRequest) -> ExecutionResult:
        start = time.perf_counter()
        target_cell = next((c for c in request.cells if c.id == request.cellId), None)
        if target_cell and target_cell.type == "markdown":
            return ExecutionResult(
                status="success",
                stdout="",
                stderr="",
                executionTime=0.0,
                diagnostics=[],
            )

        notebook_id = request.notebookId
        worker = self._get_or_create_worker(notebook_id)
        
        req_data = {
            "cellId": request.cellId,
            "code": request.code,
            "stdin": request.stdin or ""
        }
        
        try:
            if worker.stdin is None or worker.stdout is None:
                raise Exception("Worker missing stdin/stdout")
            worker.stdin.write(json.dumps(req_data) + "\n")
            worker.stdin.flush()
            
            line = worker.stdout.readline()
            if not line:
                raise Exception("Worker closed connection")
                
            resp = json.loads(line)
            diagnostics = [ExecutionDiagnostic(**d) for d in resp.get("diagnostics", [])]
            
            return ExecutionResult(
                status=resp.get("status", "error"),
                stdout=resp.get("stdout", ""),
                stderr=resp.get("stderr", ""),
                exitCode=resp.get("exitCode", 1),
                executionTime=time.perf_counter() - start,
                diagnostics=diagnostics,
                message=resp.get("message")
            )
            
        except Exception as e:
            self._kill_worker(notebook_id)
            return ExecutionResult(
                status="error",
                stdout="",
                stderr=str(e),
                exitCode=1,
                executionTime=time.perf_counter() - start,
                diagnostics=[ExecutionDiagnostic(line=1, message=str(e), severity="error")],
                message="Kernel crashed or connection failed"
            )

    def restart(self) -> dict[str, str]:
        with self._lock:
            for nb_id in list(self._workers.keys()):
                self._kill_worker(nb_id, lock_acquired=True)
        return {"status": "ready", "mode": "persistent-process", "message": "Kernel state cleared."}
                
    def restart_notebook(self, notebook_id: str):
        with self._lock:
            if notebook_id in self._workers:
                worker = self._workers[notebook_id]
                try:
                    if worker.stdin and worker.stdout:
                        worker.stdin.write(json.dumps({"action": "reset"}) + "\n")
                        worker.stdin.flush()
                        line = worker.stdout.readline()
                except Exception:
                    self._kill_worker(notebook_id, lock_acquired=True)
            
    def interrupt(self) -> dict[str, str]:
        self.restart()
        return {"status": "idle"}
            
    def stop(self) -> dict[str, str]:
        self.restart()
        return {"status": "stopped"}
        
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
            req = ExecuteRequest(
                notebookId=request.notebookId,
                cellId=cell.id,
                code=cell.source,
                language=request.language,
                stdin=request.stdin,
                cells=cells,
            )
            res = self.execute(req)
            results.append(ExecuteAllCellResult(cellId=cell.id, result=res))
            if res.status != "success":
                final_status = res.status
                if not request.continueOnError:
                    break
                
        return ExecuteAllResponse(
            status=final_status,
            results=results,
            executionTime=time.perf_counter() - started
        )
