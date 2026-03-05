from __future__ import annotations

import inspect
import logging
import uuid

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Notification, NotificationChannel

logger = logging.getLogger(__name__)


def _resolve_notification_source() -> str:
    """Best-effort caller info for tracing where notifications are created."""
    frame = inspect.currentframe()
    if frame is None or frame.f_back is None:
        return "unknown"
    caller = frame.f_back.f_back
    if caller is None:
        return "unknown"
    module = inspect.getmodule(caller)
    module_name = module.__name__ if module else "unknown_module"
    func_name = caller.f_code.co_name
    return f"{module_name}.{func_name}"


def _emit_external_notification(channel: NotificationChannel, destination: str | None, body: str) -> None:
    if channel == NotificationChannel.EMAIL:
        if not settings.sendgrid_api_key:
            logger.info("Email notification skipped (no provider key configured): %s", body)
            return
        logger.info("Email notification queued to %s", destination or "<missing>")
        return

    if channel == NotificationChannel.SMS:
        if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_sms_from:
            logger.info("SMS notification skipped (no provider config): %s", body)
            return
        logger.info("SMS notification queued to %s", destination or "<missing>")


def create_notification(
    db: Session,
    *,
    user_id,
    event_type: str,
    title: str,
    body: str,
    channel: NotificationChannel = NotificationChannel.IN_APP,
    metadata_json: dict | None = None,
    destination: str | None = None,
) -> Notification:
    source = _resolve_notification_source()
    notification = Notification(
        user_id=user_id,
        event_type=event_type,
        title=title,
        body=body,
        channel=channel,
        metadata_json=metadata_json,
    )
    db.add(notification)
    db.flush()
    logger.info(
        "Notification created: id=%s user_id=%s event_type=%s channel=%s source=%s",
        notification.id,
        notification.user_id,
        notification.event_type,
        notification.channel.value,
        source,
    )

    if channel in {NotificationChannel.EMAIL, NotificationChannel.SMS}:
        _emit_external_notification(channel, destination, body)

    return notification


def list_notifications(db: Session, *, user_id, limit: int = 30) -> list[Notification]:
    return list(
        db.scalars(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.sent_at.desc())
            .limit(max(1, min(limit, 100)))
        )
    )


def mark_notifications_read(db: Session, *, user_id, notification_ids: list[uuid.UUID] | None = None) -> int:
    stmt = update(Notification).where(Notification.user_id == user_id, Notification.is_read.is_(False))
    if notification_ids:
        stmt = stmt.where(Notification.id.in_(notification_ids))
    result = db.execute(stmt.values(is_read=True))
    db.commit()
    logger.info(
        "Notifications marked read: user_id=%s count=%s target_ids=%s",
        user_id,
        int(result.rowcount or 0),
        len(notification_ids or []),
    )
    return int(result.rowcount or 0)


def delete_notifications(db: Session, *, user_id, notification_ids: list[uuid.UUID] | None = None) -> int:
    stmt = delete(Notification).where(Notification.user_id == user_id)
    if notification_ids:
        stmt = stmt.where(Notification.id.in_(notification_ids))
    result = db.execute(stmt)
    db.commit()
    logger.info(
        "Notifications deleted: user_id=%s count=%s target_ids=%s",
        user_id,
        int(result.rowcount or 0),
        len(notification_ids or []),
    )
    return int(result.rowcount or 0)
