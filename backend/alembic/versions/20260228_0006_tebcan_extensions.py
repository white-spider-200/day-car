"""add tebcan-inspired platform extensions

Revision ID: 20260228_0006
Revises: 20260228_0005
Create Date: 2026-02-28 12:30:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260228_0006"
down_revision = "20260228_0005"
branch_labels = None
depends_on = None


appointment_call_status = postgresql.ENUM(
    "NOT_READY",
    "READY",
    "LIVE",
    "ENDED",
    name="appointment_call_status",
    create_type=False,
)
recurrence_type = postgresql.ENUM(
    "WEEKLY",
    "MONTHLY",
    name="recurrence_type",
    create_type=False,
)
payment_status = postgresql.ENUM(
    "PENDING",
    "PAID",
    "FAILED",
    "REFUNDED",
    name="payment_status",
    create_type=False,
)
treatment_request_status = postgresql.ENUM(
    "PENDING",
    "ACCEPTED",
    "DECLINED",
    name="treatment_request_status",
    create_type=False,
)
record_entry_type = postgresql.ENUM(
    "DIAGNOSIS",
    "PRESCRIPTION",
    "TEST_RESULT",
    "NOTE",
    name="record_entry_type",
    create_type=False,
)
referral_status = postgresql.ENUM(
    "PENDING",
    "ACCEPTED",
    "DECLINED",
    "COMPLETED",
    name="referral_status",
    create_type=False,
)
notification_channel = postgresql.ENUM(
    "IN_APP",
    "EMAIL",
    "SMS",
    name="notification_channel",
    create_type=False,
)
profile_update_status = postgresql.ENUM(
    "PENDING",
    "APPROVED",
    "REJECTED",
    name="profile_update_status",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()

    appointment_call_status.create(bind, checkfirst=True)
    recurrence_type.create(bind, checkfirst=True)
    payment_status.create(bind, checkfirst=True)
    treatment_request_status.create(bind, checkfirst=True)
    record_entry_type.create(bind, checkfirst=True)
    referral_status.create(bind, checkfirst=True)
    notification_channel.create(bind, checkfirst=True)
    profile_update_status.create(bind, checkfirst=True)

    op.add_column("appointments", sa.Column("call_provider", sa.String(length=64), nullable=True))
    op.add_column("appointments", sa.Column("call_room_id", sa.String(length=255), nullable=True))
    op.add_column(
        "appointments",
        sa.Column(
            "call_status",
            appointment_call_status,
            nullable=False,
            server_default="NOT_READY",
        ),
    )
    op.add_column(
        "appointments",
        sa.Column("fee_paid", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    op.add_column(
        "doctor_availability_rules",
        sa.Column("is_blocked", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column("doctor_availability_rules", sa.Column("effective_from", sa.Date(), nullable=True))
    op.add_column("doctor_availability_rules", sa.Column("effective_to", sa.Date(), nullable=True))

    op.add_column(
        "doctor_availability_exceptions",
        sa.Column("is_blocking", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.add_column(
        "doctor_availability_exceptions",
        sa.Column("is_recurring", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column("doctor_availability_exceptions", sa.Column("recurrence_type", recurrence_type, nullable=True))
    op.add_column(
        "doctor_availability_exceptions",
        sa.Column("recurrence_interval", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column("doctor_availability_exceptions", sa.Column("recurrence_until", sa.Date(), nullable=True))
    op.add_column("doctor_availability_exceptions", sa.Column("weekday", sa.Integer(), nullable=True))

    op.create_table(
        "waiting_list",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("appointment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("appointment_id", "position", name="uq_waiting_list_appointment_position"),
        sa.UniqueConstraint("appointment_id", "user_id", name="uq_waiting_list_appointment_user"),
    )
    op.create_index("ix_waiting_list_appointment_id", "waiting_list", ["appointment_id"], unique=False)
    op.create_index("ix_waiting_list_user_id", "waiting_list", ["user_id"], unique=False)

    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("appointment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("method", sa.String(length=40), nullable=False),
        sa.Column("insurance_provider", sa.String(length=120), nullable=True),
        sa.Column("status", payment_status, nullable=False, server_default="PENDING"),
        sa.Column("provider_reference", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_payments_appointment_id", "payments", ["appointment_id"], unique=False)
    op.create_index("ix_payments_user_id", "payments", ["user_id"], unique=False)
    op.create_index("ix_payments_status", "payments", ["status"], unique=False)

    op.create_table(
        "treatment_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", treatment_request_status, nullable=False, server_default="PENDING"),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("doctor_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["doctor_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_treatment_requests_doctor_id", "treatment_requests", ["doctor_id"], unique=False)
    op.create_index("ix_treatment_requests_user_id", "treatment_requests", ["user_id"], unique=False)
    op.create_index("ix_treatment_requests_status", "treatment_requests", ["status"], unique=False)

    op.create_table(
        "patient_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False, server_default="Patient Record"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["doctor_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_patient_records_user_id", "patient_records", ["user_id"], unique=False)
    op.create_index("ix_patient_records_doctor_id", "patient_records", ["doctor_id"], unique=False)

    op.create_table(
        "record_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("record_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entry_type", record_entry_type, nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_by_doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["created_by_doctor_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["record_id"], ["patient_records.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_record_entries_record_id", "record_entries", ["record_id"], unique=False)
    op.create_index("ix_record_entries_created_by_doctor_id", "record_entries", ["created_by_doctor_id"], unique=False)

    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("record_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("uploaded_by_doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=120), nullable=False),
        sa.Column("file_url", sa.String(length=1000), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["record_id"], ["patient_records.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by_doctor_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_documents_record_id", "documents", ["record_id"], unique=False)
    op.create_index("ix_documents_uploaded_by_doctor_id", "documents", ["uploaded_by_doctor_id"], unique=False)

    op.create_table(
        "referrals",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender_doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("receiver_doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", referral_status, nullable=False, server_default="PENDING"),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["receiver_doctor_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_doctor_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_referrals_sender_doctor_id", "referrals", ["sender_doctor_id"], unique=False)
    op.create_index("ix_referrals_receiver_doctor_id", "referrals", ["receiver_doctor_id"], unique=False)
    op.create_index("ix_referrals_patient_id", "referrals", ["patient_id"], unique=False)
    op.create_index("ix_referrals_status", "referrals", ["status"], unique=False)

    op.create_table(
        "posts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["doctor_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_posts_doctor_id", "posts", ["doctor_id"], unique=False)

    op.create_table(
        "post_likes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("post_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("post_id", "user_id", name="uq_post_likes_post_user"),
    )
    op.create_index("ix_post_likes_post_id", "post_likes", ["post_id"], unique=False)
    op.create_index("ix_post_likes_user_id", "post_likes", ["user_id"], unique=False)

    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("receiver_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["receiver_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_messages_sender_user_id", "messages", ["sender_user_id"], unique=False)
    op.create_index("ix_messages_receiver_user_id", "messages", ["receiver_user_id"], unique=False)

    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("channel", notification_channel, nullable=False, server_default="IN_APP"),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"], unique=False)
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"], unique=False)

    op.create_table(
        "doctor_profile_update_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("doctor_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", profile_update_status, nullable=False, server_default="PENDING"),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewer_admin_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["doctor_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewer_admin_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_doctor_profile_update_requests_doctor_user_id",
        "doctor_profile_update_requests",
        ["doctor_user_id"],
        unique=False,
    )
    op.create_index(
        "ix_doctor_profile_update_requests_status",
        "doctor_profile_update_requests",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_index("ix_doctor_profile_update_requests_status", table_name="doctor_profile_update_requests")
    op.drop_index("ix_doctor_profile_update_requests_doctor_user_id", table_name="doctor_profile_update_requests")
    op.drop_table("doctor_profile_update_requests")

    op.drop_index("ix_notifications_is_read", table_name="notifications")
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_table("notifications")

    op.drop_index("ix_messages_receiver_user_id", table_name="messages")
    op.drop_index("ix_messages_sender_user_id", table_name="messages")
    op.drop_table("messages")

    op.drop_index("ix_post_likes_user_id", table_name="post_likes")
    op.drop_index("ix_post_likes_post_id", table_name="post_likes")
    op.drop_table("post_likes")

    op.drop_index("ix_posts_doctor_id", table_name="posts")
    op.drop_table("posts")

    op.drop_index("ix_referrals_status", table_name="referrals")
    op.drop_index("ix_referrals_patient_id", table_name="referrals")
    op.drop_index("ix_referrals_receiver_doctor_id", table_name="referrals")
    op.drop_index("ix_referrals_sender_doctor_id", table_name="referrals")
    op.drop_table("referrals")

    op.drop_index("ix_documents_uploaded_by_doctor_id", table_name="documents")
    op.drop_index("ix_documents_record_id", table_name="documents")
    op.drop_table("documents")

    op.drop_index("ix_record_entries_created_by_doctor_id", table_name="record_entries")
    op.drop_index("ix_record_entries_record_id", table_name="record_entries")
    op.drop_table("record_entries")

    op.drop_index("ix_patient_records_doctor_id", table_name="patient_records")
    op.drop_index("ix_patient_records_user_id", table_name="patient_records")
    op.drop_table("patient_records")

    op.drop_index("ix_treatment_requests_status", table_name="treatment_requests")
    op.drop_index("ix_treatment_requests_user_id", table_name="treatment_requests")
    op.drop_index("ix_treatment_requests_doctor_id", table_name="treatment_requests")
    op.drop_table("treatment_requests")

    op.drop_index("ix_payments_status", table_name="payments")
    op.drop_index("ix_payments_user_id", table_name="payments")
    op.drop_index("ix_payments_appointment_id", table_name="payments")
    op.drop_table("payments")

    op.drop_index("ix_waiting_list_user_id", table_name="waiting_list")
    op.drop_index("ix_waiting_list_appointment_id", table_name="waiting_list")
    op.drop_table("waiting_list")

    op.drop_column("doctor_availability_exceptions", "weekday")
    op.drop_column("doctor_availability_exceptions", "recurrence_until")
    op.drop_column("doctor_availability_exceptions", "recurrence_interval")
    op.drop_column("doctor_availability_exceptions", "recurrence_type")
    op.drop_column("doctor_availability_exceptions", "is_recurring")
    op.drop_column("doctor_availability_exceptions", "is_blocking")

    op.drop_column("doctor_availability_rules", "effective_to")
    op.drop_column("doctor_availability_rules", "effective_from")
    op.drop_column("doctor_availability_rules", "is_blocked")

    op.drop_column("appointments", "fee_paid")
    op.drop_column("appointments", "call_status")
    op.drop_column("appointments", "call_room_id")
    op.drop_column("appointments", "call_provider")

    profile_update_status.drop(bind, checkfirst=True)
    notification_channel.drop(bind, checkfirst=True)
    referral_status.drop(bind, checkfirst=True)
    record_entry_type.drop(bind, checkfirst=True)
    treatment_request_status.drop(bind, checkfirst=True)
    payment_status.drop(bind, checkfirst=True)
    recurrence_type.drop(bind, checkfirst=True)
    appointment_call_status.drop(bind, checkfirst=True)
