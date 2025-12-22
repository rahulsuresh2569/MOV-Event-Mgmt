# API Documentation

Base URL: `http://localhost:3000/api/v1`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Auth Service Endpoints

### 1. Register User

**Endpoint:** `POST /auth/register`

**Description:** Register a new user with a role (ORGANIZER or PARTICIPANT)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "ORGANIZER",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "ORGANIZER",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

---

### 2. Login User

**Endpoint:** `POST /auth/login`

**Description:** Login and receive JWT token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "ORGANIZER",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

---

### 3. Get Current User Profile

**Endpoint:** `GET /auth/me`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "ORGANIZER",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true
    }
  }
}
```

---

### 4. Verify Token

**Endpoint:** `GET /auth/verify`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "ORGANIZER"
    }
  }
}
```

---

## Event Service Endpoints

### 1. Create Event

**Endpoint:** `POST /events`

**Authentication:** Required (ORGANIZER only)

**Request Body:**
```json
{
  "title": "Node.js Workshop",
  "description": "Learn Node.js from scratch",
  "date": "2025-02-15T14:00:00Z",
  "location": "TH Bingen Campus",
  "maxParticipants": 50,
  "category": "workshop"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "event": {
      "id": 1,
      "organizerId": 1,
      "title": "Node.js Workshop",
      "description": "Learn Node.js from scratch",
      "date": "2025-02-15T14:00:00.000Z",
      "location": "TH Bingen Campus",
      "maxParticipants": 50,
      "currentParticipants": 0,
      "category": "workshop",
      "status": "Planning",
      "createdAt": "2025-12-22T10:00:00.000Z",
      "updatedAt": "2025-12-22T10:00:00.000Z"
    }
  }
}
```

---

### 2. Get All Events

**Endpoint:** `GET /events`

**Query Parameters:**
- `status` (optional): Filter by status (Planning, Published, Running, Completed, Canceled)
- `category` (optional): Filter by category

**Example:** `GET /events?status=Published&category=workshop`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "events": [
      {
        "id": 1,
        "organizerId": 1,
        "title": "Node.js Workshop",
        "description": "Learn Node.js from scratch",
        "date": "2025-02-15T14:00:00.000Z",
        "location": "TH Bingen Campus",
        "maxParticipants": 50,
        "currentParticipants": 15,
        "category": "workshop",
        "status": "Published",
        "createdAt": "2025-12-22T10:00:00.000Z",
        "updatedAt": "2025-12-22T10:00:00.000Z"
      }
    ]
  }
}
```

---

### 3. Get Event by ID

**Endpoint:** `GET /events/:id`

**Example:** `GET /events/1`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Event retrieved successfully",
  "data": {
    "event": {
      "id": 1,
      "organizerId": 1,
      "title": "Node.js Workshop",
      "description": "Learn Node.js from scratch",
      "date": "2025-02-15T14:00:00.000Z",
      "location": "TH Bingen Campus",
      "maxParticipants": 50,
      "currentParticipants": 15,
      "category": "workshop",
      "status": "Published",
      "createdAt": "2025-12-22T10:00:00.000Z",
      "updatedAt": "2025-12-22T10:00:00.000Z"
    }
  }
}
```

---

### 4. Update Event

**Endpoint:** `PUT /events/:id`

**Authentication:** Required (ORGANIZER only - must be event creator)

**Request Body:** (all fields optional)
```json
{
  "title": "Advanced Node.js Workshop",
  "description": "Updated description",
  "maxParticipants": 60
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "event": { ... }
  }
}
```

---

### 5. Delete Event

**Endpoint:** `DELETE /events/:id`

**Authentication:** Required (ORGANIZER only - must be event creator)

**Note:** Can only delete events in "Planning" status with no participants

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

---

### 6. Change Event Status

**Endpoint:** `PATCH /events/:id/status`

**Authentication:** Required (ORGANIZER only - must be event creator)

**Request Body:**
```json
{
  "status": "Published"
}
```

**Valid State Transitions:**
- Planning → Published or Canceled
- Published → Running or Canceled
- Running → Completed

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Event status changed successfully",
  "data": {
    "event": { ... }
  }
}
```

---

### 7. Get My Events (Organizer)

**Endpoint:** `GET /events/organizer/me`

**Authentication:** Required (ORGANIZER only)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Organizer events retrieved successfully",
  "data": {
    "events": [ ... ]
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "errors": [ ... ] // For validation errors
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid request data
- `AUTHENTICATION_ERROR` - Invalid or missing token
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_ENTRY` - Resource already exists
- `INVALID_STATE_TRANSITION` - Invalid event state change
- `INTERNAL_ERROR` - Server error

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

---

## Rate Limiting

API Gateway enforces rate limiting:
- Window: 15 minutes
- Max Requests: 100 per IP
- Response when exceeded: `429 Too Many Requests`

---

## Testing with Postman

Import the Postman collection from `/postman` folder for pre-configured requests.

### Authentication Flow

1. Register a user (ORGANIZER or PARTICIPANT)
2. Login to get JWT token
3. Copy token
4. In Postman, set Authorization type to "Bearer Token"
5. Paste token
6. Make authenticated requests

---

## Coming Soon (Future Milestones)

- **MS3:** Enrollment endpoints (register, unregister, waitlist)
- **MS4:** Chat endpoints (real-time messaging)
- **MS5:** Notification endpoints
- **MS6:** Advanced monitoring and logging
