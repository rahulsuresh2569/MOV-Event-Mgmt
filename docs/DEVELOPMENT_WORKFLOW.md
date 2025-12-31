# Development Workflow Guide

## 🎯 Current Project Status

### ✅ Completed (Milestone 2)
- **Architecture:** True microservices with independent services
- **Auth Service:** User registration, login, JWT authentication
- **Event Service:** Full CRUD operations, state management
- **API Gateway:** Request routing, rate limiting, CORS
- **Database:** PostgreSQL (3 databases), MongoDB, Redis
- **Docker:** All services containerized and running

### 🚧 In Progress / Next Steps
- **API Gateway Auth:** Add JWT verification to protected routes
- **Enrollment Service (MS3):** User event registration
- **Chat Service:** Real-time messaging
- **Notification Service:** Email/push notifications

---

## 🏗️ Development Workflow

### **1. Feature Development Cycle**

#### Step 1: Plan the Feature
```
Example: "Add event enrollment functionality"

Requirements:
- User can enroll in published events
- Check max participants limit
- Prevent duplicate enrollments
- Store enrollment in PostgreSQL
- Send confirmation notification
```

#### Step 2: Design the API Endpoints
```
POST   /api/v1/enrollments/events/:eventId/enroll
GET    /api/v1/enrollments/events/:eventId/participants
GET    /api/v1/enrollments/my-enrollments
DELETE /api/v1/enrollments/:enrollmentId
```

#### Step 3: Implement Backend (Service Layer)

**File Structure:**
```
services/enrollment-service/
├── src/
│   ├── models/Enrollment.js          # Database schema
│   ├── services/enrollmentService.js # Business logic
│   ├── controllers/enrollmentController.js # Request handling
│   ├── validators/enrollmentValidator.js   # Input validation
│   └── routes/enrollmentRoutes.js    # Route definitions
```

**Development Order:**
1. Create database model (`models/Enrollment.js`)
2. Write business logic (`services/enrollmentService.js`)
3. Add validators (`validators/enrollmentValidator.js`)
4. Create controller (`controllers/enrollmentController.js`)
5. Define routes (`routes/enrollmentRoutes.js`)
6. Register routes in `app.js`

#### Step 4: Test with Postman
1. Start services: `docker-compose up -d`
2. Create test requests in Postman
3. Test happy paths (success scenarios)
4. Test error cases (validation, not found, conflicts)
5. Verify database changes in pgAdmin

#### Step 5: Integrate with API Gateway
```javascript
// services/api-gateway/src/app.js
app.use(
  '/api/v1/enrollments',
  verifyToken, // Add auth middleware
  createProxyMiddleware({
    target: process.env.ENROLLMENT_SERVICE_URL,
    pathRewrite: { '^/api/v1/enrollments': '/api/v1' },
    ...proxyOptions,
  })
);
```

#### Step 6: Test End-to-End
1. Test via API Gateway (port 3000)
2. Verify JWT authentication works
3. Test role-based access (ORGANIZER vs PARTICIPANT)
4. Check logs for errors

---

## 🧪 Testing Strategy

### **1. Unit Testing (Per Service)**

**Location:** `services/{service}/tests/`

**Example Test:**
```javascript
// services/auth-service/tests/authService.test.js
const authService = require('../src/services/authService');

describe('AuthService', () => {
  test('should register user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      role: 'PARTICIPANT'
    };
    
    const user = await authService.register(userData);
    
    expect(user).toHaveProperty('id');
    expect(user.email).toBe(userData.email);
  });
});
```

**Run Tests:**
```bash
cd services/auth-service
npm test
```

### **2. Integration Testing (Postman/Newman)**

**Create Postman Collection:**
1. Organize by feature (Auth, Events, Enrollments)
2. Add environment variables
3. Chain requests (login → use token)
4. Add assertions (status code, response body)

**Export Collection:**
- Save as JSON in `tests/postman/` folder
- Version control with git

**Automated Testing:**
```bash
# Install Newman (Postman CLI)
npm install -g newman

# Run collection
newman run tests/postman/MOV-Event-Management.postman_collection.json \
  --environment tests/postman/docker-env.postman_environment.json
```

### **3. Manual Testing Checklist**

**Before Each Commit:**
- ✅ All services start without errors
- ✅ Health check returns 200
- ✅ New endpoint works via Postman
- ✅ Error cases handled properly
- ✅ Database changes persisted
- ✅ No breaking changes to existing APIs

---

## 🔄 Daily Development Routine

### **Morning Setup (5 min)**
```bash
# Pull latest changes
git pull origin main

# Start all services
docker-compose up -d

# Wait for services to be ready
docker ps --format "table {{.Names}}\t{{.Status}}"

# Check logs for errors
docker logs mov-auth-service --tail 10
docker logs mov-event-service --tail 10
docker logs mov-api-gateway --tail 10
```

### **During Development**

**Option 1: Docker (Recommended for Testing)**
```bash
# Make code changes
# Rebuild specific service
docker-compose up -d --build auth-service

# Check logs
docker logs -f mov-auth-service
```

**Option 2: Local Development (Faster Iteration)**
```bash
# Stop Docker service
docker stop mov-auth-service

# Create .env file (copy from .env.example)
cd services/auth-service
cp .env.example .env

# Edit .env for local development
# POSTGRES_HOST=localhost (instead of postgres)

# Run locally
npm run dev
```

**Local Dev Benefits:**
- ✅ Hot reload (nodemon)
- ✅ Faster iteration
- ✅ Easier debugging

**Docker Benefits:**
- ✅ Production-like environment
- ✅ No local setup needed
- ✅ Tests complete integration

### **After Each Feature**
```bash
# Run tests
npm test

# Test via Postman
# - Import collection
# - Run all requests
# - Verify responses

# Check for errors
docker logs mov-{service} --tail 50

# Commit changes
git add .
git commit -m "feat: add event enrollment functionality"
git push origin feature/enrollments
```

---

## 📁 Project Structure Best Practices

### **Service Structure (Consistent Across All Services)**
```
services/[service-name]/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server startup
│   ├── config/
│   │   └── database.js        # DB connection
│   ├── constants/
│   │   └── httpStatus.js      # Status codes, error codes
│   ├── controllers/           # Request handlers
│   │   └── [entity]Controller.js
│   ├── middleware/
│   │   ├── errorHandler.js    # Error handling
│   │   └── [custom].js        # Custom middleware
│   ├── models/                # Database models
│   │   └── [Entity].js
│   ├── routes/                # Route definitions
│   │   └── [entity]Routes.js
│   ├── services/              # Business logic
│   │   └── [entity]Service.js
│   ├── utils/                 # Helper functions
│   │   ├── logger.js
│   │   └── responseFormatter.js
│   └── validators/            # Input validation
│       └── [entity]Validator.js
├── tests/                     # Test files
├── logs/                      # Log files
├── .env.example               # Environment template
├── .env                       # Environment variables (gitignored)
├── Dockerfile                 # Container definition
├── package.json               # Dependencies
└── README.md                  # Service documentation
```

### **Naming Conventions**

**Files:**
- Controllers: `authController.js`, `eventController.js`
- Services: `authService.js`, `eventService.js`
- Models: `User.js`, `Event.js` (PascalCase)
- Routes: `authRoutes.js`, `eventRoutes.js`

**Functions:**
- Controllers: `register`, `login`, `getProfile` (camelCase)
- Services: `createEvent`, `updateEvent`, `deleteEvent`

**Database:**
- Tables: `users`, `events`, `enrollments` (plural, lowercase)
- Columns: `created_at`, `user_id` (snake_case)

**API Endpoints:**
- `/api/v1/auth/register` (kebab-case, lowercase)
- `/api/v1/events/events/:id`

---

## 🐛 Debugging Guide

### **Check Service Health**
```bash
# All containers running?
docker ps

# Service logs
docker logs mov-auth-service --tail 50 -f

# Database logs
docker logs mov-postgres --tail 50

# Gateway logs
docker logs mov-api-gateway --tail 50
```

### **Common Issues**

**1. "Cannot connect to database"**
```bash
# Check if PostgreSQL is healthy
docker ps | grep postgres

# Test connection
docker exec -it mov-postgres psql -U admin -d mov_auth -c "SELECT 1;"

# Restart service
docker-compose restart auth-service
```

**2. "Service unavailable" from Gateway**
```bash
# Check service URLs in gateway
docker exec mov-api-gateway env | grep SERVICE_URL

# Test direct service connection
curl http://localhost:3001/api/v1/health
```

**3. "Token verification failed"**
```bash
# Check JWT_SECRET is same across services
docker exec mov-auth-service env | grep JWT_SECRET
docker exec mov-api-gateway env | grep JWT_SECRET
```

**4. "Validation error"**
```bash
# Check validator schema
# Compare request body with validator in code
# Example: services/auth-service/src/validators/authValidator.js
```

---

## 📊 Monitoring During Development

### **Check Service Status**
```bash
# Quick status check
docker-compose ps

# Detailed status with ports
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### **Monitor Logs**
```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker logs -f mov-auth-service

# Search logs for errors
docker logs mov-auth-service 2>&1 | grep -i error
```

### **Database Inspection**

**PostgreSQL (pgAdmin):**
1. Open http://localhost:5050
2. Login: admin@mov.com / admin123
3. Add server:
   - Host: postgres (inside Docker) or localhost (from host)
   - Port: 5432
   - Database: mov_auth / mov_events / mov_enrollments
   - Username: admin
   - Password: dev123

**MongoDB (Mongo Express):**
1. Open http://localhost:8081
2. Login: admin / admin123

---

## 🎓 Learning Path for New Features

### **Week 1-2: Master Current Stack**
- ✅ Understand auth-service code flow
- ✅ Understand event-service code flow
- ✅ Learn Sequelize ORM basics
- ✅ Practice Postman testing
- ✅ Read JWT documentation

### **Week 3: Build Enrollment Service (MS3)**
1. Copy event-service as template
2. Create Enrollment model
3. Implement business logic
4. Add validators
5. Test with Postman
6. Integrate with gateway

### **Week 4: Add Advanced Features**
- Event search with filters
- Pagination for event lists
- Image upload for events
- Email notifications
- Event reminders

### **Week 5: Real-time Features**
- WebSocket setup for chat
- Socket.io integration
- Real-time notifications
- Live participant count

---

## 📚 Resources

**Documentation:**
- Express.js: https://expressjs.com/
- Sequelize ORM: https://sequelize.org/
- JWT: https://jwt.io/
- Docker: https://docs.docker.com/

**Tools:**
- Postman: API testing
- pgAdmin: PostgreSQL GUI
- VS Code Extensions:
  - REST Client (HTTP requests in VSCode)
  - Docker
  - PostgreSQL Explorer

**Best Practices:**
- RESTful API Design
- Error handling patterns
- Logging strategies
- Security (OWASP Top 10)

---

## 🚀 Next Immediate Tasks

1. **Add Auth Middleware to API Gateway** (Priority: HIGH)
   - Verify JWT tokens
   - Extract user info
   - Forward to backend services

2. **Create Postman Collection** (Priority: HIGH)
   - Document all endpoints
   - Add example requests
   - Export and version control

3. **Build Enrollment Service** (Priority: MEDIUM)
   - MS3 milestone requirement
   - User event registration
   - Enrollment management

4. **Add Unit Tests** (Priority: MEDIUM)
   - Replace placeholder tests
   - Test critical business logic
   - CI/CD preparation

5. **API Documentation** (Priority: LOW)
   - Generate Swagger/OpenAPI docs
   - API changelog
   - Versioning strategy
