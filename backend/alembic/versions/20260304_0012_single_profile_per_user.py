"""enforce single patient profile per user

Revision ID: 20260304_0012
Revises: 20260304_0011
Create Date: 2026-03-04 12:20:00.000000
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260304_0012"
down_revision = "20260304_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint("uq_patient_records_user_id", "patient_records", ["user_id"])


def downgrade() -> None:
    op.drop_constraint("uq_patient_records_user_id", "patient_records", type_="unique")
