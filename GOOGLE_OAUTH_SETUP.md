# Google OAuth Integration Setup Guide

## Overview
This guide explains how to integrate the Google OAuth client ID into the KIRA Safety App.

**Google OAuth Client ID:**
```
233089769877-800ms7h0ftq7jmh1t4kkahv0b50642hh.apps.googleusercontent.com
```

## What Has Been Done

### 1. Dependencies Added
- `google_sign_in: ^6.2.1` - For Google OAuth authentication
- `http: ^1.2.0` - For backend API communication

### 2. Files Created

#### `lib/core/auth_config.dart`
Contains the OAuth client ID and backend API configuration:
- Google OAuth Client ID
- Backend API base URL (needs to be updated)
- API endpoint paths

#### `lib/core/auth_service.dart`
Authentication service with methods for:
- `signInWithGoogle()` - Handles Google OAuth flow
- `signOutGoogle()` - Signs out from Google
- `sendOtp()` - Sends OTP to mobile number
- `verifyOtp()` - Verifies OTP code
- `_authenticateWithBackend()` - Communicates with your backend API

### 3. Files Updated

#### `lib/features/auth/login_screen.dart`
- Added Google Sign-In functionality
- Added loading states during authentication
- Integrated with AuthService
- Added error handling and user feedback

## Setup Instructions

### Step 1: Install Dependencies
Run the following command in your project directory:
```bash
flutter pub get
```

### Step 2: Configure Backend API URL
Open `lib/core/auth_config.dart` and update the `apiBaseUrl`:
```dart
static const String apiBaseUrl = 'https://your-actual-backend-url.com';
```

### Step 3: Android Configuration

#### 3.1 Update AndroidManifest.xml
Add the following to `android/app/src/main/AndroidManifest.xml` inside the `<application>` tag:

```xml
<meta-data
    android:name="com.google.android.gms.version"
    android:value="@integer/google_play_services_version" />
```

Also add internet permission before the `<application>` tag:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
```

#### 3.2 Get SHA-1 Certificate Fingerprint
Run this command to get your debug SHA-1:
```bash
cd android
./gradlew signingReport
```

Look for the SHA-1 fingerprint under the `debug` variant.

#### 3.3 Configure Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Go to **APIs & Services** > **Credentials**
4. Find your OAuth 2.0 Client ID: `233089769877-800ms7h0ftq7jmh1t4kkahv0b50642hh.apps.googleusercontent.com`
5. Add your Android app:
   - Click on the client ID
   - Add your package name: `com.example.safer`
   - Add your SHA-1 certificate fingerprint

### Step 4: iOS Configuration

#### 4.1 Update Info.plist
Add the following to `ios/Runner/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <!-- Replace with your REVERSED_CLIENT_ID from GoogleService-Info.plist -->
            <string>com.googleusercontent.apps.233089769877-800ms7h0ftq7jmh1t4kkahv0b50642hh</string>
        </array>
    </dict>
</array>
```

#### 4.2 Configure Google Cloud Console for iOS
1. In Google Cloud Console > Credentials
2. Add iOS app to your OAuth client
3. Add your iOS bundle ID: `com.example.safer`

### Step 5: Web Configuration (Optional)

For web support, the client ID is already configured in `auth_config.dart`. No additional setup needed for basic functionality.

### Step 6: Backend API Requirements

Your backend needs to implement the following endpoints as specified in `backend_requirements.md`:

#### POST `/api/auth/login`
**Request:**
```json
{
  "provider": "google",
  "token": "google_id_token",
  "userData": {
    "name": "User Name",
    "email": "user@example.com",
    "id": "google_user_id",
    "photoUrl": "https://..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

#### POST `/api/auth/send-otp`
**Request:**
```json
{
  "mobile": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

#### POST `/api/auth/verify-otp`
**Request:**
```json
{
  "mobile": "+1234567890",
  "otp": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "mobile": "+1234567890"
  }
}
```

## Testing

### Test Google Sign-In
1. Run the app: `flutter run`
2. On the login screen, tap the Google icon (red button)
3. Select a Google account
4. The app should authenticate and navigate to the Add Contact screen

### Test Mobile OTP
1. Enter name, email, and mobile number
2. Tap "Continue"
3. The app will send an OTP request to your backend
4. Navigate to OTP verification screen

## Troubleshooting

### "Sign-in failed" Error
- Verify the OAuth client ID is correct in `auth_config.dart`
- Check that SHA-1 fingerprint is added in Google Cloud Console
- Ensure package name matches in Google Cloud Console

### "PlatformException" on Android
- Make sure you've added the SHA-1 fingerprint
- Verify the package name is `com.example.safer`
- Check that Google Play Services is installed on the device/emulator

### Backend Connection Issues
- Verify `apiBaseUrl` in `auth_config.dart` is correct
- Check that your backend is running and accessible
- Review backend logs for authentication errors

### iOS Build Issues
- Ensure the reversed client ID is correct in Info.plist
- Run `pod install` in the ios directory
- Clean and rebuild: `flutter clean && flutter pub get`

## Security Notes

1. **Never commit sensitive credentials** to version control
2. Consider using environment variables for the client ID in production
3. Implement proper token storage (use flutter_secure_storage)
4. Add token refresh logic for long-lived sessions
5. Validate tokens on the backend

## Next Steps

1. **Update Backend URL**: Change `apiBaseUrl` in `auth_config.dart`
2. **Implement Backend**: Create the authentication endpoints
3. **Add Token Storage**: Store JWT tokens securely
4. **Add Session Management**: Handle token expiration and refresh
5. **Test on Real Devices**: Test on both Android and iOS devices
6. **Add Error Analytics**: Track authentication errors

## Additional Resources

- [Google Sign-In for Flutter](https://pub.dev/packages/google_sign_in)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
