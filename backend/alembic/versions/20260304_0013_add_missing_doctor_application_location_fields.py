"""add missing doctor application location fields

Revision ID: 20260304_0013
Revises: 20260304_0012
Create Date: 2026-03-04 13:10:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260304_0013"
down_revision = "20260304_0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("doctor_applications", sa.Column("clinic_name", sa.String(length=255), nullable=True))
    op.add_column("doctor_applications", sa.Column("address_line", sa.String(length=255), nullable=True))
    op.add_column("doctor_applications", sa.Column("map_url", sa.String(length=1000), nullable=True))


def downgrade() -> None:
    op.drop_column("doctor_applications", "map_url")
    op.drop_column("doctor_applications", "address_line")
    op.drop_column("doctor_applications", "clinic_name")
