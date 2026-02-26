"""initial schema

Revision ID: 20260226_0001
Revises:
Create Date: 2026-02-26 10:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260226_0001"
down_revision = None
branch_labels = None
depends_on = None


user_role = sa.Enum("ADMIN", "DOCTOR", "USER", name="user_role")
user_status = sa.Enum("ACTIVE", "SUSPENDED", name="user_status")
application_status = sa.Enum(
    "DRAFT", "SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "NEEDS_CHANGES", name="application_status"
)
document_type = sa.Enum("LICENSE", "ID", "DEGREE", "OTHER", name="document_type")
document_status = sa.Enum("PENDING", "ACCEPTED", "REJECTED", name="document_status")
appointment_status = sa.Enum(
    "REQUESTED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW", name="appointment_status"
)


def upgrade() -> None:
    bind = op.get_bind()
    user_role.create(bind, checkfirst=True)
    user_status.create(bind, checkfirst=True)
    application_status.create(bind, checkfirst=True)
    document_type.create(bind, checkfirst=True)
    document_status.create(bind, checkfirst=True)
    appointment_status.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("status", user_status, nullable=False, server_default="ACTIVE"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "doctor_applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("doctor_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", application_status, nullable=False, server_default="DRAFT"),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("headline", sa.String(length=255), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("languages", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("specialties", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("session_types", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("location_country", sa.String(length=120), nullable=True),
        sa.Column("location_city", sa.String(length=120), nullable=True),
        sa.Column("years_experience", sa.Integer(), nullable=True),
        sa.Column("education", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("licenses", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("pricing_currency", sa.String(length=10), nullable=False, server_default="JOD"),
        sa.Column("pricing_per_session", sa.Numeric(10, 2), nullable=True),
        sa.Column("pricing_notes", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewer_admin_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("internal_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["doctor_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewer_admin_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_doctor_applications_doctor_user_id", "doctor_applications", ["doctor_user_id"], unique=True
    )

    op.create_table(
        "doctor_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("doctor_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("headline", sa.String(length=255), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("languages", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("specialties", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("session_types", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("location_country", sa.String(length=120), nullable=True),
        sa.Column("location_city", sa.String(length=120), nullable=True),
        sa.Column("years_experience", sa.Integer(), nullable=True),
        sa.Column("education", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("licenses_public", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("pricing_currency", sa.String(length=10), nullable=False, server_default="JOD"),
        sa.Column("pricing_per_session", sa.Numeric(10, 2), nullable=True),
        sa.Column("pricing_notes", sa.Text(), nullable=True),
        sa.Column("verification_badges", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["doctor_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_doctor_profiles_doctor_user_id", "doctor_profiles", ["doctor_user_id"], unique=True)

    op.create_table(
        "doctor_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", document_type, nullable=False),
        sa.Column("file_url", sa.String(length=500), nullable=False),
        sa.Column("status", document_status, nullable=False, server_default="PENDING"),
        sa.Column("admin_comment", sa.Text(), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["doctor_applications.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_doctor_documents_application_id", "doctor_documents", ["application_id"], unique=False)

    op.create_table(
        "doctor_availability_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("doctor_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("timezone", sa.String(length=64), nullable=False, server_default="Asia/Amman"),
        sa.Column("slot_duration_minutes", sa.Integer(), nullable=False, server_default="50"),
        sa.Column("buffer_minutes", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["doctor_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_doctor_availability_rules_doctor_user_id",
        "doctor_availability_rules",
        ["doctor_user_id"],
        unique=False,
    )

    op.create_table(
        "doctor_availability_exceptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("doctor_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("is_unavailable", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["doctor_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_doctor_availability_exceptions_doctor_user_id",
        "doctor_availability_exceptions",
        ["doctor_user_id"],
        unique=False,
    )

    op.create_table(
        "appointments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("doctor_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("timezone", sa.String(length=64), nullable=False),
        sa.Column("status", appointment_status, nullable=False, server_default="REQUESTED"),
        sa.Column("meeting_link", sa.String(length=500), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["doctor_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_appointments_doctor_user_id", "appointments", ["doctor_user_id"], unique=False)
    op.create_index("ix_appointments_user_id", "appointments", ["user_id"], unique=False)
    op.create_index("ix_appointments_start_at", "appointments", ["start_at"], unique=False)
    op.create_index(
        "ix_appointments_doctor_range",
        "appointments",
        ["doctor_user_id", "start_at", "end_at"],
        unique=False,
    )

    op.create_table(
        "admin_actions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("admin_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("action_type", sa.String(length=120), nullable=False),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["admin_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_admin_actions_admin_user_id", "admin_actions", ["admin_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_admin_actions_admin_user_id", table_name="admin_actions")
    op.drop_table("admin_actions")

    op.drop_index("ix_appointments_doctor_range", table_name="appointments")
    op.drop_index("ix_appointments_start_at", table_name="appointments")
    op.drop_index("ix_appointments_user_id", table_name="appointments")
    op.drop_index("ix_appointments_doctor_user_id", table_name="appointments")
    op.drop_table("appointments")

    op.drop_index(
        "ix_doctor_availability_exceptions_doctor_user_id",
        table_name="doctor_availability_exceptions",
    )
    op.drop_table("doctor_availability_exceptions")

    op.drop_index("ix_doctor_availability_rules_doctor_user_id", table_name="doctor_availability_rules")
    op.drop_table("doctor_availability_rules")

    op.drop_index("ix_doctor_documents_application_id", table_name="doctor_documents")
    op.drop_table("doctor_documents")

    op.drop_index("ix_doctor_profiles_doctor_user_id", table_name="doctor_profiles")
    op.drop_table("doctor_profiles")

    op.drop_index("ix_doctor_applications_doctor_user_id", table_name="doctor_applications")
    op.drop_table("doctor_applications")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    appointment_status.drop(op.get_bind(), checkfirst=True)
    document_status.drop(op.get_bind(), checkfirst=True)
    document_type.drop(op.get_bind(), checkfirst=True)
    application_status.drop(op.get_bind(), checkfirst=True)
    user_status.drop(op.get_bind(), checkfirst=True)
    user_role.drop(op.get_bind(), checkfirst=True)
