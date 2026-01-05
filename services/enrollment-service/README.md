# Enrollment Service

Event enrollment and registration management microservice for MOV Event Management System.

## Features

- **Enrollment Management**: Register and unregister for events
- **State Validation**: Only allow enrollments for Published events
- **Capacity Tracking**: Track and update event capacity
- **User Authorization**: Extract user info from API Gateway headers

## API Endpoints

### Public Endpoints (Require Authentication via API Gateway)

- `POST /enrollments` - Register for an event
- `DELETE /enrollments/:eventId` - Unregister from an event
- `GET /enrollments/me` - Get user's enrollments

## Environment Variables

See `.env.example` for required environment variables.

## Running the Service

### Development
```bash
npm install
npm run dev
```

### Production
```bash
npm start
```

### Docker
```bash
docker build -t enrollment-service .
docker run -p 3003:3003 enrollment-service
```

## Database Schema

### Enrollments Table
- `id`: Primary key
- `user_id`: Foreign key to user
- `event_id`: Foreign key to event
- `status`: Enrollment status (active, canceled)
- `enrolled_at`: Timestamp of enrollment
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp

## Dependencies

- Express.js - Web framework
- Sequelize - PostgreSQL ORM
- Joi - Validation
- Axios - HTTP client for inter-service communication
- Winston - Logging
