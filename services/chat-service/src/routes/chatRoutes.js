const express = require('express');
const chatController = require('../controllers/chatController');
const { requireAuth } = require('../middleware/extractUser');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @swagger
 * /api/v1/conversations:
 *   get:
 *     summary: Get user's conversations
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve all conversations for the authenticated user (both direct and group conversations)
 *     responses:
 *       200:
 *         description: List of conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Conversations retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Conversation'
 *                     totalCount:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get user's conversations
router.get('/conversations', chatController.getConversations);

/**
 * @swagger
 * /api/v1/conversations/direct/{userId}:
 *   get:
 *     summary: Get direct conversation with specific user
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     description: Get or create a direct conversation between authenticated user and another user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the other user
 *         example: 2
 *     responses:
 *       200:
 *         description: Direct conversation retrieved or created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Direct conversation retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversation:
 *                       $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 */
// Get direct conversation with specific user
router.get('/conversations/direct/:userId', chatController.getDirectConversation);

/**
 * @swagger
 * /api/v1/conversations/{id}/messages:
 *   get:
 *     summary: Get messages for a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve all messages for a specific conversation with pagination
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Messages retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalMessages:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User not part of this conversation
 *       404:
 *         description: Conversation not found
 */
// Get messages for a conversation
router.get('/conversations/:id/messages', chatController.getConversationMessages);

/**
 * @swagger
 * /api/v1/events/{eventId}/messages:
 *   get:
 *     summary: Get event group chat messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve all messages for an event group chat (requires user to be organizer or enrolled participant)
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *         example: 10
 *       - in: query
 *         name: before
 *         required: false
 *         schema:
 *           type: string
 *         description: Message ID cursor - returns messages before this ID (for pagination)
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Number of messages to return
 *     responses:
 *       200:
 *         description: Event messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Event messages retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         totalMessages:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *                           description: Whether more messages are available
 *                         nextCursor:
 *                           type: string
 *                           description: Cursor for next page (use as 'before' parameter)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User not authorized to view these messages
 *       404:
 *         description: Event not found
 */
// Get event group chat messages
router.get('/events/:eventId/messages', chatController.getEventMessages);

/**
 * @swagger
 * /api/v1/messages/mark-read:
 *   post:
 *     summary: Mark all messages in a conversation as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     description: Mark all unread messages in a conversation as read for the authenticated user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *             properties:
 *               conversationId:
 *                 type: string
 *                 description: MongoDB ObjectId of the conversation
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Messages marked as read
 *                 data:
 *                   type: object
 *                   properties:
 *                     markedCount:
 *                       type: integer
 *                       description: Number of messages marked as read
 *                       example: 5
 *       400:
 *         description: Bad request - Conversation ID is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
// Mark messages as read
router.post('/messages/mark-read', chatController.markAsRead);

module.exports = router;

