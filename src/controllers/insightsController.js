const prisma = require('../lib/prisma');

exports.getStats = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.uid;

        const checkinCount = await prisma.checkIn.count({ where: { userId } });
        const sosCount = await prisma.sOS.count({ where: { userId } });
        const achievementCount = await prisma.achievement.count({ where: { userId } });

        // Basic safety score logic (placeholder)
        const safetyScore = Math.min(100, (checkinCount * 5) + 50);

        res.json({
            checkinCount,
            sosCount,
            achievementCount,
            safetyScore,
            streak: checkinCount > 0 ? 3 : 0 // Placeholder
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch safety stats' });
    }
};
