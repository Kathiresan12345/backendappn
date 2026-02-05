const express = require('express');
const achievementController = require('../controllers/achievementController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, achievementController.getAchievements);

module.exports = router;
