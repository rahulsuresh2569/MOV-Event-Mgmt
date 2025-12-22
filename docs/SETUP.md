# Project Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20 LTS** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com/)
- **Postman** (optional) - [Download](https://www.postman.com/downloads/)

## Quick Start with Docker (Recommended)

This is the fastest way to get the entire system running.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MOV-Event-Mgmt
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Start All Services with Docker

```bash
docker-compose up -d
```

This will start:
- PostgreSQL (port 5432)
- MongoDB (port 27017)
- Redis (port 6379)
- pgAdmin (port 5050)
- Mongo Express (port 8081)
- API Gateway (port 3000)
- Auth Service (port 3001)
- Event Service (port 3002)

### 4. Verify Services are Running

```bash
docker ps
```

You should see all containers running.

### 5. Test the API

```bash
# Test API Gateway
curl http://localhost:3000/health

# Test Auth Service
curl http://localhost:3001/health

# Test Event Service
curl http://localhost:3002/health
```

### 6. Access Database Management Tools

- **pgAdmin** (PostgreSQL GUI): http://localhost:5050
  - Email: admin@mov.com
  - Password: admin123
  
- **Mongo Express** (MongoDB GUI): http://localhost:8081
  - Username: admin
  - Password: admin123

### 7. Stop All Services

```bash
docker-compose down
```

---

## Local Development Setup (Without Docker)

For development, you may want to run services individually.

### 1. Install PostgreSQL

**Windows:**
- Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
- Install with default settings
- Set password for postgres user

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux:**
```bash
sudo apt-get install postgresql-16
sudo systemctl start postgresql
```

### 2. Install MongoDB

**Windows:**
- Download from [MongoDB Downloads](https://www.mongodb.com/try/download/community)

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Linux:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### 3. Install Redis

**Windows:**
- Download from [Redis Windows](https://github.com/microsoftarchive/redis/releases)

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### 4. Create Databases

```bash
# PostgreSQL
psql -U postgres

CREATE DATABASE mov_auth;
CREATE DATABASE mov_events;
CREATE DATABASE mov_enrollments;
\q
```

### 5. Setup Environment Variables

Each service needs a `.env` file. Copy from `.env.example`:

```bash
# Root level
cp .env.example .env

# API Gateway
cd services/api-gateway
cp .env.example .env

# Auth Service
cd services/auth-service
cp .env.example .env

# Event Service
cd services/event-service
cp .env.example .env
```

Edit each `.env` file with your local database credentials.

### 6. Install Dependencies for Each Service

```bash
# API Gateway
cd services/api-gateway
npm install

# Auth Service
cd services/auth-service
npm install

# Event Service
cd services/event-service
npm install
```

### 7. Run Database Migrations

```bash
# Auth Service
cd services/auth-service
npm run db:migrate

# Event Service
cd services/event-service
npm run db:migrate
```

### 8. Run Services

Open 3 separate terminals:

**Terminal 1 - API Gateway:**
```bash
cd services/api-gateway
npm run dev
```

**Terminal 2 - Auth Service:**
```bash
cd services/auth-service
npm run dev
```

**Terminal 3 - Event Service:**
```bash
cd services/event-service
npm run dev
```

---

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific service
cd services/auth-service
npm test
```

### Linting and Formatting

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Git Hooks

Husky is configured to run checks before commits:

```bash
npm run prepare  # Setup Husky
```

Now every commit will:
1. Run ESLint
2. Run Prettier
3. Only allow commit if all checks pass

---

## Common Issues and Solutions

### Issue 1: Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Issue 2: Database Connection Failed

**Error:** `Unable to connect to PostgreSQL`

**Solution:**
1. Ensure PostgreSQL is running
2. Check credentials in `.env` file
3. Verify database exists: `psql -U admin -l`

### Issue 3: Docker Containers Not Starting

**Solution:**
```bash
# View logs
docker-compose logs -f

# Rebuild containers
docker-compose down -v
docker-compose up --build
```

### Issue 4: Permission Denied on Scripts

**macOS/Linux:**
```bash
chmod +x scripts/*.sh
```

---

## Next Steps

1. Read [API Documentation](./API.md) for endpoint details
2. Check [Database Schema](./DATABASE_SCHEMA.md) for data structure
3. Review [Architecture Overview](./ARCHITECTURE.md) for system design
4. Import Postman collection from `/postman` folder

## Need Help?

- Check existing GitHub Issues
- Create a new issue with detailed error description
- Contact team members
