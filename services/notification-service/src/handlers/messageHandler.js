const { createNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Handle MESSAGE_RECEIVED event
 * Notify recipient of new message (direct or group)
 */
const handleMessageReceived = async (data) => {
  try {
    const { messageId, conversationId, senderId, senderName, recipientId, message, conversationType, eventId, eventTitle } = data;

    // Handle both direct and group messages
    if (conversationType === 'direct') {
      // Direct message notification
      await createNotification(recipientId, {
        type: 'MESSAGE_RECEIVED',
        title: `New message from ${senderName}`,
        message: message.length > 100 ? `${message.substring(0, 100)}...` : message,
        priority: 'medium',
        data: {
          messageId,
          conversationId,
          senderId,
          senderName,
          conversationType,
          eventId,
          eventTitle
        }
      });

      logger.info('Direct message notification sent', {
        messageId,
        conversationId,
        recipientId
      });
    } else if (conversationType === 'group') {
      // Group message notification
      await createNotification(recipientId, {
        type: 'MESSAGE_RECEIVED',
        title: `New message in ${eventTitle}`,
        message: `${senderName}: ${message.length > 100 ? `${message.substring(0, 100)}...` : message}`,
        priority: 'medium',
        data: {
          messageId,
          conversationId,
          senderId,
          senderName,
          conversationType,
          eventId,
          eventTitle
        }
      });

      logger.info('Group message notification sent', {
        messageId,
        conversationId,
        recipientId,
        eventId
      });
    }
  } catch (error) {
    logger.error('Error handling message received event', {
      error: error.message,
      data
    });
  }
};

/**
 * Handle INQUIRY_RECEIVED event
 * Notify organizer of new pre-enrollment inquiry
 */
const handleInquiryReceived = async (data) => {
  try {
    const { inquiryId, eventId, eventTitle, organizerId, participantName, question } = data;

    await createNotification(organizerId, {
      type: 'INQUIRY_RECEIVED',
      title: 'New Inquiry',
      message: `${participantName} has a question about "${eventTitle}"`,
      priority: 'high',
      data: {
        inquiryId,
        eventId,
        eventTitle,
        participantName,
        question: question.length > 200 ? `${question.substring(0, 200)}...` : question
      }
    });

    logger.info('Inquiry received notification sent', {
      inquiryId,
      eventId,
      organizerId
    });
  } catch (error) {
    logger.error('Error handling inquiry received event', {
      error: error.message,
      data
    });
  }
};

/**
 * Handle INQUIRY_REPLIED event
 * Notify participant that organizer replied to their inquiry
 */
const handleInquiryReplied = async (data) => {
  try {
    const { inquiryId, eventId, eventTitle, participantId, organizerName } = data;

    await createNotification(participantId, {
      type: 'INQUIRY_RECEIVED',
      title: 'Inquiry Reply',
      message: `${organizerName} replied to your inquiry about "${eventTitle}"`,
      priority: 'high',
      data: {
        inquiryId,
        eventId,
        eventTitle,
        organizerName
      }
    });

    logger.info('Inquiry replied notification sent', {
      inquiryId,
      eventId,
      participantId
    });
  } catch (error) {
    logger.error('Error handling inquiry replied event', {
      error: error.message,
      data
    });
  }
};

module.exports = {
  handleMessageReceived,
  handleInquiryReceived,
  handleInquiryReplied
};
