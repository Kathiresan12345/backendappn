# KIRA Safety Backend

Full backend implementation for the KIRA Safety App using Node.js, Express, and Prisma.

## Setup

1. **Prisma Generation**:
   Since C: drive was full, npm cache has been redirected to D:. Run:
   ```bash
   npx prisma generate
   ```

2. **Database Migration**:
   Update your `DATABASE_URL` in `.env` if needed, then run:
   ```bash
   npx prisma migrate dev --name init
   ```
   *Note: This will create the tables in your `kira` database.*

3. **Install Dependencies**:
   If any dependencies are missing (due to disk space issues earlier), run:
   ```bash
   npm install
   ```

4. **Run the Server**:
   ```bash
   node src/index.js
   ```

## Features

- **Authentication**: Google OAuth and Mobile OTP (using JWT).
- **Contacts**: CRUD for trusted and emergency contacts.
- **Check-ins**: Daily check-in system with mood and location.
- **Safe Timer**: Countdown timer that triggers SOS if not stopped.
- **SOS**: Silent and active SOS alerts with real-time location updates.
- **WebSockets**: Live tracking during SOS events via `socket.io`.
- **Cron Jobs**: Automated checks for timer expiry and 32-hour inactivity.
- **Achievements**: Track user badges and progress.

## API Base URL
`http://localhost:3000`

## WebSocket Events
- `sos:location_update`: Emit from mobile when active.
- `join_sos`: Join a session room to receive updates.
