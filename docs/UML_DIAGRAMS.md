# UML Architecture Diagrams

This document contains comprehensive UML diagrams defining the architecture of the MOV Event Management System microservices application.

---

## Table of Contents

1. [System Context Diagram (C4 Level 1)](#1-system-context-diagram-c4-level-1)
2. [Container/Component Diagram (C4 Level 2)](#2-containercomponent-diagram-c4-level-2)
3. [Deployment Diagram](#3-deployment-diagram)
4. [Sequence Diagram - User Registration & Event Creation](#4-sequence-diagram---user-registration--event-creation)
5. [Sequence Diagram - Event Enrollment with Concurrency Control](#5-sequence-diagram---event-enrollment-with-concurrency-control)
6. [Sequence Diagram - Real-Time Chat Communication](#6-sequence-diagram---real-time-chat-communication)
7. [Sequence Diagram - Pre-Enrollment Inquiry System](#7-sequence-diagram---pre-enrollment-inquiry-system)
8. [Communication Patterns Diagram](#8-communication-patterns-diagram)
9. [Architecture Patterns Overview](#9-architecture-patterns-overview)

---

## 1. System Context Diagram (C4 Level 1)

**Purpose:** High-level overview showing the system and its external interactions.

```mermaid
graph TB
    subgraph External Actors
        USER[("👤 User<br/>(Organizer/Participant)")]
        BROWSER["🌐 Web Browser"]
        POSTMAN["📮 API Client<br/>(Postman/Mobile)"]
    end
    
    subgraph "MOV Event Management System"
        SYSTEM["🎯 MOV Platform<br/>Event Management<br/>Microservices System"]
    end
    
    subgraph External Systems
        EMAIL["📧 Email Server<br/>(SMTP)"]
        STORAGE["💾 Cloud Storage<br/>(Future)"]
    end
    
    USER -->|Uses| BROWSER
    USER -->|Uses| POSTMAN
    BROWSER -->|HTTPS/WSS| SYSTEM
    POSTMAN -->|HTTPS/WSS| SYSTEM
    SYSTEM -->|Sends notifications| EMAIL
    SYSTEM -.->|Future: File uploads| STORAGE
    
    style SYSTEM fill:#4CAF50,stroke:#2E7D32,stroke-width:3px,color:#fff
    style USER fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    style EMAIL fill:#FF9800,stroke:#E65100,stroke-width:2px,color:#fff
```

**Key Points:**
- Single system boundary containing all microservices
- Users interact via web browsers or API clients
- System communicates with external email service
- HTTPS for REST APIs, WSS for WebSocket connections

---

## 2. Container/Component Diagram (C4 Level 2)

**Purpose:** Shows all services, databases, and their communication channels.

```mermaid
graph TB
    subgraph External
        CLIENT["👤 Client<br/>(Browser/App)"]
    end
    
    subgraph "API Gateway Layer"
        GATEWAY["🚪 API Gateway<br/>Port 3000<br/><br/>• Request Routing<br/>• Rate Limiting<br/>• JWT Verification<br/>• CORS Handling<br/>• Swagger Docs"]
    end
    
    subgraph "Microservices Layer"
        AUTH["🔐 Auth Service<br/>Port 3001<br/><br/>• User Registration<br/>• Authentication<br/>• JWT Generation<br/>• RBAC"]
        
        EVENT["📅 Event Service<br/>Port 3002<br/><br/>• Event CRUD<br/>• State Machine<br/>• Visibility Control<br/>• Statistics"]
        
        ENROLL["✅ Enrollment Service<br/>Port 3003<br/><br/>• Event Registration<br/>• Capacity Control<br/>• Waitlist Management<br/>• Concurrency Lock"]
        
        CHAT["💬 Chat Service<br/>Port 3004<br/><br/>• Real-time Messaging<br/>• WebSocket (Socket.IO)<br/>• Conversation History<br/>• Group Chat"]
        
        NOTIFY["🔔 Notification Service<br/>Port 3005<br/><br/>• Email Notifications<br/>• In-App Alerts<br/>• Event Triggers<br/>(Planned)"]
    end
    
    subgraph "Data Layer"
        POSTGRES[("🐘 PostgreSQL<br/>Port 5433<br/><br/>• mov_auth<br/>• mov_events<br/>• mov_enrollments")]
        
        MONGO[("🍃 MongoDB<br/>Port 27017<br/><br/>• mov_chat<br/>• Conversations<br/>• Messages<br/>• Inquiries")]
        
        REDIS[("⚡ Redis<br/>Port 6379<br/><br/>• Session Cache<br/>• Distributed Locks<br/>• Pub/Sub")]
    end
    
    subgraph "Management Tools"
        PGADMIN["🔧 pgAdmin<br/>Port 5050"]
        MONGOEXP["🔧 Mongo Express<br/>Port 8081"]
    end
    
    CLIENT -->|"HTTPS REST API<br/>WSS WebSocket"| GATEWAY
    
    GATEWAY -->|"HTTP: /api/v1/auth/*"| AUTH
    GATEWAY -->|"HTTP: /api/v1/events/*"| EVENT
    GATEWAY -->|"HTTP: /api/v1/enrollments/*"| ENROLL
    GATEWAY -->|"HTTP: /api/v1/chat/*<br/>WSS: Socket.IO"| CHAT
    GATEWAY -.->|"HTTP: /api/v1/notifications/*"| NOTIFY
    
    AUTH -->|"Sequelize ORM"| POSTGRES
    EVENT -->|"Sequelize ORM"| POSTGRES
    ENROLL -->|"Sequelize ORM"| POSTGRES
    
    CHAT -->|"Mongoose ODM"| MONGO
    NOTIFY -.->|"Mongoose ODM"| MONGO
    
    EVENT -->|"Cache Events"| REDIS
    ENROLL -->|"Distributed Lock"| REDIS
    CHAT -->|"Pub/Sub"| REDIS
    
    ENROLL -->|"HTTP: Get Event Details<br/>Update Participant Count"| EVENT
    CHAT -->|"HTTP: Verify User<br/>Get Event Info"| AUTH
    CHAT -->|"HTTP: Check Enrollment"| ENROLL
    
    PGADMIN -.->|Manage| POSTGRES
    MONGOEXP -.->|Manage| MONGO
    
    style GATEWAY fill:#FF5722,stroke:#D84315,stroke-width:3px,color:#fff
    style AUTH fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    style EVENT fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    style ENROLL fill:#9C27B0,stroke:#6A1B9A,stroke-width:2px,color:#fff
    style CHAT fill:#FF9800,stroke:#E65100,stroke-width:2px,color:#fff
    style NOTIFY fill:#607D8B,stroke:#37474F,stroke-width:2px,color:#fff,stroke-dasharray: 5 5
    style POSTGRES fill:#336791,stroke:#1a3a52,stroke-width:2px,color:#fff
    style MONGO fill:#4DB33D,stroke:#2d6b24,stroke-width:2px,color:#fff
    style REDIS fill:#DC382D,stroke:#8a211b,stroke-width:2px,color:#fff
```

**Key Points:**
- **API Gateway Pattern**: Single entry point for all clients
- **Polyglot Persistence**: PostgreSQL for relational data, MongoDB for documents, Redis for caching
- **Service Communication**: HTTP for synchronous, WebSocket for real-time
- **Service-to-Service Calls**: Direct HTTP communication between services
- **Distributed Locking**: Redis ensures enrollment concurrency control

---

## 3. Deployment Diagram

**Purpose:** Shows the Docker containerization and network architecture.

```mermaid
graph TB
    subgraph "Docker Host"
        subgraph "mov-network (Bridge Network)"
            
            subgraph "Service Containers"
                GW["🐳 mov-api-gateway<br/>Image: api-gateway:latest<br/>Port: 3000:3000<br/>ENV: JWT_SECRET"]
                AS["🐳 mov-auth-service<br/>Image: auth-service:latest<br/>Port: 3001:3001"]
                ES["🐳 mov-event-service<br/>Image: event-service:latest<br/>Port: 3002:3002"]
                ENS["🐳 mov-enrollment-service<br/>Image: enrollment-service:latest<br/>Port: 3003:3003"]
                CS["🐳 mov-chat-service<br/>Image: chat-service:latest<br/>Port: 3004:3004"]
            end
            
            subgraph "Database Containers"
                PG["🐳 mov-postgres<br/>Image: postgres:16-alpine<br/>Port: 5433:5432<br/>Volumes: postgres-data"]
                MG["🐳 mov-mongodb<br/>Image: mongo:7<br/>Port: 27017:27017<br/>Volumes: mongodb-data"]
                RD["🐳 mov-redis<br/>Image: redis:7-alpine<br/>Port: 6379:6379<br/>Volumes: redis-data"]
            end
            
            subgraph "Management Containers"
                PGA["🐳 mov-pgadmin<br/>Image: dpage/pgadmin4<br/>Port: 5050:80"]
                MEX["🐳 mov-mongo-express<br/>Image: mongo-express<br/>Port: 8081:8081"]
            end
            
        end
    end
    
    subgraph "External Access"
        HOST["💻 Host Machine<br/>localhost"]
    end
    
    subgraph "Persistent Storage"
        VOL1["📂 postgres-data"]
        VOL2["📂 mongodb-data"]
        VOL3["📂 redis-data"]
        VOL4["📂 pgadmin-data"]
    end
    
    HOST -->|"localhost:3000"| GW
    HOST -->|"localhost:5050"| PGA
    HOST -->|"localhost:8081"| MEX
    
    GW --> AS
    GW --> ES
    GW --> ENS
    GW --> CS
    
    AS --> PG
    ES --> PG
    ENS --> PG
    ES --> RD
    ENS --> RD
    CS --> MG
    CS --> RD
    
    ENS --> ES
    CS --> AS
    CS --> ENS
    
    PG -.-> VOL1
    MG -.-> VOL2
    RD -.-> VOL3
    PGA -.-> VOL4
    
    style GW fill:#FF5722,stroke:#D84315,stroke-width:2px,color:#fff
    style AS fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    style ES fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    style ENS fill:#9C27B0,stroke:#6A1B9A,stroke-width:2px,color:#fff
    style CS fill:#FF9800,stroke:#E65100,stroke-width:2px,color:#fff
```

**Deployment Details:**
- **Orchestration**: Docker Compose (`docker-compose.yml`)
- **Network**: Bridge network (`mov-network`) for inter-container communication
- **Health Checks**: All databases have health checks configured
- **Restart Policy**: `unless-stopped` for automatic recovery
- **Volume Persistence**: Data persists across container restarts
- **Port Mapping**: Internal container ports mapped to host ports

---

## 4. Sequence Diagram - User Registration & Event Creation

**Purpose:** Shows the authentication flow and event creation process.

```mermaid
sequenceDiagram
    actor User as 👤 User
    participant Gateway as 🚪 API Gateway
    participant Auth as 🔐 Auth Service
    participant Event as 📅 Event Service
    participant PG as 🐘 PostgreSQL
    participant Redis as ⚡ Redis
    
    Note over User,PG: Phase 1: User Registration
    
    User->>Gateway: POST /api/v1/auth/register<br/>{email, password, role: "ORGANIZER"}
    Gateway->>Auth: Forward request
    Auth->>Auth: Validate input (Joi)
    Auth->>Auth: Hash password (bcrypt)
    Auth->>PG: INSERT INTO users
    PG-->>Auth: User created
    Auth->>Auth: Generate JWT token<br/>(24h expiration)
    Auth-->>Gateway: 201 Created<br/>{user, token}
    Gateway-->>User: {user, token}
    
    Note over User,PG: Phase 2: User Login
    
    User->>Gateway: POST /api/v1/auth/login<br/>{email, password}
    Gateway->>Auth: Forward request
    Auth->>PG: SELECT * FROM users<br/>WHERE email = ?
    PG-->>Auth: User record
    Auth->>Auth: Compare password<br/>(bcrypt.compare)
    Auth->>Auth: Generate JWT token
    Auth-->>Gateway: 200 OK<br/>{user, token}
    Gateway-->>User: {user, token}
    
    Note over User,Redis: Phase 3: Create Event (Organizer Only)
    
    User->>Gateway: POST /api/v1/events<br/>Authorization: Bearer {token}<br/>{title, description, date, capacity}
    Gateway->>Gateway: Verify JWT token<br/>(authMiddleware)
    Gateway->>Gateway: Extract user context<br/>(id, role, email)
    Gateway->>Event: Forward with X-User-* headers
    Event->>Event: Extract user from headers
    Event->>Event: Validate: role === "ORGANIZER"
    Event->>Event: Validate input (Joi)
    Event->>PG: BEGIN TRANSACTION<br/>INSERT INTO events<br/>SET status = "Planning"
    PG-->>Event: Event created
    Event->>Redis: Cache event data<br/>SET event:{id}
    Event-->>Gateway: 201 Created<br/>{event}
    Gateway-->>User: {event}
    
    Note over User,Redis: State Machine: Planning → Published → Running → Completed
```

**Key Patterns:**
- **JWT Authentication**: Stateless token-based auth
- **Password Security**: bcrypt hashing with salt rounds
- **Role-Based Access Control (RBAC)**: Only organizers can create events
- **Header-Based Context Propagation**: User context forwarded via headers
- **Input Validation**: Joi schemas validate all inputs
- **Caching Strategy**: Redis caches frequently accessed data

---

## 5. Sequence Diagram - Event Enrollment with Concurrency Control

**Purpose:** Demonstrates distributed locking and transaction handling for enrollment.

```mermaid
sequenceDiagram
    actor User1 as 👤 Participant 1
    actor User2 as 👤 Participant 2
    participant Gateway as 🚪 API Gateway
    participant Enroll as ✅ Enrollment Service
    participant Event as 📅 Event Service
    participant PG as 🐘 PostgreSQL
    participant Redis as ⚡ Redis
    
    Note over User1,Redis: Scenario: 2 users enrolling simultaneously (capacity: 1 spot left)
    
    par Concurrent Requests
        User1->>Gateway: POST /api/v1/enrollments<br/>Authorization: Bearer {token}<br/>{eventId: 5}
        User2->>Gateway: POST /api/v1/enrollments<br/>Authorization: Bearer {token}<br/>{eventId: 5}
    end
    
    Gateway->>Gateway: Verify JWT tokens
    
    par Forward to Enrollment Service
        Gateway->>Enroll: Request 1 (User1)
        Gateway->>Enroll: Request 2 (User2)
    end
    
    Note over Enroll,Redis: User 1 Enrollment Flow
    
    Enroll->>Enroll: Validate: role !== "ORGANIZER"
    Enroll->>Event: GET /events/5
    Event->>PG: SELECT * FROM events WHERE id = 5
    PG-->>Event: Event details
    Event-->>Enroll: {status: "Published", currentParticipants: 9, maxParticipants: 10}
    
    Enroll->>Enroll: Check: status === "Published" ✓
    Enroll->>Enroll: Check: capacity available (9 < 10) ✓
    
    Enroll->>PG: BEGIN TRANSACTION<br/>ISOLATION LEVEL: READ COMMITTED
    Enroll->>PG: SELECT * FROM enrollments<br/>WHERE userId = 1 AND eventId = 5<br/>FOR UPDATE (Row Lock 🔒)
    PG-->>Enroll: No existing enrollment
    
    Enroll->>PG: INSERT INTO enrollments<br/>{userId: 1, eventId: 5, status: "Confirmed"}
    PG-->>Enroll: Enrollment created
    
    Enroll->>Event: PATCH /events/5/participants<br/>{increment: true}
    Event->>PG: UPDATE events<br/>SET currentParticipants = 10<br/>WHERE id = 5
    PG-->>Event: Updated
    Event-->>Enroll: Success
    
    Enroll->>Redis: INCR event:5:participants
    
    Enroll->>PG: COMMIT TRANSACTION 🔓
    PG-->>Enroll: Success
    
    Enroll-->>Gateway: 201 Created<br/>{enrollment, status: "Confirmed"}
    Gateway-->>User1: Enrollment successful
    
    Note over Enroll,Redis: User 2 Enrollment Flow
    
    Enroll->>Event: GET /events/5
    Event->>PG: SELECT * FROM events WHERE id = 5
    PG-->>Event: Event details
    Event-->>Enroll: {currentParticipants: 10, maxParticipants: 10}
    
    Enroll->>Enroll: Check: capacity available (10 < 10) ✗
    Enroll-->>Gateway: 400 Bad Request<br/>"Event has reached maximum capacity"
    Gateway-->>User2: Enrollment failed - Event full
    
    Note over User1,Redis: Critical Section Protected by:<br/>1. Database Transaction with Row-Level Locking<br/>2. Isolation Level: READ COMMITTED<br/>3. Atomic Operations
```

**Concurrency Control Mechanisms:**
1. **Row-Level Locking**: `SELECT ... FOR UPDATE` prevents race conditions
2. **Database Transactions**: ACID guarantees
3. **Isolation Level**: READ COMMITTED prevents dirty reads
4. **Atomic Operations**: Enrollment + participant count update in single transaction
5. **Redis Counter**: Optional fast check for capacity

---

## 6. Sequence Diagram - Real-Time Chat Communication

**Purpose:** Shows WebSocket communication for real-time messaging.

```mermaid
sequenceDiagram
    actor Organizer as 👤 Organizer
    actor Participant as 👤 Participant
    participant Browser as 🌐 Browser
    participant Gateway as 🚪 API Gateway
    participant Chat as 💬 Chat Service<br/>(Socket.IO)
    participant Mongo as 🍃 MongoDB
    participant Auth as 🔐 Auth Service
    participant Enroll as ✅ Enrollment Service
    
    Note over Organizer,Enroll: Phase 1: WebSocket Connection Setup
    
    Organizer->>Browser: Open event page
    Browser->>Chat: Connect WebSocket<br/>ws://localhost:3004<br/>auth: {token: "Bearer ..."}
    Chat->>Chat: Socket.IO handshake
    Chat->>Chat: Verify JWT token<br/>(socketAuth middleware)
    Chat->>Chat: Extract user from token<br/>{id, email, role}
    Chat-->>Browser: Connection accepted (socket.id)
    Chat->>Browser: Join room: user:{organizerId}
    
    Participant->>Browser: Open event page
    Browser->>Chat: Connect WebSocket<br/>auth: {token: "Bearer ..."}
    Chat->>Chat: Verify JWT token
    Chat-->>Browser: Connection accepted
    Chat->>Browser: Join room: user:{participantId}
    
    Note over Organizer,Enroll: Phase 2: Join Event Chat Room
    
    Participant->>Browser: Click "Join Event Chat"
    Browser->>Chat: emit('join-event-room', {eventId: 10})
    
    Chat->>Auth: HTTP GET /api/v1/auth/users/{participantId}
    Auth-->>Chat: User details
    
    Chat->>Enroll: HTTP GET /enrollments/check/10/{participantId}
    Enroll-->>Chat: {enrolled: true, status: "Confirmed"}
    
    Chat->>Chat: Verify access: enrolled ✓
    
    Chat->>Mongo: findOne({eventId: 10, type: "GROUP"})
    Mongo-->>Chat: Conversation found
    
    Chat->>Mongo: Update: Add participant to conversation
    Mongo-->>Chat: Updated
    
    Chat->>Browser: Join Socket.IO room: event:10
    Chat->>Browser: emit('joined-event-room', {conversationId, eventId})
    Chat->>Organizer: emit('user-joined', {userId, userName, role})
    
    Note over Organizer,Mongo: Phase 3: Real-Time Messaging
    
    Participant->>Browser: Type message
    Browser->>Chat: emit('send-message', {<br/>  conversationId,<br/>  content: "What time does the event start?"<br/>})
    
    Chat->>Mongo: db.messages.insertOne({<br/>  conversationId,<br/>  senderId,<br/>  content,<br/>  type: "TEXT",<br/>  timestamp<br/>})
    Mongo-->>Chat: Message saved {_id}
    
    Chat->>Mongo: Update conversation.lastMessage
    Mongo-->>Chat: Updated
    
    Chat->>Browser: emit('message-sent', {messageId})
    Chat->>Organizer: emit('new-message', {message})
    
    Note over Organizer,Mongo: Phase 4: Organizer Reply
    
    Organizer->>Browser: Type reply
    Browser->>Chat: emit('send-message', {<br/>  conversationId,<br/>  content: "Event starts at 2 PM"<br/>})
    
    Chat->>Mongo: Save message
    Mongo-->>Chat: Saved
    
    Chat->>Browser: emit('message-sent', {messageId})
    Chat->>Participant: emit('new-message', {message})
    
    Participant->>Browser: See message in real-time
    
    Note over Organizer,Mongo: Phase 5: Mark as Read
    
    Participant->>Browser: View message
    Browser->>Chat: emit('mark-as-read', {messageIds: [...]})
    Chat->>Mongo: Update: messages.isRead = true
    Mongo-->>Chat: Updated
    Chat->>Organizer: emit('messages-read', {messageIds, userId})
    
    Note over Organizer,Mongo: WebSocket Events:<br/>• send-message → new-message<br/>• join-event-room → user-joined<br/>• typing → user-typing<br/>• mark-as-read → messages-read
```

**WebSocket Communication Patterns:**
- **Bidirectional**: Client and server both emit events
- **Event-Driven**: Socket.IO event handlers
- **Room-Based**: Users join rooms (user rooms, event rooms)
- **Authentication**: JWT token validated on connection
- **Authorization**: Enrollment verified before joining event chat
- **Persistence**: Messages saved to MongoDB
- **Broadcasting**: Messages sent to all users in room

---

## 7. Sequence Diagram - Pre-Enrollment Inquiry System

**Purpose:** Shows the inquiry system for users to contact organizers before enrolling.

```mermaid
sequenceDiagram
    actor User as 👤 Potential Participant
    actor Organizer as 👤 Event Organizer
    participant Browser as 🌐 Browser
    participant Chat as 💬 Chat Service
    participant Event as 📅 Event Service
    participant Mongo as 🍃 MongoDB
    participant Redis as ⚡ Redis
    
    Note over User,Redis: Phase 1: View Published Event (Not Enrolled)
    
    User->>Browser: Browse events
    Browser->>Event: GET /api/v1/events
    Event-->>Browser: List of published events
    User->>Browser: Click event details
    Browser->>Event: GET /api/v1/events/10
    Event-->>Browser: Event details
    
    Note over User,Redis: Phase 2: Send Inquiry (Before Enrollment)
    
    User->>Browser: Click "Ask Organizer"
    Browser->>Browser: Check: Not enrolled yet ✓
    Browser->>Browser: Show inquiry form
    
    User->>Browser: Fill form:<br/>- Subject: "Parking availability?"<br/>- Question: "Is there parking near the venue?"
    
    Browser->>Chat: POST /api/v1/inquiries<br/>Authorization: Bearer {token}<br/>{eventId: 10, subject, question}
    
    Chat->>Chat: Verify JWT token
    Chat->>Chat: Extract user: {id, email, firstName, lastName, role}
    
    Chat->>Event: GET /api/v1/events/10
    Event->>Redis: GET event:10 (Cache check)
    
    alt Cache Hit
        Redis-->>Event: Cached event data
    else Cache Miss
        Event->>Event: Query database
        Event->>Redis: SET event:10 (Cache update)
    end
    
    Event-->>Chat: {eventId: 10, title: "Tech Workshop",<br/>organizerId: 5, status: "Published"}
    
    Chat->>Chat: Validate: status === "Published" ✓
    
    Chat->>Mongo: db.inquiries.insertOne({<br/>  eventId: 10,<br/>  eventTitle: "Tech Workshop",<br/>  organizerId: 5,<br/>  inquirerId: user.id,<br/>  inquirerEmail: user.email,<br/>  inquirerName: user.fullName,<br/>  subject,<br/>  question,<br/>  status: "pending",<br/>  isRead: false<br/>})
    
    Mongo-->>Chat: Inquiry created {_id}
    
    Note over Chat,Organizer: Real-Time Notification to Organizer
    
    Chat->>Chat: Find organizer socket<br/>room: user:5
    Chat->>Organizer: WebSocket emit('inquiry-received', {<br/>  inquiryId,<br/>  eventId,<br/>  from: user.fullName,<br/>  subject,<br/>  question,<br/>  timestamp<br/>})
    
    Chat-->>Browser: 201 Created<br/>{inquiry, message: "Inquiry sent"}
    Browser-->>User: "Your question has been sent to the organizer"
    
    Note over Organizer,Mongo: Phase 3: Organizer Views & Replies
    
    Organizer->>Browser: Notification: "New inquiry received"
    Organizer->>Browser: Click "View Inquiries"
    
    Browser->>Chat: GET /api/v1/inquiries/event/10<br/>Authorization: Bearer {organizerToken}
    Chat->>Chat: Verify: user.id === event.organizerId ✓
    Chat->>Mongo: db.inquiries.find({<br/>  eventId: 10,<br/>  organizerId: 5<br/>}).sort({createdAt: -1})
    Mongo-->>Chat: List of inquiries
    Chat-->>Browser: {inquiries: [...]}
    
    Organizer->>Browser: Click inquiry to read
    
    Browser->>Chat: PATCH /api/v1/inquiries/{inquiryId}/read
    Chat->>Mongo: Update: {isRead: true, readAt: now()}
    Mongo-->>Chat: Updated
    Chat-->>Browser: Success
    
    Organizer->>Browser: Type reply: "Yes, free parking available"
    
    Browser->>Chat: PATCH /api/v1/inquiries/{inquiryId}/reply<br/>{reply: "Yes, free parking available"}
    
    Chat->>Mongo: Update: {<br/>  reply,<br/>  repliedAt: now(),<br/>  status: "replied"<br/>}
    Mongo-->>Chat: Updated
    
    Chat->>Chat: Find user socket<br/>room: user:{userId}
    Chat->>User: WebSocket emit('inquiry-reply-received', {<br/>  inquiryId,<br/>  eventTitle,<br/>  reply,<br/>  repliedBy: "Organizer Name"<br/>})
    
    Chat-->>Browser: 200 OK {inquiry}
    Browser-->>Organizer: "Reply sent"
    
    Note over User,Mongo: Phase 4: User Views Reply
    
    User->>Browser: Notification: "Organizer replied"
    User->>Browser: Click notification
    
    Browser->>Chat: GET /api/v1/inquiries/my-inquiries
    Chat->>Mongo: db.inquiries.find({inquirerId: userId})
    Mongo-->>Chat: User's inquiries
    Chat-->>Browser: {inquiries: [...]}
    
    User->>Browser: Read reply: "Yes, free parking available"
    User->>Browser: Satisfied, now enroll in event
    
    Note over User,Mongo: Key Difference from Chat:<br/>• Inquiries: Pre-enrollment communication<br/>• Chat: Post-enrollment group messaging<br/>• Inquiries: One-to-one (user → organizer)<br/>• Chat: Many-to-many (event participants)
```

**Inquiry System Features:**
- **Pre-Enrollment Communication**: Ask questions before committing
- **REST + WebSocket**: Both APIs available
- **Real-Time Notifications**: Organizers notified instantly
- **Status Tracking**: pending → replied → closed
- **Read Receipts**: Track when organizer viewed inquiry
- **Separation from Chat**: Isolated from enrolled participant chat
- **Event State Validation**: Only for PUBLISHED events

---

## 8. Communication Patterns Diagram

**Purpose:** Shows all communication protocols and patterns used in the system.

```mermaid
graph TB
    subgraph "Client-to-Gateway Communication"
        C1["🌐 Client"]
        C1 -->|"HTTPS REST<br/>(Synchronous)"| GW["🚪 API Gateway<br/>Port 3000"]
        C1 -->|"WSS WebSocket<br/>(Real-time)"| CS["💬 Chat Service<br/>Port 3004"]
    end
    
    subgraph "Gateway-to-Service Communication"
        GW -->|"HTTP Proxy<br/>(http-proxy-middleware)"| AS["🔐 Auth"]
        GW -->|"HTTP Proxy"| ES["📅 Event"]
        GW -->|"HTTP Proxy"| ENS["✅ Enrollment"]
        GW -->|"HTTP Proxy"| CS
    end
    
    subgraph "Service-to-Service Communication (Synchronous)"
        ENS -->|"HTTP GET<br/>Get Event Details"| ES
        ENS -->|"HTTP PATCH<br/>Update Participant Count"| ES
        CS -->|"HTTP GET<br/>Verify User"| AS
        CS -->|"HTTP GET<br/>Check Enrollment"| ENS
        CS -->|"HTTP GET<br/>Get Event Info"| ES
    end
    
    subgraph "Service-to-Database Communication"
        AS -->|"Sequelize ORM<br/>TCP Connection"| PG["🐘 PostgreSQL"]
        ES -->|"Sequelize ORM"| PG
        ENS -->|"Sequelize ORM"| PG
        CS -->|"Mongoose ODM<br/>MongoDB Protocol"| MG["🍃 MongoDB"]
        
        ES -->|"ioredis Client<br/>RESP Protocol"| RD["⚡ Redis"]
        ENS -->|"ioredis Client"| RD
        CS -->|"ioredis Client"| RD
    end
    
    subgraph "Real-Time Communication (Asynchronous)"
        CS -->|"Socket.IO Events<br/>WebSocket Protocol"| C1
        CS -->|"Redis Pub/Sub<br/>(Future: Horizontal Scaling)"| RD
    end
    
    subgraph "Authentication & Context Propagation"
        C1 -->|"Authorization: Bearer {JWT}"| GW
        GW -->|"X-User-Id<br/>X-User-Email<br/>X-User-Role"| AS
        GW -->|"Custom Headers"| ES
        GW -->|"Custom Headers"| ENS
        GW -->|"Custom Headers"| CS
    end
    
    style GW fill:#FF5722,stroke:#D84315,stroke-width:2px,color:#fff
    style AS fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    style ES fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    style ENS fill:#9C27B0,stroke:#6A1B9A,stroke-width:2px,color:#fff
    style CS fill:#FF9800,stroke:#E65100,stroke-width:2px,color:#fff
    style PG fill:#336791,stroke:#1a3a52,stroke-width:2px,color:#fff
    style MG fill:#4DB33D,stroke:#2d6b24,stroke-width:2px,color:#fff
    style RD fill:#DC382D,stroke:#8a211b,stroke-width:2px,color:#fff
```

**Communication Protocols:**

| Protocol | Use Case | Service Pairs | Purpose |
|----------|----------|---------------|---------|
| **HTTPS REST** | Client ↔ Gateway | Client → API Gateway | Synchronous API calls |
| **WSS (WebSocket)** | Real-time | Client ↔ Chat Service | Bidirectional messaging |
| **HTTP** | Service-to-Service | Enrollment → Event, Chat → Auth | Synchronous service calls |
| **TCP** | Database | Services → PostgreSQL | Persistent connections |
| **MongoDB Protocol** | Database | Chat → MongoDB | Document operations |
| **RESP** | Cache | Services → Redis | Cache & distributed locks |
| **Socket.IO** | Real-time | Chat ↔ Clients | Event-driven messaging |

**Context Propagation:**
- **JWT Token**: Client sends in `Authorization` header
- **Gateway Extracts**: User ID, email, role from token
- **Custom Headers**: `X-User-Id`, `X-User-Email`, `X-User-Role`
- **Services Read**: Extract user context from headers
- **Stateless**: No session storage needed

---

## 9. Architecture Patterns Overview

**Purpose:** Documents all architectural patterns used in the system.

```mermaid
mindmap
  root((MOV Architecture<br/>Patterns))
    Microservices
      Service Independence
      Single Responsibility
      Decentralized Data
      Independent Deployment
    API Gateway
      Single Entry Point
      Request Routing
      Cross-Cutting Concerns
      Rate Limiting
    Data Management
      Polyglot Persistence
      PostgreSQL ACID
      MongoDB Flexible
      Redis Cache/Locks
    Authentication
      JWT Tokens
      Stateless
      RBAC
      Bearer Headers
    Communication
      HTTP/REST Sync
      WebSocket Async
      Service-to-Service
      Socket.IO Events
    Concurrency Control
      Row-Level Locking
      DB Transactions
      Distributed Locks
      ACID Guarantees
    Caching
      Cache-Aside
      Read-Through
      Redis TTL
      Event Caching
    State Machine
      Event Lifecycle
      Planning → Published
      Published → Running
      Running → Completed
    Resilience
      Circuit Breaker
      Timeout Handling
      Graceful Degradation
      Error Propagation
    Data Access
      Repository Pattern
      Sequelize ORM
      Mongoose ODM
      Abstraction Layer
```

### Pattern Details

#### 1. **Microservices Architecture**
- **Implementation**: 5 independent services (Auth, Event, Enrollment, Chat, Notification)
- **Benefits**: 
  - Independent scaling (scale Enrollment during peak registration)
  - Independent deployment (deploy Event service without affecting Chat)
  - Technology flexibility (Node.js for all, but can mix languages)
  - Team independence (separate teams per service)
- **Trade-offs**: Increased complexity, distributed system challenges

#### 2. **API Gateway Pattern**
- **Implementation**: Express.js with `http-proxy-middleware`
- **Responsibilities**:
  - Rate limiting (100 req/15min per IP)
  - CORS handling
  - JWT verification
  - Request routing
  - Swagger documentation hosting
- **Benefits**: Single entry point, centralized cross-cutting concerns

#### 3. **Database Per Service (Polyglot Persistence)**
- **PostgreSQL**: ACID transactions for Auth, Events, Enrollments
- **MongoDB**: Flexible schema for Chat messages, Conversations, Inquiries
- **Redis**: In-memory cache for events, distributed locks, pub/sub
- **Benefits**: Optimized database per use case, no single point of failure

#### 4. **JWT Token-Based Authentication**
- **Implementation**: `jsonwebtoken` library, 24-hour expiration
- **Flow**: Login → Receive token → Include in Authorization header
- **Benefits**: Stateless, scalable, no server-side session storage
- **Security**: bcrypt password hashing (10 salt rounds), HTTPS only

#### 5. **Communication Patterns**
- **Synchronous (HTTP/REST)**: Client ↔ Gateway, Service ↔ Service
- **Asynchronous (WebSocket)**: Real-time chat, notifications
- **Event-Driven**: Socket.IO events (send-message, join-room, typing)
- **Request/Response**: REST APIs for CRUD operations

#### 6. **Concurrency Control**
- **Row-Level Locking**: `SELECT ... FOR UPDATE` prevents double enrollment
- **Database Transactions**: ACID guarantees for enrollment + participant count update
- **Isolation Level**: READ COMMITTED prevents dirty reads
- **Distributed Lock**: Redis for cross-service synchronization (future)

#### 7. **Caching Strategy (Cache-Aside)**
- **Pattern**: Check cache → If miss, query DB → Update cache
- **Implementation**: Redis with TTL expiration
- **Cached Data**: Event details, user profiles (future)
- **Invalidation**: Update/delete triggers cache eviction

#### 8. **State Machine Pattern (Event Lifecycle)**
- **States**: Planning → Published → Running → Completed → Canceled
- **Transitions**: Enforced by validation logic
- **Rules**:
  - Only PUBLISHED events allow enrollment
  - Only ORGANIZER can change status
  - Cannot revert from COMPLETED to RUNNING
- **Implementation**: `status` field in Event model

#### 9. **Circuit Breaker (Implicit)**
- **Timeout Handling**: HTTP requests timeout after 30 seconds
- **Graceful Degradation**: Service failures don't cascade (enrollment success even if count update fails)
- **Error Propagation**: Service errors wrapped in consistent error format
- **Retry Logic**: Axios retry for transient failures (future)

#### 10. **Repository Pattern (ORM/ODM)**
- **Sequelize (PostgreSQL)**: Models define schema, migrations manage changes
- **Mongoose (MongoDB)**: Schemas with validation, middleware hooks
- **Benefits**: Data access abstraction, business logic separation
- **Models**: User, Event, Enrollment, Conversation, Message, Inquiry

---

## External API Access Summary

### Public APIs (No Authentication)
- `GET /api/v1/events` - View published events
- `GET /api/v1/events/{id}` - View event details
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### Authenticated APIs (JWT Required)
- `GET /api/v1/auth/me` - Get profile
- `POST /api/v1/events` - Create event (ORGANIZER only)
- `POST /api/v1/enrollments` - Enroll in event (PARTICIPANT only)
- `GET /api/v1/chat/conversations` - Get conversations
- WebSocket connection to `ws://localhost:3004` for real-time chat

### Service-to-Service APIs (Internal)
- `GET /api/v1/auth/users/{id}` - Get user by ID
- `PATCH /api/v1/events/{id}/participants` - Update participant count
- `GET /api/v1/enrollments/check/{eventId}/{userId}` - Check enrollment status

### Management Tools
- **Swagger UI**: `http://localhost:3000/api-docs` - API documentation
- **pgAdmin**: `http://localhost:5050` - PostgreSQL management
- **Mongo Express**: `http://localhost:8081` - MongoDB management

---

## Summary

This document provides comprehensive UML diagrams defining the MOV Event Management System architecture:

1. **System Context**: High-level system boundaries and external actors
2. **Container Diagram**: All microservices, databases, and communication channels
3. **Deployment**: Docker containerization and network architecture
4. **Sequence Diagrams**: Key user flows with detailed interactions
5. **Communication Patterns**: All protocols and data flow patterns
6. **Architecture Patterns**: Design patterns implemented throughout

**Key Architectural Characteristics:**
- ✅ **Microservices Architecture** with 5 independent services
- ✅ **API Gateway Pattern** for single entry point and routing
- ✅ **Polyglot Persistence** (PostgreSQL, MongoDB, Redis)
- ✅ **JWT Authentication** for stateless auth
- ✅ **WebSocket (Socket.IO)** for real-time communication
- ✅ **Docker Compose** for orchestration
- ✅ **Concurrency Control** via database transactions and locks
- ✅ **State Machine** for event lifecycle management
- ✅ **Cache-Aside Pattern** for performance optimization
- ✅ **Repository Pattern** with ORM/ODM abstraction

**Communication Channels:**
- HTTP/HTTPS for REST APIs (synchronous)
- WebSocket (Socket.IO) for real-time chat (asynchronous)
- Custom headers for user context propagation
- Service-to-service HTTP calls for data coordination

**Patterns Used:**
- Microservices, API Gateway, Database per Service
- JWT Token-Based Auth, RBAC
- Row-Level Locking, Distributed Transactions
- Cache-Aside, State Machine
- Repository, Circuit Breaker (implicit)

---

*Generated: January 25, 2026*  
*Project: MOV Event Management System*  
*Architecture: Microservices with Docker Compose*
