from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.models.execution import ExecutionCell

@dataclass
class SourceChunk:
    cell_id: str
    cell_index: int
    start_line: int
    text: str

@dataclass
class CellParts:
    cell: ExecutionCell
    cell_index: int
    imports: list[str] = field(default_factory=list)
    class_level: list[SourceChunk] = field(default_factory=list)
    statements: list[SourceChunk] = field(default_factory=list)
    main_method: SourceChunk | None = None

@dataclass
class JavaGeneratedSource:
    source: str
    line_map: dict[int, tuple[str, int]]
    cell_order: dict[str, int]

CONTROL_PREFIXES = {
    "if", "for", "while", "switch", "catch", "try", "do", "else", "finally",
    "synchronized", "return", "throw", "new", "break", "continue", "case", "default"
}

MAIN_METHOD_RE = re.compile(r"\bpublic\s+static\s+void\s+main\s*\(")
USER_MAIN_RE = re.compile(r"\b__codebook_user_main_[A-Za-z0-9_]+\s*\(")

def _first_word(text: str) -> str:
    match = re.match(r"\s*([A-Za-z_][A-Za-z0-9_]*)", text)
    return match.group(1) if match else ""

def _strip_line_comment(line: str) -> str:
    in_string: str | None = None
    escaped = False
    for i in range(len(line) - 1):
        char = line[i]
        nxt = line[i + 1]
        if escaped:
            escaped = False
            continue
        if char == "\\" and in_string:
            escaped = True
            continue
        if char in {'"', "'"}:
            if in_string == char:
                in_string = None
            elif not in_string:
                in_string = char
            continue
        if not in_string and char == "/" and nxt == "/":
            return line[:i]
    return line

def _brace_delta(line: str) -> int:
    cleaned = _strip_line_comment(line)
    in_string: str | None = None
    escaped = False
    delta = 0
    for char in cleaned:
        if escaped:
            escaped = False
            continue
        if char == "\\" and in_string:
            escaped = True
            continue
        if char in {'"', "'"}:
            if in_string == char:
                in_string = None
            elif not in_string:
                in_string = char
            continue
        if in_string:
            continue
        if char == "{":
            delta += 1
        elif char == "}":
            delta -= 1
    return delta

def _is_class_level(text: str) -> bool:
    stripped = text.lstrip()
    first = _first_word(stripped)
    if first in CONTROL_PREFIXES:
        return False
    
    prefix = text.split("{", 1)[0]
    
    if re.search(r'\b(class|interface|enum|record)\b', prefix):
        return True
        
    if "{" in text and "(" in text and ")" in text:
        if ";" not in prefix and ("=" not in prefix or "operator=" in prefix):
            if prefix.rfind(")") > prefix.rfind("("):
                return True
                
    if stripped.startswith("static ") or stripped.startswith("public static ") or stripped.startswith("private static "):
        return True
                
    return False

def _is_main_method(text: str) -> bool:
    if not _is_class_level(text):
        return False
    prefix = text.split("{", 1)[0]
    return MAIN_METHOD_RE.search(prefix) is not None or USER_MAIN_RE.search(prefix) is not None

def _safe_cell_id(cell_id: str) -> str:
    return re.sub(r"[^A-Za-z0-9_]+", "_", cell_id).strip("_") or "cell"

def _main_method_name(cell_id: str) -> str:
    return f"__codebook_user_main_{_safe_cell_id(cell_id)}"

def _rewrite_main_method(text: str, replacement_name: str) -> str:
    if MAIN_METHOD_RE.search(text.split("{", 1)[0]):
        return MAIN_METHOD_RE.sub(f"public void {replacement_name}(", text, count=1)
    return text

def _existing_user_main_name(text: str) -> str | None:
    prefix = text.split("{", 1)[0]
    match = USER_MAIN_RE.search(prefix)
    if not match:
        return None
    return match.group(0).rsplit("(", 1)[0].strip().split()[-1]

def _split_code_chunks(lines: list[tuple[int, str]]) -> list[SourceChunk]:
    chunks: list[SourceChunk] = []
    buffer: list[str] = []
    start_line: int | None = None
    depth = 0

    for line_no, line in lines:
        if start_line is None and not line.strip():
            continue
        if start_line is None:
            start_line = line_no

        buffer.append(line.rstrip())
        depth += _brace_delta(line)
        stripped = _strip_line_comment(line).strip()
        complete = depth <= 0 and (
            stripped.endswith(";")
            or stripped.endswith("}")
            or line_no == lines[-1][0]
        )
        if complete:
            text = "\n".join(buffer).strip("\n")
            if text.strip():
                chunks.append(SourceChunk("", 0, start_line, text))
            buffer = []
            start_line = None
            depth = 0

    if buffer and start_line is not None:
        text = "\n".join(buffer).strip("\n")
        if text.strip():
            chunks.append(SourceChunk("", 0, start_line, text))

    return chunks

def split_cell(cell: ExecutionCell, cell_index: int) -> CellParts:
    parts = CellParts(cell=cell, cell_index=cell_index)
    code_lines: list[tuple[int, str]] = []

    for line_no, raw_line in enumerate(cell.source.splitlines(), start=1):
        stripped = raw_line.strip()
        if stripped.startswith("import "):
            parts.imports.append(stripped)
        elif stripped.startswith("package "):
            pass # ignore package declarations
        else:
            code_lines.append((line_no, raw_line))

    for chunk in _split_code_chunks(code_lines):
        chunk.cell_id = cell.id
        chunk.cell_index = cell_index
        if _is_main_method(chunk.text):
            parts.main_method = chunk
            existing_name = _existing_user_main_name(chunk.text)
            rewritten_name = existing_name or _main_method_name(cell.id)
            rewritten = SourceChunk(
                cell_id=chunk.cell_id,
                cell_index=chunk.cell_index,
                start_line=chunk.start_line,
                text=_rewrite_main_method(chunk.text, rewritten_name),
            )
            parts.class_level.append(rewritten)
        elif _is_class_level(chunk.text):
            parts.class_level.append(chunk)
        else:
            parts.statements.append(chunk)

    return parts

def build_execution_source(cells: list[ExecutionCell], target_cell_id: str) -> JavaGeneratedSource:
    code_cells = [cell for cell in cells if cell.type == "code"]
    if not any(cell.id == target_cell_id for cell in code_cells):
        code_cells.append(ExecutionCell(id=target_cell_id, type="code", source="", committed=False))

    target_index = next(i for i, cell in enumerate(code_cells) if cell.id == target_cell_id)
    relevant_cells = [
        cell
        for index, cell in enumerate(code_cells)
        if (index < target_index and cell.committed) or cell.id == target_cell_id
    ]
    
    cell_order = {cell.id: i + 1 for i, cell in enumerate(cells)}
    parts = [split_cell(cell, cell_order.get(cell.id, index + 1) - 1) for index, cell in enumerate(relevant_cells)]

    default_imports = [
        "import java.util.*;",
        "import java.io.*;",
        "import java.math.*;",
        "import java.time.*;",
        "import java.util.stream.*;"
    ]
    all_imports = []
    seen_imports = set()
    for imp in default_imports + [imp for part in parts for imp in part.imports]:
        if imp not in seen_imports:
            seen_imports.add(imp)
            all_imports.append(imp)

    source_lines: list[str] = []
    line_map: dict[int, tuple[str, int]] = {}

    def append_line(text: str = "", cell_id: str | None = None, source_line: int | None = None):
        source_lines.append(text)
        current_idx = len(source_lines)
        if cell_id is not None and source_line is not None:
            line_map[current_idx] = (cell_id, source_line)

    def append_chunk(chunk: SourceChunk, indent: str = ""):
        for i, raw in enumerate(chunk.text.splitlines()):
            append_line(f"{indent}{raw}", chunk.cell_id, chunk.start_line + i)

    for imp in all_imports:
        append_line(imp)
    append_line()

    append_line("public class Main {")
    
    var_to_latest_cell: dict[str, str] = {}
    for part in parts:
        for chunk in part.class_level:
            stripped = chunk.text.strip()
            match = re.search(r"^[A-Za-z_][A-Za-z0-9_:\<\>\[\]\,\s]*\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s*\[[^\]]*\])*\s*(=|;)", stripped)
            if match and "{" not in stripped.split("=")[0]:
                var_to_latest_cell[match.group(1)] = part.cell.id

    for part in parts:
        if not part.class_level:
            continue
        filtered_class_level = []
        for chunk in part.class_level:
            stripped = chunk.text.strip()
            match = re.search(r"^[A-Za-z_][A-Za-z0-9_:\<\>\[\]\,\s]*\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s*\[[^\]]*\])*\s*(=|;)", stripped)
            if match and "{" not in stripped.split("=")[0]:
                vname = match.group(1)
                if var_to_latest_cell.get(vname) != part.cell.id:
                    continue
            filtered_class_level.append(chunk)
            
        if filtered_class_level:
            append_line(f"    // ===== Class level declarations from Cell {cell_order.get(part.cell.id, part.cell_index + 1)} =====")
            for chunk in filtered_class_level:
                append_chunk(chunk, indent="    ")
            append_line()

    append_line("    public void __codebook_run(String[] args) throws Throwable {")
    
    has_prior_cells = any(part.cell.id != target_cell_id for part in parts)
    if has_prior_cells:
        append_line("        PrintStream __orig_out = System.out;")
        append_line("        PrintStream __orig_err = System.err;")
        append_line("        PrintStream __silent = new PrintStream(new ByteArrayOutputStream());")

    for part in parts:
        is_target = part.cell.id == target_cell_id
        cell_num = cell_order.get(part.cell.id, part.cell_index + 1)
        
        if has_prior_cells:
            if is_target:
                append_line("        System.setOut(__orig_out);")
                append_line("        System.setErr(__orig_err);")
            else:
                append_line("        System.setOut(__silent);")
                append_line("        System.setErr(__silent);")

        append_line(f"        // ===== Cell {cell_num} =====")
        for chunk in part.statements:
            append_chunk(chunk, indent="        ")
        
        if part.main_method:
            function_name = _existing_user_main_name(part.main_method.text) or _main_method_name(part.cell.id)
            append_line(f"        {function_name}(args);")

    if has_prior_cells:
        append_line("        System.setOut(__orig_out);")
        append_line("        System.setErr(__orig_err);")

    append_line("    }")
    
    append_line("    public static void main(String[] args) throws Throwable {")
    append_line("        new Main().__codebook_run(args);")
    append_line("    }")
    append_line("}")

    return JavaGeneratedSource("\n".join(source_lines), line_map, cell_order)


def build_export_source(cells: list[ExecutionCell]) -> str:
    code_cells = [cell for cell in cells if cell.type == "code" and cell.source.strip()]
    parts = [split_cell(cell, index) for index, cell in enumerate(code_cells)]
    parts_by_id = {part.cell.id: part for part in parts}
    
    default_imports = [
        "import java.util.*;",
        "import java.io.*;",
        "import java.math.*;",
        "import java.time.*;",
        "import java.util.stream.*;"
    ]
    seen_imports = set()
    all_imports = []
    for imp in default_imports + [imp for part in parts for imp in part.imports]:
        if imp not in seen_imports:
            seen_imports.add(imp)
            all_imports.append(imp)

    lines: list[str] = []
    lines.extend(all_imports)
    lines.append("")

    lines.append("public class Main {")

    for cell_index, cell in enumerate(cells, start=1):
        if cell.type == "markdown" and cell.source.strip():
            lines.append(f"    // ===== Markdown Cell {cell_index} =====")
            for raw in cell.source.splitlines():
                lines.append(f"    // {raw}")
            lines.append("")
            continue

        part = parts_by_id.get(cell.id)
        if not part or not part.class_level:
            continue
        lines.append(f"    // ===== Cell {cell_index} globals =====")
        for chunk in part.class_level:
            if part.main_method and chunk.start_line == part.main_method.start_line:
                lines.extend(f"    {line}" for line in part.main_method.text.splitlines())
            else:
                lines.extend(f"    {line}" for line in chunk.text.splitlines())
        lines.append("")

    has_statements = any(part.statements for part in parts)
    if has_statements:
        lines.append("    public static void main(String[] args) throws Throwable {")
        for cell_index, cell in enumerate(cells, start=1):
            part = parts_by_id.get(cell.id)
            if not part or not part.statements:
                continue
            lines.append(f"        // ===== Cell {cell_index} =====")
            for chunk in part.statements:
                for raw in chunk.text.splitlines():
                    lines.append(f"        {raw}")
            lines.append("")
        lines.append("    }")
    
    lines.append("}")

    return "\n".join(lines).rstrip() + "\n"
