"""Unified toolchain detection for all supported languages."""
from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

from app.config import Settings, get_settings
from app.execution.compiler import CompilerDetector
from app.models.execution import ToolchainInfo


class ToolchainDetector:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._cpp_detector = CompilerDetector(self.settings)

    def detect(self, language: str) -> ToolchainInfo:
        if language == "cpp":
            return self._detect_cpp()
        if language == "c":
            return self._detect_c()
        if language == "java":
            return self._detect_java()
        if language == "python":
            return self._detect_python()
        return ToolchainInfo(language=language, available=False, error=f"Unsupported language: {language}")

    def detect_all(self) -> dict[str, ToolchainInfo]:
        return {lang: self.detect(lang) for lang in ("c", "cpp", "java", "python")}

    def _detect_cpp(self) -> ToolchainInfo:
        info = self._cpp_detector.detect()
        return ToolchainInfo(
            language="cpp",
            available=info.available,
            name=info.compiler,
            path=info.path,
            version=info.version,
            error=info.error,
        )

    def _detect_c(self) -> ToolchainInfo:
        candidates: list[str] = []
        if self.settings.c_compiler:
            candidates.append(self.settings.c_compiler)
        candidates.extend(["gcc", "clang", "cc"])
        return self._probe_compiler("c", candidates, "No C compiler found. Install GCC or set C_COMPILER.")

    def _detect_java(self) -> ToolchainInfo:
        java_home = self.settings.java_home or os.environ.get("JAVA_HOME")
        javac_candidates: list[str] = []
        if java_home:
            javac_candidates.append(str(Path(java_home) / "bin" / "javac"))
        javac_candidates.append("javac")

        for candidate in javac_candidates:
            path = shutil.which(candidate) if not any(sep in candidate for sep in ["/", "\\"]) else candidate
            if not path:
                continue
            try:
                result = subprocess.run([path, "-version"], text=True, capture_output=True, timeout=4, check=False)
            except (OSError, subprocess.SubprocessError):
                continue
            version_text = (result.stdout or result.stderr).strip().splitlines()
            java_path = shutil.which("java")
            if not java_path and java_home:
                java_check = str(Path(java_home) / "bin" / "java")
                if shutil.which(java_check) or Path(java_check).exists():
                    java_path = java_check
            if not java_path:
                return ToolchainInfo(language="java", available=False, error="javac found but java runtime not on PATH.")
            return ToolchainInfo(
                language="java",
                available=True,
                name="JDK",
                path=path,
                version=version_text[0] if version_text else None,
            )
        return ToolchainInfo(language="java", available=False, error="No Java compiler found. Install JDK 17+ or set JAVA_HOME.")

    def _detect_python(self) -> ToolchainInfo:
        import sys
        candidates: list[str] = []
        if self.settings.python_path:
            candidates.append(self.settings.python_path)
        if sys.executable:
            candidates.append(sys.executable)
        candidates.extend(["python3", "python", "py"])
        for candidate in candidates:
            path = shutil.which(candidate) if not any(sep in candidate for sep in ["/", "\\"]) else candidate
            if not path or "WindowsApps" in path:
                continue
            try:
                result = subprocess.run([path, "--version"], text=True, capture_output=True, timeout=4, check=False)
            except (OSError, subprocess.SubprocessError):
                continue
            if result.returncode != 0:
                continue
            version_text = (result.stdout or result.stderr).strip()
            return ToolchainInfo(
                language="python",
                available=True,
                name="Python",
                path=path,
                version=version_text or None,
            )
        return ToolchainInfo(language="python", available=False, error="No Python interpreter found. Install Python 3.10+.")

    def _probe_compiler(self, language: str, candidates: list[str], fallback_error: str) -> ToolchainInfo:
        seen: set[str] = set()
        for candidate in candidates:
            if candidate in seen:
                continue
            seen.add(candidate)
            path = shutil.which(candidate) if not any(sep in candidate for sep in ["/", "\\"]) else candidate
            if not path:
                continue
            try:
                result = subprocess.run([path, "--version"], text=True, capture_output=True, timeout=4, check=False)
            except (OSError, subprocess.SubprocessError) as exc:
                return ToolchainInfo(language=language, available=False, name=candidate, path=path, error=f"Unable to run compiler: {exc}")
            version_text = (result.stdout or result.stderr).strip().splitlines()
            name = "GCC" if "gcc" in path.lower() else "Clang" if "clang" in path.lower() else candidate
            return ToolchainInfo(
                language=language,
                available=result.returncode == 0,
                name=name,
                path=path,
                version=version_text[0] if version_text else None,
                error=None if result.returncode == 0 else result.stderr.strip(),
            )
        return ToolchainInfo(language=language, available=False, error=fallback_error)
