const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'MOV Chat Service API',
    version: '1.0.0',
    description: 'Real-time chat and messaging service with WebSocket support for MOV Event Management System',
    contact: {
      name: 'MOV Team',
      email: 'support@moveventmgmt.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3004',
      description: 'Chat Service (Direct)',
    },
    {
      url: 'http://localhost:3000/api/v1/chat',
      description: 'Chat Service via API Gateway',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from auth service login',
      },
    },
    schemas: {
      Message: {
        type: 'object',
        required: ['senderId', 'content', 'type'],
        properties: {
          _id: {
            type: 'string',
            description: 'Message ID',
            example: '507f1f77bcf86cd799439011',
          },
          senderId: {
            type: 'integer',
            description: 'ID of the user who sent the message',
            example: 1,
          },
          senderName: {
            type: 'string',
            description: 'Name of the sender',
            example: 'John Doe',
          },
          receiverId: {
            type: 'integer',
            description: 'ID of the recipient (for direct messages)',
            example: 2,
          },
          eventId: {
            type: 'integer',
            description: 'ID of the event (for group messages)',
            example: 10,
          },
          conversationId: {
            type: 'string',
            description: 'ID of the conversation this message belongs to',
            example: '507f1f77bcf86cd799439011',
          },
          content: {
            type: 'string',
            description: 'Message content',
            example: 'Hello, how are you?',
          },
          type: {
            type: 'string',
            enum: ['direct', 'group', 'system'],
            description: 'Type of message',
            example: 'direct',
          },
          read: {
            type: 'boolean',
            description: 'Whether the message has been read',
            example: false,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Message creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      Conversation: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Conversation ID',
            example: '507f1f77bcf86cd799439011',
          },
          type: {
            type: 'string',
            enum: ['direct', 'group'],
            description: 'Type of conversation',
            example: 'direct',
          },
          eventId: {
            type: 'integer',
            description: 'Event ID (for group conversations)',
            example: 10,
          },
          eventTitle: {
            type: 'string',
            description: 'Event title (for group conversations)',
            example: 'Tech Conference 2025',
          },
          participants: {
            type: 'array',
            items: {
              type: 'integer',
            },
            description: 'Array of participant user IDs',
            example: [1, 2],
          },
          lastMessage: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                example: 'See you at the event!',
              },
              senderId: {
                type: 'integer',
                example: 1,
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          unreadCounts: {
            type: 'object',
            description: 'Map of user IDs to their unread message counts',
            example: { '1': 0, '2': 3 },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Conversation creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Operation successful',
          },
          data: {
            type: 'object',
            description: 'Response data (varies by endpoint)',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
          errorCode: {
            type: 'string',
            example: 'VALIDATION_ERROR',
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'content',
                },
                message: {
                  type: 'string',
                  example: 'Message content is required',
                },
              },
            },
          },
        },
      },
      SocketEvents: {
        type: 'object',
        description: 'WebSocket events supported by the chat service',
        properties: {
          clientEvents: {
            type: 'object',
            properties: {
              'join-event-room': {
                type: 'string',
                description: 'Join an event chat room',
                example: '{ eventId: 10 }',
              },
              'send-group-message': {
                type: 'string',
                description: 'Send a message to an event group',
                example: '{ eventId: 10, content: "Hello everyone!" }',
              },
              'send-direct-message': {
                type: 'string',
                description: 'Send a direct message to another user',
                example: '{ receiverId: 2, content: "Hi there!" }',
              },
              'typing-start': {
                type: 'string',
                description: 'Notify that user started typing',
                example: '{ eventId: 10 } or { receiverId: 2 }',
              },
              'typing-stop': {
                type: 'string',
                description: 'Notify that user stopped typing',
                example: '{ eventId: 10 } or { receiverId: 2 }',
              },
            },
          },
          serverEvents: {
            type: 'object',
            properties: {
              'user-joined': {
                type: 'string',
                description: 'Broadcast when a user joins an event room',
                example: '{ userId: 1, userName: "John Doe" }',
              },
              'new-group-message': {
                type: 'string',
                description: 'Broadcast a new group message',
                example: '{ message: {...} }',
              },
              'new-direct-message': {
                type: 'string',
                description: 'Send a new direct message',
                example: '{ message: {...} }',
              },
              'user-typing': {
                type: 'string',
                description: 'Notify that a user is typing',
                example: '{ userId: 1, userName: "John Doe" }',
              },
              'user-stopped-typing': {
                type: 'string',
                description: 'Notify that a user stopped typing',
                example: '{ userId: 1 }',
              },
              error: {
                type: 'string',
                description: 'Error event',
                example: '{ message: "Error description" }',
              },
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'Service health check endpoints',
    },
    {
      name: 'Conversations',
      description: 'Conversation management endpoints',
    },
    {
      name: 'Messages',
      description: 'Message retrieval and management endpoints',
    },
    {
      name: 'WebSocket',
      description: 'Real-time WebSocket events and connection information',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/app.js', './src/routes/*.js'], // Path to files with Swagger annotations
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
