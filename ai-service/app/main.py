"""FastAPI application entrypoint.

Composition only — every concrete endpoint lives in ``app/routers/*``.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from . import errors
from .logging_setup import RequestIdMiddleware, configure_logging
from .routers import evidence, health, rag
from .services import rag as rag_service


configure_logging()
log = logging.getLogger("syncpoint.ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        n = await rag_service.ingest_demo_corpus()
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

app.add_middleware(RequestIdMiddleware)
errors.register(app)

app.include_router(health.router)
app.include_router(evidence.router)
app.include_router(rag.router)
