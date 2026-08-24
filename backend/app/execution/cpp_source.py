from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.models.execution import ExecutionCell


INCLUDE_RE = re.compile(r"^\s*#\s*include\b")
PREPROCESSOR_RE = re.compile(r"^\s*#")
CONTROL_PREFIXES = (
    "if", "for", "while", "switch", "catch", "try", "do", "else",
    "return", "throw", "goto", "break", "continue", "case", "default",
)
MAIN_FUNCTION_RE = re.compile(r"\bmain\s*\(")


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
    includes: list[str] = field(default_factory=list)
    using_directives: list[str] = field(default_factory=list)
    globals: list[SourceChunk] = field(default_factory=list)
    statements: list[SourceChunk] = field(default_factory=list)
    main_function: SourceChunk | None = None


@dataclass
class GeneratedSource:
    source: str
    filename_to_cell: dict[str, str]
    cell_order: dict[str, int]


def _safe_filename(cell_id: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9_]+", "_", cell_id).strip("_") or "cell"
    return f"cppnb_cell_{safe}.cpp"


def _dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        key = item.strip()
        if key and key not in seen:
            seen.add(key)
            result.append(item.rstrip())
    return result


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


def _first_word(text: str) -> str:
    match = re.match(r"\s*([A-Za-z_][A-Za-z0-9_]*)", text)
    return match.group(1) if match else ""


BUILTIN_TYPES = {
    "int", "char", "bool", "float", "double", "void", "short", "long", "unsigned", "signed",
    "int8_t", "int16_t", "int32_t", "int64_t", "uint8_t", "uint16_t", "uint32_t", "uint64_t",
    "size_t", "ptrdiff_t", "auto", "wchar_t", "char16_t", "char32_t",
}

DECLARATION_PREFIXES = {
    "template", "class", "struct", "union", "enum", "namespace",
    "typedef", "using", "extern", "static", "constexpr", "const",
    "inline", "thread_local", "friend", "consteval", "constinit",
}

STATEMENT_STARTERS = {
    "cin", "std::cin", "cout", "std::cout", "cerr", "std::cerr", "clog", "std::clog",
    "printf", "scanf", "puts", "free", "delete", "getline", "std::getline",
}


def _looks_like_function_definition(text: str) -> bool:
    """Return True if *text* (possibly multi-line) looks like a free function definition."""
    stripped = text.lstrip()
    word = _first_word(stripped)
    if word in CONTROL_PREFIXES:
        return False
    if "{" not in text or "(" not in text or ")" not in text:
        return False
    # The prefix is everything before the first opening brace
    prefix = text.split("{", 1)[0]
    # Must not look like a variable declaration with initialiser
    if ";" in prefix:
        return False
    if "=" in prefix and "operator=" not in prefix:
        return False
    # The last ')' in the prefix must come after the last '('
    return prefix.rfind(")") > prefix.rfind("(")


CPPBOOK_USER_MAIN_RE = re.compile(r"\b__cppbook_user_main_[A-Za-z0-9_]+\s*\(")


def _is_main_function_definition(text: str) -> bool:
    """Return True if *text* contains a definition of ``main(...)`` or notebook entry point."""
    if not _looks_like_function_definition(text):
        return False
    prefix = text.split("{", 1)[0]
    return MAIN_FUNCTION_RE.search(prefix) is not None or CPPBOOK_USER_MAIN_RE.search(prefix) is not None


def _main_function_name(cell_id: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9_]+", "_", cell_id).strip("_") or "cell"
    return f"__cppbook_user_main_{safe}"


def _rewrite_main_function(text: str, replacement_name: str) -> str:
    if MAIN_FUNCTION_RE.search(text.split("{", 1)[0]):
        return MAIN_FUNCTION_RE.sub(f"{replacement_name}(", text, count=1)
    # Already a notebook helper entry point — keep the existing name.
    return text


def _existing_user_main_name(text: str) -> str | None:
    prefix = text.split("{", 1)[0]
    match = CPPBOOK_USER_MAIN_RE.search(prefix)
    if not match:
        return None
    return match.group(0).rsplit("(", 1)[0].strip()


def _main_parameter_count(text: str) -> int | None:
    prefix = text.split("{", 1)[0]
    match = re.search(
        r"\b(?:main|__cppbook_user_main_[A-Za-z0-9_]+)\s*\((?P<params>[^)]*)\)",
        prefix,
        re.DOTALL,
    )
    if not match:
        return None
    params = match.group("params").strip()
    if not params or params == "void":
        return 0
    return len([part for part in params.split(",") if part.strip()])


def _is_global_chunk(text: str) -> bool:
    stripped = text.strip()
    if not stripped:
        return False
    if PREPROCESSOR_RE.match(stripped):
        return True

    first_token_match = re.match(r"^([A-Za-z_][A-Za-z0-9_:]*)", stripped)
    if not first_token_match:
        return False

    first_token = first_token_match.group(1)
    if first_token in CONTROL_PREFIXES:
        return False
    if first_token in STATEMENT_STARTERS:
        return False

    # Object member call or pointer call: e.g. v.push_back() or ptr->func()
    if re.match(r"^[A-Za-z_][A-Za-z0-9_]*(\.|->)", stripped):
        return False

    # Standalone assignment to existing variable: e.g. x = 5; or arr[0] = 1;
    if re.match(r"^[A-Za-z_][A-Za-z0-9_]*(\[[^\]]*\])*\s*(\+=|-=|\*=|/=|%=|&=|\|=|\^=|<<=|>>=|=)\s*", stripped):
        if first_token not in BUILTIN_TYPES and first_token not in DECLARATION_PREFIXES:
            return False

    # Standalone increment/decrement: ++x; or x++;
    if re.match(r"^(\+\+|--)[A-Za-z_][A-Za-z0-9_]*\s*;", stripped) or re.match(r"^[A-Za-z_][A-Za-z0-9_]*(\+\+|--)\s*;", stripped):
        return False

    # Standalone function call: foo(a, b); (single identifier before '(')
    if re.match(r"^[A-Za-z_][A-Za-z0-9_:]*\s*\([^)]*\)\s*;", stripped):
        if first_token not in BUILTIN_TYPES:
            return False

    # Declaration keywords: template, struct, class, using, const, etc.
    if first_token in DECLARATION_PREFIXES:
        return True
    if any(
        stripped.startswith(prefix + " ")
        or stripped.startswith(prefix + "<")
        or stripped.startswith(prefix + "\n")
        or stripped.startswith(prefix + "\t")
        for prefix in DECLARATION_PREFIXES
    ):
        return True

    # Builtin types: int, double, float, char, bool, auto, size_t, etc.
    if first_token in BUILTIN_TYPES:
        return True

    # Free function definitions with a body
    if _looks_like_function_definition(stripped):
        return True

    # Template types e.g. vector<int> v = ...; std::map<string, int> m;
    if re.match(r"^([A-Za-z_][A-Za-z0-9_:]*<.+?>)\s+[A-Za-z_]", stripped):
        return True

    # General Type Variable declaration: e.g. string s = "hi"; Point p{1, 2};
    if re.match(r"^[A-Za-z_][A-Za-z0-9_:]*(\s*<[^>]+>)?\s+[*&]*\s*[A-Za-z_][A-Za-z0-9_]*(\s*\[[^\]]*\])*\s*(=|\{|;|\()", stripped):
        return True

    # Out-of-line member definitions (e.g. int Class::count = 42; or void Class::f() { ... })
    if "::" in stripped and not stripped.startswith("std::"):
        if "{" in stripped and "(" in stripped and _looks_like_function_definition(stripped):
            return True
        match_scoped_var = re.match(r"^[A-Za-z_][A-Za-z0-9_:<>\s*&]+::[A-Za-z_][A-Za-z0-9_]*\s*=", stripped)
        if match_scoped_var:
            return True

    return False


def _declared_var_name(chunk: SourceChunk) -> str | None:
    stripped = chunk.text.strip()
    if _looks_like_function_definition(stripped) or _is_main_function_definition(stripped):
        return None
    if (
        stripped.startswith("#")
        or stripped.startswith("using")
        or stripped.startswith("namespace")
        or stripped.startswith("template")
        or stripped.startswith("class")
        or stripped.startswith("struct")
    ):
        return None
    match = re.search(r"[*&\s]+([A-Za-z_][A-Za-z0-9_]*)(\s*\[[^\]]*\])*\s*(=|\{|;|\()", stripped)
    if match:
        return match.group(1)
    return None


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
            or stripped.startswith("#")
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
        if INCLUDE_RE.match(stripped):
            parts.includes.append(stripped)
        elif stripped.startswith("#") and not stripped.startswith("#line"):
            parts.globals.append(SourceChunk(cell.id, cell_index, line_no, stripped))
        else:
            code_lines.append((line_no, raw_line))

    for chunk in _split_code_chunks(code_lines):
        chunk.cell_id = cell.id
        chunk.cell_index = cell_index
        if _is_main_function_definition(chunk.text):
            parts.main_function = chunk
            existing_name = _existing_user_main_name(chunk.text)
            rewritten_name = existing_name or _main_function_name(cell.id)
            rewritten = SourceChunk(
                cell_id=chunk.cell_id,
                cell_index=chunk.cell_index,
                start_line=chunk.start_line,
                text=_rewrite_main_function(chunk.text, rewritten_name),
            )
            parts.globals.append(rewritten)
        elif _is_global_chunk(chunk.text):
            parts.globals.append(chunk)
        else:
            parts.statements.append(chunk)

    return parts


def _append_line(lines: list[str], value: str = "") -> None:
    lines.append(value)


def _append_chunk(lines: list[str], chunk: SourceChunk, filename: str, indent: str = "") -> None:
    _append_line(lines, f'#line {chunk.start_line} "{filename}"')
    for raw in chunk.text.splitlines():
        if raw.strip().startswith("#"):
            _append_line(lines, raw)
        else:
            _append_line(lines, f"{indent}{raw}")
    _append_line(lines, '#line 1 "main.cpp"')


def _append_markdown_comment(lines: list[str], source: str, cell_number: int, indent: str = "") -> None:
    _append_line(lines, f"{indent}// ===== Markdown Cell {cell_number} =====")
    for raw in source.splitlines() or [""]:
        _append_line(lines, f"{indent}// {raw}")


def build_execution_source(cells: list[ExecutionCell], target_cell_id: str) -> GeneratedSource:
    code_cells = [cell for cell in cells if cell.type == "code"]
    if not any(cell.id == target_cell_id for cell in code_cells):
        code_cells.append(ExecutionCell(id=target_cell_id, type="code", source="", committed=False))

    target_index = next(i for i, cell in enumerate(code_cells) if cell.id == target_cell_id)
    # Cell-local isolation: only replay earlier cells that were successfully
    # committed. Always include the target cell being executed now.
    relevant_cells = [
        cell
        for index, cell in enumerate(code_cells)
        if (index < target_index and cell.committed) or cell.id == target_cell_id
    ]
    # Preserve notebook display order (including markdown cells) for diagnostics
    cell_order = {cell.id: i + 1 for i, cell in enumerate(cells)}
    parts = [split_cell(cell, cell_order.get(cell.id, index + 1) - 1) for index, cell in enumerate(relevant_cells)]
    filename_to_cell = {_safe_filename(cell.id): cell.id for cell in relevant_cells}

    includes = _dedupe(
        ["#include <iostream>", "#include <sstream>", "#include <exception>", "#include <cstdio>"]
        + [include for part in parts for include in part.includes]
    )

    lines: list[str] = []
    lines.extend(includes)
    _append_line(lines)
    _append_line(lines, "using namespace std;")
    _append_line(lines)

    # Runtime stream redirection controller for global initialization and main()
    _append_line(lines, "// ===== CppBook Runtime Stream Controller =====")
    _append_line(lines, "namespace __cppbook_runtime {")
    _append_line(lines, "    static std::ostringstream __silent_cout;")
    _append_line(lines, "    static std::ostringstream __silent_cerr;")
    _append_line(lines, "    static std::streambuf* __orig_cout = nullptr;")
    _append_line(lines, "    static std::streambuf* __orig_cerr = nullptr;")
    _append_line(lines)
    _append_line(lines, "    struct __Silencer {")
    _append_line(lines, "        __Silencer() {")
    _append_line(lines, "            if (!__orig_cout) __orig_cout = std::cout.rdbuf();")
    _append_line(lines, "            if (!__orig_cerr) __orig_cerr = std::cerr.rdbuf();")
    _append_line(lines, "            std::cout.rdbuf(__silent_cout.rdbuf());")
    _append_line(lines, "            std::cerr.rdbuf(__silent_cerr.rdbuf());")
    _append_line(lines, "        }")
    _append_line(lines, "    };")
    _append_line(lines)
    _append_line(lines, "    struct __Restorer {")
    _append_line(lines, "        __Restorer() {")
    _append_line(lines, "            if (__orig_cout) std::cout.rdbuf(__orig_cout);")
    _append_line(lines, "            if (__orig_cerr) std::cerr.rdbuf(__orig_cerr);")
    _append_line(lines, "        }")
    _append_line(lines, "    };")
    _append_line(lines, "}")
    _append_line(lines)

    has_prior_cells = any(part.cell.id != target_cell_id for part in parts)
    if has_prior_cells:
        _append_line(lines, "// Silence static initialization for replayed prior cells")
        _append_line(lines, "static __cppbook_runtime::__Silencer __cppnb_pre_silencer;")
        _append_line(lines)

    # Deduplicate variable declarations across cells (latest cell declaration overrides earlier ones)
    var_to_latest_cell: dict[str, str] = {}
    for part in parts:
        for chunk in part.globals:
            vname = _declared_var_name(chunk)
            if vname:
                var_to_latest_cell[vname] = part.cell.id

    for part in parts:
        is_target = part.cell.id == target_cell_id
        if is_target and has_prior_cells:
            _append_line(lines, "// Restore standard output for target cell static initialization")
            _append_line(lines, "static __cppbook_runtime::__Restorer __cppnb_target_restorer;")
            _append_line(lines)

        if not part.globals:
            continue
        filtered_globals = []
        for chunk in part.globals:
            vname = _declared_var_name(chunk)
            if vname and var_to_latest_cell.get(vname) != part.cell.id:
                continue
            filtered_globals.append(chunk)
        if not filtered_globals:
            continue

        cell_num = cell_order.get(part.cell.id, part.cell_index + 1)
        _append_line(lines, f"// ===== Global declarations from Cell {cell_num} =====")
        filename = _safe_filename(part.cell.id)
        for chunk in filtered_globals:
            _append_chunk(lines, chunk, filename)
        _append_line(lines)

    _append_line(lines, "int main() {")
    _append_line(lines, "    // Disable output buffering so cout prompts appear immediately in the terminal")
    _append_line(lines, "    std::setvbuf(stdout, nullptr, _IONBF, 0);")
    _append_line(lines, "    std::setvbuf(stderr, nullptr, _IONBF, 0);")
    _append_line(lines, "    if (!__cppbook_runtime::__orig_cout) __cppbook_runtime::__orig_cout = std::cout.rdbuf();")
    _append_line(lines, "    if (!__cppbook_runtime::__orig_cerr) __cppbook_runtime::__orig_cerr = std::cerr.rdbuf();")
    _append_line(lines, "    try {")

    for part in parts:
        is_target = part.cell.id == target_cell_id
        if is_target:
            _append_line(lines, "        if (__cppbook_runtime::__orig_cout) std::cout.rdbuf(__cppbook_runtime::__orig_cout);")
            _append_line(lines, "        if (__cppbook_runtime::__orig_cerr) std::cerr.rdbuf(__cppbook_runtime::__orig_cerr);")
        else:
            _append_line(lines, "        std::cout.rdbuf(__cppbook_runtime::__silent_cout.rdbuf());")
            _append_line(lines, "        std::cerr.rdbuf(__cppbook_runtime::__silent_cerr.rdbuf());")
        cell_num = cell_order.get(part.cell.id, part.cell_index + 1)
        _append_line(lines, f"        // ===== Cell {cell_num} =====")
        _append_line(lines, "        {")
        filename = _safe_filename(part.cell.id)
        for chunk in part.statements:
            _append_chunk(lines, chunk, filename, indent="            ")
        if part.main_function:
            function_name = _existing_user_main_name(part.main_function.text) or _main_function_name(part.cell.id)
            param_count = _main_parameter_count(part.main_function.text)
            if param_count == 0:
                _append_line(lines, f"            {function_name}();")
            elif param_count == 2:
                _append_line(lines, "            char __cppnb_arg0[] = \"cppbook\";")
                _append_line(lines, "            char* __cppnb_argv[] = { __cppnb_arg0, nullptr };")
                _append_line(lines, f"            {function_name}(1, __cppnb_argv);")
            else:
                _append_line(
                    lines,
                    '            std::cerr << "CppBook can run user main() with no parameters or (int, char**) only." << std::endl;',
                )
                _append_line(lines, "            return 103;")
        _append_line(lines, "        }")

    _append_line(lines, "        if (__cppbook_runtime::__orig_cout) std::cout.rdbuf(__cppbook_runtime::__orig_cout);")
    _append_line(lines, "        if (__cppbook_runtime::__orig_cerr) std::cerr.rdbuf(__cppbook_runtime::__orig_cerr);")
    _append_line(lines, "    } catch (const std::exception& ex) {")
    _append_line(lines, "        if (__cppbook_runtime::__orig_cout) std::cout.rdbuf(__cppbook_runtime::__orig_cout);")
    _append_line(lines, "        if (__cppbook_runtime::__orig_cerr) std::cerr.rdbuf(__cppbook_runtime::__orig_cerr);")
    _append_line(lines, '        std::cerr << "Unhandled C++ exception: " << ex.what() << std::endl;')
    _append_line(lines, "        return 101;")
    _append_line(lines, "    } catch (...) {")
    _append_line(lines, "        if (__cppbook_runtime::__orig_cout) std::cout.rdbuf(__cppbook_runtime::__orig_cout);")
    _append_line(lines, "        if (__cppbook_runtime::__orig_cerr) std::cerr.rdbuf(__cppbook_runtime::__orig_cerr);")
    _append_line(lines, '        std::cerr << "Unhandled non-standard C++ exception" << std::endl;')
    _append_line(lines, "        return 102;")
    _append_line(lines, "    }")
    _append_line(lines, "    return 0;")
    _append_line(lines, "}")
    _append_line(lines)

    return GeneratedSource("\n".join(lines), filename_to_cell, cell_order)


def build_export_source(cells: list[ExecutionCell]) -> str:
    code_cells = [cell for cell in cells if cell.type == "code" and cell.source.strip()]
    parts = [split_cell(cell, index) for index, cell in enumerate(code_cells)]
    parts_by_id = {part.cell.id: part for part in parts}
    includes = _dedupe(["#include <iostream>"] + [include for part in parts for include in part.includes])

    lines: list[str] = []
    lines.extend(includes)
    _append_line(lines)
    _append_line(lines, "using namespace std;")
    _append_line(lines)

    has_statements = any(part.statements for part in parts)
    for cell_index, cell in enumerate(cells, start=1):
        if cell.type == "markdown" and cell.source.strip():
            _append_markdown_comment(lines, cell.source, cell_index)
            _append_line(lines)
            continue

        part = parts_by_id.get(cell.id)
        if not part or not part.globals:
            continue
        _append_line(lines, f"// ===== Cell {cell_index} globals =====")
        for chunk in part.globals:
            if part.main_function and chunk.start_line == part.main_function.start_line:
                lines.extend(part.main_function.text.splitlines())
            else:
                lines.extend(chunk.text.splitlines())
        _append_line(lines)

    if has_statements:
        _append_line(lines, "int main() {")
        for cell_index, cell in enumerate(cells, start=1):
            part = parts_by_id.get(cell.id)
            if not part or not part.statements:
                continue
            _append_line(lines, f"    // ===== Cell {cell_index} =====")
            for chunk in part.statements:
                for raw in chunk.text.splitlines():
                    _append_line(lines, f"    {raw}")
            _append_line(lines)
        _append_line(lines, "    return 0;")
        _append_line(lines, "}")

    return "\n".join(lines).rstrip() + "\n"
