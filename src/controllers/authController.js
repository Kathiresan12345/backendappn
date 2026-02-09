const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.register = async (req, res) => {
    try {
        const { email, password, name, mobile, gender, fcmToken } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { mobile: mobile }
                ]
            }
        });

        if (existingUser) {
            console.error(`❌ [ERROR] register - User already exists: ${email} or ${mobile}`);
            return res.status(400).json({ error: 'User with this email or mobile already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                mobile,
                gender,
                fcmToken,
                authProvider: 'email'
            }
        });

        const jwtToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

        console.log(`✅ [SUCCESS] register - New user created: ${user.email} (${user.id})`);
        res.json({ success: true, token: jwtToken, user, isProfileComplete: true });
    } catch (error) {
        console.error(`❌ [ERROR] register - Failed to register user:`, error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

exports.login = async (req, res) => {
    try {
        const { provider, email, password, token, userData, fcmToken } = req.body;

        // Way 1: Social Login - Apple
        if (provider === 'apple') {
            const appleId = token;
            const userEmail = email || userData?.email;

            let user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { googleId: appleId }, // Reusing field for mapping
                        { email: userEmail }
                    ]
                }
            });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: userEmail,
                        name: userData?.name || 'Apple User',
                        googleId: appleId,
                        authProvider: 'apple',
                        fcmToken
                    }
                });
                console.log(`✅ [SUCCESS] login (Apple) - Created new user: ${user.email}`);
            } else {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        lastLogin: new Date(),
                        ...(fcmToken && { fcmToken })
                    }
                });
                console.log(`✅ [SUCCESS] login (Apple) - User logged in: ${user.email}`);
            }

            const jwtToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
            const isProfileComplete = !!(user.mobile && user.gender);

            return res.json({ success: true, token: jwtToken, user, isProfileComplete });
        }

        // Way 1: Social Login - Google
        if (provider === 'google') {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            const googleId = payload['sub'];

            let user = await prisma.user.findUnique({
                where: { googleId: googleId }
            });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        googleId: googleId,
                        email: payload['email'],
                        name: userData?.name || payload['name'],
                        photoUrl: userData?.photoUrl || payload['picture'],
                        authProvider: 'google',
                        fcmToken
                    }
                });
                console.log(`✅ [SUCCESS] login (Google) - Created new user: ${user.email}`);
            } else {
                user = await prisma.user.update({
                    where: { googleId: googleId },
                    data: {
                        lastLogin: new Date(),
                        photoUrl: userData?.photoUrl || payload['picture'] || user.photoUrl,
                        ...(fcmToken && { fcmToken })
                    }
                });
                console.log(`✅ [SUCCESS] login (Google) - User logged in: ${user.email}`);
            }

            const jwtToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
            const isProfileComplete = !!(user.mobile && user.gender);

            return res.json({ success: true, token: jwtToken, user, isProfileComplete });
        }

        // Way 2: Email & Password login
        if (provider === 'email' || (!provider && email && password)) {
            if (!email || !password) {
                console.error(`❌ [ERROR] login - Missing email or password`);
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const user = await prisma.user.findUnique({ where: { email } });

            if (!user || !user.password) {
                console.error(`❌ [ERROR] login - Invalid credentials for: ${email}`);
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                console.error(`❌ [ERROR] login - Invalid password for: ${email}`);
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLogin: new Date(),
                    ...(fcmToken && { fcmToken })
                }
            });

            const jwtToken = jwt.sign({ userId: updatedUser.id, email: updatedUser.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
            const isProfileComplete = !!(updatedUser.mobile && updatedUser.gender);

            console.log(`✅ [SUCCESS] login (Email) - User logged in: ${updatedUser.email}`);
            return res.json({ success: true, token: jwtToken, user: updatedUser, isProfileComplete });
        }

        res.status(400).json({ error: 'Unsupported authentication provider' });
    } catch (error) {
        console.error(`❌ [ERROR] login - Authentication failed:`, error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log(`⚠️ [WARN] forgotPassword - User not found: ${email}`);
            return res.json({ success: true, message: 'If an account exists with that email, a reset link will be sent.' });
        }

        console.log(`✅ [SUCCESS] forgotPassword - Reset requested for: ${email}`);
        res.json({ success: true, message: 'Password reset instructions sent to your email.' });
    } catch (error) {
        console.error(`❌ [ERROR] forgotPassword - Failed:`, error);
        res.status(500).json({ error: 'Failed to process request' });
    }
};
