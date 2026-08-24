from __future__ import annotations

from app.ai.service import create_ai_service
from app.config import get_settings
from app.execution.cpp_kernel import CppKernelManager
from app.notebook.repository import NotebookRepository


settings = get_settings()
notebook_repository = NotebookRepository(settings)
notebook_repository.ensure_examples()
kernel_manager = CppKernelManager(settings)
ai_service = create_ai_service()

