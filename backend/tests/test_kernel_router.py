from __future__ import annotations

from app.config import Settings
from app.execution.kernel_router import KernelRouter
from app.models.execution import ExecuteRequest, ExecutionCell


def test_kernel_router_dispatches_cpp(tmp_path):
    settings = Settings(workspace_dir=tmp_path)
    router = KernelRouter(settings)

    # Health / lifecycle
    assert router.start("cpp")["status"] == "ready"
    assert router.restart("cpp")["status"] == "ready"
    assert router.stop("cpp")["status"] == "stopped"

    # Unsupported language
    res = router.execute(ExecuteRequest(notebookId="test", cellId="c1", code="print(1)", language="unsupported_lang"))
    assert res.status == "error"
    assert "not yet supported" in res.stderr

    # Toolchain detection
    tc = router.detect_toolchain("cpp")
    assert tc.language == "cpp"

    all_tc = router.detect_all_toolchains()
    assert "cpp" in all_tc
    assert "c" in all_tc
    assert "java" in all_tc
    assert "python" in all_tc
