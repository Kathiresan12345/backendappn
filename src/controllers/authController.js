const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.login = async (req, res) => {
    try {
        const { provider, token, userData } = req.body;

        if (provider === 'google') {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            const googleId = payload['sub'];

            let user = await prisma.user.upsert({
                where: { googleId: googleId },
                update: {
                    lastLogin: new Date(),
                    photoUrl: userData.photoUrl || payload['picture']
                },
                create: {
                    googleId: googleId,
                    email: payload['email'],
                    name: userData.name || payload['name'],
                    photoUrl: userData.photoUrl || payload['picture'],
                    authProvider: 'google',
                    is_mobile_verified: false,
                }
            });

            const jwtToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

            return res.json({ success: true, token: jwtToken, user });
        }

        res.status(400).json({ error: 'Unsupported provider' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

exports.sendOtp = async (req, res) => {
    try {
        const { mobile } = req.body;
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await prisma.user.upsert({
            where: { mobile },
            update: {
                otp_hash: otpHash,
                otp_expires_at: expiresAt
            },
            create: {
                mobile,
                otp_hash: otpHash,
                otp_expires_at: expiresAt,
                authProvider: 'mobile'
            }
        });

        console.log(`Sending OTP ${otp} to ${mobile}`);
        res.json({ success: true, message: 'OTP sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { mobile, otp } = req.body;

        const user = await prisma.user.findUnique({ where: { mobile } });
        if (!user || !user.otp_hash || new Date() > user.otp_expires_at) {
            return res.status(400).json({ error: 'OTP expired or not found' });
        }

        const isValid = await bcrypt.compare(otp, user.otp_hash);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        const updatedUser = await prisma.user.update({
            where: { mobile },
            data: {
                is_mobile_verified: true,
                otp_hash: null,
                otp_expires_at: null,
                lastLogin: new Date()
            }
        });

        const jwtToken = jwt.sign({ userId: updatedUser.id, mobile: updatedUser.mobile }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({ success: true, token: jwtToken, user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Verification failed' });
    }
};
