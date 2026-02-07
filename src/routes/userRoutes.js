const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.patch('/profile', authMiddleware, userController.updateProfile);
router.get('/settings', authMiddleware, userController.getSettings);
router.post('/settings', authMiddleware, userController.updateSettings);
router.patch('/fcm-token', authMiddleware, userController.updateFcmToken);

module.exports = router;
