from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from datetime import datetime
from typing import DefaultDict

from fastapi import WebSocket

from app.db.models import Notification

logger = logging.getLogger(__name__)


class NotificationRealtimeHub:
    def __init__(self) -> None:
        self._loop: asyncio.AbstractEventLoop | None = None
        self._connections: DefaultDict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    def attach_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def connect(self, *, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[user_id].add(websocket)

    async def disconnect(self, *, user_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            sockets = self._connections.get(user_id)
            if not sockets:
                return
            sockets.discard(websocket)
            if not sockets:
                self._connections.pop(user_id, None)

    async def _broadcast(self, *, user_id: str, payload: dict) -> None:
        async with self._lock:
            sockets = list(self._connections.get(user_id, set()))

        if not sockets:
            return

        stale: list[WebSocket] = []
        for websocket in sockets:
            try:
                await websocket.send_json(payload)
            except Exception:
                stale.append(websocket)

        if not stale:
            return

        async with self._lock:
            current = self._connections.get(user_id)
            if not current:
                return
            for websocket in stale:
                current.discard(websocket)
            if not current:
                self._connections.pop(user_id, None)

    def publish_notification(self, notification: Notification) -> None:
        loop = self._loop
        if loop is None or not loop.is_running():
            return

        sent_at = notification.sent_at
        sent_at_iso = sent_at.isoformat() if isinstance(sent_at, datetime) else None
        payload = {
            "type": "notification:new",
            "notification_id": str(notification.id),
            "user_id": str(notification.user_id),
            "sent_at": sent_at_iso,
        }

        def _schedule() -> None:
            asyncio.create_task(self._broadcast(user_id=str(notification.user_id), payload=payload))

        try:
            loop.call_soon_threadsafe(_schedule)
        except RuntimeError:
            logger.debug("Notification realtime publish skipped: event loop not available")


notification_realtime_hub = NotificationRealtimeHub()
