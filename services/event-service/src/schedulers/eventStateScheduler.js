const cron = require('node-cron');
const Event = require('../models/Event');
const { EVENT_STATES } = require('../constants/eventStates');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

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
          event.status = EVENT_STATES.RUNNING;
          await event.save();

          logger.info(
            `Auto-transitioned event ${event.id} ("${event.title}") from Published to Running`
          );
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
          event.status = EVENT_STATES.COMPLETED;
          await event.save();

          logger.info(
            `Auto-transitioned event ${event.id} ("${event.title}") from Running to Completed`
          );
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
}

module.exports = new EventStateScheduler();
