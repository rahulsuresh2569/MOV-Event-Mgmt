# Chat Service Swagger Documentation

## Overview
The chat service now includes comprehensive Swagger/OpenAPI documentation following the same format used by other MOV services.

## What Was Added

### 1. Swagger Configuration
**File**: `src/config/swagger.js`
- OpenAPI 3.0.0 specification
- Service info (title, version, description)
- Server endpoints (direct and via API Gateway)
- Security schemes (JWT Bearer authentication)
- Reusable schemas:
  - `Message`: Chat message model
  - `Conversation`: Conversation model
  - `SuccessResponse`: Standard success response
  - `ErrorResponse`: Standard error response
  - `SocketEvents`: WebSocket events documentation
- API tags for organization

### 2. Updated Dependencies
**File**: `package.json`
Added:
```json
"swagger-jsdoc": "^6.2.8",
"swagger-ui-express": "^5.0.0"
```

### 3. Updated Application
**File**: `src/app.js`
- Imported swagger packages
- Added Swagger UI route at `/api-docs`
- Added OpenAPI JSON route at `/api-docs-json`
- Added JSDoc annotations for health check endpoint
- Added comprehensive WebSocket documentation

### 4. Annotated Routes
**File**: `src/routes/chatRoutes.js`
Added Swagger annotations for all REST API endpoints:
- `GET /api/v1/conversations` - Get user's conversations
- `GET /api/v1/conversations/direct/:userId` - Get direct conversation
- `GET /api/v1/conversations/:id/messages` - Get conversation messages
- `GET /api/v1/events/:eventId/messages` - Get event messages
- `POST /api/v1/messages/mark-read` - Mark messages as read

## Accessing Swagger Documentation

### Via Direct Service URL
```
http://localhost:3004/api-docs
```

### Via API Gateway
```
http://localhost:3000/api-docs
```
(Note: The API Gateway aggregates all service docs)

### OpenAPI JSON Spec
```
http://localhost:3004/api-docs-json
```

## Features Documented

### REST API Endpoints
All HTTP endpoints are fully documented with:
- Endpoint description
- Request parameters (path, query, body)
- Request body schemas
- Response codes and schemas
- Authentication requirements
- Example values

### WebSocket Events
Comprehensive documentation for Socket.IO events:

**Client Events** (emit from client):
- `join-event-room` - Join event chat room
- `send-group-message` - Send group message
- `send-direct-message` - Send direct message
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator

**Server Events** (listen from client):
- `user-joined` - User joined notification
- `new-group-message` - New group message
- `new-direct-message` - New direct message
- `user-typing` - Typing indicator
- `user-stopped-typing` - Stop typing notification
- `error` - Error events

## Usage

### 1. Start Services
```bash
docker-compose up --build -d
```

### 2. Open Swagger UI
Navigate to: http://localhost:3004/api-docs

### 3. Authenticate
1. First login via auth service to get JWT token
2. Click "Authorize" button in Swagger UI
3. Enter token in format: `Bearer YOUR_TOKEN`
4. Click "Authorize"

### 4. Test Endpoints
All endpoints can be tested directly from the Swagger UI:
- Click on an endpoint to expand
- Click "Try it out"
- Fill in required parameters
- Click "Execute"
- View response

## Schema Examples

### Message Schema
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "senderId": 1,
  "senderName": "John Doe",
  "receiverId": 2,
  "eventId": 10,
  "conversationId": "507f1f77bcf86cd799439011",
  "content": "Hello, how are you?",
  "type": "direct",
  "read": false,
  "createdAt": "2026-01-22T10:00:00.000Z",
  "updatedAt": "2026-01-22T10:00:00.000Z"
}
```

### Conversation Schema
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "type": "direct",
  "eventId": 10,
  "eventTitle": "Tech Conference 2025",
  "participants": [1, 2],
  "lastMessage": {
    "content": "See you at the event!",
    "senderId": 1,
    "timestamp": "2026-01-22T10:00:00.000Z"
  },
  "unreadCounts": {
    "1": 0,
    "2": 3
  },
  "createdAt": "2026-01-22T09:00:00.000Z",
  "updatedAt": "2026-01-22T10:00:00.000Z"
}
```

## Benefits

1. **Self-Documenting**: API documentation stays in sync with code
2. **Interactive Testing**: Test endpoints directly from browser
3. **Consistent Format**: Follows same pattern as other MOV services
4. **Developer Friendly**: Easy to understand and use
5. **Standards Compliant**: Uses OpenAPI 3.0.0 specification

## Next Steps

1. Review the Swagger UI at http://localhost:3004/api-docs
2. Test the REST API endpoints
3. Use the WebSocket documentation to implement real-time features
4. Share the API documentation with frontend developers

## Notes

- WebSocket connections require Socket.IO client library (not standard WebSocket)
- All REST endpoints require JWT authentication
- WebSocket authentication uses token in connection query: `?token=YOUR_JWT`
- Pagination is supported on message retrieval endpoints
- All timestamps are in ISO 8601 format
