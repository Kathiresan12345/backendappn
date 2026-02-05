const express = require('express');
const contactController = require('../controllers/contactController');
const authMiddleware = require('../middleware/auth'); // or verifyFirebaseToken if switching

const router = express.Router();

router.post('/', authMiddleware, contactController.addContact);
router.get('/', authMiddleware, contactController.getContacts);
router.put('/:id', authMiddleware, contactController.updateContact);
router.delete('/:id', authMiddleware, contactController.deleteContact);

module.exports = router;
