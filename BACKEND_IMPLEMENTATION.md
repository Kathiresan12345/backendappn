# Backend Implementation Example

This document provides example implementations for the authentication endpoints required by the KIRA Safety App.

## Technology Stack Examples

You can implement these endpoints using any backend framework. Here are examples in different technologies:

---

## Node.js + Express Example

### Setup
```bash
npm install express jsonwebtoken google-auth-library bcrypt
```

### Authentication Routes (`routes/auth.js`)

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Store OTPs temporarily (use Redis in production)
const otpStore = new Map();

/**
 * POST /api/auth/login
 * Authenticate user with social provider
 */
router.post('/login', async (req, res) => {
  try {
    const { provider, token, userData } = req.body;

    if (provider === 'google') {
      // Verify Google token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      const googleId = payload['sub'];

      // Find or create user in database
      let user = await User.findOne({ 
        $or: [
          { googleId: googleId },
          { email: userData.email }
        ]
      });

      if (!user) {
        // Create new user
        user = await User.create({
          name: userData.name,
          email: userData.email,
          googleId: googleId,
          photoUrl: userData.photoUrl,
          is_mobile_verified: false,
          authProvider: 'google'
        });
      } else {
        // Update existing user
        user.googleId = googleId;
        user.photoUrl = userData.photoUrl;
        user.lastLogin = new Date();
        await user.save();
      }

      // Generate JWT token
      const jwtToken = jwt.sign(
        { 
          userId: user._id,
          email: user.email 
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          photoUrl: user.photoUrl
        }
      });
    } else {
      res.status(400).json({ 
        error: 'Unsupported provider',
        message: `Provider ${provider} is not supported` 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message 
    });
  }
});

/**
 * POST /api/auth/send-otp
 * Send OTP to mobile number
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || mobile.length < 10) {
      return res.status(400).json({ 
        error: 'Invalid mobile number' 
      });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store OTP with expiry (5 minutes)
    const otpData = {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0
    };
    otpStore.set(mobile, otpData);

    // Send SMS using your SMS provider (Twilio, AWS SNS, etc.)
    await sendSMS(mobile, `Your KIRA verification code is: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      error: 'Failed to send OTP',
      message: error.message 
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and authenticate user
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ 
        error: 'Mobile and OTP are required' 
      });
    }

    // Get stored OTP
    const otpData = otpStore.get(mobile);

    if (!otpData) {
      return res.status(400).json({ 
        error: 'OTP not found or expired' 
      });
    }

    // Check expiry
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(mobile);
      return res.status(400).json({ 
        error: 'OTP expired' 
      });
    }

    // Check attempts
    if (otpData.attempts >= 3) {
      otpStore.delete(mobile);
      return res.status(400).json({ 
        error: 'Too many failed attempts' 
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      otpData.attempts++;
      otpStore.set(mobile, otpData);
      return res.status(400).json({ 
        error: 'Invalid OTP' 
      });
    }

    // OTP verified - remove from store
    otpStore.delete(mobile);

    // Find or create user
    let user = await User.findOne({ mobile: mobile });

    if (!user) {
      user = await User.create({
        mobile: mobile,
        is_mobile_verified: true,
        authProvider: 'mobile'
      });
    } else {
      user.is_mobile_verified = true;
      user.lastLogin = new Date();
      await user.save();
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user._id,
        mobile: user.mobile 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      error: 'OTP verification failed',
      message: error.message 
    });
  }
});

// Helper function to send SMS (implement with your SMS provider)
async function sendSMS(mobile, message) {
  
  
  console.log(`SMS to ${mobile}: ${message}`);
  // TODO: Implement actual SMS sending
}

module.exports = router;
```

### User Model (`models/User.js`)

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { 
    type: String, 
    sparse: true,
    lowercase: true 
  },
  mobile: { 
    type: String, 
    sparse: true 
  },
  googleId: { 
    type: String, 
    sparse: true 
  },
  photoUrl: String,
  is_mobile_verified: { 
    type: Boolean, 
    default: false 
  },
  authProvider: {
    type: String,
    enum: ['google', 'facebook', 'apple', 'mobile'],
    required: true
  },
  fcmToken: String,
  lastLogin: { 
    type: Date, 
    default: Date.now 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Ensure at least one authentication method exists
userSchema.index({ email: 1 }, { sparse: true, unique: true });
userSchema.index({ mobile: 1 }, { sparse: true, unique: true });
userSchema.index({ googleId: 1 }, { sparse: true, unique: true });

module.exports = mongoose.model('User', userSchema);
```

### Main Server (`server.js`)

```javascript
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS (adjust for production)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Routes
app.use('/api/auth', authRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/kira_safety', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Environment Variables (`.env`)

```env
GOOGLE_CLIENT_ID=233089769877-800ms7h0ftq7jmh1t4kkahv0b50642hh.apps.googleusercontent.com
JWT_SECRET=your-super-secret-jwt-key-change-this
MONGODB_URI=mongodb://localhost/kira_safety
PORT=3000

# SMS Provider (e.g., Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Python + Flask Example

### Setup
```bash
pip install flask google-auth pyjwt pymongo twilio
```

### Authentication Routes (`auth.js`)

```javascript
from flask import Blueprint, request, jsonify
from google.oauth2 import id_token
from google.auth.transport import requests
import jwt
import random
import time
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

# Configuration
GOOGLE_CLIENT_ID = "233089769877-800ms7h0ftq7jmh1t4kkahv0b50642hh.apps.googleusercontent.com"
JWT_SECRET = "your-secret-key"

# Temporary OTP storage (use Redis in production)
otp_store = {}

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        provider = data.get('provider')
        token = data.get('token')
        user_data = data.get('userData')

        if provider == 'google':
            # Verify Google token
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                GOOGLE_CLIENT_ID
            )
            
            google_id = idinfo['sub']
            
            # Find or create user
            user = User.find_or_create_by_google(
                google_id=google_id,
                email=user_data['email'],
                name=user_data['name'],
                photo_url=user_data.get('photoUrl')
            )
            
            # Generate JWT
            jwt_token = jwt.encode({
                'user_id': str(user['_id']),
                'email': user['email'],
                'exp': datetime.utcnow() + timedelta(days=30)
            }, JWT_SECRET, algorithm='HS256')
            
            return jsonify({
                'success': True,
                'token': jwt_token,
                'user': {
                    'id': str(user['_id']),
                    'name': user['name'],
                    'email': user['email']
                }
            })
        else:
            return jsonify({'error': 'Unsupported provider'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    try:
        mobile = request.json.get('mobile')
        
        if not mobile or len(mobile) < 10:
            return jsonify({'error': 'Invalid mobile number'}), 400
        
        # Generate OTP
        otp = str(random.randint(1000, 9999))
        
        # Store OTP
        otp_store[mobile] = {
            'otp': otp,
            'expires_at': time.time() + 300,  # 5 minutes
            'attempts': 0
        }
        
        # Send SMS
        send_sms(mobile, f"Your KIRA verification code is: {otp}")
        
        return jsonify({
            'success': True,
            'message': 'OTP sent successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    try:
        mobile = request.json.get('mobile')
        otp = request.json.get('otp')
        
        if mobile not in otp_store:
            return jsonify({'error': 'OTP not found or expired'}), 400
        
        otp_data = otp_store[mobile]
        
        # Check expiry
        if time.time() > otp_data['expires_at']:
            del otp_store[mobile]
            return jsonify({'error': 'OTP expired'}), 400
        
        # Check attempts
        if otp_data['attempts'] >= 3:
            del otp_store[mobile]
            return jsonify({'error': 'Too many failed attempts'}), 400
        
        # Verify OTP
        if otp_data['otp'] != otp:
            otp_data['attempts'] += 1
            return jsonify({'error': 'Invalid OTP'}), 400
        
        # OTP verified
        del otp_store[mobile]
        
        # Find or create user
        user = User.find_or_create_by_mobile(mobile)
        
        # Generate JWT
        jwt_token = jwt.encode({
            'user_id': str(user['_id']),
            'mobile': user['mobile'],
            'exp': datetime.utcnow() + timedelta(days=30)
        }, JWT_SECRET, algorithm='HS256')
        
        return jsonify({
            'success': True,
            'token': jwt_token,
            'user': {
                'id': str(user['_id']),
                'mobile': user['mobile']
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def send_sms(mobile, message):
    # Implement with your SMS provider
    print(f"SMS to {mobile}: {message}")
    # TODO: Integrate Twilio or other SMS service
```

---

## Testing the Backend

### Using cURL

```bash
# Test Google Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "token": "google_id_token_here",
    "userData": {
      "name": "Test User",
      "email": "test@example.com",
      "id": "google_user_id"
    }
  }'

# Test Send OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "mobile": "+1234567890"
  }'

# Test Verify OTP
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "mobile": "+1234567890",
    "otp": "1234"
  }'
```

### Using Postman

1. Create a new collection "KIRA Auth"
2. Add requests for each endpoint
3. Set Content-Type header to `application/json`
4. Test each endpoint with sample data

---

## Security Best Practices

1. **Always verify Google tokens on the backend**
2. **Use HTTPS in production**
3. **Store JWT secret in environment variables**
4. **Implement rate limiting for OTP endpoints**
5. **Use Redis for OTP storage in production**
6. **Hash sensitive data before storing**
7. **Implement CORS properly**
8. **Add request validation middleware**
9. **Log authentication attempts**
10. **Implement token refresh mechanism**

---

## Next Steps

1. Choose your backend framework
2. Set up database (MongoDB, PostgreSQL, etc.)
3. Implement the authentication endpoints
4. Set up SMS provider (Twilio, AWS SNS, etc.)
5. Deploy backend to a server
6. Update `apiBaseUrl` in Flutter app
7. Test the complete flow
