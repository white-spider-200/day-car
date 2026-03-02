"""add doctor slug and top doctor fields

Revision ID: 20260227_0004
Revises: 20260226_0003
Create Date: 2026-02-27 16:05:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260227_0004"
down_revision = "20260226_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("doctor_profiles", sa.Column("slug", sa.String(length=255), nullable=True))
    op.add_column("doctor_profiles", sa.Column("approach_text", sa.Text(), nullable=True))
    op.add_column("doctor_profiles", sa.Column("clinic_name", sa.String(length=255), nullable=True))
    op.add_column("doctor_profiles", sa.Column("address_line", sa.String(length=255), nullable=True))
    op.add_column("doctor_profiles", sa.Column("map_url", sa.String(length=1000), nullable=True))
    op.add_column("doctor_profiles", sa.Column("availability_timezone", sa.String(length=64), nullable=True))
    op.add_column(
        "doctor_profiles",
        sa.Column("availability_preview_slots", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column("doctor_profiles", sa.Column("rating", sa.Numeric(precision=3, scale=2), nullable=True))
    op.add_column(
        "doctor_profiles",
        sa.Column("reviews_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "doctor_profiles",
        sa.Column("certifications", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column("doctor_profiles", sa.Column("follow_up_price", sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column(
        "doctor_profiles",
        sa.Column("is_top_doctor", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    op.execute(
        """
        UPDATE doctor_profiles
        SET slug = NULLIF(
            trim(BOTH '-' FROM regexp_replace(lower(COALESCE(display_name, 'doctor')), '[^a-z0-9]+', '-', 'g')),
            ''
        )
        WHERE slug IS NULL;
        """
    )
    op.execute(
        """
        UPDATE doctor_profiles
        SET slug = 'doctor-' || substring(replace(doctor_user_id::text, '-', '') from 1 for 8)
        WHERE slug IS NULL OR slug = '';
        """
    )

    op.alter_column("doctor_profiles", "slug", nullable=False)
    op.create_index("ix_doctor_profiles_slug", "doctor_profiles", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_doctor_profiles_slug", table_name="doctor_profiles")
    op.drop_column("doctor_profiles", "is_top_doctor")
    op.drop_column("doctor_profiles", "follow_up_price")
    op.drop_column("doctor_profiles", "certifications")
    op.drop_column("doctor_profiles", "reviews_count")
    op.drop_column("doctor_profiles", "rating")
    op.drop_column("doctor_profiles", "availability_preview_slots")
    op.drop_column("doctor_profiles", "availability_timezone")
    op.drop_column("doctor_profiles", "map_url")
    op.drop_column("doctor_profiles", "address_line")
    op.drop_column("doctor_profiles", "clinic_name")
    op.drop_column("doctor_profiles", "approach_text")
    op.drop_column("doctor_profiles", "slug")
