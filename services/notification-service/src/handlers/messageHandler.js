const { createNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Handle MESSAGE_RECEIVED event
 * Notify recipient of new direct message
 * Note: Group messages are handled by chat-service directly
 */
const handleMessageReceived = async (data) => {
  try {
    const { messageId, conversationId, senderId, senderName, recipientId, message, conversationType } = data;

    // Only handle direct messages (1-on-1)
    if (conversationType !== 'direct') {
      logger.debug('Skipping group message notification', {
        conversationId,
        conversationType
      });
      return;
    }

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
        conversationType
      }
    });

    logger.info('Message received notification sent', {
      messageId,
      conversationId,
      recipientId
    });
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
