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
VISIBLE_EXTENSIONS = {".cppnb", ".cbnb", ".cpp", ".hpp", ".h", ".c", ".py", ".java", ".md", ".txt", ".json"}


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
        paths = list(self.notebooks_dir.glob("*.cppnb")) + list(self.notebooks_dir.glob("*.cbnb"))
        for path in sorted(paths, key=lambda item: item.stat().st_mtime, reverse=True):
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
            if path.suffix == ".cppnb" or not payload.get("metadata", {}).get("language"):
                if "metadata" not in payload:
                    payload["metadata"] = {}
                payload["metadata"]["language"] = "cpp"
            notebook = NotebookDocument(**payload)
        except (json.JSONDecodeError, ValidationError, TypeError) as exc:
            raise NotebookFormatError(f"Malformed notebook file: {path.name}") from exc
        notebook.id = path.stem
        return notebook

    def save(self, notebook: NotebookDocument, notebook_id: str | None = None) -> NotebookDocument:
        if not notebook.cells:
            notebook.cells = []
        resolved_id = _slugify(notebook_id or notebook.id or notebook.metadata.name)
        
        # Check if existing with either extension
        path = None
        if notebook_id or notebook.id:
            try:
                path = self._notebook_path(resolved_id)
            except FileNotFoundError:
                pass
                
        if not path:
            path = (self.notebooks_dir / f"{resolved_id}.cbnb").resolve()
            if path.exists() and notebook_id is None and notebook.id is None:
                resolved_id = f"{resolved_id}-{uuid.uuid4().hex[:6]}"
                path = (self.notebooks_dir / f"{resolved_id}.cbnb").resolve()
        elif notebook_id is None and notebook.id is None and path.exists():
            resolved_id = f"{resolved_id}-{uuid.uuid4().hex[:6]}"
            path = (self.notebooks_dir / f"{resolved_id}.cbnb").resolve()

        if not hasattr(notebook, "version") or not notebook.version:
            notebook.version = 2

        now = utc_now()
        if not notebook.metadata.createdAt:
            notebook.metadata.createdAt = now
        notebook.metadata.updatedAt = now
        notebook.id = resolved_id
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

    def import_source(self, filename: str, source: str) -> NotebookDocument:
        path = Path(filename)
        base_name = path.stem or "Imported Source"
        ext = path.suffix.lower()
        
        language = "cpp"
        if ext in (".c", ".h"):
            language = "c"
        elif ext in (".cpp", ".cc", ".cxx", ".hpp"):
            language = "cpp"
        elif ext == ".py":
            language = "python"
        elif ext == ".java":
            language = "java"
            
        notebook = NotebookDocument(
            metadata=NotebookMetadata(name=base_name, language=language),
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
        
    def import_cpp(self, filename: str, source: str) -> NotebookDocument:
        return self.import_source(filename, source)

    def export_cpp(self, notebook_id: str) -> str:
        notebook = self.load(notebook_id)
        cells = [ExecutionCell(id=cell.id, type=cell.type, source=cell.source) for cell in notebook.cells]
        return export_notebook_cpp(cells)

    def export_cppnb(self, notebook_id: str) -> str:
        notebook = self.load(notebook_id)
        return export_notebook_cppnb(_dump_model(notebook))

    def export_pdf(self, notebook_id: str) -> bytes:
        notebook = self.load(notebook_id)
        return export_notebook_pdf(notebook.cells, notebook.metadata.name, notebook.metadata.language or "cpp")

    def list_project_files(self, max_depth: int = 3) -> list[ProjectFile]:
        return self._children_for(self.workspace_dir, depth=0, max_depth=max_depth)

    def ensure_examples(self) -> None:
        examples = {
            "hello-world": {
                "language": "cpp",
                "cells": [
                    ("markdown", "# Hello World (C++)\nA minimal C++ notebook."),
                    ("code", '#include <iostream>\nusing namespace std;\n\ncout << "Hello from CodeBook!" << endl;'),
                ]
            },
            "hello-c": {
                "language": "c",
                "cells": [
                    ("markdown", "# Hello World (C)\nA minimal C notebook."),
                    ("code", '#include <stdio.h>\n\nprintf("Hello from CodeBook C!\\n");'),
                ]
            },
            "hello-python": {
                "language": "python",
                "cells": [
                    ("markdown", "# Hello World (Python)\nA minimal Python notebook."),
                    ("code", 'print("Hello from CodeBook Python!")'),
                ]
            },
            "hello-java": {
                "language": "java",
                "cells": [
                    ("markdown", "# Hello World (Java)\nA minimal Java notebook."),
                    ("code", 'System.out.println("Hello from CodeBook Java!");'),
                ]
            }
        }

        for name, data in examples.items():
            path_cbnb = self.notebooks_dir / f"{name}.cbnb"
            path_cppnb = self.notebooks_dir / f"{name}.cppnb"
            if path_cbnb.exists() or path_cppnb.exists():
                continue
            notebook = NotebookDocument(
                id=name,
                metadata=NotebookMetadata(name=name.replace("-", " ").title(), language=data["language"]),
                cells=[
                    {
                        "id": f"{name}-{index + 1}",
                        "type": cell_type,
                        "source": source,
                        "outputs": [],
                        "executionCount": None,
                    }
                    for index, (cell_type, source) in enumerate(data["cells"])
                ],
            )
            self.save(notebook, notebook_id=name)

    def _notebook_path(self, notebook_id: str) -> Path:
        safe_id = _slugify(notebook_id)
        path_cbnb = (self.notebooks_dir / f"{safe_id}.cbnb").resolve()
        path_cppnb = (self.notebooks_dir / f"{safe_id}.cppnb").resolve()
        
        path = path_cbnb if path_cbnb.exists() else path_cppnb
        
        if self.notebooks_dir not in path.parents and path != self.notebooks_dir:
            raise ValueError("Notebook path escapes workspace.")
        if not path.exists() and not path_cppnb.exists():
            # If neither exists, default to .cbnb for new files (handled by save), but for reading throw error handled by caller.
            return path_cbnb
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
