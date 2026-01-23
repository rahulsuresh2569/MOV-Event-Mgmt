# Postman Testing Guide - Chat Service

## 🎯 Overview

This guide shows you how to test the Chat Service using Postman, including both REST API endpoints and WebSocket connections.

---

## 📋 Prerequisites

1. **Postman Desktop** installed ([Download here](https://www.postman.com/downloads/))
2. **Services running**: `docker-compose up --build`
3. **Postman version 10.18+** (for WebSocket support)

---

## 🚀 Setup: Create Postman Environment

### Step 1: Create New Environment

1. Click **Environments** (left sidebar)
2. Click **+** to create new environment
3. Name it: `MOV Development`

### Step 2: Add Variables

Add these variables:

| Variable | Type | Initial Value | Current Value |
|----------|------|---------------|---------------|
| `base_url` | default | `http://localhost:3000/api/v1` | `http://localhost:3000/api/v1` |
| `chat_url` | default | `http://localhost:3004` | `http://localhost:3004` |
| `ws_url` | default | `ws://localhost:3004` | `ws://localhost:3004` |
| `organizer_token` | secret | (leave empty) | (leave empty) |
| `participant_token` | secret | (leave empty) | (leave empty) |
| `organizer_id` | default | (leave empty) | (leave empty) |
| `participant_id` | default | (leave empty) | (leave empty) |
| `event_id` | default | (leave empty) | (leave empty) |
| `conversation_id` | default | (leave empty) | (leave empty) |

Click **Save**

---

## 📁 Setup: Create Collection

1. Click **Collections** → **+** (Create Collection)
2. Name it: `MOV Chat Service`
3. Create folders:
   - `1. Setup (Auth & Events)`
   - `2. REST API - Chat History`
   - `3. WebSocket - Real-time Chat`

---

## 🔐 Part 1: Authentication & Setup

### 1.1 Register Organizer

**Method**: POST  
**URL**: `{{base_url}}/auth/register`  
**Headers**: 
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "email": "organizer@chat.com",
  "password": "test123",
  "role": "ORGANIZER",
  "firstName": "Alice",
  "lastName": "Smith"
}
```

**Tests** (Tab: Tests):
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("organizer_id", response.data.user.id);
    console.log("✅ Organizer ID saved:", response.data.user.id);
}

pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("User registered successfully", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});
```

---

### 1.2 Register Participant

**Method**: POST  
**URL**: `{{base_url}}/auth/register`  

**Body** (raw JSON):
```json
{
  "email": "participant@chat.com",
  "password": "test123",
  "role": "PARTICIPANT",
  "firstName": "Bob",
  "lastName": "Johnson"
}
```

**Tests**:
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("participant_id", response.data.user.id);
    console.log("✅ Participant ID saved:", response.data.user.id);
}
```

---

### 1.3 Login as Organizer

**Method**: POST  
**URL**: `{{base_url}}/auth/login`  

**Body** (raw JSON):
```json
{
  "email": "organizer@chat.com",
  "password": "test123"
}
```

**Tests**:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("organizer_token", response.data.token);
    console.log("✅ Organizer token saved!");
}

pm.test("Login successful", function () {
    pm.response.to.have.status(200);
});
```

---

### 1.4 Login as Participant

**Method**: POST  
**URL**: `{{base_url}}/auth/login`  

**Body** (raw JSON):
```json
{
  "email": "participant@chat.com",
  "password": "test123"
}
```

**Tests**:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("participant_token", response.data.token);
    console.log("✅ Participant token saved!");
}
```

---

### 1.5 Create Event (as Organizer)

**Method**: POST  
**URL**: `{{base_url}}/events`  
**Headers**:
```
Authorization: Bearer {{organizer_token}}
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "title": "Chat Test Event",
  "description": "Testing real-time chat features",
  "date": "2026-03-01T10:00:00Z",
  "location": "Online",
  "maxParticipants": 50,
  "category": "workshop"
}
```

**Tests**:
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("event_id", response.data.event.id);
    console.log("✅ Event ID saved:", response.data.event.id);
}
```

---

### 1.6 Publish Event

**Method**: PATCH  
**URL**: `{{base_url}}/events/{{event_id}}/status`  
**Headers**:
```
Authorization: Bearer {{organizer_token}}
Content-Type: application/json
```

**Body**:
```json
{
  "status": "Published"
}
```

---

### 1.7 Enroll Participant

**Method**: POST  
**URL**: `{{base_url}}/enrollments`  
**Headers**:
```
Authorization: Bearer {{participant_token}}
Content-Type: application/json
```

**Body**:
```json
{
  "eventId": {{event_id}}
}
```

✅ **Setup Complete!** Now you have an event with an enrolled participant.

---

## 📡 Part 2: Test REST API Endpoints

### 2.1 Get User's Conversations

**Method**: GET  
**URL**: `{{base_url}}/chat/conversations`  
**Headers**:
```
Authorization: Bearer {{participant_token}}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": {
    "conversations": []
  }
}
```

*Initially empty until you send messages*

---

### 2.2 Get Event Group Chat Messages

**Method**: GET  
**URL**: `{{base_url}}/chat/events/{{event_id}}/messages`  
**Headers**:
```
Authorization: Bearer {{participant_token}}
```

**Query Params** (optional):
- `limit`: 50 (default)
- `before`: ISO timestamp for pagination

**Expected Response**:
```json
{
  "success": true,
  "message": "Event messages retrieved successfully",
  "data": {
    "messages": [],
    "count": 0
  }
}
```

---

### 2.3 Get Direct Conversation

**Method**: GET  
**URL**: `{{base_url}}/chat/conversations/direct/{{organizer_id}}`  
**Headers**:
```
Authorization: Bearer {{participant_token}}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "No conversation found",
  "data": {
    "conversation": null
  }
}
```

*Or returns conversation if it exists*

---

### 2.4 Mark Messages as Read

**Method**: POST  
**URL**: `{{base_url}}/chat/messages/mark-read`  
**Headers**:
```
Authorization: Bearer {{participant_token}}
Content-Type: application/json
```

**Body**:
```json
{
  "conversationId": "{{conversation_id}}"
}
```

---

### 2.5 Health Check

**Method**: GET  
**URL**: `{{chat_url}}/health`  

**Expected Response**:
```json
{
  "success": true,
  "message": "Chat Service is healthy",
  "timestamp": "2026-01-17T...",
  "socketConnections": 0
}
```

---

## 🔌 Part 3: Test WebSocket Connections

Postman now supports WebSocket testing! Here's how:

### 3.1 Create WebSocket Request

1. Click **New** → **WebSocket**
2. Name it: `Chat WebSocket Connection`

### 3.2 Connect to Chat Service

**WebSocket URL**:
```
{{ws_url}}
```

**Connection Settings**:
1. Click on **WebSocket** request
2. In the address bar, enter: `ws://localhost:3004`
3. Click **Connect**

⚠️ **You'll get an error**: "Authentication error: No token provided"

This is expected! WebSocket needs authentication.

---

### 3.3 WebSocket with Authentication

**Unfortunately, Postman's WebSocket doesn't support Socket.IO authentication directly.**

Instead, we'll use **two methods**:

---

## 🎨 Method 1: Use Browser Console (Recommended)

This is the easiest way to test WebSocket real-time features.

### Step 1: Create HTML Test File

Save this as `chat-test.html` in your project root:

```html
<!DOCTYPE html>
<html>
<head>
    <title>MOV Chat Test</title>
    <script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .status { padding: 10px; border-radius: 5px; margin: 10px 0; font-weight: bold; }
        .connected { background-color: #d4edda; color: #155724; }
        .disconnected { background-color: #f8d7da; color: #721c24; }
        .chat-box { border: 1px solid #ccc; padding: 15px; height: 400px; overflow-y: auto; margin-bottom: 15px; background: #fafafa; border-radius: 5px; }
        .message { padding: 8px 12px; margin: 5px 0; border-radius: 5px; max-width: 80%; }
        .sent { background-color: #007bff; color: white; margin-left: auto; text-align: right; }
        .received { background-color: #e9ecef; color: #333; }
        .system { background-color: #fff3cd; color: #856404; font-style: italic; text-align: center; max-width: 100%; }
        input, button { padding: 10px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
        input { width: 70%; font-size: 14px; }
        button { background-color: #007bff; color: white; border: none; cursor: pointer; font-weight: bold; }
        button:hover { background-color: #0056b3; }
        button:disabled { background-color: #6c757d; cursor: not-allowed; }
        .input-group { display: flex; align-items: center; margin-bottom: 10px; }
        label { display: block; font-weight: bold; margin-bottom: 5px; color: #555; }
        .token-input { width: 85%; }
        .info { background-color: #d1ecf1; color: #0c5460; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 MOV Chat Service Test</h1>
        
        <div class="info">
            <strong>💡 Instructions:</strong> Get your JWT token from Postman (organizer or participant), paste it below, and connect!
        </div>
        
        <div class="section">
            <label>🔑 JWT Token:</label>
            <div class="input-group">
                <input type="text" id="token" class="token-input" placeholder="Paste your JWT token here">
                <button onclick="connect()" id="connectBtn">Connect</button>
            </div>
            <div id="status" class="status disconnected">⚠️ Not connected</div>
        </div>
        
        <div class="section">
            <label>🎪 Event Room Controls:</label>
            <div class="input-group">
                <input type="number" id="eventId" placeholder="Enter event ID" style="width: 30%;">
                <button onclick="joinRoom()" id="joinBtn" disabled>Join Event Room</button>
                <button onclick="leaveRoom()" id="leaveBtn" disabled>Leave Room</button>
            </div>
        </div>
        
        <div class="section">
            <label>💬 Chat Messages:</label>
            <div class="chat-box" id="messages"></div>
            
            <div class="input-group">
                <input type="text" id="messageInput" placeholder="Type your message..." onkeypress="handleKeyPress(event)" disabled>
                <button onclick="sendGroupMessage()" id="sendGroupBtn" disabled>Send to Group</button>
            </div>
            
            <div class="input-group">
                <input type="number" id="receiverId" placeholder="Receiver User ID" style="width: 30%;">
                <button onclick="sendDirectMessage()" id="sendDirectBtn" disabled>Send Direct Message</button>
            </div>
        </div>
    </div>

    <script>
        let socket = null;
        let currentEventId = null;

        function connect() {
            const token = document.getElementById('token').value.trim();
            if (!token) {
                alert('❌ Please enter your JWT token');
                return;
            }

            addMessage('🔄 Connecting to chat service...', 'system');
            document.getElementById('connectBtn').disabled = true;

            socket = io('http://localhost:3004', {
                auth: { token: token },
                transports: ['websocket', 'polling']
            });

            socket.on('connect', () => {
                document.getElementById('status').textContent = '✅ Connected to chat service';
                document.getElementById('status').className = 'status connected';
                document.getElementById('connectBtn').textContent = 'Connected';
                
                // Enable buttons
                document.getElementById('joinBtn').disabled = false;
                document.getElementById('leaveBtn').disabled = false;
                document.getElementById('sendDirectBtn').disabled = false;
                
                addMessage('✅ Successfully connected! You can now join event rooms.', 'system');
            });

            socket.on('connect_error', (error) => {
                addMessage('❌ Connection error: ' + error.message, 'system');
                document.getElementById('status').textContent = '❌ Connection failed';
                document.getElementById('status').className = 'status disconnected';
                document.getElementById('connectBtn').disabled = false;
                document.getElementById('connectBtn').textContent = 'Connect';
            });

            socket.on('disconnect', (reason) => {
                document.getElementById('status').textContent = '⚠️ Disconnected: ' + reason;
                document.getElementById('status').className = 'status disconnected';
                document.getElementById('connectBtn').disabled = false;
                document.getElementById('connectBtn').textContent = 'Reconnect';
                
                // Disable buttons
                document.getElementById('joinBtn').disabled = true;
                document.getElementById('leaveBtn').disabled = true;
                document.getElementById('messageInput').disabled = true;
                document.getElementById('sendGroupBtn').disabled = true;
                document.getElementById('sendDirectBtn').disabled = true;
                
                addMessage('⚠️ Disconnected from chat service', 'system');
            });

            socket.on('error', (data) => {
                addMessage('❌ ERROR: ' + data.message, 'system');
            });

            socket.on('message-received', (data) => {
                const sender = data.senderEmail || `User ${data.senderId}`;
                addMessage(`${sender}: ${data.content}`, 'received');
            });

            socket.on('user-joined', (data) => {
                addMessage(`👋 ${data.userEmail} (${data.userRole}) joined the chat`, 'system');
            });

            socket.on('user-left', (data) => {
                addMessage(`👋 ${data.userEmail} left the chat`, 'system');
            });

            socket.on('joined-event-room', (data) => {
                addMessage(`✅ Joined event room #${data.eventId}`, 'system');
                currentEventId = data.eventId;
                document.getElementById('messageInput').disabled = false;
                document.getElementById('sendGroupBtn').disabled = false;
            });

            socket.on('left-event-room', (data) => {
                addMessage(`📤 Left event room #${data.eventId}`, 'system');
                currentEventId = null;
                document.getElementById('messageInput').disabled = true;
                document.getElementById('sendGroupBtn').disabled = true;
            });

            socket.on('typing-indicator', (data) => {
                if (data.typing) {
                    addMessage(`⌨️ ${data.userEmail} is typing...`, 'system');
                }
            });

            socket.on('message-sent', (data) => {
                console.log('✅ Message sent successfully', data);
            });
        }

        function joinRoom() {
            if (!socket || !socket.connected) {
                alert('❌ Please connect first');
                return;
            }
            const eventId = parseInt(document.getElementById('eventId').value);
            if (!eventId || eventId <= 0) {
                alert('❌ Please enter a valid event ID');
                return;
            }
            socket.emit('join-event-room', { eventId: eventId });
            addMessage(`🔄 Joining event room #${eventId}...`, 'system');
        }

        function leaveRoom() {
            if (!socket || !socket.connected) {
                alert('❌ Not connected');
                return;
            }
            if (!currentEventId) {
                alert('❌ Not in a room');
                return;
            }
            socket.emit('leave-event-room', { eventId: currentEventId });
        }

        function sendGroupMessage() {
            if (!socket || !socket.connected) {
                alert('❌ Please connect first');
                return;
            }
            if (!currentEventId) {
                alert('❌ Please join an event room first');
                return;
            }
            const content = document.getElementById('messageInput').value.trim();
            if (!content) return;

            socket.emit('send-group-message', {
                eventId: currentEventId,
                content: content
            });

            addMessage(`You: ${content}`, 'sent');
            document.getElementById('messageInput').value = '';
        }

        function sendDirectMessage() {
            if (!socket || !socket.connected) {
                alert('❌ Please connect first');
                return;
            }
            const receiverId = parseInt(document.getElementById('receiverId').value);
            const content = document.getElementById('messageInput').value.trim();
            if (!receiverId || receiverId <= 0 || !content) {
                alert('❌ Please enter receiver ID and message');
                return;
            }

            socket.emit('send-direct-message', {
                receiverId: receiverId,
                content: content
            });

            addMessage(`📨 Direct to User #${receiverId}: ${content}`, 'sent');
            document.getElementById('messageInput').value = '';
        }

        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendGroupMessage();
            }
        }

        function addMessage(text, type) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + type;
            
            const time = new Date().toLocaleTimeString();
            messageDiv.textContent = `[${time}] ${text}`;
            
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        // Auto-scroll to bottom
        window.addEventListener('load', () => {
            addMessage('👋 Welcome! Enter your JWT token and connect to start chatting.', 'system');
        });
    </script>
</body>
</html>
```

### Step 2: Use the Test Page

1. **Open the HTML file in Chrome/Edge**
2. **Get tokens from Postman**:
   - Run "Login as Organizer" → Copy token
   - Run "Login as Participant" → Copy token
3. **Open two browser tabs**:
   - Tab 1: Paste organizer token → Connect
   - Tab 2: Paste participant token → Connect
4. **Both join same event room** (use event_id from Postman)
5. **Send messages** and see them appear in real-time!

---

## 🎯 Method 2: Use Postman Pre-request Scripts

For testing REST API with real-time context:

### Create Test Flow

**Request**: Get Event Messages (with setup)

**Pre-request Script**:
```javascript
// This runs before each request
const token = pm.environment.get("participant_token");

// You can add logic here to simulate user actions
console.log("Testing with token:", token ? "✅ Set" : "❌ Missing");
```

**Tests**:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has messages array", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('messages');
    pm.expect(jsonData.data.messages).to.be.an('array');
});

// Log message count
const response = pm.response.json();
console.log(`📊 Total messages: ${response.data.count}`);
```

---

## 🧪 Testing Scenarios

### Scenario 1: Event Group Chat

**Steps in Postman**:
1. ✅ Run "Login as Organizer"
2. ✅ Run "Login as Participant"
3. ✅ Run "Create Event"
4. ✅ Run "Publish Event"
5. ✅ Run "Enroll Participant"

**Then in HTML Test Page**:
1. Open two tabs (organizer + participant)
2. Both join event room
3. Send messages back and forth
4. See real-time delivery

**Verify in Postman**:
1. Run "Get Event Messages" (participant)
2. Should see all messages sent

---

### Scenario 2: Direct Messages

**In HTML Test Page**:
1. Connect as participant
2. Enter organizer's user ID (check Postman variable `organizer_id`)
3. Send direct message
4. Connect as organizer in another tab
5. See message received

**Verify in Postman**:
1. Run "Get User's Conversations" (participant)
2. Should see conversation with organizer
3. Save `conversation._id` to environment
4. Run "Get Conversation Messages"

---

### Scenario 3: Access Control Testing

**Test 1: Non-enrolled user cannot join event chat**

1. Create second participant (different email)
2. Login as new participant
3. DON'T enroll in event
4. Try to join event room in HTML
5. Should get error: "You do not have access to this event chat"

**Test 2: Participant can message before enrollment**

1. Create new participant
2. Login
3. Send direct message to organizer (should work!)
4. Verify in Postman "Get Conversations"

---

## 📊 Verify Data in MongoDB

After sending messages, verify they're stored:

**Option A: Using Mongo Express** (http://localhost:8081)
1. Login: admin / admin123
2. Navigate to `mov_chat` database
3. View `messages` collection
4. View `conversations` collection

**Option B: Using mongosh**
```powershell
# Connect to MongoDB
docker exec -it mov-mongodb mongosh -u admin -p dev123

# Use chat database
use mov_chat

# See all messages
db.messages.find().pretty()

# See conversations
db.conversations.find().pretty()

# Count messages
db.messages.countDocuments()

# Get messages for specific event
db.messages.find({ eventId: 1 }).pretty()
```

---

## 🐛 Troubleshooting

### Issue: "Authentication error: No token provided"
**Solution**: Make sure you're passing the token correctly in Socket.IO auth

### Issue: "You do not have access to this event chat"
**Reasons**:
- Participant not enrolled in event
- Using wrong event ID
- Event doesn't exist

**Solution**: 
1. Check enrollment: `GET {{base_url}}/enrollments/me`
2. Verify event ID matches
3. Ensure participant is enrolled before joining

### Issue: Messages not appearing in Postman
**Reason**: WebSocket messages only appear in real-time clients

**Solution**: Use REST API to get history:
```
GET {{base_url}}/chat/events/{{event_id}}/messages
```

### Issue: Cannot connect to WebSocket
**Solutions**:
1. Check chat service is running: `curl http://localhost:3004/health`
2. Check MongoDB is running: `docker ps | grep mongodb`
3. Verify JWT token is valid (not expired)
4. Check browser console for errors

---

## ✅ Success Checklist

After testing, you should have:

- ✅ Created organizer and participant accounts
- ✅ Created and published an event
- ✅ Enrolled participant in event
- ✅ Connected to WebSocket with JWT auth
- ✅ Joined event room successfully
- ✅ Sent group messages
- ✅ Sent direct messages
- ✅ Retrieved message history via REST API
- ✅ Verified messages in MongoDB
- ✅ Tested access control (non-enrolled users blocked)

---

## 📖 API Reference Summary

### REST Endpoints (via Postman)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/chat/conversations` | ✅ | List user's chats |
| GET | `/chat/conversations/direct/:userId` | ✅ | Get direct chat with user |
| GET | `/chat/conversations/:id/messages` | ✅ | Get conversation history |
| GET | `/chat/events/:eventId/messages` | ✅ | Get event group messages |
| POST | `/chat/messages/mark-read` | ✅ | Mark messages as read |
| GET | `/health` | ❌ | Health check |

### WebSocket Events (via HTML Test Page)

**Client → Server:**
- `join-event-room` - Join event chat
- `leave-event-room` - Leave event chat
- `send-group-message` - Send to event group
- `send-direct-message` - Send to specific user
- `typing-start` / `typing-stop` - Typing indicators

**Server → Client:**
- `message-received` - New message
- `user-joined` / `user-left` - Room events
- `typing-indicator` - Someone typing
- `error` - Error occurred

---

## 🎓 Next Steps

Now that you can test the chat service:

1. **Test all scenarios** thoroughly
2. **Verify message persistence** in MongoDB
3. **Test error cases** (invalid tokens, unauthorized access)
4. **Performance test** with multiple users
5. **Move on to Notification Service** (MS4 Part 2)

---

## 📚 Related Documentation

- [Chat Service Implementation Guide](./MS4_CHAT_SERVICE_GUIDE.md)
- [Quick Start Guide](./MS4_QUICK_START_CHAT.md)
- [Postman Documentation](https://learning.postman.com/docs/getting-started/introduction/)
- [Socket.IO Documentation](https://socket.io/docs/v4/)

---

**🎉 Happy Testing! You're now ready to test real-time chat!**
