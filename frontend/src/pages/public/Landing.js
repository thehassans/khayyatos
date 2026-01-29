import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import {
  Sparkles,
  Scissors,
  ShieldCheck,
  Globe,
  Image as ImageIcon,
  Receipt,
  Users,
  MessageCircle,
  Database,
  TrendingUp,
  ArrowRight,
  Moon,
  Sun,
  ChevronDown
} from 'lucide-react';

const Landing = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { loginDemo } = useAuth();

  const [langOpen, setLangOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [dark, setDark] = useState(false);

  const currentLang = (i18n?.language || 'en').split('-')[0];
  const isRTL = ['ar', 'ur'].includes(currentLang);

  const languages = useMemo(() => ([
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ur', label: 'اردو', flag: '🇵🇰' },
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩' }
  ]), []);

  useEffect(() => {
    const preferred = localStorage.getItem('theme') || 'light';
    const isDark = preferred === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    if (!localStorage.getItem('theme')) {
      localStorage.setItem('theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    const result = await loginDemo();
    setDemoLoading(false);
    if (result?.success) {
      navigate('/user/dashboard');
      return;
    }
  };

  const features = [
    {
      icon: Scissors,
      title: t('landing.features.orders.title', { defaultValue: 'Orders & Stitchings' }),
      desc: t('landing.features.orders.desc', { defaultValue: 'Create, assign, track, and print receipts with a premium workflow.' })
    },
    {
      icon: ImageIcon,
      title: t('landing.features.embroidery.title', { defaultValue: 'Embroidery Designs' }),
      desc: t('landing.features.embroidery.desc', { defaultValue: 'Upload design library, auto-WEBP, preview, and create orders with one click.' })
    },
    {
      icon: Users,
      title: t('landing.features.customers.title', { defaultValue: 'Customers & Profiles' }),
      desc: t('landing.features.customers.desc', { defaultValue: 'Full customer profiles, relations, history timeline, and quick actions.' })
    },
    {
      icon: TrendingUp,
      title: t('landing.features.loyalty.title', { defaultValue: 'Customer Loyalty' }),
      desc: t('landing.features.loyalty.desc', { defaultValue: 'Loyalty points, totals, and retention-focused tools built-in.' })
    },
    {
      icon: MessageCircle,
      title: t('landing.features.whatsapp.title', { defaultValue: 'WhatsApp Integration' }),
      desc: t('landing.features.whatsapp.desc', { defaultValue: 'Send order updates and notifications with templates and automation.' })
    },
    {
      icon: Receipt,
      title: t('landing.features.zatca.title', { defaultValue: 'ZATCA E‑Invoicing' }),
      desc: t('landing.features.zatca.desc', { defaultValue: 'Saudi ZATCA-ready workflow with QR and compliance features.' })
    },
    {
      icon: Globe,
      title: t('landing.features.languages.title', { defaultValue: 'Multi‑Language' }),
      desc: t('landing.features.languages.desc', { defaultValue: 'English, العربية, हिन्दी, اردو, বাংলা with RTL support.' })
    },
    {
      icon: Database,
      title: t('landing.features.backup.title', { defaultValue: 'Backup & Export' }),
      desc: t('landing.features.backup.desc', { defaultValue: 'Export data safely and keep your shop protected.' })
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b from-white via-white to-gray-50 dark:from-slate-950 dark:via-slate-950 dark:to-black text-gray-900 dark:text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -top-52 right-0 w-[560px] h-[560px] rounded-full bg-sky-500/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-[520px] h-[520px] rounded-full bg-amber-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gray-900/5 dark:bg-white/10 border border-gray-900/10 dark:border-white/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-gray-900 dark:text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-[0.25em]">KHAYYAT</div>
                <div className="text-xs text-gray-500 dark:text-white/60">Tailoring OS</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center w-10 h-10 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 transition-colors"
                title={dark ? t('landing.themeLight', { defaultValue: 'Light' }) : t('landing.themeDark', { defaultValue: 'Dark' })}
              >
                {dark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLangOpen((v) => !v)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 transition-colors"
                >
                  <span className="text-lg">{languages.find((l) => l.code === currentLang)?.flag}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-white/60" />
                </button>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950 shadow-2xl z-50 overflow-hidden">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            i18n.changeLanguage(lang.code);
                            setLangOpen(false);
                          }}
                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${currentLang === lang.code ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                        >
                          <span className="text-xl">{lang.flag}</span>
                          <span className={`text-sm font-medium ${currentLang === lang.code ? 'text-primary-700 dark:text-primary-200' : 'text-gray-900 dark:text-white'}`}>{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Button variant="outline" className="rounded-2xl" onClick={() => navigate('/track-order')}>
                {t('landing.trackOrder', { defaultValue: 'Track Order' })}
              </Button>
              <Button variant="outline" className="rounded-2xl" onClick={handleDemo} loading={demoLoading}>
                {t('landing.liveDemo', { defaultValue: 'Live Demo' })}
              </Button>
              <Button variant="success" className="rounded-2xl" onClick={() => navigate('/login')}>
                {t('auth.login', { defaultValue: 'Login' })}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 text-xs tracking-widest">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                {t('landing.badge', { defaultValue: 'ULTRA‑PREMIUM TAILORING PLATFORM' })}
              </div>

              <h1 className="mt-6 text-4xl md:text-5xl font-semibold leading-tight">
                {t('landing.heroTitle', { defaultValue: 'Run your tailor shop like a modern SaaS.' })}
              </h1>
              <p className="mt-4 text-gray-600 dark:text-white/70 text-base md:text-lg max-w-xl">
                {t('landing.heroSubtitle', { defaultValue: 'Orders, customers, workers, catalogs, ZATCA, WhatsApp, embroidery designs, multi-language, and more — crafted with premium UX.' })}
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Button variant="success" size="lg" onClick={() => navigate('/login')} className="rounded-2xl">
                  {t('landing.ctaPrimary', { defaultValue: 'Get Started' })}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="lg" onClick={handleDemo} className="rounded-2xl" loading={demoLoading}>
                  {t('landing.liveDemo', { defaultValue: 'Live Demo' })}
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-white/60">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                  {t('landing.zatcaReady', { defaultValue: 'ZATCA Ready' })}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/5 dark:bg-white/5 border border-gray-900/10 dark:border-white/10">
                  <Globe className="w-4 h-4 text-gray-700 dark:text-white/70" />
                  {t('landing.multiLang', { defaultValue: 'Multi‑Language + RTL' })}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                  {t('landing.demoHint', { defaultValue: 'Live demo is read‑only' })}
                </div>
              </div>
            </div>

            <div>
              <Card className="bg-white/80 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden">
                <CardBody>
                  <div className="p-6">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white/80 tracking-widest">
                      {t('landing.whatsInside', { defaultValue: 'WHAT’S INSIDE' })}
                    </div>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {features.slice(0, 4).map((f) => (
                        <div key={f.title} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gray-900/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center">
                              <f.icon className="w-5 h-5 text-gray-900 dark:text-white/80" />
                            </div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{f.title}</div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600 dark:text-white/60 leading-relaxed">{f.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          <div className="mt-12">
            <div className="text-sm font-semibold text-gray-900 dark:text-white/80 tracking-widest">
              {t('landing.featuresTitle', { defaultValue: 'A‑to‑Z FEATURES' })}
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((f) => (
                <div key={f.title} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-4 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-900/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center">
                      <f.icon className="w-4 h-4 text-gray-900 dark:text-white/80" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{f.title}</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 dark:text-white/60 leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 border-t border-gray-200 dark:border-white/10 pt-8 pb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-white/60">
                {t('landing.contact', { defaultValue: 'Contact' })}: <a className="text-gray-900 dark:text-white underline" href="tel:+966596775485">+966596775485</a>
              </div>
              <div className="text-sm text-gray-600 dark:text-white/60">
                {t('landing.footerNote', { defaultValue: 'Book a free trial for your tailor shop.' })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
