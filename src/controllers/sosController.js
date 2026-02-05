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
        res.status(500).json({ error: 'Failed to trigger SOS' });
    }
};

exports.cancelSos = async (req, res) => {
    try {
        const { sosSessionId, reason } = req.body;
        const sos = await prisma.sOS.update({
            where: { id: sosSessionId, userId: req.user.userId || req.user.uid },
            data: { status: 'cancelled', reason }
        });
        res.json(sos);
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel SOS' });
    }
};
