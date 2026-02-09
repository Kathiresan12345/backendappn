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
*   **Method:** `PUT` 
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

### Get Settings
*   **Method:** `GET`
*   **Endpoint:** `/settings`
*   **Response:**
    ```json
    {
      "id": "uuid",
      "userId": "uuid",
      "reminderTime": "19:00",
      "alertDelayMinutes": 120,
      "notificationsEnabled": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
    ```
*   **Response (No Settings):**
    ```json
    {
      "reminderTime": "19:00",
      "alertDelayMinutes": 120,
      "notificationsEnabled": true
    }
    ```

### Update Settings
*   **Method:** `POST`
*   **Endpoint:** `/settings`
*   **Request Body:** (All fields optional)
    ```json
    {
      "reminderTime": "19:00",
      "alertDelayMinutes": 120,
      "notificationsEnabled": true
    }
    ```
*   **Response:**
    ```json
    {
      "success": true,
      "message": "Settings updated successfully",
      "settings": {
        "id": "uuid",
        "userId": "uuid",
        "reminderTime": "19:00",
        "alertDelayMinutes": 120,
        "notificationsEnabled": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    }
    ```
*   **Field Descriptions:**
    - `reminderTime` (string): Time to send daily check-in reminder (format: "HH:MM", e.g., "19:00")
    - `alertDelayMinutes` (integer): Minutes to wait after reminder before alerting contacts (default: 120)
    - `notificationsEnabled` (boolean): Enable/disable push notifications (default: true)

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
*   **Response:**
    ```json
    {
      "checkinCount": 10,
      "sosCount": 1,
      "achievementCount": 5,
      "safetyScore": 85,
      "streak": 5,
      "weeklyCheckins": [1, 1, 0, 1, 1, 1, 1]
    }
    ```
*   **Response Fields:**
    - `checkinCount`: Total number of check-ins
    - `sosCount`: Total number of SOS events
    - `achievementCount`: Total number of achievements earned
    - `safetyScore`: Calculated safety score (0-100)
    - `streak`: Current consecutive days with check-ins
    - `weeklyCheckins`: Array of 7 integers (check-in counts for last 7 days)

### Weekly Check-ins
*   **Method:** `GET`
*   **Endpoint:** `/api/insights/weekly-checkins`
*   **Response:**
    ```json
    {
      "success": true,
      "data": [1, 1, 0, 1, 1, 1, 1]
    }
    ```
*   **Description:** Returns check-in counts for the last 7 days (index 0 = 6 days ago, index 6 = today)

### List Badges
*   **Method:** `GET`
*   **Endpoint:** `/api/achievements`

---

## 7. Quotes
**Base Path:** `/api/quotes` (Requires Auth)

### Daily Quote
*   **Method:** `GET`
*   **Endpoint:** `/api/quotes/daily`
*   **Response:**
    ```json
    {
      "success": true,
      "quote": "Small habits prevent big worries.",
      "author": "Anonymous"
    }
    ```
*   **Description:** Returns a motivational quote that changes daily (same quote for all users on the same day)

### Random Quote
*   **Method:** `GET`
*   **Endpoint:** `/api/quotes/random`
*   **Response:**
    ```json
    {
      "success": true,
      "quote": "Safety is not a gadget but a state of mind.",
      "author": "Eleanor Everet"
    }
    ```
*   **Description:** Returns a random motivational quote

---

## 8. WebSocket Documentation
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

---

## 9. Push Notifications (FCM)

The backend automatically sends push notifications for critical safety events. Users must provide their FCM token during registration/login or via the `/api/user/fcm-token` endpoint.

### Notification Types

#### Check-in Reminder
*   **Trigger:** Sent at user's configured `reminderTime` if they haven't checked in today
*   **Payload:**
    ```json
    {
      "title": "🔔 Daily Check-in Reminder",
      "body": "Don't forget to check in today! Your safety matters.",
      "data": {
        "type": "checkin_reminder",
        "action": "open_checkin"
      }
    }
    ```

#### Missed Check-in Alert
*   **Trigger:** Sent to emergency contacts when user hasn't checked in by `reminderTime + alertDelayMinutes`
*   **Payload:**
    ```json
    {
      "title": "⚠️ Missed Check-in Alert",
      "body": "[User Name] has not checked in today. Please verify their safety.",
      "data": {
        "type": "missed_checkin",
        "userId": "uuid"
      }
    }
    ```

#### SOS Alert
*   **Trigger:** Sent immediately when user triggers SOS
*   **Payload:**
    ```json
    {
      "title": "🚨 EMERGENCY SOS ALERT",
      "body": "[User Name] has triggered an SOS! Location: lat, lng",
      "data": {
        "type": "sos_alert",
        "userId": "uuid",
        "lat": "12.34",
        "lng": "56.78"
      }
    }
    ```

#### Timer Expiry Alert
*   **Trigger:** Sent when safety timer expires without being stopped
*   **Payload:**
    ```json
    {
      "title": "⏰ Safety Timer Expired",
      "body": "[User Name]'s safety timer has expired without check-in.",
      "data": {
        "type": "timer_expired",
        "userId": "uuid"
      }
    }
    ```

---

## 10. Background Cron Jobs

These automated jobs run on the server to ensure user safety:

### Safety Timer Expiry Monitor
*   **Frequency:** Every 1 minute
*   **Action:** Checks for expired timers, auto-triggers SOS, and notifies emergency contacts

### Daily Check-in Monitor
*   **Frequency:** Every 15 minutes
*   **Action:** 
    - Sends reminder at configured `reminderTime`
    - Sends missed check-in alert to contacts after `reminderTime + alertDelayMinutes`

### Missed Alert Escalation
*   **Frequency:** Every 5 minutes
*   **Action:** Alerts emergency contacts if user hasn't checked in for 24+ hours

### History Cleanup
*   **Frequency:** Monthly (1st of each month)
*   **Action:** Archives check-ins older than 12 months

