# Quick Test Guide - Notification Service

## Quick Start

### 1. Verify All Services Running
```bash
docker compose ps
```
All services should show "Up" status.

### 2. Get JWT Tokens

**Organizer Login:**
```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "organizer@test.com",
  "password": "password123"
}
```

**Participant Login:**
```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "participant@test.com",
  "password": "password123"
}
```

### 3. Open Notification Test Page
1. Open `notification-test.html` in browser
2. Enter organizer JWT token
3. Click "Connect"
4. Status should show "Connected"

### 4. Test Enrollment Notification

**Step 1: Create Event (Organizer)**
```bash
POST http://localhost:3000/api/v1/events
Authorization: Bearer <organizer-jwt>
Content-Type: application/json

{
  "title": "Test Event for Notifications",
  "description": "Testing notification system",
  "startDate": "2026-02-15",
  "endDate": "2026-02-15",
  "startTime": "10:00",
  "endTime": "12:00",
  "location": "Test Location",
  "category": "Workshop",
  "maxParticipants": 10
}
```
**Expected Response:** Event created with `id` in response

**Step 2: Publish Event (Organizer)**
```bash
PATCH http://localhost:3000/api/v1/events/{eventId}/status
Authorization: Bearer <organizer-jwt>
Content-Type: application/json

{
  "status": "Published"
}
```
**Expected:** Organizer receives notification "Your event [Title] has been published"

**Step 3: Enroll Participant**
```bash
POST http://localhost:3000/api/v1/enrollments
Authorization: Bearer <participant-jwt>
Content-Type: application/json

{
  "eventId": "{eventId}"
}
```
**Expected:** 
- Organizer receives notification: "New enrollment: [Name] enrolled in [Title]"
- Participant receives notification: "You have successfully enrolled in [Title]"

### 5. Verify Notifications

**In notification-test.html:**
- Check notification list for new entries
- Check unread count increased
- Click "Mark as Read" to mark notifications read

**Via REST API:**
```bash
GET http://localhost:3000/api/v1/notifications
Authorization: Bearer <organizer-jwt>
```
Should return list of notifications

---

## Expected Event Flow

### When Participant Enrolls:

1. **enrollment-service logs:**
   ```
   info: User {userId} enrolled in event {eventId}
   info: Event published to Redis: ENROLLMENT_CREATED
   ```

2. **notification-service logs:**
   ```
   info: Event received from Redis: ENROLLMENT_CREATED
   info: Processing ENROLLMENT_CREATED event
   info: Notification created: {...}
   info: Notification sent to user {organizerId}
   info: Notification sent to user {userId}
   ```

3. **Browser (notification-test.html):**
   - Toast notification appears
   - Notification added to list
   - Unread count increases

---

## Check Logs

### All Service Logs
```bash
docker compose logs --follow
```

### Specific Service
```bash
# Notification Service
docker compose logs notification-service --follow

# Enrollment Service
docker compose logs enrollment-service --follow

# Event Service
docker compose logs event-service --follow
```

### Check Redis Connection
```bash
docker compose logs enrollment-service | grep Redis
docker compose logs event-service | grep Redis
docker compose logs notification-service | grep Redis
```

Should see:
- "Redis client connected"
- "Redis client ready"
- "Redis initialized successfully"

---

## Troubleshooting

### No Notifications Received

1. **Check WebSocket Connection:**
   - notification-test.html should show "Connected"
   - Check browser console for errors

2. **Check Redis:**
   ```bash
   docker compose ps redis
   ```
   Should show "healthy" status

3. **Check Notification Service:**
   ```bash
   docker compose logs notification-service --tail=50
   ```
   Look for "subscribed to events channel"

4. **Check Enrollment Service:**
   ```bash
   docker compose logs enrollment-service --tail=50
   ```
   Look for "Event published to Redis: ENROLLMENT_CREATED"

### WebSocket Not Connecting

1. **Verify JWT Token:**
   - Token should not be expired
   - Token should be valid (test with GET /api/v1/notifications)

2. **Check CORS:**
   - notification-service should allow origin from notification-test.html
   - Check browser console for CORS errors

3. **Check Port:**
   - Notification service should be on port 3005
   - Check: http://localhost:3005/health

---

## Test Coverage

### Enrollment Notifications ✅
- [x] ENROLLMENT_CREATED - When user enrolls
- [x] ENROLLMENT_CANCELLED - When user cancels enrollment
- [x] CAPACITY_80_PERCENT - 80% capacity reached
- [x] CAPACITY_90_PERCENT - 90% capacity reached
- [x] CAPACITY_FULL - 100% capacity reached
- [x] CAPACITY_AVAILABLE - Space available again

### Event Notifications ✅
- [x] EVENT_STATUS_CHANGED - Status changes
- [x] EVENT_PUBLISHED - Event published
- [x] EVENT_CANCELLED - Event cancelled
- [x] EVENT_COMPLETED - Event completed
- [x] EVENT_UPDATED - Event details updated

### Chat Notifications ⏳
- [ ] MESSAGE_RECEIVED - Not yet implemented
- [ ] INQUIRY_RECEIVED - Not yet implemented
- [ ] INQUIRY_REPLIED - Not yet implemented

---

## Success Indicators

✅ All Docker containers running  
✅ Redis showing "healthy" status  
✅ enrollment-service: "Redis initialized successfully"  
✅ event-service: "Redis initialized successfully"  
✅ notification-service: "subscribed to events channel"  
✅ WebSocket connection successful in notification-test.html  
✅ Organizer receives notification when participant enrolls  
✅ Participant receives confirmation when enrolls  
✅ Notifications persisted in MongoDB  
✅ Real-time delivery via Socket.IO working  

---

**If all indicators are ✅, the notification system is working correctly!**
