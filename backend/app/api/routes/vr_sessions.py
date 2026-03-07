from typing import Dict, List, Optional
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/vr-sessions", tags=["vr-sessions"])

# Simple in-memory session store
# Key: session_id (str) -> Value: { "doctor": WebSocket | None, "patient": WebSocket | None, "current_state": dict }
active_sessions: Dict[str, dict] = {}

class CreateSessionRequest(BaseModel):
    doctor_id: str
    patient_id: str  # Could be optional if just creating a room

class SessionResponse(BaseModel):
    session_id: str
    join_url_patient: str
    join_url_doctor: str

@router.post("/create", response_model=SessionResponse)
async def create_session(request: CreateSessionRequest):
    session_id = str(uuid.uuid4())
    active_sessions[session_id] = {
        "doctor": None,
        "patient": None,
        "current_state": {"video_id": None, "is_playing": False, "timestamp": 0}
    }
    return {
        "session_id": session_id,
        "join_url_patient": f"/vr-session/{session_id}/patient",
        "join_url_doctor": f"/vr-session/{session_id}/doctor"
    }

@router.websocket("/{session_id}/{role}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, role: str):
    if session_id not in active_sessions:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if role not in ["doctor", "patient"]:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    
    # Store the connection
    active_sessions[session_id][role] = websocket
    
    # Send current state to the new connector
    current_state = active_sessions[session_id]["current_state"]
    await websocket.send_json({"type": "SYNC_STATE", "payload": current_state})

    try:
        while True:
            data = await websocket.receive_json()
            # print(f"Received from {role}: {data}")

            # Doctor controls the session
            if role == "doctor":
                if data.get("type") == "SET_VIDEO":
                    active_sessions[session_id]["current_state"]["video_id"] = data["payload"]["video_id"]
                    active_sessions[session_id]["current_state"]["is_playing"] = False
                    active_sessions[session_id]["current_state"]["timestamp"] = 0
                    
                    # Notify patient
                    if active_sessions[session_id]["patient"]:
                        await active_sessions[session_id]["patient"].send_json(data)
                        
                elif data.get("type") == "CONTROL":
                    command = data["payload"]["command"] # "play", "pause", "seek"
                    
                    if command == "play":
                        active_sessions[session_id]["current_state"]["is_playing"] = True
                    elif command == "pause":
                        active_sessions[session_id]["current_state"]["is_playing"] = False
                    elif command == "seek":
                        active_sessions[session_id]["current_state"]["timestamp"] = data["payload"]["time"]

                    # Relay to patient
                    if active_sessions[session_id]["patient"]:
                        await active_sessions[session_id]["patient"].send_json(data)

            # Patient can send sync updates (e.g. "I am ready") or heartbeat
            # For now, we mainly listen to doctor
            
    except WebSocketDisconnect:
        active_sessions[session_id][role] = None
        # Notify the other party
        other_role = "patient" if role == "doctor" else "doctor"
        other_ws = active_sessions[session_id].get(other_role)
        if other_ws:
            await other_ws.send_json({"type": "USER_LEFT", "role": role})
            
        # Clean up empty sessions if needed
        if not active_sessions[session_id]["doctor"] and not active_sessions[session_id]["patient"]:
             del active_sessions[session_id]
