const prisma = require('../lib/prisma');

exports.createCheckin = async (req, res) => {
    try {
        const { location, status, mood } = req.body;
        const checkin = await prisma.checkIn.create({
            data: {
                userId: req.user.userId,
                lat: location.lat,
                lng: location.lng,
                status,
                mood
            }
        });
        console.log(`✅ [SUCCESS] createCheckin - User ${req.user.userId}: Status ${status}`);
        res.json(checkin);
    } catch (error) {
        console.error(`❌ [ERROR] createCheckin - User ${req.user?.userId}:`, error);
        res.status(500).json({ error: 'Failed to record check-in' });
    }
};

exports.scheduleCheckin = async (req, res) => {
    try {
        const { scheduleTime } = req.body;
        await prisma.userSettings.upsert({
            where: { userId: req.user.userId || req.user.uid },
            update: { reminderTime: scheduleTime },
            create: { userId: req.user.userId || req.user.uid, reminderTime: scheduleTime }
        });
        console.log(`✅ [SUCCESS] scheduleCheckin - User ${req.user.userId || req.user.uid}: Time ${scheduleTime}`);
        res.json({ success: true });
    } catch (error) {
        console.error(`❌ [ERROR] scheduleCheckin - User ${req.user?.userId || req.user?.uid}:`, error);
        res.status(500).json({ error: 'Failed to schedule check-in' });
    }
};
