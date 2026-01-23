# Quick Start: Testing Chat Service

## 🚀 Start the System

```bash
# From project root
cd C:\Users\brind\MOV PROJECT\MOV-Event-Mgmt

# Start all services with Docker
docker-compose up --build
```

Wait for all services to start. You should see:
```
✅ mov-postgres is healthy
✅ mov-mongodb is healthy
✅ mov-redis is healthy
✅ mov-auth-service is running
✅ mov-event-service is running
✅ mov-enrollment-service is running
✅ mov-chat-service is running (NEW!)
✅ mov-api-gateway is running
```

---

## 📋 Testing Checklist

### ✅ Step 1: Verify Chat Service Health

```powershell
curl http://localhost:3004/health
```

Expected:
```json
{
  "success": true,
  "message": "Chat Service is healthy",
  "socketConnections": 0
}
```

---

### ✅ Step 2: Create Test Users

**Register Organizer**:
```powershell
curl -X POST http://localhost:3000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    \"email\": \"organizer@chat.com\",
    \"password\": \"test123\",
    \"role\": \"ORGANIZER\",
    \"firstName\": \"Alice\",
    \"lastName\": \"Smith\"
  }'
```

**Register Participant**:
```powershell
curl -X POST http://localhost:3000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    \"email\": \"participant@chat.com\",
    \"password\": \"test123\",
    \"role\": \"PARTICIPANT\",
    \"firstName\": \"Bob\",
    \"lastName\": \"Johnson\"
  }'
```

---

### ✅ Step 3: Get JWT Tokens

**Login as Organizer**:
```powershell
curl -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    \"email\": \"organizer@chat.com\",
    \"password\": \"test123\"
  }'
```

Copy the `token` from response → `$ORGANIZER_TOKEN`

**Login as Participant**:
```powershell
curl -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    \"email\": \"participant@chat.com\",
    \"password\": \"test123\"
  }'
```

Copy the `token` from response → `$PARTICIPANT_TOKEN`

---

### ✅ Step 4: Create and Publish an Event

**Create Event (as Organizer)**:
```powershell
curl -X POST http://localhost:3000/api/v1/events `
  -H "Authorization: Bearer $ORGANIZER_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    \"title\": \"Chat Test Event\",
    \"description\": \"Testing real-time chat\",
    \"date\": \"2026-03-01T10:00:00Z\",
    \"location\": \"Online\",
    \"maxParticipants\": 50,
    \"category\": \"workshop\"
  }'
```

Copy the `event.id` from response → `$EVENT_ID`

**Publish Event**:
```powershell
curl -X PATCH http://localhost:3000/api/v1/events/$EVENT_ID/status `
  -H "Authorization: Bearer $ORGANIZER_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"status\": \"Published\"}'
```

---

### ✅ Step 5: Enroll Participant

```powershell
curl -X POST http://localhost:3000/api/v1/enrollments `
  -H "Authorization: Bearer $PARTICIPANT_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"eventId\": $EVENT_ID}'
```

---

### ✅ Step 6: Test WebSocket Connection

**Save this as `test-chat.html`**:

```html
<!DOCTYPE html>
<html>
<head>
    <title>MOV Chat Test</title>
    <script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .chat-box { border: 1px solid #ccc; padding: 10px; height: 400px; overflow-y: auto; margin-bottom: 10px; }
        .message { padding: 5px; margin: 5px 0; border-radius: 5px; }
        .sent { background-color: #e3f2fd; text-align: right; }
        .received { background-color: #f5f5f5; }
        input, button { padding: 10px; margin: 5px; }
        input { width: 60%; }
        .status { color: green; font-weight: bold; }
        .error { color: red; }
    </style>
</head>
<body>
    <div class="container">
        <h1>MOV Chat Service Test</h1>
        
        <div>
            <label>JWT Token:</label><br>
            <input type="text" id="token" placeholder="Paste your JWT token here" style="width: 90%">
            <button onclick="connect()">Connect</button>
        </div>
        
        <div>
            <label>Event ID:</label>
            <input type="number" id="eventId" placeholder="Enter event ID">
            <button onclick="joinRoom()">Join Event Room</button>
            <button onclick="leaveRoom()">Leave Room</button>
        </div>
        
        <div>
            <p id="status" class="status"></p>
        </div>
        
        <div class="chat-box" id="messages"></div>
        
        <div>
            <input type="text" id="messageInput" placeholder="Type your message..." onkeypress="handleKeyPress(event)">
            <button onclick="sendGroupMessage()">Send to Group</button>
        </div>
        
        <div>
            <input type="number" id="receiverId" placeholder="Receiver User ID">
            <button onclick="sendDirectMessage()">Send Direct Message</button>
        </div>
    </div>

    <script>
        let socket = null;
        let currentEventId = null;

        function connect() {
            const token = document.getElementById('token').value;
            if (!token) {
                alert('Please enter your JWT token');
                return;
            }

            socket = io('http://localhost:3004', {
                auth: { token: token }
            });

            socket.on('connect', () => {
                document.getElementById('status').textContent = '✅ Connected to chat service';
                document.getElementById('status').className = 'status';
            });

            socket.on('disconnect', () => {
                document.getElementById('status').textContent = '❌ Disconnected';
                document.getElementById('status').className = 'error';
            });

            socket.on('error', (data) => {
                addMessage('ERROR: ' + data.message, 'error');
            });

            socket.on('message-received', (data) => {
                addMessage(`${data.senderEmail}: ${data.content}`, 'received');
            });

            socket.on('user-joined', (data) => {
                addMessage(`👋 ${data.userEmail} joined the chat`, 'status');
            });

            socket.on('user-left', (data) => {
                addMessage(`👋 ${data.userEmail} left the chat`, 'status');
            });

            socket.on('joined-event-room', (data) => {
                addMessage(`✅ Joined event room ${data.eventId}`, 'status');
                currentEventId = data.eventId;
            });

            socket.on('typing-indicator', (data) => {
                if (data.typing) {
                    addMessage(`⌨️ ${data.userEmail} is typing...`, 'status');
                }
            });

            socket.on('message-sent', (data) => {
                addMessage(`✅ Message sent`, 'status');
            });
        }

        function joinRoom() {
            if (!socket) {
                alert('Please connect first');
                return;
            }
            const eventId = parseInt(document.getElementById('eventId').value);
            if (!eventId) {
                alert('Please enter event ID');
                return;
            }
            socket.emit('join-event-room', { eventId: eventId });
        }

        function leaveRoom() {
            if (!socket || !currentEventId) {
                alert('Not in a room');
                return;
            }
            socket.emit('leave-event-room', { eventId: currentEventId });
        }

        function sendGroupMessage() {
            if (!socket) {
                alert('Please connect first');
                return;
            }
            if (!currentEventId) {
                alert('Please join an event room first');
                return;
            }
            const content = document.getElementById('messageInput').value;
            if (!content) return;

            socket.emit('send-group-message', {
                eventId: currentEventId,
                content: content
            });

            addMessage(`You: ${content}`, 'sent');
            document.getElementById('messageInput').value = '';
        }

        function sendDirectMessage() {
            if (!socket) {
                alert('Please connect first');
                return;
            }
            const receiverId = parseInt(document.getElementById('receiverId').value);
            const content = document.getElementById('messageInput').value;
            if (!receiverId || !content) {
                alert('Please enter receiver ID and message');
                return;
            }

            socket.emit('send-direct-message', {
                receiverId: receiverId,
                content: content
            });

            addMessage(`Direct to User ${receiverId}: ${content}`, 'sent');
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
            messageDiv.textContent = text;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    </script>
</body>
</html>
```

**Open the HTML file in two browser tabs**:
1. Tab 1: Use organizer token
2. Tab 2: Use participant token
3. Both join the same event room
4. Send messages and see them appear in both tabs instantly!

---

### ✅ Step 7: Test REST API (Message History)

**Get Conversations**:
```powershell
curl -H "Authorization: Bearer $PARTICIPANT_TOKEN" `
     http://localhost:3000/api/v1/chat/conversations
```

**Get Event Messages**:
```powershell
curl -H "Authorization: Bearer $PARTICIPANT_TOKEN" `
     http://localhost:3000/api/v1/chat/events/$EVENT_ID/messages
```

---

## 🎯 Success Criteria

You should be able to:
- ✅ Connect to WebSocket with JWT token
- ✅ Join event room as enrolled participant
- ✅ Join event room as organizer
- ✅ Send group messages
- ✅ Send direct messages
- ✅ See messages in real-time
- ✅ Retrieve message history via REST API
- ✅ See typing indicators
- ✅ Receive "user joined/left" notifications

---

## 🐛 Common Issues

**Error: "Authentication error"**
→ Check your JWT token is valid and not expired

**Error: "You do not have access to this event chat"**
→ Make sure participant is enrolled in the event

**Error: "Cannot connect to MongoDB"**
→ Check MongoDB is running: `docker ps | grep mongodb`

**Messages not appearing**
→ Make sure both users are in the same event room

---

## 📊 Check MongoDB Data

```powershell
# Connect to MongoDB
docker exec -it mov-mongodb mongosh -u admin -p dev123

# Use chat database
use mov_chat

# See conversations
db.conversations.find().pretty()

# See messages
db.messages.find().pretty()

# Count messages
db.messages.countDocuments()

# Get messages for specific event
db.messages.find({ eventId: 1 }).pretty()
```

---

## ✨ Next: Build Notification Service

Now that chat is working, you can proceed to:
1. Notification Service (emails, push notifications)
2. Integrate notifications with chat (notify on new message)
3. Event update notifications (status changes, cancellations)

---

**🎉 Your chat service is live and working! Try chatting in real-time!**
