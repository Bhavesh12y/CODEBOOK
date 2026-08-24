from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


AIScope = Literal["cell", "notebook"]
AITask = Literal["explain", "fix", "optimize", "enhance"]


class AIActionRequest(BaseModel):
    notebookId: str
    scope: AIScope = "cell"
    task: AITask = "explain"
    cellId: str | None = None
    source: str = ""
    notebookSource: str = ""
    stderr: str = ""
    aiEnabled: bool = False
    aiProvider: Literal["groq", "gemini", "openai-compatible"] = "groq"
    groqModel: str = "openai/gpt-oss-20b"
    geminiModel: str = "gemini-3.7-flash"
    groqApiKey: str = ""
    geminiApiKey: str = ""
    # Legacy fields are accepted only for safe migration from older settings.
    aiModel: str = ""
    apiKeys: list[str] = Field(default_factory=list)


class AIActionResponse(BaseModel):
    status: Literal["ok", "error"]
    suggestion: str


class AIChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class AIChatRequest(BaseModel):
    notebookId: str
    messages: list[AIChatMessage]
    notebookSource: str = ""
    cellId: str | None = None
    aiEnabled: bool = False
    aiProvider: Literal["groq", "gemini", "openai-compatible"] = "groq"
    groqModel: str = "openai/gpt-oss-20b"
    geminiModel: str = "gemini-3.7-flash"
    groqApiKey: str = ""
    geminiApiKey: str = ""
    # Legacy fields are accepted only for safe migration from older settings.
    aiModel: str = ""
    apiKeys: list[str] = Field(default_factory=list)


class AIChatResponse(BaseModel):
    status: Literal["ok", "error"]
    message: str

class AIConnectionTestRequest(BaseModel):
    provider: Literal["groq", "gemini"]
    apiKey: str
    model: str = ""


class AIConnectionTestResponse(BaseModel):
    status: Literal["connected", "limited", "invalid"]
    provider: Literal["groq", "gemini"]
    message: str
