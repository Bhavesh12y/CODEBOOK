import pytest
from app.config import get_settings
from app.execution.c_kernel import CKernelManager
from app.models.execution import ExecuteRequest, ExecuteAllRequest, ExecutionCell

@pytest.fixture
def kernel():
    settings = get_settings()
    # Assume compiler is installed for tests
    return CKernelManager(settings)

def test_basic_printf(kernel):
    request = ExecuteRequest(
        notebookId="nb1",
        cellId="cell1",
        code='printf("Hello, C\\n");',
        cells=[],
        stdin=""
    )
    result = kernel.execute(request)
    assert result.status == "success"
    assert result.stdout.strip() == "Hello, C"
    assert result.stderr == ""

def test_variables_and_arithmetic(kernel):
    code = """
    int a = 5;
    int b = 10;
    printf("%d", a + b);
    """
    request = ExecuteRequest(
        notebookId="nb1",
        cellId="cell1",
        code=code,
        cells=[],
        stdin=""
    )
    result = kernel.execute(request)
    assert result.status == "success"
    assert result.stdout.strip() == "15"

def test_functions_and_recursion(kernel):
    code = """
    int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }
    printf("%d", factorial(5));
    """
    request = ExecuteRequest(
        notebookId="nb1",
        cellId="cell1",
        code=code,
        cells=[],
        stdin=""
    )
    result = kernel.execute(request)
    assert result.status == "success"
    assert result.stdout.strip() == "120"

def test_structs_and_pointers(kernel):
    code = """
    struct Point {
        int x;
        int y;
    };
    struct Point p = {10, 20};
    struct Point *ptr = &p;
    printf("%d %d", ptr->x, ptr->y);
    """
    request = ExecuteRequest(
        notebookId="nb1",
        cellId="cell1",
        code=code,
        cells=[],
        stdin=""
    )
    result = kernel.execute(request)
    assert result.status == "success"
    assert result.stdout.strip() == "10 20"

def test_loops_and_conditionals(kernel):
    code = """
    for (int i = 0; i < 5; i++) {
        if (i % 2 == 0) {
            printf("%d ", i);
        }
    }
    """
    request = ExecuteRequest(
        notebookId="nb1",
        cellId="cell1",
        code=code,
        cells=[],
        stdin=""
    )
    result = kernel.execute(request)
    assert result.status == "success"
    assert result.stdout.strip() == "0 2 4"

def test_multi_cell_state_replay(kernel):
    cell1 = ExecutionCell(
        id="c1",
        type="code",
        source="int global_var = 42;",
        committed=True
    )
    cell2 = ExecutionCell(
        id="c2",
        type="code",
        source="printf(\"%d\", global_var);",
        committed=False
    )
    
    request = ExecuteRequest(
        notebookId="nb1",
        cellId="c2",
        code=cell2.source,
        cells=[cell1, cell2],
        stdin=""
    )
    result = kernel.execute(request)
    assert result.status == "success"
    assert result.stdout.strip() == "42"

def test_function_in_cell1_called_in_cell2(kernel):
    cell1 = ExecutionCell(
        id="c1",
        type="code",
        source="int add(int a, int b) { return a + b; }",
        committed=True
    )
    cell2 = ExecutionCell(
        id="c2",
        type="code",
        source="printf(\"%d\", add(3, 4));",
        committed=False
    )
    
    request = ExecuteRequest(
        notebookId="nb1",
        cellId="c2",
        code=cell2.source,
        cells=[cell1, cell2],
        stdin=""
    )
    result = kernel.execute(request)
    assert result.status == "success"
    assert result.stdout.strip() == "7"

def test_execute_all(kernel):
    cells = [
        ExecutionCell(
            id="c1",
            type="code",
            source="int x = 10;",
            committed=False
        ),
        ExecutionCell(
            id="c2",
            type="code",
            source="printf(\"%d\", x);",
            committed=False
        )
    ]
    request = ExecuteAllRequest(
        notebookId="nb1",
        cells=cells,
        stdin="",
        continueOnError=False
    )
    response = kernel.execute_all(request)
    assert response.status == "success"
    assert len(response.results) == 2
    assert response.results[1].result.stdout.strip() == "10"

def test_compilation_error_diagnostic(kernel):
    request = ExecuteRequest(
        notebookId="nb1",
        cellId="c1",
        code="int x = 10\nprintf(\"%d\", x);",
        cells=[],
        stdin=""
    )
    result = kernel.execute(request)
    assert result.status == "error"
    assert len(result.diagnostics) > 0

def test_infinite_loop_timeout(kernel):
    # Set a small timeout for the test if possible, or just rely on kernel setting
    # For testing we can use a very small timeout on the kernel settings
    kernel.settings.execution_timeout = 1.0
    
    request = ExecuteRequest(
        notebookId="nb1",
        cellId="c1",
        code="while(1) {}",
        cells=[],
        stdin=""
    )
    result = kernel.execute(request)
    assert result.status == "stopped"
