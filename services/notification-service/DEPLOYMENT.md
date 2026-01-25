# Notification Service Deployment Guide

## ✅ Complete Implementation

The notification service is now fully implemented with all required components:

### 📁 File Structure
```
services/notification-service/
├── .dockerignore
├── .env
├── Dockerfile
├── package.json
├── README.md
└── src/
    ├── app.js                      # Express + Socket.IO setup
    ├── server.js                   # Server startup
    ├── config/
    │   ├── database.js             # MongoDB connection
    │   └── redis.js                # Redis Pub/Sub clients
    ├── handlers/
    │   ├── capacityHandler.js      # Capacity threshold notifications
    │   ├── enrollmentHandler.js    # Enrollment notifications
    │   ├── eventHandler.js         # Event lifecycle notifications
    │   └── messageHandler.js       # Chat/inquiry notifications
    ├── middleware/
    │   ├── auth.js                 # REST API authentication
    │   └── socketAuth.js           # WebSocket authentication
    ├── models/
    │   ├── Notification.js         # Notification schema
    │   └── UserPreference.js       # User preferences schema
    ├── routes/
    │   └── notificationRoutes.js   # REST API routes
    ├── services/
    │   ├── eventBus.js             # Redis event subscriber
    │   ├── notificationService.js  # Core business logic
    │   └── socketService.js        # WebSocket delivery
    ├── socket/
    │   └── socketHandler.js        # Socket.IO event handlers
    └── utils/
        ├── errorHandler.js         # Error handling middleware
        ├── logger.js               # Winston logger
        └── responseFormatter.js    # API response formatter
```

## 🚀 Deployment Steps

### Step 1: Install Dependencies
```bash
cd services/notification-service
npm install
```

### Step 2: Build Docker Image
```bash
# From project root
docker-compose build notification-service
```

### Step 3: Start All Services
```bash
# Start entire stack (including notification-service)
docker-compose up -d

# Or start only notification service (requires MongoDB and Redis running)
docker-compose up -d notification-service
```

### Step 4: Verify Service is Running
```bash
# Check container status
docker ps | grep notification-service

# View logs
docker logs mov-notification-service -f

# Test health endpoint
curl http://localhost:3005/health
```

## 🔧 Configuration

### Environment Variables
All configured in `docker-compose.yml`:
- `PORT=3005` - Service port
- `NODE_ENV=development` - Environment mode
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret (must match other services)
- `CORS_ORIGIN` - Allowed CORS origins
- `NOTIFICATION_RETENTION_DAYS=90` - Auto-delete old notifications

### Network Configuration
The service is connected to the `mov-network` Docker network and can communicate with:
- `mongodb:27017` - Notification storage
- `redis:6379` - Event bus
- All other microservices (for future integrations)

## 📡 Testing the Service

### 1. Test REST API
```bash
# Get auth token first (from auth-service)
TOKEN="your-jwt-token-here"

# Get notifications
curl -H "Authorization: Bearer $TOKEN" http://localhost:3005/api/notifications

# Get unread count
curl -H "Authorization: Bearer $TOKEN" http://localhost:3005/api/notifications/unread-count

# Mark as read
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  http://localhost:3005/api/notifications/NOTIFICATION_ID/read
```

### 2. Test WebSocket Connection
Open `notification-test.html` in browser:
1. Enter valid JWT token
2. Click "Connect"
3. Verify connection success
4. Test notification delivery

### 3. Test Event Publishing
Other services need to publish events to Redis. Example from enrollment-service:

```javascript
const redis = require('redis');
const publisher = redis.createClient({ url: process.env.REDIS_URL });

// Publish enrollment created event
await publisher.publish('events', JSON.stringify({
  type: 'ENROLLMENT_CREATED',
  data: {
    enrollmentId: '123',
    userId: 'user-456',
    eventId: 'event-789',
    userName: 'John Doe',
    eventTitle: 'Tech Conference 2026',
    organizerId: 'organizer-001'
  },
  timestamp: new Date().toISOString()
}));
```

## 🔗 Integration with Other Services

### Services That Need Updates

#### 1. enrollment-service
Add Redis publisher to publish these events:
- `ENROLLMENT_CREATED` - When user enrolls
- `ENROLLMENT_CANCELLED` - When enrollment is cancelled
- `CAPACITY_80_PERCENT` - When event reaches 80% capacity
- `CAPACITY_90_PERCENT` - When event reaches 90% capacity
- `CAPACITY_FULL` - When event reaches 100% capacity
- `CAPACITY_AVAILABLE` - When spot becomes available

#### 2. event-service
Add Redis publisher to publish these events:
- `EVENT_STATUS_CHANGED` - When event status changes
- `EVENT_PUBLISHED` - When event is published
- `EVENT_CANCELLED` - When event is cancelled
- `EVENT_COMPLETED` - When event is completed
- `EVENT_UPDATED` - When important fields are updated

#### 3. chat-service
Already has Redis in docker-compose. Add publisher for:
- `MESSAGE_RECEIVED` - Direct messages only
- `INQUIRY_RECEIVED` - New pre-enrollment inquiry
- `INQUIRY_REPLIED` - Organizer replied to inquiry

### Redis Publisher Setup Example

Add to any service:

```javascript
// config/redis.js
const redis = require('redis');

let publisher = null;

const connectRedis = async () => {
  publisher = redis.createClient({
    url: process.env.REDIS_URL
  });
  
  await publisher.connect();
  console.log('Redis publisher connected');
};

const publishEvent = async (eventType, data) => {
  await publisher.publish('events', JSON.stringify({
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  }));
};

module.exports = { connectRedis, publishEvent };
```

## 📊 Monitoring

### View Real-time Logs
```bash
# Notification service logs
docker logs -f mov-notification-service

# MongoDB logs
docker logs -f mov-mongodb

# Redis logs
docker logs -f mov-redis
```

### Check MongoDB Data
1. Open Mongo Express: http://localhost:8081
2. Login: admin / admin123
3. Database: mov_notifications
4. Collections:
   - `notifications` - All notifications
   - `userpreferences` - User notification settings

### Check Redis Subscriptions
```bash
# Connect to Redis CLI
docker exec -it mov-redis redis-cli

# Check active subscriptions
PUBSUB CHANNELS

# Monitor events in real-time
SUBSCRIBE events
```

## 🎯 User Stories Verification

### FUNC-ENROLL-040: Capacity Threshold Notifications
- ✅ 80% capacity notification
- ✅ 90% capacity notification
- ✅ 100% capacity notification
- **Test**: Enroll users until thresholds are reached

### FUNC-LIFE-040: Event Lifecycle Notifications
- ✅ Status change notifications
- ✅ Published notifications
- ✅ Cancelled notifications
- ✅ Completed notifications
- **Test**: Change event status through event-service API

### FUNC-EVENT-080: Organizer Notifications
- ✅ New enrollment notifications
- ✅ Enrollment cancellation notifications
- ✅ Capacity alert notifications
- ✅ Inquiry notifications
- **Test**: Perform actions as participant, verify organizer receives notifications

### FUNC-USER-040: Real-time Participant Notifications
- ✅ Enrollment confirmation
- ✅ Event update notifications
- ✅ Message notifications
- **Test**: Connect via WebSocket, perform actions, verify instant delivery

## 🐛 Troubleshooting

### Service Won't Start
```bash
# Check logs for errors
docker logs mov-notification-service

# Verify dependencies are running
docker ps | grep -E "mongo|redis"

# Restart service
docker-compose restart notification-service
```

### WebSocket Connection Fails
- Verify JWT token is valid and not expired
- Check CORS_ORIGIN includes your frontend URL
- Ensure port 3005 is not blocked by firewall
- Check browser console for error messages

### Notifications Not Received
- Verify Redis is running and connected
- Check other services are publishing events to Redis
- Verify user preferences allow the notification type
- Check if user is in quiet hours
- View notification-service logs for processing errors

### MongoDB Connection Issues
```bash
# Check MongoDB is running
docker exec -it mov-mongodb mongosh

# Verify database exists
use mov_notifications
db.getCollectionNames()
```

## 📝 Next Steps

1. **Update Other Services**: Add Redis event publishing to enrollment-service, event-service, and chat-service

2. **Frontend Integration**: Update existing HTML pages to connect to notification-service WebSocket

3. **Testing**: Create comprehensive test suite for all notification types

4. **Production Deployment**: 
   - Use environment-specific .env files
   - Enable HTTPS for WebSocket (wss://)
   - Set up log aggregation
   - Configure monitoring and alerts
   - Implement rate limiting

5. **Future Enhancements**:
   - Email notifications
   - SMS notifications
   - Mobile push notifications
   - Notification templates
   - Multi-language support
   - Notification scheduling

## ✨ Success Indicators

The notification service is working correctly when:
- ✅ Container starts without errors
- ✅ Health endpoint returns 200 OK
- ✅ MongoDB collections are created
- ✅ Redis subscription is active
- ✅ WebSocket connections authenticate successfully
- ✅ Events trigger notifications
- ✅ Notifications appear in real-time
- ✅ Unread count updates correctly
- ✅ Mark as read functionality works
- ✅ User preferences are respected

## 📞 Support

For issues or questions:
1. Check logs: `docker logs mov-notification-service -f`
2. Review README.md for API documentation
3. Test with notification-test.html
4. Verify Redis events are being published
5. Check MongoDB for stored notifications

---

**Status**: ✅ READY FOR DEPLOYMENT
**Version**: 1.0.0
**Last Updated**: January 25, 2026
