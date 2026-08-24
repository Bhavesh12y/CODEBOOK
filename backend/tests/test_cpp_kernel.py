from __future__ import annotations

import shutil
import pytest

from app.config import Settings
from app.execution.cpp_kernel import CppKernelManager
from app.models.execution import ExecuteAllRequest, ExecuteRequest, ExecutionCell


pytestmark = pytest.mark.skipif(shutil.which("g++") is None, reason="g++ is required for kernel tests")


def kernel(tmp_path):
    return CppKernelManager(Settings(workspace_dir=tmp_path, execution_timeout=2.0))


# ==============================================================================
# 1. BASIC C++ EXECUTION (30 Representative Language Features)
# ==============================================================================

@pytest.mark.parametrize(
    "name,source,stdin,expected_stdout",
    [
        ("1. Hello world / cout", '#include <iostream>\nstd::cout << "Hello World!";', "", "Hello World!"),
        ("2. Variables and expressions", "int a = 10, b = 20;\nstd::cout << (a + b) * 2;", "", "60"),
        ("3. cin/input", "int x;\nstd::cin >> x;\nstd::cout << \"Got: \" << x;", "42\n", "Got: 42"),
        ("4. if/else", 'int x = 5;\nif (x > 3) std::cout << "gt"; else std::cout << "le";', "", "gt"),
        ("5. switch", 'int x = 2;\nswitch(x) { case 1: std::cout << "1"; break; case 2: std::cout << "2"; break; default: std::cout << "def"; }', "", "2"),
        ("6. for/while/do-while", "for(int i=0;i<2;++i) std::cout << i;\nint j=0;\nwhile(j<2) { std::cout << j; j++; }\ndo { std::cout << j; j++; } while(j<3);", "", "01012"),
        ("7. break/continue", "for(int i=0;i<5;++i) { if(i==1) continue; if(i==3) break; std::cout << i; }", "", "02"),
        ("8. functions", "int add(int a, int b) { return a + b; }\nstd::cout << add(3, 4);", "", "7"),
        ("9. recursion", "int fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }\nstd::cout << fact(5);", "", "120"),
        ("10. arrays", "int arr[] = {1, 2, 3};\nstd::cout << arr[0] + arr[2];", "", "4"),
        ("11. strings", '#include <string>\nstd::string s = "hello";\ns += " world";\nstd::cout << s;', "", "hello world"),
        ("12. pointers", "int v = 100;\nint* p = &v;\n*p = 200;\nstd::cout << v;", "", "200"),
        ("13. references", "int a = 10;\nint& r = a;\nr = 50;\nstd::cout << a;", "", "50"),
        ("14. structs", "struct Point { int x, y; };\nPoint p{10, 20};\nstd::cout << p.x + p.y;", "", "30"),
        ("15. classes", "class Counter { int c = 0; public: void inc() { c++; } int get() const { return c; } };\nCounter cnt;\ncnt.inc();\nstd::cout << cnt.get();", "", "1"),
        ("16. constructors/destructors", 'struct Tracer { Tracer() { std::cout << "C"; } ~Tracer() { std::cout << "D"; } };\n{ Tracer t; }', "", "CD"),
        ("17. inheritance/polymorphism", 'struct Base { virtual ~Base() = default; virtual void f() { std::cout << "B"; } };\nstruct Derived : Base { void f() override { std::cout << "D"; } };\nBase* b = new Derived();\nb->f();\ndelete b;', "", "D"),
        ("18. enums", 'enum class Color { Red, Green, Blue };\nColor c = Color::Green;\nstd::cout << (c == Color::Green ? "green" : "other");', "", "green"),
        ("19. namespaces", "namespace MyNs { int val = 99; }\nstd::cout << MyNs::val;", "", "99"),
        ("20. templates", "template<typename T> T myMax(T a, T b) { return a > b ? a : b; }\nstd::cout << myMax(3, 7);", "", "7"),
        ("21. lambdas", "auto f = [](int x) { return x * x; };\nstd::cout << f(6);", "", "36"),
        ("22. STL containers", "#include <vector>\n#include <map>\n#include <set>\n#include <stack>\n#include <queue>\nstd::vector<int> v = {1, 2};\nstd::map<int, int> m;\nm[1] = 2;\nstd::set<int> s = {3};\nstd::stack<int> st;\nst.push(4);\nstd::queue<int> q;\nq.push(5);\nstd::cout << v.size() + m.size() + s.size() + st.size() + q.size();", "", "6"),
        ("23. iterators/range-for", "#include <vector>\nstd::vector<int> v = {1, 2, 3};\nfor(auto x : v) std::cout << x;", "", "123"),
        ("24. smart pointers", "#include <memory>\nauto p = std::make_unique<int>(42);\nstd::cout << *p;", "", "42"),
        ("25. exceptions", '#include <stdexcept>\ntry { throw std::runtime_error("err"); } catch(const std::exception& e) { std::cout << e.what(); }', "", "err"),
        ("26. operator overloading", "struct Num { int n; Num operator+(const Num& o) const { return {n + o.n}; } };\nNum a{3}, b{4};\nstd::cout << (a + b).n;", "", "7"),
        ("27. static/const/constexpr", "constexpr int c = 100;\nconst int k = 200;\nstd::cout << c + k;", "", "300"),
        ("28. preprocessor/#include/#define", "#define PI 3\nstd::cout << PI;", "", "3"),
        ("29. file-like standard-library usage", "#include <sstream>\nstd::stringstream ss;\nss << 123;\nint val;\nss >> val;\nstd::cout << val;", "", "123"),
        ("30. modern C++ features", "auto generic_add = [](auto x, auto y) { return x + y; };\nstd::cout << generic_add(15, 25);", "", "40"),
    ],
)
def test_basic_cpp_features(tmp_path, name, source, stdin, expected_stdout):
    cells = [ExecutionCell(id="c1", source=source)]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="c1", cells=cells, stdin=stdin))
    assert res.status == "success", f"Feature '{name}' failed with stderr: {res.stderr}"
    assert res.stdout.strip() == expected_stdout


# ==============================================================================
# 2. NOTEBOOK CELL SEMANTICS & PERSISTENCE
# ==============================================================================

def test_cell_local_variable_scoping_no_collision(tmp_path):
    cells = [
        ExecutionCell(id="cell-1", source="int x = 42;\nstd::cout << x;", committed=True),
        ExecutionCell(id="cell-2", source="int x = 100;\nstd::cout << x;"),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-2", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "100"


def test_explicit_global_variable_persistence_across_cells(tmp_path):
    cells = [
        ExecutionCell(id="cell-1", source="static int x = 42;", committed=True),
        ExecutionCell(id="cell-2", source="std::cout << x;"),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-2", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "42"


def test_function_persistence_across_cells(tmp_path):
    cells = [
        ExecutionCell(id="cell-1", source="int add(int a, int b) { return a + b; }", committed=True),
        ExecutionCell(id="cell-2", source="std::cout << add(2, 3);"),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-2", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "5"


def test_struct_persistence_across_cells(tmp_path):
    cells = [
        ExecutionCell(id="cell-1", source="struct Student { int age; };", committed=True),
        ExecutionCell(id="cell-2", source="Student s{20};\nstd::cout << s.age;"),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-2", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "20"


def test_class_persistence_across_cells(tmp_path):
    cells = [
        ExecutionCell(id="cell-1", source="class Person { public: int id; Person(int i): id(i){} };", committed=True),
        ExecutionCell(id="cell-2", source="Person p(99);\nstd::cout << p.id;"),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-2", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "99"


def test_template_persistence_across_cells(tmp_path):
    cells = [
        ExecutionCell(id="cell-1", source="template<typename T> T mul(T a, T b) { return a * b; }", committed=True),
        ExecutionCell(id="cell-2", source="std::cout << mul(4, 5);"),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-2", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "20"


def test_namespace_extension_across_cells(tmp_path):
    cells = [
        ExecutionCell(id="cell-1", source="namespace App { int version = 1; }", committed=True),
        ExecutionCell(id="cell-2", source="namespace App { int build = 200; }", committed=True),
        ExecutionCell(id="cell-3", source="std::cout << App::version << '.' << App::build;"),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-3", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "1.200"


def test_namespace_definition_and_using_directive_same_cell(tmp_path):
    cells = [
        ExecutionCell(
            id="cell-1",
            source="""namespace TestNS {
    int value = 42;
    int add(int a, int b) { return a + b; }
}

using namespace TestNS;

std::cout << value << "\\n";
std::cout << add(10, 20) << "\\n";""",
        )
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-1", cells=cells))
    assert res.status == "success"
    assert "42\n30" in res.stdout.strip()


def test_using_function_declaration_same_cell_and_across_cells(tmp_path):
    cells = [
        ExecutionCell(
            id="cell-1",
            source="namespace MathNS { int square(int x) { return x * x; } }",
            committed=True,
        ),
        ExecutionCell(
            id="cell-2",
            source="using MathNS::square;\nstd::cout << square(6);",
        ),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-2", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "36"


def test_namespace_alias_and_nested_namespace(tmp_path):
    cells = [
        ExecutionCell(
            id="cell-1",
            source="""namespace Outer {
    namespace Inner {
        int compute(int x) { return x + 100; }
    }
}
namespace OI = Outer::Inner;
std::cout << OI::compute(23);""",
        )
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-1", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "123"


def test_nested_namespace_extension_across_cells(tmp_path):
    cells = [
        ExecutionCell(id="cell-1", source="namespace A { namespace B { int x = 50; } }", committed=True),
        ExecutionCell(id="cell-2", source="namespace A { namespace B { int y = 25; } }", committed=True),
        ExecutionCell(id="cell-3", source="using namespace A::B;\nstd::cout << x + y;"),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-3", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "75"


def test_state_replay_between_cells(tmp_path):
    cells = [
        ExecutionCell(id="cell-1", source="#include <iostream>\nusing namespace std;\n\nstatic int x = 10;", committed=True),
        ExecutionCell(id="cell-2", source="x += 20;\ncout << x;", committed=True),
        ExecutionCell(id="cell-3", source="cout << x * 2;"),
    ]
    manager = kernel(tmp_path)

    second = manager.execute(ExecuteRequest(notebookId="nb", cellId="cell-2", cells=cells))
    third = manager.execute(ExecuteRequest(notebookId="nb", cellId="cell-3", cells=cells))

    assert second.status == "success"
    assert second.stdout.strip() == "30"
    assert third.status == "success"
    assert third.stdout.strip() == "60"


def test_function_accessing_global_variable_from_previous_cell(tmp_path):
    cells = [
        ExecutionCell(id="cell-1", source="static int total = 100;\nvoid addTotal(int n) { total += n; }", committed=True),
        ExecutionCell(id="cell-2", source="addTotal(50);\nstd::cout << total;"),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-2", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "150"


def test_function_modifying_prior_cell_global(tmp_path):
    cells = [
        ExecutionCell(id="cell-1", source="static int score = 10;", committed=True),
        ExecutionCell(id="cell-2", source="void boost() { score += 20; }", committed=True),
        ExecutionCell(id="cell-3", source="boost();\nstd::cout << score;"),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-3", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "30"


def test_execute_all_commits_successful_cells(tmp_path):
    cells = [
        ExecutionCell(id="cell-1", source="static int a = 5;"),
        ExecutionCell(id="cell-2", source="a += 10;\nstd::cout << a;"),
        ExecutionCell(id="cell-3", source="std::cout << a * 2;"),
    ]
    response = kernel(tmp_path).execute_all(ExecuteAllRequest(notebookId="nb", cells=cells))
    assert response.status == "success"
    assert len(response.results) == 3
    assert response.results[1].result.stdout.strip() == "15"
    assert response.results[2].result.stdout.strip() == "30"


def test_execute_all_stops_on_error_when_flag_false(tmp_path):
    cells = [
        ExecutionCell(id="cell-1", source="int a = 5;"),
        ExecutionCell(id="cell-2", source="invalid_code_here;"),
        ExecutionCell(id="cell-3", source="std::cout << a;"),
    ]
    response = kernel(tmp_path).execute_all(ExecuteAllRequest(notebookId="nb", cells=cells, continueOnError=False))
    assert response.status == "error"
    assert len(response.results) == 2
    assert response.results[1].result.status == "error"


# ==============================================================================
# 3. GLOBAL / TRANSLATION-UNIT C++
# ==============================================================================

def test_global_const_and_constexpr(tmp_path):
    cells = [
        ExecutionCell(id="c1", source="static const int LIMIT = 50;\nconstexpr int VAL = 12 * 12;", committed=True),
        ExecutionCell(id="c2", source="std::cout << LIMIT + VAL;"),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="c2", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == str(50 + 144)


def test_global_static_variable(tmp_path):
    cells = [
        ExecutionCell(id="c1", source="static int s_val = 77;", committed=True),
        ExecutionCell(id="c2", source="std::cout << s_val;"),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="c2", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "77"


def test_global_static_member_definition(tmp_path):
    cells = [
        ExecutionCell(id="c1", source="struct Tracker { static int count; };\nint Tracker::count = 42;", committed=True),
        ExecutionCell(id="c2", source="std::cout << Tracker::count;"),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="c2", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "42"


def test_out_of_line_member_function(tmp_path):
    cells = [
        ExecutionCell(id="c1", source="struct Calc { int mul(int a, int b); };\nint Calc::mul(int a, int b) { return a * b; }", committed=True),
        ExecutionCell(id="c2", source="Calc c;\nstd::cout << c.mul(6, 7);"),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="c2", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "42"


def test_anonymous_namespace(tmp_path):
    cells = [
        ExecutionCell(id="c1", source="namespace { int secret = 42; }", committed=True),
        ExecutionCell(id="c2", source="std::cout << secret;"),
    ]
    res = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="c2", cells=cells))
    assert res.status == "success"
    assert res.stdout.strip() == "42"


# ==============================================================================
# 4. COMPLETE PROGRAM MODE (Explicit main)
# ==============================================================================

def test_user_defined_main_does_not_conflict_with_backend_wrapper(tmp_path):
    cells = [
        ExecutionCell(
            id="cell-main",
            source='#include <iostream>\nint main() {\n    std::cout << "from main";\n    return 0;\n}',
        )
    ]
    result = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-main", cells=cells))
    assert result.status == "success"
    assert result.stdout.strip() == "from main"


def test_user_defined_main_with_argc_argv(tmp_path):
    cells = [
        ExecutionCell(
            id="cell-main",
            source='#include <iostream>\nint main(int argc, char** argv) {\n    std::cout << "argc: " << argc;\n    return 0;\n}',
        )
    ]
    result = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-main", cells=cells))
    assert result.status == "success"
    assert result.stdout.strip() == "argc: 1"


def test_trailing_return_type_main(tmp_path):
    cells = [
        ExecutionCell(
            id="cell-main",
            source='#include <iostream>\nauto main() -> int {\n    std::cout << "trailing main";\n    return 0;\n}',
        )
    ]
    result = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-main", cells=cells))
    assert result.status == "success"
    assert result.stdout.strip() == "trailing main"


# ==============================================================================
# 5. STATE REPLAY & SIDE EFFECTS
# ==============================================================================

def test_global_object_constructor_in_state_replay(tmp_path):
    mgr = kernel(tmp_path)
    cells = [
        ExecutionCell(
            id="c1",
            source='#include <iostream>\n\nstruct Printer {\n    Printer() {\n        std::cout << "CONSTRUCTOR\\n";\n    }\n};\n\nstatic Printer printer;',
            committed=True,
        ),
        ExecutionCell(id="c2", source='std::cout << "CELL 2\\n";'),
    ]
    res1 = mgr.execute(ExecuteRequest(notebookId="nb", cellId="c1", cells=cells))
    assert res1.status == "success"
    assert res1.stdout.strip() == "CONSTRUCTOR"

    res2 = mgr.execute(ExecuteRequest(notebookId="nb", cellId="c2", cells=cells))
    assert res2.status == "success"
    assert res2.stdout.strip() == "CELL 2"


# ==============================================================================
# 6. ERROR HANDLING & DIAGNOSTICS
# ==============================================================================

def test_compilation_failure_maps_to_cell(tmp_path):
    cells = [
        ExecutionCell(id="cell-a", source="#include <iostream>", committed=True),
        ExecutionCell(id="cell-b", source="coutt << 1;"),
    ]
    result = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-b", cells=cells))

    assert result.status == "error"
    assert "Compilation Error" in result.stderr
    assert result.diagnostics
    assert result.diagnostics[0].cellId == "cell-b"


def test_runtime_failure_returns_structured_error(tmp_path):
    cells = [ExecutionCell(id="cell-a", source='#include <stdexcept>\nthrow std::runtime_error("boom");')]
    result = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-a", cells=cells))

    assert result.status == "error"
    assert result.exitCode == 101
    assert "boom" in result.stderr


def test_execute_passes_stdin_to_program(tmp_path):
    cells = [
        ExecutionCell(
            id="cell-input",
            source="#include <iostream>\nint value;\nstd::cin >> value;\nstd::cout << value * 2;",
        )
    ]

    result = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-input", cells=cells, stdin="21\n"))

    assert result.status == "success"
    assert result.stdout.strip() == "42"


def test_execute_refuses_stdin_program_without_input(tmp_path):
    cells = [
        ExecutionCell(
            id="cell-input",
            source="#include <iostream>\nint value;\nstd::cin >> value;\nstd::cout << value;",
        )
    ]

    result = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-input", cells=cells))

    assert result.status == "error"
    assert result.message == "Interactive input required"
    assert "Interactive input required" in result.stderr


def test_timeout_stops_execution(tmp_path):
    cells = [ExecutionCell(id="cell-a", source="while (true) {}")]
    result = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-a", cells=cells))

    assert result.status == "stopped"
    assert result.message == "Execution stopped"


def test_diagnostic_cell_mapping_with_markdown_cells(tmp_path):
    cells = [
        ExecutionCell(id="cell-1", type="code", source="int x = 10;", committed=True),
        ExecutionCell(id="cell-2", type="markdown", source="# Note"),
        ExecutionCell(id="cell-3", type="code", source="coutt << 1;"),
    ]
    result = kernel(tmp_path).execute(ExecuteRequest(notebookId="nb", cellId="cell-3", cells=cells))

    assert result.status == "error"
    assert "Cell 3" in result.stderr
    assert result.diagnostics
    assert result.diagnostics[0].cellId == "cell-3"
