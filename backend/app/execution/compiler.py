from __future__ import annotations

import shutil
import subprocess
from functools import lru_cache

from app.config import Settings, get_settings
from app.models.execution import CompilerInfo


class CompilerDetector:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def detect(self) -> CompilerInfo:
        candidates: list[str] = []
        if self.settings.cpp_compiler:
            candidates.append(self.settings.cpp_compiler)
        candidates.extend(["g++", "clang++", "c++"])

        seen: set[str] = set()
        for candidate in candidates:
            if candidate in seen:
                continue
            seen.add(candidate)

            path = shutil.which(candidate) if not any(sep in candidate for sep in ["/", "\\"]) else candidate
            if not path:
                continue

            try:
                completed = subprocess.run(
                    [path, "--version"],
                    text=True,
                    capture_output=True,
                    timeout=4,
                    check=False,
                )
            except (OSError, subprocess.SubprocessError) as exc:
                return CompilerInfo(
                    available=False,
                    compiler=candidate,
                    path=path,
                    error=f"Unable to run compiler: {exc}",
                )

            version = (completed.stdout or completed.stderr).strip().splitlines()
            compiler_name = "GCC" if "g++" in path.lower() else "Clang" if "clang" in path.lower() else candidate
            return CompilerInfo(
                available=completed.returncode == 0,
                compiler=compiler_name,
                path=path,
                version=version[0] if version else None,
                error=None if completed.returncode == 0 else completed.stderr.strip(),
            )

        return CompilerInfo(
            available=False,
            error="No C++ compiler found. Install GCC/g++ or set CPP_COMPILER in the environment.",
        )


@lru_cache(maxsize=1)
def detect_compiler() -> CompilerInfo:
    return CompilerDetector().detect()

