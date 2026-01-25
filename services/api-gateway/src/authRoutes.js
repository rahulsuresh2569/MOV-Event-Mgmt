const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Secure logout (requires valid token)
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
