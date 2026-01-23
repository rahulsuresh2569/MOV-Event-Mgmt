# Chat Service

Real-time messaging service for MOV Event Management System.

## Features

- **Direct Messaging**: One-on-one chat between participants and organizers
- **Group Chat**: Event-specific group discussions
- **Message History**: Persistent storage of all messages
- **Real-time Delivery**: Instant message delivery via WebSocket
- **Typing Indicators**: See when others are typing
- **Online Status**: See who's online in event chats

## Technology Stack

- **Express.js**: HTTP API for message history
- **Socket.IO**: Real-time WebSocket communication
- **MongoDB**: Message storage
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication

## API Endpoints

### WebSocket Events

**Client → Server:**
- `join-event-room` - Join event-specific chat room
- `leave-event-room` - Leave event chat room
- `send-direct-message` - Send direct message to user
- `send-group-message` - Send message to event group
- `typing-start` - Notify others user is typing
- `typing-stop` - Notify others user stopped typing

**Server → Client:**
- `message-received` - New message received
- `user-joined` - User joined event chat
- `user-left` - User left event chat
- `typing-indicator` - Another user is typing
- `error` - Error occurred

### REST API

- `GET /api/v1/conversations` - Get user's conversations
- `GET /api/v1/conversations/:id/messages` - Get conversation history
- `GET /api/v1/events/:eventId/messages` - Get event group chat history
- `POST /api/v1/messages/mark-read` - Mark messages as read

## Environment Variables

See `.env.example` for required configuration.

## Running the Service

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Start production server
npm start
```

## Docker

```bash
# Build image
docker build -t mov-chat-service .

# Run container
docker run -p 3004:3004 --env-file .env mov-chat-service
```
