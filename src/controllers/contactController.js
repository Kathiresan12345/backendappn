const prisma = require('../lib/prisma');

exports.addContact = async (req, res) => {
    try {
        const { name, phone, relation, isEmergencyContact } = req.body;
        const contact = await prisma.trustedContact.create({
            data: {
                userId: req.user.userId,
                name,
                phone,
                relation,
                isEmergencyContact
            }
        });
        res.json(contact);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add contact' });
    }
};

exports.getContacts = async (req, res) => {
    try {
        const contacts = await prisma.trustedContact.findMany({
            where: { userId: req.user.userId }
        });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
};

exports.updateContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, relation, isEmergencyContact } = req.body;
        const contact = await prisma.trustedContact.update({
            where: { id, userId: req.user.userId },
            data: { name, phone, relation, isEmergencyContact }
        });
        res.json(contact);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update contact' });
    }
};

exports.deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.trustedContact.delete({
            where: { id, userId: req.user.userId }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete contact' });
    }
};
