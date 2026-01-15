# Event Visibility Rules

## Overview

This document describes the event visibility and access control rules implemented in the MOV Event Management System. The system enforces different visibility rules based on user authentication status, role, and enrollment status.

## Visibility Matrix

| Event State | Unauthenticated Users | Participants | Organizers |
|-------------|----------------------|--------------|------------|
| **Planning** | ❌ Hidden | ❌ Hidden | ✅ Own events only |
| **Published** | ✅ Visible | ✅ Visible | ✅ Visible (all) |
| **Running** | ✅ Visible | ✅ Visible | ✅ Visible (all) |
| **Completed** | ❌ Hidden | ✅ Enrolled only | ✅ Own events only* |
| **Canceled** | ❌ Hidden | ✅ Enrolled only | ✅ Own events only* |

\* *Organizers cannot enroll in events, so they only see their own Completed/Canceled events*

## Implementation Details

### Service Architecture

The visibility filtering is implemented using the **service-layer authorization pattern**, consistent with the enrollment-service architecture:

1. **API Gateway** (`optionalAuth` middleware):
   - Extracts JWT token if present
   - Forwards user context via headers (`X-User-Id`, `X-User-Email`, `X-User-Role`)
   - Does NOT require authentication for public discovery

2. **Event Service** (`extractUserFromHeaders` middleware):
   - Extracts user info from headers
   - Sets `req.user` object if authenticated
   - Allows `req.user` to be `null` for unauthenticated requests

3. **Event Controller** (`getAllEvents`):
   - Passes user context (`userId`, `userRole`) to service layer
   - Handles both authenticated and unauthenticated requests

4. **Event Service** (`getAllEvents` method):
   - Implements visibility filtering logic
   - Makes inter-service call to enrollment-service to fetch user's enrolled events
   - Uses Sequelize `Op.in`, `Op.or`, `Op.and` for complex queries

### Inter-Service Communication

The event-service communicates with the enrollment-service to determine which Completed/Canceled events the user is enrolled in:

```javascript
// GET /me endpoint in enrollment-service
// Returns list of active enrollments for the user
const response = await axios.get(`${ENROLLMENT_SERVICE_URL}/me`, {
  headers: {
    'x-user-id': userId,
  },
});
```

**Important**: The service gracefully handles enrollment-service unavailability by returning an empty array of enrolled events, ensuring the system doesn't fail if the enrollment service is down.

## Visibility Rules Explained

### 1. Unauthenticated Users (Public Discovery)

**Can see:**
- Published events
- Running events

**Cannot see:**
- Planning events (not ready for public)
- Completed events (historical data)
- Canceled events (no longer relevant)

**Use case**: Public browsing, event discovery without account

### 2. Participants

**Can see:**
- Published events (all)
- Running events (all)
- Completed events (only enrolled) - For event history, certificates, feedback
- Canceled events (only enrolled) - For transparency, refund eligibility

**Cannot see:**
- Planning events from organizers
- Completed/Canceled events they didn't enroll in

**Use case**: Browse upcoming events, view personal event history

### 3. Organizers

**Can see:**
- All their own events (all states) - For event management
- Published events from others (discover other events)
- Running events from others (discover other events)

**Cannot see:**
- Planning events from other organizers (privacy)
- Completed/Canceled events from other organizers

**Important**: Organizers cannot enroll in events (business rule), so they only have access to their own historical (Completed/Canceled) events.

**Use case**: Manage own events, browse other events, view own event history

## Query Parameters

The visibility filtering works alongside existing query parameters:

- `status`: Filter by event state (e.g., `?status=Published`)
- `category`: Filter by event category (e.g., `?category=Workshop`)
- `organizerId`: Filter by organizer (e.g., `?organizerId=123`)

**Note**: When using `status` or `organizerId` filters, visibility rules still apply. For example, a participant cannot see Planning events even if they explicitly filter by `?status=Planning`.

## Security Considerations

### 1. Planning Event Protection
Planning events are **never exposed** to participants or unauthenticated users, ensuring organizers can prepare events privately before publication.

### 2. Completed Event Privacy
Completed events are only visible to:
- Users who enrolled in them (participants or organizers)
- The organizer who created them

This prevents unauthorized access to historical event data and participant information.

### 3. Canceled Event Transparency
Canceled events remain visible to enrolled users for:
- Refund processing
- Transparency about event cancellation
- Audit trail

### 4. Public Discovery
Unauthenticated users can browse Published and Running events for:
- Public event discovery
- Marketing and outreach
- User acquisition (see events before signing up)

## API Endpoints

### GET /api/v1/events

**Authentication**: Optional (public endpoint with personalized results)

**Headers** (optional):
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `status` (optional): Filter by event state
- `category` (optional): Filter by category
- `organizerId` (optional): Filter by organizer

**Response**: List of events based on visibility rules

**Example Requests**:

```bash
# Unauthenticated - see only Published/Running events
curl http://localhost:3000/api/v1/events

# Authenticated participant - see Published/Running + enrolled Completed/Canceled
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/v1/events

# Authenticated organizer - see own events + Published/Running from others
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/v1/events

# Filter by status (visibility rules still apply)
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/v1/events?status=Published

# Get organizer's events
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/v1/events?organizerId=123
```

## Database Query Examples

### Participant Query (with enrollments)

```sql
-- Get events for participant (userId=5)
-- Enrolled in events [10, 15, 20]
SELECT * FROM events
WHERE (
  -- Published and Running events (all)
  status IN ('Published', 'Running')
)
OR (
  -- Completed and Canceled events (only enrolled)
  status IN ('Completed', 'Canceled')
  AND id IN (10, 15, 20)
)
ORDER BY date ASC;
```

### Organizer Query

```sql
-- Get events for organizer (userId=3, organizerId=3)
-- Note: Organizers cannot enroll in events
SELECT * FROM events
WHERE (
  -- All own events (all states)
  organizerId = 3
)
OR (
  -- Published and Running from others
  status IN ('Published', 'Running')
)
ORDER BY date ASC;
```

## Testing Visibility Rules

### Test Scenarios

1. **Unauthenticated User**
   - Should see only Published and Running events
   - No Planning, Completed, or Canceled events

2. **Participant (not enrolled)**
   - Should see Published and Running events
   - Should NOT see any Completed or Canceled events

3. **Participant (enrolled in event #10)**
   - Should see Published and Running events
   - Should see event #10 if Completed or Canceled
   - Should NOT see other Completed/Canceled events

4. **Organizer (organizerId=5)**
   - Should see all events with organizerId=5 (all states)
   - Should see Published and Running from other organizers
   - Should NOT see Planning events from other organizers
   - Should NOT see Completed/Canceled events from other organizers
   - **Note**: Organizers cannot enroll in events

### Manual Testing

```bash
# 1. Test unauthenticated access
curl http://localhost:3000/api/v1/events

# 2. Register as participant
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "participant@test.com",
    "password": "test123",
    "firstName": "Test",
    "lastName": "Participant",
    "role": "Participant"
  }'

# 3. Login and get token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "participant@test.com",
    "password": "test123"
  }'

# 4. Test participant visibility
curl -H "Authorization: Bearer <participant_token>" \
     http://localhost:3000/api/v1/events

# 5. Enroll in an event
curl -X POST http://localhost:3000/api/v1/enrollments \
  -H "Authorization: Bearer <participant_token>" \
  -H "Content-Type: application/json" \
  -d '{"eventId": 1}'

# 6. Change event to Completed (as organizer)
curl -X PATCH http://localhost:3000/api/v1/events/1/status \
  -H "Authorization: Bearer <organizer_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "Completed"}'

# 7. Verify participant can still see enrolled Completed event
curl -H "Authorization: Bearer <participant_token>" \
     http://localhost:3000/api/v1/events
```

## Configuration

### Environment Variables

**Event Service** (`.env`):
```env
ENROLLMENT_SERVICE_URL=http://localhost:3003
```

**Docker Compose**:
```yaml
event-service:
  environment:
    ENROLLMENT_SERVICE_URL: http://enrollment-service:3003
```

## Error Handling

### Enrollment Service Unavailable

If the enrollment-service is unavailable, the event-service:
1. Logs the error
2. Returns an empty array of enrolled events
3. User sees only Published/Running events (safe fallback)
4. System remains operational

```javascript
try {
  const enrolledEventIds = await this.getUserEnrolledEventIds(userId);
} catch (error) {
  logger.error(`Error fetching user enrollments: ${error.message}`);
  // Return empty array - user won't see Completed/Canceled events
  return [];
}
```

## Future Enhancements

### Potential Improvements

1. **Caching Enrolled Events**
   - Cache user's enrolled event IDs in Redis
   - Reduce inter-service calls
   - Invalidate cache on enrollment/unenrollment

2. **Batch Enrollment Queries**
   - Fetch enrollments for multiple users in one call
   - Optimize for list views with multiple organizers

3. **Event Discovery Feed**
   - Personalized event recommendations
   - "Events near you" based on location
   - "Events matching your interests" based on past enrollments

4. **Visibility Indicator in Response**
   - Add `visibilityReason` field to response
   - Help clients understand why event is visible
   - Values: `public`, `enrolled`, `organizer`

## Related Documentation

- [Authorization Pattern](./AUTHORIZATION_PATTERN.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [API Documentation](http://localhost:3000/api-docs)
- [Event States and Transitions](../services/event-service/src/constants/eventStates.js)

## Changelog

- **2026-01-13**: Initial implementation of event visibility rules
  - Added optional authentication for GET /events
  - Implemented service-layer visibility filtering
  - Added inter-service communication with enrollment-service
  - Support for public discovery (unauthenticated users)
  - Enrolled-only access to Completed/Canceled events
