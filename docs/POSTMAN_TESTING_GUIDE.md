# Postman API Testing Guide - MOV Event Management

## Base Configuration

- **API Gateway URL:** `http://localhost:3000/api/v1`
- **Auth Service (Direct):** `http://localhost:3001/api/v1`
- **Event Service (Direct):** `http://localhost:3002/api/v1`

**⚠️ Use API Gateway (port 3000) for all tests**

---

## 🔐 Authentication Overview

### Public Routes (No Token Required)
- ✅ `POST /auth/register` - User registration
- ✅ `POST /auth/login` - User login
- ✅ `GET /events` - View all events
- ✅ `GET /events/:id` - View single event

### Protected Routes (Token Required)
- 🔒 `GET /auth/me` - Get user profile
- 🔒 `GET /auth/verify` - Verify token validity
- 🔒 `POST /events` - Create event (ORGANIZER only)
- 🔒 `PUT /events/:id` - Update event (ORGANIZER only)
- 🔒 `DELETE /events/:id` - Delete event (ORGANIZER only)
- 🔒 `PATCH /events/:id/status` - Change event status (ORGANIZER only)
- 🔒 `GET /events/organizer/me` - Get my events (ORGANIZER only)

**How Authentication Works:**
1. User logs in → Receives JWT token
2. User sends token in `Authorization: Bearer <token>` header
3. API Gateway verifies token and extracts user info
4. Gateway forwards user info to backend services via headers
5. Backend services trust the gateway and use user info

---

## 1️⃣ Authentication Flow

### 1.1 Register Organizer

**Method:** POST  
**URL:** `http://localhost:3000/api/v1/auth/register`  
**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "organizer@test.com",
  "password": "password123",
  "role": "ORGANIZER",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "organizer@test.com",
      "role": "ORGANIZER",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

---

### 1.2 Register Participant

**Method:** POST  
**URL:** `http://localhost:3000/api/v1/auth/register`  

**Body (JSON):**
```json
{
  "email": "participant@test.com",
  "password": "password123",
  "role": "PARTICIPANT",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

---

### 1.3 Login

**Method:** POST  
**URL:** `http://localhost:3000/api/v1/auth/login`  

**Body (JSON):**
```json
{
  "email": "organizer@test.com",
  "password": "password123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "organizer@test.com",
      "role": "ORGANIZER",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**📝 IMPORTANT:** Copy the `token` value for next requests!

---

### 1.4 Get Profile (Protected Route) ✅

**Method:** GET  
**URL:** `http://localhost:3000/api/v1/auth/me`  
**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "organizer@test.com",
      "role": "ORGANIZER",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true
    }
  }
}
```

**⚠️ Error Cases:**
- **401 Unauthorized:** No token or invalid token
- **401 Unauthorized:** Token expired (login again)

---

## 2️⃣ Event Management Flow

### 2.1 Create Event (Organizer)

**Method:** POST  
**URL:** `http://localhost:3000/api/v1/events`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ORGANIZER_TOKEN
```

**Body (JSON):**
```json
{
  "title": "Tech Conference 2025",
  "description": "Annual technology conference featuring latest innovations",
  "category": "Technology",
  "location": "Berlin Convention Center",
  "date": "2025-03-15T09:00:00.000Z",
  "maxParticipants": 500
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "event": {
      "id": 1,
      "title": "Tech Conference 2025",
      "description": "Annual technology conference featuring latest innovations",
      "category": "Technology",
      "location": "Berlin Convention Center",
      "date": "2025-03-15T09:00:00.000Z",
      "maxParticipants": 500,
      "currentParticipants": 0,
      "status": "Planning",
      "organizerId": 1,
      "createdAt": "2026-01-03T00:00:00.000Z",
      "updatedAt": "2026-01-03T00:00:00.000Z"
    }
  }
}
```

---

### 2.2 Get All Events (Public)

**Method:** GET  
**URL:** `http://localhost:3000/api/v1/events`  

**Optional Query Params:**
- `status=Published` - Filter by status
- `category=Technology` - Filter by category

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "events": [
      {
        "id": 1,
        "title": "Tech Conference 2025",
        "status": "Planning",
        ...
      }
    ]
  }
}
```

---

### 2.3 Get Event by ID (Public)

**Method:** GET  
**URL:** `http://localhost:3000/api/v1/events/1`  

---

### 2.4 Update Event (Organizer)

**Method:** PUT  
**URL:** `http://localhost:3000/api/v1/events/1`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ORGANIZER_TOKEN
```

**Body (JSON):**
```json
{
  "title": "Tech Conference 2025 - Updated",
  "description": "Updated description with new details",
  "maxParticipants": 600
}
```

---

### 2.5 Change Event Status (Organizer)

**Method:** PATCH  
**URL:** `http://localhost:3000/api/v1/events/1/status`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ORGANIZER_TOKEN
```

**Body (JSON):**
```json
{
  "status": "Published"
}
```

**Valid Transitions:**
- Planning → Published, Canceled
- Published → Running, Canceled
- Running → Completed

---

### 2.6 Get My Events (Organizer)

**Method:** GET  
**URL:** `http://localhost:3000/api/v1/events/organizer/me`  
**Headers:**
```
Authorization: Bearer YOUR_ORGANIZER_TOKEN
```

---

### 2.7 Delete Event (Organizer)

**Method:** DELETE  
**URL:** `http://localhost:3000/api/v1/events/1`  
**Headers:**
```
Authorization: Bearer YOUR_ORGANIZER_TOKEN
```

---

## 3️⃣ Role-Based Access Control (RBAC) Testing

### 3.1 Test: Participant Cannot Create Event ❌

**Scenario:** Verify that participants are blocked from creating events

**Steps:**
1. Register as PARTICIPANT
2. Login as PARTICIPANT (save token)
3. Try to create event with participant token

**Method:** POST  
**URL:** `http://localhost:3000/api/v1/events`  
**Headers:**
```
Authorization: Bearer YOUR_PARTICIPANT_TOKEN
Content-Type: application/json
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "errorCode": "AUTHORIZATION_ERROR"
}
```

---

### 3.2 Test: Organizer Can Create Event ✅

**Scenario:** Verify that organizers CAN create events

**Method:** POST  
**URL:** `http://localhost:3000/api/v1/events`  
**Headers:**
```
Authorization: Bearer YOUR_ORGANIZER_TOKEN
Content-Type: application/json
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Event created successfully",
  ...
}
```

---

### 3.3 Test: No Token → Unauthorized ❌

**Scenario:** Verify that protected routes reject requests without tokens

**Method:** POST  
**URL:** `http://localhost:3000/api/v1/events`  
**Headers:**
```
Content-Type: application/json
```
**No Authorization header!**

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "No token provided",
  "errorCode": "AUTHENTICATION_ERROR"
}
```

---

### 3.4 Test: Invalid Token → Unauthorized ❌

**Scenario:** Verify that tampered tokens are rejected

**Method:** GET  
**URL:** `http://localhost:3000/api/v1/auth/me`  
**Headers:**
```
Authorization: Bearer INVALID_TOKEN_HERE
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid token",
  "errorCode": "AUTHENTICATION_ERROR"
}
```

---

### 3.5 Test: Expired Token → Unauthorized ❌

**Scenario:** Verify that expired tokens are rejected

**Note:** JWT_EXPIRES_IN is set to 24h, so you'd need to wait or manually create an expired token for testing.

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Token expired",
  "errorCode": "AUTHENTICATION_ERROR"
}
```

---

## 4️⃣ Health Check

**Method:** GET  
**URL:** `http://localhost:3000/health`  

**Expected Response (200):**
```json
{
  "success": true,
  "message": "API Gateway is healthy",
  "timestamp": "2025-12-26T00:00:00.000Z"
}
```

---

## 5️⃣ Postman Collection Setup

### Step 1: Create Collection
1. Create a new collection: "MOV Event Management"
2. Add folders: "Auth", "Events", "RBAC Tests"

### Step 2: Setup Environment
1. Create new environment: "MOV Development"
2. Add variables:
   - `base_url` = `http://localhost:3000/api/v1`
   - `organizer_token` = (leave empty, will be set automatically)
   - `participant_token` = (leave empty, will be set automatically)
   - `organizer_email` = `organizer@test.com`
   - `participant_email` = `participant@test.com`
   - `event_id` = (will be set after creating event)

### Step 3: Auto-Save Tokens
Add this script to **ALL Login requests** (Tests tab):

**For Organizer Login:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("organizer_token", response.data.token);
    console.log("✅ Organizer token saved!");
}
```

**For Participant Login:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("participant_token", response.data.token);
    console.log("✅ Participant token saved!");
}
```

### Step 4: Auto-Save Event ID
Add this to **Create Event request** (Tests tab):
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("event_id", response.data.event.id);
    console.log("✅ Event ID saved:", response.data.event.id);
}
```

### Step 5: Use Variables in Requests

**Authorization Header:**
```
Authorization: Bearer {{organizer_token}}
```

**Request Body (Login):**
```json
{
  "email": "{{organizer_email}}",
  "password": "password123"
}
```

**Dynamic URLs:**
```
GET {{base_url}}/events/{{event_id}}
PUT {{base_url}}/events/{{event_id}}
DELETE {{base_url}}/events/{{event_id}}
```

### Step 6: Add Test Assertions
Add tests to verify responses (Tests tab):

```javascript
// Test: Status code is correct
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test: Response has success field
pm.test("Response has success field", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});

// Test: Response has data
pm.test("Response has data", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('data');
});

// Test: Token is valid JWT format
pm.test("Token is valid JWT", function () {
    const jsonData = pm.response.json();
    const token = jsonData.data.token;
    pm.expect(token).to.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
});
```

---

## ⚠️ Current Limitations

1. **Missing Services** - Enrollment, Chat, Notification not yet implemented
2. **No Pagination** - Event listings return all results
3. **No Image Support** - Event images/attachments not yet implemented
4. **No Real-time Features** - Chat and notifications require WebSocket implementation

---

## 🔧 Next Development Steps

1. ✅ ~~Add auth middleware to API Gateway protected routes~~ **COMPLETED**
2. ✅ ~~Implement request header forwarding (user info from JWT)~~ **COMPLETED**
3. **Build Enrollment Service (MS3)** - User event registration
4. **Build Chat Service** - Real-time messaging with WebSocket
5. **Build Notification Service** - Email/push notifications
6. **Add Pagination** - Event listings with page/limit params
7. **Implement File Upload** - Event image uploads to cloud storage
8. **Add Event Search** - Full-text search functionality

---

## 🐛 Testing Errors & Troubleshooting

### HTTP Status Codes Reference

**✅ Success Codes:**
- **200 OK** - Request successful (GET, PUT, PATCH)
- **201 Created** - Resource created successfully (POST)
- **204 No Content** - Successful deletion (DELETE)

**❌ Client Error Codes:**
- **400 Bad Request** - Invalid request body (validation failed)
- **401 Unauthorized** - Missing/invalid/expired token
- **403 Forbidden** - Valid token but insufficient permissions (RBAC)
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Duplicate resource (email already exists)
- **422 Unprocessable Entity** - Validation error (Joi)
- **429 Too Many Requests** - Rate limit exceeded

**❌ Server Error Codes:**
- **500 Internal Server Error** - Unexpected server error
- **503 Service Unavailable** - Service is down

---

### Common Error Scenarios

#### 1. Authentication Errors (401)

**Error: "No token provided"**
```json
{
  "success": false,
  "message": "No token provided",
  "errorCode": "AUTHENTICATION_ERROR"
}
```
**Solution:**
- Add `Authorization: Bearer <token>` header
- Ensure token doesn't have extra spaces
- Check token is not empty

---

**Error: "Invalid token"**
```json
{
  "success": false,
  "message": "Invalid token",
  "errorCode": "AUTHENTICATION_ERROR"
}
```
**Solution:**
- Token might be malformed or tampered
- Login again to get a fresh token
- Check JWT_SECRET is same across services

---

**Error: "Token expired"**
```json
{
  "success": false,
  "message": "Token expired",
  "errorCode": "AUTHENTICATION_ERROR"
}
```
**Solution:**
- Token is older than 24h (JWT_EXPIRES_IN)
- Login again to get new token

---

#### 2. Authorization Errors (403)

**Error: "Insufficient permissions"**
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "errorCode": "AUTHORIZATION_ERROR"
}
```
**Solution:**
- User role doesn't match required role
- PARTICIPANT trying to access ORGANIZER-only route
- Login with correct role account

---

#### 3. Validation Errors (400)

**Error: "Validation error"**
```json
{
  "success": false,
  "message": "Validation error",
  "errorCode": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters long"
    }
  ]
}
```
**Solution:**
- Check request body against schema
- Ensure all required fields are present
- Validate data types (string, number, date)

---

#### 4. Resource Errors (404)

**Error: "Event not found"**
```json
{
  "success": false,
  "message": "Event not found",
  "errorCode": "NOT_FOUND"
}
```
**Solution:**
- Check event ID is correct
- Event might have been deleted
- Verify event exists: `GET /events`

---

#### 5. Conflict Errors (409)

**Error: "User with this email already exists"**
```json
{
  "success": false,
  "message": "User with this email already exists",
  "errorCode": "DUPLICATE_ENTRY"
}
```
**Solution:**
- Email is already registered
- Use different email or login instead

---

#### 6. Service Errors

**Error: "Service temporarily unavailable"**
```json
{
  "success": false,
  "message": "Service temporarily unavailable",
  "error": "connect ECONNREFUSED 172.18.0.5:3001"
}
```
**Solution:**
```bash
# Check if all services are running
docker ps

# Check specific service logs
docker logs mov-auth-service --tail 50
docker logs mov-event-service --tail 50

# Restart services
docker-compose restart auth-service event-service

# Rebuild if needed
docker-compose up -d --build
```

---

**Error: "Database connection failed"**
**Solution:**
```bash
# Check PostgreSQL is healthy
docker ps | grep postgres

# Check PostgreSQL logs
docker logs mov-postgres --tail 50

# Test database connection
docker exec -it mov-postgres psql -U admin -d mov_auth -c "SELECT 1;"

# Restart PostgreSQL
docker-compose restart postgres
```

---

#### 7. Rate Limiting (429)

**Error: "Too many requests from this IP, please try again later"**
**Solution:**
- Wait 15 minutes (rate limit window)
- Default limit: 100 requests per 15 minutes
- Adjust in API Gateway: RATE_LIMIT_MAX_REQUESTS env var

---

### Debugging Checklist

**Before Testing:**
- [ ] All Docker containers running: `docker ps`
- [ ] PostgreSQL healthy: `docker logs mov-postgres | grep "ready"`
- [ ] Services started successfully (check logs)
- [ ] Environment variables loaded correctly

**During Testing:**
- [ ] Using correct base URL (port 3000, not 3001/3002)
- [ ] Token included for protected routes
- [ ] Request body matches schema
- [ ] Content-Type header set to `application/json`
- [ ] Using correct HTTP method (GET, POST, PUT, DELETE, PATCH)

**After Errors:**
- [ ] Check response body for error details
- [ ] Check service logs: `docker logs <service>`
- [ ] Verify database state in pgAdmin
- [ ] Test simpler endpoint first (health check)

---

## 📞 Service Ports

- API Gateway: `3000`
- Auth Service: `3001`
- Event Service: `3002`
- PostgreSQL: `5432`
- pgAdmin: `5050` (http://localhost:5050)
- MongoDB: `27017`
- Mongo Express: `8081` (http://localhost:8081)
- Redis: `6379`

---

## 🚀 Complete Testing Workflow

### Phase 1: Basic Setup (5 min)
1. ✅ Test health check: `GET /health`
2. ✅ Register organizer: `POST /auth/register`
3. ✅ Register participant: `POST /auth/register`
4. ✅ Login as organizer (save token)
5. ✅ Login as participant (save token)

### Phase 2: Authentication Testing (5 min)
6. ✅ Get organizer profile: `GET /auth/me`
7. ✅ Verify organizer token: `GET /auth/verify`
8. ❌ Test invalid token (expect 401)
9. ❌ Test missing token (expect 401)

### Phase 3: Event Management (10 min)
10. ✅ Create event as organizer
11. ✅ Get all events (public)
12. ✅ Get event by ID
13. ✅ Update event as organizer
14. ✅ Change event status: Planning → Published
15. ✅ Get my events as organizer
16. ✅ Delete event as organizer

### Phase 4: RBAC Testing (5 min)
17. ❌ Try create event as participant (expect 403)
18. ❌ Try update event as participant (expect 403)
19. ❌ Try delete event as participant (expect 403)
20. ✅ Verify participant CAN view events

### Phase 5: Edge Cases (5 min)
21. ❌ Create event with invalid data (validation error)
22. ❌ Get non-existent event (404)
23. ❌ Register duplicate email (409)
24. ❌ Login with wrong password (401)

### Expected Results:
- **Total Tests:** 24
- **Should Pass:** 16 (✅)
- **Should Fail (Expected):** 8 (❌)
- **Success Rate:** 100% (all behave as expected)

---

## 📊 Sample Test Report

```
MOV Event Management API Tests
================================

✅ PASSED: Health check (200 OK)
✅ PASSED: Register organizer (201 Created)
✅ PASSED: Register participant (201 Created)
✅ PASSED: Login organizer (200 OK, token received)
✅ PASSED: Login participant (200 OK, token received)
✅ PASSED: Get profile with token (200 OK)
✅ PASSED: Verify token validity (200 OK)
❌ EXPECTED: Invalid token rejected (401 Unauthorized) ✓
❌ EXPECTED: Missing token rejected (401 Unauthorized) ✓
✅ PASSED: Create event as organizer (201 Created)
✅ PASSED: Get all events (200 OK)
✅ PASSED: Get event by ID (200 OK)
✅ PASSED: Update event (200 OK)
✅ PASSED: Change event status (200 OK)
✅ PASSED: Get my events (200 OK)
✅ PASSED: Delete event (200 OK)
❌ EXPECTED: Participant blocked from create (403 Forbidden) ✓
❌ EXPECTED: Participant blocked from update (403 Forbidden) ✓
❌ EXPECTED: Participant blocked from delete (403 Forbidden) ✓
✅ PASSED: Participant can view events (200 OK)
❌ EXPECTED: Invalid data rejected (400 Bad Request) ✓
❌ EXPECTED: Non-existent event (404 Not Found) ✓
❌ EXPECTED: Duplicate email rejected (409 Conflict) ✓
❌ EXPECTED: Wrong password rejected (401 Unauthorized) ✓

================================
Total: 24 tests
Passed: 16 (67%)
Expected Failures: 8 (33%)
Unexpected Failures: 0 (0%)

🎉 ALL TESTS PASSED! Authentication and RBAC working correctly!
```

---

## 🎓 Next Steps

1. **Export Postman Collection**
   - File → Export → Collection v2.1
   - Save to `tests/postman/MOV-Event-Management.postman_collection.json`
   - Commit to git for team sharing

2. **Automate Testing with Newman**
   ```bash
   npm install -g newman
   newman run tests/postman/MOV-Event-Management.postman_collection.json \
     --environment tests/postman/docker-env.postman_environment.json \
     --reporters cli,json
   ```

3. **Document API with Swagger**
   - Generate OpenAPI spec from Postman
   - Add Swagger UI to API Gateway
   - Auto-generate client SDKs

4. **Build Enrollment Service**
   - Follow same pattern as Event Service
   - Add Postman tests for enrollment endpoints
   - Integrate with API Gateway

---

**🎯 You now have a fully functional, secure, testable microservices API!**
