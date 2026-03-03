"""add doctor_type_code to doctor_profiles

Revision ID: 20260302_0008
Revises: 20260301_0007
Create Date: 2026-03-02 10:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260302_0008"
down_revision = "20260301_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("doctor_profiles", sa.Column("doctor_type_code", sa.String(length=3), nullable=True))
    op.create_index("ix_doctor_profiles_type_code", "doctor_profiles", ["doctor_type_code"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_doctor_profiles_type_code", table_name="doctor_profiles")
    op.drop_column("doctor_profiles", "doctor_type_code")
