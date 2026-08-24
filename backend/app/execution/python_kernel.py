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
    ExecuteAllRequest, ExecuteAllResponse, ExecuteAllCellResult
)
from app.config import Settings

class PythonKernelManager:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._workers: dict[str, subprocess.Popen] = {}
        self._lock = threading.Lock()
        
    def start(self) -> dict[str, str]:
        return {"status": "ready", "mode": "persistent-process"}
        
    def _get_or_create_worker(self, notebook_id: str) -> subprocess.Popen:
        with self._lock:
            if notebook_id in self._workers:
                worker = self._workers[notebook_id]
                if worker.poll() is None:
                    return worker
                else:
                    self._kill_worker(notebook_id, lock_acquired=True)
            
            worker_path = Path(__file__).parent / "python_worker.py"
            worker = subprocess.Popen(
                [sys.executable, str(worker_path)],
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
            
            # Simple readline logic (this will block)
            # Would need async/timeout wrapping for robust implementation
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
        results = []
        final_status = "success"
        
        for cell in request.cells:
            req = ExecuteRequest(
                notebookId=request.notebookId,
                cellId=cell.id,
                code=cell.source,
                language=request.language,
                stdin=request.stdin
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
