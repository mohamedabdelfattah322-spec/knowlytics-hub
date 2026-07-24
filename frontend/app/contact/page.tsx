'use client';
import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageCircle } from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import { useLanguage } from '@/hooks/useLanguage';

export default function ContactPage() {
  const { t, isAr, dir } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    // In production this would send to an API
    await new Promise(r => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen" dir={dir} style={{ backgroundColor: '#0a1628' }}>
      <PublicNavbar />

      {/* Header */}
      <section className="py-16 text-center" style={{ backgroundColor: '#0f1d32' }}>
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ color: '#ffffff' }}>
            {t('landing.footerContact')}
          </h1>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {isAr ? 'تقدر تتواصل معانا بأي طريقة تناسبك' : 'Reach out to us through any channel you prefer'}
          </p>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: '#0a1628' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10">

            {/* Contact Info */}
            <div className="space-y-6">
              {[
                { icon: MessageCircle, label: isAr ? 'واتساب' : 'WhatsApp', value: '+20 122 692 9392', href: 'https://wa.me/201226929392', color: '#4ade80' },
                { icon: Mail, label: isAr ? 'البريد الإلكتروني' : 'Email', value: 'Sales@knowlyticshub.com', href: 'mailto:Sales@knowlyticshub.com', color: '#3b82f6' },
                { icon: Phone, label: isAr ? 'الهاتف' : 'Phone', value: '+20 122 692 9392', href: 'tel:+201226929392', color: '#a78bfa' },
              ].map((item, i) => (
                <a key={i} href={item.href} target="_blank" rel="noreferrer"
                   className="flex items-center gap-5 p-5 rounded-2xl hover:scale-[1.01] transition-transform"
                   style={{ backgroundColor: '#162038', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15` }}>
                    <item.icon className="w-6 h-6" style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</p>
                    <p className="font-semibold text-base" style={{ color: '#ffffff' }}>{item.value}</p>
                  </div>
                </a>
              ))}

              {/* Main website link */}
              <a href="https://knowlyticshub.com" target="_blank" rel="noreferrer"
                 className="flex items-center gap-5 p-5 rounded-2xl hover:scale-[1.01] transition-transform"
                 style={{ backgroundColor: '#162038', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
                  <MapPin className="w-6 h-6" style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('landing.footerMainSite')}</p>
                  <p className="font-semibold text-base" style={{ color: '#3b82f6' }}>knowlyticshub.com</p>
                </div>
              </a>
            </div>

            {/* Contact Form */}
            <div className="rounded-2xl p-8" style={{ backgroundColor: '#162038', border: '1px solid rgba(255,255,255,0.08)' }}>
              {sent ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#10b981' }} />
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#ffffff' }}>
                    {isAr ? 'تم الإرسال بنجاح!' : 'Message Sent!'}
                  </h3>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {isAr ? 'هنرد عليك في أقرب وقت' : 'We\'ll get back to you soon'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#ffffff' }}>
                    {isAr ? 'أرسل لنا رسالة' : 'Send us a message'}
                  </h3>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {isAr ? 'الاسم' : 'Name'}
                    </label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-sm" placeholder={isAr ? 'اسمك الكامل' : 'Your full name'}
                      style={{ backgroundColor: '#0f1d32', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {isAr ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-sm" placeholder={isAr ? 'بريدك الإلكتروني' : 'Your email'}
                      style={{ backgroundColor: '#0f1d32', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {isAr ? 'الرسالة' : 'Message'}
                    </label>
                    <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={4} className="w-full px-4 py-3 rounded-xl text-sm resize-none" placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Write your message...'}
                      style={{ backgroundColor: '#0f1d32', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  </div>
                  <button type="submit" disabled={loading || !form.name || !form.email || !form.message}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
                    style={{ backgroundColor: '#3b82f6', color: '#fff' }}>
                    <Send className="w-4 h-4" /> {loading ? '...' : (isAr ? 'إرسال' : 'Send Message')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
