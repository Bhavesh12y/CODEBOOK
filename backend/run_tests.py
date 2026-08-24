from __future__ import annotations

import os
import subprocess
import sys
import uuid
from pathlib import Path


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    if sys.platform == "win32":
        venv_python = repo_root / ".venv" / "Scripts" / "python.exe"
    else:
        venv_python = repo_root / ".venv" / "bin" / "python"
    python = venv_python if venv_python.exists() else Path(sys.executable)
    temp_root = repo_root / ".tmp"
    temp_root.mkdir(exist_ok=True)
    run_temp = temp_root / f"pytest-{uuid.uuid4().hex}"
    env = os.environ.copy()
    env["TMP"] = str(temp_root)
    env["TEMP"] = str(temp_root)
    return subprocess.call(
        [
            str(python),
            "-m",
            "pytest",
            "-p",
            "no:cacheprovider",
            "--basetemp",
            str(run_temp),
            "backend/tests",
        ],
        cwd=str(repo_root),
        env=env,
    )


if __name__ == "__main__":
    raise SystemExit(main())
