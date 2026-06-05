# Knowlytics Hub - LMS Platform Documentation

**Last Updated:** June 5, 2026  
**Version:** 1.1.0  
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
- 🎬 Bunny.net Video Hosting (CDN محمي)

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
- **Password Hashing:** bcryptjs
- **File Upload:** Multer (local disk)
- **Video CDN:** Bunny.net Stream

### DevOps
- **Hosting:** VPS (209.38.230.90)
- **Process Manager:** PM2
- **Reverse Proxy:** Nginx
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
│   │   │   ├── lessonController.js
│   │   │   └── fileController.js
│   │   ├── services/
│   │   │   ├── bunnyService.js             # Bunny.net CDN integration
│   │   │   ├── emailService.js
│   │   │   └── index.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── courses.js
│   │       ├── enrollments.js
│   │       ├── instructors.js
│   │       ├── consultations.js
│   │       ├── community.js
│   │       └── files.js
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                        # Landing page
│   │   ├── globals.css                     # Theme variables
│   │   ├── (auth)/login / register / reset-password
│   │   ├── (dashboard)/dashboard/
│   │   │   ├── admin/
│   │   │   │   ├── courses/[id]/page.tsx   # Course editor (Bunny upload)
│   │   │   │   ├── instructors/page.tsx    # Instructor management
│   │   │   │   ├── consultations/
│   │   │   │   ├── users/
│   │   │   │   └── analytics/
│   │   │   └── student/
│   │   │       ├── courses/page.tsx        # My Courses (with thumbnails)
│   │   │       └── ...
│   │   ├── courses/
│   │   │   ├── page.tsx                    # Courses listing (with thumbnails)
│   │   │   └── [id]/
│   │   │       ├── page.tsx                # Course detail
│   │   │       └── lessons/[lessonId]/page.tsx  # Lesson player (Bunny)
│   │   ├── about/page.tsx
│   │   ├── community/page.tsx
│   │   └── contact/page.tsx
│   └── public/
│
└── DATABASE/
    └── migrations/
        ├── 001_initial_schema.sql
        ├── ...
        └── 020_bunny_video_support.sql     # NEW: bunny_video_id, bunny_embed_url
```

---

## 🎬 Bunny.net Video System

### الإعدادات
```env
BUNNY_LIBRARY_ID=677094
BUNNY_API_KEY=c53ca241-9fb8-49c7-971f9f50c103-d019-4bb3
BUNNY_TOKEN_KEY=abb85efc-7fcf-4b52-a172-f41777f53bfa
BUNNY_API_URL=https://video.bunnycdn.com
```

### Security Settings (Bunny Dashboard)
- ✅ **Enable direct play:** OFF
- ✅ **Allowed domains:** `learn.knowlyticshub.com`
- ✅ **Block direct url file access:** ON
- ✅ **Embed view token authentication:** ON

### Workflow رفع الفيديو
```
Admin → "🎬 رفع فيديو" → اختار الفيديو
↓
السيرفر يحفظه مؤقتاً
↓
يرفعه تلقائياً لـ Bunny.net
↓
يجيب المدة تلقائياً من Bunny API
↓
يحدّث duration_minutes في الدرس
↓
يحسب مجموع الكورس ويحدّث duration_hours
↓
يمسح الملف من السيرفر
↓
Badge "✅ Bunny — تغيير" يظهر
```

### Signed URLs
- كل رابط فيديو بينتهي بعد **4 ساعات**
- Token = SHA256(TOKEN_KEY + video_id + expires)
- مش ممكن حد يولّد رابط صح بدون الـ secret key

### طبقات الحماية
| الطبقة | التفاصيل |
|---|---|
| Enrollment check | مش enrolled = مش هيوصل |
| Signed URL | رابط مؤقت ينتهي كل 4 ساعات |
| Token SHA256 | مستحيل التزوير |
| Domain restriction | يشتغل على learn.knowlyticshub.com بس |
| Block direct URL | مش ممكن فتح الفيديو مباشرة |
| Watermark | اسم/إيميل الطالب على الفيديو |

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
thumbnail_url | promo_video_url | instructor_profile_id | duration_hours | created_at
```

#### `lessons`
```sql
id | section_id | title | type | video_key | video_url |
bunny_video_id | bunny_embed_url | duration_minutes |
order_index | is_preview | content | created_at
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

---

## 🚀 API Endpoints

### Files / Upload
```
POST /api/files/upload              # رفع ملف (PDF/Excel/صورة) — يحفظ في course_files
                                    # إضافة image_only=true للصور بدون حفظ في course_files
POST /api/files/upload-video        # رفع فيديو → Bunny تلقائياً → حذف محلي
POST /api/files/upload-to-bunny     # رفع فيديو موجود محلياً إلى Bunny (legacy)
GET  /api/files/stream/*            # Stream فيديو محلي (auth required)
```

### Courses
```
GET    /api/courses                 # List all courses
GET    /api/courses/:id             # Get course + sections + lessons
PUT    /api/courses/:id             # Update course (admin)
POST   /api/courses                 # Create course (admin)
DELETE /api/courses/:id             # Delete course (admin)
```

### Enrollments
```
POST /api/enrollments               # تسجيل في كورس
                                    # Student: مجاني فقط (price=0)
                                    # Admin: يقدر يسجّل في أي كورس
GET  /api/enrollments/my            # كورساتي
```

### Lessons
```
GET /api/lessons/:id                # الدرس + videoUrl (Bunny Signed URL)
PUT /api/lessons/:id                # تعديل الدرس
```

---

## 🔐 Authentication & Authorization

### Auth Flow
1. User registers → password hashed with bcryptjs
2. User logs in → JWT token issued → stored in cookie `kh_token`
3. Token sent with every request (Authorization header)
4. Token validated by `authenticate` middleware
5. Role-based access via `authorize('admin')` middleware

### Roles
- **student** - Default user role
- **admin** - Full access

### Rate Limiting
- **Global:** 500 requests per 15 minutes per IP
- **Login:** 100 attempts per 15 minutes per IP
- **Registration:** 5 attempts per hour per IP
- **Forgot Password:** 3 attempts per 15 minutes per IP
- **Trust Proxy:** enabled (لـ Nginx)

---

## 🎨 Theme Configuration

### Dark Theme (Default)
```css
--pub-page-bg: #0a1628;
--pub-nav-bg: #0b1426;
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

---

## 📱 Responsive Breakpoints (Tailwind)

```
sm: 640px | md: 768px | lg: 1024px | xl: 1280px | 2xl: 1536px
```

---

## 🌍 Internationalization (i18n)

- **Arabic** (ar) - RTL | **English** (en) - LTR
- Hook: `useLanguage()` from `@/hooks/useLanguage.ts`
- localStorage persistence

---

## 📊 Admin Pages

- **Dashboard** - Stats overview
- **Courses** - CRUD + Bunny video upload
- **Users** - Manage accounts
- **Instructors** - Manage instructor profiles + photo upload
- **Consultations** - Types & bookings
- **Payments** - Payment records
- **Coupons** - Discount codes
- **Bundles** - Package courses
- **Analytics** - Charts
- **Newsletter** - Email campaigns
- **Categories** - Course categories
- **Subscriptions** - Monthly plans

---

## 🚦 Deployment

### Server Details
```
IP:     209.38.230.90
Ports:  3000 (frontend), 5000 (backend)
Domain: learn.knowlyticshub.com
PM2:    backend + frontend processes
Nginx:  Reverse proxy with SSL
```

### ⚠️ Deploy Steps (المهم)
```bash
# SSH
ssh root@209.38.230.90

# Pull code
cd /root/knowlytics-hub && git pull

# Restart backend only
pm2 restart backend

# Full deploy (frontend changed)
pm2 stop frontend
cd frontend && npm run build > /tmp/build.log 2>&1
pm2 start frontend

# ⚠️ لا تعمل pm2 restart frontend قبل ما الـ build يخلص!
# الـ build بياخد ~3 دقائق
```

### Nginx Config Location
```
/etc/nginx/sites-enabled/knowlytics
```

---

## ⚙️ Environment Variables

### Frontend (`/root/knowlytics-hub/frontend/.env.production`)
```
NEXT_PUBLIC_API_URL=https://api.knowlyticshub.com/api
NEXT_PUBLIC_APP_NAME=Knowlytics Hub
```

### Backend (`/root/knowlytics-hub/backend/.env`)
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
BUNNY_LIBRARY_ID=677094
BUNNY_API_KEY=...
BUNNY_TOKEN_KEY=...
BUNNY_API_URL=https://video.bunnycdn.com
```

---

## 🖼️ Images Upload

### Thumbnail الكورس
- **أبعاد:** 1280×720 px (نسبة 16:9)
- **Format:** JPG أو WebP
- **حجم:** أقل من 500KB
- **الرفع:** Admin → الكورس → الإعدادات → رفع
- ⚠️ لا تستخدم Google Drive links — استخدم الرفع المباشر

### صورة المدرب
- **أبعاد:** 400×400 px على الأقل
- **Format:** JPG (مش PNG بخلفية شفافة)
- **الرفع:** Admin → Instructors → رفع

### ملاحظة مهمة
رفع الصور بيستخدم `image_only=true` flag → مش بيتحفظ في `course_files` → مش بيظهر للطالب كـ material

---

## 🔧 Common Tasks

### Reset Admin Password
```bash
ssh root@209.38.230.90
cat > /root/knowlytics-hub/backend/resetpw.js << 'EOF'
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  const hash = await bcrypt.hash('NEW_PASSWORD_HERE', 12);
  const res = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email',
    [hash, 'admin@knowlyticshub.com']
  );
  console.log('Done:', res.rows[0].email);
  await pool.end();
})();
EOF
cd /root/knowlytics-hub/backend && node resetpw.js && rm resetpw.js
```

### Clear Rate Limit
```bash
pm2 restart backend
```

### Check Logs
```bash
pm2 logs backend --lines 50
pm2 logs frontend --lines 20
```

---

## 🐛 Known Issues & Fixes

| المشكلة | السبب | الحل |
|---|---|---|
| Too many requests | Rate Limit وصل الحد | `pm2 restart backend` |
| Application error | Build قديم في cache | `Ctrl+Shift+R` |
| فشل الحفظ | Rate Limit 429 | `pm2 restart backend` |
| صورة مكسورة | Google Drive link | ارفع الصورة مباشرة |

---

## 📜 Session Changes - June 4-5, 2026

### Bug Fixes
1. ✅ **Free Course Enrollment** — الطالب يقدر يسجل في الكورسات المجانية بنفسه
2. ✅ **Course Save** — إضافة thumbnail_url وpromo_video_url في حفظ الكورس
3. ✅ **Static Images** — تصحيح مسار `/uploads` في production
4. ✅ **Thumbnails Display** — ظهور الصور في cards الكورسات والـ Student Dashboard
5. ✅ **No Lessons Button** — رسالة "لا توجد دروس بعد" بدل إخفاء الزرار
6. ✅ **Rate Limit** — رفع الحد من 100 إلى 500 + trust proxy
7. ✅ **Image in Materials** — صور الـ thumbnail مش بتظهر كـ course materials
8. ✅ **CloudUpload Icon** — استبدال بـ Upload (غير موجود في lucide version)
9. ✅ **Bunny GUID** — استخدام guid بدل videoId في Bunny API

### New Features
1. ✅ **Instructor Photo Upload** — رفع صور المدربين من Admin Dashboard
2. ✅ **Course Thumbnail Upload** — رفع صور الكورسات مباشرة
3. ✅ **Bunny.net Integration** — رفع فيديوهات محمية على CDN
4. ✅ **Signed Video URLs** — روابط فيديو مؤقتة (4 ساعات)
5. ✅ **Auto Video Duration** — حساب مدة الفيديو تلقائياً من Bunny
6. ✅ **Auto Course Duration** — حساب مدة الكورس تلقائياً من مجموع الدروس
7. ✅ **One-Click Bunny Upload** — خطوة واحدة بدل اتنين

---

## 🔮 Future Enhancements

- [ ] Stripe / Payment Gateway
- [ ] Live video sessions (Zoom/Jitsi)
- [ ] AI-powered course recommendations
- [ ] Two-factor authentication (2FA)
- [ ] Course completion certificates (PDF)
- [ ] Search with filters
- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] Email notifications (SMTP)
- [ ] Bulk user import
- [ ] API documentation (Swagger)

---

## 📞 Support & Resources

- **GitHub:** https://github.com/mohamedabdelfattah322-spec/knowlytics-hub
- **Live Site:** https://learn.knowlyticshub.com
- **Main Website:** https://knowlyticshub.com
- **WhatsApp:** +20 122 692 9392
- **Admin Email:** admin@knowlyticshub.com

---

**Generated by:** Claude Sonnet 4.6  
**For:** Knowlytics Hub LMS Platform  
**Confidentiality:** Internal Use Only
