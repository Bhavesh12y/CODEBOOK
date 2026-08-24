"""Shared subprocess execution and process management utilities."""
from __future__ import annotations

import os
import shutil
import signal
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ProcessOutcome:
    stdout: str
    stderr: str
    exit_code: int | None
    timed_out: bool = False
    interrupted: bool = False


def minimal_environment(temp_dir: Path) -> dict[str, str]:
    keep = [
        "PATH", "SystemRoot", "WINDIR", "ComSpec", "PATHEXT",
        "LIBRARY_PATH", "CPATH", "JAVA_HOME", "PYTHONPATH",
        "HOME", "USER", "LOGNAME", "SHELL", "LANG",
        "DISPLAY", "XDG_RUNTIME_DIR",
    ]
    env = {key: value for key in keep if (value := os.environ.get(key))}
    env["TMP"] = str(temp_dir)
    env["TEMP"] = str(temp_dir)
    env["TMPDIR"] = str(temp_dir)
    return env


def terminate_process_tree(process: subprocess.Popen[str] | subprocess.Popen[bytes]) -> None:
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


def elapsed_time(start: float) -> float:
    return round(time.perf_counter() - start, 4)
