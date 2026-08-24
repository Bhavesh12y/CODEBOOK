import pytest
from app.execution.python_kernel import PythonKernelManager
from app.models.execution import ExecuteRequest, ExecuteAllRequest, ExecutionCell
from app.config import get_settings

@pytest.fixture
def kernel():
    settings = get_settings()
    mgr = PythonKernelManager(settings)
    yield mgr
    mgr.stop()

def test_basic_execution(kernel):
    req = ExecuteRequest(notebookId="nb1", cellId="c1", code="print('hello python')", language="python")
    res = kernel.execute(req)
    assert res.status == "success"
    assert res.stdout.strip() == "hello python"
    assert res.exitCode == 0

def test_variable_persistence(kernel):
    req1 = ExecuteRequest(notebookId="nb1", cellId="c1", code="x = 42", language="python")
    kernel.execute(req1)
    
    req2 = ExecuteRequest(notebookId="nb1", cellId="c2", code="print(x * 2)", language="python")
    res2 = kernel.execute(req2)
    assert res2.status == "success"
    assert res2.stdout.strip() == "84"

def test_function_persistence(kernel):
    req1 = ExecuteRequest(notebookId="nb1", cellId="c1", code="def add(a, b): return a + b", language="python")
    kernel.execute(req1)
    
    req2 = ExecuteRequest(notebookId="nb1", cellId="c2", code="print(add(3, 4))", language="python")
    res2 = kernel.execute(req2)
    assert res2.status == "success"
    assert res2.stdout.strip() == "7"

def test_import_persistence(kernel):
    req1 = ExecuteRequest(notebookId="nb1", cellId="c1", code="import math", language="python")
    kernel.execute(req1)
    
    req2 = ExecuteRequest(notebookId="nb1", cellId="c2", code="print(math.sqrt(16))", language="python")
    res2 = kernel.execute(req2)
    assert res2.status == "success"
    assert "4.0" in res2.stdout

def test_class_persistence(kernel):
    req1 = ExecuteRequest(notebookId="nb1", cellId="c1", code="class Dog:\n    name = 'Buddy'", language="python")
    kernel.execute(req1)
    
    req2 = ExecuteRequest(notebookId="nb1", cellId="c2", code="print(Dog.name)", language="python")
    res2 = kernel.execute(req2)
    assert res2.status == "success"
    assert res2.stdout.strip() == "Buddy"

def test_exception_handling(kernel):
    # Setup some state
    kernel.execute(ExecuteRequest(notebookId="nb1", cellId="c0", code="y = 100", language="python"))
    
    req1 = ExecuteRequest(notebookId="nb1", cellId="c1", code="print('before')\n1 / 0\nprint('after')", language="python")
    res1 = kernel.execute(req1)
    
    assert res1.status == "error"
    assert res1.exitCode == 1
    assert "before" in res1.stdout
    assert "after" not in res1.stdout
    assert "ZeroDivisionError" in res1.stderr
    
    assert len(res1.diagnostics) > 0
    diag = res1.diagnostics[0]
    assert diag.line == 2
    assert "ZeroDivisionError" in diag.message
    
    # State should be preserved
    req2 = ExecuteRequest(notebookId="nb1", cellId="c2", code="print(y)", language="python")
    res2 = kernel.execute(req2)
    assert res2.status == "success"
    assert res2.stdout.strip() == "100"

def test_restart_clears_state(kernel):
    req1 = ExecuteRequest(notebookId="nb1", cellId="c1", code="z = 99", language="python")
    kernel.execute(req1)
    
    kernel.restart_notebook("nb1")
    
    req2 = ExecuteRequest(notebookId="nb1", cellId="c2", code="print(z)", language="python")
    res2 = kernel.execute(req2)
    assert res2.status == "error"
    assert "NameError" in res2.stderr

def test_execute_all(kernel):
    req = ExecuteAllRequest(
        notebookId="nb2",
        language="python",
        cells=[
            ExecutionCell(id="c1", type="code", source="a = 10"),
            ExecutionCell(id="c2", type="code", source="b = 20"),
            ExecutionCell(id="c3", type="code", source="print(a + b)")
        ]
    )
    res = kernel.execute_all(req)
    assert res.status == "success"
    assert len(res.results) == 3
    assert res.results[2].result.stdout.strip() == "30"
