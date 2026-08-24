"""Language-aware kernel dispatcher.

Delegates execution to per-language kernel managers via composition.
The existing CppKernelManager is used unchanged for C++ execution.
"""
from __future__ import annotations

from app.config import Settings, get_settings
from app.execution.cpp_kernel import CppKernelManager
from app.execution.toolchain import ToolchainDetector
from app.models.execution import (
    ExecuteAllRequest,
    ExecuteAllResponse,
    ExecuteRequest,
    ExecutionResult,
    ToolchainInfo,
)
from app.execution.c_kernel import CKernelManager
from app.execution.python_kernel import PythonKernelManager
from app.execution.java_kernel import JavaKernelManager


class KernelRouter:
    """Thin dispatcher routing execution requests to the appropriate language kernel."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.toolchain_detector = ToolchainDetector(self.settings)
        self._cpp = CppKernelManager(self.settings)
        self._c = CKernelManager(self.settings)
        self._python = PythonKernelManager(self.settings)
        self._java = JavaKernelManager(self.settings)

    def start(self, language: str = "cpp") -> dict[str, str]:
        engine = self._engine(language)
        if engine is None:
            return {"status": "error", "message": f"Unsupported language: {language}"}
        return engine.start()

    def restart(self, language: str = "cpp", notebook_id: str | None = None) -> dict[str, str]:
        engine = self._engine(language)
        if engine is None:
            return {"status": "error", "message": f"Unsupported language: {language}"}
        if notebook_id and hasattr(engine, "restart_notebook"):
            engine.restart_notebook(notebook_id)
            return {"status": "ready", "mode": "compile-replay", "message": f"Kernel state cleared for notebook {notebook_id}."}
        return engine.restart()

    def stop(self, language: str = "cpp") -> dict[str, str]:
        engine = self._engine(language)
        if engine is None:
            return {"status": "error", "message": f"Unsupported language: {language}"}
        return engine.stop()

    def interrupt(self, language: str = "cpp") -> dict[str, str]:
        engine = self._engine(language)
        if engine is None:
            return {"status": "idle"}
        return engine.interrupt()

    def execute(self, request: ExecuteRequest) -> ExecutionResult:
        language = request.language
        engine = self._engine(language)
        if engine is None:
            return ExecutionResult(
                status="error",
                stderr=f"Language '{language}' is not yet supported.",
                message=f"Unsupported language: {language}",
            )
        return engine.execute(request)

    def execute_all(self, request: ExecuteAllRequest) -> ExecuteAllResponse:
        language = request.language
        engine = self._engine(language)
        if engine is None:
            return ExecuteAllResponse(
                status="error",
                results=[],
                executionTime=0.0,
            )
        return engine.execute_all(request)

    def detect_toolchain(self, language: str) -> ToolchainInfo:
        return self.toolchain_detector.detect(language)

    def detect_all_toolchains(self) -> dict[str, ToolchainInfo]:
        return self.toolchain_detector.detect_all()

    def _engine(self, language: str):
        engines = {
            "cpp": self._cpp,
            "c": self._c,
            "python": self._python,
            "java": self._java,
        }
        return engines.get(language)
