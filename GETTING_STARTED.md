# Getting Started Guide

## 🎉 Congratulations! Your repository is set up.

You've completed the initial setup. Here's your roadmap to start development.

---

## ✅ What's Been Set Up

### Root Configuration
- ✅ `.gitignore` - Ignores node_modules, logs, env files
- ✅ `package.json` - Root scripts for running all services
- ✅ `.env.example` - Environment variable templates
- ✅ `docker-compose.yml` - All services and databases
- ✅ ESLint + Prettier - Code quality tools
- ✅ Husky - Pre-commit hooks

### CI/CD
- ✅ GitHub Actions workflows (`.github/workflows/ci.yml`)
- ✅ Pull request template
- ✅ Automated testing, linting, security checks

### Shared Resources
- ✅ Common middleware (error handling, auth)
- ✅ Utilities (logger, response formatter)
- ✅ Constants (roles, states, HTTP codes)

### Services
- ✅ **API Gateway** (Port 3000) - Request routing
- ✅ **Auth Service** (Port 3001) - User authentication
- ✅ **Event Service** (Port 3002) - Event management

### Documentation
- ✅ Setup guide ([docs/SETUP.md](docs/SETUP.md))
- ✅ API documentation ([docs/API.md](docs/API.md))
- ✅ Database schema ([docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md))
- ✅ Architecture overview ([docs/ARCHITECTURE.md](docs/ARCHITECTURE.md))

---

## 🚀 Next Steps (Do This Now!)

### Step 1: Install Dependencies (5 minutes)

```powershell
# In the root directory
npm install
```

This installs ESLint, Prettier, Husky, and other development tools.

### Step 2: Setup Husky (1 minute)

```powershell
npm run prepare
```

This sets up Git hooks for code quality checks.

### Step 3: Start Docker Services (5 minutes)

```powershell
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- MongoDB (port 27017)
- Redis (port 6379)
- pgAdmin (port 5050)
- Mongo Express (port 8081)

Verify all containers are running:
```powershell
docker ps
```

### Step 4: Install Service Dependencies (5 minutes)

```powershell
# API Gateway
cd services/api-gateway
npm install

# Auth Service
cd ../auth-service
npm install

# Event Service
cd ../event-service
npm install

# Return to root
cd ../..
```

### Step 5: Create Environment Files (2 minutes)

```powershell
# Root
Copy-Item .env.example .env

# API Gateway
Copy-Item services/api-gateway/.env.example services/api-gateway/.env

# Auth Service
Copy-Item services/auth-service/.env.example services/auth-service/.env

# Event Service
Copy-Item services/event-service/.env.example services/event-service/.env
```

The default values in `.env.example` work with Docker, so no changes needed!

### Step 6: Test the Setup (2 minutes)

**Option A: Run all services with Docker**
```powershell
docker-compose up --build
```

**Option B: Run services individually (for development)**

Open 3 PowerShell terminals:

**Terminal 1 - API Gateway:**
```powershell
cd services/api-gateway
npm run dev
```

**Terminal 2 - Auth Service:**
```powershell
cd services/auth-service
npm run dev
```

**Terminal 3 - Event Service:**
```powershell
cd services/event-service
npm run dev
```

### Step 7: Verify Everything Works

Test health endpoints:

```powershell
# API Gateway
curl http://localhost:3000/health

# Auth Service
curl http://localhost:3001/health

# Event Service
curl http://localhost:3002/health
```

All should return success messages!

---

## 🎓 Week 1 Development Plan

### Day 1 (Today): Setup Complete ✅
- [x] Repository structure
- [x] Docker configuration
- [x] CI/CD pipeline
- [ ] Test your setup
- [ ] Familiarize with codebase

### Day 2-3: Auth Service (MS1)
**Assigned to:** Jeyanth

**Tasks:**
1. Test auth endpoints with Postman
2. Implement FUNC-ACC-010 (User Roles)
3. Implement FUNC-ACC-020 (Roles and Permissions)
4. Write unit tests

**Branch:** `feature/FUNC-ACC-010-user-roles`

### Day 4-5: Event Service (MS1)
**Assigned to:** Rahul

**Tasks:**
1. Implement FUNC-EVENT-010 (Create Events)
2. Implement FUNC-EVENT-020 (Edit Events)
3. Implement FUNC-EVENT-030 (Delete Events)
4. Implement FUNC-EVENT-040 (List Events)

**Branch:** `feature/FUNC-EVENT-010-create-events`

### Day 6-7: User Registration & Viewing (MS1)
**Assigned to:** Aarthi

**Tasks:**
1. Implement FUNC-USER-010 (Register for Events)
2. Implement FUNC-USER-020 (Unregister)
3. Implement FUNC-USER-050 (View Events)

**Branch:** `feature/FUNC-USER-010-registration`

---

## 📋 Workflow for Each Task

### 1. Create Feature Branch

```powershell
git checkout main
git pull origin main
git checkout -b feature/FUNC-XXX-description
```

### 2. Develop Feature

- Write code
- Test with Postman
- Write unit tests

### 3. Commit Changes

```powershell
git add .
git commit -m "feat(service): implement FUNC-XXX-description"
```

Husky will automatically:
- Run ESLint
- Run Prettier
- Only allow commit if all checks pass

### 4. Push and Create PR

```powershell
git push origin feature/FUNC-XXX-description
```

- Go to GitHub
- Create Pull Request to `main` branch
- Link to issue
- Request review from teammate

### 5. After PR Approval

- Merge to `main`
- Delete feature branch
- Pull latest `main`

---

## 🔧 Development Commands

### Root Level

```powershell
# Run all services in development mode
npm run dev

# Run tests for all services
npm test

# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Format all code
npm run format

# Docker commands
npm run docker:up      # Start containers
npm run docker:down    # Stop containers
npm run docker:logs    # View logs
```

### Individual Service

```powershell
cd services/auth-service

npm run dev            # Development mode with nodemon
npm start              # Production mode
npm test               # Run tests
npm run test:watch     # Watch mode for tests
npm run db:migrate     # Run database migrations
```

---

## 🛠️ Useful Tools

### Database Management

**pgAdmin** (PostgreSQL): http://localhost:5050
- Email: admin@mov.com
- Password: admin123

**Mongo Express** (MongoDB): http://localhost:8081
- Username: admin
- Password: admin123

### API Testing

Use Postman:
1. Create a new collection
2. Test auth endpoints first
3. Copy JWT token
4. Use Bearer Token authentication for protected routes

---

## 📚 Learning Resources

### PostgreSQL + Sequelize

- [Sequelize Docs](https://sequelize.org/docs/v6/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- Your SQL knowledge will help!

### Express.js

- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- You already know this!

### JWT Authentication

- [JWT.io](https://jwt.io/)
- Already implemented in auth service - study the code

---

## 🆘 Common Issues

### Issue: Port already in use

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### Issue: Docker containers won't start

```powershell
# View logs
docker-compose logs -f

# Restart containers
docker-compose down -v
docker-compose up --build
```

### Issue: Database connection failed

1. Ensure Docker containers are running: `docker ps`
2. Check `.env` file has correct credentials
3. Verify database exists in pgAdmin

---

## ✅ Pre-Development Checklist

Before starting development, ensure:

- [ ] All Docker containers running (`docker ps` shows 8 containers)
- [ ] Health endpoints return success (test with curl)
- [ ] pgAdmin accessible at localhost:5050
- [ ] You can connect to databases in pgAdmin
- [ ] ESLint and Prettier work (`npm run lint`)
- [ ] Husky pre-commit hook works (try making a commit)
- [ ] You've read [docs/SETUP.md](docs/SETUP.md)
- [ ] You've read [docs/API.md](docs/API.md)
- [ ] Team has divided MS1 tasks

---

## 🎯 Your First Test (Try This Now!)

### Test 1: Register a User

```powershell
curl -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d "{\"email\":\"organizer@test.com\",\"password\":\"test123\",\"role\":\"ORGANIZER\",\"firstName\":\"John\",\"lastName\":\"Doe\"}"
```

### Test 2: Login

```powershell
curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"organizer@test.com\",\"password\":\"test123\"}"
```

Copy the JWT token from response.

### Test 3: Create Event (use your token)

```powershell
curl -X POST http://localhost:3000/api/v1/events -H "Authorization: Bearer YOUR_TOKEN_HERE" -H "Content-Type: application/json" -d "{\"title\":\"Test Event\",\"description\":\"My first event\",\"date\":\"2025-02-15T14:00:00Z\",\"location\":\"TH Bingen\",\"maxParticipants\":50,\"category\":\"workshop\"}"
```

### Test 4: View Event

```powershell
curl http://localhost:3000/api/v1/events
```

---

## 🎉 You're Ready!

Your repository is fully configured and ready for development. The foundation is solid, with:

- ✅ Professional project structure
- ✅ Industry-standard tooling
- ✅ Automated quality checks
- ✅ Comprehensive documentation
- ✅ Docker containerization
- ✅ CI/CD pipeline

**Now it's time to build features!**

Start with MS1 user stories and follow the workflow above. Good luck! 🚀

---

## 📞 Need Help?

- Check documentation in `/docs` folder
- Review code comments in services
- Ask teammates
- Create GitHub issues for bugs
