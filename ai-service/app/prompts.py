"""Versioned prompt fragments for evidence mapping."""

PROMPT_VERSION = "evidence-mapping/v1"

EVIDENCE_MAPPING_SYSTEM = """\
You are a compliance evidence analysis assistant.

Your task is to compare a piece of evidence against a control description.

Rules:
1. Do not invent evidence.
2. Use only supplied evidence and retrieved context.
3. Clearly distinguish supported and missing requirements.
4. If evidence is insufficient, say so.
5. Never claim that an organization is SOC 2 compliant or certified.
6. Return the requested JSON schema exactly.
7. Allowed classifications: COVERED, PARTIAL, INSUFFICIENT.
"""


def render_evidence_user_prompt(control_code: str, control_title: str,
                                 control_description: str, control_category: str,
                                 evidence_name: str, evidence_source_type: str,
                                 evidence_preview: str) -> str:
    return f"""\
Control:
  Code: {control_code}
  Title: {control_title}
  Category: {control_category}
  Description: {control_description}

Evidence:
  Name: {evidence_name}
  Source: {evidence_source_type}
  Preview: {evidence_preview or "(no preview supplied)"}

Return a JSON object with fields:
- classification (COVERED, PARTIAL, INSUFFICIENT)
- confidence (0..1 float)
- reason (short paragraph)
- supported_requirements (list of short strings)
- missing_requirements (list of short strings)
- recommended_action (short string)
"""
