"""Qdrant-backed vector store with a graceful in-memory fallback."""
from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from typing import List, Optional


log = logging.getLogger(__name__)

COLLECTION = "syncpoint_rag"


@dataclass
class RetrievedChunk:
    document: str
    section: str
    text: str
    score: float
    framework: Optional[str] = None
    control_code: Optional[str] = None


class VectorStore:
    """Interface wrapper. Concrete impls: Qdrant or in-memory."""

    dimensions: int

    async def upsert(self, records: List[dict], vectors: List[List[float]]) -> None:
        raise NotImplementedError

    async def search(self, vector: List[float], top_k: int = 4,
                     framework: Optional[str] = None) -> List[RetrievedChunk]:
        raise NotImplementedError


class InMemoryVectorStore(VectorStore):
    """Fallback when Qdrant is unreachable. Small enough to be cheap."""

    def __init__(self, dimensions: int) -> None:
        self.dimensions = dimensions
        self._records: List[dict] = []
        self._vectors: List[List[float]] = []

    async def upsert(self, records: List[dict], vectors: List[List[float]]) -> None:
        self._records = list(records)
        self._vectors = list(vectors)

    async def search(self, vector: List[float], top_k: int = 4,
                     framework: Optional[str] = None) -> List[RetrievedChunk]:
        if not self._records:
            return []
        # cosine (both sides already unit-normalised for our stub embeddings)
        scored: List[tuple[float, dict]] = []
        for r, v in zip(self._records, self._vectors):
            if framework and r.get("framework") and r["framework"] != framework:
                continue
            s = sum(a * b for a, b in zip(vector, v))
            scored.append((s, r))
        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:top_k]
        return [
            RetrievedChunk(
                document=r["document"], section=r["section"], text=r["text"],
                score=float(s), framework=r.get("framework"), control_code=r.get("control_code"),
            )
            for s, r in top
        ]


class QdrantVectorStore(VectorStore):
    """Real Qdrant client. Uses the sync client wrapped for our async API."""

    def __init__(self, url: str, dimensions: int, collection: str = COLLECTION) -> None:
        from qdrant_client import QdrantClient
        from qdrant_client.models import Distance, VectorParams

        self.dimensions = dimensions
        self.collection = collection
        self.client = QdrantClient(url=url, timeout=10)
        try:
            self.client.get_collection(collection)
        except Exception:
            self.client.recreate_collection(
                collection_name=collection,
                vectors_config=VectorParams(size=dimensions, distance=Distance.COSINE),
            )

    async def upsert(self, records: List[dict], vectors: List[List[float]]) -> None:
        from qdrant_client.models import PointStruct
        points = [
            PointStruct(id=str(uuid.uuid4()), vector=vec, payload=rec)
            for rec, vec in zip(records, vectors)
        ]
        self.client.upsert(collection_name=self.collection, points=points, wait=True)

    async def search(self, vector: List[float], top_k: int = 4,
                     framework: Optional[str] = None) -> List[RetrievedChunk]:
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        flt = None
        if framework:
            flt = Filter(must=[FieldCondition(key="framework", match=MatchValue(value=framework))])
        results = self.client.search(
            collection_name=self.collection,
            query_vector=vector,
            limit=top_k,
            query_filter=flt,
        )
        out: List[RetrievedChunk] = []
        for r in results:
            p = r.payload or {}
            out.append(RetrievedChunk(
                document=p.get("document", "unknown"),
                section=p.get("section", ""),
                text=p.get("text", ""),
                score=float(r.score),
                framework=p.get("framework"),
                control_code=p.get("control_code"),
            ))
        return out


def build_vector_store(qdrant_url: str, dimensions: int) -> VectorStore:
    try:
        store = QdrantVectorStore(url=qdrant_url, dimensions=dimensions)
        log.info("using QdrantVectorStore at %s", qdrant_url)
        return store
    except Exception as e:
        log.warning("Qdrant unreachable (%s). Falling back to InMemoryVectorStore.", e)
        return InMemoryVectorStore(dimensions=dimensions)
