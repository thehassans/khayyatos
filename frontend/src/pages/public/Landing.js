import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Scissors,
  Ruler,
  Layers,
  Image as ImageIcon,
  Users,
  UserRound,
  Receipt,
  Wallet,
  Droplets,
  BadgeCheck,
  MessageCircle,
  Globe,
  Database,
  ShieldCheck,
  Zap,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  Phone,
  Sparkles
} from 'lucide-react';

const GOLD = '#D5B25B';

const Landing = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { loginDemo } = useAuth();

  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const featuresRef = useRef(null);
  const howRef = useRef(null);
  const contactRef = useRef(null);

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
    if (!localStorage.getItem('theme')) localStorage.setItem('theme', 'light');
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDemo = async () => {
    setDemoLoading(true);
    const result = await loginDemo();
    setDemoLoading(false);
    if (result?.success) navigate('/user/dashboard');
  };

  const scrollTo = (ref) => {
    setMobileMenuOpen(false);
    ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const features = [
    { key: 'dashboard', icon: LayoutDashboard },
    { key: 'orders', icon: Scissors },
    { key: 'measurements', icon: Ruler },
    { key: 'customers', icon: Users },
    { key: 'workers', icon: UserRound },
    { key: 'embroidery', icon: ImageIcon },
    { key: 'styles', icon: Layers },
    { key: 'fabrics', icon: Wallet },
    { key: 'invoices', icon: Receipt },
    { key: 'whatsapp', icon: MessageCircle },
    { key: 'zatca', icon: BadgeCheck },
    { key: 'laundry', icon: Droplets },
    { key: 'loyalty', icon: Sparkles },
    { key: 'languages', icon: Globe },
    { key: 'roles', icon: ShieldCheck },
    { key: 'backup', icon: Database }
  ];

  const steps = [
    { num: '01', titleKey: 'landing.step1Title', descKey: 'landing.step1Desc' },
    { num: '02', titleKey: 'landing.step2Title', descKey: 'landing.step2Desc' },
    { num: '03', titleKey: 'landing.step3Title', descKey: 'landing.step3Desc' }
  ];

  const stats = [
    { key: 'features', icon: Zap },
    { key: 'languages', icon: Globe },
    { key: 'rtl', icon: ArrowRight },
    { key: 'fast', icon: Sparkles }
  ];

  return (
    <div className={`min-h-screen bg-white text-slate-950 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/70 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            <div className="flex items-center gap-2.5">
              <img src="/khayatoslogo.webp" alt="KhayyatOS" className="h-9 w-auto object-contain" />
              <div className="hidden sm:block">
                <div className="text-sm font-bold tracking-[0.2em] text-slate-900">KHAYYAT</div>
                <div className="text-[10px] text-slate-500 tracking-wider -mt-0.5">Tailoring OS</div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-6">
              <button onClick={() => scrollTo(featuresRef)} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{t('landing.nav.features')}</button>
              <button onClick={() => scrollTo(howRef)} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{t('landing.nav.howItWorks')}</button>
              <button onClick={() => scrollTo(contactRef)} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{t('landing.nav.contact')}</button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setLangOpen(v => !v)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/70 bg-white/80 hover:bg-white text-sm transition-colors">
                  <span>{languages.find(l => l.code === currentLang)?.flag}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                    <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden py-1`}>
                      {languages.map(lang => (
                        <button key={lang.code} onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }} className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-sm ${currentLang === lang.code ? 'bg-slate-50 font-semibold' : ''}`}>
                          <span className="text-base">{lang.flag}</span>
                          <span>{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button onClick={handleDemo} disabled={demoLoading} className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200/70 bg-white/80 hover:bg-white text-sm font-medium text-slate-700 transition-colors disabled:opacity-50">
                {demoLoading ? <span className="animate-spin w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-700 rounded-full" /> : null}
                {t('landing.liveDemo')}
              </button>
              <button onClick={() => navigate('/login')} className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-black transition-all hover:brightness-95" style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96A)` }}>
                {t('auth.login', { defaultValue: 'Login' })}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setMobileMenuOpen(v => !v)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200/70 bg-white/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-2">
              <button onClick={() => scrollTo(featuresRef)} className="w-full text-start px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">{t('landing.nav.features')}</button>
              <button onClick={() => scrollTo(howRef)} className="w-full text-start px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">{t('landing.nav.howItWorks')}</button>
              <button onClick={() => scrollTo(contactRef)} className="w-full text-start px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">{t('landing.nav.contact')}</button>
              <div className="pt-2 flex flex-col gap-2">
                <button onClick={handleDemo} disabled={demoLoading} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  {t('landing.liveDemo')}
                </button>
                <button onClick={() => navigate('/login')} className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-black" style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96A)` }}>
                  {t('auth.login', { defaultValue: 'Login' })}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#060606] pt-28 sm:pt-36 pb-20 sm:pb-28">
        <video
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src="/videos/Thawb.webm" type="video/webm" />
          <source src="/videos/Thawb.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#060606]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <BadgeCheck className="w-4 h-4" style={{ color: GOLD }} />
            <span className="text-xs font-semibold tracking-widest text-white/70">{t('landing.badge')}</span>
          </div>

          <h1 className="mt-8 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] text-white max-w-4xl mx-auto">
            {t('landing.heroTitle')}
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            {t('landing.heroSubtitle')}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-black transition-all hover:brightness-95 hover:scale-[1.02]" style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96A)` }}>
              {t('landing.ctaPrimary')}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={handleDemo} disabled={demoLoading} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-semibold text-white border border-white/15 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50">
              {demoLoading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : null}
              {t('landing.liveDemo')}
            </button>
            <button onClick={() => navigate('/track-order')} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-medium text-white/70 border border-white/10 hover:bg-white/5 transition-all">
              {t('landing.trackOrder')}
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: GOLD }} />
              <span className="text-white/60">{t('landing.zatcaReady')}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
              <Globe className="w-3.5 h-3.5" style={{ color: GOLD }} />
              <span className="text-white/60">{t('landing.multiLang')}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
              <LayoutDashboard className="w-3.5 h-3.5" style={{ color: GOLD }} />
              <span className="text-white/60">{t('landing.demoHint')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="relative -mt-8 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl border border-slate-200/70 bg-white shadow-xl shadow-black/5">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
              {stats.map(s => (
                <div key={s.key} className="flex items-center gap-3 px-5 py-5 sm:px-6 sm:py-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${GOLD}15` }}>
                    <s.icon className="w-5 h-5" style={{ color: '#7E6426' }} />
                  </div>
                  <div className="text-sm font-bold text-slate-900">{t(`landing.stats.${s.key}`)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section ref={featuresRef} className="pt-24 pb-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-bold tracking-widest uppercase" style={{ color: GOLD }}>{t('landing.whatsInside')}</div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">{t('landing.featuresTitle')}</h2>
            <p className="mt-3 text-slate-500 text-sm sm:text-base leading-relaxed">{t('landing.featuresSubtitle')}</p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(f => (
              <div key={f.key} className="group rounded-2xl border border-slate-200/70 bg-white p-5 hover:shadow-lg hover:border-slate-300/70 hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}25` }}>
                  <f.icon className="w-5 h-5" style={{ color: '#7E6426' }} />
                </div>
                <div className="mt-4 text-sm font-bold text-slate-900">{t(`landing.features.${f.key}.title`)}</div>
                <div className="mt-1.5 text-xs text-slate-500 leading-relaxed">{t(`landing.features.${f.key}.desc`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section ref={howRef} className="py-20 sm:py-28 bg-[#FAFAFA] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-bold tracking-widest uppercase" style={{ color: GOLD }}>{t('landing.howTitle')}</div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">{t('landing.howSubtitle')}</h2>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={step.num} className="relative rounded-2xl border border-slate-200/70 bg-white p-6 sm:p-8">
                <div className="text-5xl sm:text-6xl font-black leading-none" style={{ color: `${GOLD}20` }}>{step.num}</div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{t(step.titleKey)}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{t(step.descKey)}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10" style={{ [isRTL ? 'left' : 'right']: '-12px' }}>
                    <ArrowRight className={`w-3 h-3 text-slate-400 ${isRTL ? 'rotate-180' : ''}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 md:p-16" style={{ background: `linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)` }}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full opacity-15" style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }} />
              <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }} />
            </div>

            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">{t('landing.ctaTitle')}</h2>
              <p className="mt-4 text-white/50 text-sm sm:text-base leading-relaxed">{t('landing.ctaDesc')}</p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={() => navigate('/login')} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-black transition-all hover:brightness-95 hover:scale-[1.02]" style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96A)` }}>
                  {t('landing.ctaPrimary')}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={handleDemo} disabled={demoLoading} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-semibold text-white border border-white/15 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50">
                  {t('landing.liveDemo')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer ref={contactRef} className="border-t border-slate-200/70 bg-[#FAFAFA] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div>
              <div className="flex items-center gap-2.5">
                <img src="/khayatoslogo.webp" alt="KhayyatOS" className="h-8 w-auto object-contain" />
                <div>
                  <div className="text-sm font-bold tracking-[0.2em] text-slate-900">KHAYYAT</div>
                  <div className="text-[10px] text-slate-500 tracking-wider -mt-0.5">Tailoring OS</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed max-w-xs">{t('landing.footerTagline')}</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-1">{t('landing.nav.features')}</div>
              <button onClick={() => scrollTo(featuresRef)} className="text-start text-sm text-slate-600 hover:text-slate-900 transition-colors">{t('landing.nav.features')}</button>
              <button onClick={() => scrollTo(howRef)} className="text-start text-sm text-slate-600 hover:text-slate-900 transition-colors">{t('landing.nav.howItWorks')}</button>
              <button onClick={handleDemo} className="text-start text-sm text-slate-600 hover:text-slate-900 transition-colors">{t('landing.liveDemo')}</button>
              <button onClick={() => navigate('/track-order')} className="text-start text-sm text-slate-600 hover:text-slate-900 transition-colors">{t('landing.trackOrder')}</button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-1">{t('landing.nav.contact')}</div>
              <a href="tel:+966596775485" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                <Phone className="w-3.5 h-3.5" /> +966596775485
              </a>
              <p className="text-sm text-slate-500">{t('landing.footerNote')}</p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-slate-400">&copy; {new Date().getFullYear()} KhayyatOS. {t('landing.footerRights')}</div>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/login')} className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">{t('auth.login', { defaultValue: 'Login' })}</button>
              <button onClick={() => navigate('/track-order')} className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">{t('landing.trackOrder')}</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
