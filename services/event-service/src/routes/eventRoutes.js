const express = require('express');
const eventController = require('../controllers/eventController');
const { verifyToken, requireRole } = require('../../../shared/middleware/authMiddleware');
const { ROLES } = require('../../../shared/constants/roles');

const router = express.Router();

// Public routes (anyone can view published events)
router.get('/events', eventController.getAllEvents);
router.get('/events/:id', eventController.getEventById);

// Protected routes - Organizer only
router.post('/events', verifyToken, requireRole([ROLES.ORGANIZER]), eventController.createEvent);

router.put(
  '/events/:id',
  verifyToken,
  requireRole([ROLES.ORGANIZER]),
  eventController.updateEvent
);

router.delete(
  '/events/:id',
  verifyToken,
  requireRole([ROLES.ORGANIZER]),
  eventController.deleteEvent
);

router.patch(
  '/events/:id/status',
  verifyToken,
  requireRole([ROLES.ORGANIZER]),
  eventController.changeEventStatus
);

router.get(
  '/events/organizer/me',
  verifyToken,
  requireRole([ROLES.ORGANIZER]),
  eventController.getMyEvents
);

module.exports = router;
