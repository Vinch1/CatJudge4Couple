import json
from typing import Dict

from fastapi import WebSocket


class RoomManager:
    """Manages WebSocket rooms for each case.
    Each case is a room with max 2 participants (plaintiff + defendant).
    """

    def __init__(self):
        # case_id -> {role: WebSocket}
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}

    # ------------------------------------------------------------------
    # Connection lifecycle
    # ------------------------------------------------------------------

    async def connect(self, case_id: str, role: str, websocket: WebSocket):
        """Accept the WebSocket handshake and register the participant."""
        await websocket.accept()

        if case_id not in self.rooms:
            self.rooms[case_id] = {}
        self.rooms[case_id][role] = websocket

    def disconnect(self, case_id: str, role: str):
        """Remove a participant from the room. Cleans up empty rooms."""
        room = self.rooms.get(case_id)
        if room is None:
            return

        room.pop(role, None)

        if not room:
            self.rooms.pop(case_id, None)

    # ------------------------------------------------------------------
    # Sending helpers
    # ------------------------------------------------------------------

    async def send_to_room(self, case_id: str, message: dict):
        """Send a JSON message to every participant in a room."""
        room = self.rooms.get(case_id)
        if room is None:
            return

        payload = json.dumps(message, ensure_ascii=False)
        disconnected: list[str] = []

        for role, ws in room.items():
            try:
                await ws.send_text(payload)
            except Exception:
                disconnected.append(role)

        # Clean up any sockets that failed during broadcast
        for role in disconnected:
            room.pop(role, None)
        if not room:
            self.rooms.pop(case_id, None)

    async def send_to_role(self, case_id: str, role: str, message: dict):
        """Send a JSON message to one specific role in a room."""
        room = self.rooms.get(case_id)
        if room is None:
            return
        ws = room.get(role)
        if ws is None:
            return

        payload = json.dumps(message, ensure_ascii=False)
        try:
            await ws.send_text(payload)
        except Exception:
            room.pop(role, None)
            if not room:
                self.rooms.pop(case_id, None)

    # ------------------------------------------------------------------
    # Status helpers
    # ------------------------------------------------------------------

    def get_room_count(self, case_id: str) -> int:
        """Number of currently connected participants."""
        room = self.rooms.get(case_id)
        return len(room) if room else 0

    def is_both_connected(self, case_id: str) -> bool:
        """True when both plaintiff and defendant are present."""
        room = self.rooms.get(case_id)
        return bool(room and "plaintiff" in room and "defendant" in room)

    # ------------------------------------------------------------------
    # Convenience: build participant_status payload
    # ------------------------------------------------------------------

    def participant_status_message(self, case_id: str) -> dict:
        room = self.rooms.get(case_id) or {}
        return {
            "type": "participant_status",
            "plaintiff_connected": "plaintiff" in room,
            "defendant_connected": "defendant" in room,
        }


# Singleton instance importable by any module (AI engine, routers, etc.)
room_manager = RoomManager()
