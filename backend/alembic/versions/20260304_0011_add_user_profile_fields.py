"""add user profile fields

Revision ID: 20260304_0011
Revises: 20260303_0010
Create Date: 2026-03-04 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260304_0011"
down_revision = "20260303_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("name", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("age", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("country", sa.String(length=120), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "country")
    op.drop_column("users", "age")
    op.drop_column("users", "name")
