import pytest
from app.execution.java_kernel import JavaKernelManager
from app.models.execution import ExecuteRequest, ExecuteAllRequest, ExecutionCell

@pytest.fixture
def java_kernel():
    return JavaKernelManager()

def test_basic_execution(java_kernel):
    req = ExecuteRequest(
        notebookId="nb1",
        cellId="c1",
        code='System.out.println("Hello Java");',
        cells=[],
        language="java",
    )
    result = java_kernel.execute(req)
    assert result.status == "success"
    assert "Hello Java" in result.stdout

def test_variables_and_arithmetic(java_kernel):
    req = ExecuteRequest(
        notebookId="nb1",
        cellId="c1",
        code='int a = 5;\nint b = 10;\nSystem.out.println(a + b);',
        cells=[],
        language="java",
    )
    result = java_kernel.execute(req)
    assert result.status == "success"
    assert "15" in result.stdout

def test_loops_and_conditionals(java_kernel):
    req = ExecuteRequest(
        notebookId="nb1",
        cellId="c1",
        code='for(int i = 0; i < 3; i++) System.out.print(i);',
        cells=[],
        language="java",
    )
    result = java_kernel.execute(req)
    assert result.status == "success"
    assert "012" in result.stdout

def test_methods(java_kernel):
    req = ExecuteRequest(
        notebookId="nb1",
        cellId="c1",
        code='static int square(int n) { return n * n; }\nSystem.out.println(square(5));',
        cells=[],
        language="java",
    )
    result = java_kernel.execute(req)
    assert result.status == "success"
    assert "25" in result.stdout

def test_classes(java_kernel):
    req = ExecuteRequest(
        notebookId="nb1",
        cellId="c1",
        code='static class Person { String name = "Alice"; }\nPerson p = new Person();\nSystem.out.println(p.name);',
        cells=[],
        language="java",
    )
    result = java_kernel.execute(req)
    assert result.status == "success"
    assert "Alice" in result.stdout

def test_multi_cell_state_replay(java_kernel):
    cells = [
        ExecutionCell(id="c1", type="code", source="int x = 10;\nSystem.out.println(x);", committed=True),
        ExecutionCell(id="c2", type="code", source="x += 5;\nSystem.out.println(x);", committed=False),
    ]
    req = ExecuteRequest(
        notebookId="nb1",
        cellId="c2",
        code="",
        cells=cells,
        language="java",
    )
    result = java_kernel.execute(req)
    assert result.status == "success"
    assert "15" in result.stdout.strip()
    assert "10" not in result.stdout.strip()

def test_execute_all(java_kernel):
    cells = [
        ExecutionCell(id="c1", type="code", source="int x = 100;", committed=False),
        ExecutionCell(id="c2", type="code", source="System.out.println(x);", committed=False),
    ]
    req = ExecuteAllRequest(
        notebookId="nb1",
        cells=cells,
        language="java",
    )
    response = java_kernel.execute_all(req)
    assert response.status == "success"
    assert len(response.results) == 2
    assert response.results[0].result.status == "success"
    assert response.results[1].result.status == "success"
    assert "100" in response.results[1].result.stdout

def test_compilation_error_diagnostic(java_kernel):
    req = ExecuteRequest(
        notebookId="nb1",
        cellId="c1",
        code='System.out.println("No semicolon")',
        cells=[],
        language="java",
    )
    result = java_kernel.execute(req)
    assert result.status == "error"
    assert len(result.diagnostics) > 0
    assert result.diagnostics[0].cellId == "c1"

def test_infinite_loop_timeout(java_kernel):
    # Shorten timeout for test
    java_kernel.settings.execution_timeout = 1.0
    req = ExecuteRequest(
        notebookId="nb1",
        cellId="c1",
        code='while(true) {}',
        cells=[],
        language="java",
    )
    result = java_kernel.execute(req)
    assert result.status == "stopped"
