# Firebase OTP Integration Guide

KIRA uses **Firebase Authentication** for identity and **KIRA Backend** for safety data.

## 📱 Mobile App Workflow

1.  **Request OTP**: Use Firebase Client SDK `verifyPhoneNumber`.
2.  **Verify OTP**: User enters code; Client SDK returns a `UserCredential`.
3.  **Get Token**: Call `user.getIdToken()` to get the Firebase JWT string.
4.  **Sync with KIRA**: Send the token to `POST /api/auth/login`.

## 🖥️ Backend Validation Logic

The backend uses the `firebase-admin` library to verify that the token is genuine.

### **The Middleware** (`src/middleware/verifyFirebaseToken.js`)
This middleware can be used on routes to verify identity directly through Firebase if you choose to skip the custom JWT.

```javascript
const decodedToken = await admin.auth().verifyIdToken(idToken);
req.user = decodedToken; // contains uid, phone_number, etc.
```

### **The Controller Logic** (`src/controllers/authController.js`)
When a user logs in via phone, we:
1.  Verify the Firebase Token.
2.  Check if a User with that `mobile` exists in our MySQL database.
3.  If not, create them.
4.  Update their `lastLogin`.
5.  Return a local JWT for subsequent API calls.

## 🔒 Environment Variables
Ensure the following is in your `.env`:
```env
# Path to your firebase service account json or stringified JSON
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```
