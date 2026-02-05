const prisma = require('../lib/prisma');

exports.startTimer = async (req, res) => {
    try {
        const { durationMinutes, destination, message } = req.body;
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        const timer = await prisma.safeTimer.create({
            data: {
                userId: req.user.userId || req.user.uid,
                durationMinutes,
                destinationLat: destination?.lat,
                destinationLng: destination?.lng,
                message,
                startTime,
                endTime,
                status: 'active'
            }
        });

        res.json(timer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to start timer' });
    }
};

exports.stopTimer = async (req, res) => {
    try {
        const { timerId } = req.body;
        const timer = await prisma.safeTimer.update({
            where: { id: timerId, userId: req.user.userId || req.user.uid },
            data: { status: 'stopped' }
        });
        res.json(timer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to stop timer' });
    }
};

exports.extendTimer = async (req, res) => {
    try {
        const { timerId, additionalMinutes } = req.body;
        const currentTimer = await prisma.safeTimer.findUnique({ where: { id: timerId } });
        if (!currentTimer) return res.status(404).json({ error: 'Timer not found' });

        const newEndTime = new Date(currentTimer.endTime.getTime() + additionalMinutes * 60 * 1000);

        const timer = await prisma.safeTimer.update({
            where: { id: timerId },
            data: {
                endTime: newEndTime,
                durationMinutes: currentTimer.durationMinutes + additionalMinutes
            }
        });
        res.json(timer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to extend timer' });
    }
};
