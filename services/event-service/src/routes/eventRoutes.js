const express = require('express');
const eventController = require('../controllers/eventController');

const router = express.Router();

// All routes are public - API Gateway handles authentication and authorization
router.get('/events', eventController.getAllEvents);
router.get('/events/:id', eventController.getEventById);
router.post('/events', eventController.createEvent);
router.put('/events/:id', eventController.updateEvent);
router.delete('/events/:id', eventController.deleteEvent);
router.patch('/events/:id/status', eventController.changeEventStatus);
router.get('/events/organizer/me', eventController.getMyEvents);

module.exports = router;
