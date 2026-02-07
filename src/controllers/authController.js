const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.register = async (req, res) => {
    try {
        const { email, password, name, mobile, gender } = req.body;

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
                authProvider: 'email'
            }
        });

        const jwtToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({ success: true, token: jwtToken, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

exports.login = async (req, res) => {
    try {
        const { provider, email, password, token, userData } = req.body;

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
                // If user doesn't exist, create with basic info from Google
                // They might need to "complete profile" later (mobile, gender)
                user = await prisma.user.create({
                    data: {
                        googleId: googleId,
                        email: payload['email'],
                        name: userData?.name || payload['name'],
                        photoUrl: userData?.photoUrl || payload['picture'],
                        authProvider: 'google',
                    }
                });
            } else {
                // Update existing user
                user = await prisma.user.update({
                    where: { googleId: googleId },
                    data: {
                        lastLogin: new Date(),
                        photoUrl: userData?.photoUrl || payload['picture'] || user.photoUrl
                    }
                });
            }

            const jwtToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

            // Check if profile is complete (has mobile and gender)
            const isProfileComplete = !!(user.mobile && user.gender);

            return res.json({
                success: true,
                token: jwtToken,
                user,
                isProfileComplete
            });
        }

        // Email login logic
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        const jwtToken = jwt.sign({ userId: updatedUser.id, email: updatedUser.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

        const isProfileComplete = !!(updatedUser.mobile && updatedUser.gender);

        res.json({
            success: true,
            token: jwtToken,
            user: updatedUser,
            isProfileComplete
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};
