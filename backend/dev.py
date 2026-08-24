from __future__ import annotations

import os
import sys
from pathlib import Path


def main() -> None:
    backend_dir = Path(__file__).resolve().parent
    repo_root = backend_dir.parent
    if sys.platform == "win32":
        venv_python = repo_root / ".venv" / "Scripts" / "python.exe"
    else:
        venv_python = repo_root / ".venv" / "bin" / "python"
    if venv_python.exists() and Path(sys.executable).resolve() != venv_python.resolve():
        if sys.platform == "win32":
            import subprocess
            try:
                raise SystemExit(subprocess.call([str(venv_python), str(Path(__file__).resolve())]))
            except KeyboardInterrupt:
                raise SystemExit(0)
        else:
            os.execv(str(venv_python), [str(venv_python), str(Path(__file__).resolve())])

    import uvicorn

    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    port = int(os.getenv("BACKEND_PORT", "8000"))
    try:
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",
            port=port,
            reload=True,
            reload_dirs=[str(backend_dir / "app")],
        )
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
