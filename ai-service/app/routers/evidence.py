"""Evidence classification + mapping + gap analysis endpoints."""
from __future__ import annotations

import logging

from fastapi import APIRouter

from ..errors import AiUnavailableError, AiValidationError
from ..prompts import EVIDENCE_MAPPING_SYSTEM, PROMPT_VERSION, render_evidence_user_prompt
from ..schemas import (
    ClassifyRequest,
    ClassifyResponse,
    GapRequest,
    GapResponse,
    MapEvidenceRequest,
    MapEvidenceResponse,
)
from ..services import llm


log = logging.getLogger(__name__)
router = APIRouter(tags=["evidence"])

MAX_PREVIEW_CHARS = 4000


@router.post("/map-evidence", response_model=MapEvidenceResponse)
async def map_evidence(req: MapEvidenceRequest) -> MapEvidenceResponse:
    preview = (req.evidence.contentPreview or "")[:MAX_PREVIEW_CHARS]
    user_prompt = render_evidence_user_prompt(
        req.control.code, req.control.title,
        req.control.description, req.control.category or "",
        req.evidence.name, req.evidence.sourceType, preview,
    )
    try:
        raw = await llm.generate_structured(EVIDENCE_MAPPING_SYSTEM, user_prompt, schema_hint={})
    except NotImplementedError as e:
        raise AiUnavailableError(str(e))

    try:
        return MapEvidenceResponse(
            **raw,
            provider=llm.name,
            model=llm.model,
            prompt_version=PROMPT_VERSION,
        )
    except ValueError as e:
        log.warning("map-evidence rejected due to guardrail: %s", e)
        raise AiValidationError(f"invalid structured output: {e}")


@router.post("/classify", response_model=ClassifyResponse)
async def classify(req: ClassifyRequest) -> ClassifyResponse:
    inner = await map_evidence(MapEvidenceRequest(control=req.control, evidence=req.evidence))
    return ClassifyResponse(
        classification=inner.classification,
        confidence=inner.confidence,
        provider=inner.provider,
        model=inner.model,
        prompt_version=inner.prompt_version,
    )


@router.post("/analyze-gap", response_model=GapResponse)
async def analyze_gap(req: GapRequest) -> GapResponse:
    if not req.supplied_evidence:
        return GapResponse(
            control_code=req.control.code,
            is_gap=True,
            missing_requirements=[f"No evidence supplied for {req.control.code}."],
            recommended_action=f"Upload evidence that demonstrates {req.control.title}.",
            provider=llm.name, model=llm.model, prompt_version=PROMPT_VERSION,
        )
    mr = await map_evidence(MapEvidenceRequest(control=req.control, evidence=req.supplied_evidence[0]))
    return GapResponse(
        control_code=req.control.code,
        is_gap=mr.classification != "COVERED",
        missing_requirements=mr.missing_requirements,
        recommended_action=mr.recommended_action or "Provide additional supporting evidence.",
        provider=mr.provider, model=mr.model, prompt_version=mr.prompt_version,
    )
