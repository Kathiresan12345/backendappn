const prisma = require('../lib/prisma');

exports.getAchievements = async (req, res) => {
    try {
        const achievements = await prisma.achievement.findMany({
            where: { userId: req.user.userId || req.user.uid }
        });
        const progress = {};
        achievements.forEach(a => { progress[a.badgeName] = true; });

        console.log(`✅ [SUCCESS] getAchievements - User ${req.user.userId || req.user.uid}: Found ${achievements.length} achievements`);
        res.json(progress);
    } catch (error) {
        console.error(`❌ [ERROR] getAchievements - User ${req.user?.userId || req.user?.uid}:`, error);
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
};
