from tests.conftest import login, register


def test_notifications_websocket_pushes_new_notification(client):
    email = "realtime-user@testmail.dev"
    register(client, email, "UserPass123!", "USER")
    token = login(client, email, "UserPass123!")

    with client.websocket_connect(f"/notifications/ws?token={token}") as websocket:
        connected = websocket.receive_json()
        assert connected["type"] == "notifications:connected"

        request_code = client.post("/auth/request-login-code", json={"email": email})
        assert request_code.status_code == 200, request_code.text

        event = websocket.receive_json()
        assert event["type"] == "notification:new"
        assert event["notification_id"]
        assert event["user_id"]
