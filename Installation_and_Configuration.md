# 3. Final Product

## 3.1 Installation and Configuration

### Prerequisites

The following software must be installed on your system before setting up the MOV Event Management System:

- **Docker Desktop** (version 24.0 or higher)
  - Download from: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
  - Ensure Docker Engine is running before starting the installation
  
- **Git** (version 2.30 or higher)
  - Download from: [https://git-scm.com/downloads](https://git-scm.com/downloads)
  - Required for cloning the repository

- **Node.js** (version 20 LTS) - *Optional, only for local development*
  - Download from: [https://nodejs.org/](https://nodejs.org/)
  - Required only if you want to run services outside Docker

### Source Repository

The Git repository can be found here: [https://github.com/rahulsuresh2569/MOV-Event-Mgmt.git](https://github.com/rahulsuresh2569/MOV-Event-Mgmt.git)

### Installation

To install and start the system, follow these steps:

#### Step 1: Clone the Repository

Open a terminal (PowerShell on Windows, Terminal on macOS/Linux) and execute:

```bash
git clone https://github.com/rahulsuresh2569/MOV-Event-Mgmt.git
cd MOV-Event-Mgmt
```

#### Step 2: Start Docker Desktop

Ensure Docker Desktop is running on your system. You can verify by running:

```bash
docker --version
docker-compose --version
```

Both commands should return version information without errors.

#### Step 3: Build and Deploy Containers

From the project root directory, execute the following command to build and start all services:

```bash
docker-compose up --build -d
```

This command will:
- Build Docker images for all microservices (API Gateway, Auth Service, Event Service, Enrollment Service, Chat Service)
- Start PostgreSQL database with initialized schemas
- Start MongoDB for chat and notification services
- Start Redis for caching
- Launch pgAdmin for PostgreSQL database management
- Launch Mongo Express for MongoDB database management

The `-d` flag runs containers in detached mode (background).

#### Step 4: Verify Container Status

Check that all containers are running successfully:

```bash
docker ps
```

You should see the following containers running:
- `mov-api-gateway` (Port 3000)
- `mov-auth-service` (Port 3001)
- `mov-event-service` (Port 3002)
- `mov-enrollment-service` (Port 3003)
- `mov-chat-service` (Port 3004)
- `mov-postgres` (Port 5433)
- `mov-mongodb` (Port 27017)
- `mov-redis` (Port 6379)
- `mov-pgadmin` (Port 5050)
- `mov-mongo-express` (Port 8081)

#### Step 5: Wait for Services to Initialize

Allow 30-60 seconds for all services to fully initialize and establish database connections. You can monitor the logs:

```bash
docker-compose logs -f
```

Press `Ctrl+C` to stop following logs.

### First Test

#### Testing the API Gateway

1. **Open a web browser** and navigate to:
   ```
   http://localhost:3000/health
   ```

2. **Expected Result:** You should see the following JSON response:
   ```json
   {
     "success": true,
     "message": "API Gateway is healthy",
     "timestamp": "2026-01-24T10:30:45.123Z"
   }
   ```

   ![API Gateway Health Check](docs/screenshots/health-check.png)

#### Testing Swagger UI (Primary Testing Method)

The system provides an interactive API documentation interface using Swagger UI:

1. **Open a web browser** and navigate to:
   ```
   http://localhost:3000/api-docs
   ```

2. **Expected Result:** You should see the Swagger UI interface displaying all available API endpoints organized by categories:
   - Authentication
   - Events
   - Enrollments

   ![Swagger UI Interface](docs/screenshots/swagger-ui.png)

3. **Using Swagger UI:**
   - Click on any endpoint to expand its details
   - Click "Try it out" to test the endpoint
   - Fill in required parameters
   - Click "Execute" to send the request
   - View the response below

#### Example: Register a User via Swagger UI

1. Navigate to Swagger UI at `http://localhost:3000/api-docs`
2. Locate the **Authentication** section
3. Click on `POST /api/v1/auth/register` to expand
4. Click **"Try it out"**
5. Replace the example JSON with:
   ```json
   {
     "email": "organizer@test.com",
     "password": "password123",
     "role": "ORGANIZER",
     "firstName": "John",
     "lastName": "Doe"
   }
   ```
6. Click **"Execute"**
7. **Expected Response (201 Created):**
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
         "lastName": "Doe",
         "isActive": true
       }
     }
   }
   ```

### Database Management Tools

#### pgAdmin - PostgreSQL Database Management

**Access URL:** `http://localhost:5050`

**Login Credentials:**
- Email: `admin@mov.com`
- Password: `admin123`

**Features:**
- View and manage PostgreSQL databases (mov_auth, mov_events, mov_enrollments)
- Execute SQL queries
- View table schemas and relationships
- Monitor database performance

**Setting up Database Connection:**
1. Login to pgAdmin
2. Right-click "Servers" → "Register" → "Server"
3. **General Tab:**
   - Name: `MOV PostgreSQL`
4. **Connection Tab:**
   - Host name/address: `postgres`
   - Port: `5432`
   - Maintenance database: `postgres`
   - Username: `admin`
   - Password: `dev123`
5. Click "Save"

![pgAdmin Interface](docs/screenshots/pgadmin.png)

#### Mongo Express - MongoDB Database Management

**Access URL:** `http://localhost:8081`

**Login Credentials:**
- Username: `admin`
- Password: `admin123`

**Features:**
- View and manage MongoDB collections
- Browse chat messages and notifications
- Execute MongoDB queries
- Import/Export data

![Mongo Express Interface](docs/screenshots/mongo-express.png)

#### Chat Service Test Interface

**Access URL:** `http://localhost:3004` (Open `chat-test.html` in your browser)

**Purpose:** Real-time chat testing interface for event-based group messaging and direct messages.

**Features:**
- Real-time WebSocket connection to Chat Service
- Join event-specific chat rooms
- Send group messages to all event participants
- Send direct messages to specific users
- Pre-enrollment inquiries (ask organizer before enrolling)
- View message history
- Typing indicators

**How to Use:**

1. **Get JWT Token:**
   - First, login via Swagger UI (`http://localhost:3000/api-docs`)
   - Use `POST /api/v1/auth/login` endpoint
   - Copy the JWT token from the response

2. **Open Chat Interface:**
   - Open the file `chat-test.html` in your web browser
   - Paste your JWT token in the token field
   - Click "Connect" button
   - Wait for "✅ Connected to chat service" status

3. **Join Event Room:**
   - Enter an Event ID (e.g., 1)
   - Click "Join Event Room"
   - You're now in the event chat room

4. **Send Messages:**
   - **Group Message:** Type message and click "Send to Group" (visible to all event participants)
   - **Direct Message:** Enter receiver's User ID and click "Send Direct Message" (private 1-on-1 chat)

5. **Send Inquiry (Pre-Enrollment):**
   - Participants can ask questions before enrolling in an event
   - Enter Event ID, Subject, and Question
   - Click "Send Inquiry"
   - Organizer receives the inquiry in real-time
   - Organizer can reply using the Inquiry ID

**Testing Scenario:**
- Open two browser windows with different user tokens (one organizer, one participant)
- Join the same event room in both windows
- Send messages and see real-time delivery
- Test inquiries from participant and replies from organizer

![Chat Test Interface](docs/screenshots/chat-test.png)

### Stopping the System

To stop all running containers:

```bash
docker-compose down
```

To stop and remove all data (including databases):

```bash
docker-compose down -v
```

---

## 3.2 Automatic Tests

The following automated end-to-end tests have been developed to verify user stories:

| User Story | Test Name | Description |
|------------|-----------|-------------|
| FUNC-AUTH-001 | User Registration Test | Validates user registration with ORGANIZER and PARTICIPANT roles |
| FUNC-AUTH-002 | User Login Test | Validates JWT token generation on successful login |
| FUNC-EVENT-010 | Create Event Test | Validates event creation by organizers |
| FUNC-EVENT-020 | List Events Test | Validates event visibility rules for different user roles |
| FUNC-EVENT-030 | Update Event Test | Validates event modification by organizers |
| FUNC-EVENT-040 | Event Status Transition Test | Validates event lifecycle state transitions |
| FUNC-ENROLL-010 | Event Enrollment Test | Validates participant enrollment in published events |
| FUNC-ENROLL-020 | Capacity Management Test | Validates maximum participant limit enforcement |
| FUNC-ENROLL-030 | Unenrollment Test | Validates participant unenrollment from events |
| FUNC-CHAT-010 | Real-time Messaging Test | Validates WebSocket connection and message delivery |
| FUNC-CHAT-020 | Group Chat Test | Validates event-specific group messaging |
| FUNC-CHAT-030 | Direct Messaging Test | Validates one-on-one private messaging |
| FUNC-CHAT-040 | Inquiry System Test | Validates pre-enrollment inquiry functionality |

**Running Tests:**

```bash
# Run all tests
docker-compose exec api-gateway npm test
docker-compose exec auth-service npm test
docker-compose exec event-service npm test
docker-compose exec enrollment-service npm test
docker-compose exec chat-service npm test

# Run tests with coverage
docker-compose exec auth-service npm run test:coverage
docker-compose exec chat-service npm run test:coverage
```

**Test Reports:**
Coverage reports are generated in `services/[service-name]/coverage/lcov-report/index.html`

---

## 3.3 User Guide

### Primary Testing Method: Swagger UI

The MOV Event Management System provides a comprehensive Swagger UI interface as the primary method for interacting with the API. This eliminates the need for external tools like Postman for basic operations.

**Access Swagger UI:** `http://localhost:3000/api-docs`

### Alternative Testing Method: Postman

For advanced testing scenarios, users can also use Postman. A detailed testing guide is available at [docs/POSTMAN_TESTING_GUIDE.md](docs/POSTMAN_TESTING_GUIDE.md).

**Quick Postman Setup:**
1. Import the API collection from Swagger UI (`http://localhost:3000/api-docs-json`)
2. Set base URL: `http://localhost:3000/api/v1`
3. Configure authentication with Bearer Token after login

### Complete Workflow Examples

#### Workflow 1: Creating and Publishing an Event (Organizer)

**Step 1: Register as Organizer**

Navigate to Swagger UI → Authentication → `POST /api/v1/auth/register`

```json
{
  "email": "organizer@example.com",
  "password": "securePassword123",
  "role": "ORGANIZER",
  "firstName": "Jane",
  "lastName": "Organizer"
}
```

**Step 2: Login**

Navigate to `POST /api/v1/auth/login`

```json
{
  "email": "organizer@example.com",
  "password": "securePassword123"
}
```

**Response:** Copy the `token` from the response.

**Step 3: Authorize in Swagger**

1. Click the green **"Authorize"** button at the top of Swagger UI
2. Enter: `Bearer <your-token-here>` (replace `<your-token-here>` with the actual token)
3. Click "Authorize" then "Close"

**Step 4: Create Event**

Navigate to Events → `POST /api/v1/events`

```json
{
  "title": "Tech Conference 2026",
  "description": "Annual technology conference featuring latest innovations",
  "category": "Technology",
  "location": "Berlin Convention Center",
  "startDate": "2026-03-15T09:00:00.000Z",
  "endDate": "2026-03-15T17:00:00.000Z",
  "maxParticipants": 500
}
```

**Note:** Event is created in "Planning" status by default.

**Step 5: Publish Event**

Navigate to `PATCH /api/v1/events/{id}/status`

- Enter the Event ID from Step 4
- Request body:
  ```json
  {
    "status": "Published"
  }
  ```

**Result:** Event is now visible to all users and ready for enrollment.

#### Workflow 2: Enrolling in an Event (Participant)

**Step 1: Register as Participant**

Navigate to Swagger UI → Authentication → `POST /api/v1/auth/register`

```json
{
  "email": "participant@example.com",
  "password": "securePassword123",
  "role": "PARTICIPANT",
  "firstName": "John",
  "lastName": "Participant"
}
```

**Step 2: Login**

Navigate to `POST /api/v1/auth/login`

```json
{
  "email": "participant@example.com",
  "password": "securePassword123"
}
```

**Step 3: Authorize with Token**

Follow the same authorization process as in Workflow 1, Step 3.

**Step 4: Browse Events**

Navigate to Events → `GET /api/v1/events`

This shows all Published and Running events available for enrollment.

**Step 5: Enroll in Event**

Navigate to Enrollments → `POST /api/v1/enrollments`

```json
{
  "eventId": 1
}
```

**Step 6: View My Enrollments**

Navigate to `GET /api/v1/enrollments/me`

This displays all events you are enrolled in.

**Step 7: Unenroll (Optional)**

Navigate to `DELETE /api/v1/enrollments/{eventId}`

- Enter the Event ID
- Click Execute

#### Workflow 4: Real-time Chat Communication

**Prerequisites:** Must have enrolled in an event (for participants) or created an event (for organizers).

**Step 1: Login and Get Token**

1. Login via Swagger UI: `POST /api/v1/auth/login`
2. Copy the JWT token from the response

**Step 2: Open Chat Interface**

1. Open `chat-test.html` in your web browser
2. Paste the JWT token in the "JWT Token" field
3. Click "Connect"
4. Wait for connection confirmation

**Step 3: Join Event Chat Room**

1. Enter the Event ID (e.g., 1)
2. Click "Join Event Room"
3. You'll see a confirmation: "✅ Joined event room #1"

**Step 4: Send Group Message**

1. Type your message in the message input field
2. Click "Send to Group" or press Enter
3. Message appears in the chat box
4. All other users in the same event room will receive it in real-time

**Example:**
```
You: Looking forward to this event!
```

**Step 5: Send Direct Message**

1. Enter the recipient's User ID in "Receiver User ID" field
2. Type your message
3. Click "Send Direct Message"
4. Only the specified user receives this private message

**Example:**
```
📨 Direct to User #2 (Event #1): Can we discuss the agenda?
```

**Step 6: Pre-Enrollment Inquiry (Participants)**

Participants can ask questions before enrolling:

1. Enter the Event ID
2. Enter a Subject (e.g., "Question about prerequisites")
3. Enter your question
4. Click "Send Inquiry"
5. The organizer receives the inquiry in real-time

**Example Inquiry:**
```json
{
  "eventId": 1,
  "subject": "Accessibility Requirements",
  "question": "Is the venue wheelchair accessible?"
}
```

**Step 7: Reply to Inquiry (Organizers)**

Organizers can view and reply to inquiries:

1. Click "View Event Inquiries (Organizer)"
2. Note the Inquiry ID from the displayed list
3. Enter the Inquiry ID in the "Inquiry ID" field
4. Type your reply
5. Click "Reply (Organizer)"
6. The participant receives the reply in real-time

**Example Reply:**
```
Inquiry ID: 507f1f77bcf86cd799439011
Reply: Yes, the venue is fully wheelchair accessible with ramps and elevators.
```

**Real-time Features:**
- Instant message delivery (no page refresh needed)
- Typing indicators when other users are typing
- User join/leave notifications
- Online status of participants

#### Workflow 5: Viewing Event Statistics (Organizer)

**Prerequisites:** Must be logged in as the event organizer (see Workflow 1).

**Step 1: Get Statistics**

Navigate to Enrollments → `GET /api/v1/enrollments/event/{eventId}/statistics`

- Enter your Event ID
- Click Execute

**Response:**
```json
{
  "success": true,
  "message": "Event statistics retrieved successfully",
  "data": {
    "eventId": 1,
    "eventTitle": "Tech Conference 2026",
    "eventStatus": "Published",
    "eventDate": "2026-03-15T09:00:00.000Z",
    "registrations": {
      "total": 45,
      "active": 38,
      "canceled": 7,
      "cancellationRate": 15.56
    },
    "capacity": {
      "max": 500,
      "current": 38,
      "available": 462,
      "utilizationRate": 7.6
    }
  }
}
```

### Understanding Event Visibility Rules

The system implements role-based visibility for events:

**Unauthenticated Users:**
- See only: Published and Running events

**Participants:**
- See: All Published and Running events
- See: Completed and Canceled events they enrolled in

**Organizers:**
- See: All their own events (all statuses)
- See: Published and Running events from other organizers

**Note:** Events in "Planning" status are only visible to the organizer who created them.

### Event Lifecycle States

Events transition through the following states:

```
Planning → Published → Running → Completed
              ↓
           Canceled
```

**State Descriptions:**
- **Planning:** Initial state, visible only to organizer
- **Published:** Event is public and open for enrollment
- **Running:** Event is currently happening (can be auto-transitioned at start date)
- **Completed:** Event has ended (can be auto-transitioned at end date)
- **Canceled:** Event was canceled by organizer

**Automatic Transitions:**
If `endDate` is provided when creating an event, the system automatically:
- Transitions to "Running" at `startDate`
- Transitions to "Completed" at `endDate`

### Troubleshooting

**Problem:** Cannot access Swagger UI or API endpoints

**Solution:**
```bash
# Check if all containers are running
docker ps

# Check container logs
docker-compose logs api-gateway
docker-compose logs auth-service
docker-compose logs event-service

# Restart all services
docker-compose restart
```

**Problem:** Database connection errors

**Solution:**
```bash
# Check database health
docker-compose ps

# Restart databases
docker-compose restart postgres mongodb redis
```

**Problem:** Port conflicts (port already in use)

**Solution:**
Edit `docker-compose.yml` and change the host port mapping:
```yaml
ports:
  - "3001:3000"  # Changes from 3000 to 3001 on host
```

**Problem:** Chat service WebSocket connection fails

**Solution:**
```bash
# Check chat service is running
docker-compose logs chat-service

# Verify MongoDB connection
docker-compose exec mongodb mongosh -u admin -p dev123

# Restart chat service
docker-compose restart chat-service

# Check if port 3004 is accessible
curl http://localhost:3004/health
```

**Problem:** Chat messages not appearing in chat-test.html

**Solution:**
1. Ensure you're using a valid JWT token (not expired)
2. Check browser console for WebSocket errors (F12 → Console)
3. Verify you've joined the event room before sending messages
4. Confirm other user is in the same event room for group messages
5. Clear browser cache and reload the page

### Additional Resources

- **Architecture Documentation:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **API Documentation:** [docs/API.md](docs/API.md)
- **Database Schema:** [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
- **Postman Testing Guide:** [docs/POSTMAN_TESTING_GUIDE.md](docs/POSTMAN_TESTING_GUIDE.md)
- **Development Workflow:** [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md)

---

**System Version:** 1.0.0  
**Last Updated:** January 24, 2026  
**Maintained By:** MOV Event Management Team
