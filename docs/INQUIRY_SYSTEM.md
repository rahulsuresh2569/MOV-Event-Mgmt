# 📧 Pre-Enrollment Inquiry System

## Overview

The **Pre-Enrollment Inquiry System** allows registered users (organizers or participants) to send questions to event organizers **before enrolling** in an event. This provides a communication channel for potential participants to clarify details about an event before committing to enrollment.

## Features

✅ **Pre-Enrollment Communication**: Contact organizers before enrolling  
✅ **Real-Time Notifications**: Organizers receive instant notifications via WebSocket  
✅ **Two-Way Communication**: Organizers can reply directly to inquiries  
✅ **Separate from Chat**: Inquiries are isolated from enrolled participant chat  
✅ **Read Tracking**: Track which inquiries have been viewed  
✅ **Status Management**: Track pending/replied/closed status  
✅ **REST + WebSocket**: Both APIs available for flexibility  

---

## Architecture

### Separation of Concerns

**Inquiries** (Pre-Enrollment):
- For registered users asking about events they haven't joined
- Stored in `Inquiry` collection (MongoDB)
- Available for PUBLISHED events only
- One-to-one organizer-inquirer communication

**Chat Messages** (Post-Enrollment):
- For enrolled participants and organizers
- Stored in `Message` and `Conversation` collections
- Requires enrollment verification
- Supports group chat and direct messages

### Data Model

```javascript
{
  eventId: Number,          // Event being inquired about
  eventTitle: String,       // Event title (cached)
  organizerId: Number,      // Event organizer
  inquirerId: Number,       // User asking the question
  inquirerEmail: String,    // Inquirer's email
  inquirerName: String,     // Inquirer's full name
  inquirerRole: String,     // ORGANIZER or PARTICIPANT
  subject: String,          // Inquiry subject (max 200 chars)
  question: String,         // Inquiry question (max 2000 chars)
  reply: String,            // Organizer's reply (max 2000 chars)
  repliedAt: Date,          // When organizer replied
  status: String,           // pending | replied | closed
  isRead: Boolean,          // Has organizer viewed it?
  readAt: Date,             // When organizer viewed it
  createdAt: Date,          // Auto-generated
  updatedAt: Date           // Auto-generated
}
```

---

## WebSocket Events (Socket.IO)

### 1. Send Inquiry

**Client Emits:**
```javascript
socket.emit('send-inquiry', {
  eventId: 10,
  subject: "Question about event capacity",
  question: "Is there a limit on participants for this event?"
});
```

**Server Responses:**
- **Success**: `inquiry-sent` event
  ```javascript
  {
    inquiryId: "65a8f...",
    message: "Your inquiry has been sent to the event organizer. They will respond soon."
  }
  ```
- **Error**: `error` event with message

**Validation:**
- User must be authenticated (JWT token)
- Event must exist and be PUBLISHED
- Subject and question are required

**Real-Time Notification:**
Organizer receives `inquiry-received` event:
```javascript
{
  inquiryId: "65a8f...",
  eventId: 10,
  eventTitle: "Tech Conference 2024",
  from: "John Doe",
  fromEmail: "john@example.com",
  fromRole: "PARTICIPANT",
  subject: "Question about event capacity",
  question: "Is there a limit on participants for this event?",
  isEnrolled: false,
  timestamp: "2024-01-24T02:30:00.000Z"
}
```

---

### 2. Reply to Inquiry (Organizer Only)

**Client Emits:**
```javascript
socket.emit('reply-inquiry', {
  inquiryId: "65a8f...",
  reply: "Yes, the maximum capacity is 100 participants."
});
```

**Server Responses:**
- **Success**: `inquiry-reply-sent` event
  ```javascript
  {
    inquiryId: "65a8f...",
    message: "Reply sent successfully"
  }
  ```
- **Error**: `error` event with message

**Validation:**
- User must be the event organizer
- Inquiry must exist

**Real-Time Notification:**
Inquirer receives `inquiry-replied` event:
```javascript
{
  inquiryId: "65a8f...",
  eventId: 10,
  eventTitle: "Tech Conference 2024",
  subject: "Question about event capacity",
  question: "Is there a limit on participants for this event?",
  reply: "Yes, the maximum capacity is 100 participants.",
  timestamp: "2024-01-24T02:35:00.000Z"
}
```

---

### 3. Get My Inquiries

**Client Emits:**
```javascript
socket.emit('get-my-inquiries');
```

**Server Responses:**
- `inquiries-list` event with array of inquiries
  ```javascript
  {
    inquiries: [
      {
        _id: "65a8f...",
        eventId: 10,
        eventTitle: "Tech Conference 2024",
        subject: "Question about event capacity",
        question: "Is there a limit...",
        reply: "Yes, the maximum...",
        status: "replied",
        repliedAt: "2024-01-24T02:35:00.000Z",
        createdAt: "2024-01-24T02:30:00.000Z"
      }
    ]
  }
  ```

**Limit:** Returns last 50 inquiries

---

### 4. Get Event Inquiries (Organizer Only)

**Client Emits:**
```javascript
socket.emit('get-event-inquiries', {
  eventId: 10
});
```

**Server Responses:**
- `event-inquiries-list` event
  ```javascript
  {
    eventId: 10,
    eventTitle: "Tech Conference 2024",
    inquiries: [/* array of inquiries */]
  }
  ```

**Validation:**
- User must be the event organizer

**Limit:** Returns last 100 inquiries

---

### 5. Mark Inquiry as Read (Organizer Only)

**Client Emits:**
```javascript
socket.emit('mark-inquiry-read', {
  inquiryId: "65a8f..."
});
```

**Server Responses:**
- `inquiry-marked-read` event
  ```javascript
  { inquiryId: "65a8f..." }
  ```

---

## REST API Endpoints

Base URL: `http://localhost:3000/api/v1/inquiries` (via API Gateway)  
Direct: `http://localhost:3004/api/v1/inquiries` (chat service)

### 1. Get My Inquiries

```http
GET /api/v1/inquiries/my-inquiries
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a8f...",
      "eventId": 10,
      "eventTitle": "Tech Conference 2024",
      "organizerId": 9,
      "inquirerId": 12,
      "inquirerEmail": "john@example.com",
      "inquirerName": "John Doe",
      "inquirerRole": "PARTICIPANT",
      "subject": "Question about event capacity",
      "question": "Is there a limit on participants?",
      "reply": "Yes, maximum is 100.",
      "repliedAt": "2024-01-24T02:35:00.000Z",
      "status": "replied",
      "isRead": true,
      "readAt": "2024-01-24T02:32:00.000Z",
      "createdAt": "2024-01-24T02:30:00.000Z",
      "updatedAt": "2024-01-24T02:35:00.000Z"
    }
  ]
}
```

---

### 2. Get Event Inquiries (Organizer Only)

```http
GET /api/v1/inquiries/events/:eventId/inquiries
Authorization: Bearer <JWT_TOKEN>
```

**Example:**
```http
GET /api/v1/inquiries/events/10/inquiries
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": 10,
    "eventTitle": "Tech Conference 2024",
    "inquiries": [/* array of inquiries */]
  }
}
```

**Errors:**
- `403`: Only organizer can view inquiries
- `404`: Event not found

---

### 3. Send Inquiry

```http
POST /api/v1/inquiries/events/:eventId/inquiries
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "subject": "Question about event capacity",
  "question": "Is there a limit on participants for this event?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Your inquiry has been sent to the event organizer",
  "data": {
    "_id": "65a8f...",
    "eventId": 10,
    "eventTitle": "Tech Conference 2024",
    "organizerId": 9,
    "inquirerId": 12,
    "inquirerEmail": "john@example.com",
    "inquirerName": "John Doe",
    "inquirerRole": "PARTICIPANT",
    "subject": "Question about event capacity",
    "question": "Is there a limit on participants for this event?",
    "status": "pending",
    "isRead": false,
    "createdAt": "2024-01-24T02:30:00.000Z",
    "updatedAt": "2024-01-24T02:30:00.000Z"
  }
}
```

**Errors:**
- `400`: Event is not PUBLISHED
- `404`: Event not found

---

### 4. Reply to Inquiry (Organizer Only)

```http
POST /api/v1/inquiries/:inquiryId/reply
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "reply": "Yes, the maximum capacity is 100 participants. We look forward to your registration!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reply sent successfully",
  "data": {
    "_id": "65a8f...",
    "eventId": 10,
    "subject": "Question about event capacity",
    "question": "Is there a limit on participants for this event?",
    "reply": "Yes, the maximum capacity is 100 participants...",
    "repliedAt": "2024-01-24T02:35:00.000Z",
    "status": "replied",
    ...
  }
}
```

**Errors:**
- `403`: Only organizer can reply
- `404`: Inquiry not found

---

### 5. Get Specific Inquiry

```http
GET /api/v1/inquiries/:inquiryId
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65a8f...",
    "eventId": 10,
    ...
  }
}
```

**Validation:**
- Only inquirer or organizer can view
- Automatically marks as read if organizer views

**Errors:**
- `403`: Unauthorized to view this inquiry
- `404`: Inquiry not found

---

## Testing with HTML Client

### Setup

1. Open `chat-test.html` in browser
2. Get JWT token from Postman (login as participant or organizer)
3. Paste token and click "Connect"

### Test Scenarios

#### Scenario 1: Participant Sends Inquiry

**As Participant (User 12):**

1. **Connect**: Paste JWT token and connect
2. **Send Inquiry**:
   - Event ID: `10`
   - Subject: `Questions about schedule`
   - Question: `What time does the event start?`
   - Click "Send Inquiry"
3. **View Inquiries**: Click "View My Inquiries"

**Expected Results:**
- ✅ `inquiry-sent` notification
- ✅ Inquiry appears in inquiry list
- ✅ Status: `pending`

---

#### Scenario 2: Organizer Receives and Replies

**As Organizer (User 9 or 10):**

1. **Connect**: Paste organizer's JWT token
2. **Receive Notification**: Should see `inquiry-received` event in real-time
3. **View Event Inquiries**:
   - Event ID: `10`
   - Click "View Event Inquiries (Organizer)"
4. **Reply**:
   - Copy Inquiry ID from list
   - Paste in "Inquiry ID" field
   - Enter reply: `The event starts at 9:00 AM`
   - Click "Reply (Organizer)"

**Expected Results:**
- ✅ Real-time notification when inquiry arrives
- ✅ Can view all inquiries for event
- ✅ Reply sent successfully
- ✅ Participant receives `inquiry-replied` notification

---

#### Scenario 3: Pre-Enrollment vs Post-Enrollment

**Before Enrollment:**
- ✅ Can send inquiries about published events
- ❌ Cannot join event chat room
- ❌ Cannot send direct messages to organizer

**After Enrollment:**
- ✅ Can join event chat room
- ✅ Can send group messages
- ✅ Can send direct messages to organizer
- ✅ Can still send inquiries (optional)

---

## Testing with Postman

### 1. Send Inquiry

```
POST http://localhost:3000/api/v1/inquiries/events/10/inquiries
Headers:
  Authorization: Bearer <PARTICIPANT_JWT>
  Content-Type: application/json
Body:
{
  "subject": "Parking availability",
  "question": "Is there parking available at the venue?"
}
```

### 2. Get My Inquiries

```
GET http://localhost:3000/api/v1/inquiries/my-inquiries
Headers:
  Authorization: Bearer <PARTICIPANT_JWT>
```

### 3. Get Event Inquiries (Organizer)

```
GET http://localhost:3000/api/v1/inquiries/events/10/inquiries
Headers:
  Authorization: Bearer <ORGANIZER_JWT>
```

### 4. Reply to Inquiry (Organizer)

```
POST http://localhost:3000/api/v1/inquiries/65a8f.../reply
Headers:
  Authorization: Bearer <ORGANIZER_JWT>
  Content-Type: application/json
Body:
{
  "reply": "Yes, there is free parking available in lot B."
}
```

---

## Security & Validation

### Authentication
- ✅ All requests require valid JWT token
- ✅ User context extracted from token

### Authorization
- ✅ Only organizers can reply to inquiries
- ✅ Only organizers can view event inquiries
- ✅ Users can only view their own inquiries

### Event Validation
- ✅ Event must exist and be PUBLISHED
- ✅ Only registered users can send inquiries (no guest access)

### Data Validation
- ✅ Subject: max 200 characters
- ✅ Question: max 2000 characters
- ✅ Reply: max 2000 characters

---

## Database Schema

### Collection: `inquiries`

```javascript
{
  _id: ObjectId,
  eventId: Number,           // Index
  eventTitle: String,
  organizerId: Number,       // Index
  inquirerId: Number,        // Index
  inquirerEmail: String,
  inquirerName: String,
  inquirerRole: String,
  subject: String,
  question: String,
  reply: String,
  repliedAt: Date,
  status: String,            // Index
  isRead: Boolean,
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

1. **Single Field Indexes:**
   - `eventId` (ascending)
   - `organizerId` (ascending)
   - `inquirerId` (ascending)
   - `status` (ascending)

2. **Compound Indexes:**
   - `{ eventId: 1, status: 1 }` - Filter event inquiries by status
   - `{ organizerId: 1, status: 1, createdAt: -1 }` - Organizer dashboard
   - `{ inquirerId: 1, createdAt: -1 }` - User inquiry history

---

## Integration Points

### Services Used

1. **Auth Service** (`http://auth-service:3001`)
   - User authentication via JWT
   - User details retrieval

2. **Event Service** (`http://event-service:3002`)
   - Event details and validation
   - Event status checking (PUBLISHED)

3. **Enrollment Service** (`http://enrollment-service:3003`)
   - Check if user is enrolled (optional info)

### Real-Time Communication

- Socket.IO for instant notifications
- Organizers notified immediately when inquiry arrives
- Inquirers notified when organizer replies

---

## Difference from Chat System

| Feature | Inquiry System | Chat System |
|---------|---------------|-------------|
| **Purpose** | Pre-enrollment questions | Post-enrollment communication |
| **Access** | Any registered user | Enrolled participants only |
| **Event Status** | PUBLISHED events only | Any event state |
| **Communication** | One-to-one (inquirer → organizer) | Group chat + Direct messages |
| **Storage** | `inquiries` collection | `messages` + `conversations` |
| **Requires eventId** | ✅ Yes | ✅ Yes |
| **Requires Enrollment** | ❌ No | ✅ Yes (except organizer) |
| **Reply Required** | ✅ Yes (status tracking) | ❌ No (continuous chat) |

---

## Error Handling

### Common Errors

1. **Not Connected**
   - Error: `Please connect first`
   - Solution: Connect with valid JWT token

2. **Event Not Found**
   - Error: `Event not found`
   - Solution: Verify event ID exists

3. **Event Not Published**
   - Error: `This event is not open for inquiries`
   - Solution: Wait for organizer to publish event

4. **Unauthorized Reply**
   - Error: `Only the event organizer can reply to inquiries`
   - Solution: Use organizer account

5. **Missing Fields**
   - Error: `Subject and question are required`
   - Solution: Provide all required fields

---

## Logging

All inquiry actions are logged:

```
✅ Inquiry sent for event 10 by user 12 (john@example.com)
✅ Inquiry 65a8f... replied by organizer 9
✅ Retrieved 5 inquiries for user 12
✅ Retrieved 12 inquiries for event 10
✅ Inquiry 65a8f... marked as read by organizer 9
```

---

## Future Enhancements

- 📊 Inquiry analytics dashboard
- 📧 Email notifications for inquiries
- 🔔 Push notifications
- 📎 File attachments in inquiries
- 💬 Threaded conversations
- 🏷️ Inquiry categories/tags
- ⭐ Inquiry priority levels
- 🔍 Search and filter inquiries

---

## Summary

The **Pre-Enrollment Inquiry System** bridges the gap between event discovery and enrollment, allowing potential participants to:

1. **Ask questions** about events before committing
2. **Get answers** from organizers in real-time
3. **Make informed decisions** before enrolling

This complements the chat system by providing a dedicated channel for pre-enrollment communication while keeping the main chat clean for enrolled participants.

**Key Benefit**: Users can now contact organizers at any stage—before, during, and after enrollment—creating a complete communication flow for the MOV Event Management platform.
