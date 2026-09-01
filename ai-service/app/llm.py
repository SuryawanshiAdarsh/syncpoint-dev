"""Provider-agnostic LLM abstraction (PROJECT_SPEC2 §30)."""
from __future__ import annotations

import abc
import json
from typing import Any, Dict


class LLMProvider(abc.ABC):
    """Adapter contract; concrete providers must be swappable via config."""

    #: Human-readable provider name (e.g. ``openai``, ``stub``).
    name: str = "unknown"

    #: Model identifier (e.g. ``gpt-4o-mini``, ``stub-1``).
    model: str = "unknown"

    @abc.abstractmethod
    async def generate_structured(self, system: str, user: str, schema_hint: Dict[str, Any]) -> Dict[str, Any]:
        """Return a JSON-object conforming to ``schema_hint``.

        Callers must validate the returned dict against their Pydantic schema.
        """
        raise NotImplementedError


class StubLLMProvider(LLMProvider):
    """Deterministic mock provider used when no real LLM is configured.

    It looks for keywords in the prompt and returns a stable structured output.
    This lets the whole product be demoed without any external API key.
    """

    name = "stub"

    def __init__(self, model: str = "stub-1") -> None:
        self.model = model

    async def generate_structured(self, system: str, user: str, schema_hint: Dict[str, Any]) -> Dict[str, Any]:
        text = (system + "\n" + user).lower()
        classification = "PARTIAL"
        confidence = 0.72
        reason = (
            "Evidence contains relevant signals aligned with the control's scope, "
            "but does not yet demonstrate every requirement described."
        )
        supported = ["Documented artifact captured from an authoritative source"]
        missing = ["Periodic review evidence", "Approval trail"]
        recommended = "Upload the most recent approved review record for this control."

        if any(k in text for k in ("iam", "mfa", "access review", "cc6.3", "cc6.6")):
            classification = "PARTIAL"
            supported = ["Current user access snapshot present"]
            missing = ["Periodic access review sign-off"]
            recommended = "Attach the latest quarterly access review with approver signatures."
        elif "branch protection" in text or "change management" in text or "cc8." in text:
            classification = "COVERED" if "protected" in text else "PARTIAL"
            supported = ["Change-control configuration observed on default branches"]
            missing = [] if classification == "COVERED" else ["Peer review policy evidence"]
            recommended = "" if classification == "COVERED" else "Provide the written peer-review policy."
        elif "backup" in text or "availability" in text:
            classification = "INSUFFICIENT"
            supported = []
            missing = ["Backup schedule", "Restore test results"]
            recommended = "Provide the last backup schedule and the most recent successful restore test."

        return {
            "classification": classification,
            "confidence": confidence,
            "reason": reason,
            "supported_requirements": supported,
            "missing_requirements": missing,
            "recommended_action": recommended,
        }


class OpenAILLMProvider(LLMProvider):
    """Skeleton for a real OpenAI-compatible provider. Not activated by default.

    We deliberately keep this as a stub in code so that no request is made and
    no key is required unless the operator explicitly wires it up.
    """

    name = "openai"

    def __init__(self, model: str = "gpt-4o-mini", api_key: str = "") -> None:
        self.model = model
        self.api_key = api_key

    async def generate_structured(self, system: str, user: str, schema_hint: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError(
            "OpenAI provider not wired in this build; set LLM_PROVIDER=stub or "
            "implement the HTTP call before enabling."
        )


def build_llm(provider_name: str, model: str, api_key: str) -> LLMProvider:
    key = (provider_name or "").strip().lower()
    if key in ("", "stub", "mock"):
        return StubLLMProvider(model=model or "stub-1")
    if key == "openai":
        return OpenAILLMProvider(model=model or "gpt-4o-mini", api_key=api_key)
    raise ValueError(f"unknown LLM_PROVIDER: {provider_name!r}")


__all__ = ["LLMProvider", "StubLLMProvider", "OpenAILLMProvider", "build_llm"]
