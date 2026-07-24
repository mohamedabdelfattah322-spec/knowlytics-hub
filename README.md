# 🎓 Knowlytics Hub — Smart LMS Platform

A production-ready hybrid Learning Management System supporting **live courses**, **recorded video**, **Duolingo-style quizzes**, and **advanced security**.

---

## 🏗 Architecture Overview

```
knowlytics-hub/
├── backend/          # Node.js + Express REST API
│   ├── src/
│   │   ├── app.js               ← Express entry point
│   │   ├── config/
│   │   │   ├── database.js      ← PostgreSQL pool
│   │   │   └── aws.js           ← S3 client + signed URLs
│   │   ├── middleware/
│   │   │   ├── auth.js          ← JWT verification + role guard
│   │   │   ├── sessionGuard.js  ← Device/IP session enforcement
│   │   │   └── errorHandler.js
│   │   ├── routes/              ← auth, courses, lessons, quizzes,
│   │   │                          enrollments, admin, files, zoom
│   │   ├── controllers/         ← Business logic per domain
│   │   └── services/
│   │       ├── emailService.js  ← Nodemailer transactional emails
│   │       └── cronJobs.js      ← Inactivity reminders, session cleanup
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seeds/
│       └── sample_data.sql
│
└── frontend/         # Next.js 14 App Router + Tailwind CSS
    ├── app/
    │   ├── page.tsx                    ← Public landing page
    │   ├── (auth)/login | register     ← Auth pages
    │   ├── (dashboard)/
    │   │   ├── admin/                  ← Admin: dashboard, courses, users,
    │   │   │                               analytics, sessions
    │   │   └── student/                ← Student: overview, courses, progress
    │   └── courses/[id]/
    │       ├── page.tsx                ← Course detail + enroll
    │       ├── lessons/[lessonId]/     ← Video player with watermark
    │       └── quiz/[quizId]/          ← Duolingo-style quiz
    ├── components/
    │   ├── layout/Sidebar.tsx
    │   ├── ui/ (Modal, ProgressRing, LoadingSpinner)
    │   ├── course/VideoPlayer.tsx      ← Watermarked secure player
    │   └── quiz/QuizCard.tsx
    ├── hooks/useAuth.ts               ← Zustand auth store
    └── lib/
        ├── api.ts                     ← Axios + auto JWT inject
        ├── auth.ts
        └── utils.ts
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| PostgreSQL | ≥ 14 |
| npm | ≥ 9 |
| AWS S3 bucket | (or use MinIO for local) |

---

### 1 — Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2 — Configure Environment Variables

**Backend** — copy and edit:
```bash
cp backend/.env.example backend/.env
```

Minimum required fields:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=knowlytics_hub
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=change_this_to_a_32_char_random_string

AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

SMTP_HOST=smtp.gmail.com
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
```

**Frontend** — copy and edit:
```bash
cp frontend/.env.local.example frontend/.env.local
```
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### 3 — Create the Database

```sql
-- In psql:
CREATE DATABASE knowlytics_hub;
```

---

### 4 — Run Database Migrations

```bash
cd backend
npm run migrate
```

This runs `migrations/001_initial_schema.sql` which creates all tables, indexes, enums, and triggers.

---

### 5 — Seed Sample Data

```bash
npm run seed
```

Creates:
- 1 admin user
- 3 sample students
- 3 published courses with sections, lessons, quizzes & answers
- Sample enrollments

**Login credentials (all passwords: `Password123!`)**

| Role | Email |
|------|-------|
| Admin | admin@knowlytics.com |
| Student (online) | sara@example.com |
| Student (live) | omar@example.com |

---

### 6 — Start the Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

Visit → **http://localhost:3000**

---

## 🗄 Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | All users (admin / student). `student_type`: live or online |
| `sessions` | JWT session tracking — enforces max-device limit, IP guard |
| `courses` | Course catalog — type: online / live / hybrid |
| `sections` | Course sections (ordered chapters) |
| `lessons` | Lessons within sections — video, text, quiz, zoom, assignment |
| `enrollments` | Student ↔ Course relationship + `progress_pct` |
| `lesson_progress` | Per-lesson completion tracking |
| `quizzes` | Quiz per section |
| `quiz_questions` | Questions with point values |
| `quiz_answers` | Answer options — `is_correct` flag |
| `quiz_attempts` | Student attempts with `score_pct` and `level` |
| `course_files` | Uploaded PDFs / files — stored on S3, accessed via signed URLs |
| `notifications` | In-app + email notification log |
| `zoom_meetings` | Zoom meeting records + recording URL (webhook updated) |
| `assignments` | Assignment definitions per lesson |
| `assignment_submissions` | Student file submissions + grades |

### Key Relationships

```
users ──< enrollments >── courses
courses ──< sections ──< lessons
lessons ──< lesson_progress
sections ──< quizzes ──< quiz_questions ──< quiz_answers
users ──< quiz_attempts
users ──< sessions
courses ──< zoom_meetings
```

---

## 🔐 Security Features

### Session Management
- **Max 2 sessions per user** (configurable via `MAX_SESSIONS_PER_USER`)
- On login: if limit exceeded, **oldest session is auto-revoked**
- On suspend (admin): **all sessions revoked instantly**

### IP Guard
- Every authenticated request checks the token's stored IP
- If IP changes (non-local), session is **immediately revoked**
- Response: `401 IP_MISMATCH` → frontend redirects to login

### Video Protection
- Videos stored in **private S3 bucket** (no public ACL)
- Served via **pre-signed URLs** (1-hour expiry)
- `controlsList="nodownload"` + right-click disabled on player
- **Dual watermark**: corner (email + timestamp) + diagonal overlay
- `Content-Security-Policy` restricts media sources

### Other
- `helmet` security headers on all API responses
- `express-rate-limit` on all routes (100 req / 15 min)
- JWT stored in `httpOnly`-safe cookie via `js-cookie`
- Role middleware (`admin` / `student`) guards all sensitive routes
- Enrollment check before every lesson/file access

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → JWT token |
| POST | `/api/auth/logout` | Revoke session |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/change-password` | Update password |

### Courses
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/courses` | Public |
| GET | `/api/courses/:id` | Public |
| POST | `/api/courses` | Admin |
| PUT | `/api/courses/:id` | Admin |
| DELETE | `/api/courses/:id` | Admin |
| GET | `/api/courses/:id/analytics` | Admin |

### Lessons
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/lessons/:id` | Enrolled / Admin |
| POST | `/api/lessons/:id/complete` | Student |
| POST | `/api/lessons` | Admin |
| PUT | `/api/lessons/:id` | Admin |
| DELETE | `/api/lessons/:id` | Admin |

### Quizzes (Duolingo-style)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/quizzes/:id` | Enrolled |
| POST | `/api/quizzes/:id/submit` | Enrolled |
| GET | `/api/quizzes/:id/results` | Enrolled |
| POST | `/api/quizzes` | Admin |

### Enrollments
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/enrollments` | Student |
| GET | `/api/enrollments/my` | Student |
| GET | `/api/enrollments/course/:id` | Admin |
| DELETE | `/api/enrollments/:id` | Admin |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Platform stats |
| GET | `/api/admin/users` | User list |
| PATCH | `/api/admin/users/:id` | Update / suspend |
| DELETE | `/api/admin/users/:id` | Delete user |
| POST | `/api/admin/sections` | Add section |
| GET | `/api/admin/sessions` | Active sessions |

### Files
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/files/upload` | Admin (multipart) |
| GET | `/api/files/:id/download` | Enrolled (signed URL) |
| GET | `/api/files/course/:id` | Enrolled |
| DELETE | `/api/files/:id` | Admin |

### Zoom
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/zoom/meetings` | Admin |
| GET | `/api/zoom/meetings/course/:id` | Enrolled |
| POST | `/api/zoom/webhook` | Zoom (public) |

---

## 🧪 Quiz System — How It Works

1. Admin creates a quiz with questions + 4 answers each (1 marked correct)
2. Student opens quiz → questions loaded **without** correct-answer flags
3. Student clicks an answer → locked in, can advance
4. After last question → submitted to `/api/quizzes/:id/submit`
5. API scores all answers, returns:
   - `score_pct` (0–100)
   - `level` (Beginner / Intermediate / Advanced)
   - Per-question `feedback` with correct answer revealed
6. Full results screen with animated score ring + breakdown

---

## 📧 Email Triggers (Cron-based)

| Trigger | When |
|---------|------|
| Enrollment confirmation | Immediately on enroll |
| Course completion | When `progress_pct` hits 100 |
| Inactivity reminder | Daily at 09:00 — if no activity in 7+ days |
| Live session scheduled | When admin creates Zoom meeting |

---

## 🚀 Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong random `JWT_SECRET` (≥ 32 chars)
- [ ] Configure real AWS S3 bucket with private ACL
- [ ] Enable HTTPS (reverse proxy: nginx / Caddy)
- [ ] Set `FRONTEND_URL` to your real domain in backend `.env`
- [ ] Configure Zoom webhook URL in Zoom app settings → `/api/zoom/webhook`
- [ ] Set up PostgreSQL connection pooling (PgBouncer for scale)
- [ ] Add Redis for session store at scale (replace `pg` session table)
- [ ] Configure SMTP with a transactional provider (SendGrid / Postmark)
- [ ] Run `npm run build` in frontend and serve with `npm start`

---

## 🛠 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| State | Zustand + React Query |
| Charts | Recharts |
| Backend | Node.js, Express 4 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Database | PostgreSQL 14+ (pg driver) |
| Storage | AWS S3 + pre-signed URLs |
| Email | Nodemailer (SMTP) |
| Video | HLS-ready signed S3 streaming |
| Live | Zoom Server-to-Server OAuth API |
| Security | Helmet, CORS, Rate-limit, IP guard |

---

*Built with ❤️ — Knowlytics Hub © 2025*
