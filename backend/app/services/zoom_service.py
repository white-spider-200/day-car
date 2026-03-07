from __future__ import annotations

import base64
from datetime import UTC, datetime

import httpx

from app.core.config import settings


def zoom_is_configured() -> bool:
    provider = (settings.video_provider or "").upper()
    return (
        provider == "ZOOM"
        and bool(settings.zoom_account_id)
        and bool(settings.zoom_client_id)
        and bool(settings.zoom_client_secret)
    )


def _zoom_access_token() -> str:
    auth_plain = f"{settings.zoom_client_id}:{settings.zoom_client_secret}".encode("utf-8")
    auth_header = base64.b64encode(auth_plain).decode("utf-8")
    response = httpx.post(
        "https://zoom.us/oauth/token",
        params={
            "grant_type": "account_credentials",
            "account_id": settings.zoom_account_id,
        },
        headers={"Authorization": f"Basic {auth_header}"},
        timeout=20.0,
    )
    response.raise_for_status()
    payload = response.json()
    token = payload.get("access_token")
    if not token:
        raise RuntimeError("Zoom access token was not returned")
    return str(token)


def create_zoom_meeting_for_appointment(
    *,
    appointment_id: str,
    doctor_user_id: str,
    patient_user_id: str,
    start_at: datetime,
    end_at: datetime,
) -> dict[str, str] | None:
    if not zoom_is_configured():
        return None

    duration_minutes = max(15, int((end_at - start_at).total_seconds() // 60))
    start_time_utc = start_at.astimezone(UTC).isoformat().replace("+00:00", "Z")

    token = _zoom_access_token()
    host_user = settings.zoom_host_user_id or "me"
    response = httpx.post(
        f"https://api.zoom.us/v2/users/{host_user}/meetings",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={
            "topic": f"Sabina session {appointment_id[:8]}",
            "type": 2,
            "start_time": start_time_utc,
            "duration": duration_minutes,
            "timezone": "UTC",
            "agenda": f"Doctor {doctor_user_id} with patient {patient_user_id}",
            "settings": {
                "join_before_host": settings.zoom_join_before_host,
                "waiting_room": settings.zoom_waiting_room,
            },
        },
        timeout=20.0,
    )
    response.raise_for_status()
    payload = response.json()
    join_url = payload.get("join_url")
    meeting_id = payload.get("id")
    if not join_url or not meeting_id:
        raise RuntimeError("Zoom meeting response missing join_url or id")

    return {
        "provider": "ZOOM",
        "meeting_link": str(join_url),
        "room_id": str(meeting_id),
    }
