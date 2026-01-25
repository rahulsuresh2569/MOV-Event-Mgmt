# Notification Service - Quick Test Guide

## 🚀 Start the Service

```bash
# From project root
docker-compose up -d notification-service

# View logs
docker logs -f mov-notification-service
```

## ✅ Verify Service Health

```bash
curl http://localhost:3005/health
# Expected: {"success":true,"message":"Notification service is running"}
```

## 🔐 Get JWT Token

```bash
# Login via auth-service to get token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}'

# Copy the token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📡 Test REST API

### 1. Get Notifications
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3005/api/notifications?page=1&limit=20
```

### 2. Get Unread Count
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3005/api/notifications/unread-count
```

### 3. Mark Notification as Read
```bash
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  http://localhost:3005/api/notifications/NOTIFICATION_ID/read
```

### 4. Mark All as Read
```bash
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  http://localhost:3005/api/notifications/read-all
```

### 5. Get User Preferences
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3005/api/notifications/preferences
```

### 6. Update Preferences
```bash
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"push":true,"enrollments":true,"quietHours":{"enabled":false}}' \
  http://localhost:3005/api/notifications/preferences
```

## 🌐 Test WebSocket

### Using notification-test.html
1. Open file in browser
2. Enter JWT token: `$TOKEN`
3. Click "Connect"
4. Verify connection success
5. Use simulation buttons to test

### Using JavaScript Console
```javascript
// Connect to notification service
const socket = io('http://localhost:3005', {
  auth: { token: 'YOUR_JWT_TOKEN_HERE' }
});

// Listen for connection
socket.on('connect', () => {
  console.log('✅ Connected!', socket.id);
});

// Listen for initial notifications
socket.on('initial-notifications', (data) => {
  console.log('📬 Initial notifications:', data);
});

// Listen for new notifications
socket.on('notification', (notification) => {
  console.log('🔔 New notification:', notification);
});

// Listen for unread count
socket.on('unread-count', (data) => {
  console.log('🔢 Unread count:', data.count);
});

// Get notifications
socket.emit('get-notifications', { page: 1, limit: 10 }, (response) => {
  console.log('Response:', response);
});

// Mark as read
socket.emit('mark-read', { notificationId: 'NOTIFICATION_ID' }, (response) => {
  console.log('Mark read:', response);
});

// Mark all as read
socket.emit('mark-all-read', (response) => {
  console.log('Mark all read:', response);
});
```

## 🧪 Test Event Publishing

### Simulate Event from Redis CLI

```bash
# Connect to Redis
docker exec -it mov-redis redis-cli

# Publish enrollment created event
PUBLISH events '{"type":"ENROLLMENT_CREATED","data":{"enrollmentId":"test-123","userId":"USER_ID","eventId":"event-456","userName":"Test User","eventTitle":"Test Event","organizerId":"ORG_ID"},"timestamp":"2026-01-25T12:00:00Z"}'

# Publish capacity alert
PUBLISH events '{"type":"CAPACITY_80_PERCENT","data":{"eventId":"event-456","eventTitle":"Test Event","organizerId":"ORG_ID","currentCapacity":80,"maxCapacity":100,"percentFull":80},"timestamp":"2026-01-25T12:00:00Z"}'

# Publish event cancelled
PUBLISH events '{"type":"EVENT_CANCELLED","data":{"eventId":"event-456","eventTitle":"Test Event","reason":"Weather conditions","enrolledUserIds":["USER_ID_1","USER_ID_2"]},"timestamp":"2026-01-25T12:00:00Z"}'
```

### Using Node.js Script

```javascript
// test-publisher.js
const redis = require('redis');

async function testPublish() {
  const publisher = redis.createClient({
    url: 'redis://localhost:6379'
  });
  
  await publisher.connect();
  
  // Publish test event
  await publisher.publish('events', JSON.stringify({
    type: 'ENROLLMENT_CREATED',
    data: {
      enrollmentId: 'test-' + Date.now(),
      userId: 'YOUR_USER_ID',
      eventId: 'event-123',
      userName: 'Test User',
      eventTitle: 'Amazing Conference',
      organizerId: 'organizer-456'
    },
    timestamp: new Date().toISOString()
  }));
  
  console.log('✅ Event published');
  await publisher.quit();
}

testPublish();
```

## 🔍 Monitor & Debug

### View Notification Service Logs
```bash
docker logs -f mov-notification-service
```

### Check MongoDB Data
```bash
# Via Mongo Express
http://localhost:8081
# Login: admin / admin123
# Database: mov_notifications
# Collections: notifications, userpreferences
```

### Monitor Redis Events
```bash
docker exec -it mov-redis redis-cli

# Subscribe to events channel
SUBSCRIBE events

# In another terminal, publish test events
```

### Check Connected Users
```bash
# View logs for connection events
docker logs mov-notification-service | grep "User connected"
```

## 📊 Test Scenarios

### Scenario 1: Enrollment Flow
1. User enrolls in event → `ENROLLMENT_CREATED` notification
2. Organizer sees new enrollment notification
3. Event reaches 80% → Organizer gets `CAPACITY_80_PERCENT`
4. Event reaches 90% → Organizer gets `CAPACITY_90_PERCENT`
5. Event full → Organizer gets `CAPACITY_FULL`
6. User cancels → Both get `ENROLLMENT_CANCELLED`
7. Spot available → Organizer gets `CAPACITY_AVAILABLE`

### Scenario 2: Event Lifecycle
1. Organizer publishes event → `EVENT_PUBLISHED`
2. Organizer updates event → Enrolled users get `EVENT_UPDATED`
3. Event status changes → All get `EVENT_STATUS_CHANGED`
4. Event cancelled → All get `EVENT_CANCELLED` (critical)
5. Event completes → All get `EVENT_COMPLETED`

### Scenario 3: Communication
1. User sends inquiry → Organizer gets `INQUIRY_RECEIVED`
2. Organizer replies → User gets `INQUIRY_REPLIED`
3. Direct message sent → Recipient gets `MESSAGE_RECEIVED`

### Scenario 4: Preferences
1. User enables quiet hours (22:00-08:00)
2. During quiet hours, non-critical notifications are suppressed
3. Critical notifications (EVENT_CANCELLED) still delivered
4. User disables enrollment notifications
5. Enrollment notifications not sent to that user

## ✅ Expected Behaviors

### On WebSocket Connect
- Authentication succeeds
- User joins personal room
- Receives initial notifications
- Receives current unread count

### On New Notification
- Event published to Redis
- Event bus receives and routes to handler
- Handler creates notification
- User preferences checked
- Notification saved to MongoDB
- Real-time push via WebSocket
- Unread count updated

### On Mark as Read
- Notification read status updated
- readAt timestamp set
- Unread count recalculated
- Updated count sent to client

## 🐛 Common Issues

### "Authentication failed"
- Check JWT token is valid
- Verify JWT_SECRET matches auth-service
- Ensure token not expired

### "No notifications received"
- Check Redis is running
- Verify events being published to 'events' channel
- Check user preferences
- Verify user ID matches

### "WebSocket disconnects"
- Check network connectivity
- Verify port 3005 accessible
- Check CORS configuration
- Review logs for errors

## 📈 Success Metrics

✅ Service starts without errors
✅ Health check returns 200
✅ WebSocket authentication works
✅ Events trigger notifications
✅ Notifications saved to MongoDB
✅ Real-time delivery working
✅ Unread count accurate
✅ Mark as read functional
✅ Preferences respected
✅ Quiet hours working

---

**Quick Status Check**
```bash
# All in one command
echo "=== Notification Service Status ===" && \
curl -s http://localhost:3005/health | jq && \
docker ps | grep notification && \
docker exec mov-redis redis-cli PUBSUB CHANNELS
```

---

*Keep this guide handy for quick testing and debugging!*
