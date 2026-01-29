import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
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
  Check,
  FileText
} from 'lucide-react';

const UserLayout = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(user?.sidebarCollapsed || false);
  const [langOpen, setLangOpen] = useState(false);
  
  const isRTL = ['ar', 'ur'].includes(i18n.language);

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
    const base = 'sticky top-0 z-30 border-b';
    switch (headerStyle) {
      case 'colored':
        return `${base} ${colors.bg} text-white border-transparent`;
      case 'gradient':
        return `${base} bg-gradient-to-r ${colors.gradient} text-white border-transparent`;
      case 'transparent':
        return `${base} bg-transparent backdrop-blur-sm border-gray-100 dark:border-slate-800`;
      default:
        return `${base} bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800`;
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
          <div className="flex items-center gap-3">
            {user?.logo ? (
              <div className={`rounded-xl overflow-hidden shadow-lg ${colors.ring} ring-2 ring-white/20 flex-shrink-0 transition-all ${sidebarCollapsed ? 'w-10 h-10' : 'w-12 h-12'}`}>
                <img src={user.logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={`bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center shadow-lg ${colors.ring} flex-shrink-0 transition-all ${sidebarCollapsed ? 'w-10 h-10' : 'w-12 h-12'}`}>
                <Scissors className={`text-white ${sidebarCollapsed ? 'w-5 h-5' : 'w-6 h-6'}`} />
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
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

      <div className={`transition-all duration-300 ${
        isRTL 
          ? (sidebarCollapsed ? 'lg:mr-20' : 'lg:mr-64') 
          : (sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64')
      }`}>
        <header className={getHeaderClasses()}>
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`p-2 rounded-lg lg:hidden ${
                headerStyle === 'colored' || headerStyle === 'gradient' 
                  ? 'hover:bg-white/20 text-white' 
                  : 'hover:bg-gray-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 ml-auto">
              {/* Premium Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow ${
                    headerStyle === 'colored' || headerStyle === 'gradient'
                      ? 'bg-white/20 hover:bg-white/30 border border-white/20 text-white'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 dark:from-slate-800 dark:to-slate-700 dark:hover:from-slate-700 dark:hover:to-slate-600 border border-gray-200 dark:border-slate-600'
                  }`}
                >
                  <Globe className={`w-4 h-4 ${headerStyle === 'colored' || headerStyle === 'gradient' ? 'text-white/80' : 'text-gray-500 dark:text-slate-300'}`} />
                  <span className="text-lg">{languages.find(l => l.code === i18n.language)?.flag}</span>
                  <span className={`text-sm font-medium hidden sm:block ${headerStyle === 'colored' || headerStyle === 'gradient' ? 'text-white' : 'text-gray-700 dark:text-slate-100'}`}>{languages.find(l => l.code === i18n.language)?.label || 'English'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${langOpen ? 'rotate-180' : ''} ${headerStyle === 'colored' || headerStyle === 'gradient' ? 'text-white/60' : 'text-gray-400 dark:text-slate-400'}`} />
                </button>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 py-2 z-50 animate-fadeIn">
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
                            i18n.language === lang.code ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                          }`}
                        >
                          <span className="text-2xl">{lang.flag}</span>
                          <div className="flex-1 text-left">
                            <p className={`text-sm font-medium ${i18n.language === lang.code ? 'text-primary-700 dark:text-primary-200' : 'text-gray-900 dark:text-slate-100'}`}>{lang.label}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">{lang.native}</p>
                          </div>
                          {i18n.language === lang.code && (
                            <Check className="w-5 h-5 text-primary-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center shadow-lg ${colors.ring} ${
                  headerStyle === 'colored' || headerStyle === 'gradient' ? 'ring-2 ring-white/30' : ''
                }`}>
                  <span className="text-sm font-bold text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
