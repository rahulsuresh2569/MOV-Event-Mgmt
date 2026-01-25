const cron = require('node-cron');
const Event = require('../models/Event');
const { EVENT_STATES } = require('../constants/eventStates');
const { publishEvent } = require('../config/redis');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const axios = require('axios');

const ENROLLMENT_SERVICE_URL = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3003';

/**
 * Event State Scheduler
 * 
 * Automatically transitions event states based on time:
 * - Published → Running: when event start date (startDate) is reached
 * - Running → Completed: when event end date (endDate) is reached
 * 
 * Runs every 5 minutes to check and update event states.
 */
class EventStateScheduler {
  constructor() {
    this.task = null;
    this.isRunning = false;
  }

  /**
   * Start the scheduler
   * Runs every 5 minutes: cron pattern '* /5 * * * *' (without space)
   * Cron pattern: minute hour day month weekday
   */
  start() {
    if (this.task) {
      logger.warn('Event state scheduler is already running');
      return;
    }

    // Schedule to run every 5 minutes
    this.task = cron.schedule('*/5 * * * *', async () => {
      await this.runStateCheck();
    });

    logger.info('Event state scheduler started (runs every 5 minutes)');
  }

  /**
   * Execute the state check process
   */
  async runStateCheck() {
    if (this.isRunning) {
      logger.warn('Previous scheduler run still in progress, skipping this cycle');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Running scheduled event state check');

      const publishedCount = await this.checkPublishedEvents();
      const runningCount = await this.checkRunningEvents();

      const duration = Date.now() - startTime;
      logger.info(
        `Scheduler completed: ${publishedCount} events started, ${runningCount} events completed (${duration}ms)`
      );
    } catch (error) {
      logger.error(`Scheduler error: ${error.message}`, { stack: error.stack });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Check Published events and transition to Running if start date has passed
   * @returns {number} Number of events transitioned
   */
  async checkPublishedEvents() {
    try {
      const eventsToStart = await Event.findAll({
        where: {
          status: EVENT_STATES.PUBLISHED,
          startDate: {
            [Op.lte]: new Date(), // startDate <= current time
          },
        },
      });

      let transitionedCount = 0;

      for (const event of eventsToStart) {
        try {
          const oldStatus = event.status;
          event.status = EVENT_STATES.RUNNING;
          await event.save();

          logger.info(
            `Auto-transitioned event ${event.id} ("${event.title}") from Published to Running`
          );
          
          // Get enrolled users for notifications
          const enrolledUserIds = await this.getEnrolledUserIds(event.id);
          
          // Publish status change events
          await publishEvent('EVENT_STATUS_CHANGED', {
            eventId: event.id,
            eventTitle: event.title,
            organizerId: event.organizerId,
            oldStatus: oldStatus,
            newStatus: EVENT_STATES.RUNNING,
            enrolledUserIds: enrolledUserIds
          });

          // Publish specific event started notification
          await publishEvent('EVENT_STARTED', {
            eventId: event.id,
            eventTitle: event.title,
            organizerId: event.organizerId,
            startTime: event.startTime,
            location: event.location,
            enrolledUserIds: enrolledUserIds
          });

          transitionedCount++;
        } catch (error) {
          logger.error(
            `Failed to transition event ${event.id} to Running: ${error.message}`,
            { eventId: event.id, error: error.message }
          );
        }
      }

      return transitionedCount;
    } catch (error) {
      logger.error(`Error checking Published events: ${error.message}`);
      return 0;
    }
  }

  /**
   * Check Running events and transition to Completed if end date has passed
   * @returns {number} Number of events transitioned
   */
  async checkRunningEvents() {
    try {
      const eventsToComplete = await Event.findAll({
        where: {
          status: EVENT_STATES.RUNNING,
          endDate: {
            [Op.ne]: null, // endDate is not null
            [Op.lte]: new Date(), // endDate <= current time
          },
        },
      });

      let transitionedCount = 0;

      for (const event of eventsToComplete) {
        try {
          const oldStatus = event.status;
          event.status = EVENT_STATES.COMPLETED;
          await event.save();

          logger.info(
            `Auto-transitioned event ${event.id} ("${event.title}") from Running to Completed`
          );
          
          // Get enrolled users for notifications
          const enrolledUserIds = await this.getEnrolledUserIds(event.id);
          
          // Publish status change events
          await publishEvent('EVENT_STATUS_CHANGED', {
            eventId: event.id,
            eventTitle: event.title,
            organizerId: event.organizerId,
            oldStatus: oldStatus,
            newStatus: EVENT_STATES.COMPLETED,
            enrolledUserIds: enrolledUserIds
          });

          await publishEvent('EVENT_COMPLETED', {
            eventId: event.id,
            eventTitle: event.title,
            organizerId: event.organizerId,
            enrolledUserIds: enrolledUserIds
          });

          transitionedCount++;
        } catch (error) {
          logger.error(
            `Failed to transition event ${event.id} to Completed: ${error.message}`,
            { eventId: event.id, error: error.message }
          );
        }
      }

      return transitionedCount;
    } catch (error) {
      logger.error(`Error checking Running events: ${error.message}`);
      return 0;
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Event state scheduler stopped');
    }
  }

  /**
   * Check if scheduler is active
   * @returns {boolean}
   */
  isActive() {
    return this.task !== null;
  }

  /**
   * Get enrolled user IDs for an event
   */
  async getEnrolledUserIds(eventId) {
    try {
      const response = await axios.get(`${ENROLLMENT_SERVICE_URL}/event/${eventId}`, {
        headers: {
          'x-user-id': 'system',
          'x-user-email': 'scheduler@system',
          'x-user-role': 'INTERNAL',
        },
      });

      const enrollments = response.data.data?.enrollments || [];
      const enrolledUserIds = enrollments
        .filter((enrollment) => enrollment.status === 'active')
        .map((enrollment) => enrollment.userId);

      return enrolledUserIds;
    } catch (error) {
      logger.error(`Error fetching enrolled users for event ${eventId}: ${error.message}`);
      return [];
    }
  }
}

module.exports = new EventStateScheduler();
