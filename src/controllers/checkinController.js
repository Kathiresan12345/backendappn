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
        res.json(checkin);
    } catch (error) {
        res.status(500).json({ error: 'Failed to record check-in' });
    }
};

exports.scheduleCheckin = async (req, res) => {
    try {
        const { scheduleTime } = req.body;
        await prisma.userSettings.upsert({
            where: { userId: req.user.userId },
            update: { reminderTime: scheduleTime },
            create: { userId: req.user.userId, reminderTime: scheduleTime }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to schedule check-in' });
    }
};
