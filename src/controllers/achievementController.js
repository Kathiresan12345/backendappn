const prisma = require('../lib/prisma');

exports.getAchievements = async (req, res) => {
    try {
        const achievements = await prisma.achievement.findMany({
            where: { userId: req.user.userId || req.user.uid }
        });
        const progress = {};
        achievements.forEach(a => { progress[a.badgeName] = true; });
        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
};
