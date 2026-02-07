const express = require('express');
const sosController = require('../controllers/sosController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/trigger', authMiddleware, sosController.triggerSos);
router.post('/stop', authMiddleware, sosController.stopSos);
router.get('/history', authMiddleware, sosController.getSosHistory);
router.get('/:id', authMiddleware, sosController.getSosDetail);

module.exports = router;
