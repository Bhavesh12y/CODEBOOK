from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.models.execution import ExecutionDiagnostic


CellType = Literal["code", "markdown"]
CellStatus = Literal["idle", "running", "success", "error", "stopped"]
OutputType = Literal["stdout", "stderr", "error", "markdown", "input"]


def utc_now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


class CellOutput(BaseModel):
    type: OutputType
    text: str
    diagnostics: list[ExecutionDiagnostic] = Field(default_factory=list)


class NotebookCell(BaseModel):
    id: str
    type: CellType = "code"
    source: str = ""
    outputs: list[CellOutput] = Field(default_factory=list)
    executionCount: int | None = None
    status: CellStatus = "idle"
    executionTime: float | None = None


class NotebookMetadata(BaseModel):
    name: str = "Untitled"
    description: str = ""
    language: str = "cpp"
    createdAt: str = Field(default_factory=utc_now)
    updatedAt: str = Field(default_factory=utc_now)


class NotebookDocument(BaseModel):
    version: int = 1
    id: str | None = None
    metadata: NotebookMetadata = Field(default_factory=NotebookMetadata)
    cells: list[NotebookCell] = Field(default_factory=list)


class NotebookSummary(BaseModel):
    id: str
    name: str
    path: str
    updatedAt: str | None = None
    cellCount: int = 0


class ProjectFile(BaseModel):
    name: str
    path: str
    type: Literal["file", "directory"]
    children: list["ProjectFile"] = Field(default_factory=list)


try:
    ProjectFile.model_rebuild()
except AttributeError:
    ProjectFile.update_forward_refs()
