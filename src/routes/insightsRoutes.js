const express = require('express');
const insightsController = require('../controllers/insightsController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authMiddleware, insightsController.getStats);
router.get('/weekly-checkins', authMiddleware, insightsController.getWeeklyCheckins);

module.exports = router;
