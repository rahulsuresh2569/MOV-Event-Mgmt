const { createNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Handle ENROLLMENT_CREATED event
 * Notify both the participant (confirmation) and organizer
 */
const handleEnrollmentCreated = async (data) => {
  try {
    const { enrollmentId, userId, eventId, userName, eventTitle, organizerId } = data;

    // Notify participant (confirmation)
    await createNotification(userId, {
      type: 'ENROLLMENT_CREATED',
      title: 'Enrollment Confirmed',
      message: `You have successfully enrolled in "${eventTitle}"`,
      priority: 'high',
      data: {
        enrollmentId,
        eventId,
        eventTitle
      }
    });

    // Notify organizer (if different from participant)
    if (organizerId && organizerId !== userId) {
      await createNotification(organizerId, {
        type: 'ENROLLMENT_CREATED',
        title: 'New Enrollment',
        message: `${userName} has enrolled in "${eventTitle}"`,
        priority: 'medium',
        data: {
          enrollmentId,
          eventId,
          eventTitle,
          userId,
          userName
        }
      });
    }

    logger.info('Enrollment created notifications sent', {
      enrollmentId,
      userId,
      organizerId
    });
  } catch (error) {
    logger.error('Error handling enrollment created event', {
      error: error.message,
      data
    });
  }
};

/**
 * Handle ENROLLMENT_CANCELLED event
 * Notify both participant and organizer
 */
const handleEnrollmentCancelled = async (data) => {
  try {
    const { enrollmentId, userId, eventId, userName, eventTitle, organizerId, cancelledBy } = data;

    // Notify participant
    await createNotification(userId, {
      type: 'ENROLLMENT_CANCELLED',
      title: 'Enrollment Cancelled',
      message: `Your enrollment in "${eventTitle}" has been cancelled`,
      priority: 'high',
      data: {
        enrollmentId,
        eventId,
        eventTitle,
        cancelledBy
      }
    });

    // Notify organizer (if cancelled by participant and organizer is different)
    if (organizerId && organizerId !== userId && cancelledBy === 'participant') {
      await createNotification(organizerId, {
        type: 'ENROLLMENT_CANCELLED',
        title: 'Enrollment Cancelled',
        message: `${userName} has cancelled their enrollment in "${eventTitle}"`,
        priority: 'medium',
        data: {
          enrollmentId,
          eventId,
          eventTitle,
          userId,
          userName
        }
      });
    }

    logger.info('Enrollment cancelled notifications sent', {
      enrollmentId,
      userId,
      organizerId
    });
  } catch (error) {
    logger.error('Error handling enrollment cancelled event', {
      error: error.message,
      data
    });
  }
};

module.exports = {
  handleEnrollmentCreated,
  handleEnrollmentCancelled
};
