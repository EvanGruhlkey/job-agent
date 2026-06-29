"""add job listings company/status/last_seen index

Revision ID: 9c6e2d4a8b10
Revises: 61a2e3f761b9
Create Date: 2026-06-28 21:45:00.000000

"""

from alembic import op


revision = "9c6e2d4a8b10"
down_revision = "61a2e3f761b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_job_listings_company_status_last_seen
        ON job_listings (company, status, last_seen_at DESC)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_job_listings_company_status_last_seen")
