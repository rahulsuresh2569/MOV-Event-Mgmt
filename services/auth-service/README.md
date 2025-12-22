# Auth Service

Authentication and authorization service using JWT and PostgreSQL.

## Features

- User registration (ORGANIZER/PARTICIPANT roles)
- User login with JWT token generation
- Token verification
- User profile retrieval

## API Endpoints

- `POST /api/v1/register` - Register new user
- `POST /api/v1/login` - Login user
- `GET /api/v1/me` - Get current user profile (requires auth)
- `GET /api/v1/verify` - Verify JWT token (requires auth)
- `GET /health` - Health check

## Running Locally

```bash
npm install
npm run dev
```

## Database Setup

```bash
# Run migrations
npm run db:migrate

# Revert migration
npm run db:migrate:undo
```

## Environment Variables

Copy `.env.example` to `.env` and configure your PostgreSQL connection.
