# Event Service

Event management service with full CRUD operations and state management.

## Features

- Create events (Organizers only)
- View all events (filtered by status, category)
- Update events (Organizers only, before event starts)
- Delete events (Organizers only, Planning status only)
- Change event status with validation
- Get organizer's events

## API Endpoints

- `GET /api/v1/events` - Get all events (public)
- `GET /api/v1/events/:id` - Get event by ID (public)
- `POST /api/v1/events` - Create event (organizer only)
- `PUT /api/v1/events/:id` - Update event (organizer only)
- `DELETE /api/v1/events/:id` - Delete event (organizer only)
- `PATCH /api/v1/events/:id/status` - Change event status (organizer only)
- `GET /api/v1/events/organizer/me` - Get my events (organizer only)
- `GET /health` - Health check

## Event States

- `Planning` → `Published` or `Canceled`
- `Published` → `Running` or `Canceled`
- `Running` → `Completed`

## Running Locally

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure your PostgreSQL connection.
