# Knowlytics Hub — Session Notes

## 📋 Overview

Full-stack LMS (Learning Management System) built for an Egyptian training provider.

- **Frontend**: Next.js 14 → Vercel (`https://knowlytics-frontend.vercel.app`)
- **Backend**: Node.js + Express → Railway (`https://backend-production-1676.up.railway.app`)
- **Database**: PostgreSQL → Railway
- **Payments**: Paymob (Egypt) + Stripe (International)
- **GitHub**: `mohamedabdelfattah322-spec/knowlytics-hub`

---

## ✅ Features Implemented This Session

### 1. 🔔 Notification Center
- Bell icon in dashboard header with unread badge
- 30-second auto-polling
- Mark as read / delete
- Admin can send to specific users or broadcast

### 2. 💸 Refund System
- Admin can issue refunds from Payments page
- Automatically deactivates enrollment
- Sends in-app notification + email to student

### 3. 🧾 Invoice PDF
- Printable invoice page for students: `/dashboard/student/invoices/[id]`
- Admin view with print-to-PDF modal in Payments page

### 4. 📝 Student Notes & Bookmarks
- Per-lesson notes with video timestamp capture
- Bookmarks per lesson
- All notes/bookmarks page: `/dashboard/student/notes`

### 5. 📧 Email Newsletter / Broadcast
- Admin compose page: `/dashboard/admin/newsletter`
- Audience selector: All / Live / Online / Enrolled in specific course
- HTML body with live preview
- Broadcast history log

### 6. 💳 Multi-Method Payment Portal
- **Paymob (Egypt)**:
  - Card: Visa / Mastercard / Meeza
  - Wallet: Vodafone Cash / Orange Money / InstaPay
  - Kiosk: Fawry / Aman (cash reference number)
  - ValU: Installments
- **Stripe (International)**:
  - Global Visa / Mastercard
  - Apple Pay / Google Pay
  - USD with automatic EGP conversion
- New checkout page with method selector UI

### 7. 🔐 Forgot Password
- `/forgot-password` page
- Email with reset link (30-minute TTL)
- `/reset-password?token=xxx` page
- Revokes all sessions on password reset

### 8. 🔑 Remember Me
- Checkbox on login page (checked by default)
- Remember Me ON → 30-day cookie
- Remember Me OFF → session cookie (expires on browser close)

### 9. ⚙️ Student Settings / Change Password
- `/dashboard/student/settings` page
- Shows account info
- Change password form (requires current password)

### 10. 💰 Egyptian Pound (EGP) Currency
- All prices changed from USD ($) to Egyptian Pounds (جنيه)
- `formatCurrency()` → numeric display (e.g., "1,500 جنيه")
- `formatPrice()` → course display ("مجاناً" for free, "1,500 جنيه" for paid)

### 11. 📊 Monthly Revenue Fix
- Was showing "مجاناً" instead of a number
- Fixed backend query to use `SUM(payments.amount)` instead of `SUM(courses.price)`

---

## 🗄️ Database Migrations

| Migration | Tables Created |
|-----------|---------------|
| `013_notes_bookmarks_refunds_newsletter.sql` | `lesson_notes`, `lesson_bookmarks`, `refund_requests`, `broadcast_emails` |
| `014_password_reset.sql` | `password_reset_tokens` |

Also: `ALTER TABLE notifications ADD COLUMN link TEXT`

---

## 📁 New Files Created

### Backend
```
backend/migrations/013_notes_bookmarks_refunds_newsletter.sql
backend/migrations/014_password_reset.sql
backend/src/controllers/notificationController.js
backend/src/controllers/notesController.js
backend/src/controllers/broadcastController.js
backend/src/routes/notes.js
```

### Frontend
```
frontend/app/(auth)/forgot-password/page.tsx
frontend/app/(auth)/reset-password/page.tsx
frontend/app/(dashboard)/dashboard/admin/newsletter/page.tsx
frontend/app/(dashboard)/dashboard/student/invoices/[id]/page.tsx
frontend/app/(dashboard)/dashboard/student/notes/page.tsx
frontend/app/(dashboard)/dashboard/student/settings/page.tsx
frontend/components/layout/NotificationBell.tsx
frontend/components/lesson/NotesPanel.tsx
frontend/.env.production
```

---

## 📝 Modified Files

### Backend
| File | Change |
|------|--------|
| `paymentController.js` | Multi-method Paymob + Stripe international |
| `authController.js` | Added forgotPassword + resetPassword |
| `routes/auth.js` | Added forgot/reset routes |
| `routes/payments.js` | Added methods, stripe webhook, invoice, refund |
| `services/emailService.js` | Added sendPasswordResetEmail, sendRefundEmail, sendBroadcastEmail |
| `controllers/adminController.js` | Fixed monthly revenue query |
| `app.js` | Added notes routes, broadcast endpoints, Stripe webhook |

### Frontend
| File | Change |
|------|--------|
| `app/(auth)/login/page.tsx` | Added "Forgot password?" link + Remember Me checkbox |
| `hooks/useAuth.ts` | Added `remember` param to login() |
| `lib/auth.ts` | saveToken() supports variable expiry days |
| `lib/utils.ts` | Added formatPrice(), fixed formatCurrency() for EGP |
| `components/layout/Sidebar.tsx` | Added Newsletter (admin) + Notes + Settings (student) |
| `app/courses/[id]/buy/page.tsx` | Full checkout rewrite with method selector |
| `app/(dashboard)/layout.tsx` | Added NotificationBell to header |

---

## 🔧 Infrastructure

### Railway Environment Variables (Backend)
```
PAYMOB_API_KEY=...
PAYMOB_HMAC_SECRET=...
PAYMOB_INTEGRATION_ID=5648960        # Card
PAYMOB_IFRAME_ID=1039724
PAYMOB_WALLET_INTEGRATION_ID=...     # Wallet (optional)
PAYMOB_KIOSK_INTEGRATION_ID=...      # Fawry/Aman (optional)
PAYMOB_VALU_INTEGRATION_ID=...       # ValU (optional)
STRIPE_SECRET_KEY=sk_live_...        # International (optional)
STRIPE_WEBHOOK_SECRET=whsec_...      # International (optional)
EGP_TO_USD=0.021
```

### Vercel Environment Variables (Frontend)
```
NEXT_PUBLIC_API_URL=https://backend-production-1676.up.railway.app/api
NEXT_PUBLIC_MAX_SESSIONS=2
```

### Paymob Integration #5648960 Settings
```
Webhook URL:  https://backend-production-1676.up.railway.app/api/payments/webhook
Redirect URL: https://knowlytics-frontend.vercel.app
```

---

## 🧪 Paymob Test Cards

| Type | Card Number | CVV | Expiry | OTP |
|------|-------------|-----|--------|-----|
| ✅ Success | `5123456789012346` | `123` | `12/25` | `123456` |
| ❌ Fail | `5111111111111118` | `123` | `12/25` | any |

> ⚠️ Currently in **Test Mode** — no real money is charged.

---

## 🚀 To Go Live (Checklist)

- [ ] Add bank account in Paymob: **Balance & Transfers > Add Bank Account**
- [ ] Switch Paymob from Test → Live mode
- [ ] Replace Railway env vars with Live keys from Paymob
- [ ] Configure SMTP for emails (or use SendGrid/Mailgun)
- [ ] Set up Stripe account for international payments (optional)

---

## 🔗 URLs

| Service | URL |
|---------|-----|
| Frontend (Production) | https://knowlytics-frontend.vercel.app |
| Backend (Production) | https://backend-production-1676.up.railway.app |
| GitHub Repo | https://github.com/mohamedabdelfattah322-spec/knowlytics-hub |
| Pull Request #1 | https://github.com/mohamedabdelfattah322-spec/knowlytics-hub/pull/1 |
| Paymob Dashboard | https://eg.dashboard.paymob.com |
| Railway Dashboard | https://railway.app/dashboard |
| Vercel Dashboard | https://vercel.com/dashboard |

---

*Last updated: 2026-05-10*
