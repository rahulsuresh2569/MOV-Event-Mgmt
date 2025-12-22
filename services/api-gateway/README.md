# API Gateway

The API Gateway serves as the single entry point for all client requests. It routes requests to appropriate microservices.

## Endpoints

- `GET /health` - Health check
- `GET /api/v1` - API information
- `/api/v1/auth/*` - Auth service routes
- `/api/v1/events/*` - Event service routes
- `/api/v1/enrollments/*` - Enrollment service routes
- `/api/v1/chat/*` - Chat service routes
- `/api/v1/notifications/*` - Notification service routes

## Running Locally

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure the service URLs.
