"""add photo_url to doctor_profiles

Revision ID: 20260226_0002
Revises: 20260226_0001
Create Date: 2026-02-26 11:40:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260226_0002"
down_revision = "20260226_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("doctor_profiles", sa.Column("photo_url", sa.String(length=1000), nullable=True))


def downgrade() -> None:
    op.drop_column("doctor_profiles", "photo_url")

