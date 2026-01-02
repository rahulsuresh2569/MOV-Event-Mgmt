const express = require('express');
const eventController = require('../controllers/eventController');

const router = express.Router();

// All routes are public - API Gateway handles authentication and authorization
// Routes are at root level because gateway forwards /api/v1/events → /
router.get('/', eventController.getAllEvents);
router.get('/organizer/me', eventController.getMyEvents);  // Must be before /:id
router.get('/:id', eventController.getEventById);
router.post('/', eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);
router.patch('/:id/status', eventController.changeEventStatus);

module.exports = router;
