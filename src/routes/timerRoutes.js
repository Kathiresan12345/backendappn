const express = require('express');
const timerController = require('../controllers/timerController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/start', authMiddleware, timerController.startTimer);
router.post('/stop', authMiddleware, timerController.stopTimer);
router.post('/extend', authMiddleware, timerController.extendTimer);

module.exports = router;
