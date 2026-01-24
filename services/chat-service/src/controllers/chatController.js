const chatService = require('../services/chatService');
const { successResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS } = require('../constants/httpStatus');

class ChatController {
  /**
   * Get user's conversations
   * GET /conversations
   */
  async getConversations(req, res, next) {
    try {
      const conversations = await chatService.getUserConversations(req.user.id);

      return successResponse(res, HTTP_STATUS.OK, 'Conversations retrieved successfully', {
        conversations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get conversation messages
   * GET /conversations/:id/messages
   */
  async getConversationMessages(req, res, next) {
    try {
      const { id } = req.params;
      const { limit = 50, before } = req.query;

      const messages = await chatService.getConversationMessages(
        id,
        req.user.id,
        parseInt(limit, 10),
        before
      );

      return successResponse(res, HTTP_STATUS.OK, 'Messages retrieved successfully', {
        messages,
        count: messages.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event group chat messages
   * GET /events/:eventId/messages
   */
  async getEventMessages(req, res, next) {
    try {
      const { eventId } = req.params;
      const { limit = 50, before } = req.query;

      const messages = await chatService.getEventMessages(
        parseInt(eventId, 10),
        req.user.id,
        parseInt(limit, 10),
        before
      );

      return successResponse(res, HTTP_STATUS.OK, 'Event messages retrieved successfully', {
        messages,
        count: messages.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark messages as read
   * POST /messages/mark-read
   */
  async markAsRead(req, res, next) {
    try {
      const { conversationId } = req.body;

      if (!conversationId) {
        const error = new Error('Conversation ID is required');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      const count = await chatService.markMessagesAsRead(conversationId, req.user.id);

      return successResponse(res, HTTP_STATUS.OK, 'Messages marked as read', {
        markedCount: count,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get conversation between two users
   * GET /conversations/direct/:userId
   */
  async getDirectConversation(req, res, next) {
    try {
      const { userId } = req.params;

      const conversation = await chatService.getDirectConversation(
        req.user.id,
        parseInt(userId, 10)
      );

      if (!conversation) {
        return successResponse(res, HTTP_STATUS.OK, 'No conversation found', {
          conversation: null,
        });
      }

      return successResponse(res, HTTP_STATUS.OK, 'Conversation retrieved successfully', {
        conversation,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
