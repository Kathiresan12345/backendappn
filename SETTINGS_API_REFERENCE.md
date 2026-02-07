# User Settings API - Quick Reference

## Endpoints

### 1. GET Settings
**Endpoint:** `GET /api/user/settings`  
**Auth Required:** Yes (Bearer token)

**Response (Settings Exist):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "reminderTime": "19:00",
  "alertDelayMinutes": 120,
  "notificationsEnabled": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Response (No Settings - Returns Defaults):**
```json
{
  "reminderTime": "19:00",
  "alertDelayMinutes": 120,
  "notificationsEnabled": true
}
```

---

### 2. POST/Update Settings
**Endpoint:** `POST /api/user/settings`  
**Auth Required:** Yes (Bearer token)

**Request Body:** (All fields optional)
```json
{
  "reminderTime": "20:00",
  "alertDelayMinutes": 90,
  "notificationsEnabled": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "settings": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "reminderTime": "20:00",
    "alertDelayMinutes": 90,
    "notificationsEnabled": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:30:00.000Z"
  }
}
```

---

## Field Descriptions

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `reminderTime` | string | Daily check-in reminder time (24-hour format "HH:MM") | "19:00" |
| `alertDelayMinutes` | integer | Minutes to wait after reminder before alerting emergency contacts | 120 |
| `notificationsEnabled` | boolean | Enable/disable all push notifications | true |

---

## Usage Examples

### Example 1: Get Current Settings
```bash
curl -X GET https://your-api.com/api/user/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 2: Update Reminder Time Only
```bash
curl -X POST https://your-api.com/api/user/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reminderTime": "21:00"
  }'
```

### Example 3: Disable Notifications
```bash
curl -X POST https://your-api.com/api/user/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationsEnabled": false
  }'
```

### Example 4: Update All Settings
```bash
curl -X POST https://your-api.com/api/user/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reminderTime": "18:30",
    "alertDelayMinutes": 60,
    "notificationsEnabled": true
  }'
```

---

## How It Works

### First Time User
1. User calls `GET /api/user/settings`
2. No settings exist in database
3. API returns default values
4. User updates settings via `POST /api/user/settings`
5. Settings are created in database

### Existing User
1. User calls `GET /api/user/settings`
2. API returns saved settings from database
3. User can update any field via `POST /api/user/settings`
4. Only provided fields are updated (partial update supported)

---

## Integration with Cron Jobs

The settings are used by the backend cron jobs:

### Daily Check-in Monitor (Runs every 15 minutes)
1. Checks if user has checked in today
2. If not, compares current time with `reminderTime`
3. If current time >= `reminderTime`, sends reminder notification
4. If current time >= `reminderTime + alertDelayMinutes`, sends alert to emergency contacts

### Example Timeline:
- User sets: `reminderTime = "19:00"`, `alertDelayMinutes = 120`
- 19:00 - User receives check-in reminder
- 21:00 (19:00 + 120 mins) - If still no check-in, emergency contacts are alerted

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authentication error"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Failed to save settings"
}
```

---

## Notes

- Settings are user-specific (tied to userId from JWT token)
- If user has never set settings, defaults are returned
- Partial updates are supported (only send fields you want to change)
- The `upsert` operation ensures settings are created if they don't exist
- All times are in 24-hour format (e.g., "19:00" for 7:00 PM)
