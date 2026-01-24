const logger = require('../utils/logger');
const socketAuth = require('./socketAuth');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Inquiry = require('../models/Inquiry');
const { MESSAGE_TYPES, CONVERSATION_TYPES } = require('../constants/messageTypes');
const axios = require('axios');

/**
 * Setup Socket.IO event handlers
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
const setupSocketHandlers = (io) => {
  // Apply authentication middleware
  io.use(socketAuth);

  // Connection event
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id} (User: ${socket.user.id})`);

    // Join user's personal room (for direct messages)
    const userRoom = `user:${socket.user.id}`;
    socket.join(userRoom);
    logger.debug(`User ${socket.user.id} joined room: ${userRoom}`);

    // ============= EVENT: JOIN EVENT ROOM =============
    socket.on('join-event-room', async (data) => {
      try {
        const { eventId } = data;

        if (!eventId) {
          return socket.emit('error', { message: 'Event ID is required' });
        }

        // Verify user has access to event (either organizer or enrolled participant)
        const hasAccess = await verifyEventAccess(eventId, socket.user.id, socket.user.role);

        if (!hasAccess) {
          return socket.emit('error', {
            message: 'You do not have access to this event chat',
          });
        }

        // Join event room
        const eventRoom = `event:${eventId}`;
        socket.join(eventRoom);

        logger.info(`User ${socket.user.id} joined event room: ${eventRoom}`);

        // Get or create conversation for this event
        let conversation = await Conversation.findOne({
          eventId,
          type: CONVERSATION_TYPES.GROUP,
        });

        if (!conversation) {
          // Fetch event details
          const event = await getEventDetails(eventId);

          conversation = await Conversation.create({
            type: CONVERSATION_TYPES.GROUP,
            eventId,
            eventTitle: event?.title || 'Event Chat',
            organizerId: event?.organizerId,
            participants: [
              {
                userId: socket.user.id,
                userEmail: socket.user.email,
                userRole: socket.user.role,
              },
            ],
          });
        } else {
          // Add participant if not already in conversation
          conversation.addParticipant(socket.user.id, socket.user.email, socket.user.role);
          await conversation.save();
        }

        // Notify others in the room
        socket.to(eventRoom).emit('user-joined', {
          userId: socket.user.id,
          userEmail: socket.user.email,
          userRole: socket.user.role,
          timestamp: new Date(),
        });

        // Send confirmation to user
        socket.emit('joined-event-room', {
          eventId,
          conversationId: conversation._id,
          message: 'Successfully joined event chat',
        });
      } catch (error) {
        logger.error(`Error joining event room: ${error.message}`);
        socket.emit('error', { message: 'Failed to join event room' });
      }
    });

    // ============= EVENT: LEAVE EVENT ROOM =============
    socket.on('leave-event-room', async (data) => {
      try {
        const { eventId } = data;

        if (!eventId) {
          return socket.emit('error', { message: 'Event ID is required' });
        }

        const eventRoom = `event:${eventId}`;
        socket.leave(eventRoom);

        logger.info(`User ${socket.user.id} left event room: ${eventRoom}`);

        // Notify others
        socket.to(eventRoom).emit('user-left', {
          userId: socket.user.id,
          userEmail: socket.user.email,
          timestamp: new Date(),
        });

        socket.emit('left-event-room', {
          eventId,
          message: 'Successfully left event chat',
        });
      } catch (error) {
        logger.error(`Error leaving event room: ${error.message}`);
        socket.emit('error', { message: 'Failed to leave event room' });
      }
    });

    // ============= EVENT: SEND GROUP MESSAGE =============
    socket.on('send-group-message', async (data) => {
      try {
        const { eventId, content } = data;

        if (!eventId || !content) {
          return socket.emit('error', { message: 'Event ID and content are required' });
        }

        // Verify access
        const hasAccess = await verifyEventAccess(eventId, socket.user.id, socket.user.role);
        if (!hasAccess) {
          return socket.emit('error', { message: 'You do not have access to this event chat' });
        }

        // Get conversation
        const conversation = await Conversation.findOne({
          eventId,
          type: CONVERSATION_TYPES.GROUP,
        });

        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Get event details for message
        const event = await getEventDetails(eventId);

        // Create message
        const message = await Message.create({
          senderId: socket.user.id,
          senderEmail: socket.user.email,
          senderRole: socket.user.role,
          eventId,
          eventTitle: event?.title || 'Event Chat',
          content,
          type: MESSAGE_TYPES.GROUP,
          conversationId: conversation._id,
        });

        // Update conversation
        conversation.updateLastMessage(message);
        
        // Increment unread for all participants except sender
        conversation.participants.forEach((participant) => {
          if (participant.userId !== socket.user.id) {
            conversation.incrementUnread(participant.userId);
          }
        });

        await conversation.save();

        // Broadcast message to everyone in the event room
        const eventRoom = `event:${eventId}`;
        io.to(eventRoom).emit('message-received', {
          _id: message._id,
          senderId: message.senderId,
          senderEmail: message.senderEmail,
          senderRole: message.senderRole,
          eventId: message.eventId,
          eventTitle: message.eventTitle,
          content: message.content,
          type: message.type,
          timestamp: message.createdAt,
        });

        logger.info(`Group message sent in event ${eventId} by user ${socket.user.id}`);
      } catch (error) {
        logger.error(`Error sending group message: ${error.message}`);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ============= EVENT: SEND DIRECT MESSAGE =============
    socket.on('send-direct-message', async (data) => {
      try {
        const { receiverId, content, eventId } = data;

        if (!receiverId || !content) {
          return socket.emit('error', { message: 'Receiver ID and content are required' });
        }

        // Require eventId for direct messages to ensure event context
        if (!eventId) {
          return socket.emit('error', { 
            message: 'Event ID is required. Direct messages must be within an event context.' 
          });
        }

        // Verify sender has access to the event
        const senderHasAccess = await verifyEventAccess(eventId, socket.user.id, socket.user.role);
        if (!senderHasAccess) {
          return socket.emit('error', { 
            message: 'You do not have access to this event' 
          });
        }

        // Get receiver details first
        const receiver = await getUserDetails(receiverId);
        if (!receiver) {
          return socket.emit('error', { message: 'Receiver not found' });
        }

        // Verify receiver has access to the same event
        const receiverHasAccess = await verifyEventAccess(eventId, receiverId, receiver.role);
        if (!receiverHasAccess) {
          return socket.emit('error', { 
            message: 'Receiver is not part of this event. You can only message participants in the same event.' 
          });
        }

        // Get event details
        const event = await getEventDetails(eventId);
        if (!event) {
          return socket.emit('error', { message: 'Event not found' });
        }

        // Find or create conversation (scoped to event)
        let conversation = await Conversation.findOne({
          type: CONVERSATION_TYPES.DIRECT,
          eventId: eventId,
          'participants.userId': { $all: [socket.user.id, receiverId] },
        });

        if (!conversation) {
          conversation = await Conversation.create({
            type: CONVERSATION_TYPES.DIRECT,
            eventId: eventId,
            eventTitle: event.title,
            organizerId: event.organizerId,
            participants: [
              {
                userId: socket.user.id,
                userEmail: socket.user.email,
                userRole: socket.user.role,
              },
              {
                userId: receiver.id,
                userEmail: receiver.email,
                userRole: receiver.role,
              },
            ],
          });
        }

        // Create message
        const message = await Message.create({
          senderId: socket.user.id,
          senderEmail: socket.user.email,
          senderRole: socket.user.role,
          receiverId,
          receiverEmail: receiver.email,
          eventId: eventId,
          eventTitle: event.title,
          content,
          type: MESSAGE_TYPES.DIRECT,
          conversationId: conversation._id,
        });

        // Update conversation
        conversation.updateLastMessage(message);
        conversation.incrementUnread(receiverId);
        await conversation.save();

        // Send to receiver's room
        const receiverRoom = `user:${receiverId}`;
        io.to(receiverRoom).emit('message-received', {
          _id: message._id,
          senderId: message.senderId,
          senderEmail: message.senderEmail,
          senderRole: message.senderRole,
          receiverId: message.receiverId,
          eventId: message.eventId,
          eventTitle: message.eventTitle,
          content: message.content,
          type: message.type,
          conversationId: conversation._id,
          timestamp: message.createdAt,
        });

        // Send confirmation to sender
        socket.emit('message-sent', {
          _id: message._id,
          conversationId: conversation._id,
          eventId: eventId,
          timestamp: message.createdAt,
        });

        logger.info(`Direct message sent from ${socket.user.id} to ${receiverId} in event ${eventId}`);
      } catch (error) {
        logger.error(`Error sending direct message: ${error.message}`);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ============= EVENT: TYPING INDICATOR =============
    socket.on('typing-start', (data) => {
      const { eventId, receiverId } = data;

      if (eventId) {
        // Typing in group chat
        socket.to(`event:${eventId}`).emit('typing-indicator', {
          userId: socket.user.id,
          userEmail: socket.user.email,
          eventId,
          typing: true,
        });
      } else if (receiverId) {
        // Typing in direct message
        socket.to(`user:${receiverId}`).emit('typing-indicator', {
          userId: socket.user.id,
          userEmail: socket.user.email,
          typing: true,
        });
      }
    });

    socket.on('typing-stop', (data) => {
      const { eventId, receiverId } = data;

      if (eventId) {
        socket.to(`event:${eventId}`).emit('typing-indicator', {
          userId: socket.user.id,
          userEmail: socket.user.email,
          eventId,
          typing: false,
        });
      } else if (receiverId) {
        socket.to(`user:${receiverId}`).emit('typing-indicator', {
          userId: socket.user.id,
          userEmail: socket.user.email,
          typing: false,
        });
      }
    });

    // ============= EVENT: SEND INQUIRY (Pre-Enrollment) =============
    socket.on('send-inquiry', async (data) => {
      try {
        logger.info(`send-inquiry triggered by user ${socket.user.id} with data:`, data);
        const { eventId, subject, question } = data;

        if (!eventId || !subject || !question) {
          return socket.emit('error', { 
            message: 'Event ID, subject, and question are required' 
          });
        }

        // Fetch event details
        const event = await getEventDetails(eventId);
        
        if (!event) {
          return socket.emit('error', { message: 'Event not found' });
        }

        logger.info(`Event ${eventId} status: "${event.status}"`);

        // Only allow inquiries for published events (case-insensitive)
        if (event.status?.toUpperCase() !== 'PUBLISHED') {
          logger.warn(`Event ${eventId} is not published. Status: ${event.status}`);
          return socket.emit('error', { 
            message: 'This event is not open for inquiries' 
          });
        }

        // Check if user is already enrolled (optional - they can still ask questions)
        const isEnrolled = await checkEnrollment(eventId, socket.user.id);
        
        // Create inquiry
        const inquiry = await Inquiry.create({
          eventId: eventId,
          eventTitle: event.title,
          organizerId: event.organizerId,
          inquirerId: socket.user.id,
          inquirerEmail: socket.user.email,
          inquirerName: `${socket.user.firstName || ''} ${socket.user.lastName || ''}`.trim() || socket.user.email,
          inquirerRole: socket.user.role,
          subject: subject,
          question: question,
          status: 'pending',
        });

        // Notify organizer
        const organizerRoom = `user:${event.organizerId}`;
        io.to(organizerRoom).emit('inquiry-received', {
          inquiryId: inquiry._id,
          eventId: inquiry.eventId,
          eventTitle: inquiry.eventTitle,
          from: inquiry.inquirerName,
          fromEmail: inquiry.inquirerEmail,
          fromRole: inquiry.inquirerRole,
          subject: inquiry.subject,
          question: inquiry.question,
          isEnrolled: isEnrolled,
          timestamp: inquiry.createdAt,
        });

        // Confirm to sender
        socket.emit('inquiry-sent', {
          inquiryId: inquiry._id,
          message: 'Your inquiry has been sent to the event organizer. They will respond soon.',
        });

        logger.info(`Inquiry sent for event ${eventId} by user ${socket.user.id} (${socket.user.email})`);
      } catch (error) {
        logger.error(`Error sending inquiry: ${error.message}`);
        socket.emit('error', { message: 'Failed to send inquiry' });
      }
    });

    // ============= EVENT: REPLY TO INQUIRY =============
    socket.on('reply-inquiry', async (data) => {
      try {
        const { inquiryId, reply } = data;

        if (!inquiryId || !reply) {
          return socket.emit('error', { message: 'Inquiry ID and reply are required' });
        }

        // Find inquiry
        const inquiry = await Inquiry.findById(inquiryId);

        if (!inquiry) {
          return socket.emit('error', { message: 'Inquiry not found' });
        }

        // Verify user is the organizer
        if (inquiry.organizerId !== socket.user.id) {
          return socket.emit('error', { message: 'Only the event organizer can reply to inquiries' });
        }

        // Update inquiry
        inquiry.reply = reply;
        inquiry.repliedAt = new Date();
        inquiry.status = 'replied';
        await inquiry.save();

        // Notify inquirer
        const inquirerRoom = `user:${inquiry.inquirerId}`;
        io.to(inquirerRoom).emit('inquiry-replied', {
          inquiryId: inquiry._id,
          eventId: inquiry.eventId,
          eventTitle: inquiry.eventTitle,
          subject: inquiry.subject,
          question: inquiry.question,
          reply: inquiry.reply,
          timestamp: inquiry.repliedAt,
        });

        // Confirm to organizer
        socket.emit('inquiry-reply-sent', {
          inquiryId: inquiry._id,
          message: 'Reply sent successfully',
        });

        logger.info(`Inquiry ${inquiryId} replied by organizer ${socket.user.id}`);
      } catch (error) {
        logger.error(`Error replying to inquiry: ${error.message}`);
        socket.emit('error', { message: 'Failed to send reply' });
      }
    });

    // ============= EVENT: GET MY INQUIRIES =============
    socket.on('get-my-inquiries', async () => {
      try {
        const inquiries = await Inquiry.find({
          inquirerId: socket.user.id,
        })
          .sort({ createdAt: -1 })
          .limit(50);

        socket.emit('inquiries-list', { inquiries });
        
        logger.info(`Retrieved ${inquiries.length} inquiries for user ${socket.user.id}`);
      } catch (error) {
        logger.error(`Error fetching inquiries: ${error.message}`);
        socket.emit('error', { message: 'Failed to fetch inquiries' });
      }
    });

    // ============= EVENT: GET EVENT INQUIRIES (Organizer) =============
    socket.on('get-event-inquiries', async (data) => {
      try {
        logger.info(`get-event-inquiries triggered by user ${socket.user.id} with data:`, data);
        const { eventId } = data;

        if (!eventId) {
          logger.warn(`Event ID missing in get-event-inquiries request`);
          return socket.emit('error', { message: 'Event ID is required' });
        }

        logger.info(`Fetching event details for event ${eventId} to verify organizer`);
        // Verify user is organizer
        const event = await getEventDetails(eventId);
        
        if (!event || event.organizerId !== socket.user.id) {
          return socket.emit('error', { message: 'Only the event organizer can view inquiries' });
        }

        const inquiries = await Inquiry.find({
          eventId: eventId,
        })
          .sort({ createdAt: -1 })
          .limit(100);

        socket.emit('event-inquiries-list', { 
          eventId,
          eventTitle: event.title,
          inquiries 
        });
        
        logger.info(`Retrieved ${inquiries.length} inquiries for event ${eventId}`);
      } catch (error) {
        logger.error(`Error fetching event inquiries: ${error.message}`);
        socket.emit('error', { message: 'Failed to fetch inquiries' });
      }
    });

    // ============= EVENT: MARK INQUIRY AS READ =============
    socket.on('mark-inquiry-read', async (data) => {
      try {
        const { inquiryId } = data;

        if (!inquiryId) {
          return socket.emit('error', { message: 'Inquiry ID is required' });
        }

        const inquiry = await Inquiry.findById(inquiryId);

        if (!inquiry) {
          return socket.emit('error', { message: 'Inquiry not found' });
        }

        // Only organizer can mark as read
        if (inquiry.organizerId !== socket.user.id) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        inquiry.isRead = true;
        inquiry.readAt = new Date();
        await inquiry.save();

        socket.emit('inquiry-marked-read', { inquiryId });
        
        logger.info(`Inquiry ${inquiryId} marked as read by organizer ${socket.user.id}`);
      } catch (error) {
        logger.error(`Error marking inquiry as read: ${error.message}`);
        socket.emit('error', { message: 'Failed to mark inquiry as read' });
      }
    });

    // ============= EVENT: DISCONNECT =============
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id} (User: ${socket.user.id}), reason: ${reason}`);
    });
  });
};

// ============= HELPER FUNCTIONS =============

/**
 * Verify if user has access to event chat
 * - Organizer: has access to their own events
 * - Participant: has access if enrolled
 */
async function verifyEventAccess(eventId, userId, userRole) {
  try {
    logger.info(`Verifying event access - User: ${userId}, Role: ${userRole}, Event: ${eventId}`);
    
    // Get event details
    const event = await getEventDetails(eventId);

    if (!event) {
      logger.warn(`Event ${eventId} not found`);
      return false;
    }

    logger.info(`Event ${eventId} found - Organizer: ${event.organizerId}`);

    // Check if user is the organizer of this event
    if (userRole === 'ORGANIZER' && event.organizerId === userId) {
      logger.info(`✅ User ${userId} is organizer of event ${eventId} - access granted`);
      return true;
    }

    // Check if user is enrolled (for participants or organizers accessing other events)
    const isEnrolled = await checkEnrollment(eventId, userId);
    if (isEnrolled) {
      logger.info(`✅ User ${userId} is enrolled in event ${eventId} - access granted`);
      return true;
    }

    logger.warn(`❌ User ${userId} has no access to event ${eventId} - not organizer and not enrolled`);
    return false;
  } catch (error) {
    logger.error(`Error verifying event access: ${error.message}`, { stack: error.stack });
    return false;
  }
}

/**
 * Get event details from event-service
 */
async function getEventDetails(eventId) {
  try {
    // Event service routes are at root level (gateway strips /api/v1/events prefix)
    const url = `${process.env.EVENT_SERVICE_URL}/${eventId}`;
    logger.info(`Fetching event details from: ${url}`);
    
    const response = await axios.get(url);
    
    if (response.data?.success && response.data?.data?.event) {
      logger.info(`Event ${eventId} details retrieved successfully`);
      return response.data.data.event;
    }
    
    logger.warn(`Event ${eventId} not found in response`);
    return null;
  } catch (error) {
    logger.error(`Error fetching event details for event ${eventId}: ${error.message}`, {
      url: `${process.env.EVENT_SERVICE_URL}/${eventId}`,
      status: error.response?.status,
      data: error.response?.data
    });
    return null;
  }
}

/**
 * Check if user is enrolled in event
 */
async function checkEnrollment(eventId, userId) {
  try {
    logger.info(`Checking enrollment - Event: ${eventId}, User: ${userId}`);
    const url = `${process.env.ENROLLMENT_SERVICE_URL}/check/${eventId}/${userId}`;
    logger.info(`Calling enrollment check: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: (status) => status < 500 // Don't throw on 404
    });
    
    if (response.status === 200 && response.data) {
      const enrolled = response.data.data?.enrolled === true;
      logger.info(`Enrollment check result for user ${userId} in event ${eventId}: ${enrolled ? 'ENROLLED' : 'NOT ENROLLED'}`);
      return enrolled;
    }
    
    logger.info(`User ${userId} not enrolled in event ${eventId} (status: ${response.status})`);
    return false;
  } catch (error) {
    if (error.response) {
      logger.error(`Enrollment service error: ${error.response.status}`, {
        eventId,
        userId,
        data: error.response.data
      });
    } else if (error.request) {
      logger.error(`No response from enrollment service`, {
        eventId,
        userId,
        url: error.config?.url
      });
    } else {
      logger.error(`Error checking enrollment: ${error.message}`, { eventId, userId });
    }
    return false;
  }
}

/**
 * Get user details from auth-service
 */
async function getUserDetails(userId) {
  try {
    const url = `${process.env.AUTH_SERVICE_URL}/api/v1/users/${userId}`;
    logger.info(`Fetching user details from: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 5000
    });
    
    if (response.data && response.data.data && response.data.data.user) {
      logger.info(`User ${userId} details retrieved: ${response.data.data.user.email}`);
      return response.data.data.user;
    }
    
    logger.warn(`User ${userId} not found in response`);
    return null;
  } catch (error) {
    if (error.response) {
      logger.error(`Auth service error for user ${userId}: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      logger.error(`No response from auth service for user ${userId}`);
    } else {
      logger.error(`Error fetching user details for user ${userId}: ${error.message}`);
    }
    return null;
  }
}

module.exports = setupSocketHandlers;
