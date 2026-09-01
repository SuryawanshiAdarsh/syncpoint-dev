"""Very simple whitespace/paragraph chunker.

MVP heuristic per PROJECT_SPEC §21 §34: aim for ~500-800 "tokens" (approximated
by whitespace-separated words) with 50-100 word overlap. Good enough for a demo
corpus; real productionization can swap in a token-aware chunker later.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List


@dataclass(frozen=True)
class Chunk:
    text: str
    section: str
    index: int


def chunk_text(text: str, section: str, *,
               target_words: int = 250, overlap_words: int = 40) -> List[Chunk]:
    words = text.split()
    if not words:
        return []
    out: List[Chunk] = []
    i = 0
    idx = 0
    step = max(1, target_words - overlap_words)
    while i < len(words):
        window = words[i:i + target_words]
        if not window:
            break
        out.append(Chunk(text=" ".join(window), section=section, index=idx))
        idx += 1
        if i + target_words >= len(words):
            break
        i += step
    return out


def chunk_documents(docs: Iterable[dict]) -> List[dict]:
    """Given [{'name': str, 'section': str, 'body': str}] produce chunk records."""
    results: List[dict] = []
    for doc in docs:
        for c in chunk_text(doc["body"], section=doc.get("section") or doc["name"]):
            results.append({
                "document": doc["name"],
                "section": c.section,
                "index": c.index,
                "text": c.text,
                "framework": doc.get("framework", "SOC2"),
                "framework_version": doc.get("framework_version", "2022"),
                "control_code": doc.get("control_code"),
                "source": doc.get("source", "syncpoint/demo-corpus"),
            })
    return results
