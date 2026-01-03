const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'MOV Event Management API',
    version: '1.0.0',
    description: 'Microservices-based Event Management System with JWT Authentication',
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
      url: 'http://localhost:3000',
      description: 'Development server (API Gateway)',
    },
    {
      url: 'http://localhost:3001',
      description: 'Auth Service (Direct - for testing)',
    },
    {
      url: 'http://localhost:3002',
      description: 'Event Service (Direct - for testing)',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /api/v1/auth/login',
      },
    },
    schemas: {
      User: {
        type: 'object',
        required: ['email', 'password', 'role', 'firstName', 'lastName'],
        properties: {
          id: {
            type: 'integer',
            description: 'User ID',
            example: 1,
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'organizer@test.com',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 6,
            description: 'User password (min 6 characters)',
            example: 'password123',
          },
          role: {
            type: 'string',
            enum: ['ORGANIZER', 'PARTICIPANT'],
            description: 'User role',
            example: 'ORGANIZER',
          },
          firstName: {
            type: 'string',
            description: 'User first name',
            example: 'John',
          },
          lastName: {
            type: 'string',
            description: 'User last name',
            example: 'Doe',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether user account is active',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      Event: {
        type: 'object',
        required: [
          'title',
          'category',
          'location',
          'date',
          'maxParticipants',
        ],
        properties: {
          id: {
            type: 'integer',
            description: 'Event ID',
            example: 1,
          },
          title: {
            type: 'string',
            description: 'Event title',
            example: 'Tech Conference 2025',
          },
          description: {
            type: 'string',
            description: 'Event description',
            example: 'Annual technology conference featuring latest innovations',
          },
          category: {
            type: 'string',
            description: 'Event category',
            example: 'Technology',
          },
          location: {
            type: 'string',
            description: 'Event location',
            example: 'Berlin Convention Center',
          },
          date: {
            type: 'string',
            format: 'date-time',
            description: 'Event date and time',
            example: '2025-03-15T09:00:00Z',
          },
          maxParticipants: {
            type: 'integer',
            description: 'Maximum number of participants',
            minimum: 1,
            maximum: 10000,
            example: 500,
          },
          currentParticipants: {
            type: 'integer',
            description: 'Current number of enrolled participants',
            example: 0,
          },
          status: {
            type: 'string',
            enum: ['Planning', 'Published', 'Running', 'Completed', 'Canceled'],
            description: 'Event status',
            example: 'Planning',
          },
          organizerId: {
            type: 'integer',
            description: 'ID of the organizer',
            example: 1,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Event creation timestamp',
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
                  example: 'email',
                },
                message: {
                  type: 'string',
                  example: 'Please provide a valid email address',
                },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Events',
      description: 'Event management endpoints',
    },
    {
      name: 'Health',
      description: 'Service health check endpoints',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/app.js', './src/routes/*.js'], // Path to files with Swagger annotations
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
