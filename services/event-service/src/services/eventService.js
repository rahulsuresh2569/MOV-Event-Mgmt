const Event = require('../models/Event');
const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpStatus');
const { EVENT_STATES, VALID_TRANSITIONS } = require('../constants/eventStates');

class EventService {
  /**
   * Create a new event
   */
  async createEvent(eventData, organizerId) {
    try {
      const event = await Event.create({
        ...eventData,
        organizerId,
        status: EVENT_STATES.PLANNING,
      });

      logger.info(`Event created: ${event.id} by organizer ${organizerId}`);
      return event;
    } catch (error) {
      logger.error(`Error creating event: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all events (with optional filters)
   */
  async getAllEvents(filters = {}) {
    try {
      const where = {};

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.organizerId) {
        where.organizerId = filters.organizerId;
      }

      const events = await Event.findAll({
        where,
        order: [['date', 'ASC']],
      });

      return events;
    } catch (error) {
      logger.error(`Error fetching events: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId) {
    try {
      const event = await Event.findByPk(eventId);

      if (!event) {
        const error = new Error('Event not found');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        error.errorCode = ERROR_CODES.NOT_FOUND;
        throw error;
      }

      return event;
    } catch (error) {
      logger.error(`Error fetching event: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update event
   */
  async updateEvent(eventId, updateData, userId, userRole) {
    try {
      const event = await this.getEventById(eventId);

      // Check if user is the organizer
      if (event.organizerId !== userId) {
        const error = new Error('Only the organizer can update this event');
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        error.errorCode = ERROR_CODES.AUTHORIZATION_ERROR;
        throw error;
      }

      // Check if event has started
      if (event.status === EVENT_STATES.RUNNING || event.status === EVENT_STATES.COMPLETED) {
        const error = new Error('Cannot update event that has started or completed');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        error.errorCode = ERROR_CODES.INVALID_STATE_TRANSITION;
        throw error;
      }

      await event.update(updateData);

      logger.info(`Event updated: ${eventId}`);
      return event;
    } catch (error) {
      logger.error(`Error updating event: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId, userId) {
    try {
      const event = await this.getEventById(eventId);

      // Check if user is the organizer
      if (event.organizerId !== userId) {
        const error = new Error('Only the organizer can delete this event');
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        error.errorCode = ERROR_CODES.AUTHORIZATION_ERROR;
        throw error;
      }

      // Can only delete if in Planning status and no participants
      if (event.status !== EVENT_STATES.PLANNING) {
        const error = new Error('Can only delete events in Planning status');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        error.errorCode = ERROR_CODES.INVALID_STATE_TRANSITION;
        throw error;
      }

      if (event.currentParticipants > 0) {
        const error = new Error('Cannot delete event with registered participants');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      await event.destroy();

      logger.info(`Event deleted: ${eventId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting event: ${error.message}`);
      throw error;
    }
  }

  /**
   * Change event status
   */
  async changeEventStatus(eventId, newStatus, userId) {
    try {
      const event = await this.getEventById(eventId);

      // Check if user is the organizer
      if (event.organizerId !== userId) {
        const error = new Error('Only the organizer can change event status');
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        error.errorCode = ERROR_CODES.AUTHORIZATION_ERROR;
        throw error;
      }

      // Validate state transition
      const validTransitions = VALID_TRANSITIONS[event.status];
      if (!validTransitions.includes(newStatus)) {
        const error = new Error(
          `Invalid state transition from ${event.status} to ${newStatus}`
        );
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        error.errorCode = ERROR_CODES.INVALID_STATE_TRANSITION;
        throw error;
      }

      event.status = newStatus;
      await event.save();

      logger.info(`Event ${eventId} status changed to ${newStatus}`);
      return event;
    } catch (error) {
      logger.error(`Error changing event status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get events by organizer
   */
  async getOrganizerEvents(organizerId) {
    try {
      const events = await Event.findAll({
        where: { organizerId },
        order: [['date', 'ASC']],
      });

      return events;
    } catch (error) {
      logger.error(`Error fetching organizer events: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new EventService();
