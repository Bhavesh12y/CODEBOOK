from __future__ import annotations

from app.ai.service import create_ai_service
from app.config import get_settings
from app.execution.kernel_router import KernelRouter
from app.notebook.repository import NotebookRepository


settings = get_settings()
notebook_repository = NotebookRepository(settings)
notebook_repository.ensure_examples()
kernel_router = KernelRouter(settings)
kernel_manager = kernel_router  # Alias for backward compatibility
ai_service = create_ai_service()
