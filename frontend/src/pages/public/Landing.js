import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import {
  LayoutDashboard,
  Shirt,
  Ruler,
  Layers,
  Image as ImageIcon,
  Users,
  UserRound,
  Scissors,
  Receipt,
  Wallet,
  WashingMachine,
  BadgeCheck,
  MessageCircle,
  Globe,
  Database,
  ShieldCheck,
  BarChart3,
  Settings,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

const Landing = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { loginDemo } = useAuth();

  const [langOpen, setLangOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

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
    document.documentElement.classList.remove('dark');
    if (!localStorage.getItem('theme')) {
      localStorage.setItem('theme', 'light');
    }
  }, []);

  const handleDemo = async () => {
    setDemoLoading(true);
    const result = await loginDemo();
    setDemoLoading(false);
    if (result?.success) {
      navigate('/user/dashboard');
      return;
    }
  };

  const aToZ = [
    {
      icon: LayoutDashboard,
      title: 'Dashboard (Live Overview)',
      desc: 'A clear overview of daily work: orders, due dates, totals, and workload at a glance.'
    },
    {
      icon: Scissors,
      title: 'Orders & Stitchings',
      desc: 'Create orders fast, assign workers, track status, and print labels/receipts.'
    },
    {
      icon: Shirt,
      title: 'Thawb Types & Catalogs',
      desc: 'Manage thawb type catalogs and style catalogs so every order stays consistent.'
    },
    {
      icon: Layers,
      title: 'Style Options',
      desc: 'Select collar, cuff, pocket, bain and more using structured options saved per order.'
    },
    {
      icon: Ruler,
      title: 'Measurements',
      desc: 'Store measurements per customer and reuse them to avoid repeated manual entry.'
    },
    {
      icon: ImageIcon,
      title: 'Embroidery Designs',
      desc: 'Upload designs, preview instantly, and attach them to orders with a clean workflow.'
    },
    {
      icon: Users,
      title: 'Customers',
      desc: 'Customer profiles with history, quick actions, and a timeline of past orders.'
    },
    {
      icon: UserRound,
      title: 'Relations (Order For)',
      desc: 'Store and use relations like son/brother/relation to keep customer records accurate.'
    },
    {
      icon: Wallet,
      title: 'Payments & Balances',
      desc: 'Track paid vs pending amounts clearly to avoid mistakes at checkout.'
    },
    {
      icon: WashingMachine,
      title: 'Laundry Module',
      desc: 'Laundry pricing per piece, assigned pieces, and payment history per laundry item.'
    },
    {
      icon: Receipt,
      title: 'Invoices & Printing',
      desc: 'Generate invoices/receipts and print labels with consistent formatting.'
    },
    {
      icon: BadgeCheck,
      title: 'ZATCA E‑Invoicing',
      desc: 'ZATCA-ready e-invoicing features with QR code and compliance utilities.'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp & Notifications',
      desc: 'Send updates and messages with templates to keep customers informed.'
    },
    {
      icon: Globe,
      title: 'Multi‑Language + RTL',
      desc: 'Interface supports multiple languages and RTL where needed.'
    },
    {
      icon: BarChart3,
      title: 'Reports',
      desc: 'Track totals, performance and key numbers to support better decisions.'
    },
    {
      icon: ShieldCheck,
      title: 'Roles & Security',
      desc: 'Admin/user/worker role separation with safe defaults and controlled actions.'
    },
    {
      icon: Database,
      title: 'Backup & Export',
      desc: 'Keep your business data safe with export options and structured storage.'
    },
    {
      icon: Settings,
      title: 'Settings',
      desc: 'Configure your shop preferences, language, invoice settings, and more.'
    }
  ];

  const featureDetail = [
    {
      icon: LayoutDashboard,
      title: 'Live Dashboard Preview',
      points: [
        'See totals, due dates, and workload in one place.',
        'Search orders, customers, and workers instantly.',
        'Quick actions for the most common tasks.'
      ]
    },
    {
      icon: Scissors,
      title: 'Orders & Stitchings (End‑to‑End)',
      points: [
        'Create orders with thawb type, style options, measurements, and instructions.',
        'Assign workers and track progress with clear statuses.',
        'Print labels/receipts and keep everything consistent for front desk staff.'
      ]
    },
    {
      icon: Users,
      title: 'Customers + Profiles',
      points: [
        'Profiles include contact, history, and quick actions.',
        'Relations supported (Order For: son/brother/relation).',
        'Faster repeat orders using saved data.'
      ]
    },
    {
      icon: Ruler,
      title: 'Measurements',
      points: [
        'Store measurements per customer and reuse anytime.',
        'Reduce manual mistakes by keeping measurements standardized.',
        'Edit, review, and print measurements when needed.'
      ]
    },
    {
      icon: Layers,
      title: 'Style Options + Thawb Types',
      points: [
        'Use structured style choices (collar, cuff, pocket, bain, etc.).',
        'Consistency across staff: same names, same saved values.',
        'Quick selection during order entry.'
      ]
    },
    {
      icon: ImageIcon,
      title: 'Embroidery Designs',
      points: [
        'Upload designs and preview immediately.',
        'Attach designs to orders so workers see the right reference.',
        'Build a reusable library for your shop.'
      ]
    },
    {
      icon: Wallet,
      title: 'Payments + Pending Amount',
      points: [
        'Track paid vs pending at order level.',
        'Clear totals for front desk decisions.',
        'Avoid under/over-collection with a visible balance.'
      ]
    },
    {
      icon: WashingMachine,
      title: 'Laundry (Pricing + Payments)',
      points: [
        'Price per piece, assigned pieces, and totals.',
        'Payment history for each laundry customer/item.',
        'Clear pending amount to manage collections.'
      ]
    },
    {
      icon: BadgeCheck,
      title: 'ZATCA E‑Invoicing',
      points: [
        'Generate invoice data with QR.',
        'Designed for Saudi compliance workflows.',
        'Export and manage invoice-related details.'
      ]
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp + Customer Updates',
      points: [
        'Send updates quickly using templates.',
        'Reduce customer calls by proactively sharing status.',
        'Keep communication consistent across staff.'
      ]
    },
    {
      icon: Globe,
      title: 'Multi‑Language + RTL',
      points: [
        'English + العربية + हिन्दी + اردو + বাংলা.',
        'RTL support where needed.',
        'Better experience for diverse teams.'
      ]
    },
    {
      icon: ShieldCheck,
      title: 'Roles + Access Control',
      points: [
        'Admin/user/worker separation.',
        'Safer operations with controlled actions.',
        'Designed to scale from one branch to multiple.'
      ]
    },
    {
      icon: Database,
      title: 'Backup + Export',
      points: [
        'Keep records safe and portable.',
        'Export data for reporting or safekeeping.',
        'Structured storage for long-term reliability.'
      ]
    },
    {
      icon: Settings,
      title: 'Settings',
      points: [
        'Shop settings in one place.',
        'Invoice/ZATCA related settings.',
        'Language preferences.'
      ]
    }
  ];

  return (
    <div className={`min-h-screen bg-white text-slate-950 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-[#D5B25B]/10 blur-3xl" />
          <div className="absolute -top-56 right-[-120px] w-[620px] h-[620px] rounded-full bg-[#D5B25B]/8 blur-3xl" />
          <div className="absolute bottom-[-160px] left-1/3 w-[520px] h-[520px] rounded-full bg-black/5 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/khayatoslogo.png" alt="KhayyatOS" className="h-10 w-auto object-contain" />
              <div>
                <div className="text-sm font-semibold tracking-[0.25em]">KHAYYAT</div>
                <div className="text-xs text-slate-500">Tailoring OS</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLangOpen((v) => !v)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 bg-white/80 hover:bg-white transition-colors"
                >
                  <span className="text-lg">{languages.find((l) => l.code === currentLang)?.flag}</span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            i18n.changeLanguage(lang.code);
                            setLangOpen(false);
                          }}
                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors ${currentLang === lang.code ? 'bg-slate-50' : ''}`}
                        >
                          <span className="text-xl">{lang.flag}</span>
                          <span className={`text-sm font-medium ${currentLang === lang.code ? 'text-slate-900' : 'text-slate-900'}`}>{lang.label}</span>
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
              <Button
                variant="outline"
                className="rounded-2xl bg-[#D5B25B] hover:bg-[#caa84f] border-[#D5B25B] text-black focus:ring-[#D5B25B]"
                onClick={() => navigate('/login')}
              >
                {t('auth.login', { defaultValue: 'Login' })}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-slate-200 text-slate-700 text-xs tracking-widest">
                <BadgeCheck className="w-4 h-4 text-[#D5B25B]" />
                {t('landing.badge', { defaultValue: 'TAILORING MANAGEMENT SYSTEM' })}
              </div>

              <h1 className="mt-6 text-4xl md:text-5xl font-semibold leading-tight">
                {t('landing.heroTitle', { defaultValue: 'Run your tailor shop with clarity and speed.' })}
              </h1>
              <p className="mt-4 text-slate-600 text-base md:text-lg max-w-xl">
                {t('landing.heroSubtitle', { defaultValue: 'Orders, customers, workers, catalogs, ZATCA, WhatsApp, embroidery designs, multi‑language, laundry and payments — all in one system.' })}
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="rounded-2xl bg-[#D5B25B] hover:bg-[#caa84f] border-[#D5B25B] text-black focus:ring-[#D5B25B]"
                >
                  {t('landing.ctaPrimary', { defaultValue: 'Get Started' })}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="lg" onClick={handleDemo} className="rounded-2xl" loading={demoLoading}>
                  {t('landing.liveDemo', { defaultValue: 'Live Demo' })}
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D5B25B]/10 border border-[#D5B25B]/20">
                  <ShieldCheck className="w-4 h-4 text-[#D5B25B]" />
                  {t('landing.zatcaReady', { defaultValue: 'ZATCA Ready' })}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 border border-black/10">
                  <Globe className="w-4 h-4 text-slate-700" />
                  {t('landing.multiLang', { defaultValue: 'Multi‑Language + RTL' })}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 border border-black/10">
                  <LayoutDashboard className="w-4 h-4 text-slate-700" />
                  {t('landing.demoHint', { defaultValue: 'Live demo is read‑only' })}
                </div>
              </div>
            </div>

            <div>
              <Card className="bg-white/90 border border-slate-200 rounded-3xl overflow-hidden">
                <CardBody>
                  <div className="p-6">
                    <div className="text-sm font-semibold text-slate-900 tracking-widest">
                      {t('landing.whatsInside', { defaultValue: 'LIVE DASHBOARD PREVIEW' })}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[{ label: 'Orders', value: '128' }, { label: 'Due Today', value: '7' }, { label: 'Customers', value: '1,240' }, { label: 'Pending', value: '42' }].map((kpi) => (
                        <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="text-xs text-slate-500 tracking-widest uppercase">{kpi.label}</div>
                          <div className="mt-1 text-2xl font-semibold text-slate-900">{kpi.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200 text-xs tracking-widest uppercase text-slate-600">
                        Recent Activity
                      </div>
                      <div className="divide-y divide-slate-200">
                        {[
                          { title: 'Order #1048', sub: 'Assigned to Worker A', tag: 'In Progress' },
                          { title: 'Order #1046', sub: 'Customer: Ahmed', tag: 'Ready' },
                          { title: 'Laundry: 18 pcs', sub: 'Payment updated', tag: 'Paid' }
                        ].map((row) => (
                          <div key={row.title} className="px-4 py-3 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-slate-900">{row.title}</div>
                              <div className="text-xs text-slate-500">{row.sub}</div>
                            </div>
                            <div className="text-[11px] px-2 py-1 rounded-full bg-[#D5B25B]/10 text-[#7E6426] border border-[#D5B25B]/20 whitespace-nowrap">
                              {row.tag}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <Button variant="outline" className="rounded-2xl" onClick={handleDemo} loading={demoLoading}>
                        {t('landing.liveDemo', { defaultValue: 'Open Live Demo' })}
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-2xl bg-[#D5B25B] hover:bg-[#caa84f] border-[#D5B25B] text-black focus:ring-[#D5B25B]"
                        onClick={() => navigate('/login')}
                      >
                        {t('landing.ctaPrimary', { defaultValue: 'Get Started' })}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          <div className="mt-14">
            <div className="text-sm font-semibold text-slate-900 tracking-widest">
              {t('landing.featuresTitle', { defaultValue: 'A‑to‑Z FEATURES' })}
            </div>
            <div className="mt-2 text-slate-600">
              Everything below is available inside the system.
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4">
              {aToZ.map((f) => (
                <div key={f.title} className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#D5B25B]/10 border border-[#D5B25B]/20 flex items-center justify-center shrink-0">
                      <f.icon className="w-5 h-5 text-[#7E6426]" />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-slate-900">{f.title}</div>
                      <div className="mt-1 text-sm text-slate-600 leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <div className="text-sm font-semibold text-slate-900 tracking-widest">
                {t('landing.featuresDetailTitle', { defaultValue: 'FEATURES (DETAILED)' })}
              </div>
              <div className="mt-6 space-y-4">
                {featureDetail.map((f, idx) => (
                  <div key={f.title} className="rounded-3xl border border-slate-200 bg-white p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#D5B25B]/10 border border-[#D5B25B]/20 flex items-center justify-center shrink-0">
                        <f.icon className="w-6 h-6 text-[#7E6426]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-lg font-semibold text-slate-900">{f.title}</div>
                          <div className="text-xs text-slate-500 tracking-widest">{String(idx + 1).padStart(2, '0')}</div>
                        </div>
                        <div className="mt-3 space-y-2">
                          {f.points.map((p) => (
                            <div key={p} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#D5B25B]" />
                              <span className="leading-relaxed">{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-14 border-t border-slate-200 pt-8 pb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-sm text-slate-600">
                {t('landing.contact', { defaultValue: 'Contact' })}: <a className="text-slate-900 underline" href="tel:+966596775485">+966596775485</a>
              </div>
              <div className="text-sm text-slate-600">
                {t('landing.footerNote', { defaultValue: 'Book a demo for your tailor shop.' })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
