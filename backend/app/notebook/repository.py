from __future__ import annotations

import json
import re
import uuid
from pathlib import Path

from pydantic import ValidationError

from app.config import Settings, get_settings
from app.models.execution import ExecutionCell
from app.models.notebook import NotebookDocument, NotebookMetadata, NotebookSummary, ProjectFile, utc_now
from app.notebook.exporter import export_notebook_cpp, export_notebook_cppnb, export_notebook_pdf


IGNORE_DIRS = {".git", ".venv", "node_modules", "__pycache__", ".pytest_cache", "dist", ".vite"}
VISIBLE_EXTENSIONS = {".cppnb", ".cpp", ".hpp", ".h", ".md", ".txt", ".json"}


def _dump_model(model: object) -> dict:
    if hasattr(model, "model_dump"):
        return model.model_dump(mode="json")  # type: ignore[attr-defined]
    return model.dict()  # type: ignore[attr-defined]


def _slugify(value: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9_-]+", "-", value.strip()).strip("-").lower()
    return slug or f"notebook-{uuid.uuid4().hex[:8]}"


class NotebookFormatError(ValueError):
    pass


class NotebookRepository:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.workspace_dir = self.settings.workspace_dir.resolve()
        self.notebooks_dir = self.settings.notebooks_dir.resolve()
        self.examples_dir = self.settings.examples_dir.resolve()
        self.notebooks_dir.mkdir(parents=True, exist_ok=True)
        self.examples_dir.mkdir(parents=True, exist_ok=True)

    def list(self) -> list[NotebookSummary]:
        summaries: list[NotebookSummary] = []
        for path in sorted(self.notebooks_dir.glob("*.cppnb"), key=lambda item: item.stat().st_mtime, reverse=True):
            try:
                notebook = self.load(path.stem)
            except NotebookFormatError:
                summaries.append(
                    NotebookSummary(
                        id=path.stem,
                        name=path.stem,
                        path=self._relative(path),
                        updatedAt=None,
                        cellCount=0,
                    )
                )
                continue
            summaries.append(
                NotebookSummary(
                    id=path.stem,
                    name=notebook.metadata.name,
                    path=self._relative(path),
                    updatedAt=notebook.metadata.updatedAt,
                    cellCount=len(notebook.cells),
                )
            )
        return summaries

    def load(self, notebook_id: str) -> NotebookDocument:
        path = self._notebook_path(notebook_id)
        if not path.exists():
            raise FileNotFoundError(notebook_id)
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            notebook = NotebookDocument(**payload)
        except (json.JSONDecodeError, ValidationError, TypeError) as exc:
            raise NotebookFormatError(f"Malformed notebook file: {path.name}") from exc
        notebook.id = path.stem
        return notebook

    def save(self, notebook: NotebookDocument, notebook_id: str | None = None) -> NotebookDocument:
        if not notebook.cells:
            notebook.cells = []
        resolved_id = _slugify(notebook_id or notebook.id or notebook.metadata.name)
        if (self.notebooks_dir / f"{resolved_id}.cppnb").exists() and notebook_id is None and notebook.id is None:
            resolved_id = f"{resolved_id}-{uuid.uuid4().hex[:6]}"

        now = utc_now()
        if not notebook.metadata.createdAt:
            notebook.metadata.createdAt = now
        notebook.metadata.updatedAt = now
        notebook.id = resolved_id
        path = self._notebook_path(resolved_id)
        path.write_text(json.dumps(_dump_model(notebook), indent=2), encoding="utf-8")
        return notebook

    def delete(self, notebook_id: str) -> None:
        path = self._notebook_path(notebook_id)
        if not path.exists():
            raise FileNotFoundError(notebook_id)
        path.unlink()

    def rename(self, notebook_id: str, name: str) -> NotebookDocument:
        current_path = self._notebook_path(notebook_id)
        if not current_path.exists():
            raise FileNotFoundError(notebook_id)

        notebook = self.load(notebook_id)
        target_id = _slugify(name)
        target_path = self._notebook_path(target_id)
        if target_path.exists() and target_path.resolve() != current_path.resolve():
            target_id = f"{target_id}-{uuid.uuid4().hex[:6]}"
            target_path = self._notebook_path(target_id)

        notebook.id = target_id
        notebook.metadata.name = name.strip() or notebook.metadata.name
        notebook.metadata.updatedAt = utc_now()
        target_path.write_text(json.dumps(_dump_model(notebook), indent=2), encoding="utf-8")
        if target_path.resolve() != current_path.resolve():
            current_path.unlink()
        return notebook

    def import_cpp(self, filename: str, source: str) -> NotebookDocument:
        base_name = Path(filename).stem or "Imported C++"
        notebook = NotebookDocument(
            metadata=NotebookMetadata(name=base_name),
            cells=[
                {
                    "id": f"cell-{uuid.uuid4().hex[:8]}",
                    "type": "code",
                    "source": source,
                    "outputs": [],
                    "executionCount": None,
                }
            ],
        )
        return self.save(notebook)

    def export_cpp(self, notebook_id: str) -> str:
        notebook = self.load(notebook_id)
        cells = [ExecutionCell(id=cell.id, type=cell.type, source=cell.source) for cell in notebook.cells]
        return export_notebook_cpp(cells)

    def export_cppnb(self, notebook_id: str) -> str:
        notebook = self.load(notebook_id)
        return export_notebook_cppnb(_dump_model(notebook))

    def export_pdf(self, notebook_id: str) -> bytes:
        notebook = self.load(notebook_id)
        return export_notebook_pdf(notebook.cells, notebook.metadata.name)

    def list_project_files(self, max_depth: int = 3) -> list[ProjectFile]:
        return self._children_for(self.workspace_dir, depth=0, max_depth=max_depth)

    def ensure_examples(self) -> None:
        examples = {
            "hello-world": [
                ("markdown", "# Hello World\nA minimal C++ notebook."),
                ("code", '#include <iostream>\nusing namespace std;\n\ncout << "Hello from CppBook!" << endl;'),
            ],
            "variables": [
                ("code", "#include <iostream>\nusing namespace std;\n\nint x = 10;"),
                ("code", "x += 20;\ncout << x;"),
                ("code", "cout << x * 2;"),
            ],
            "stl-algorithms": [
                ("markdown", "# STL Algorithms"),
                ("code", "#include <iostream>\n#include <vector>\n#include <algorithm>\n\nstd::vector<int> nums = {5, 2, 8, 1, 9};"),
                ("code", "std::sort(nums.begin(), nums.end());"),
                ("code", 'for (int x : nums) {\n    std::cout << x << " ";\n}'),
            ],
            "functions-and-classes": [
                ("code", "#include <iostream>\n#include <string>\nusing namespace std;"),
                ("code", "int square(int value) {\n    return value * value;\n}"),
                ("code", "class Person {\npublic:\n    string name;\n    explicit Person(string n) : name(n) {}\n};"),
                ("code", 'Person user("Bhavesh");\ncout << user.name << " " << square(7);'),
            ],
            "data-structures": [
                ("code", "#include <iostream>\n#include <queue>\n#include <string>\nusing namespace std;"),
                ("code", 'queue<string> tasks;\ntasks.push("parse");\ntasks.push("compile");\ntasks.push("run");'),
                ("code", 'while (!tasks.empty()) {\n    cout << tasks.front() << "\\n";\n    tasks.pop();\n}'),
            ],
        }

        for name, cells in examples.items():
            path = self.notebooks_dir / f"{name}.cppnb"
            if path.exists():
                continue
            notebook = NotebookDocument(
                id=name,
                metadata=NotebookMetadata(name=name.replace("-", " ").title()),
                cells=[
                    {
                        "id": f"{name}-{index + 1}",
                        "type": cell_type,
                        "source": source,
                        "outputs": [],
                        "executionCount": None,
                    }
                    for index, (cell_type, source) in enumerate(cells)
                ],
            )
            self.save(notebook, notebook_id=name)

    def _notebook_path(self, notebook_id: str) -> Path:
        safe_id = _slugify(notebook_id)
        path = (self.notebooks_dir / f"{safe_id}.cppnb").resolve()
        if self.notebooks_dir not in path.parents and path != self.notebooks_dir:
            raise ValueError("Notebook path escapes workspace.")
        return path

    def _relative(self, path: Path) -> str:
        try:
            return str(path.resolve().relative_to(self.workspace_dir)).replace("\\", "/")
        except ValueError:
            return path.name

    def _children_for(self, directory: Path, depth: int, max_depth: int) -> list[ProjectFile]:
        if depth >= max_depth:
            return []
        children: list[ProjectFile] = []
        try:
            entries = sorted(directory.iterdir(), key=lambda item: (item.is_file(), item.name.lower()))
        except OSError:
            return children
        for entry in entries:
            if entry.name in IGNORE_DIRS:
                continue
            if entry.is_dir():
                nested = self._children_for(entry, depth + 1, max_depth)
                if nested or depth < 1:
                    children.append(
                        ProjectFile(name=entry.name, path=self._relative(entry), type="directory", children=nested)
                    )
                continue
            if entry.suffix.lower() in VISIBLE_EXTENSIONS:
                children.append(ProjectFile(name=entry.name, path=self._relative(entry), type="file"))
        return children
