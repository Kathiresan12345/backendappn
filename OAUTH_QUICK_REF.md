# Google OAuth Quick Reference

## 🔑 OAuth Client ID
```
233089769877-800ms7h0ftq7jmh1t4kkahv0b50642hh.apps.googleusercontent.com
```

## ✅ Integration Status

### Completed
- ✅ Added `google_sign_in` package
- ✅ Created `AuthConfig` with OAuth client ID
- ✅ Created `AuthService` with Google Sign-In methods
- ✅ Updated `LoginScreen` with Google OAuth flow
- ✅ Added loading states and error handling
- ✅ Installed dependencies

### Required Configuration

#### 1. Update Backend URL
**File:** `lib/core/auth_config.dart`
```dart
static const String apiBaseUrl = 'https://your-backend-url.com';
```

#### 2. Android Setup
1. Get SHA-1 fingerprint:
   ```bash
   cd android && ./gradlew signingReport
   ```
2. Add SHA-1 to Google Cloud Console
3. Add to `AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.INTERNET"/>
   ```

#### 3. iOS Setup
Add to `ios/Runner/Info.plist`:
```xml
<key>CFBundleURLSchemes</key>
<array>
    <string>com.googleusercontent.apps.233089769877-800ms7h0ftq7jmh1t4kkahv0b50642hh</string>
</array>
```

## 📱 How It Works

### User Flow
1. User taps Google button on login screen
2. Google Sign-In dialog appears
3. User selects Google account
4. App receives user data (name, email, photo)
5. App sends data to backend for authentication
6. Backend returns JWT token
7. User navigates to Add Contact screen

### Code Flow
```
LoginScreen._googleSignIn()
    ↓
AuthService.signInWithGoogle()
    ↓
GoogleSignIn.signIn()
    ↓
AuthService._authenticateWithBackend()
    ↓
Backend API /api/auth/login
    ↓
Return JWT token
```

## 🧪 Testing

### Quick Test
```bash
flutter run
```
Then tap the red Google icon on the login screen.

### Expected Behavior
- Google account picker appears
- After selection, shows loading state
- On success: navigates to Add Contact screen
- On error: shows error message in SnackBar

## 🔧 Key Files

| File | Purpose |
|------|---------|
| `lib/core/auth_config.dart` | OAuth client ID and API URLs |
| `lib/core/auth_service.dart` | Authentication logic |
| `lib/features/auth/login_screen.dart` | UI with Google Sign-In button |
| `GOOGLE_OAUTH_SETUP.md` | Full setup guide |

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Sign-in failed" | Check SHA-1 in Google Cloud Console |
| "PlatformException" | Verify package name matches |
| Backend error | Update `apiBaseUrl` in `auth_config.dart` |
| iOS build fails | Add URL scheme to Info.plist |

## 📚 Documentation
See `GOOGLE_OAUTH_SETUP.md` for complete setup instructions.
