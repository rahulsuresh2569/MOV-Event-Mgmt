const { createNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Handle CAPACITY_80_PERCENT event
 * Notify organizer that event is nearing capacity
 */
const handleCapacity80Percent = async (data) => {
  try {
    const { eventId, eventTitle, organizerId, currentParticipants, maxParticipants, threshold } = data;
    const percentFull = Math.round((currentParticipants / maxParticipants) * 100);

    await createNotification(organizerId, {
      type: 'CAPACITY_80_PERCENT',
      title: 'Event Nearing Capacity',
      message: `"${eventTitle}" is ${percentFull}% full (${currentParticipants}/${maxParticipants})`,
      priority: 'high',
      data: {
        eventId,
        eventTitle,
        currentParticipants,
        maxParticipants,
        percentFull
      }
    });

    logger.info('80% capacity notification sent', {
      eventId,
      organizerId,
      currentParticipants,
      maxParticipants
    });
  } catch (error) {
    logger.error('Error handling 80% capacity event', {
      error: error.message,
      data
    });
  }
};

/**
 * Handle CAPACITY_90_PERCENT event
 * Notify organizer that event is almost full
 */
const handleCapacity90Percent = async (data) => {
  try {
    const { eventId, eventTitle, organizerId, currentParticipants, maxParticipants, threshold } = data;
    const percentFull = Math.round((currentParticipants / maxParticipants) * 100);

    await createNotification(organizerId, {
      type: 'CAPACITY_90_PERCENT',
      title: 'Event Almost Full',
      message: `"${eventTitle}" is ${percentFull}% full (${currentParticipants}/${maxParticipants}). Almost at capacity!`,
      priority: 'high',
      data: {
        eventId,
        eventTitle,
        currentParticipants,
        maxParticipants,
        percentFull
      }
    });

    logger.info('90% capacity notification sent', {
      eventId,
      organizerId,
      currentParticipants,
      maxParticipants
    });
  } catch (error) {
    logger.error('Error handling 90% capacity event', {
      error: error.message,
      data
    });
  }
};

/**
 * Handle CAPACITY_FULL event
 * Notify organizer that event reached full capacity
 */
const handleCapacityFull = async (data) => {
  try {
    const { eventId, eventTitle, organizerId, currentParticipants, maxParticipants } = data;

    await createNotification(organizerId, {
      type: 'CAPACITY_FULL',
      title: 'Event Full',
      message: `"${eventTitle}" has reached full capacity (${currentParticipants}/${maxParticipants})`,
      priority: 'critical',
      data: {
        eventId,
        eventTitle,
        currentParticipants,
        maxParticipants
      }
    });

    logger.info('Full capacity notification sent', {
      eventId,
      organizerId,
      currentParticipants,
      maxParticipants
    });
  } catch (error) {
    logger.error('Error handling full capacity event', {
      error: error.message,
      data
    });
  }
};

/**
 * Handle CAPACITY_AVAILABLE event
 * Notify organizer when spots become available after cancellation
 */
const handleCapacityAvailable = async (data) => {
  try {
    const { eventId, eventTitle, organizerId, currentParticipants, maxParticipants } = data;
    const percentFull = Math.round((currentParticipants / maxParticipants) * 100);

    await createNotification(organizerId, {
      type: 'CAPACITY_AVAILABLE',
      title: 'Capacity Available',
      message: `Spots available in "${eventTitle}" (${currentParticipants}/${maxParticipants})`,
      priority: 'medium',
      data: {
        eventId,
        eventTitle,
        currentParticipants,
        maxParticipants,
        percentFull
      }
    });

    logger.info('Capacity available notification sent', {
      eventId,
      organizerId,
      currentParticipants,
      maxParticipants
    });
  } catch (error) {
    logger.error('Error handling capacity available event', {
      error: error.message,
      data
    });
  }
};

module.exports = {
  handleCapacity80Percent,
  handleCapacity90Percent,
  handleCapacityFull,
  handleCapacityAvailable
};
