"""extend doctor applications for public apply flow

Revision ID: 20260228_0005
Revises: 20260227_0004
Create Date: 2026-02-28 11:10:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260228_0005"
down_revision = "20260227_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = 'application_status' AND e.enumlabel = 'PENDING'
            ) THEN
                ALTER TYPE application_status ADD VALUE 'PENDING';
            END IF;
        END $$;
        """
    )

    op.alter_column("doctor_applications", "doctor_user_id", existing_type=postgresql.UUID(as_uuid=True), nullable=True)
    op.add_column("doctor_applications", sa.Column("full_name", sa.String(length=255), nullable=True))
    op.add_column("doctor_applications", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("doctor_applications", sa.Column("phone", sa.String(length=32), nullable=True))
    op.add_column("doctor_applications", sa.Column("photo_url", sa.String(length=1000), nullable=True))
    op.add_column("doctor_applications", sa.Column("national_id", sa.String(length=100), nullable=True))
    op.add_column("doctor_applications", sa.Column("license_number", sa.String(length=120), nullable=True))
    op.add_column("doctor_applications", sa.Column("specialty", sa.String(length=120), nullable=True))
    op.add_column(
        "doctor_applications",
        sa.Column("sub_specialties", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column("doctor_applications", sa.Column("short_bio", sa.Text(), nullable=True))
    op.add_column("doctor_applications", sa.Column("about", sa.Text(), nullable=True))
    op.add_column("doctor_applications", sa.Column("online_available", sa.Boolean(), nullable=True))
    op.add_column("doctor_applications", sa.Column("consultation_fee", sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column("doctor_applications", sa.Column("schedule", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("doctor_applications", sa.Column("license_document_url", sa.String(length=1000), nullable=True))
    op.add_column("doctor_applications", sa.Column("admin_note", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("doctor_applications", "admin_note")
    op.drop_column("doctor_applications", "license_document_url")
    op.drop_column("doctor_applications", "schedule")
    op.drop_column("doctor_applications", "consultation_fee")
    op.drop_column("doctor_applications", "online_available")
    op.drop_column("doctor_applications", "about")
    op.drop_column("doctor_applications", "short_bio")
    op.drop_column("doctor_applications", "sub_specialties")
    op.drop_column("doctor_applications", "specialty")
    op.drop_column("doctor_applications", "license_number")
    op.drop_column("doctor_applications", "national_id")
    op.drop_column("doctor_applications", "photo_url")
    op.drop_column("doctor_applications", "phone")
    op.drop_column("doctor_applications", "email")
    op.drop_column("doctor_applications", "full_name")
    op.alter_column("doctor_applications", "doctor_user_id", existing_type=postgresql.UUID(as_uuid=True), nullable=False)
