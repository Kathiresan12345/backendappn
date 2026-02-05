# WebSocket Documentation (Real-time Tracking)

This document explains how to use WebSockets (`socket.io`) for live location tracking during SOS events.

**Base URL:** `ws://your-backend-url:3000`

## 1. Connection
The client should connect using the `socket.io-client` library.

```javascript
// Example (Flutter/React Native)
const socket = io("http://localhost:3000");
```

## 2. Client-to-Server Events (Emit)

### `sos:location_update`
Sent by the user in SOS mode to broadcast their live location.
- **Payload:**
```json
{
  "sosSessionId": "UUID_FROM_SOS_API",
  "lat": 12.3456,
  "lng": 77.1234,
  "battery": 85,
  "speed": 1.5
}
```

### `join_sos`
Sent by a trusted contact (or the user) to join a specific SOS monitor room.
- **Payload:** `"UUID_FROM_SOS_API"` (String)

---

## 3. Server-to-Client Events (Listen)

### `sos:location_received`
Received by anyone currently in the SOS room (trusted contacts).
- **Payload:**
```json
{
  "sosSessionId": "...",
  "lat": 12.3456,
  "lng": 77.1234,
  "battery": 85,
  "speed": 1.5
}
```

## 4. Implementation Logic
1. **Trigger SOS**: App calls `POST /api/sos/trigger` and gets an ID.
2. **Start Tracking**: App emits `sos:location_update` every 5-10 seconds.
3. **Notify Contacts**: Contacts click an alert link in their app/SMS and emit `join_sos`.
4. **Live Map**: Contacts listen for `sos:location_received` to update the map in real-time.
