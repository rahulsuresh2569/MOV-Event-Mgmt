# Notification Service

Real-time push notification system for the MOV Event Management platform. Delivers event-driven notifications to users via WebSocket connections.

## Features

- **Real-time Push Notifications**: Instant delivery via Socket.IO
- **Event-Driven Architecture**: Redis Pub/Sub for microservice communication
- **Multiple Notification Types**: 15 different notification types covering all platform events
- **User Preferences**: Customizable notification settings per user
- **Notification History**: Persistent storage with 90-day retention
- **Unread Tracking**: Real-time unread count updates
- **Priority System**: Critical, high, medium, low priority levels
- **Quiet Hours**: Respect user's do-not-disturb settings

## Notification Types

### Enrollment Notifications
- `ENROLLMENT_CREATED` - New enrollment confirmation
- `ENROLLMENT_CANCELLED` - Enrollment cancellation notice
- `ENROLLMENT_APPROVED` - Enrollment approved (if approval required)
- `ENROLLMENT_REJECTED` - Enrollment rejected notice

### Event Lifecycle Notifications
- `EVENT_STATUS_CHANGED` - Event status changed (published, cancelled, etc.)
- `EVENT_PUBLISHED` - Event published and available for enrollment
- `EVENT_CANCELLED` - Event cancelled notification
- `EVENT_COMPLETED` - Event completed notification
- `EVENT_UPDATED` - Event details updated

### Capacity Notifications
- `CAPACITY_80_PERCENT` - Event reached 80% capacity
- `CAPACITY_90_PERCENT` - Event reached 90% capacity
- `CAPACITY_FULL` - Event at full capacity
- `CAPACITY_AVAILABLE` - Capacity available after cancellation

### Communication Notifications
- `MESSAGE_RECEIVED` - New direct message received
- `INQUIRY_RECEIVED` - New pre-enrollment inquiry (organizers)

### System Notifications
- `SYSTEM_NOTIFICATION` - General system announcements

## API Endpoints

### REST API

#### Get Notifications
```
GET /api/notifications
Query Params:
  - page: number (default: 1)
  - limit: number (default: 20)
  - unreadOnly: boolean (default: false)
  - type: string (optional notification type filter)
```

#### Get Unread Count
```
GET /api/notifications/unread-count
```

#### Mark as Read
```
PUT /api/notifications/:id/read
```

#### Mark All as Read
```
PUT /api/notifications/read-all
```

#### Get User Preferences
```
GET /api/notifications/preferences
```

#### Update User Preferences
```
PUT /api/notifications/preferences
Body: {
  email: boolean,
  push: boolean,
  enrollments: boolean,
  eventUpdates: boolean,
  messages: boolean,
  systemNotifications: boolean,
  quietHours: {
    enabled: boolean,
    start: "22:00",
    end: "08:00"
  }
}
```

#### Health Check
```
GET /api/notifications/health
GET /health
```

### WebSocket Events

#### Client → Server

**get-notifications**
Request notifications with pagination
```javascript
socket.emit('get-notifications', {
  page: 1,
  limit: 20,
  unreadOnly: false
}, (response) => {
  console.log(response.data);
});
```

**mark-read**
Mark a notification as read
```javascript
socket.emit('mark-read', {
  notificationId: '507f1f77bcf86cd799439011'
}, (response) => {
  console.log(response.message);
});
```

**mark-all-read**
Mark all notifications as read
```javascript
socket.emit('mark-all-read', (response) => {
  console.log(response.message);
});
```

#### Server → Client

**initial-notifications**
Sent on connection with recent notifications
```javascript
socket.on('initial-notifications', (data) => {
  console.log(data.notifications);
  console.log(data.unreadCount);
});
```

**notification**
New notification received in real-time
```javascript
socket.on('notification', (notification) => {
  console.log(notification.title);
  console.log(notification.message);
  showToast(notification);
});
```

**unread-count**
Updated unread count
```javascript
socket.on('unread-count', (data) => {
  updateBadge(data.count);
});
```

**notifications-list**
Response to get-notifications request
```javascript
socket.on('notifications-list', (data) => {
  renderNotifications(data.notifications);
});
```

## Event Publishing

Other services publish events to Redis channel `events`:

```javascript
const redis = require('redis');
const publisher = redis.createClient({
  url: process.env.REDIS_URL
});

// Example: Publishing enrollment created event
await publisher.publish('events', JSON.stringify({
  type: 'ENROLLMENT_CREATED',
  data: {
    enrollmentId: '507f1f77bcf86cd799439011',
    userId: '507f191e810c19729de860ea',
    eventId: '507f191e810c19729de860eb',
    userName: 'John Doe',
    eventTitle: 'Tech Conference 2026'
  },
  timestamp: new Date().toISOString()
}));
```

### Event Schema

All events must follow this schema:
```javascript
{
  type: string,          // Event type (e.g., 'ENROLLMENT_CREATED')
  data: {                // Event-specific payload
    userId: string,      // Target user ID (or organizerId for organizer notifications)
    ...                  // Other event-specific fields
  },
  timestamp: string      // ISO 8601 timestamp
}
```

## Environment Variables

```env
# Server Configuration
PORT=3005
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://mongo:27017/mov-notifications

# Redis Configuration
REDIS_URL=redis://redis:6379

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:8080

# Notification Settings
NOTIFICATION_RETENTION_DAYS=90
```

## Installation

```bash
# Install dependencies
npm install

# Start service (development)
npm run dev

# Start service (production)
npm start
```

## Docker

```bash
# Build image
docker build -t mov-notification-service .

# Run container
docker run -p 3005:3005 \
  -e MONGODB_URI=mongodb://mongo:27017/mov-notifications \
  -e REDIS_URL=redis://redis:6379 \
  -e JWT_SECRET=your-secret \
  mov-notification-service
```

## Architecture

```
┌─────────────────┐
│  Other Services │
│  (Event, Enroll)│
└────────┬────────┘
         │ Publish Events
         ▼
    ┌─────────┐
    │  Redis  │
    │ Pub/Sub │
    └────┬────┘
         │ Subscribe
         ▼
┌─────────────────────────┐
│   Event Bus             │
│   - Enrollment Handler  │
│   - Event Handler       │
│   - Capacity Handler    │
│   - Message Handler     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Notification Service    │
│   - Check Preferences   │
│   - Save to MongoDB     │
│   - Deliver via Socket  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Frontend Client       │
│   - Socket.IO Connect   │
│   - Display Toast       │
│   - Update Badge        │
└─────────────────────────┘
```

## Testing

Use the included `notification-test.html` in the project root to test the notification system:

1. Open `notification-test.html` in a browser
2. Click "Connect" with valid JWT token
3. Use simulation buttons to test different notification types
4. Verify real-time delivery and UI updates

## User Stories Implemented

- **FUNC-ENROLL-040**: Capacity threshold notifications (80%, 90%, 100%)
- **FUNC-LIFE-040**: Event lifecycle notifications (status changes)
- **FUNC-EVENT-080**: Organizer notifications (enrollments, messages, capacity)
- **FUNC-USER-040**: Real-time participant notifications (enrollments, updates)

## Logging

All operations are logged using Winston:
- Console output (development)
- File rotation (production): `logs/app-%DATE%.log`
- Error tracking: `logs/error-%DATE%.log`

## Security

- JWT authentication required for all connections
- Socket.IO authentication middleware validates tokens
- User isolation: Users only receive their own notifications
- Input validation on all endpoints
- Secure WebSocket connections (wss:// in production)

## Performance

- Connection pooling for MongoDB
- Redis Pub/Sub for efficient event distribution
- Indexed queries for fast notification retrieval
- TTL indexes for automatic data cleanup (90 days)
- Socket.IO connection management with room-based targeting

## Future Enhancements

- Email notifications
- SMS notifications
- Push notifications (mobile apps)
- Notification templates
- Multi-language support
- Notification scheduling
- Advanced filtering and search
- Analytics dashboard
