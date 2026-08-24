from __future__ import annotations

from app.models.execution import ExecutionCell
from app.notebook.exporter import export_notebook_cpp


def test_export_dedupes_includes_and_wraps_statements():
    source = export_notebook_cpp(
        [
            ExecutionCell(id="a", source="#include <iostream>\n#include <vector>\nint x = 10;"),
            ExecutionCell(id="b", source="#include <iostream>\nstd::cout << x;"),
            ExecutionCell(id="c", type="markdown", source="# ignored"),
        ]
    )

    assert source.count("#include <iostream>") == 1
    assert "int main()" in source
    assert "std::cout << x;" in source
    assert "// # ignored" in source
