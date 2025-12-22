# Database Schema Documentation

## Overview

The MOV Event Management System uses a hybrid database approach:
- **PostgreSQL** for structured, relational data (Auth, Events, Enrollments)
- **MongoDB** for flexible, document-based data (Chat, Notifications)

---

## PostgreSQL Schemas

### Database: `mov_auth`

#### Table: `users`

User accounts with role-based access control.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ORGANIZER', 'PARTICIPANT')),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Columns:**
- `id` - Auto-incrementing primary key
- `email` - Unique email address (login identifier)
- `password` - Hashed password (bcrypt)
- `role` - User role (ORGANIZER or PARTICIPANT)
- `first_name` - User's first name (optional)
- `last_name` - User's last name (optional)
- `is_active` - Account status (for soft deletion)
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

**Constraints:**
- UNIQUE on `email`
- CHECK on `role` (must be ORGANIZER or PARTICIPANT)

**Indexes:**
- `email` - For fast login lookups
- `role` - For filtering users by role

---

### Database: `mov_events`

#### Table: `events`

Event information and lifecycle management.

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  organizer_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  location VARCHAR(255),
  max_participants INTEGER NOT NULL CHECK (max_participants > 0),
  current_participants INTEGER DEFAULT 0,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Planning' 
    CHECK (status IN ('Planning', 'Published', 'Running', 'Completed', 'Canceled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_category ON events(category);
```

**Columns:**
- `id` - Auto-incrementing primary key
- `organizer_id` - Foreign key to users table (creator)
- `title` - Event title
- `description` - Event description (optional)
- `date` - Event date and time
- `location` - Physical or online location
- `max_participants` - Maximum capacity
- `current_participants` - Current enrollment count
- `category` - Event category (workshop, meetup, concert, etc.)
- `status` - Current event state
- `created_at` - Event creation timestamp
- `updated_at` - Last update timestamp

**Event Status Flow:**
```
Planning → Published → Running → Completed
    ↓          ↓
  Canceled   Canceled
```

**Constraints:**
- CHECK on `max_participants` (must be > 0)
- CHECK on `status` (must be valid state)

**Indexes:**
- `organizer_id` - For querying organizer's events
- `status` - For filtering by event status
- `date` - For chronological sorting
- `category` - For filtering by category

**Relationships:**
- `organizer_id` references `users(id)` (conceptual - not enforced in Sequelize)

---

### Database: `mov_enrollments` (Coming in MS3)

#### Table: `enrollments`

User registrations for events.

```sql
CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'ENROLLED' 
    CHECK (status IN ('ENROLLED', 'WAITLISTED', 'CANCELED')),
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_enrollments_event ON enrollments(event_id);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
```

**Columns:**
- `id` - Auto-incrementing primary key
- `event_id` - Foreign key to events table
- `user_id` - Foreign key to users table
- `status` - Enrollment status
- `enrolled_at` - Registration timestamp

**Constraints:**
- UNIQUE on `(event_id, user_id)` - Prevent duplicate enrollments

#### Table: `waitlist`

Waitlist for full events.

```sql
CREATE TABLE waitlist (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);
```

---

## MongoDB Schemas (Coming in MS4 & MS5)

### Database: `mov_chat`

#### Collection: `messages`

Chat messages between organizers and participants.

```javascript
{
  _id: ObjectId,
  eventId: ObjectId,
  senderId: ObjectId,
  senderRole: String, // 'ORGANIZER' or 'PARTICIPANT'
  message: String,
  timestamp: Date,
  edited: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `eventId` - For fetching event chat history
- `senderId` - For user message history
- `timestamp` - For chronological ordering

---

### Database: `mov_notifications`

#### Collection: `notifications`

System notifications for users.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  type: String, // 'REGISTRATION', 'EVENT_UPDATE', 'MESSAGE', etc.
  data: {
    eventId: ObjectId,
    eventTitle: String,
    message: String,
    // ... flexible structure
  },
  read: Boolean,
  createdAt: Date
}
```

**Indexes:**
- `userId` - For user notifications
- `read` - For unread notifications
- `createdAt` - For chronological ordering

---

## Entity Relationship Diagram (ERD)

```
┌─────────────┐
│   users     │
│─────────────│
│ id (PK)     │
│ email       │
│ password    │
│ role        │
│ ...         │
└──────┬──────┘
       │ 1
       │ organizer_id
       │
       │ N
┌──────┴──────┐
│   events    │
│─────────────│
│ id (PK)     │
│organizer_id │
│ title       │
│ status      │
│ ...         │
└──────┬──────┘
       │ 1
       │ event_id
       │
       │ N
┌──────┴───────┐
│ enrollments  │
│──────────────│
│ id (PK)      │
│ event_id     │
│ user_id      │
│ status       │
│ ...          │
└──────────────┘
```

---

## Data Types and Constraints

### PostgreSQL Data Types

- `SERIAL` - Auto-incrementing integer (primary keys)
- `INTEGER` - Whole numbers (IDs, counts)
- `VARCHAR(n)` - Variable character string (emails, names)
- `TEXT` - Unlimited text (descriptions)
- `TIMESTAMP` - Date and time
- `BOOLEAN` - True/false values

### Sequelize Model Definitions

**Example: User Model**
```javascript
{
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  // ...
}
```

---

## Migration Strategy

### Development

Use Sequelize `sync()` to auto-create tables:

```javascript
await sequelize.sync({ alter: false });
```

### Production

Use Sequelize CLI migrations:

```bash
# Create migration
npx sequelize-cli migration:generate --name create-users-table

# Run migrations
npx sequelize-cli db:migrate

# Rollback
npx sequelize-cli db:migrate:undo
```

---

## Database Connection Configuration

### PostgreSQL Connection Pool

```javascript
{
  pool: {
    max: 5,       // Maximum connections
    min: 0,       // Minimum connections
    acquire: 30000, // Max time to get connection (30s)
    idle: 10000    // Max idle time (10s)
  }
}
```

### Performance Considerations

1. **Indexes** - Created on frequently queried columns
2. **Connection Pooling** - Reuse database connections
3. **Query Optimization** - Use indexes, avoid N+1 queries
4. **Caching** - Redis for frequently accessed data

---

## Backup and Recovery

### PostgreSQL Backup

```bash
# Backup
pg_dump -U admin -d mov_auth > backup_auth.sql
pg_dump -U admin -d mov_events > backup_events.sql

# Restore
psql -U admin -d mov_auth < backup_auth.sql
```

### MongoDB Backup

```bash
# Backup
mongodump --db mov_chat --out backup/

# Restore
mongorestore --db mov_chat backup/mov_chat
```
