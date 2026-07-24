// Run with: node seeds/final-quiz-data-analysis.js <course_id>
require('dotenv').config();
const { query, pool } = require('../src/config/database');

const QUESTIONS = [
  // ─── Excel basics ────────────────────────────
  { q: 'ما هي الدالة المستخدمة للبحث في عمود وإرجاع قيمة من عمود آخر؟',
    answers: [['VLOOKUP', true], ['SUM', false], ['COUNTA', false], ['IF', false]] },
  { q: 'أي صيغة تجمع القيم بناءً على شرط واحد؟',
    answers: [['SUMIF', true], ['SUMIFS', false], ['COUNTIF', false], ['SUM', false]] },
  { q: 'ما هي الدالة الأحدث التي حلت محل VLOOKUP في Excel 365؟',
    answers: [['XLOOKUP', true], ['HLOOKUP', false], ['LOOKUP', false], ['MATCH', false]] },
  { q: 'لإزالة الصفوف المكررة في Excel، أي قائمة تستخدم؟',
    answers: [['Data → Remove Duplicates', true], ['Home → Sort', false], ['Insert → Table', false], ['View → Filter', false]] },
  { q: 'ما هي اختصار لوحة المفاتيح لإدخال التاريخ الحالي في خلية؟',
    answers: [['Ctrl + ;', true], ['Ctrl + T', false], ['Ctrl + D', false], ['Ctrl + N', false]] },

  // ─── Excel advanced ──────────────────────────
  { q: 'ما هو الـ PivotTable؟',
    answers: [['أداة لتلخيص وتحليل البيانات بسرعة', true], ['نوع من الرسوم البيانية', false],
             ['دالة حسابية', false], ['أداة لتنسيق الجداول', false]] },
  { q: 'في Power Query، ما الذي يحدث عند "Refresh"؟',
    answers: [['إعادة تشغيل خطوات التحويل وجلب أحدث البيانات', true],
             ['حذف البيانات', false], ['تنسيق الجدول', false], ['إنشاء PivotTable', false]] },
  { q: 'أي نوع من العلاقات يستخدم في Data Model؟',
    answers: [['One-to-Many', true], ['Many-to-Many فقط', false], ['One-to-One فقط', false], ['لا توجد علاقات', false]] },
  { q: 'دالة INDEX/MATCH أفضل من VLOOKUP لأنها:',
    answers: [['تبحث في أي اتجاه (يمين/يسار)', true],
             ['أسرع في كل الحالات', false], ['أسهل في الكتابة', false], ['تعطي نتائج مختلفة', false]] },
  { q: 'ما هي الدالة المستخدمة لتجميع نص من عدة خلايا؟',
    answers: [['CONCATENATE أو &', true], ['SUM', false], ['COUNT', false], ['AVERAGE', false]] },

  // ─── Power BI ────────────────────────────────
  { q: 'ما هي اللغة المستخدمة لكتابة المقاييس (Measures) في Power BI؟',
    answers: [['DAX', true], ['SQL', false], ['Python', false], ['M Language', false]] },
  { q: 'في Power BI، ما الفرق بين Calculated Column و Measure؟',
    answers: [['Calculated Column يُحسب لكل صف، Measure يُحسب وقت العرض', true],
             ['لا يوجد فرق', false], ['Measure أبطأ', false], ['Calculated Column يُستخدم في Slicers فقط', false]] },
  { q: 'أي نوع من العلاقات هو الأكثر شيوعاً بين جدول الحقائق وجداول الأبعاد؟',
    answers: [['Many-to-One', true], ['Many-to-Many', false], ['One-to-One', false], ['No Relationship', false]] },
  { q: 'ما هي وظيفة CALCULATE في DAX؟',
    answers: [['تغيير سياق الحساب (Context)', true],
             ['الجمع البسيط', false], ['عد الخلايا', false], ['تنسيق الأرقام', false]] },
  { q: 'ما هو Star Schema؟',
    answers: [['تصميم بيانات: جدول حقائق مركزي حوله جداول أبعاد', true],
             ['نوع رسم بياني', false], ['أداة في Excel', false], ['نوع ملف', false]] },

  // ─── Dashboards ──────────────────────────────
  { q: 'ما هو أهم مبدأ في تصميم الـ Dashboard؟',
    answers: [['الوضوح والبساطة وعرض المعلومة الأهم أولاً', true],
             ['استخدام أكبر عدد ممكن من الألوان', false],
             ['وضع كل البيانات في رسم واحد', false],
             ['استخدام رسوم 3D', false]] },
  { q: 'متى نستخدم الـ Bar Chart؟',
    answers: [['لمقارنة قيم بين فئات مختلفة', true],
             ['لإظهار النسب المئوية', false], ['لعرض اتجاه زمني', false], ['دائماً في كل الحالات', false]] },
  { q: 'متى يكون الـ Pie Chart غير مناسب؟',
    answers: [['عند وجود فئات كثيرة (أكثر من 5-6)', true],
             ['عند وجود فئتين فقط', false], ['دائماً مناسب', false], ['عند مقارنة نسب صغيرة', false]] },
  { q: 'ما هو KPI Card في Dashboard؟',
    answers: [['عرض رقم واحد مهم مع مقارنته بهدف', true],
             ['نوع رسم بياني خطي', false], ['جدول بيانات', false], ['أداة فلترة', false]] },
  { q: 'لتحسين أداء Dashboard في Power BI، يفضل:',
    answers: [['تقليل عدد البصريات (visuals) واستخدام علاقات صحيحة', true],
             ['إضافة المزيد من البصريات', false],
             ['استخدام Calculated Columns بكثرة', false],
             ['عدم استخدام علاقات', false]] },
];

const main = async () => {
  const courseId = process.argv[2];
  if (!courseId) {
    console.error('Usage: node seeds/final-quiz-data-analysis.js <course_id>');
    process.exit(1);
  }

  // Verify course exists
  const c = await query('SELECT id, title FROM courses WHERE id = $1', [courseId]);
  if (!c.rows.length) {
    console.error('Course not found');
    process.exit(1);
  }
  console.log(`Adding final quiz to: ${c.rows[0].title}`);

  // Find or create a "Final Exam" section
  let secRes = await query(
    `SELECT id FROM sections WHERE course_id = $1 AND title ILIKE '%final%' LIMIT 1`,
    [courseId]
  );
  let sectionId;
  if (secRes.rows.length) sectionId = secRes.rows[0].id;
  else {
    const r = await query(
      `INSERT INTO sections (course_id, title, description, order_index)
       VALUES ($1, $2, $3, 999) RETURNING id`,
      [courseId, '🎓 الامتحان النهائي', 'امتحان نهاية الكورس - يفتح بعد إكمال كل الدروس']
    );
    sectionId = r.rows[0].id;
    console.log('Created section:', sectionId);
  }

  // Create the quiz
  const quizRes = await query(
    `INSERT INTO quizzes (section_id, course_id, title, description, is_final, passing_score)
     VALUES ($1, $2, $3, $4, true, 60) RETURNING id`,
    [sectionId, courseId,
     'الامتحان النهائي - تحليل البيانات بالـ Excel و Power BI',
     `${QUESTIONS.length} سؤال - درجة النجاح 60% - الشهادة بعد النجاح`]
  );
  const quizId = quizRes.rows[0].id;
  console.log('Created quiz:', quizId);

  // Insert questions and answers
  for (let i = 0; i < QUESTIONS.length; i++) {
    const Q = QUESTIONS[i];
    const qRes = await query(
      `INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, order_index)
       VALUES ($1, $2, 'multiple_choice', 1, $3) RETURNING id`,
      [quizId, Q.q, i]
    );
    const qid = qRes.rows[0].id;
    for (let j = 0; j < Q.answers.length; j++) {
      const [text, correct] = Q.answers[j];
      await query(
        `INSERT INTO quiz_answers (question_id, answer_text, is_correct, order_index)
         VALUES ($1, $2, $3, $4)`,
        [qid, text, correct, j]
      );
    }
  }

  console.log(`✅ Added ${QUESTIONS.length} questions to the final quiz`);
  await pool.end();
};

main().catch((err) => { console.error(err); process.exit(1); });
