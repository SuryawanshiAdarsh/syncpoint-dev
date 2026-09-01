import logging

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from .config import settings
from .embeddings import build_embedding
from .llm import build_llm
from .prompts import EVIDENCE_MAPPING_SYSTEM, PROMPT_VERSION, render_evidence_user_prompt
from .rag import RagService, build_rag_prompt
from .schemas import (
    ClassifyRequest,
    ClassifyResponse,
    GapRequest,
    GapResponse,
    MapEvidenceRequest,
    MapEvidenceResponse,
    RagCitation,
    RagQueryRequest,
    RagQueryResponse,
)
from .vector_store import build_vector_store

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
log = logging.getLogger("syncpoint.ai")

llm = build_llm(settings.llm_provider, settings.llm_model, settings.llm_api_key)
embedder = build_embedding(settings.embedding_provider, settings.embedding_model)
vector_store = build_vector_store(settings.qdrant_url, embedder.dimensions)
rag = RagService(store=vector_store, embedder=embedder)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        n = await rag.ingest_demo_corpus()
        log.info("RAG ready: %d chunks ingested", n)
    except Exception as e:
        log.warning("RAG demo corpus ingest failed: %s (continuing)", e)
    yield


app = FastAPI(
    title="Syncpoint AI Service",
    version="0.1.0",
    description="Evidence classification, mapping, and gap analysis (MVP).",
    lifespan=lifespan,
)


@app.get("/health")
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


@app.post("/map-evidence", response_model=MapEvidenceResponse)
async def map_evidence(req: MapEvidenceRequest) -> MapEvidenceResponse:
    preview = (req.evidence.contentPreview or "")[:4000]
    system = EVIDENCE_MAPPING_SYSTEM
    user = render_evidence_user_prompt(
        req.control.code, req.control.title,
        req.control.description, req.control.category or "",
        req.evidence.name, req.evidence.sourceType, preview,
    )
    try:
        raw = await llm.generate_structured(system, user, schema_hint={})
    except NotImplementedError as e:
        raise HTTPException(status_code=503, detail=str(e))

    payload = {
        **raw,
        "provider": llm.name,
        "model": llm.model,
        "prompt_version": PROMPT_VERSION,
    }
    try:
        return MapEvidenceResponse(**payload)
    except ValueError as e:
        log.warning("map-evidence rejected due to guardrail: %s", e)
        raise HTTPException(status_code=422, detail=f"invalid structured output: {e}")


@app.post("/classify", response_model=ClassifyResponse)
async def classify(req: ClassifyRequest) -> ClassifyResponse:
    inner = await map_evidence(MapEvidenceRequest(control=req.control, evidence=req.evidence))
    return ClassifyResponse(
        classification=inner.classification,
        confidence=inner.confidence,
        provider=inner.provider,
        model=inner.model,
        prompt_version=inner.prompt_version,
    )


@app.post("/analyze-gap", response_model=GapResponse)
async def analyze_gap(req: GapRequest) -> GapResponse:
    if not req.supplied_evidence:
        return GapResponse(
            control_code=req.control.code,
            is_gap=True,
            missing_requirements=[f"No evidence supplied for {req.control.code}."],
            recommended_action=f"Upload evidence that demonstrates {req.control.title}.",
            provider=llm.name, model=llm.model, prompt_version=PROMPT_VERSION,
        )
    # Use the strongest available evidence — first item is treated as best.
    mr = await map_evidence(MapEvidenceRequest(control=req.control, evidence=req.supplied_evidence[0]))
    return GapResponse(
        control_code=req.control.code,
        is_gap=mr.classification != "COVERED",
        missing_requirements=mr.missing_requirements,
        recommended_action=mr.recommended_action or "Provide additional supporting evidence.",
        provider=mr.provider, model=mr.model, prompt_version=mr.prompt_version,
    )


@app.post("/rag/query", response_model=RagQueryResponse)
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
