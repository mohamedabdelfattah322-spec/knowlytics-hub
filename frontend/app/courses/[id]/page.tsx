'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen, Clock, Users, Play, Lock, ChevronDown, ChevronUp, Loader2,
  CheckCircle, ShoppingCart, Phone, Trophy, Star, GraduationCap, Award,
  Globe, Shield, BarChart3, Zap, HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { formatPrice, levelColor, cn } from '@/lib/utils';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import CourseFeedback from '@/components/CourseFeedback';
import CertificateButton from '@/components/CertificateButton';
import ReviewSection from '@/components/course/ReviewSection';
import ConsultationSection from '@/components/ConsultationSection';
import DiscussionForum from '@/components/course/DiscussionForum';
import AIChatbot from '@/components/AIChatbot';

interface Lesson { id: string; title: string; type: string; duration_minutes: number; is_preview: boolean; }
interface Section { id: string; title: string; order_index: number; lessons: Lesson[]; }
interface QuizItem { id: string; title: string; description: string; section_id: string; question_count: string; }
interface Course {
  id: string; title: string; description: string; type: string; level: string;
  price: number; duration_hours: number; thumbnail_url: string;
  instructor_name: string; instructor_avatar?: string; enrollment_count: string;
  promo_video_url?: string; instructor_profile_id?: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className="w-4 h-4" style={{ color: i <= rating ? '#f59e0b' : '#334155', fill: i <= rating ? '#f59e0b' : 'none' }} />
      ))}
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, isAr } = useLanguage();
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [examStatus, setExamStatus] = useState<any>(null);
  const [feedbackSummary, setFeedbackSummary] = useState<{ total_reviews: number; avg_rating: number; recommend_count: number } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/courses/${id}`).then(({ data }) => {
      setCourse(data.course);
      setSections(data.sections || []);
      if (data.sections?.length) setExpanded({ [data.sections[0].id]: true });
    }).finally(() => setLoading(false));
    api.get(`/courses/${id}/feedback-summary`).then(({ data }) => setFeedbackSummary(data)).catch(() => {});
    if (user) {
      api.get('/enrollments/my').then(({ data }) => { setEnrolled(data.some((e: any) => e.course_id === id)); });
      api.get(`/courses/${id}/final-quiz-status`).then(({ data }) => setExamStatus(data)).catch(() => {});
      api.get(`/quizzes/course/${id}`).then(({ data }) => setQuizzes(data)).catch(() => {});
    }
  }, [id, user]);

  const handleBuy = () => {
    if (!user) { router.push(`/login?redirect=/courses/${id}/buy`); return; }
    router.push(`/courses/${id}/buy`);
  };

  const handleEnrollFree = async () => {
    if (!user) { router.push(`/login?redirect=/courses/${id}`); return; }
    try {
      await api.post('/enrollments', { course_id: id });
      setEnrolled(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'حدث خطأ');
    }
  };

  if (loading) return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>;
  if (!course) return <div className="min-h-screen bg-dark-900 flex items-center justify-center text-slate-400">Course not found.</div>;

  const totalLessons = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);
  const totalMinutes = sections.reduce((acc, s) => acc + (s.lessons?.reduce((a, l) => a + (l.duration_minutes || 0), 0) || 0), 0);
  const formatDuration = (mins: number) => {
    if (!mins) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
  };
  const sectionDuration = (s: Section) => {
    const mins = s.lessons?.reduce((a, l) => a + (l.duration_minutes || 0), 0) || 0;
    return formatDuration(mins);
  };
  const embedUrl = course.promo_video_url
    ? course.promo_video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').replace('youtube.com/shorts/', 'youtube.com/embed/')
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a1628' }}>
      <PublicNavbar />

      {/* ── Admin Preview Banner ── */}
      {user?.role === 'admin' && (
        <div className="sticky top-0 z-50 bg-amber-500 text-black px-4 py-2 flex items-center justify-between text-sm font-semibold">
          <span>👁️ وضع المعاينة — أنت تشوف الكورس كما يراه الطالب</span>
          <a
            href={`/dashboard/admin/courses/${id}`}
            className="bg-black text-white px-3 py-1 rounded-lg text-xs hover:bg-gray-800 transition-colors"
          >
            ← رجوع للأدمن
          </a>
        </div>
      )}

      {/* ══════════════════ HERO — Video + Title ══════════════════ */}
      <section className="relative" style={{ backgroundColor: '#0f1d32' }}>
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-16">
          <div className="grid lg:grid-cols-5 gap-8 items-start">

            {/* Left: Video + Info (3 cols) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('badge', course.type === 'live' ? 'badge-purple' : 'badge-blue')}>{course.type === 'live' ? 'LIVE' : 'ONLINE'}</span>
                <span className={levelColor(course.level)}>{course.level}</span>
                {feedbackSummary && feedbackSummary.total_reviews > 0 && (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4" style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                    <span style={{ color: '#f59e0b' }}>{feedbackSummary.avg_rating}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>({feedbackSummary.total_reviews})</span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-extrabold leading-snug" style={{ color: '#ffffff' }}>{course.title}</h1>

              {/* Promo Video */}
              {embedUrl ? (
                <div className="rounded-2xl overflow-hidden shadow-2xl aspect-video" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <iframe src={embedUrl} title="Promo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
                </div>
              ) : (
                <div className="rounded-2xl aspect-video flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 50%, #7c3aed 100%)' }}>
                  <BookOpen className="w-16 h-16" style={{ color: 'rgba(255,255,255,0.2)' }} />
                </div>
              )}

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: Clock, label: `${course.duration_hours} ${isAr ? 'ساعة' : 'hours'}` },
                  { icon: BookOpen, label: `${sections.length} ${isAr ? 'قسم' : 'sections'}` },
                  { icon: Play, label: `${totalLessons} ${isAr ? 'درس' : 'lessons'}` },
                  { icon: Users, label: `${course.enrollment_count} ${isAr ? 'طالب' : 'students'}` },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                       style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <s.icon className="w-3.5 h-3.5" /> {s.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Enrollment Card (2 cols) */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl p-6 sticky top-24" style={{ backgroundColor: '#162038', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-3xl font-extrabold mb-1" style={{ color: '#ffffff' }}>{formatPrice(course.price)}</p>
                <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {isAr ? 'وصول مدى الحياة · جميع الأجهزة' : 'Lifetime access · All devices'}
                </p>

                {enrolled ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-medium text-sm mb-2" style={{ color: '#4ade80' }}>
                      <CheckCircle className="w-4 h-4" /> {isAr ? 'أنت مسجل بالفعل' : 'You are enrolled'}
                    </div>
                    {sections[0]?.lessons?.[0] ? (
                      <Link href={`/courses/${id}/lessons/${sections[0].lessons[0].id}`}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform"
                        style={{ backgroundColor: '#3b82f6', color: '#fff' }}>
                        <Play className="w-4 h-4" /> {isAr ? 'ابدأ التعلم' : 'Start Learning'}
                      </Link>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
                        style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(59,130,246,0.15)' }}>
                        <BookOpen className="w-4 h-4" /> {isAr ? 'لا توجد دروس بعد' : 'No lessons yet'}
                      </div>
                    )}
                    {examStatus?.final_quiz && (
                      <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-2 text-sm">
                          <Trophy className="w-4 h-4" style={{ color: '#f59e0b' }} />
                          <span className="font-medium" style={{ color: '#fff' }}>{isAr ? 'الامتحان النهائي' : 'Final Exam'}</span>
                        </div>
                        {!examStatus.lessons_done ? (
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>🔒 {isAr ? `يفتح بعد إكمال كل الدروس (${examStatus.completed_lessons}/${examStatus.total_lessons})` : `Unlocks after completing all lessons (${examStatus.completed_lessons}/${examStatus.total_lessons})`}</p>
                        ) : examStatus.passed ? (
                          <p className="text-xs" style={{ color: '#4ade80' }}>✓ {isAr ? `نجحت بـ ${examStatus.my_attempt?.score_pct}%` : `Passed with ${examStatus.my_attempt?.score_pct}%`}</p>
                        ) : (
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{isAr ? 'جاهز للامتحان' : 'Ready for exam'}</p>
                        )}
                        <Link href={`/courses/${id}/final-exam`}
                          className={`w-full py-2 rounded-lg text-sm font-medium text-center block ${!examStatus.lessons_done ? 'opacity-50 pointer-events-none' : ''}`}
                          style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                          {examStatus.passed ? (isAr ? '🎉 شوف نتيجتك' : '🎉 View Result') : (isAr ? 'ابدأ الامتحان' : 'Start Exam')}
                        </Link>
                      </div>
                    )}
                    {(!examStatus?.final_quiz || examStatus.passed) && (
                      <div className="flex justify-center pt-2"><CertificateButton courseId={String(id)} /></div>
                    )}
                  </div>
                ) : course.type === 'live' ? (
                  <div className="space-y-3">
                    <div className="rounded-xl p-3 text-sm flex items-start gap-2" style={{ backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#c4b5fd' }}>
                      <Phone className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">{isAr ? 'كورس مباشر' : 'Live Course'}</p>
                        <p className="text-xs opacity-80">{isAr ? 'للتسجيل تواصل مع الإدارة' : 'Contact admin to enroll'}</p>
                      </div>
                    </div>
                    <a href="https://wa.me/201226929392" target="_blank" rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                      style={{ backgroundColor: '#4ade80', color: '#0a1628' }}>
                      <Phone className="w-4 h-4" /> {isAr ? 'احجز عبر واتساب' : 'Book via WhatsApp'}
                    </a>
                  </div>
                ) : parseFloat(String(course.price)) > 0 ? (
                  <button onClick={handleBuy}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform"
                    style={{ backgroundColor: '#3b82f6', color: '#fff' }}>
                    <ShoppingCart className="w-4 h-4" /> {isAr ? 'اشترِ الكورس الآن' : 'Buy Course Now'}
                  </button>
                ) : (
                  <button onClick={handleEnrollFree}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform"
                    style={{ backgroundColor: '#10b981', color: '#fff' }}>
                    <CheckCircle className="w-4 h-4" /> {isAr ? 'سجّل مجاناً' : 'Enroll for Free'}
                  </button>
                )}

                {/* Course Details */}
                <div className="mt-6 space-y-3 text-sm">
                  {[
                    { label: isAr ? 'الدروس' : 'Lessons', value: totalLessons },
                    { label: isAr ? 'المدة' : 'Duration', value: `${course.duration_hours}h` },
                    { label: isAr ? 'المستوى' : 'Level', value: course.level },
                    { label: isAr ? 'النوع' : 'Type', value: course.type },
                    { label: isAr ? 'المدرب' : 'Instructor', value: course.instructor_name },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>{item.label}</span>
                      <span className="font-medium" style={{ color: '#fff' }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Benefits */}
                <div className="mt-6 space-y-2">
                  {[
                    { icon: Globe, text: isAr ? 'وصول مدى الحياة' : 'Lifetime access' },
                    { icon: Shield, text: isAr ? 'ضمان استرداد 14 يوم' : '14-day refund guarantee' },
                    { icon: Award, text: isAr ? 'شهادة إتمام معتمدة' : 'Verified certificate' },
                    { icon: Zap, text: isAr ? 'تحديثات مجانية' : 'Free updates' },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <b.icon className="w-3.5 h-3.5" style={{ color: '#4ade80' }} /> {b.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ INSTRUCTOR SECTION ══════════════════ */}
      <section className="py-14" style={{ backgroundColor: '#0b1426' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-6 p-6 rounded-2xl" style={{ backgroundColor: '#162038', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)' }}>
              <GraduationCap className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium mb-1" style={{ color: '#3b82f6' }}>{isAr ? 'المدرب' : 'Instructor'}</p>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#fff' }}>{course.instructor_name}</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {isAr ? 'خبير تحليل البيانات — 7,000+ متدرب — 5.0 تقييم' : 'Data Analysis Expert — 7,000+ trainees — 5.0 rating'}
              </p>
              <div className="flex gap-2 mt-2">
                {[
                  { icon: Users, label: '7,000+' },
                  { icon: Star, label: '5.0' },
                  { icon: BarChart3, label: isAr ? '8+ شركات' : '8+ companies' },
                ].map((s, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
                    <s.icon className="w-3 h-3" /> {s.label}
                  </span>
                ))}
              </div>
            </div>
            <Link href="/about" className="hidden md:inline-flex text-sm font-medium px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
              {isAr ? 'المزيد' : 'View Profile'}
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ DESCRIPTION + CURRICULUM ══════════════════ */}
      <section className="py-14" style={{ backgroundColor: '#111d33' }}>
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-8">
            {/* Description */}
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#fff' }}>{isAr ? 'عن الكورس' : 'About This Course'}</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {course.description}
              </p>
            </div>

            {/* Course Feedback (only for enrolled) */}
            {enrolled && user?.role !== 'admin' && (
              <div className="space-y-3">
                <CourseFeedback courseId={String(id)} kind="first" />
                <CourseFeedback courseId={String(id)} kind="last" />
              </div>
            )}

            {/* Curriculum */}
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: '#fff' }}>{isAr ? 'محتوى الكورس' : 'Course Content'}</h2>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {sections.length} {isAr ? 'أقسام' : 'sections'} · {totalLessons} {isAr ? 'درس' : 'lessons'} · {totalMinutes > 0 ? formatDuration(totalMinutes) : `${course.duration_hours}h`}
              </p>
              <div className="space-y-2">
                {sections.map((section) => (
                  <div key={section.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <button onClick={() => setExpanded((p) => ({ ...p, [section.id]: !p[section.id] }))}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                      style={{ backgroundColor: '#162038' }}>
                      <span className="font-medium text-sm" style={{ color: '#e2e8f0' }}>{section.title}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{section.lessons?.length || 0} {isAr ? 'درس' : 'lessons'}{sectionDuration(section) ? ` · ${sectionDuration(section)}` : ''}</span>
                        {expanded[section.id] ? <ChevronUp className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />}
                      </div>
                    </button>
                    {expanded[section.id] && (
                      <div style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                        {section.lessons?.map((lesson) => (
                          <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                            {lesson.is_preview || enrolled
                              ? <Play className="w-4 h-4 flex-shrink-0" style={{ color: '#3b82f6' }} />
                              : <Lock className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />}
                            <span className="text-sm flex-1" style={{ color: lesson.is_preview || enrolled ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }}>
                              {lesson.title}
                            </span>
                            {lesson.is_preview && !enrolled && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>Preview</span>
                            )}
                            {lesson.duration_minutes > 0 && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{formatDuration(lesson.duration_minutes)}</span>}
                          </div>
                        ))}
                        {/* Quizzes for this section */}
                        {quizzes.filter(q => q.section_id === section.id).map(quiz => (
                          <div key={quiz.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                            {enrolled ? (
                              <Link href={`/courses/${id}/quiz/${quiz.id}`}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors">
                                <HelpCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#a855f7' }} />
                                <span className="text-sm flex-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{quiz.title}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
                                  {quiz.question_count} سؤال
                                </span>
                              </Link>
                            ) : (
                              <div className="flex items-center gap-3 px-4 py-2.5">
                                <Lock className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
                                <span className="text-sm flex-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{quiz.title}</span>
                                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>كويز</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <ReviewSection courseId={String(id)} />

            {/* Consultation Booking */}
            {course.instructor_profile_id && (
              <ConsultationSection
                instructorId={course.instructor_profile_id}
                instructorName={course.instructor_name}
              />
            )}

            {/* Discussion Forum */}
            {enrolled && <DiscussionForum courseId={String(id)} />}
          </div>

          {/* Right spacer for layout alignment with sticky card above */}
          <div className="lg:col-span-2" />
        </div>
      </section>

      {/* AI Chatbot */}
      {enrolled && <AIChatbot courseId={String(id)} />}

      <PublicFooter />
    </div>
  );
}
