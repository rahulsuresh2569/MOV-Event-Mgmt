const { getSubscriber } = require('../config/redis');
const logger = require('../utils/logger');

// Import event handlers
const enrollmentHandler = require('../handlers/enrollmentHandler');
const eventHandler = require('../handlers/eventHandler');
const capacityHandler = require('../handlers/capacityHandler');
const messageHandler = require('../handlers/messageHandler');

// Map event types to handlers
const eventHandlers = {
  // Enrollment events
  'ENROLLMENT_CREATED': enrollmentHandler.handleEnrollmentCreated,
  'ENROLLMENT_CANCELLED': enrollmentHandler.handleEnrollmentCancelled,
  
  // Event lifecycle events
  'EVENT_STATUS_CHANGED': eventHandler.handleEventStatusChanged,
  'EVENT_PUBLISHED': eventHandler.handleEventPublished,
  'EVENT_STARTED': eventHandler.handleEventStarted,
  'EVENT_CANCELLED': eventHandler.handleEventCancelled,
  'EVENT_COMPLETED': eventHandler.handleEventCompleted,
  'EVENT_UPDATED': eventHandler.handleEventUpdated,
  
  // Capacity events
  'CAPACITY_80_PERCENT': capacityHandler.handleCapacity80Percent,
  'CAPACITY_90_PERCENT': capacityHandler.handleCapacity90Percent,
  'CAPACITY_FULL': capacityHandler.handleCapacityFull,
  'CAPACITY_AVAILABLE': capacityHandler.handleCapacityAvailable,
  
  // Message events
  'MESSAGE_RECEIVED': messageHandler.handleMessageReceived,
  'INQUIRY_RECEIVED': messageHandler.handleInquiryReceived,
  'INQUIRY_REPLIED': messageHandler.handleInquiryReplied
};

let isRunning = false;
let subscriber = null;

/**
 * Start the event bus (subscribe to Redis events)
 */
const startEventBus = async () => {
  if (isRunning) {
    logger.warn('Event bus already running');
    return;
  }

  try {
    subscriber = getSubscriber();
    
    // Subscribe to events channel
    await subscriber.subscribe('events', async (message) => {
      try {
        const event = JSON.parse(message);
        
        logger.info('Event received', {
          type: event.type,
          timestamp: event.timestamp
        });

        // Find and execute handler
        const handler = eventHandlers[event.type];
        
        if (handler) {
          await handler(event.data);
        } else {
          logger.warn('No handler for event type', {
            type: event.type
          });
        }
      } catch (error) {
        logger.error('Error processing event', {
          error: error.message,
          stack: error.stack,
          message
        });
      }
    });

    isRunning = true;
    logger.info('Event bus started and subscribed to events channel');
  } catch (error) {
    logger.error('Failed to start event bus', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Stop the event bus
 */
const stopEventBus = async () => {
  if (!isRunning) {
    return;
  }

  try {
    if (subscriber) {
      await subscriber.unsubscribe('events');
      logger.info('Unsubscribed from events channel');
    }
    
    isRunning = false;
    logger.info('Event bus stopped');
  } catch (error) {
    logger.error('Error stopping event bus', {
      error: error.message
    });
    throw error;
  }
};

/**
 * Check if event bus is running
 */
const isEventBusRunning = () => {
  return isRunning;
};

module.exports = {
  startEventBus,
  stopEventBus,
  isEventBusRunning
};
