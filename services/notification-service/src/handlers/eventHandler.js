const { createNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Handle EVENT_STATUS_CHANGED event
 * Notify all enrolled participants
 */
const handleEventStatusChanged = async (data) => {
  try {
    const { eventId, eventTitle, oldStatus, newStatus, enrolledUserIds } = data;

    if (!enrolledUserIds || enrolledUserIds.length === 0) {
      logger.info('No enrolled users to notify for event status change', { eventId });
      return;
    }

    // Determine priority based on status change
    let priority = 'medium';
    if (newStatus === 'CANCELLED') {
      priority = 'critical';
    } else if (newStatus === 'PUBLISHED') {
      priority = 'high';
    }

    // Create notifications for all enrolled users
    const promises = enrolledUserIds.map(userId =>
      createNotification(userId, {
        type: 'EVENT_STATUS_CHANGED',
        title: 'Event Status Update',
        message: `"${eventTitle}" status changed from ${oldStatus} to ${newStatus}`,
        priority,
        data: {
          eventId,
          eventTitle,
          oldStatus,
          newStatus
        }
      })
    );

    await Promise.allSettled(promises);

    logger.info('Event status changed notifications sent', {
      eventId,
      oldStatus,
      newStatus,
      recipientCount: enrolledUserIds.length
    });
  } catch (error) {
    logger.error('Error handling event status changed event', {
      error: error.message,
      data
    });
  }
};

/**
 * Handle EVENT_PUBLISHED event
 * This could be used to notify interested users (future feature)
 */
const handleEventPublished = async (data) => {
  try {
    const { eventId, eventTitle, organizerId } = data;

    // For now, just log
    logger.info('Event published', { eventId, eventTitle });

    // Future: Notify users who follow this organizer or category
  } catch (error) {
    logger.error('Error handling event published event', {
      error: error.message,
      data
    });
  }
};

/**
 * Handle EVENT_CANCELLED event
 * Notify all enrolled participants
 */
const handleEventCancelled = async (data) => {
  try {
    const { eventId, eventTitle, reason, enrolledUserIds } = data;

    if (!enrolledUserIds || enrolledUserIds.length === 0) {
      logger.info('No enrolled users to notify for event cancellation', { eventId });
      return;
    }

    // Create critical notifications for all enrolled users
    const promises = enrolledUserIds.map(userId =>
      createNotification(userId, {
        type: 'EVENT_CANCELLED',
        title: 'Event Cancelled',
        message: `"${eventTitle}" has been cancelled${reason ? `: ${reason}` : ''}`,
        priority: 'critical',
        data: {
          eventId,
          eventTitle,
          reason
        }
      })
    );

    await Promise.allSettled(promises);

    logger.info('Event cancelled notifications sent', {
      eventId,
      recipientCount: enrolledUserIds.length
    });
  } catch (error) {
    logger.error('Error handling event cancelled event', {
      error: error.message,
      data
    });
  }
};

/**
 * Handle EVENT_COMPLETED event
 * Notify all enrolled participants
 */
const handleEventCompleted = async (data) => {
  try {
    const { eventId, eventTitle, enrolledUserIds } = data;

    if (!enrolledUserIds || enrolledUserIds.length === 0) {
      logger.info('No enrolled users to notify for event completion', { eventId });
      return;
    }

    // Create notifications for all enrolled users
    const promises = enrolledUserIds.map(userId =>
      createNotification(userId, {
        type: 'EVENT_COMPLETED',
        title: 'Event Completed',
        message: `"${eventTitle}" has been completed. Thank you for participating!`,
        priority: 'low',
        data: {
          eventId,
          eventTitle
        }
      })
    );

    await Promise.allSettled(promises);

    logger.info('Event completed notifications sent', {
      eventId,
      recipientCount: enrolledUserIds.length
    });
  } catch (error) {
    logger.error('Error handling event completed event', {
      error: error.message,
      data
    });
  }
};

/**
 * Handle EVENT_UPDATED event
 * Notify all enrolled participants about important changes
 */
const handleEventUpdated = async (data) => {
  try {
    const { eventId, eventTitle, changes, enrolledUserIds } = data;

    if (!enrolledUserIds || enrolledUserIds.length === 0) {
      logger.info('No enrolled users to notify for event update', { eventId });
      return;
    }

    // Notify for all changes - event-service already filtered important fields
    // Important fields: title, description, startDate, endDate, startTime, endTime, location, maxParticipants
    if (!changes || changes.length === 0) {
      logger.info('No changes to notify about', { eventId });
      return;
    }

    // Create notifications for all enrolled users
    const promises = enrolledUserIds.map(userId =>
      createNotification(userId, {
        type: 'EVENT_UPDATED',
        title: 'Event Updated',
        message: `"${eventTitle}" has been updated. Please check the details.`,
        priority: 'high',
        data: {
          eventId,
          eventTitle,
          changes
        }
      })
    );

    await Promise.allSettled(promises);

    logger.info('Event updated notifications sent', {
      eventId,
      recipientCount: enrolledUserIds.length,
      changes
    });
  } catch (error) {
    logger.error('Error handling event updated event', {
      error: error.message,
      data
    });
  }
};

/**
 * Handle EVENT_STARTED event
 * Notify all enrolled participants when event starts
 */
const handleEventStarted = async (data) => {
  try {
    const { eventId, eventTitle, startTime, location, enrolledUserIds } = data;

    if (!enrolledUserIds || enrolledUserIds.length === 0) {
      logger.info('No enrolled users to notify for event start', { eventId });
      return;
    }

    // Create notifications for all enrolled users
    const promises = enrolledUserIds.map(userId =>
      createNotification(userId, {
        type: 'EVENT_STARTED',
        title: 'Event Starting Now',
        message: `"${eventTitle}" is now starting! ${location ? `Location: ${location}` : ''}`,
        priority: 'high',
        data: {
          eventId,
          eventTitle,
          startTime,
          location
        }
      })
    );

    await Promise.allSettled(promises);

    logger.info('Event started notifications sent', {
      eventId,
      recipientCount: enrolledUserIds.length
    });
  } catch (error) {
    logger.error('Error handling event started event', {
      error: error.message,
      data
    });
  }
};

module.exports = {
  handleEventStatusChanged,
  handleEventPublished,
  handleEventCancelled,
  handleEventCompleted,
  handleEventUpdated,
  handleEventStarted
};
