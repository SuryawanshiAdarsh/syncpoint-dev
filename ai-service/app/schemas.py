from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


class Control(BaseModel):
    code: str
    title: str
    description: str
    category: Optional[str] = None


class EvidenceMeta(BaseModel):
    id: str
    name: str
    sourceType: str
    sourceSystem: Optional[str] = None
    contentHash: Optional[str] = None
    mimeType: Optional[str] = None
    contentPreview: Optional[str] = Field(
        default=None,
        description="Small text/JSON preview supplied by the backend; may be truncated.",
    )


Classification = Literal["COVERED", "PARTIAL", "INSUFFICIENT"]


class MapEvidenceRequest(BaseModel):
    control: Control
    evidence: EvidenceMeta


class MapEvidenceResponse(BaseModel):
    classification: Classification
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str
    supported_requirements: List[str] = []
    missing_requirements: List[str] = []
    recommended_action: str = ""
    provider: str
    model: str
    prompt_version: str

    # AI must never say the customer is compliant. Reject stray classifications
    # even if the model tries to smuggle them in the reason text.
    @field_validator("reason")
    @classmethod
    def _reason_no_certification_claim(cls, v: str) -> str:
        for bad in ("SOC 2 compliant", "certified", "fully compliant"):
            if bad.lower() in v.lower():
                raise ValueError(f"disallowed phrase in reason: {bad!r}")
        return v


class ClassifyRequest(BaseModel):
    control: Control
    evidence: EvidenceMeta


class ClassifyResponse(BaseModel):
    classification: Classification
    confidence: float = Field(ge=0.0, le=1.0)
    provider: str
    model: str
    prompt_version: str


class GapRequest(BaseModel):
    control: Control
    supplied_evidence: List[EvidenceMeta] = []


class GapResponse(BaseModel):
    control_code: str
    is_gap: bool
    missing_requirements: List[str]
    recommended_action: str
    provider: str
    model: str
    prompt_version: str


class RagQueryRequest(BaseModel):
    query: str
    framework: Optional[str] = "SOC2"
    top_k: int = 4


class RagCitation(BaseModel):
    document: str
    section: Optional[str] = None
    score: Optional[float] = None


class RagQueryResponse(BaseModel):
    query: str
    answer: str
    citations: List[RagCitation]
    provider: str
    model: str
    prompt_version: str
    context: Dict[str, Any] = {}
