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
        console.log(`✅ [SUCCESS] addContact - User ${req.user.userId}: Added ${name}`);
        res.json(contact);
    } catch (error) {
        console.error(`❌ [ERROR] addContact - User ${req.user?.userId}:`, error);
        res.status(500).json({ error: 'Failed to add contact' });
    }
};

exports.getContacts = async (req, res) => {
    try {
        const contacts = await prisma.trustedContact.findMany({
            where: { userId: req.user.userId }
        });
        console.log(`✅ [SUCCESS] getContacts - User ${req.user.userId}: Found ${contacts.length} contacts`);
        res.json(contacts);
    } catch (error) {
        console.error(`❌ [ERROR] getContacts - User ${req.user?.userId}:`, error);
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
        console.log(`✅ [SUCCESS] updateContact - User ${req.user.userId}: Updated contact ${id}`);
        res.json(contact);
    } catch (error) {
        console.error(`❌ [ERROR] updateContact - User ${req.user?.userId}:`, error);
        res.status(500).json({ error: 'Failed to update contact' });
    }
};

exports.deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.trustedContact.delete({
            where: { id, userId: req.user.userId }
        });
        console.log(`✅ [SUCCESS] deleteContact - User ${req.user.userId}: Deleted contact ${id}`);
        res.json({ success: true });
    } catch (error) {
        console.error(`❌ [ERROR] deleteContact - User ${req.user?.userId}:`, error);
        res.status(500).json({ error: 'Failed to delete contact' });
    }
};
