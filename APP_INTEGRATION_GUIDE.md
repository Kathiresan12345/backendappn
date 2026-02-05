# KIRA Safety App - Full Backend Integration Guide

**Base API URL:** `http://localhost:3000`  
**WebSocket URL:** `ws://localhost:3000`

---

## 1. Authentication (Firebase OTP Workflow)

The mobile app handles OTP via Firebase Client SDK and synchronizes with the KIRA backend.

### **Workflow:**
1. App verifies phone via Firebase.
2. App gets `idToken` from Firebase.
3. App sends token to `POST /api/auth/login`.
4. Backend verifies token, syncs MySQL user, and returns a session JWT.

### **API: Social/Phone Login**
- **Endpoint:** `POST /api/auth/login`
- **Body:**
```json
{
  "provider": "google | phone",
  "token": "FIREBASE_ID_TOKEN",
  "userData": {
    "name": "User Name",
    "email": "user@example.com",
    "photoUrl": "https://..."
  }
}
```

---

## 2. API Reference (Authenticated Routes)

All routes below require the Header: `Authorization: Bearer <BACKEND_JWT_TOKEN>`

### **User Profile**
- **GET** `/api/user/profile`: Fetch current user & settings.
- **PUT** `/api/user/profile`: Update name, email, or FCM token.
- **POST** `/api/user/settings`: Update reminder times & alert delays.

### **Trusted Contacts**
- **GET** `/api/contacts`: List all contacts.
- **POST** `/api/contacts`: Add new contact.
  - Body: `{ "name": "...", "phone": "...", "relation": "...", "isEmergencyContact": true }`
- **DELETE** `/api/contacts/:id`: Remove contact.

### **Safety Check-ins**
- **POST** `/api/checkin`: Record location & mood.
  - Body: `{ "location": {"lat": 0, "lng": 0}, "status": "safe", "mood": "..." }`

### **Safe Timer**
- **POST** `/api/timer/start`: Start safety countdown.
  - Body: `{ "durationMinutes": 30, "destination": {"lat": 0, "lng": 0}, "message": "..." }`
- **POST** `/api/timer/stop`: Stop active timer.
- **POST** `/api/timer/extend`: Add minutes to timer.

---

## 3. Real-time Tracking (WebSockets)

Used for live location updates during an SOS event.

### **Events (Emit from App)**
- `join_sos`: Join a room using the `sosSessionId`.
- `sos:location_update`: Stream location to the server.
```json
{
  "sosSessionId": "UUID",
  "lat": 12.34,
  "lng": 77.88,
  "battery": 80,
  "speed": 1.2
}
```

### **Events (Listen in App)**
- `sos:location_received`: Received by contacts to show the user on a live map.

---

## 4. Backend Automation (Cron Jobs)
The backend automatically performs these tasks:
- **Timer Expiry**: If a Safe Timer hits zero without being stopped, the backend triggers an **SOS** automatically.
- **32-Hour Rule**: If a user hasn't checked in for 32 hours, the backend logs a critical alert for contacts.

---

## 5. Development Checklist
- [ ] Ensure `.env` has correct `DATABASE_URL`.
- [ ] Ensure `.env` has `FIREBASE_SERVICE_ACCOUNT`.
- [ ] Run `npm start` to see DB connection status.
- [ ] Register `FCM Token` in profile update for push notifications.
