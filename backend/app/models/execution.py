from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


CellType = Literal["code", "markdown"]
ExecutionStatus = Literal["success", "error", "stopped"]
ExecutionMode = Literal["cell"]


class ExecutionCell(BaseModel):
    id: str
    type: CellType = "code"
    source: str = ""
    # True when this cell previously executed successfully and may be replayed
    # as notebook state. Failed / idle / stopped cells stay false so they do
    # not poison independent later cells.
    committed: bool = False


class ExecutionDiagnostic(BaseModel):
    cellId: str | None = None
    line: int | None = None
    column: int | None = None
    severity: str = "error"
    message: str
    raw: str | None = None


class VariableSnapshot(BaseModel):
    name: str
    type: str
    value: str


class ExecuteRequest(BaseModel):
    notebookId: str
    cellId: str
    code: str = ""
    stdin: str = ""
    executionMode: ExecutionMode = "cell"
    language: str = "cpp"
    cells: list[ExecutionCell] = Field(default_factory=list)


class ExecuteAllRequest(BaseModel):
    notebookId: str
    cells: list[ExecutionCell] = Field(default_factory=list)
    continueOnError: bool = False
    stdin: str = ""
    language: str = "cpp"


class ExecutionResult(BaseModel):
    status: ExecutionStatus
    stdout: str = ""
    stderr: str = ""
    exitCode: int | None = None
    executionTime: float = 0.0
    diagnostics: list[ExecutionDiagnostic] = Field(default_factory=list)
    variables: list[VariableSnapshot] = Field(default_factory=list)
    message: str | None = None


class ExecuteAllCellResult(BaseModel):
    cellId: str
    result: ExecutionResult


class ExecuteAllResponse(BaseModel):
    status: ExecutionStatus
    results: list[ExecuteAllCellResult]
    executionTime: float


class CompilerInfo(BaseModel):
    available: bool
    compiler: str | None = None
    path: str | None = None
    version: str | None = None
    error: str | None = None


class ToolchainInfo(BaseModel):
    language: str
    available: bool
    name: str | None = None
    compiler: str | None = None
    path: str | None = None
    version: str | None = None
    error: str | None = None

    def model_post_init(self, __context: object) -> None:
        if self.compiler is None and self.name is not None:
            self.compiler = self.name
        elif self.name is None and self.compiler is not None:
            self.name = self.compiler
