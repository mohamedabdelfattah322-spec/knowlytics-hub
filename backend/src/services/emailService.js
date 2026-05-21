const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || 'Knowlytics Hub <Sales@knowlyticshub.com>';

const sendMail = async ({ to, subject, html }) => {
  if (process.env.NODE_ENV === 'test') return;
  // Skip if SMTP isn't configured (dev mode) — log instead
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || process.env.SMTP_USER === 'your@gmail.com') {
    console.log('\n📧 [EMAIL FALLBACK — SMTP not configured]');
    console.log('   To:     ', to);
    console.log('   Subject:', subject);
    console.log('   (configure SMTP_HOST/USER/PASS in .env to actually send)\n');
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`📧 Email sent → ${to}: ${subject}`);
  } catch (err) {
    console.error(`❌ Email failed → ${to}:`, err.message);
    throw err;
  }
};

// ─── Templates ────────────────────────────────────────────

const baseTemplate = (body) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 20px; }
    .card { background: #1e293b; border-radius: 12px; max-width: 600px; margin: 0 auto; padding: 40px; }
    .logo { color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 24px; }
    h2 { color: #f8fafc; margin-top: 0; }
    p { line-height: 1.6; color: #94a3b8; }
    .btn { display: inline-block; background: #6366f1; color: #fff; text-decoration: none;
           padding: 12px 28px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .footer { margin-top: 32px; font-size: 12px; color: #475569; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🎓 Knowlytics Hub</div>
    ${body}
    <div class="footer">© ${new Date().getFullYear()} Knowlytics Hub. All rights reserved.</div>
  </div>
</body>
</html>`;

const sendEnrollmentConfirmation = async (user, course) => {
  await sendMail({
    to: user.email,
    subject: `✅ Enrolled: ${course.title}`,
    html: baseTemplate(`
      <h2>Welcome to ${course.title}!</h2>
      <p>Hi ${user.name}, you've successfully enrolled in <strong>${course.title}</strong>.</p>
      <p>Start learning at your own pace and track your progress on your dashboard.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard/student/courses" class="btn">Go to My Courses</a>
    `),
  });
};

const sendCourseCompletionEmail = async (user, course) => {
  await sendMail({
    to: user.email,
    subject: `🏆 Course Completed: ${course.title}`,
    html: baseTemplate(`
      <h2>Congratulations, ${user.name}!</h2>
      <p>You've successfully completed <strong>${course.title}</strong>. 🎉</p>
      <p>Your certificate is ready to download from your dashboard.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard/student" class="btn">View Certificate</a>
    `),
  });
};

const sendInactivityReminder = async (user, course) => {
  await sendMail({
    to: user.email,
    subject: `👋 We miss you — Continue ${course.title}`,
    html: baseTemplate(`
      <h2>Hey ${user.name}, don't lose momentum!</h2>
      <p>You haven't visited <strong>${course.title}</strong> in a while.</p>
      <p>Resume where you left off — your progress is saved.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard/student/courses" class="btn">Resume Learning</a>
    `),
  });
};

const sendNewLiveSessionEmail = async (user, meeting) => {
  await sendMail({
    to: user.email,
    subject: `📅 Live Session: ${meeting.topic}`,
    html: baseTemplate(`
      <h2>Live Session Scheduled</h2>
      <p>Hi ${user.name}, a new live session has been scheduled:</p>
      <p><strong>${meeting.topic}</strong><br>
      📅 ${new Date(meeting.start_time).toLocaleString()}<br>
      ⏱ ${meeting.duration} minutes</p>
      <a href="${meeting.join_url}" class="btn">Join Zoom Meeting</a>
    `),
  });
};

const sendRefundEmail = async (user, payment, reason) => {
  await sendMail({
    to: user.email,
    subject: `💸 استرداد المبلغ — ${payment.amount} جنيه`,
    html: baseTemplate(`
      <h2>تم استرداد مبلغك</h2>
      <p>مرحباً ${user.name}،</p>
      <p>تم استرداد مبلغ <strong>${payment.amount} ${payment.currency}</strong> الخاص بطلبك.</p>
      ${reason ? `<p>السبب: ${reason}</p>` : ''}
      <p>سيتم إرجاع المبلغ خلال 5-7 أيام عمل حسب بنكك.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard/student" class="btn">الذهاب للداشبورد</a>
    `),
  });
};

const sendBroadcastEmail = async (to, subject, htmlBody) => {
  await sendMail({ to, subject, html: baseTemplate(htmlBody) });
};

const sendPasswordResetEmail = async (user, resetUrl) => {
  await sendMail({
    to: user.email,
    subject: 'إعادة تعيين كلمة المرور — Knowlytics Hub',
    html: baseTemplate(`
      <h1>مرحباً ${user.name}</h1>
      <p>وصلنا طلب إعادة تعيين كلمة المرور لحسابك. اضغط الزر التالي لتعيين كلمة مرور جديدة:</p>
      <a href="${resetUrl}" class="btn">إعادة تعيين كلمة المرور</a>
      <p style="margin-top:20px; color:#94a3b8; font-size:13px;">
        هذا الرابط صالح لمدة <strong>30 دقيقة فقط</strong>. إذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة.
      </p>
      <p style="color:#94a3b8; font-size:12px; margin-top:10px;">
        إن لم يعمل الزر، انسخ هذا الرابط إلى متصفحك:<br>
        <span style="word-break:break-all; color:#6366f1;">${resetUrl}</span>
      </p>
    `),
  });
};

module.exports = {
  sendEnrollmentConfirmation,
  sendCourseCompletionEmail,
  sendInactivityReminder,
  sendNewLiveSessionEmail,
  sendRefundEmail,
  sendBroadcastEmail,
  sendPasswordResetEmail,
};
