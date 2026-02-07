# KIRA Safety App API & WebSocket Documentation

This document provides a comprehensive guide to the KIRA backend API endpoints, WebSocket events, and their expected request/response structures.

## Base URL
`http://<your-server-ip>:3000`

---

## 1. Authentication
**Base Path:** `/api/auth`

### Register
*   **Method:** `POST`
*   **Endpoint:** `/register`
*   **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword",
      "name": "John Doe",
      "mobile": "1234567890",
      "gender": "Male",
      "fcmToken": "optional_fcm_token"
    }
    ```
*   **Response:**
    ```json
    {
      "success": true,
      "token": "JWT_TOKEN_HERE",
      "user": { "id": "uuid", "email": "...", "name": "...", ... }
    }
    ```

### Login (Two Ways)
The login screen supports two primary authentication methods as shown in the UI:

#### Way 1: Email & Password login
*   **Method:** `POST`
*   **Endpoint:** `/login`
*   **Request Body:**
    ```json
    {
      "provider": "email",
      "email": "user@example.com",
      "password": "securepassword",
      "fcmToken": "optional_fcm_token"
    }
    ```

#### Way 2: Social Login (Google / Apple)
*   **Method:** `POST`
*   **Endpoint:** `/login`
*   **Request Body (Google):**
    ```json
    {
      "provider": "google",
      "token": "GOOGLE_ID_TOKEN",
      "userData": { "name": "John", "photoUrl": "..." },
      "fcmToken": "optional_fcm_token"
    }
    ```
*   **Request Body (Apple):**
    ```json
    {
      "provider": "apple",
      "token": "APPLE_IDENTITY_TOKEN",
      "userData": { "name": "John", "email": "john@example.com" },
      "fcmToken": "optional_fcm_token"
    }
    ```

*   **Common Response (Both Ways):**
    ```json
    {
      "success": true,
      "token": "JWT_TOKEN_HERE",
      "user": { ... },
      "isProfileComplete": false 
    }
    ```

### 💡 Login & Onboarding Flow
1.  **Login**: User logs in via Email/Password or Social icons (Google/Apple).
2.  **Check Status**: The application checks the `isProfileComplete` flag.
    *   `isProfileComplete: false` ➡️ Navigate to **Profile Completion/Register** page to collect missing data (Names, Mobile, Gender).
    *   `isProfileComplete: true` ➡️ Navigate straight to **Home** page.
3.  **Completion**: Once the user submits their profile data via `PUT /api/user/profile`, they are redirected to the Home page.

### Forgot Password
*   **Method:** `POST`
*   **Endpoint:** `/forgot-password`
*   **Request Body:** `{ "email": "user@example.com" }`
*   **Response:** `{ "success": true, "message": "..." }`

---

## 2. User Profile & Settings
**Base Path:** `/api/user` (Requires Header: `Authorization: Bearer <token>`)

### Get Profile
*   **Method:** `GET`
*   **Endpoint:** `/profile`
*   **Response:** User object with `settings`.

### Update Profile
*   **Method:** `PUT` or `PATCH`
*   **Endpoint:** `/profile`
*   **Request Body:** (All fields optional for PATCH)
    ```json
    {
      "name": "New Name",
      "email": "new@email.com",
      "mobile": "0987654321",
      "gender": "Female",
      "fcmToken": "...",
      "photoUrl": "...",
      "password": "newpassword"
    }
    ```

### Update FCM Token
*   **Method:** `PATCH`
*   **Endpoint:** `/fcm-token`
*   **Request Body:**
    ```json
    {
      "fcmToken": "NEW_FCM_TOKEN"
    }
    ```
*   **Response:**
    ```json
    {
      "success": true,
      "message": "FCM Token updated successfully"
    }
    ```

### Save Settings
*   **Method:** `POST`
*   **Endpoint:** `/settings`
*   **Request Body:**
    ```json
    {
      "reminderTime": "19:00",
      "alertDelayMinutes": 120,
      "notificationsEnabled": true
    }
    ```

---

## 3. Trusted Contacts
**Base Path:** `/api/contacts` (Requires Auth)

### List Contacts
*   **Method:** `GET`
*   **Endpoint:** `/`
*   **Response:** `[ { "id": "...", "name": "Mom", "phone": "...", "isEmergencyContact": true }, ... ]`

### Add Contact
*   **Method:** `POST`
*   **Endpoint:** `/`
*   **Body:** `{ "name": "...", "phone": "...", "relation": "Family", "isEmergencyContact": true }`

### Update Contact
*   **Method:** `PUT`
*   **Endpoint:** `/:id`
*   **Body:** Same as Add Contact.

### Delete Contact
*   **Method:** `DELETE`
*   **Endpoint:** `/:id`

---

## 4. SOS (Emergency)
**Base Path:** `/api/sos` (Requires Auth)

### Trigger SOS
*   **Method:** `POST`
*   **Endpoint:** `/trigger`
*   **Body:**
    ```json
    {
      "location": { "lat": 12.34, "lng": 56.78 },
      "type": "active"
    }
    ```

### Stop SOS
*   **Method:** `POST`
*   **Endpoint:** `/stop`
*   **Body:** `{ "sosSessionId": "...", "reason": "Accidental" }`

### SOS History
*   **Method:** `GET`
*   **Endpoint:** `/history`

### SOS Detail
*   **Method:** `GET`
*   **Endpoint:** `/:id`

---

## 5. Safety Timer & Check-ins
**Base Paths:** `/api/timer`, `/api/checkin` (Requires Auth)

### Start Timer
*   **Method:** `POST`
*   **Endpoint:** `/api/timer/start`
*   **Body:** `{ "durationMinutes": 30, "destination": { "lat": 0, "lng": 0 }, "message": "Walking home" }`

### Get Active Timer
*   **Method:** `GET`
*   **Endpoint:** `/api/timer/active`

### Submit Check-in
*   **Method:** `POST`
*   **Endpoint:** `/api/checkin`
*   **Body:** `{ "location": { "lat": 0, "lng": 0 }, "status": "safe", "mood": "Happy" }`

---

## 6. Insights & Achievements
**Base Paths:** `/api/insights`, `/api/achievements` (Requires Auth)

### Safety Stats
*   **Method:** `GET`
*   **Endpoint:** `/api/insights/stats`
*   **Response:** `{ "checkinCount": 10, "sosCount": 1, "safetyScore": 85, "streak": 5 }`

### List Badges
*   **Method:** `GET`
*   **Endpoint:** `/api/achievements`

---

## 7. WebSocket Documentation
**Namespace:** `/live-safe`

### Handshake
Client must provide JWT in the auth object:
```javascript
const socket = io("/live-safe", {
  auth: { token: "JWT_TOKEN" }
});
```

### Outgoing Events (Mobile -> Server)
| Event | Payload | Description |
| :--- | :--- | :--- |
| `sos:init` | `{ type, location }` | Initialize SOS session. |
| `sos:location_update` | `{ sosSessionId, lat, lng, battery, speed }` | Periodic GPS updates. |
| `timer:sync` | `{ timerId, remainingSeconds, location }` | Heartbeat for active timers. |
| `view_sos` | `sosSessionId` (string) | Used by contacts to watch a live SOS. |

### Incoming Events (Server -> Mobile)
| Event | Payload | Description |
| :--- | :--- | :--- |
| `sos:alert_received` | `{ success: true, timestamp }` | Confirms SOS is active. |
| `sos:location_received` | `{ lat, lng, ... }` | Broadcast to viewers. |
| `sos:contact_viewing` | `{ viewerId, timestamp }` | Notifies user that a contact is watching. |
