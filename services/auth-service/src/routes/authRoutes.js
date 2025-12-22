const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken } = require('../../../shared/middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', verifyToken, authController.getProfile);
router.get('/verify', verifyToken, authController.verifyToken);

module.exports = router;
