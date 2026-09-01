"""Health endpoint router — reports provider identity for observability."""
from __future__ import annotations

from fastapi import APIRouter

from ..prompts import PROMPT_VERSION
from ..services import embedder, llm, rag, vector_store


router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    return {
        "status": "UP",
        "llmProvider": llm.name,
        "llmModel": llm.model,
        "embeddingProvider": embedder.name,
        "embeddingModel": embedder.model,
        "promptVersion": PROMPT_VERSION,
        "vectorStore": type(vector_store).__name__,
        "ragReady": rag.ready,
    }
