const prisma = require('../lib/prisma');

exports.getStats = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.uid;

        const checkinCount = await prisma.checkIn.count({ where: { userId } });
        const sosCount = await prisma.sOS.count({ where: { userId } });
        const achievementCount = await prisma.achievement.count({ where: { userId } });

        // Calculate weekly check-ins for the last 7 days
        const weeklyCheckins = [];
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(today);
            dayStart.setDate(today.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(today);
            dayEnd.setDate(today.getDate() - i);
            dayEnd.setHours(23, 59, 59, 999);

            const count = await prisma.checkIn.count({
                where: {
                    userId,
                    createdAt: {
                        gte: dayStart,
                        lte: dayEnd
                    }
                }
            });

            weeklyCheckins.push(count);
        }

        // Calculate streak (consecutive days with check-ins)
        let streak = 0;
        for (let i = weeklyCheckins.length - 1; i >= 0; i--) {
            if (weeklyCheckins[i] > 0) {
                streak++;
            } else {
                break;
            }
        }

        // Basic safety score logic
        const safetyScore = Math.min(100, (checkinCount * 5) + 50);

        console.log(`✅ [SUCCESS] getStats - User ${userId}: Score ${safetyScore}, Streak ${streak}`);
        res.json({
            checkinCount,
            sosCount,
            achievementCount,
            safetyScore,
            streak,
            weeklyCheckins
        });
    } catch (error) {
        console.error(`❌ [ERROR] getStats - User ${req.user?.userId || req.user?.uid}:`, error);
        res.status(500).json({ error: 'Failed to fetch safety stats' });
    }
};

exports.getWeeklyCheckins = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.uid;
        const weeklyCheckins = [];
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(today);
            dayStart.setDate(today.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(today);
            dayEnd.setDate(today.getDate() - i);
            dayEnd.setHours(23, 59, 59, 999);

            const count = await prisma.checkIn.count({
                where: {
                    userId,
                    createdAt: {
                        gte: dayStart,
                        lte: dayEnd
                    }
                }
            });

            weeklyCheckins.push(count);
        }

        console.log(`✅ [SUCCESS] getWeeklyCheckins - User ${userId}: Sent data`);
        res.json({
            success: true,
            data: weeklyCheckins
        });
    } catch (error) {
        console.error(`❌ [ERROR] getWeeklyCheckins - User ${req.user?.userId || req.user?.uid}:`, error);
        res.status(500).json({ success: false, error: 'Failed to fetch weekly check-ins' });
    }
};
