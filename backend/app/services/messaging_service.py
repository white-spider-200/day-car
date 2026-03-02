from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Message, User
from app.services.notification_service import create_notification


def send_message(
    db: Session,
    *,
    sender_user: User,
    receiver_user_id,
    subject: str | None,
    body: str,
) -> Message:
    if sender_user.id == receiver_user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot message yourself")

    receiver = db.scalar(select(User).where(User.id == receiver_user_id))
    if not receiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receiver not found")

    message = Message(
        sender_user_id=sender_user.id,
        receiver_user_id=receiver_user_id,
        subject=subject.strip() if subject else None,
        body=body.strip(),
    )
    db.add(message)
    db.flush()

    create_notification(
        db,
        user_id=receiver_user_id,
        event_type="MESSAGE_RECEIVED",
        title="New message",
        body="You received a new message.",
        metadata_json={"message_id": str(message.id), "sender_user_id": str(sender_user.id)},
    )
    db.commit()
    db.refresh(message)
    return message


def list_messages(db: Session, *, actor_user: User, box: str) -> list[Message]:
    if box == "outbox":
        return list(
            db.scalars(
                select(Message)
                .where(Message.sender_user_id == actor_user.id)
                .order_by(Message.created_at.desc())
            )
        )
    return list(
        db.scalars(
            select(Message)
            .where(Message.receiver_user_id == actor_user.id)
            .order_by(Message.created_at.desc())
        )
    )


def mark_message_read(db: Session, *, message_id, actor_user: User) -> Message:
    message = db.scalar(select(Message).where(Message.id == message_id))
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if message.receiver_user_id != actor_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    if message.read_at is None:
        message.read_at = datetime.now(UTC)
        db.commit()
        db.refresh(message)
    return message
