"""RAG endpoints: retrieve + generate + (later) ingest."""
from __future__ import annotations

import logging

from fastapi import APIRouter

from ..prompts import PROMPT_VERSION
from ..rag import build_rag_prompt
from ..schemas import RagCitation, RagQueryRequest, RagQueryResponse
from ..services import llm, rag, vector_store


log = logging.getLogger(__name__)
router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/query", response_model=RagQueryResponse)
async def rag_query(req: RagQueryRequest) -> RagQueryResponse:
    retrieved = await rag.retrieve(req.query, top_k=req.top_k, framework=req.framework)
    system, user = build_rag_prompt(req.query, retrieved)
    raw = await llm.generate_structured(system, user, schema_hint={})
    citations = [
        RagCitation(document=c.document, section=c.section, score=round(c.score, 4))
        for c in retrieved
    ]
    return RagQueryResponse(
        query=req.query,
        answer=raw.get("reason", "") or raw.get("recommended_action", ""),
        citations=citations,
        provider=llm.name, model=llm.model, prompt_version=PROMPT_VERSION,
        context={"retrieved": len(retrieved), "vectorStore": type(vector_store).__name__},
    )
