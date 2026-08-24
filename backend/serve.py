from __future__ import annotations

import os
import sys
from pathlib import Path

import uvicorn


def main() -> None:
    backend_dir = Path(__file__).resolve().parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    from app.main import app

    port = int(os.environ.get('BACKEND_PORT') or os.environ.get('CODEBOOK_BACKEND_PORT') or os.environ.get('CPPBOOK_BACKEND_PORT') or '8765')
    uvicorn.run(app, host="127.0.0.1", port=port, reload=False, log_level="info")


if __name__ == "__main__":
    main()
