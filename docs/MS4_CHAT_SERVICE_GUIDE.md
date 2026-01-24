# MS4 - Chat Service Implementation Guide

## 🎉 What We've Built

The **Chat Service** is now fully implemented! This service enables real-time messaging between organizers and participants using WebSocket technology (Socket.IO).

---

## ✅ Implemented Features

### 1. **Direct Messaging** (FUNC-CHAT-020)
- Participants can send direct messages to event organizers
- Messages work even before enrolling in events (FUNC-USER-030)
- One-on-one conversations persist in MongoDB
- Real-time delivery via WebSocket

### 2. **Group Chat** (FUNC-CHAT-030)
- Event-specific group chat rooms
- Organizers and enrolled participants can participate
- Real-time message broadcasting to all room members
- Message history stored and retrievable

### 3. **Organizer Announcements** (FUNC-CHAT-010)
- Organizers can send messages to event group chats
- Messages reach all registered participants instantly
- Perfect for event updates, reminders, changes

### 4. **Real-time Features**
- Typing indicators (see when someone is typing)
- User online/offline status
- Instant message delivery
- Read receipts (messages marked as read)

### 5. **Message History**
- All messages stored in MongoDB
- Retrieve conversation history via REST API
- Pagination support (load older messages)
- Search capabilities

---

## 🏗️ Architecture Overview

```
┌─────────────┐         WebSocket (Socket.IO)        ┌──────────────┐
│   Client    │◄─────────────────────────────────────▶│ Chat Service │
│ (Browser)   │                                       │  (Port 3004) │
└─────────────┘                                       └──────┬───────┘
                                                             │
                     REST API (Message History)             │
┌─────────────┐                                             │
│ API Gateway │◄────────────────────────────────────────────┘
│ (Port 3000) │
└─────────────┘
                                                      ┌──────────────┐
                                                      │   MongoDB    │
                                                      │  mov_chat DB │
                                                      └──────────────┘
```

### **How It Works:**

1. **WebSocket Connection**:
   - Client connects to chat service with JWT token
   - Server authenticates user
   - User joins their personal room (`user:123`)

2. **Event Group Chat**:
   - User joins event room (`event:42`)
   - Server verifies access (organizer or enrolled participant)
   - Messages broadcast to all users in room

3. **Direct Messages**:
   - Messages sent to specific user room (`user:456`)
   - Real-time delivery if recipient is online
   - Stored in MongoDB for offline retrieval

4. **Message Storage**:
   - All messages saved to MongoDB
   - Conversation records track participants
   - REST API for fetching history

---

## 📁 Project Structure

```
services/chat-service/
├── src/
│   ├── app.js                    # Express + Socket.IO app
│   ├── server.js                 # Server startup
│   ├── models/
│   │   ├── Message.js            # Message schema
│   │   └── Conversation.js       # Conversation schema
│   ├── socket/
│   │   ├── socketAuth.js         # WebSocket authentication
│   │   └── socketHandler.js      # Socket.IO event handlers
│   ├── services/
│   │   └── chatService.js        # Business logic
│   ├── controllers/
│   │   └── chatController.js     # REST API handlers
│   ├── routes/
│   │   └── chatRoutes.js         # REST route definitions
│   ├── middleware/
│   │   ├── errorHandler.js       # Error handling
│   │   └── extractUser.js        # User context extraction
│   ├── config/
│   │   └── database.js           # MongoDB connection
│   ├── constants/
│   │   ├── httpStatus.js         # HTTP status codes
│   │   └── messageTypes.js       # Message type enums
│   └── utils/
│       ├── logger.js             # Winston logger
│       └── responseFormatter.js  # Standard responses
├── Dockerfile                    # Container configuration
├── package.json                  # Dependencies
├── .env.example                  # Environment variables template
└── README.md                     # Service documentation
```

---

## 🔌 WebSocket Events (Socket.IO)

### **Client → Server Events**

| Event | Data | Description |
|-------|------|-------------|
| `join-event-room` | `{ eventId }` | Join event group chat |
| `leave-event-room` | `{ eventId }` | Leave event group chat |
| `send-group-message` | `{ eventId, content }` | Send message to event chat |
| `send-direct-message` | `{ receiverId, content }` | Send direct message to user |
| `typing-start` | `{ eventId or receiverId }` | User started typing |
| `typing-stop` | `{ eventId or receiverId }` | User stopped typing |

### **Server → Client Events**

| Event | Data | Description |
|-------|------|-------------|
| `message-received` | `{ message object }` | New message received |
| `user-joined` | `{ userId, userEmail, userRole }` | User joined event chat |
| `user-left` | `{ userId, userEmail }` | User left event chat |
| `typing-indicator` | `{ userId, typing: true/false }` | Someone is typing |
| `joined-event-room` | `{ eventId, conversationId }` | Successfully joined room |
| `left-event-room` | `{ eventId }` | Successfully left room |
| `message-sent` | `{ _id, conversationId }` | Message sent confirmation |
| `error` | `{ message }` | Error occurred |

---

## 📡 REST API Endpoints

### **Base URL**: `http://localhost:3000/api/v1/chat`

All endpoints require authentication (JWT Bearer token).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/conversations` | Get user's conversation list |
| GET | `/conversations/direct/:userId` | Get direct conversation with user |
| GET | `/conversations/:id/messages` | Get conversation message history |
| GET | `/events/:eventId/messages` | Get event group chat messages |
| POST | `/messages/mark-read` | Mark messages as read |

### **Query Parameters** (for message endpoints):
- `limit` (optional, default: 50) - Number of messages to return
- `before` (optional) - Get messages before this timestamp (pagination)

---

## 🔐 Security & Access Control

### **Authentication**:
- JWT token required for both WebSocket and REST API
- Token verified on Socket.IO connection
- User context extracted and attached to socket

### **Authorization Rules**:

**Event Group Chat Access**:
- ✅ Event organizer
- ✅ Enrolled participants
- ❌ Non-enrolled participants
- ❌ Other organizers

**Direct Message Access**:
- ✅ Any authenticated user can send direct messages
- ✅ Messages before enrollment allowed (per FUNC-USER-030)
- ✅ Only conversation participants can read messages

---

## 🚀 Getting Started

### **Step 1: Install Dependencies**

```bash
cd services/chat-service
npm install
```

### **Step 2: Configure Environment**

```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=3004
MONGODB_URI=mongodb://admin:dev123@localhost:27017/mov_chat?authSource=admin
JWT_SECRET=your-super-secret-jwt-key
AUTH_SERVICE_URL=http://localhost:3001
EVENT_SERVICE_URL=http://localhost:3002
ENROLLMENT_SERVICE_URL=http://localhost:3003
ALLOWED_ORIGINS=http://localhost:3000
LOG_LEVEL=info
```

### **Step 3: Start the Service**

**Option A: Docker (Recommended)**
```bash
# From project root
docker-compose up --build chat-service
```

**Option B: Local Development**
```bash
# Make sure MongoDB is running
cd services/chat-service
npm run dev
```

### **Step 4: Verify Service is Running**

```bash
curl http://localhost:3004/health
```

Expected response:
```json
{
  "success": true,
  "message": "Chat Service is healthy",
  "timestamp": "2026-01-17T...",
  "socketConnections": 0
}
```

---

## 📝 Testing Guide

### **1. Test REST API (Message History)**

**Get User's Conversations**:
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/v1/chat/conversations
```

**Get Event Group Chat Messages**:
```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/v1/chat/events/1/messages
```

### **2. Test WebSocket (Real-time Messaging)**

You'll need a WebSocket client. I recommend using **Socket.IO Client** or **Postman** (which supports WebSockets).

**JavaScript Example (Browser Console or Node.js)**:

```html
<!-- Include Socket.IO client -->
<script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>

<script>
// Connect to chat service
const socket = io('http://localhost:3004', {
  auth: {
    token: 'YOUR_JWT_TOKEN_HERE'
  }
});

// Connection success
socket.on('connect', () => {
  console.log('✅ Connected to chat service');
  
  // Join event room
  socket.emit('join-event-room', { eventId: 1 });
});

// Listen for messages
socket.on('message-received', (data) => {
  console.log('📨 New message:', data);
});

// Listen for user joined
socket.on('user-joined', (data) => {
  console.log('👋 User joined:', data.userEmail);
});

// Send group message
function sendMessage(content) {
  socket.emit('send-group-message', {
    eventId: 1,
    content: content
  });
}

// Send direct message
function sendDM(receiverId, content) {
  socket.emit('send-direct-message', {
    receiverId: receiverId,
    content: content
  });
}

// Typing indicator
function startTyping(eventId) {
  socket.emit('typing-start', { eventId: eventId });
}
</script>
```

### **3. Testing Scenarios**

#### **Scenario A: Event Group Chat**

1. **Participant enrolls in event**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/enrollments \
        -H "Authorization: Bearer <participant_token>" \
        -H "Content-Type: application/json" \
        -d '{"eventId": 1}'
   ```

2. **Participant connects to WebSocket** (using code above)

3. **Participant joins event room**:
   ```javascript
   socket.emit('join-event-room', { eventId: 1 });
   ```

4. **Organizer sends announcement**:
   ```javascript
   // Organizer's socket
   socket.emit('send-group-message', {
     eventId: 1,
     content: 'Event starts in 30 minutes!'
   });
   ```

5. **Participant receives message**:
   ```javascript
   socket.on('message-received', (data) => {
     // data.content = 'Event starts in 30 minutes!'
     // data.senderRole = 'ORGANIZER'
   });
   ```

#### **Scenario B: Direct Message**

1. **Participant sends DM to organizer** (even before enrollment):
   ```javascript
   socket.emit('send-direct-message', {
     receiverId: 5, // Organizer's user ID
     content: 'What should I bring to the event?'
   });
   ```

2. **Organizer receives message**:
   ```javascript
   // Organizer's socket
   socket.on('message-received', (data) => {
     // data.senderId = 10 (participant)
     // data.content = 'What should I bring to the event?'
   });
   ```

3. **Organizer replies**:
   ```javascript
   socket.emit('send-direct-message', {
     receiverId: 10, // Participant's ID
     content: 'Just bring yourself and a notebook!'
   });
   ```

#### **Scenario C: Typing Indicators**

```javascript
// User starts typing
socket.emit('typing-start', { eventId: 1 });

// Others see typing indicator
socket.on('typing-indicator', (data) => {
  // data.userId = 10
  // data.typing = true
  // Show "User is typing..." in UI
});

// User stops typing (after 3 seconds of inactivity)
socket.emit('typing-stop', { eventId: 1 });
```

---

## 🗄️ Database Models

### **Message Model**

```javascript
{
  _id: ObjectId("..."),
  senderId: 123,
  senderEmail: "user@test.com",
  senderRole: "PARTICIPANT",
  receiverId: 456,              // For direct messages
  eventId: 42,                  // For group messages
  eventTitle: "Tech Conference",
  content: "Hello!",
  type: "direct" | "group" | "system",
  read: false,
  readAt: null,
  conversationId: ObjectId("..."),
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### **Conversation Model**

```javascript
{
  _id: ObjectId("..."),
  type: "direct" | "group",
  participants: [
    {
      userId: 123,
      userEmail: "user@test.com",
      userRole: "PARTICIPANT"
    },
    {
      userId: 456,
      userEmail: "organizer@test.com",
      userRole: "ORGANIZER"
    }
  ],
  eventId: 42,                   // For group conversations
  eventTitle: "Tech Conference",
  organizerId: 456,
  lastMessage: {
    content: "Hello!",
    senderId: 123,
    senderEmail: "user@test.com",
    timestamp: ISODate("...")
  },
  unreadCounts: {
    "123": 0,
    "456": 3
  },
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## 🔍 Troubleshooting

### **Issue: Cannot connect to WebSocket**

**Symptoms**: `socket.on('connect')` never fires

**Solutions**:
1. Check JWT token is valid (not expired)
2. Verify CORS configuration allows your origin
3. Check network firewall allows WebSocket connections
4. Ensure MongoDB is running

### **Issue: "Authentication error: No token provided"**

**Solution**: Pass token in Socket.IO auth:
```javascript
const socket = io('http://localhost:3004', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});
```

### **Issue: "You do not have access to this event chat"**

**Reasons**:
- User is not enrolled in the event (participants must enroll first)
- User is not the event organizer
- Event doesn't exist

**Solution**: Verify enrollment status or organizer ownership

### **Issue: Messages not showing in history**

**Check**:
1. Are messages being saved? Check MongoDB:
   ```bash
   mongosh "mongodb://admin:dev123@localhost:27017"
   use mov_chat
   db.messages.find()
   ```

2. Is conversation created?
   ```bash
   db.conversations.find()
   ```

---

## 📊 Performance Considerations

### **MongoDB Indexes**

Already configured for optimal performance:
- `senderId`, `receiverId` - Fast message lookups
- `eventId` - Fast event chat queries
- `conversationId` - Fast conversation message retrieval
- Compound indexes for common query patterns

### **WebSocket Scaling** (Future)

For production with multiple server instances:
1. Use **Redis Adapter** for Socket.IO
2. Enable pub/sub for cross-server messaging
3. Configure sticky sessions on load balancer

---

## 🎯 Feature Completion Status

| Feature | Status | User Story |
|---------|--------|------------|
| Direct messaging | ✅ Complete | FUNC-CHAT-020 |
| Messaging before enrollment | ✅ Complete | FUNC-USER-030 |
| Organizer announcements | ✅ Complete | FUNC-CHAT-010 |
| Group chat | ✅ Complete | FUNC-CHAT-030 |
| Real-time delivery | ✅ Complete | FUNC-USER-040 |
| Message history | ✅ Complete | - |
| Typing indicators | ✅ Complete | - |
| Read receipts | ✅ Complete | - |

---

## 🔜 Next Steps

Now that Chat Service is complete, you can move on to:

1. **Notification Service** - Real-time notifications
2. **Email Notifications** - Enrollment confirmations, event updates
3. **Testing & Documentation** - Comprehensive testing suite
4. **Frontend Integration** - Build chat UI in React/Vue

---

## 📖 Related Documentation

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Project Architecture](../../docs/ARCHITECTURE.md)
- [API Documentation](../../docs/API.md)

---

**✨ Congratulations! Your Chat Service is ready for real-time communication!** 🎉
