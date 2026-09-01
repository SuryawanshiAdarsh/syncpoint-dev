"""Provider-agnostic embedding abstraction (PROJECT_SPEC2 §31)."""
from __future__ import annotations

import abc
import hashlib
import math
from typing import List


class EmbeddingProvider(abc.ABC):
    name: str = "unknown"
    model: str = "unknown"
    dimensions: int = 0

    @abc.abstractmethod
    async def embed(self, texts: List[str]) -> List[List[float]]:
        raise NotImplementedError


class StubEmbeddingProvider(EmbeddingProvider):
    """Deterministic hash-based pseudo-embedding.

    Uses SHA-256 of the input to seed a bounded pseudo-random vector. Not
    semantically meaningful but stable and dependency-free — enough to prove
    the RAG plumbing before a real provider is plugged in.
    """

    name = "stub"

    def __init__(self, model: str = "stub-embed-1", dimensions: int = 128) -> None:
        self.model = model
        self.dimensions = dimensions

    async def embed(self, texts: List[str]) -> List[List[float]]:
        out: List[List[float]] = []
        for t in texts:
            digest = hashlib.sha256(t.encode("utf-8")).digest()
            vec: List[float] = []
            for i in range(self.dimensions):
                byte = digest[i % len(digest)]
                # map to [-1, 1] with a bit of positional twist so different
                # dimensions don't repeat
                v = ((byte + i) % 256) / 128.0 - 1.0
                vec.append(v)
            # unit-normalise
            norm = math.sqrt(sum(x * x for x in vec)) or 1.0
            out.append([x / norm for x in vec])
        return out


def build_embedding(provider_name: str, model: str) -> EmbeddingProvider:
    key = (provider_name or "").strip().lower()
    if key in ("", "stub", "mock"):
        return StubEmbeddingProvider(model=model or "stub-embed-1")
    raise ValueError(f"unknown EMBEDDING_PROVIDER: {provider_name!r}")


__all__ = ["EmbeddingProvider", "StubEmbeddingProvider", "build_embedding"]
