from __future__ import annotations

import json

import pytest

from app.config import Settings
from app.models.notebook import NotebookDocument, NotebookMetadata
from app.notebook.repository import NotebookFormatError, NotebookRepository


def repo(tmp_path):
    return NotebookRepository(Settings(workspace_dir=tmp_path))


def test_notebook_save_load_roundtrip(tmp_path):
    repository = repo(tmp_path)
    notebook = NotebookDocument(
        metadata=NotebookMetadata(name="Round Trip"),
        cells=[{"id": "cell-1", "type": "code", "source": "int x = 1;"}],
    )

    saved = repository.save(notebook)
    loaded = repository.load(saved.id)

    assert loaded.metadata.name == "Round Trip"
    assert loaded.cells[0].source == "int x = 1;"


def test_malformed_notebook_raises_format_error(tmp_path):
    repository = repo(tmp_path)
    bad_path = repository.notebooks_dir / "bad.cppnb"
    bad_path.write_text("{not json", encoding="utf-8")

    with pytest.raises(NotebookFormatError):
        repository.load("bad")


def test_import_cpp_creates_single_code_cell(tmp_path):
    repository = repo(tmp_path)
    notebook = repository.import_cpp("hello.cpp", '#include <iostream>\nint main() { std::cout << "hi"; }')

    assert notebook.metadata.name == "hello"
    assert len(notebook.cells) == 1
    assert notebook.cells[0].type == "code"


def test_rename_notebook_changes_name_and_file_id(tmp_path):
    repository = repo(tmp_path)
    saved = repository.save(NotebookDocument(metadata=NotebookMetadata(name="Old Name")))

    renamed = repository.rename(saved.id, "Better Name")

    assert renamed.id == "better-name"
    assert renamed.metadata.name == "Better Name"
    assert not (repository.notebooks_dir / f"{saved.id}.cppnb").exists()
    assert (repository.notebooks_dir / "better-name.cppnb").exists()


def test_list_project_files_is_restricted_to_workspace(tmp_path):
    repository = repo(tmp_path)
    (tmp_path / "README.md").write_text("hello", encoding="utf-8")
    (tmp_path / ".git").mkdir()
    (tmp_path / ".git" / "config").write_text("private", encoding="utf-8")

    files = repository.list_project_files()
    encoded = json.dumps([item.model_dump() if hasattr(item, "model_dump") else item.dict() for item in files])
    assert "README.md" in encoded
    assert ".git" not in encoded
