"""Central error types + FastAPI exception handlers.

Emits the same JSON error shape as the Java backend so operators see one contract:
``{ "timestamp": "...", "status": 502, "code": "AI_ERROR", "message": "..." }``.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


log = logging.getLogger(__name__)


class AiError(Exception):
    """Base class for domain errors surfaced by this service."""

    status_code: int = 500
    code: str = "INTERNAL_ERROR"

    def __init__(self, message: str, *, status_code: int | None = None, code: str | None = None) -> None:
        super().__init__(message)
        if status_code is not None: self.status_code = status_code
        if code is not None: self.code = code


class AiValidationError(AiError):
    status_code = 422
    code = "VALIDATION_ERROR"


class AiUpstreamError(AiError):
    """LLM/embedding/vector-store failure that the caller can safely retry."""
    status_code = 502
    code = "AI_UPSTREAM_ERROR"


class AiUnavailableError(AiError):
    status_code = 503
    code = "AI_UNAVAILABLE"


def _payload(status: int, code: str, message: str, path: str) -> dict:
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "code": code,
        "message": message,
        "path": path,
    }


def register(app: FastAPI) -> None:
    """Attach handlers to the FastAPI app so every error has a consistent body."""

    @app.exception_handler(AiError)
    async def _ai_error(request: Request, exc: AiError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code,
                            content=_payload(exc.status_code, exc.code, str(exc), request.url.path))

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        msg = "; ".join(f"{'.'.join(str(x) for x in e['loc'])}: {e['msg']}" for e in exc.errors())
        return JSONResponse(status_code=422,
                            content=_payload(422, "VALIDATION_ERROR", msg or "Invalid request", request.url.path))

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code,
                            content=_payload(exc.status_code, "HTTP_ERROR",
                                             str(exc.detail) if exc.detail else "HTTP error",
                                             request.url.path))

    @app.exception_handler(Exception)
    async def _unexpected(request: Request, exc: Exception) -> JSONResponse:
        log.exception("unexpected error on %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500,
                            content=_payload(500, "INTERNAL_ERROR", "Unexpected error", request.url.path))
