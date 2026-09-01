"""Singleton providers wired from config.

Isolating construction here means routers can import ``llm``/``embedder``/``rag``
without every module re-reading ``settings`` and re-instantiating providers.
"""
from __future__ import annotations

from .config import settings
from .embeddings import build_embedding
from .llm import build_llm
from .rag import RagService
from .vector_store import build_vector_store


llm = build_llm(settings.llm_provider, settings.llm_model, settings.llm_api_key)
embedder = build_embedding(settings.embedding_provider, settings.embedding_model)
vector_store = build_vector_store(settings.qdrant_url, embedder.dimensions)
rag = RagService(store=vector_store, embedder=embedder)
