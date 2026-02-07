const express = require('express');
const quotesController = require('../controllers/quotesController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/daily', authMiddleware, quotesController.getDailyQuote);
router.get('/random', authMiddleware, quotesController.getRandomQuote);

module.exports = router;
