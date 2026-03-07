"""add appointment feedback fields

Revision ID: 20260305_0014
Revises: 20260304_0013
Create Date: 2026-03-05 12:00:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260305_0014"
down_revision = "20260304_0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("appointments", sa.Column("feedback_rating", sa.Integer(), nullable=True))
    op.add_column("appointments", sa.Column("feedback_comment", sa.Text(), nullable=True))
    op.add_column("appointments", sa.Column("feedback_submitted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("appointments", "feedback_submitted_at")
    op.drop_column("appointments", "feedback_comment")
    op.drop_column("appointments", "feedback_rating")

