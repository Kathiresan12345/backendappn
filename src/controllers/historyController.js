const prisma = require('../lib/prisma');

exports.getCheckinHistory = async (req, res) => {
    try {
        const history = await prisma.checkIn.findMany({
            where: { userId: req.user.userId || req.user.uid },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`✅ [SUCCESS] getCheckinHistory - User ${req.user.userId || req.user.uid}: Fetched ${history.length} records`);
        res.json(history);
    } catch (error) {
        console.error(`❌ [ERROR] getCheckinHistory - User ${req.user?.userId || req.user?.uid}:`, error);
        res.status(500).json({ error: 'Failed to fetch check-in history' });
    }
};

exports.getSosHistory = async (req, res) => {
    try {
        const history = await prisma.sOS.findMany({
            where: { userId: req.user.userId || req.user.uid },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`✅ [SUCCESS] getSosHistory - User ${req.user.userId || req.user.uid}: Fetched ${history.length} records`);
        res.json(history);
    } catch (error) {
        console.error(`❌ [ERROR] getSosHistory - User ${req.user?.userId || req.user?.uid}:`, error);
        res.status(500).json({ error: 'Failed to fetch SOS history' });
    }
};
