"""Public curated-companies directory endpoint.

Read-only: returns every enabled company with its directory content (blurb +
accomplishment), alphabetically by display name. Requires a signed-in user.
"""

import logging

import psycopg2
from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extensions import connection as Connection

from ..auth.dependencies import TokenClaims, get_current_user
from ..dependencies import get_db
from ..models import CompanyListResponse, CompanyProfileResponse
from ..services.companies_service import list_enabled_companies_with_profiles

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=CompanyListResponse)
def list_companies(
    conn: Connection = Depends(get_db),
    _user: TokenClaims = Depends(get_current_user),
) -> CompanyListResponse:
    try:
        rows = list_enabled_companies_with_profiles(conn)
    except psycopg2.Error:
        # Roll back so the pooled connection isn't returned in an aborted-
        # transaction state — the next get_db caller would otherwise hit
        # "current transaction is aborted" on their first statement.
        conn.rollback()
        logger.exception("Failed to list companies")
        raise HTTPException(status_code=500, detail="Failed to list companies")
    return CompanyListResponse(
        companies=[
            CompanyProfileResponse(
                id=r["id"],
                display_name=r["display_name"],
                ats=r["ats"],
                blurb=r["blurb"],
                accomplishment=r["accomplishment"],
            )
            for r in rows
        ]
    )
