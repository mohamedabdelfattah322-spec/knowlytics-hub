'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Clock, Users, Play, Lock, ChevronDown, ChevronUp, Loader2, CheckCircle, ShoppingCart, Phone, Trophy, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, levelColor, cn } from '@/lib/utils';
import CourseFeedback from '@/components/CourseFeedback';
import CertificateButton from '@/components/CertificateButton';
import ReviewSection from '@/components/course/ReviewSection';
import DiscussionForum from '@/components/course/DiscussionForum';

interface Lesson {
  id: string; title: string; type: string; duration_minutes: number; is_preview: boolean;
}
interface Section {
  id: string; title: string; order_index: number; lessons: Lesson[];
}
interface Course {
  id: string; title: string; description: string; type: string; level: string;
  price: number; duration_hours: number; thumbnail_url: string;
  instructor_name: string; enrollment_count: string;
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [examStatus, setExamStatus] = useState<any>(null);
  const [feedbackSummary, setFeedbackSummary] = useState<{ total_reviews: number; avg_rating: number; recommend_count: number } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/courses/${id}`).then(({ data }) => {
      setCourse(data.course);
      setSections(data.sections || []);
      if (data.sections?.length) setExpanded({ [data.sections[0].id]: true });
    }).finally(() => setLoading(false));

    api.get(`/courses/${id}/feedback-summary`).then(({ data }) => setFeedbackSummary(data)).catch(() => {});

    if (user) {
      api.get('/enrollments/my').then(({ data }) => {
        setEnrolled(data.some((e: any) => e.course_id === id));
      });
      api.get(`/courses/${id}/final-quiz-status`)
        .then(({ data }) => setExamStatus(data))
        .catch(() => {});
    }
  }, [id, user]);

  const handleBuy = () => {
    if (!user) { router.push(`/login?redirect=/courses/${id}/buy`); return; }
    router.push(`/courses/${id}/buy`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }
  if (!course) return <div className="min-h-screen bg-dark-900 flex items-center justify-center text-slate-400">Course not found.</div>;

  const totalLessons = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Nav */}
      <div className="border-b border-dark-700 px-6 py-4 sticky top-0 bg-dark-900/80 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/courses" className="text-slate-400 hover:text-white text-sm">← Courses</Link>
          <span className="text-dark-600">/</span>
          <span className="text-slate-300 text-sm truncate">{course.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-8">
        {/* Left: Course info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <span className={cn('badge', course.type === 'live' ? 'badge-purple' : 'badge-blue')}>{course.type}</span>
            <span className={levelColor(course.level)}>{course.level}</span>
          </div>
          <h1 className="text-3xl font-bold text-white leading-snug">{course.title}</h1>
          <p className="text-slate-400 leading-relaxed whitespace-pre-line md:columns-2 md:gap-8 md:[column-rule:1px_solid_rgb(51_65_85_/_0.5)]">
            {course.description}
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-brand-400" />{course.duration_hours} ساعة</span>
            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-brand-400" />{sections.length} قسم</span>
            <span className="flex items-center gap-1.5"><Play className="w-4 h-4 text-brand-400" />{totalLessons} درس</span>
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-brand-400" />{course.enrollment_count} طالب</span>
            {feedbackSummary && feedbackSummary.total_reviews > 0 && (
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 font-bold">{feedbackSummary.avg_rating}</span>
                <span>({feedbackSummary.total_reviews} تقييم)</span>
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm">Instructor: <span className="text-white font-medium">{course.instructor_name}</span></p>

          {/* Course Feedback (only for enrolled students) */}
          {enrolled && user?.role !== 'admin' && (
            <div className="space-y-3">
              <CourseFeedback courseId={String(id)} kind="first" />
              <CourseFeedback courseId={String(id)} kind="last" />
            </div>
          )}

          {/* Curriculum */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Course Content</h2>
            <div className="space-y-2">
              {sections.map((section) => (
                <div key={section.id} className="border border-dark-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpanded((p) => ({ ...p, [section.id]: !p[section.id] }))}
                    className="w-full flex items-center justify-between px-4 py-3 bg-dark-800 hover:bg-dark-700 transition-colors text-left"
                  >
                    <span className="font-medium text-slate-200">{section.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs">{section.lessons?.length || 0} lessons</span>
                      {expanded[section.id] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>
                  {expanded[section.id] && (
                    <div className="divide-y divide-dark-700">
                      {section.lessons?.map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 bg-dark-900/50">
                          {lesson.is_preview || enrolled
                            ? <Play className="w-4 h-4 text-brand-400 flex-shrink-0" />
                            : <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                          <span className={cn('text-sm flex-1', lesson.is_preview || enrolled ? 'text-slate-300' : 'text-slate-500')}>
                            {lesson.title}
                          </span>
                          {lesson.is_preview && !enrolled && (
                            <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">Preview</span>
                          )}
                          <span className="text-xs text-slate-500">{lesson.duration_minutes}m</span>
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

          {/* Discussion Forum */}
          {enrolled && <DiscussionForum courseId={String(id)} />}
        </div>

        {/* Right: Enrollment card */}
        <div>
          <div className="card sticky top-24">
            <div className="w-full h-44 bg-gradient-to-br from-brand-500/30 to-purple-500/30 rounded-lg flex items-center justify-center mb-5">
              <BookOpen className="w-14 h-14 text-brand-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {formatPrice(course.price)}
            </p>
            <p className="text-slate-400 text-sm mb-5">Lifetime access · All devices</p>

            {enrolled ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-400 font-medium text-sm mb-2">
                  <CheckCircle className="w-4 h-4" /> أنت مسجل بالفعل
                </div>
                {sections[0]?.lessons?.[0] && (
                  <Link href={`/courses/${id}/lessons/${sections[0].lessons[0].id}`} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" /> ابدأ التعلم
                  </Link>
                )}

                {/* Final Exam status */}
                {examStatus?.final_quiz && (
                  <div className="bg-dark-700/50 border border-dark-600 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-white font-medium">الامتحان النهائي</span>
                    </div>
                    {!examStatus.lessons_done ? (
                      <p className="text-xs text-slate-400">
                        🔒 يفتح بعد إكمال كل الدروس ({examStatus.completed_lessons}/{examStatus.total_lessons})
                      </p>
                    ) : examStatus.passed ? (
                      <p className="text-xs text-green-400">✓ نجحت بـ {examStatus.my_attempt?.score_pct}%</p>
                    ) : examStatus.my_attempt ? (
                      <p className="text-xs text-orange-400">حاولت — {examStatus.my_attempt.score_pct}% (النجاح من {examStatus.final_quiz.passing_score}%)</p>
                    ) : (
                      <p className="text-xs text-slate-400">جاهز للامتحان</p>
                    )}
                    <Link
                      href={`/courses/${id}/final-exam`}
                      className={`btn-secondary w-full text-sm flex items-center justify-center gap-1 ${!examStatus.lessons_done ? 'opacity-50 pointer-events-none' : ''}`}>
                      {examStatus.passed ? '🎉 شوف نتيجتك' : examStatus.my_attempt ? 'حاول مرة أخرى' : 'ابدأ الامتحان'}
                    </Link>
                  </div>
                )}

                {/* Certificate button — only after passing final quiz (or no quiz exists) */}
                {(!examStatus?.final_quiz || examStatus.passed) && (
                  <div className="flex justify-center pt-2">
                    <CertificateButton courseId={String(id)} />
                  </div>
                )}
              </div>
            ) : course.type === 'live' ? (
              <div className="space-y-3">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-sm text-purple-300 flex items-start gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">كورس مباشر</p>
                    <p className="text-xs text-purple-300/80">للتسجيل في الكورس تواصل مع الإدارة لإنشاء حسابك</p>
                  </div>
                </div>
                <a href="https://wa.me/201226929392" target="_blank" rel="noreferrer" className="btn-secondary w-full flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" /> تواصل مع الإدارة
                </a>
              </div>
            ) : parseFloat(String(course.price)) > 0 ? (
              <button onClick={handleBuy} className="btn-primary w-full flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" /> اشترِ الكورس الآن
              </button>
            ) : (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300 text-center">
                للوصول لهذا الكورس تواصل مع الإدارة
              </div>
            )}

            <div className="mt-5 space-y-2 text-sm text-slate-400">
              <div className="flex justify-between"><span>Lessons</span><span className="text-white">{totalLessons}</span></div>
              <div className="flex justify-between"><span>Duration</span><span className="text-white">{course.duration_hours}h</span></div>
              <div className="flex justify-between"><span>Level</span><span className="text-white">{course.level}</span></div>
              <div className="flex justify-between"><span>Type</span><span className="text-white capitalize">{course.type}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
