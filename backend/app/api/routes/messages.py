import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.message import MessageCreateIn, MessageOut
from app.services.messaging_service import list_messages, mark_message_read, send_message

router = APIRouter(tags=["messages"])


@router.post("/messages", response_model=MessageOut)
def create_message(
    payload: MessageCreateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    message = send_message(
        db,
        sender_user=current_user,
        receiver_user_id=payload.receiver_user_id,
        subject=payload.subject,
        body=payload.body,
    )
    return MessageOut.model_validate(message)


@router.get("/messages", response_model=list[MessageOut])
def list_my_messages(
    box: str = Query(default="inbox", pattern="^(inbox|outbox)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = list_messages(db, actor_user=current_user, box=box)
    return [MessageOut.model_validate(item) for item in rows]


@router.patch("/messages/{message_id}/read", response_model=MessageOut)
def mark_read(
    message_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = mark_message_read(db, message_id=message_id, actor_user=current_user)
    return MessageOut.model_validate(item)
