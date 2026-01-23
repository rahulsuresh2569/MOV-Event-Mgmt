const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpStatus');

class ChatService {
  /**
   * Get user's conversations
   */
  async getUserConversations(userId) {
    try {
      const conversations = await Conversation.find({
        'participants.userId': userId,
      })
        .sort({ updatedAt: -1 })
        .lean();

      return conversations;
    } catch (error) {
      logger.error(`Error getting user conversations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId, userId) {
    try {
      const conversation = await Conversation.findById(conversationId).lean();

      if (!conversation) {
        const error = new Error('Conversation not found');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        error.errorCode = ERROR_CODES.NOT_FOUND;
        throw error;
      }

      // Verify user is a participant
      const isParticipant = conversation.participants.some((p) => p.userId === userId);

      if (!isParticipant) {
        const error = new Error('You do not have access to this conversation');
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        error.errorCode = ERROR_CODES.AUTHORIZATION_ERROR;
        throw error;
      }

      return conversation;
    } catch (error) {
      logger.error(`Error getting conversation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(conversationId, userId, limit = 50, before = null) {
    try {
      // Verify access
      await this.getConversationById(conversationId, userId);

      // Build query
      const query = { conversationId };

      // Pagination: get messages before a certain timestamp
      if (before) {
        query.createdAt = { $lt: new Date(before) };
      }

      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      logger.error(`Error getting conversation messages: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get event group chat messages
   */
  async getEventMessages(eventId, userId, limit = 50, before = null) {
    try {
      // Find conversation
      const conversation = await Conversation.findOne({
        eventId,
        type: 'group',
      });

      if (!conversation) {
        return []; // No messages yet
      }

      // Verify user is a participant
      const isParticipant = conversation.participants.some((p) => p.userId === userId);

      if (!isParticipant) {
        const error = new Error('You do not have access to this event chat');
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        error.errorCode = ERROR_CODES.AUTHORIZATION_ERROR;
        throw error;
      }

      // Build query
      const query = { eventId, type: 'group' };

      if (before) {
        query.createdAt = { $lt: new Date(before) };
      }

      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return messages.reverse();
    } catch (error) {
      logger.error(`Error getting event messages: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId, userId) {
    try {
      // Verify access
      await this.getConversationById(conversationId, userId);

      // Mark all unread messages in this conversation as read
      const result = await Message.updateMany(
        {
          conversationId,
          receiverId: userId,
          read: false,
        },
        {
          $set: {
            read: true,
            readAt: new Date(),
          },
        }
      );

      // Reset unread count in conversation
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.resetUnread(userId);
        await conversation.save();
      }

      logger.info(`Marked ${result.modifiedCount} messages as read for user ${userId}`);

      return result.modifiedCount;
    } catch (error) {
      logger.error(`Error marking messages as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get direct message conversation between two users
   */
  async getDirectConversation(userId1, userId2) {
    try {
      const conversation = await Conversation.findOne({
        type: 'direct',
        'participants.userId': { $all: [userId1, userId2] },
      }).lean();

      return conversation;
    } catch (error) {
      logger.error(`Error getting direct conversation: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ChatService();
