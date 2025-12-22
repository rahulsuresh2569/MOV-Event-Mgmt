# MOV Event Management System

A distributed microservices-based event management platform built with Node.js, Express.js, PostgreSQL, and MongoDB.

## 🏗️ Architecture

This project follows a microservices architecture with the following services:

- **API Gateway** - Entry point for all client requests (Port 3000)
- **Auth Service** - User authentication and authorization (Port 3001)
- **Event Service** - Event CRUD and lifecycle management (Port 3002)
- **Enrollment Service** - Event registration and capacity management (Port 3003)
- **Chat Service** - Real-time messaging with Socket.IO (Port 3004)
- **Notification Service** - Email and push notifications (Port 3005)

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Language**: JavaScript ES6+

### Databases
- **PostgreSQL 16**: Auth, Event, Enrollment services
- **MongoDB 7**: Chat, Notification services
- **Redis 7**: Caching and session management

### Tools
- **Docker & Docker Compose**: Containerization
- **Sequelize**: PostgreSQL ORM
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication
- **Socket.IO**: Real-time communication
- **Winston**: Logging
- **Jest**: Testing

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- [Node.js 20](https://nodejs.org/) installed (for local development)
- [Git](https://git-scm.com/) installed

### Quick Start

**👉 For detailed step-by-step instructions, see [GETTING_STARTED.md](GETTING_STARTED.md)**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MOV-Event-Mgmt
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Setup Git hooks**
   ```bash
   npm run prepare
   ```

4. **Start all services with Docker**
   ```bash
   docker-compose up -d
   ```

5. **Install service dependencies**
   ```bash
   cd services/api-gateway && npm install
   cd ../auth-service && npm install
   cd ../event-service && npm install
   ```

6. **Access the services**
   - API Gateway: http://localhost:3000
   - Auth Service: http://localhost:3001
   - Event Service: http://localhost:3002
   - pgAdmin: http://localhost:5050 (admin@mov.com / admin123)
   - Mongo Express: http://localhost:8081

7. **Stop all services**
   ```bash
   docker-compose down
   ```

## 📁 Project Structure

```
MOV-Event-Mgmt/
├── services/                  # Microservices
│   ├── api-gateway/          # API Gateway
│   ├── auth-service/         # Authentication service
│   ├── event-service/        # Event management service
│   ├── enrollment-service/   # (To be added in MS3)
│   ├── chat-service/         # (To be added in MS4)
│   └── notification-service/ # (To be added in MS4)
├── shared/                    # Shared code
│   ├── middleware/           # Common middleware
│   ├── utils/                # Utility functions
│   └── constants/            # Shared constants
├── docs/                      # Documentation
├── scripts/                   # Automation scripts
├── .github/                   # GitHub Actions workflows
├── docker-compose.yml        # Docker orchestration
└── package.json              # Root package configuration
```

## 🧑‍💻 Development

### Running Services Locally (without Docker)

Each service can be run independently:

```bash
# Auth Service
cd services/auth-service
npm install
npm run dev

# Event Service
cd services/event-service
npm install
npm run dev
```

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

# Format all code
npm run format

# Fix linting issues
npm run lint:fix
```

## 📚 Documentation

- [Setup Guide](docs/SETUP.md)
- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Architecture Overview](docs/ARCHITECTURE.md)

## 🔄 Git Workflow

We follow GitHub Flow with feature branches:

1. Create feature branch from `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/FUNC-XXX-description
   ```

2. Make changes and commit
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

3. Push and create Pull Request
   ```bash
   git push origin feature/FUNC-XXX-description
   ```

4. After PR approval, merge to `develop`

## 📋 Milestones

- **MS1**: Basic event management and user interaction
- **MS2**: Event lifecycle and state management
- **MS3**: Concurrency and capacity handling
- **MS4**: Real-time chat and notifications
- **MS5**: Chat service improvements
- **MS6**: Security, monitoring, and logging

## 👥 Team

- Jeyanth Shanmugasundaram
- Rahul Suresh
- Premanathan Aarthi Manivannan

## 📄 License

This project is part of an academic assignment at TH Bingen.

## 🆘 Support

For issues and questions, please create an issue in the GitHub repository.
