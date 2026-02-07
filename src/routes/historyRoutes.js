const express = require('express');
const historyController = require('../controllers/historyController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/checkins', authMiddleware, historyController.getCheckinHistory);
router.get('/sos', authMiddleware, historyController.getSosHistory);

module.exports = router;
