import uuid
import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_current_user_from_token
from app.db.models import User
from app.db.session import SessionLocal, get_db
from app.schemas.notification import NotificationDeleteOut, NotificationMarkReadOut, NotificationOut
from app.services.notification_service import delete_notifications, list_notifications, mark_notifications_read
from app.services.notification_realtime import notification_realtime_hub

router = APIRouter(tags=["notifications"])


@router.get("/notifications", response_model=list[NotificationOut])
def get_notifications(
    limit: int = Query(default=30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = list_notifications(db, user_id=current_user.id, limit=limit)
    return [NotificationOut.model_validate(item) for item in rows]


@router.post("/notifications/read", response_model=NotificationMarkReadOut)
def mark_read(
    notification_ids: list[uuid.UUID] | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    marked = mark_notifications_read(
        db,
        user_id=current_user.id,
        notification_ids=notification_ids,
    )
    return NotificationMarkReadOut(marked=marked)


@router.delete("/notifications", response_model=NotificationDeleteOut)
def clear_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deleted = delete_notifications(db, user_id=current_user.id)
    return NotificationDeleteOut(deleted=deleted)


@router.post("/notifications/clear", response_model=NotificationDeleteOut)
def clear_notifications_post(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deleted = delete_notifications(db, user_id=current_user.id)
    return NotificationDeleteOut(deleted=deleted)


@router.websocket("/notifications/ws")
async def notifications_websocket(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        with SessionLocal() as db:
            current_user = get_current_user_from_token(token, db)
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = str(current_user.id)
    await notification_realtime_hub.connect(user_id=user_id, websocket=websocket)

    try:
        await websocket.send_json({"type": "notifications:connected"})
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=25)
            except asyncio.TimeoutError:
                try:
                    await websocket.send_json({"type": "notifications:ping"})
                except (WebSocketDisconnect, RuntimeError):
                    break
            except WebSocketDisconnect:
                break
    finally:
        await notification_realtime_hub.disconnect(user_id=user_id, websocket=websocket)
