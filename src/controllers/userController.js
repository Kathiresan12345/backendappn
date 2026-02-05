const prisma = require('../lib/prisma');

exports.getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId || req.user.uid },
            include: { settings: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, email, mobile, fcmToken, is_mobile_verified } = req.body;
        const user = await prisma.user.update({
            where: { id: req.user.userId || req.user.uid },
            data: { name, email, mobile, fcmToken, is_mobile_verified }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { reminderTime, alertDelayMinutes, notificationsEnabled } = req.body;
        const settings = await prisma.userSettings.upsert({
            where: { userId: req.user.userId || req.user.uid },
            update: { reminderTime, alertDelayMinutes, notificationsEnabled },
            create: { userId: req.user.userId || req.user.uid, reminderTime, alertDelayMinutes, notificationsEnabled }
        });
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
};
