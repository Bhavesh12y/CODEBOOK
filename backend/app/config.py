from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _bool_env(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


class Settings(BaseModel):
    backend_port: int = 8000
    frontend_port: int = 5173
    cpp_compiler: str | None = None
    execution_timeout: float = 8.0
    workspace_dir: Path = _repo_root()
    cpp_standard: str = "c++17"
    enable_variable_inspector: bool = False

    @property
    def notebooks_dir(self) -> Path:
        return self.workspace_dir / "notebooks"

    @property
    def examples_dir(self) -> Path:
        return self.workspace_dir / "examples"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    workspace = os.getenv("WORKSPACE_DIR")
    return Settings(
        backend_port=int(os.getenv("BACKEND_PORT", "8000")),
        frontend_port=int(os.getenv("FRONTEND_PORT", "5173")),
        cpp_compiler=os.getenv("CPP_COMPILER") or None,
        execution_timeout=float(os.getenv("EXECUTION_TIMEOUT", "8")),
        workspace_dir=Path(workspace).expanduser().resolve() if workspace else _repo_root(),
        cpp_standard=os.getenv("CPP_STANDARD", "c++17"),
        enable_variable_inspector=_bool_env("ENABLE_VARIABLE_INSPECTOR", False),
    )

