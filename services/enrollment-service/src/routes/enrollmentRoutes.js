const express = require('express');
const enrollmentController = require('../controllers/enrollmentController');

const router = express.Router();

// All routes are handled by API Gateway for authentication
// User info is extracted from headers by extractUser middleware in app.js
// Authorization is handled in service layer (like event-service)

// Routes are at root level because gateway forwards /api/v1/enrollments → /

// Get user's enrollments (must be before /:eventId to avoid route conflict)
router.get('/me', enrollmentController.getMyEnrollments);

// Check enrollment status for an event
router.get('/check/:eventId', enrollmentController.checkEnrollmentStatus);

// Get event statistics (organizer only)
router.get('/event/:eventId/statistics', enrollmentController.getEventStatistics);

// Get event enrollments (organizer can see who enrolled in their events)
router.get('/event/:eventId', enrollmentController.getEventEnrollments);

// Enroll in an event
router.post('/', enrollmentController.enrollInEvent);

// Unenroll from an event
router.delete('/:eventId', enrollmentController.unenrollFromEvent);

module.exports = router;
