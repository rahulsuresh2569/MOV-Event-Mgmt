const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const { extractUser } = require('../middleware/extractUser');
const axios = require('axios');
const logger = require('../utils/logger');

// Extract user middleware
router.use(extractUser);

/**
 * @swagger
 * /api/v1/inquiries/my-inquiries:
 *   get:
 *     summary: Get all inquiries sent by the authenticated user
 *     tags: [Inquiries]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's inquiries
 *       401:
 *         description: Unauthorized
 */
router.get('/my-inquiries', async (req, res) => {
  try {
    const inquiries = await Inquiry.find({
      inquirerId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: inquiries,
    });
  } catch (error) {
    logger.error(`Error fetching user inquiries: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiries',
    });
  }
});

/**
 * @swagger
 * /api/v1/inquiries/events/{eventId}/inquiries:
 *   get:
 *     summary: Get all inquiries for an event (organizer only)
 *     tags: [Inquiries]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of event inquiries
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only organizer can view inquiries
 */
router.get('/events/:eventId/inquiries', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    // Verify user is organizer of this event
    const eventResponse = await axios.get(`http://event-service:3002/api/v1/events/${eventId}`);
    const event = eventResponse.data.data;

    if (!event || event.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the event organizer can view inquiries',
      });
    }

    const inquiries = await Inquiry.find({
      eventId: eventId,
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: {
        eventId,
        eventTitle: event.title,
        inquiries,
      },
    });
  } catch (error) {
    logger.error(`Error fetching event inquiries: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event inquiries',
    });
  }
});

/**
 * @swagger
 * /api/v1/inquiries/events/{eventId}/inquiries:
 *   post:
 *     summary: Send an inquiry to an event organizer
 *     tags: [Inquiries]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - question
 *             properties:
 *               subject:
 *                 type: string
 *               question:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inquiry sent successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Event not found
 */
router.post('/events/:eventId/inquiries', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const { subject, question } = req.body;

    if (!subject || !question) {
      return res.status(400).json({
        success: false,
        message: 'Subject and question are required',
      });
    }

    // Fetch event details
    const eventResponse = await axios.get(`http://event-service:3002/api/v1/events/${eventId}`);
    const event = eventResponse.data.data;

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Only allow inquiries for published events
    if (event.status !== 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        message: 'This event is not open for inquiries',
      });
    }

    // Create inquiry
    const inquiry = await Inquiry.create({
      eventId: eventId,
      eventTitle: event.title,
      organizerId: event.organizerId,
      inquirerId: req.user.id,
      inquirerEmail: req.user.email,
      inquirerName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
      inquirerRole: req.user.role,
      subject: subject,
      question: question,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Your inquiry has been sent to the event organizer',
      data: inquiry,
    });

    logger.info(`Inquiry created for event ${eventId} by user ${req.user.id}`);
  } catch (error) {
    logger.error(`Error creating inquiry: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to send inquiry',
    });
  }
});

/**
 * @swagger
 * /api/v1/inquiries/{inquiryId}/reply:
 *   post:
 *     summary: Reply to an inquiry (organizer only)
 *     tags: [Inquiries]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inquiryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reply
 *             properties:
 *               reply:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reply sent successfully
 *       403:
 *         description: Only organizer can reply
 *       404:
 *         description: Inquiry not found
 */
router.post('/:inquiryId/reply', async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({
        success: false,
        message: 'Reply is required',
      });
    }

    // Find inquiry
    const inquiry = await Inquiry.findById(inquiryId);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found',
      });
    }

    // Verify user is the organizer
    if (inquiry.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the event organizer can reply to inquiries',
      });
    }

    // Update inquiry
    inquiry.reply = reply;
    inquiry.repliedAt = new Date();
    inquiry.status = 'replied';
    await inquiry.save();

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      data: inquiry,
    });

    logger.info(`Inquiry ${inquiryId} replied by organizer ${req.user.id}`);
  } catch (error) {
    logger.error(`Error replying to inquiry: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
    });
  }
});

/**
 * @swagger
 * /api/v1/inquiries/{inquiryId}:
 *   get:
 *     summary: Get a specific inquiry
 *     tags: [Inquiries]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inquiryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inquiry details
 *       403:
 *         description: Unauthorized to view this inquiry
 *       404:
 *         description: Inquiry not found
 */
router.get('/:inquiryId', async (req, res) => {
  try {
    const { inquiryId } = req.params;

    const inquiry = await Inquiry.findById(inquiryId);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found',
      });
    }

    // Only inquirer or organizer can view
    if (inquiry.inquirerId !== req.user.id && inquiry.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this inquiry',
      });
    }

    // Mark as read if organizer is viewing
    if (inquiry.organizerId === req.user.id && !inquiry.isRead) {
      inquiry.isRead = true;
      inquiry.readAt = new Date();
      await inquiry.save();
    }

    res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    logger.error(`Error fetching inquiry: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiry',
    });
  }
});

module.exports = router;
