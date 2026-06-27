"""Infrastructure-level gate: require X-Internal-Key on every request.

This middleware proves "the call came from our Vercel proxy", not "who the
user is." JWT-based per-route auth still layers on top via the existing
Depends(get_current_user) / require_admin chain.
"""

import logging
import os
import secrets

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import RequestResponseEndpoint

from ..config import settings

logger = logging.getLogger(__name__)

# Paths that bypass the gate entirely. Railway health checks and uptime
# monitors cannot send the key, so gating these would break deploys.
_EXEMPT_PATHS = frozenset({"/health", "/health/worker"})

_HEADER_NAME = "X-Internal-Key"

# Local dev normally has none of these. Hosted backends set at least one.
_HOSTED_ENV_MARKERS = (
    "RAILWAY_ENVIRONMENT",
    "RAILWAY_PROJECT_ID",
    "RENDER",
    "FLY_APP_NAME",
)


async def require_internal_key(
    request: Request, call_next: RequestResponseEndpoint
) -> Response:
    """Reject requests missing or mismatching the configured shared secret."""
    if request.url.path in _EXEMPT_PATHS:
        return await call_next(request)

    expected = settings.internal_api_key
    if expected is None:
        return await call_next(request)

    presented = request.headers.get(_HEADER_NAME)
    if presented is None or not secrets.compare_digest(
        presented.encode("utf-8"), expected.encode("utf-8")
    ):
        return JSONResponse(
            status_code=401,
            content={"detail": "Unauthorized"},
        )

    return await call_next(request)


def warn_if_unset() -> None:
    """Warn locally, but fail closed on hosted deployments without a key."""
    if settings.internal_api_key is not None:
        return

    if any(os.environ.get(marker) for marker in _HOSTED_ENV_MARKERS):
        raise RuntimeError(
            "INTERNAL_API_KEY is unset on a hosted backend. Set the same "
            "secret on the backend and Vercel/serverless proxy so direct "
            "backend API requests are rejected."
        )

    logger.warning(
        "INTERNAL_API_KEY is unset - backend is accepting requests from "
        "any caller. This is OK for local dev; in production, set the "
        "env var so the require_internal_key middleware is enforced."
    )


__all__ = ["require_internal_key", "warn_if_unset"]
