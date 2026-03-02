"""add therapist directory filter fields

Revision ID: 20260226_0003
Revises: 20260226_0002
Create Date: 2026-02-26 16:45:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260226_0003"
down_revision = "20260226_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "doctor_profiles",
        sa.Column("concerns", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "doctor_profiles",
        sa.Column("therapy_approaches", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column("doctor_profiles", sa.Column("gender_identity", sa.String(length=40), nullable=True))
    op.add_column(
        "doctor_profiles",
        sa.Column("insurance_providers", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column("doctor_profiles", sa.Column("next_available_at", sa.DateTime(timezone=True), nullable=True))

    op.add_column(
        "doctor_applications",
        sa.Column("concerns", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "doctor_applications",
        sa.Column("therapy_approaches", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column("doctor_applications", sa.Column("gender_identity", sa.String(length=40), nullable=True))
    op.add_column(
        "doctor_applications",
        sa.Column("insurance_providers", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )

    op.create_index(
        "ix_doctor_profiles_concerns_gin",
        "doctor_profiles",
        ["concerns"],
        unique=False,
        postgresql_using="gin",
    )
    op.create_index(
        "ix_doctor_profiles_therapy_approaches_gin",
        "doctor_profiles",
        ["therapy_approaches"],
        unique=False,
        postgresql_using="gin",
    )
    op.create_index(
        "ix_doctor_profiles_insurance_providers_gin",
        "doctor_profiles",
        ["insurance_providers"],
        unique=False,
        postgresql_using="gin",
    )
    op.create_index(
        "ix_doctor_profiles_gender_identity",
        "doctor_profiles",
        ["gender_identity"],
        unique=False,
    )
    op.create_index(
        "ix_doctor_profiles_next_available_at",
        "doctor_profiles",
        ["next_available_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_doctor_profiles_next_available_at", table_name="doctor_profiles")
    op.drop_index("ix_doctor_profiles_gender_identity", table_name="doctor_profiles")
    op.drop_index("ix_doctor_profiles_insurance_providers_gin", table_name="doctor_profiles")
    op.drop_index("ix_doctor_profiles_therapy_approaches_gin", table_name="doctor_profiles")
    op.drop_index("ix_doctor_profiles_concerns_gin", table_name="doctor_profiles")

    op.drop_column("doctor_applications", "insurance_providers")
    op.drop_column("doctor_applications", "gender_identity")
    op.drop_column("doctor_applications", "therapy_approaches")
    op.drop_column("doctor_applications", "concerns")

    op.drop_column("doctor_profiles", "next_available_at")
    op.drop_column("doctor_profiles", "insurance_providers")
    op.drop_column("doctor_profiles", "gender_identity")
    op.drop_column("doctor_profiles", "therapy_approaches")
    op.drop_column("doctor_profiles", "concerns")
