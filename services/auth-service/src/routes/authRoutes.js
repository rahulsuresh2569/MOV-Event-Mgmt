const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// All routes are public - API Gateway handles authentication
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authController.getProfile);
router.get('/verify', authController.verifyToken);

module.exports = router;
