"""add auth login codes table for otp login

Revision ID: 20260301_0007
Revises: 20260228_0006
Create Date: 2026-03-01 16:10:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260301_0007"
down_revision = "20260228_0006"
branch_labels = None
depends_on = None


auth_code_channel = postgresql.ENUM("EMAIL", "SMS", name="auth_code_channel", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    auth_code_channel.create(bind, checkfirst=True)

    op.create_table(
        "auth_login_codes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("channel", auth_code_channel, nullable=False),
        sa.Column("destination", sa.String(length=255), nullable=False),
        sa.Column("code_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_auth_login_codes_user_created", "auth_login_codes", ["user_id", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_auth_login_codes_user_created", table_name="auth_login_codes")
    op.drop_table("auth_login_codes")
    bind = op.get_bind()
    auth_code_channel.drop(bind, checkfirst=True)
