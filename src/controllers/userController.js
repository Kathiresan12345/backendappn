const prisma = require('../lib/prisma');

exports.getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId || req.user.uid },
            include: { settings: true } // Removed invalid include 'user' if it causes issues, assuming standard schema
        });
        console.log(`✅ [SUCCESS] getProfile - User ${req.user.userId || req.user.uid}: Fetched profile`);
        res.json(user);
    } catch (error) {
        console.error(`❌ [ERROR] getProfile - User ${req.user?.userId || req.user?.uid}:`, error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

const bcrypt = require('bcryptjs');

exports.updateProfile = async (req, res) => {
    try {
        const { name, email, mobile, gender, fcmToken, is_mobile_verified, photoUrl, password } = req.body;

        const updateData = { name, email, mobile, gender, fcmToken, is_mobile_verified, photoUrl };

        // Remove undefined fields
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: req.user.userId || req.user.uid },
            data: updateData
        });
        console.log(`✅ [SUCCESS] updateProfile - User ${req.user.userId || req.user.uid}: Profile updated`);
        res.json(user);
    } catch (error) {
        console.error(`❌ [ERROR] updateProfile - User ${req.user?.userId || req.user?.uid}:`, error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

exports.getSettings = async (req, res) => {
    try {
        const settings = await prisma.userSettings.findUnique({
            where: { userId: req.user.userId || req.user.uid }
        });

        if (!settings) {
            console.log(`⚠️ [WARN] getSettings - User ${req.user.userId || req.user.uid}: No settings found, sending defaults`);
            // Return default settings if none exist
            return res.json({
                reminderTime: "19:00",
                alertDelayMinutes: 120,
                notificationsEnabled: true
            });
        }

        console.log(`✅ [SUCCESS] getSettings - User ${req.user.userId || req.user.uid}: Fetched settings`);
        res.json(settings);
    } catch (error) {
        console.error(`❌ [ERROR] getSettings - User ${req.user?.userId || req.user?.uid}:`, error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { reminderTime, alertDelayMinutes, notificationsEnabled } = req.body;

        const updateData = {};
        if (reminderTime !== undefined) updateData.reminderTime = reminderTime;
        if (alertDelayMinutes !== undefined) updateData.alertDelayMinutes = alertDelayMinutes;
        if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled;

        const settings = await prisma.userSettings.upsert({
            where: { userId: req.user.userId || req.user.uid },
            update: updateData,
            create: {
                userId: req.user.userId || req.user.uid,
                reminderTime: reminderTime || "19:00",
                alertDelayMinutes: alertDelayMinutes !== undefined ? alertDelayMinutes : 120,
                notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : true
            }
        });

        console.log(`✅ [SUCCESS] updateSettings - User ${req.user.userId || req.user.uid}: Settings updated`);
        res.json({
            success: true,
            message: 'Settings updated successfully',
            settings
        });
    } catch (error) {
        console.error(`❌ [ERROR] updateSettings - User ${req.user?.userId || req.user?.uid}:`, error);
        res.status(500).json({ success: false, error: 'Failed to save settings' });
    }
};

exports.updateFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) {
            console.error(`❌ [ERROR] updateFcmToken - Missing FCM token`);
            return res.status(400).json({ error: 'FCM Token is required' });
        }

        const user = await prisma.user.update({
            where: { id: req.user.userId || req.user.uid },
            data: { fcmToken }
        });
        console.log(`✅ [SUCCESS] updateFcmToken - User ${req.user.userId || req.user.uid}: Token updated`);
        res.json({ success: true, message: 'FCM Token updated successfully' });
    } catch (error) {
        console.error(`❌ [ERROR] updateFcmToken - User ${req.user?.userId || req.user?.uid}:`, error);
        res.status(500).json({ error: 'Failed to update FCM token' });
    }
};
