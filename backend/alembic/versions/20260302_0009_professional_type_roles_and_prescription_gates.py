"""add professional type fields and role-specific document enums

Revision ID: 20260302_0009
Revises: 20260302_0008
Create Date: 2026-03-02 15:05:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260302_0009"
down_revision = "20260302_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    professional_type_enum = sa.Enum("PSYCHIATRIST", "THERAPIST", name="professional_type")
    professional_type_enum.create(op.get_bind(), checkfirst=True)

    op.add_column("doctor_applications", sa.Column("professional_type", professional_type_enum, nullable=True))
    op.add_column("doctor_applications", sa.Column("license_issuing_authority", sa.String(length=255), nullable=True))
    op.add_column("doctor_applications", sa.Column("license_expiry_date", sa.Date(), nullable=True))
    op.add_column("doctor_applications", sa.Column("accreditation_body", sa.String(length=255), nullable=True))
    op.add_column("doctor_applications", sa.Column("legal_prescription_declaration", sa.Text(), nullable=True))
    op.add_column("doctor_applications", sa.Column("no_prescription_declaration", sa.Text(), nullable=True))
    op.add_column("doctor_applications", sa.Column("psychiatrist_prescription_ack", sa.Boolean(), nullable=True))
    op.add_column("doctor_applications", sa.Column("therapist_no_prescription_ack", sa.Boolean(), nullable=True))

    op.add_column("doctor_profiles", sa.Column("professional_type", professional_type_enum, nullable=True))

    op.execute("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'MEDICAL_DEGREE'")
    op.execute("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'PSYCHIATRY_SPECIALIZATION'")
    op.execute("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'ACTIVE_PRACTICE_PROOF'")
    op.execute("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'THERAPY_SPECIALIZATION'")
    op.execute("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'SPECIALIZATION_CERTIFICATE'")


def downgrade() -> None:
    op.drop_column("doctor_profiles", "professional_type")

    op.drop_column("doctor_applications", "therapist_no_prescription_ack")
    op.drop_column("doctor_applications", "psychiatrist_prescription_ack")
    op.drop_column("doctor_applications", "no_prescription_declaration")
    op.drop_column("doctor_applications", "legal_prescription_declaration")
    op.drop_column("doctor_applications", "accreditation_body")
    op.drop_column("doctor_applications", "license_expiry_date")
    op.drop_column("doctor_applications", "license_issuing_authority")
    op.drop_column("doctor_applications", "professional_type")

    sa.Enum(name="professional_type").drop(op.get_bind(), checkfirst=True)

