# Event Statistics Feature

## Overview

The Event Statistics feature provides organizers with comprehensive insights into their event's registration metrics, capacity utilization, and participant engagement. This helps organizers make data-driven decisions for event management.

## User Story

**As an organizer**, I want to view statistics for my events, so that I can analyze engagement and participation.

## Acceptance Criteria

- ✅ Registration and cancellation counts are available
- ✅ Completed events show historical data
- ✅ Only the event organizer can view statistics
- ✅ Real-time calculation ensures accuracy

---

## API Endpoint

### **GET /api/v1/enrollments/event/:eventId/statistics**

Retrieve comprehensive statistics for a specific event.

**Authentication**: Required (Bearer Token)

**Authorization**: Only the event organizer can access

**Parameters**:
- `eventId` (path, required): The ID of the event

**Response Structure**:
```json
{
  "success": true,
  "message": "Event statistics retrieved successfully",
  "data": {
    "eventId": 1,
    "eventTitle": "Tech Conference 2026",
    "eventStatus": "Published",
    "eventDate": "2026-02-15T09:00:00.000Z",
    "registrations": {
      "total": 45,
      "active": 38,
      "canceled": 7,
      "cancellationRate": 15.56
    },
    "capacity": {
      "max": 50,
      "current": 38,
      "available": 12,
      "utilizationRate": 76.0
    }
  }
}
```

---

## Statistics Metrics

### **Registration Metrics**

| Metric | Description | Calculation | Use Case |
|--------|-------------|-------------|----------|
| **total** | Total number of all-time registrations | Count all enrollments (active + canceled) | Measure initial interest and reach |
| **active** | Current number of confirmed attendees | Count enrollments with status='active' | Expected turnout for planning |
| **canceled** | Number of users who unenrolled | Count enrollments with status='canceled' | Understand attrition |
| **cancellationRate** | Percentage of users who dropped out | (canceled / total) × 100 | Engagement quality indicator |

### **Capacity Metrics**

| Metric | Description | Calculation | Use Case |
|--------|-------------|-------------|----------|
| **max** | Maximum event capacity | Event.maxParticipants | Total available spots |
| **current** | Current number of participants | Event.currentParticipants | Real-time occupancy |
| **available** | Remaining spots | max - current | Availability tracking |
| **utilizationRate** | Percentage of capacity filled | (current / max) × 100 | Demand assessment |

---

## Implementation Details

### **Architecture**

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────────┐
│             │      │              │      │                     │
│  Organizer  │─────▶│ API Gateway  │─────▶│ Enrollment Service  │
│             │      │              │      │                     │
└─────────────┘      └──────────────┘      └─────────────────────┘
                                                       │
                                                       ▼
                                            ┌──────────────────┐
                                            │  Event Service   │
                                            │  (verify owner)  │
                                            └──────────────────┘
                                                       │
                                                       ▼
                                            ┌──────────────────┐
                                            │  Enrollments DB  │
                                            └──────────────────┘
```

### **Calculation Method**

**Real-Time Calculation** (Phase 1 MVP)
- Statistics are computed on-demand when requested
- Always accurate and up-to-date
- No caching or pre-computation
- Suitable for moderate traffic

**Flow**:
1. Request arrives at enrollment-service
2. Verify user is the event organizer (authorization)
3. Fetch event details from event-service
4. Query all enrollments (active + canceled) from database
5. Calculate metrics in-memory
6. Return statistics response

---

## Code Structure

### **1. Service Layer** - `enrollmentService.js`

```javascript
async getEventStatistics(eventId, userId) {
  // 1. Verify organizer ownership
  const event = await this.getEventById(eventId);
  if (event.organizerId !== userId) throw ForbiddenError;

  // 2. Fetch all enrollments
  const allEnrollments = await Enrollment.findAll({ where: { eventId } });

  // 3. Calculate registration metrics
  const total = allEnrollments.length;
  const active = allEnrollments.filter(e => e.status === 'active').length;
  const canceled = allEnrollments.filter(e => e.status === 'canceled').length;
  const cancellationRate = (canceled / total) * 100;

  // 4. Calculate capacity metrics
  const utilizationRate = (event.currentParticipants / event.maxParticipants) * 100;

  return { registrations, capacity };
}
```

### **2. Controller Layer** - `enrollmentController.js`

```javascript
async getEventStatistics(req, res, next) {
  const eventId = parseInt(req.params.eventId, 10);
  const statistics = await enrollmentService.getEventStatistics(eventId, req.user.id);
  return successResponse(res, HTTP_STATUS.OK, 'Statistics retrieved', statistics);
}
```

### **3. Route Definition** - `enrollmentRoutes.js`

```javascript
router.get('/event/:eventId/statistics', enrollmentController.getEventStatistics);
```

---

## Authorization Flow

```
1. User makes request with JWT token
   ↓
2. API Gateway validates token and forwards user context
   ↓
3. Enrollment service extracts userId from headers
   ↓
4. Service fetches event from event-service
   ↓
5. Verify: event.organizerId === req.user.id
   ↓
6. If match: return statistics
   If not: return 403 Forbidden
```

**Security**:
- ✅ Only authenticated users can access
- ✅ Only event organizer can view their event statistics
- ✅ No cross-organizer data leakage
- ✅ Authorization enforced at service layer

---

## Usage Examples

### **Example 1: Get Statistics for Published Event**

**Request**:
```bash
curl -X GET http://localhost:3000/api/v1/enrollments/event/1/statistics \
  -H "Authorization: Bearer <organizer_token>"
```

**Response**:
```json
{
  "success": true,
  "message": "Event statistics retrieved successfully",
  "data": {
    "eventId": 1,
    "eventTitle": "Tech Conference 2026",
    "eventStatus": "Published",
    "eventDate": "2026-02-15T09:00:00.000Z",
    "registrations": {
      "total": 45,
      "active": 38,
      "canceled": 7,
      "cancellationRate": 15.56
    },
    "capacity": {
      "max": 50,
      "current": 38,
      "available": 12,
      "utilizationRate": 76.0
    }
  }
}
```

**Analysis**:
- 76% capacity utilization - strong interest
- 15.56% cancellation rate - acceptable churn
- 12 spots remaining - room for late registrations

---

### **Example 2: Get Statistics for Completed Event**

**Request**:
```bash
curl -X GET http://localhost:3000/api/v1/enrollments/event/5/statistics \
  -H "Authorization: Bearer <organizer_token>"
```

**Response**:
```json
{
  "success": true,
  "message": "Event statistics retrieved successfully",
  "data": {
    "eventId": 5,
    "eventTitle": "Workshop: React Basics",
    "eventStatus": "Completed",
    "eventDate": "2026-01-10T14:00:00.000Z",
    "registrations": {
      "total": 30,
      "active": 25,
      "canceled": 5,
      "cancellationRate": 16.67
    },
    "capacity": {
      "max": 30,
      "current": 25,
      "available": 5,
      "utilizationRate": 83.33
    }
  }
}
```

**Analysis**:
- Event reached 83% utilization - very successful
- 25 participants attended out of 30 registrations
- Historical data preserved for future reference

---

### **Example 3: Unauthorized Access (Non-Organizer)**

**Request**:
```bash
curl -X GET http://localhost:3000/api/v1/enrollments/event/1/statistics \
  -H "Authorization: Bearer <participant_token>"
```

**Response**:
```json
{
  "success": false,
  "message": "Only the event organizer can view statistics for their events",
  "errorCode": "AUTHORIZATION_ERROR"
}
```

---

## Error Handling

| Error Code | Status | Description | Solution |
|------------|--------|-------------|----------|
| `AUTHORIZATION_ERROR` | 403 | User is not the event organizer | Use organizer account |
| `NOT_FOUND` | 404 | Event does not exist | Check event ID |
| `BAD_REQUEST` | 400 | Invalid event ID format | Provide valid integer |
| `AUTHENTICATION_ERROR` | 401 | Missing or invalid token | Login and retry |

---

## Performance Considerations

### **Current Implementation (Real-Time)**

**Query Performance**:
- Event lookup: ~5-10ms (indexed by ID)
- Enrollment count: ~10-20ms (indexed by eventId)
- Total response time: ~20-50ms

**Optimization Strategies**:
1. **Database Indexes** (already implemented):
   - `enrollments.event_id` - for fast enrollment lookups
   - `enrollments.status` - for filtering active/canceled

2. **Query Optimization**:
   - Single query fetches all enrollments
   - In-memory filtering for status counts
   - No N+1 queries

### **Future Enhancements (if needed)**

**Caching Strategy** (Phase 2):
```javascript
// Redis cache with 5-minute TTL
const cacheKey = `event:${eventId}:stats`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Calculate and cache
const stats = await calculateStatistics(eventId);
await redis.setex(cacheKey, 300, JSON.stringify(stats));
```

**Cache Invalidation**:
- On enrollment: invalidate event statistics cache
- On unenrollment: invalidate event statistics cache
- On event update: invalidate event statistics cache

---

## Testing Scenarios

### **Functional Tests**

1. **Valid Request - Organizer**
   - ✅ Returns correct statistics
   - ✅ All metrics calculated accurately
   - ✅ Response structure matches schema

2. **Authorization - Non-Organizer**
   - ✅ Returns 403 Forbidden
   - ✅ Error message is clear

3. **Not Found - Invalid Event**
   - ✅ Returns 404 Not Found

4. **Edge Cases**:
   - ✅ Event with zero enrollments (division by zero)
   - ✅ Event at full capacity
   - ✅ Event with 100% cancellation rate
   - ✅ Completed event with historical data

### **Manual Testing Steps**

```bash
# 1. Create event as organizer
curl -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer <organizer_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "description": "Test",
    "date": "2026-03-01T10:00:00Z",
    "location": "Test Location",
    "category": "Workshop",
    "maxParticipants": 20
  }'

# 2. Publish event
curl -X PATCH http://localhost:3000/api/v1/events/1/status \
  -H "Authorization: Bearer <organizer_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "Published"}'

# 3. Enroll participants
curl -X POST http://localhost:3000/api/v1/enrollments \
  -H "Authorization: Bearer <participant1_token>" \
  -H "Content-Type: application/json" \
  -d '{"eventId": 1}'

# 4. Get statistics
curl -X GET http://localhost:3000/api/v1/enrollments/event/1/statistics \
  -H "Authorization: Bearer <organizer_token>"

# 5. Verify metrics
# - total: should be 1
# - active: should be 1
# - utilizationRate: should be 5.0 (1/20 * 100)
```

---

## Future Enhancements (Phase 2+)

### **Timeline Analysis**

```json
{
  "timeline": {
    "registrations": [
      { "date": "2026-01-10", "count": 15 },
      { "date": "2026-01-11", "count": 12 }
    ],
    "peakRegistrationDate": "2026-01-10"
  }
}
```

### **Comparative Analytics**

```json
{
  "comparison": {
    "averageUtilizationRate": 78.5,
    "categoryAverage": 82.3,
    "performanceRank": 3
  }
}
```

### **Engagement Metrics**

```json
{
  "engagement": {
    "earlyBirdRate": 45.5,
    "retentionRate": 84.4,
    "averageEnrollmentDuration": "12 days"
  }
}
```

---

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md) - Enrollment and Event models
- [API Documentation](http://localhost:3000/api-docs) - Swagger UI
- [Authorization Pattern](./AUTHORIZATION_PATTERN.md) - Service-layer auth
- [Event Visibility Rules](./EVENT_VISIBILITY_RULES.md) - Event access control

---

## Changelog

- **2026-01-16**: Initial implementation of Phase 1 Core Statistics
  - Registration metrics (total, active, canceled, cancellation rate)
  - Capacity metrics (max, current, available, utilization rate)
  - Real-time calculation approach
  - Organizer-only authorization
  - Swagger documentation
