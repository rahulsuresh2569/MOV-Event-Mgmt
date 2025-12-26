const eventService = require('../services/eventService');
const { successResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS } = require('../constants/httpStatus');
const {
  createEventSchema,
  updateEventSchema,
  updateStatusSchema,
} = require('../validators/eventValidator');

class EventController {
  /**
   * Create a new event
   * POST /api/v1/events
   */
  async createEvent(req, res, next) {
    try {
      const { error, value } = createEventSchema.validate(req.body);
      if (error) {
        error.isJoi = true;
        throw error;
      }

      const event = await eventService.createEvent(value, req.user.id);

      return successResponse(res, HTTP_STATUS.CREATED, 'Event created successfully', { event });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all events
   * GET /api/v1/events
   */
  async getAllEvents(req, res, next) {
    try {
      const { status, category } = req.query;

      const events = await eventService.getAllEvents({ status, category });

      return successResponse(res, HTTP_STATUS.OK, 'Events retrieved successfully', { events });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event by ID
   * GET /api/v1/events/:id
   */
  async getEventById(req, res, next) {
    try {
      const event = await eventService.getEventById(req.params.id);

      return successResponse(res, HTTP_STATUS.OK, 'Event retrieved successfully', { event });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update event
   * PUT /api/v1/events/:id
   */
  async updateEvent(req, res, next) {
    try {
      const { error, value } = updateEventSchema.validate(req.body);
      if (error) {
        error.isJoi = true;
        throw error;
      }

      const event = await eventService.updateEvent(
        req.params.id,
        value,
        req.user.id,
        req.user.role
      );

      return successResponse(res, HTTP_STATUS.OK, 'Event updated successfully', { event });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete event
   * DELETE /api/v1/events/:id
   */
  async deleteEvent(req, res, next) {
    try {
      await eventService.deleteEvent(req.params.id, req.user.id);

      return successResponse(res, HTTP_STATUS.OK, 'Event deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change event status
   * PATCH /api/v1/events/:id/status
   */
  async changeEventStatus(req, res, next) {
    try {
      const { error, value } = updateStatusSchema.validate(req.body);
      if (error) {
        error.isJoi = true;
        throw error;
      }

      const event = await eventService.changeEventStatus(
        req.params.id,
        value.status,
        req.user.id
      );

      return successResponse(res, HTTP_STATUS.OK, 'Event status changed successfully', { event });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get organizer's events
   * GET /api/v1/events/organizer/me
   */
  async getMyEvents(req, res, next) {
    try {
      const events = await eventService.getOrganizerEvents(req.user.id);

      return successResponse(res, HTTP_STATUS.OK, 'Organizer events retrieved successfully', {
        events,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EventController();
