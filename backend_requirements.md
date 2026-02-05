# Backend Requirements for KIRA Safety App

This document outlines the necessary API endpoints, WebSocket events, and Cron jobs required to support the KIRA safety application features.

## 1. API Endpoints

### Authentication & User Profile
*   **POST** `/api/auth/login`
    *   **Payload:** `{ provider: 'google'|'facebook'|'apple'|'email', token: '...', userData: { name, email, mobile } }`
    *   **Description:** Authenticates the user and returns a session token (JWT).
*   **POST** `/api/auth/send-otp`
    *   **Payload:** `{ mobile: '+1234567890' }`
    *   **Description:** Generates a 4-digit OTP and sends it via SMS.
*   **POST** `/api/auth/verify-otp`
    *   **Payload:** `{ mobile: '+1234567890', otp: '1234' }`
    *   **Description:** Verifies the OTP. If successful, creates/authenticates the user and returns a session token (JWT).
*   **GET** `/api/user/profile`
    *   **Description:** Fetches current user details.
*   **PUT** `/api/user/profile`
    *   **Payload:** `{ name, email, mobile, fcmToken, is_mobile_verified }`
    *   **Description:** Updates user profile and registers FCM token for push notifications.

### Database Requirements
**User Table:**
*   `id` (Primary Key)
*   `name`, `email`, `mobile`
*   `is_mobile_verified` (Boolean)
*   `otp_hash` (String, nullable) - Stores hashed OTP for verification
*   `otp_expires_at` (Timestamp)

### Trusted Contacts
*   **POST** `/api/contacts`
    *   **Payload:** `{ name, phone, relation, isEmergencyContact }`
    *   **Description:** Adds a new trusted contact.
*   **GET** `/api/contacts`
    *   **Description:** Lists all trusted contacts.
*   **PUT** `/api/contacts/:id`
    *   **Description:** Updates contact details.
*   **DELETE** `/api/contacts/:id`
    *   **Description:** Removes a trusted contact.

### Check-in System
*   **POST** `/api/checkin`
    *   **Payload:** `{ location: { lat, lng }, status: 'safe', mood: '...' }`
    *   **Description:** Records a daily user check-in. Updates "Safe Status" and increments streak.
*   **POST** `/api/checkin/schedule`
    *   **Payload:** `{ scheduleTime: '18:00' }`
    *   **Description:** Sets the preferred time for daily check-in reminders.

### Safe Timer
*   **POST** `/api/timer/start`
    *   **Payload:** `{ durationMinutes: 30, destination: { lat, lng }, message: 'Walking home' }`
    *   **Description:** Starts a countdown on the server. If not stopped before expiry, server triggers SOS.
*   **POST** `/api/timer/stop`
    *   **Payload:** `{ timerId: '...' }`
    *   **Description:** Stops the active safe timer.
*   **POST** `/api/timer/extend`
    *   **Payload:** `{ timerId: '...', additionalMinutes: 10 }`
    *   **Description:** Extends the current timer.

### SOS & Emergency
*   **POST** `/api/sos/trigger`
    *   **Payload:** `{ location: { lat, lng }, type: 'silent'|'active' }`
    *   **Description:** Activates SOS mode. Notifies all contacts via SMS/Push/Call. Returns a `sosSessionId`.
*   **POST** `/api/sos/cancel`
    *   **Payload:** `{ sosSessionId: '...', reason: 'False alarm' }`
    *   **Description:** Cancels an active SOS alert.

### Achievements
*   **GET** `/api/achievements`
    *   **Description:** Returns list of all badges and user's progress (e.g., {"7 Day Streak": true}).

### Settings & Preferences
*   **POST** `/api/user/settings`
    *   **Payload:** `{ reminderTime: '19:00', alertDelayMinutes: 120, notificationsEnabled: true }`
    *   **Description:** Saves user preferences for reminders and safety delays.

### History & Insights
*   **GET** `/api/history`
    *   **Description:** Returns a log of past check-ins, SOS events, and timer sessions.
*   **GET** `/api/insights/weekly`
    *   **Description:** Returns aggregated stats (streak days, check-in punctuality) for the "Weekly Report" feature.

---

## 2. WebSocket (Real-time Communication)

WebSockets are essential for live tracking and immediate safety updates.

### Namespaces / Channels
*   `/ws/sos/{sosSessionId}`
*   `/ws/user/{userId}`

### Events (Client -> Server)
*   **`sos:location_update`**
    *   **Payload:** `{ lat: 12.34, lng: 77.88, battery: 45, speed: 2.0 }`
    *   **Purpose:** Streams user's live location and status during an SOS or Safe Timer event.

### Events (Server -> Client)
*   **`sos:contact_joined`**
    *   **Payload:** `{ contactName: 'Mom' }`
    *   **Purpose:** Notifies the user that a contact is viewing their live location.
*   **`timer:warning`**
    *   **Purpose:** Server warns the user that their Safe Timer is about to expire (e.g., 5 mins remaining).

---

## 3. Cron Jobs & Scheduled Tasks

These backend processes ensure the system works even if the user's app is closed or their phone is off.

### High Frequency (Every Minute)
1.  **Safe Timer Expiry Check:**
    *   Checks for any active timers that have passed their `endTime`.
    *   **Action:** If expired and not stopped, automatically trigger **SOS workflow** (notify contacts, mark as unsafe).

### High Frequency (Every 15 Minutes)
3.  **Critical Inactivity Monitor (The 32-Hour Rule):**
    *   **Logic:** Checks if (Current Time - Last Check-in Time) > 32 Hours.
    *   **Action:**
        1.  Triggers a silent SOS event internally.
        2.  SMS sent to **all** trusted contacts: *"KIRA Alert: [User Name] hasn't checked in for 32 hours. Please reach out to them."*
        3.  Push notification sent to user: *"Your contacts have been notified due to inactivity."*

### Daily Jobs
4.  **Daily Check-in Reminder:**
    *   Runs at user-configured times (e.g., 6:00 PM).
    *   **Action:** Sends a push notification: "Have you checked in today?".
3.  **Missed Check-in Alert:**
    *   Runs at a hard deadline (e.g., 11:59 PM or user set time).
    *   **Action:** If user hasn't checked in, marks streak as broken. Optionally sends a "We haven't heard from you" alert to the user.
4.  **Streak Reset:**
    *   Resets the "You're safe today" status at midnight.

### Weekly Jobs
5.  **Weekly Report Generation:**
    *   Runs every Sunday night / Monday morning.
    *   **Action:** Aggregates logs into a summary (7-day streak, # of check-ins) and pushes it to the Insights endpoint.
