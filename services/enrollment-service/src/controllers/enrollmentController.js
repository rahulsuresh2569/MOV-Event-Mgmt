const enrollmentService = require('../services/enrollmentService');
const { successResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS } = require('../constants/httpStatus');
const { enrollEventSchema } = require('../validators/enrollmentValidator');

class EnrollmentController {
  /**
   * Enroll in an event
   * POST /enrollments
   */
  async enrollInEvent(req, res, next) {
    try {
      const { error, value } = enrollEventSchema.validate(req.body);
      if (error) {
        error.isJoi = true;
        throw error;
      }

      const enrollment = await enrollmentService.enrollInEvent(
        value.eventId,
        req.user.id,
        req.user.role
      );

      return successResponse(res, HTTP_STATUS.CREATED, 'Enrolled successfully', { enrollment });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Unenroll from an event
   * DELETE /enrollments/:eventId
   */
  async unenrollFromEvent(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);

      if (!eventId || eventId <= 0) {
        const error = new Error('Invalid event ID');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      await enrollmentService.unenrollFromEvent(eventId, req.user.id, req.user.role);

      return successResponse(res, HTTP_STATUS.OK, 'Unenrolled successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get user's enrollments
   * GET /enrollments/me
   */
  async getMyEnrollments(req, res, next) {
    try {
      const enrollments = await enrollmentService.getUserEnrollments(req.user.id);

      return successResponse(res, HTTP_STATUS.OK, 'Enrollments retrieved successfully', {
        enrollments,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get enrollments for a specific event (organizer only)
   * GET /enrollments/event/:eventId
   */
  async getEventEnrollments(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);

      if (!eventId || eventId <= 0) {
        const error = new Error('Invalid event ID');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      const enrollments = await enrollmentService.getEventEnrollments(eventId, req.user.id);

      return successResponse(res, HTTP_STATUS.OK, 'Event enrollments retrieved successfully', {
        enrollments,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Check if user is enrolled in an event
   * GET /enrollments/check/:eventId
   */
  async checkEnrollmentStatus(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);

      if (!eventId || eventId <= 0) {
        const error = new Error('Invalid event ID');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      const isEnrolled = await enrollmentService.isUserEnrolled(eventId, req.user.id);

      return successResponse(res, HTTP_STATUS.OK, 'Enrollment status checked', {
        isEnrolled,
        eventId,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get event statistics
   * GET /event/:eventId/statistics
   */
  async getEventStatistics(req, res, next) {
    try {
      const eventId = parseInt(req.params.eventId, 10);

      if (!eventId || eventId <= 0) {
        const error = new Error('Invalid event ID');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      const statistics = await enrollmentService.getEventStatistics(eventId, req.user.id);

      return successResponse(
        res,
        HTTP_STATUS.OK,
        'Event statistics retrieved successfully',
        statistics
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EnrollmentController();
