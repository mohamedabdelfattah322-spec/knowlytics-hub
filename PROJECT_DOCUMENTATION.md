# Knowlytics Hub - LMS Platform Documentation

**Last Updated:** June 4, 2026  
**Version:** 1.0.0  
**Status:** Live (learn.knowlyticshub.com)

---

## 📋 Project Overview

**Knowlytics Hub** هي منصة تعليمية متكاملة (LMS) مبنية على **Next.js 14** و**Express.js** مع **PostgreSQL** كقاعدة بيانات.

المنصة توفر:
- 🎓 نظام كورسات شامل (أونلاين / مباشر / مدفوع / مجاني)
- 👥 نظام المتدربين والمدربين
- 💬 نظام الأسئلة والإجابات
- 👨‍🏫 نظام الاستشارات المدفوعة
- 🎨 مجتمع المتدربين (Facebook-style)
- 🌙 Dark/Light/Mixed Theme Support
- 🌍 دعم كامل للعربية والإنجليزية (RTL/LTR)
- 📊 Analytics و Dashboard للـ Admin
- 🎖️ نظام الشهادات والـ Badges
- 🛒 نظام الدفع (تحت التطوير)

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Lucide Icons
- **State Management:** React Hooks + Context API
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase)
- **Authentication:** JWT + Session Guards
- **Rate Limiting:** express-rate-limit
- **Password Hashing:** bcrypt

### DevOps
- **Hosting:** VPS (209.38.230.90)
- **Process Manager:** PM2
- **Version Control:** Git + GitHub
- **Build Tool:** npm

---

## 📁 Project Structure

```
D:/lms/
├── backend/
│   ├── src/
│   │   ├── app.js                          # Express app entry
│   │   ├── config/
│   │   │   └── database.js                 # PostgreSQL connection
│   │   ├── middleware/
│   │   │   ├── auth.js                     # JWT + role authorization
│   │   │   └── sessionGuard.js             # Session security
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── courseController.js
│   │   │   ├── enrollmentController.js
│   │   │   └── ...
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── courses.js
│   │       ├── enrollments.js
│   │       ├── instructors.js              # NEW: Instructor profiles
│   │       ├── consultations.js            # NEW: Consultation booking
│   │       └── community.js                # NEW: Community posts
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                        # Landing page (redesigned)
│   │   ├── globals.css                     # Theme variables + utilities
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       ├── admin/
│   │   │       │   ├── instructors/        # NEW: Manage instructors
│   │   │       │   ├── consultations/      # NEW: Manage consultations
│   │   │       │   ├── courses/
│   │   │       │   ├── users/
│   │   │       │   ├── analytics/
│   │   │       │   └── ...
│   │   │       └── student/
│   │   │           ├── courses/
│   │   │           ├── progress/
│   │   │           ├── badges/
│   │   │           └── ...
│   │   ├── courses/
│   │   │   ├── page.tsx                    # Courses listing
│   │   │   └── [id]/
│   │   │       ├── page.tsx                # Course detail (+ consultation booking)
│   │   │       ├── buy/
│   │   │       ├── lessons/
│   │   │       └── quiz/
│   │   ├── about/page.tsx                  # Instructor profiles
│   │   ├── companies/page.tsx              # Companies trained
│   │   ├── reviews/page.tsx                # Student reviews
│   │   ├── contact/page.tsx                # Contact form
│   │   └── community/page.tsx              # NEW: Community feed
│   ├── components/
│   │   ├── PublicNavbar.tsx                # Navbar (updated: light/dark theme)
│   │   ├── PublicFooter.tsx                # Footer (updated: CSS vars)
│   │   ├── ConsultationSection.tsx         # NEW: Booking form
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx                 # Dashboard sidebar
│   │   │   ├── Navbar.tsx
│   │   │   └── ...
│   │   └── course/
│   │       ├── ReviewSection.tsx
│   │       ├── LessonPlayer.tsx
│   │       └── ...
│   ├── hooks/
│   │   ├── useAuth.ts                      # Auth context hook
│   │   ├── useLanguage.ts                  # I18n hook
│   │   ├── useTheme.ts                     # Theme hook
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts                          # Axios instance
│   │   ├── auth.ts                         # Auth utilities
│   │   ├── utils.ts                        # Helpers
│   │   └── i18n.ts                         # i18n config
│   └── public/
│       ├── company-logos/                  # Company images
│       ├── logo-nav-w.png
│       └── ...
│
└── DATABASE/
    └── migrations/                         # SQL migrations
        ├── 001_initial_schema.sql
        ├── 002_courses_table.sql
        ├── 015_consultations_community.sql # NEW
        └── ...
```

---

## 🎯 Key Features Completed

### 1. Landing Page Redesign ✅
- **File:** `D:\lms\frontend\app\page.tsx`
- **Changes:**
  - Removed: Reviews section, Companies trained section, Founder info
  - Added: Hero with promo video, Featured courses grid, FAQ section, CTA
  - Styling: Dark theme with Tailwind CSS
  - Language: Arabic/English support

### 2. Instructor Profiles System ✅
- **Files:**
  - Backend: `D:\lms\backend\src\routes\instructors.js`
  - Frontend Admin: `D:\lms\frontend\app\(dashboard)\dashboard\admin\instructors\page.tsx`
  - Public: `D:\lms\frontend\app\about\page.tsx`
  
- **Features:**
  - Admin can add/edit/delete instructor profiles
  - Fields: Name (EN/AR), Title (EN/AR), Bio (EN/AR), Photo, Experience years, Trainees count, Rating, Specialties array, LinkedIn URL, YouTube URL
  - Public page displays instructor cards with all info
  - Courses automatically link to instructors
  - `courses` table has `instructor_profile_id` foreign key

### 3. Public Pages Created ✅
- **Pages:**
  - `/companies` - Companies trained section
  - `/reviews` - Student testimonials
  - `/about` - Instructor profiles gallery
  - `/contact` - Contact form (mock, no email backend yet)

### 4. Theme System (Dark/Light/Mixed) ✅
- **Files:** `D:\lms\frontend\app\globals.css`
- **Implementation:**
  - CSS variables approach (safe, no hydration issues)
  - Variables defined in `:root`, `[data-theme="dark"]`, `[data-theme="light"]`
  - Utility classes: `.pub-text`, `.pub-accent`, `.pub-bg`, etc.
  - Theme toggle button in PublicNavbar
  - localStorage persistence
  
- **Color Palettes:**
  - Dark (default): Navy blue background with light text
  - Light: White background with dark text
  - Both include accent colors, borders, etc.

### 5. Consultation Booking System ✅
- **Files:**
  - Backend: `D:\lms\backend\src\routes\consultations.js`
  - Frontend: `D:\lms\frontend\components\ConsultationSection.tsx`
  - Admin: `D:\lms\frontend\app\(dashboard)\dashboard\admin\consultations\page.tsx`
  
- **Database Tables:**
  - `consultation_types` - Per-instructor consultation offerings
  - `consultation_bookings` - Booking submissions
  
- **Features:**
  - Each instructor can define multiple consultation types
  - Types: "hourly" (per hour pricing) or "project" (flat rate)
  - Booking form collects: name, email, phone, company, description, preferred date
  - Admin dashboard: view all bookings, update status (pending → confirmed → completed)
  - Student sees booking form on course detail pages
  - Auto-hides if no consultations available for that instructor

### 6. Community (Facebook-Style) ✅
- **Files:**
  - Backend: `D:\lms\backend\src\routes\community.js`
  - Frontend: `D:\lms\frontend\app\community\page.tsx`
  
- **Database Tables:**
  - `community_posts` - User posts (content, image_url, likes_count, comments_count, is_pinned)
  - `community_comments` - Comments on posts
  - `community_likes` - Like records
  
- **Features:**
  - Create/read/delete posts (authenticated users only)
  - Like/unlike posts
  - Comment on posts
  - Admin can pin posts to top
  - Responsive design
  - Dark theme with blue accents
  - Multilingual (AR/EN)

### 7. Mobile Responsiveness ✅
- **Dashboard:**
  - Sidebar hidden on mobile (< lg)
  - Hamburger menu to open
  - Overlay to close
  - Click any link to close sidebar
  
- **Public Pages:**
  - Navbar responsive (mobile-friendly)
  - All sections stack on mobile
  - Touch-friendly buttons and inputs

### 8. Free Course Enrollment ✅
- **Feature:**
  - Courses with price = 0 show green "Enroll for Free" button
  - Clicking directly enrolls student (no payment page)
  - `handleEnrollFree()` function in course detail page
  - Updates `enrolled` state immediately
  - Paid courses still go to `/courses/[id]/buy` page

---

## 🗄️ Database Schema

### Core Tables

#### `users`
```sql
id | email | password_hash | name | role | avatar_url | created_at | updated_at
```

#### `courses`
```sql
id | title | description | type (live/online) | price | level | 
thumbnail_url | promo_video_url | instructor_profile_id | created_at
```

#### `instructors`
```sql
id | name | name_ar | title | title_ar | bio | bio_ar | photo_url | 
experience_years | trainees_count | rating | specialties (array) | 
linkedin_url | youtube_url | is_active | created_at
```

#### `consultation_types`
```sql
id | instructor_id | name | name_ar | type (hourly/project) | 
price | duration_minutes | description | description_ar | is_active | created_at
```

#### `consultation_bookings`
```sql
id | consultation_type_id | instructor_id | user_id | name | email | 
phone | company | description | status | preferred_date | notes | 
created_at | updated_at
```

#### `community_posts`
```sql
id | user_id | content | image_url | likes_count | comments_count | 
is_pinned | created_at | updated_at
```

#### `community_comments`
```sql
id | post_id | user_id | content | created_at
```

#### `community_likes`
```sql
post_id | user_id | created_at
```

---

## 🚀 API Endpoints

### Public Endpoints

#### Instructors
```
GET  /api/instructors                          # List all instructors
GET  /api/instructors/:id                      # Get single instructor + courses
```

#### Consultations
```
GET  /api/consultations/instructor/:id/types   # List consultation types
POST /api/consultations/book                   # Submit booking (no auth required)
```

#### Community
```
GET  /api/community/posts                      # Get posts feed (auth required)
POST /api/community/posts                      # Create post (auth required)
POST /api/community/posts/:id/like             # Like post (auth required)
GET  /api/community/posts/:id/comments         # Get comments (auth required)
POST /api/community/posts/:id/comments         # Add comment (auth required)
```

### Admin Endpoints

#### Instructors
```
GET    /api/instructors                        # List all
POST   /api/instructors                        # Create
PUT    /api/instructors/:id                    # Update
DELETE /api/instructors/:id                    # Delete
```

#### Consultations
```
GET    /api/consultations/types                # List all types
POST   /api/consultations/types                # Create type
PUT    /api/consultations/types/:id            # Update type
DELETE /api/consultations/types/:id            # Delete type
GET    /api/consultations/bookings             # View all bookings
PUT    /api/consultations/bookings/:id         # Update booking status
```

#### Community
```
PUT    /api/community/posts/:id/pin            # Pin/unpin post (admin only)
DELETE /api/community/posts/:id                # Delete post (owner/admin)
DELETE /api/community/posts/:id/comments/:id   # Delete comment (owner/admin)
```

---

## 🔐 Authentication & Authorization

### Auth Flow
1. User registers → password hashed with bcrypt
2. User logs in → JWT token issued (stored in localStorage)
3. Token sent with every request (Authorization header)
4. Token validated by `authenticate` middleware
5. Role-based access via `authorize('admin')` middleware

### Roles
- **student** - Default user role
- **admin** - Can manage courses, users, instructors, consultations, community moderation

### Rate Limiting
- **Login:** 20 attempts per 15 minutes per IP
- **Registration:** 5 attempts per hour per IP
- **Forgot Password:** 3 attempts per 15 minutes per IP

---

## 🎨 Theme Configuration

### CSS Variables Location
**File:** `D:\lms\frontend\app\globals.css` (lines 132-175)

### Dark Theme (Default)
```css
--pub-page-bg: #0a1628;
--pub-nav-bg: #0b1426;
--pub-hero-bg: #0f1d32;
--pub-section: #111d33;
--pub-card-bg: #162038;
--pub-text: #ffffff;
--pub-accent: #3b82f6;
```

### Light Theme
```css
--pub-page-bg: #ffffff;
--pub-nav-bg: #ffffff;
--pub-section: #f1f5f9;
--pub-card-bg: #ffffff;
--pub-text: #0f172a;
--pub-accent: #2563eb;
```

### How to Change Theme
1. **Frontend (Public pages):**
   - Click Sun/Moon icon in PublicNavbar
   - Toggles `data-theme` attribute on document
   - CSS variables automatically update
   - localStorage persists choice

2. **Admin Dashboard:**
   - Still dark theme only (can be enhanced)
   - ThemeSwitcher in Sidebar changes global theme

---

## 📱 Responsive Breakpoints (Tailwind)

```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

**Mobile-first approach:** Base styles are mobile, then override with `md:`, `lg:`, etc.

---

## 🌍 Internationalization (i18n)

### Supported Languages
- **Arabic** (ar) - RTL
- **English** (en) - LTR

### Implementation
- **Hook:** `useLanguage()` from `@/hooks/useLanguage.ts`
- **localStorage:** Persists user language choice
- **Database:** Some fields have `_ar` suffix (name_ar, bio_ar, etc.)

### Usage in Components
```tsx
const { t, isAr, dir, locale } = useLanguage();

return (
  <div dir={dir}>
    <h1>{isAr ? 'مرحبا' : 'Hello'}</h1>
  </div>
);
```

---

## 📊 Admin Pages Available

- **Dashboard** - Stats overview
- **Courses** - CRUD courses
- **Users** - Manage user accounts
- **Instructors** - NEW: Manage instructor profiles
- **Consultations** - NEW: Manage consultation types & bookings
- **Payments** - View payment records
- **Coupons** - Create discount codes
- **Bundles** - Package courses
- **Analytics** - Charts and metrics
- **Newsletter** - Email campaigns
- **Categories** - Course categories
- **Subscriptions** - Monthly plans
- **Referrals** - Affiliate tracking
- **Teams** - Corporate training groups
- **Settings** - Platform config

---

## 🚦 Deployment

### Server Details
- **IP:** 209.38.230.90
- **Port:** 3000 (backend), 3001 (frontend)
- **Domain:** learn.knowlyticshub.com
- **Process Manager:** PM2

### Deployment Steps
```bash
# SSH into server
ssh -i ~/.ssh/id_rsa root@209.38.230.90

# Pull latest code
cd /root/knowlytics-hub
git pull

# Rebuild frontend
cd frontend
npm run build

# Restart services
pm2 restart backend frontend
```

### Build Output
- Frontend: Next.js static + dynamic pages (~42 routes)
- Bundle size: ~88.4 KB shared JS + route-specific chunks

---

## ⚙️ Environment Variables

### Frontend (`.env.production`)
```
NEXT_PUBLIC_API_URL=https://api.knowlyticshub.com
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

### Backend (`.env`)
```
DB_HOST=aws-1-eu-central-1.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.dyeocjpcgdvqfizxlrma
DB_PASSWORD=***
DB_NAME=postgres
JWT_SECRET=***
NODE_ENV=production
```

---

## 📝 Common Tasks

### Add New Instructor
1. Go to Admin → Instructors
2. Click "Add Instructor"
3. Fill: Name (EN/AR), Title, Bio, Photo URL, Stats
4. Save
5. Appears in `/about` page automatically

### Create Consultation Type
1. Go to Admin → Consultations → Types
2. Select Instructor
3. Choose Type (Hourly/Project)
4. Set Price
5. Save
6. Appears on that instructor's course pages

### Moderate Community
1. Go to Community page (as admin)
2. Pin important posts (admin icon on post)
3. Delete inappropriate posts (trash icon)
4. Delete comments if needed

### Change Theme
1. Click Sun/Moon in top navbar
2. Dark/Light mode toggles
3. Choice saved to localStorage
4. Persists across sessions

---

## 🐛 Known Issues & Limitations

1. **Payment System** - Stripe integration not yet implemented
2. **Email Notifications** - Contact form doesn't send emails (mock only)
3. **Image Upload** - Uses external URLs only, no file upload yet
4. **Search** - No full-text search on courses/instructors
5. **Notifications** - No real-time notifications
6. **Mobile** - Some admin pages not fully optimized for mobile

---

## 🔮 Future Enhancements

- [ ] Stripe/Payment Gateway integration
- [ ] Live video sessions (Zoom/Jitsi integration)
- [ ] AI-powered course recommendations
- [ ] Two-factor authentication (2FA)
- [ ] Advanced analytics dashboard
- [ ] Course templates
- [ ] Bulk user import
- [ ] API documentation (Swagger)
- [ ] Mobile app (React Native)
- [ ] Video CDN optimization (Cloudinary)
- [ ] Search with filters
- [ ] Real-time notifications
- [ ] Course completion certificates (PDF generation)

---

## 📞 Support & Resources

- **GitHub:** https://github.com/mohamedabdelfattah322-spec/knowlytics-hub
- **Live Site:** https://learn.knowlyticshub.com
- **Main Website:** https://knowlyticshub.com
- **WhatsApp:** +20 122 692 9392

---

## 📜 Last Updated Changes (Session June 4, 2026)

### New Features Added
1. ✅ Consultation Booking System
   - `consultation_types` table (per-instructor, hourly/project pricing)
   - `consultation_bookings` table
   - Admin management page
   - Frontend booking form on course pages

2. ✅ Community (Facebook-style)
   - `community_posts`, `community_comments`, `community_likes` tables
   - Full CRUD operations
   - Like/comment functionality
   - Admin moderation (pin/delete)

3. ✅ Theme System Enhancement
   - CSS variables approach (safer than hooks)
   - Dark/Light mode toggle working properly
   - Utility classes for consistent styling

4. ✅ Free Course Enrollment
   - Direct enrollment button for price=0 courses
   - Green "Enroll for Free" button
   - Bypasses payment page

5. ✅ Mobile Dashboard
   - Sidebar hidden on mobile
   - Hamburger menu implementation
   - Touch-friendly navigation

### Bug Fixes
- Fixed light mode text visibility (was white text on white background)
- Fixed rate limiting (increased from 5 to 20 login attempts)
- Fixed company logo display (filename space issues)
- Fixed free course enrollment (was showing WhatsApp link instead)

---

**Generated by:** Claude Opus 4.6  
**For:** Knowlytics Hub LMS Platform  
**Confidentiality:** Internal Use Only
