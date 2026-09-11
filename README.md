# ProjectHub — Real-Time Client Project Dashboard

A full-stack web application for agency teams to manage client projects, track task progress, and monitor activity in real time. Built with role-based access control, WebSocket-powered live feeds, and background job scheduling.

![ProjectHub](https://img.shields.io/badge/TypeScript-React%20%2B%20Express-blue) ![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791) ![Socket.io](https://img.shields.io/badge/Real--Time-Socket.io-25c2a0)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or Docker)
- npm or yarn

### 1. Clone & Install

```bash
git clone <repo-url>
cd internship

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Database Setup

**Option A — Docker (Recommended)**
```bash
# From project root
docker-compose up -d
```

**Option B — Local PostgreSQL**
Create a database manually and update `server/.env` with your connection string.

### 3. Environment Variables

```bash
# Copy the example env file
cp server/.env.example server/.env
# Edit with your values if needed
```

### 4. Database Migration & Seed

```bash
cd server

# Run migrations
npx prisma migrate dev --name init

# Seed the database with demo data
npx prisma db seed
```

### 5. Run the Application

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Prisma Studio**: `cd server && npx prisma studio`

### Demo Accounts

All passwords: `password123`

| Role | Email | Name |
|------|-------|------|
| Admin | admin@agency.com | Arjun Mehta |
| Project Manager | priya@agency.com | Priya Sharma |
| Project Manager | rahul@agency.com | Rahul Gupta |
| Developer | ravi@agency.com | Ravi Kumar |
| Developer | sneha@agency.com | Sneha Patel |
| Developer | amit@agency.com | Amit Singh |
| Developer | neha@agency.com | Neha Reddy |

---

## 📐 Architecture

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18 + TypeScript + Vite | Type-safe UI with fast HMR |
| **State** | Zustand | Lightweight, hooks-first state management |
| **Backend** | Express + TypeScript | Mature ecosystem, excellent middleware support |
| **Database** | PostgreSQL + Prisma ORM | Relational integrity, type-safe queries |
| **Real-Time** | Socket.io | Built-in rooms, auto-reconnect, TypeScript events |
| **Background Jobs** | node-cron | Zero-dependency scheduled tasks |
| **Auth** | JWT (access + refresh) | Stateless, HttpOnly cookie refresh tokens |
| **Validation** | Zod | Schema-first, TypeScript-native validation |

### Key Architectural Decisions

#### Why Socket.io over native WebSocket?
Socket.io's **room abstraction** maps perfectly to our access model. Each project gets a room — admins join all rooms + a global feed room, PMs join only their project rooms, and developers join rooms for projects they're assigned to. This means role-filtered event delivery happens at the transport layer, not in application code. Native WebSocket would require implementing room management, reconnection logic, and event acknowledgment from scratch.

#### Why node-cron over BullMQ?
The only background job is a periodic overdue task check (every 5 minutes). BullMQ adds a Redis dependency for a single cron query. node-cron runs in-process with zero infrastructure overhead and handles this use case perfectly. If the app needed job queues with retries, priority, or rate limiting, BullMQ would be the right call.

#### Why Express over Fastify?
Express has the most mature auth middleware ecosystem. For this project, the performance bottleneck is database I/O and WebSocket throughput — not HTTP routing. Express's `cookie-parser`, `cors`, and error handling middleware just work out of the box.

#### Token Storage Strategy
- **Access token** (15 min TTL): stored in Zustand memory — never in localStorage, never in cookies
- **Refresh token** (7 day TTL): stored in an `HttpOnly, Secure, SameSite=Strict` cookie — inaccessible to JavaScript, immune to XSS

---

## 🗄️ Database Schema

### Models

```
User ──┬── Project (created by)
       ├── Task (assigned to)
       ├── ActivityLog (performed by)
       └── Notification (for)

Client ──── Project

Project ──┬── Task
          └── ActivityLog

Task ──┬── ActivityLog
       └── Notification
```

### Indexing Decisions

| Index | Column(s) | Reason |
|-------|-----------|--------|
| `tasks_projectId` | `Task.projectId` | Every project page queries tasks by project |
| `tasks_assignedToId` | `Task.assignedToId` | Developer dashboard filters by assigned user |
| `tasks_status` | `Task.status` | Filtering in dashboards and task lists |
| `tasks_dueDate` | `Task.dueDate` | Overdue cron job: `WHERE dueDate < NOW()` |
| `tasks_isOverdue` | `Task.isOverdue` | Dashboard overdue count |
| `activity_logs_projectId` | `ActivityLog.projectId` | Activity feed is always scoped by project |
| `activity_logs_createdAt` | `ActivityLog.createdAt` | Feed ordered by recency + catchup queries |
| `notifications_userId_isRead` | `(userId, isRead)` | **Composite index** — hot path for unread notifications |

---

## 🔐 Role-Based Access Control

Access is enforced at **two levels**:

1. **Route middleware** (`requireRole`): blocks the request before it reaches the controller
2. **Service layer**: verifies ownership (e.g., PM can only edit their own projects)

| Action | Admin | PM | Developer |
|--------|-------|----|-----------|
| View all projects | ✅ | ❌ (own only) | ❌ (assigned only) |
| Create project | ✅ | ✅ | ❌ |
| Edit any project | ✅ | ❌ (own only) | ❌ |
| Delete project | ✅ | ❌ | ❌ |
| Create tasks | ✅ | ✅ (own projects) | ❌ |
| Update task status | ✅ | ✅ (own projects) | ✅ (assigned only) |
| View all activity | ✅ | ❌ (own projects) | ❌ (own tasks) |
| Manage users | ✅ | ❌ | ❌ |
| Manage clients | ✅ | View only | ❌ |

---

## 📡 Real-Time Architecture

### Socket.io Room Structure

```
global-feed       → Admin only (sees all activity)
project:{id}      → All users viewing that project
user:{userId}     → Personal notifications
```

### Event Flow

1. User updates task status → REST API call
2. Server updates DB → creates ActivityLog entry
3. Server emits `task:statusChanged` to `project:{projectId}` room
4. Server emits same event to `global-feed` room (for admins)
5. If notification is triggered, emits `notification:new` to `user:{targetUserId}`
6. All connected clients in the room receive the update in real time

### Missed Event Catchup

When a user reconnects, the server queries the last 20 activity events from the database, filtered by their role, and emits them as an `activity:catchup` batch. This is a DB query — not an in-memory cache.

---

## ⏰ Background Jobs

### Overdue Task Checker

- **Schedule**: Every 5 minutes via `node-cron`
- **Query**: `WHERE dueDate < NOW() AND status != 'DONE' AND isOverdue = false`
- **Actions**:
  - Sets `isOverdue = true` on the task
  - Creates an ActivityLog entry
  - Creates Notifications for the assigned developer and the project's PM
  - Emits socket events for online users

---

## Known Limitations

1. **No drag-and-drop** on the Kanban board — status changes are via button clicks
2. **No file uploads** — tasks don't support attachments
3. **Single-instance only** — node-cron doesn't coordinate across multiple server instances (would need BullMQ for horizontal scaling)
4. **No email notifications** — only in-app notifications
5. **Refresh token is not rotated** on use — a production system should issue a new refresh token on each refresh
