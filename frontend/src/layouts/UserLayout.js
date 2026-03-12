import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import OnboardingWizard from '../components/OnboardingWizard';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus,
  Wallet,
  Scissors,
  Heart,
  MessageCircle,
  Settings,
  LogOut, 
  Menu,
  ChevronDown,
  X,
  PanelLeftClose,
  PanelLeft,
  Globe,
  HelpCircle,
  Check,
  FileText,
  Image,
  Droplets,
  Layers
} from 'lucide-react';

const UserLayout = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, updateUser, api } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(user?.sidebarCollapsed || false);
  const [langOpen, setLangOpen] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingSource, setOnboardingSource] = useState('auto');
  
  const currentLang = (i18n?.language || 'en').split('-')[0];
  const isRTL = ['ar', 'ur'].includes(currentLang);
  const resolveLogoSrc = (src) => {
    if (!src) return null;
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return src;
    const [cleanSrc, queryString = ''] = String(src).split('?');
    if (!cleanSrc.startsWith('/uploads/')) return src;
    const baseUrl = api?.defaults?.baseURL;
    try {
      if (baseUrl && (baseUrl.startsWith('http://') || baseUrl.startsWith('https://'))) {
        const absoluteSrc = `${new URL(baseUrl).origin}${cleanSrc}`;
        return queryString ? `${absoluteSrc}?${queryString}` : absoluteSrc;
      }
    } catch (error) {

    }
    return src;
  };
  const logoSrc = resolveLogoSrc(user?.logo);

  useEffect(() => {
    const run = () => {
      import('../pages/user/Customers');
      import('../pages/user/Stitchings');
      import('../pages/user/Workers');
      import('../pages/user/CustomerForm');
      import('../pages/user/StitchingForm');
      import('../pages/user/WorkerForm');
    };

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(run, { timeout: 1800 });
      return () => window.cancelIdleCallback?.(id);
    }

    const t = setTimeout(run, 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user) {
      setOnboardingOpen(false);
      return;
    }
    if (user?.role !== 'user') {
      setOnboardingOpen(false);
      return;
    }
    if (user?.isDemoSession) {
      setOnboardingOpen(false);
      return;
    }

    const completed = !!user?.onboardingCompleted;
    if (completed && onboardingSource !== 'manual') {
      setOnboardingOpen(false);
      return;
    }
    const userKey = user?.id || user?._id || 'unknown';
    const autoOpenKey = `khayyat_tutorial_auto_opened_v1:${userKey}`;
    const alreadyAutoOpened = typeof window !== 'undefined' && window?.localStorage
      ? window.localStorage.getItem(autoOpenKey) === '1'
      : true;

    if (!alreadyAutoOpened && !onboardingDismissed) {
      if (typeof window !== 'undefined' && window?.localStorage) {
        window.localStorage.setItem(autoOpenKey, '1');
      }
      setOnboardingSource('auto');
      setOnboardingOpen(true);
    }
  }, [user, user?.role, user?.isDemoSession, user?.onboardingCompleted, onboardingDismissed, onboardingSource]);

  // Theme customization
  const primaryColor = user?.primaryColor || 'sky';
  const navStyle = user?.navStyle || 'default';
  const headerStyle = user?.headerStyle || 'default';
  const sidebarStyle = user?.sidebarStyle || 'default';

  // Color mappings for dynamic styling
  const colorClasses = {
    sky: {
      bg: 'bg-sky-500', bgHover: 'hover:bg-sky-600', bgLight: 'bg-sky-50 dark:bg-sky-900/20',
      text: 'text-sky-600 dark:text-sky-400', textLight: 'text-sky-700 dark:text-sky-200',
      gradient: 'from-sky-500 to-sky-600', border: 'border-sky-500', ring: 'ring-sky-500/20'
    },
    indigo: {
      bg: 'bg-indigo-500', bgHover: 'hover:bg-indigo-600', bgLight: 'bg-indigo-50 dark:bg-indigo-900/20',
      text: 'text-indigo-600 dark:text-indigo-400', textLight: 'text-indigo-700 dark:text-indigo-200',
      gradient: 'from-indigo-500 to-indigo-600', border: 'border-indigo-500', ring: 'ring-indigo-500/20'
    },
    violet: {
      bg: 'bg-violet-500', bgHover: 'hover:bg-violet-600', bgLight: 'bg-violet-50 dark:bg-violet-900/20',
      text: 'text-violet-600 dark:text-violet-400', textLight: 'text-violet-700 dark:text-violet-200',
      gradient: 'from-violet-500 to-violet-600', border: 'border-violet-500', ring: 'ring-violet-500/20'
    },
    rose: {
      bg: 'bg-rose-500', bgHover: 'hover:bg-rose-600', bgLight: 'bg-rose-50 dark:bg-rose-900/20',
      text: 'text-rose-600 dark:text-rose-400', textLight: 'text-rose-700 dark:text-rose-200',
      gradient: 'from-rose-500 to-rose-600', border: 'border-rose-500', ring: 'ring-rose-500/20'
    },
    emerald: {
      bg: 'bg-emerald-500', bgHover: 'hover:bg-emerald-600', bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-600 dark:text-emerald-400', textLight: 'text-emerald-700 dark:text-emerald-200',
      gradient: 'from-emerald-500 to-emerald-600', border: 'border-emerald-500', ring: 'ring-emerald-500/20'
    },
    amber: {
      bg: 'bg-amber-500', bgHover: 'hover:bg-amber-600', bgLight: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-600 dark:text-amber-400', textLight: 'text-amber-700 dark:text-amber-200',
      gradient: 'from-amber-500 to-amber-600', border: 'border-amber-500', ring: 'ring-amber-500/20'
    },
    slate: {
      bg: 'bg-slate-600', bgHover: 'hover:bg-slate-700', bgLight: 'bg-slate-100 dark:bg-slate-800/50',
      text: 'text-slate-600 dark:text-slate-400', textLight: 'text-slate-700 dark:text-slate-200',
      gradient: 'from-slate-600 to-slate-700', border: 'border-slate-600', ring: 'ring-slate-500/20'
    },
    teal: {
      bg: 'bg-teal-500', bgHover: 'hover:bg-teal-600', bgLight: 'bg-teal-50 dark:bg-teal-900/20',
      text: 'text-teal-600 dark:text-teal-400', textLight: 'text-teal-700 dark:text-teal-200',
      gradient: 'from-teal-500 to-teal-600', border: 'border-teal-500', ring: 'ring-teal-500/20'
    }
  };

  const colors = colorClasses[primaryColor] || colorClasses.sky;

  // Get sidebar classes based on style
  const getSidebarClasses = () => {
    const base = 'fixed top-0 z-50 h-full transform transition-all duration-300';
    switch (sidebarStyle) {
      case 'colored':
        return `${base} bg-gradient-to-b ${colors.gradient} text-white`;
      case 'dark':
        return `${base} bg-slate-900 text-white`;
      case 'glass':
        return `${base} bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl`;
      default:
        return `${base} bg-white dark:bg-slate-900`;
    }
  };

  // Get header classes based on style
  const getHeaderClasses = () => {
    const base = 'sticky top-0 z-40 border-b';
    switch (headerStyle) {
      case 'colored':
        return `${base} ${colors.bg} text-white border-transparent`;
      case 'gradient':
        return `${base} bg-gradient-to-r ${colors.gradient} text-white border-transparent`;
      case 'transparent':
        return `${base} bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-gray-100 dark:border-slate-800`;
      default:
        return `${base} bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-gray-100 dark:border-slate-800`;
    }
  };

  // Get nav item classes based on style
  const getNavItemClasses = (isActive) => {
    const isColoredSidebar = sidebarStyle === 'colored' || sidebarStyle === 'dark';
    
    const baseClasses = {
      default: `flex items-center gap-3 font-medium transition-all ${sidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'} rounded-lg`,
      compact: `flex items-center gap-2 font-medium transition-all ${sidebarCollapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2'} rounded-md text-sm`,
      pill: `flex items-center gap-3 font-medium transition-all ${sidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'} rounded-full`,
      minimal: `flex items-center gap-3 font-medium transition-all ${sidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'} rounded-none border-l-4 ${isActive ? colors.border : 'border-transparent'}`
    };

    const activeClasses = isColoredSidebar 
      ? 'bg-white/20 text-white' 
      : `${colors.bgLight} ${colors.textLight}`;
    
    const inactiveClasses = isColoredSidebar
      ? 'text-white/80 hover:bg-white/10 hover:text-white'
      : 'text-gray-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800/50';

    return `${baseClasses[navStyle] || baseClasses.default} ${isActive ? activeClasses : inactiveClasses}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    updateUser({ sidebarCollapsed: newState });
  };

  const allNavItems = [
    { key: 'dashboard', to: '/user/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { key: 'workers', to: '/user/workers', icon: Users, label: t('nav.workers') },
    { key: 'workerAmounts', to: '/user/worker-amounts', icon: Wallet, label: t('nav.workerAmounts') },
    { key: 'customers', to: '/user/customers', icon: UserPlus, label: t('nav.customers') },
    { key: 'stitchings', to: '/user/stitchings', icon: Scissors, label: t('nav.stitchings') },
    { key: 'embroideryDesigns', to: '/user/embroidery-designs', icon: Image, label: t('nav.embroideryDesigns', { defaultValue: 'Embroidery Designs' }) },
    { key: 'laundry', to: '/user/laundry', icon: Droplets, label: t('nav.laundry', { defaultValue: 'Laundry' }) },
    { key: 'fabrics', to: '/user/fabrics', icon: Layers, label: t('nav.fabrics', { defaultValue: 'Fabrics' }) },
    { key: 'loyalty', to: '/user/loyalty', icon: Heart, label: t('nav.loyalty') },
    { key: 'whatsapp', to: '/user/whatsapp', icon: MessageCircle, label: t('nav.whatsapp') },
    { key: 'zatca', to: '/user/zatca', icon: FileText, label: t('nav.zatca') },
    { key: 'settings', to: '/user/settings', icon: Settings, label: t('nav.settings') }
  ];

  const hiddenNavItems = user?.hiddenNavItems || [];
  const navItems = allNavItems.filter(item => !hiddenNavItems.includes(item.key));

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸', native: 'English' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦', native: 'Arabic' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳', native: 'Hindi' },
    { code: 'ur', label: 'اردو', flag: '🇵🇰', native: 'Urdu' },
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩', native: 'Bengali' }
  ];

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-950 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <OnboardingWizard
        isOpen={onboardingOpen}
        openSource={onboardingSource}
        onClose={() => {
          setOnboardingOpen(false);
          setOnboardingDismissed(true);
        }}
      />
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        ${getSidebarClasses()}
        ${isRTL ? 'right-0 border-l' : 'left-0 border-r'}
        ${sidebarStyle === 'colored' || sidebarStyle === 'dark' ? 'border-white/10' : 'border-gray-100 dark:border-slate-800'}
        ${isRTL 
          ? (sidebarOpen ? 'translate-x-0' : 'translate-x-full') 
          : (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
        }
        lg:translate-x-0
        ${sidebarCollapsed ? 'w-20' : 'w-64'}
      `}>
        <div className={`px-4 py-5 border-b ${sidebarStyle === 'colored' || sidebarStyle === 'dark' ? 'border-white/10' : 'border-gray-100 dark:border-slate-800'}`}>
          <div className={sidebarCollapsed ? 'flex items-center justify-center' : 'space-y-4'}>
            {logoSrc ? (
              sidebarCollapsed ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/90 dark:bg-slate-950/70 border border-white/10 dark:border-slate-700 shadow-sm p-1.5">
                  <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-full rounded-2xl border border-white/10 dark:border-slate-700 bg-white/95 dark:bg-slate-950/80 shadow-sm px-3 py-3">
                  <img src={logoSrc} alt="Logo" className="w-full h-14 object-contain" />
                </div>
              )
            ) : (
              <div className={`bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg ring-emerald-500/20 flex-shrink-0 transition-all ${sidebarCollapsed ? 'w-10 h-10 mx-auto' : 'w-12 h-12'}`}>
                <Scissors className={`text-white ${sidebarCollapsed ? 'w-5 h-5' : 'w-6 h-6'}`} />
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className={`font-bold truncate text-sm ${sidebarStyle === 'colored' || sidebarStyle === 'dark' ? 'text-white' : 'text-gray-900 dark:text-slate-100'}`}>{user?.businessName || t('common.appName')}</h1>
                <p className={`text-xs truncate ${sidebarStyle === 'colored' || sidebarStyle === 'dark' ? 'text-white/70' : 'text-gray-500 dark:text-slate-400'}`}>{user?.name}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Collapse Toggle Button */}
        <button
          onClick={toggleSidebarCollapse}
          className={`hidden lg:flex absolute top-20 w-6 h-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-full items-center justify-center shadow-sm hover:shadow-md transition-all hover:bg-gray-50 dark:hover:bg-slate-800 ${isRTL ? '-left-3' : '-right-3'}`}
        >
          {sidebarCollapsed ? (
            <PanelLeft className={`w-3 h-3 text-gray-500 dark:text-slate-300 ${isRTL ? 'rotate-180' : ''}`} />
          ) : (
            <PanelLeftClose className={`w-3 h-3 text-gray-500 dark:text-slate-300 ${isRTL ? 'rotate-180' : ''}`} />
          )}
        </button>

        <nav className={`space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? item.label : undefined}
              className={({ isActive }) => getNavItemClasses(isActive)}
              data-tutorial={`nav-${item.key}`}
            >
              <item.icon className={`flex-shrink-0 ${navStyle === 'compact' ? 'w-4 h-4' : 'w-5 h-5'}`} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={`absolute bottom-0 left-0 right-0 border-t ${sidebarStyle === 'colored' || sidebarStyle === 'dark' ? 'border-white/10 bg-transparent' : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900'} ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? t('auth.logout') : undefined}
            className={`flex items-center gap-3 w-full rounded-lg transition-colors ${sidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'} ${
              sidebarStyle === 'colored' || sidebarStyle === 'dark' 
                ? 'text-white/80 hover:bg-white/10 hover:text-white' 
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && t('auth.logout')}
          </button>
        </div>
      </aside>

      {/* Bottom Navigation Bar — Mobile & Tablet only */}
      {(() => {
        const bottomNavItems = [
          { key: 'dashboard', to: '/user/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
          { key: 'stitchings', to: '/user/stitchings', icon: Scissors, label: t('nav.stitchings') },
          { key: 'customers', to: '/user/customers', icon: UserPlus, label: t('nav.customers') },
          { key: 'workers', to: '/user/workers', icon: Users, label: t('nav.workers') },
        ];
        const isBottomActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

        return (
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" />
              <div className="relative flex items-center justify-around px-2 py-2 pb-3 safe-area-pb">
                {bottomNavItems.map((item) => {
                  const active = isBottomActive(item.to);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => navigate(item.to)}
                      className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[60px] ${
                        active
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-400 dark:text-slate-500 active:text-gray-600 dark:active:text-slate-300'
                      }`}
                    >
                      {active && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                      )}
                      <item.icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
                      <span className={`text-[10px] font-semibold leading-tight ${active ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>{item.label}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[60px] text-gray-400 dark:text-slate-500 active:text-gray-600 dark:active:text-slate-300"
                >
                  <Menu className="w-5 h-5" />
                  <span className="text-[10px] font-semibold leading-tight">{t('common.more', { defaultValue: 'More' })}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <div className={`transition-all duration-300 ${
        isRTL 
          ? (sidebarCollapsed ? 'lg:mr-20' : 'lg:mr-64') 
          : (sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64')
      }`}>
        <header className={getHeaderClasses()}>
          <div className="flex items-center justify-between px-4 py-2.5 lg:px-6 lg:py-3">
            {/* Mobile/Tablet: show logo + business name instead of hamburger */}
            <div className="flex items-center gap-3 lg:hidden min-w-0">
              {logoSrc ? (
                <div className="h-10 w-[min(46vw,180px)] rounded-xl overflow-hidden bg-white dark:bg-slate-950 border border-gray-200/70 dark:border-slate-700 flex-shrink-0 shadow-sm px-2">
                  <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <Scissors className="w-4 h-4 text-white" />
                </div>
              )}
              {!logoSrc && <span className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{user?.businessName || t('common.appName')}</span>}
            </div>

            {/* Desktop: hamburger (hidden on lg) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className={`p-2 rounded-lg hidden ${
                headerStyle === 'colored' || headerStyle === 'gradient' 
                  ? 'hover:bg-white/20 text-white' 
                  : 'hover:bg-gray-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <button
                type="button"
                onClick={handleLogout}
                className={`lg:hidden flex items-center justify-center px-2.5 sm:px-3 py-2 rounded-xl transition-all border shadow-sm hover:shadow ${
                  headerStyle === 'colored' || headerStyle === 'gradient'
                    ? 'bg-white/15 hover:bg-white/25 border-white/20 text-white'
                    : 'bg-white/70 hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900 border-gray-200/70 dark:border-slate-700/70 text-gray-700 dark:text-slate-200'
                }`}
                title={t('auth.logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setOnboardingSource('manual');
                  setOnboardingDismissed(true);
                  setOnboardingOpen(true);
                }}
                data-tutorial="header-tutorial"
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl transition-all border shadow-sm hover:shadow ${
                  headerStyle === 'colored' || headerStyle === 'gradient'
                    ? 'bg-white/15 hover:bg-white/25 border-white/20 text-white'
                    : 'bg-white/70 hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900 border-gray-200/70 dark:border-slate-700/70'
                }`}
                title={t('onboardingWizard.liveTutorial', { defaultValue: 'Live tutorial' })}
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">
                  {t('onboardingWizard.liveTutorial', { defaultValue: 'Live tutorial' })}
                </span>
              </button>

              {/* Premium Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl transition-all border shadow-sm hover:shadow ${
                    headerStyle === 'colored' || headerStyle === 'gradient'
                      ? 'bg-white/15 hover:bg-white/25 border-white/20 text-white'
                      : 'bg-white/70 hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900 border-gray-200/70 dark:border-slate-700/70'
                  }`}
                >
                  <span className="text-lg">{languages.find(l => l.code === currentLang)?.flag}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langOpen ? 'rotate-180' : ''} ${headerStyle === 'colored' || headerStyle === 'gradient' ? 'text-white/60' : 'text-gray-400 dark:text-slate-400'}`} />
                </button>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                    <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 py-2 z-50 animate-fadeIn`}>
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800">
                        <p className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Select Language</p>
                      </div>
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            i18n.changeLanguage(lang.code);
                            setLangOpen(false);
                          }}
                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${
                            currentLang === lang.code ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                          }`}
                        >
                          <span className="text-2xl">{lang.flag}</span>
                          <div className="flex-1 text-left">
                            <p className={`text-sm font-medium ${currentLang === lang.code ? 'text-primary-700 dark:text-primary-200' : 'text-gray-900 dark:text-slate-100'}`}>{lang.label}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">{lang.native}</p>
                          </div>
                          {currentLang === lang.code && (
                            <Check className="w-5 h-5 text-primary-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
