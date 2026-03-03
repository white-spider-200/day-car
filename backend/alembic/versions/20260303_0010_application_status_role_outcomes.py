"""add role-specific application statuses

Revision ID: 20260303_0010
Revises: 20260302_0009
Create Date: 2026-03-03 12:00:00.000000
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260303_0010"
down_revision = "20260302_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'UNDER_REVIEW'")
    op.execute("ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'APPROVED_MD'")
    op.execute("ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'APPROVED_THERAPIST'")
    op.execute("ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'NEEDS_MORE_INFO'")


def downgrade() -> None:
    # Postgres enum value removal is intentionally not automatic in downgrade.
    pass
