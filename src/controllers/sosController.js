const prisma = require('../lib/prisma');

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

        res.json(sos);
    } catch (error) {
        console.error(error);
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
        res.json(sos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to stop SOS' });
    }
};

exports.getSosHistory = async (req, res) => {
    try {
        const history = await prisma.sOS.findMany({
            where: { userId: req.user.userId || req.user.uid },
            orderBy: { createdAt: 'desc' }
        });
        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch SOS history' });
    }
};

exports.getSosDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const sos = await prisma.sOS.findUnique({
            where: { id, userId: req.user.userId || req.user.uid }
        });
        if (!sos) return res.status(404).json({ error: 'SOS event not found' });
        res.json(sos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch SOS detail' });
    }
};
