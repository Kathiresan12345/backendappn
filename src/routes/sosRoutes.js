const express = require('express');
const sosController = require('../controllers/sosController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/trigger', authMiddleware, sosController.triggerSos);
router.post('/cancel', authMiddleware, sosController.cancelSos);

module.exports = router;
