# KIRA API Documentation (App Connection Guide)

This document provides the technical specifications for connecting the Mobile App (Flutter) to the Backend.

## 1. Authentication (Firebase OTP Workflow)

The app handles OTP verification via the Firebase Client SDK. Once logged in, the app sends the Firebase `idToken` to the backend.

### **POST** `/api/auth/login`
**Description:** Synchronizes Firebase user with local database.
- **Headers:** `Content-Type: application/json`
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
- **Response (200 OK):**
```json
{
  "success": true,
  "token": "BACKEND_JWT_TOKEN",
  "user": { "id": "...", "name": "...", "email": "..." }
}
```

---

## 2. Trusted Contacts

### **GET** `/api/contacts`
- **Headers:** `Authorization: Bearer BACKEND_JWT_TOKEN`
- **Response:** Array of contacts.

### **POST** `/api/contacts`
- **Body:**
```json
{
  "name": "Jane Doe",
  "phone": "+1234567890",
  "relation": "Sister",
  "isEmergencyContact": true
}
```

---

## 3. Safety Check-ins

### **POST** `/api/checkin`
- **Body:**
```json
{
  "location": { "lat": 12.34, "lng": 77.88 },
  "status": "safe",
  "mood": "Good"
}
```

---

## 4. Safe Timer

### **POST** `/api/timer/start`
- **Body:**
```json
{
  "durationMinutes": 30,
  "destination": { "lat": 12.34, "lng": 77.88 },
  "message": "Walking back from library"
}
```

### **POST** `/api/timer/stop`
- **Body:** `{ "timerId": "..." }`

---

## 5. SOS Alerts

### **POST** `/api/sos/trigger`
- **Body:**
```json
{
  "location": { "lat": 12.34, "lng": 77.88 },
  "type": "active | silent"
}
```
- **Response:** Returns `sosSessionId` (Used for WebSocket tracking).
