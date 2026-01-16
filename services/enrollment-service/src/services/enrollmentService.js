const axios = require('axios');
const Enrollment = require('../models/Enrollment');
const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpStatus');
const { ENROLLMENT_STATUS, ENROLLABLE_EVENT_STATES } = require('../constants/enrollmentStates');

class EnrollmentService {
  /**
   * Fetch event details from Event Service
   */
  async getEventById(eventId) {
    try {
      const response = await axios.get(`${process.env.EVENT_SERVICE_URL}/${eventId}`);
      return response.data.data.event;
    } catch (error) {
      logger.error(`Error fetching event ${eventId}:`, error.message);

      if (error.response && error.response.status === 404) {
        const err = new Error('Event not found');
        err.statusCode = HTTP_STATUS.NOT_FOUND;
        err.errorCode = ERROR_CODES.NOT_FOUND;
        throw err;
      }

      const err = new Error('Failed to fetch event details');
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      err.errorCode = ERROR_CODES.EXTERNAL_SERVICE_ERROR;
      throw err;
    }
  }

  /**
   * Update event participant count in Event Service
   */
  async updateEventParticipantCount(eventId, increment = true) {
    try {
      // Call Event Service API to update participant count
      await axios.patch(`${process.env.EVENT_SERVICE_URL}/${eventId}/participants`, {
        increment,
      });

      logger.info(
        `Event ${eventId} participant count ${increment ? 'incremented' : 'decremented'}`
      );
    } catch (error) {
      logger.error(`Error updating event participant count: ${error.message}`);
      // Don't throw error - enrollment should succeed even if count update fails
      // This prevents inconsistent state between enrollment and event services
    }
  }

  /**
   * Enroll user in an event
   */
  async enrollInEvent(eventId, userId, userRole) {
    const { sequelize } = require('../config/database');
    const transaction = await sequelize.transaction();

    try {
      // 1. Check if user is a participant (organizers cannot enroll)
      if (userRole && userRole.toUpperCase() === 'ORGANIZER') {
        const error = new Error(
          'Organizers cannot enroll in events. Only participants can enroll.'
        );
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        error.errorCode = ERROR_CODES.AUTHORIZATION_ERROR;
        throw error;
      }

      // 2. Fetch event details from Event Service
      const event = await this.getEventById(eventId);

      // 3. Check if event is in Published state
      if (!ENROLLABLE_EVENT_STATES.includes(event.status)) {
        const error = new Error(
          `Cannot enroll in event with status "${event.status}". Only Published events allow enrollment.`
        );
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        error.errorCode = ERROR_CODES.INVALID_EVENT_STATE;
        throw error;
      }

      // 4. Check if event has reached capacity
      if (event.currentParticipants >= event.maxParticipants) {
        const error = new Error('Event has reached maximum capacity');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        error.errorCode = ERROR_CODES.CAPACITY_FULL;
        throw error;
      }

      // 5. Check if user already has an enrollment (active or canceled)
      const existingEnrollment = await Enrollment.findOne({
        where: {
          userId,
          eventId,
        },
        transaction,
      });

      if (existingEnrollment) {
        if (existingEnrollment.status === ENROLLMENT_STATUS.ACTIVE) {
          // User is already enrolled
          const error = new Error('You are already enrolled in this event');
          error.statusCode = HTTP_STATUS.CONFLICT;
          error.errorCode = ERROR_CODES.ALREADY_ENROLLED;
          throw error;
        } else {
          // User had canceled before - reactivate enrollment
          existingEnrollment.status = ENROLLMENT_STATUS.ACTIVE;
          existingEnrollment.enrolledAt = new Date();
          await existingEnrollment.save({ transaction });
          
          await transaction.commit();
          
          // Update event participant count (outside transaction)
          await this.updateEventParticipantCount(eventId, true);
          
          logger.info(`User ${userId} re-enrolled in event ${eventId}`);
          return existingEnrollment;
        }
      }

      // 6. Create new enrollment within transaction
      const enrollment = await Enrollment.create(
        {
          userId,
          eventId,
          status: ENROLLMENT_STATUS.ACTIVE,
          enrolledAt: new Date(),
        },
        { transaction }
      );

      // Commit transaction
      await transaction.commit();

      // 7. Update event participant count (outside transaction, non-critical)
      await this.updateEventParticipantCount(eventId, true);

      logger.info(`User ${userId} enrolled in event ${eventId}`);
      return enrollment;
    } catch (error) {
      // Rollback transaction on any error
      await transaction.rollback();
      logger.error(`Error enrolling in event: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unenroll user from an event
   */
  async unenrollFromEvent(eventId, userId, userRole) {
    try {
      // 1. Check if user is a participant (organizers cannot unenroll)
      if (userRole && userRole.toUpperCase() === 'ORGANIZER') {
        const error = new Error(
          'Organizers cannot unenroll from events. Only participants can unenroll.'
        );
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        error.errorCode = ERROR_CODES.AUTHORIZATION_ERROR;
        throw error;
      }

      // 2. Fetch event details
      const event = await this.getEventById(eventId);

      // 3. Check if event is in Published state
      if (!ENROLLABLE_EVENT_STATES.includes(event.status)) {
        const error = new Error(
          `Cannot unenroll from event with status "${event.status}". Only Published events allow unenrollment.`
        );
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        error.errorCode = ERROR_CODES.INVALID_EVENT_STATE;
        throw error;
      }

      // 4. Find active enrollment
      const enrollment = await Enrollment.findOne({
        where: {
          userId,
          eventId,
          status: ENROLLMENT_STATUS.ACTIVE,
        },
      });

      if (!enrollment) {
        const error = new Error('You are not enrolled in this event');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        error.errorCode = ERROR_CODES.NOT_FOUND;
        throw error;
      }

      // 5. Cancel enrollment (soft delete)
      enrollment.status = ENROLLMENT_STATUS.CANCELED;
      await enrollment.save();

      // 6. Update event participant count
      await this.updateEventParticipantCount(eventId, false);

      logger.info(`User ${userId} unenrolled from event ${eventId}`);
      return enrollment;
    } catch (error) {
      logger.error(`Error unenrolling from event: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's enrollments
   */
  async getUserEnrollments(userId) {
    try {
      const enrollments = await Enrollment.findAll({
        where: {
          userId,
          status: ENROLLMENT_STATUS.ACTIVE,
        },
        order: [['enrolled_at', 'DESC']],
      });

      // Fetch event details for each enrollment
      const enrollmentsWithEvents = await Promise.all(
        enrollments.map(async (enrollment) => {
          try {
            const event = await this.getEventById(enrollment.eventId);
            return {
              ...enrollment.toJSON(),
              event,
            };
          } catch (error) {
            logger.error(`Error fetching event ${enrollment.eventId}: ${error.message}`);
            return {
              ...enrollment.toJSON(),
              event: null,
            };
          }
        })
      );

      return enrollmentsWithEvents;
    } catch (error) {
      logger.error(`Error fetching user enrollments: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get enrollments for a specific event (only event organizer can access)
   */
  async getEventEnrollments(eventId, userId) {
    try {
      // 1. Fetch event to check ownership
      const event = await this.getEventById(eventId);

      // 2. Check if user is the organizer of this event
      if (event.organizerId !== userId) {
        const error = new Error(
          'Only the event organizer can view enrollments for their events'
        );
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        error.errorCode = ERROR_CODES.AUTHORIZATION_ERROR;
        throw error;
      }

      // 3. Fetch enrollments
      const enrollments = await Enrollment.findAll({
        where: {
          eventId,
          status: ENROLLMENT_STATUS.ACTIVE,
        },
        order: [['enrolled_at', 'ASC']],
      });

      return enrollments;
    } catch (error) {
      logger.error(`Error fetching event enrollments: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if user is enrolled in an event
   */
  async isUserEnrolled(eventId, userId) {
    try {
      const enrollment = await Enrollment.findOne({
        where: {
          userId,
          eventId,
          status: ENROLLMENT_STATUS.ACTIVE,
        },
      });

      return !!enrollment;
    } catch (error) {
      logger.error(`Error checking enrollment status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get event statistics (only event organizer can access)
   * Returns registration metrics, capacity utilization, and cancellation data
   */
  async getEventStatistics(eventId, userId) {
    try {
      // 1. Fetch event to check ownership and get capacity data
      const event = await this.getEventById(eventId);

      // 2. Check if user is the organizer of this event
      if (event.organizerId !== userId) {
        const error = new Error(
          'Only the event organizer can view statistics for their events'
        );
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        error.errorCode = ERROR_CODES.AUTHORIZATION_ERROR;
        throw error;
      }

      // 3. Get all enrollments (active + canceled) for statistics
      const allEnrollments = await Enrollment.findAll({
        where: {
          eventId,
        },
      });

      // 4. Calculate registration metrics
      const totalRegistrations = allEnrollments.length;
      const activeRegistrations = allEnrollments.filter(
        (e) => e.status === ENROLLMENT_STATUS.ACTIVE
      ).length;
      const canceledRegistrations = allEnrollments.filter(
        (e) => e.status === ENROLLMENT_STATUS.CANCELED
      ).length;

      // 5. Calculate cancellation rate (percentage)
      const cancellationRate =
        totalRegistrations > 0
          ? parseFloat(((canceledRegistrations / totalRegistrations) * 100).toFixed(2))
          : 0;

      // 6. Calculate capacity metrics
      const maxCapacity = event.maxParticipants;
      const currentCapacity = event.currentParticipants;
      const availableSpots = Math.max(0, maxCapacity - currentCapacity);
      const utilizationRate =
        maxCapacity > 0
          ? parseFloat(((currentCapacity / maxCapacity) * 100).toFixed(2))
          : 0;

      // 7. Build statistics response
      const statistics = {
        eventId: event.id,
        eventTitle: event.title,
        eventStatus: event.status,
        eventDate: event.date,
        registrations: {
          total: totalRegistrations,
          active: activeRegistrations,
          canceled: canceledRegistrations,
          cancellationRate: cancellationRate,
        },
        capacity: {
          max: maxCapacity,
          current: currentCapacity,
          available: availableSpots,
          utilizationRate: utilizationRate,
        },
      };

      logger.info(`Statistics retrieved for event ${eventId} by organizer ${userId}`);
      return statistics;
    } catch (error) {
      logger.error(`Error fetching event statistics: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new EnrollmentService();
