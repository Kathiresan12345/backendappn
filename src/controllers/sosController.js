const prisma = require('../lib/prisma');
const { sendSOSAlert } = require('../services/notificationService');

exports.triggerSos = async (req, res) => {
    try {
        const { location, type } = req.body;
        const sos = await prisma.sOS.create({
            data: {
                userId: req.user.userId || req.user.uid,
                lat: location.lat,
                lng: location.lng,
                type,
                status: 'active'
            }
        });

        // Send SOS alert to emergency contacts
        await sendSOSAlert(req.user.userId || req.user.uid, location);

        console.log(`✅ [SUCCESS] triggerSos - User ${req.user.userId || req.user.uid}: SOS active at ${location.lat},${location.lng}`);
        res.json(sos);
    } catch (error) {
        console.error(`❌ [ERROR] triggerSos - User ${req.user?.userId || req.user?.uid}:`, error);
        res.status(500).json({ error: 'Failed to trigger SOS' });
    }
};

exports.stopSos = async (req, res) => {
    try {
        const { sosSessionId, reason } = req.body;
        const sos = await prisma.sOS.update({
            where: { id: sosSessionId, userId: req.user.userId || req.user.uid },
            data: { status: 'cancelled', reason } // Using 'cancelled' as per schema, but exposed as 'stop'
        });
        console.log(`✅ [SUCCESS] stopSos - User ${req.user.userId || req.user.uid}: Stopped SOS ${sosSessionId}`);
        res.json(sos);
    } catch (error) {
        console.error(`❌ [ERROR] stopSos - User ${req.user?.userId || req.user?.uid}:`, error);
        res.status(500).json({ error: 'Failed to stop SOS' });
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

exports.getSosDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const sos = await prisma.sOS.findUnique({
            where: { id, userId: req.user.userId || req.user.uid }
        });
        if (!sos) {
            console.log(`⚠️ [WARN] getSosDetail - SOS not found: ${id}`);
            return res.status(404).json({ error: 'SOS event not found' });
        }
        res.json(sos);
    } catch (error) {
        console.error(`❌ [ERROR] getSosDetail - User ${req.user?.userId || req.user?.uid}:`, error);
        res.status(500).json({ error: 'Failed to fetch SOS detail' });
    }
};
