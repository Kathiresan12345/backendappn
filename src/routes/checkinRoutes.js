const express = require('express');
const checkinController = require('../controllers/checkinController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, checkinController.createCheckin);
router.post('/schedule', authMiddleware, checkinController.scheduleCheckin);

module.exports = router;
