const Event = require('../models/Event');
const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpStatus');
const { EVENT_STATES, VALID_TRANSITIONS } = require('../constants/eventStates');
const axios = require('axios');
const { Op } = require('sequelize');

const ENROLLMENT_SERVICE_URL = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3003';

class EventService {
  /**
   * Helper: Get event IDs the user is enrolled in
   */
  async getUserEnrolledEventIds(userId) {
    try {
      const response = await axios.get(`${ENROLLMENT_SERVICE_URL}/me`, {
        headers: {
          'x-user-id': userId,
          // Note: These headers are required by enrollment-service's extractUser middleware
          // In a real scenario, we'd need to pass the full user context
          // For now, we only need the userId since we're just fetching enrollment data
          'x-user-email': 'internal-service-call@system',
          'x-user-role': 'INTERNAL',
        },
      });

      // Response structure: { success: true, message: "...", data: { enrollments: [...] } }
      // Extract event IDs from enrollments where status is 'active'
      const enrollments = response.data.data?.enrollments || [];
      
      const enrolledEventIds = enrollments
        .filter((enrollment) => enrollment.status === 'active')
        .map((enrollment) => enrollment.eventId);

      logger.info(`User ${userId} is enrolled in ${enrolledEventIds.length} events: [${enrolledEventIds.join(', ')}]`);
      
      return enrolledEventIds;
    } catch (error) {
      logger.error(`Error fetching user enrollments: ${error.message}`);
      if (error.response) {
        logger.error(`Response status: ${error.response.status}`);
        logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      // Return empty array if enrollment service is unavailable
      return [];
    }
  }

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
   * Get all events (with optional filters and visibility rules)
   * @param {Object} filters - Query filters (status, category, organizerId)
   * @param {string} userId - User ID (null for unauthenticated users)
   * @param {string} userRole - User role (null for unauthenticated users)
   */
  async getAllEvents(filters = {}, userId = null, userRole = null) {
    try {
      const where = {};

      // Apply base filters from query parameters
      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.organizerId) {
        where.organizerId = filters.organizerId;
      }

      // Apply visibility rules based on authentication and role
      if (!userId) {
        // Unauthenticated users: Only see Published and Running events (public discovery)
        where.status = {
          [Op.in]: [EVENT_STATES.PUBLISHED, EVENT_STATES.RUNNING],
        };
      } else if (userRole && userRole.toUpperCase() === 'PARTICIPANT') {
        // Participants: See Published/Running (all) + Completed/Canceled (only enrolled)
        
        // Get events the participant is enrolled in
        const enrolledEventIds = await this.getUserEnrolledEventIds(userId);

        // Build visibility conditions
        const visibilityConditions = [
          // Always show Published and Running events
          {
            status: {
              [Op.in]: [EVENT_STATES.PUBLISHED, EVENT_STATES.RUNNING],
            },
          },
        ];

        // Add Completed and Canceled events only if user is enrolled
        if (enrolledEventIds.length > 0) {
          visibilityConditions.push({
            [Op.and]: [
              {
                status: {
                  [Op.in]: [EVENT_STATES.COMPLETED, EVENT_STATES.CANCELED],
                },
              },
              {
                id: {
                  [Op.in]: enrolledEventIds,
                },
              },
            ],
          });
        }

        // Combine with existing where conditions
        if (Object.keys(where).length > 0) {
          where[Op.and] = [{ ...where }, { [Op.or]: visibilityConditions }];
          // Remove status from top level if it exists
          delete where.status;
        } else {
          where[Op.or] = visibilityConditions;
        }
      } else if (userRole && userRole.toUpperCase() === 'ORGANIZER') {
        // Organizers: See all their own events + Published/Running from others
        // Note: Organizers cannot enroll in events, so no enrollment-based visibility needed

        // Build visibility conditions
        const visibilityConditions = [
          // All events they organize (all states)
          { organizerId: userId },
          // Published and Running events from others (for discovery)
          {
            status: {
              [Op.in]: [EVENT_STATES.PUBLISHED, EVENT_STATES.RUNNING],
            },
          },
        ];

        // Combine with existing where conditions
        if (Object.keys(where).length > 0) {
          where[Op.and] = [{ ...where }, { [Op.or]: visibilityConditions }];
          // Remove status and organizerId from top level if they exist
          delete where.status;
          delete where.organizerId;
        } else {
          where[Op.or] = visibilityConditions;
        }
      }

      // Log the final where conditions for debugging
      logger.debug(`getAllEvents query - userId: ${userId}, role: ${userRole}, where: ${JSON.stringify(where, null, 2)}`);

      const events = await Event.findAll({
        where,
        order: [['startDate', 'ASC']],
      });

      logger.info(`Found ${events.length} events for user ${userId || 'unauthenticated'} with role ${userRole || 'none'}`);

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

      // Check if event is in a final or active state
      if (
        event.status === EVENT_STATES.RUNNING ||
        event.status === EVENT_STATES.COMPLETED ||
        event.status === EVENT_STATES.CANCELED
      ) {
        const error = new Error(
          'Cannot update event that has started, completed, or been canceled'
        );
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
        error.errorCode = ERROR_CODES.BAD_REQUEST;
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
        order: [['startDate', 'ASC']],
      });

      return events;
    } catch (error) {
      logger.error(`Error fetching organizer events: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update event participant count (for enrollment service)
   */
  async updateParticipantCount(eventId, increment = true) {
    try {
      const event = await this.getEventById(eventId);

      const newCount = increment
        ? event.currentParticipants + 1
        : Math.max(0, event.currentParticipants - 1);

      await event.update({ currentParticipants: newCount });

      logger.info(
        `Event ${eventId} participant count ${increment ? 'incremented' : 'decremented'} to ${newCount}`
      );
      return event;
    } catch (error) {
      logger.error(`Error updating participant count: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new EventService();
