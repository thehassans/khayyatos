import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Scissors,
  Wallet,
  Settings,
  LogOut, 
  Menu,
  ChevronDown
} from 'lucide-react';

const WorkerLayout = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const currentLang = (i18n?.language || 'en').split('-')[0];

  const shopName = user?.shopName || user?.userId?.businessName || t('common.appName');
  const shopLogo = user?.shopLogo || user?.userId?.logo;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/worker/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/worker/stitchings', icon: Scissors, label: t('nav.stitchings') },
    { to: '/worker/amounts', icon: Wallet, label: t('nav.amounts') },
    { to: '/worker/settings', icon: Settings, label: t('nav.settings') }
  ];

  const bottomNavItems = [
    { to: '/worker/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/worker/stitchings', icon: Scissors, label: t('nav.stitchings') },
    { to: '/worker/amounts', icon: Wallet, label: t('nav.amounts') }
  ];

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'ur', label: 'اردو' },
    { code: 'bn', label: 'বাংলা' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-100
        transform transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Scissors className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">{user?.shopName || t('common.appName')}</h1>
            <p className="text-xs text-gray-500 truncate">{user?.name}</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors
                ${isActive 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t('auth.logout')}
          </button>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 min-w-0">
              {shopLogo ? (
                <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-black/5 bg-white shadow-sm flex-shrink-0">
                  <img src={shopLogo} alt="Logo" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Scissors className="w-5 h-5 text-emerald-700" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{shopName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.name || ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-xl border border-gray-200/70 shadow-sm"
                >
                  <span className="text-sm font-medium">{languages.find(l => l.code === currentLang)?.label || 'English'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                {langOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                          setLangOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                          currentLang === lang.code ? 'text-emerald-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <NavLink
                to="/worker/settings"
                className={({ isActive }) => `p-2 rounded-xl border shadow-sm transition-colors ${
                  isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200/70 text-gray-600 hover:bg-gray-50'
                }`}
                aria-label={t('nav.settings')}
              >
                <Settings className="w-5 h-5" />
              </NavLink>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-emerald-700">
                    {user?.name?.charAt(0) || 'W'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
          <div className="mx-auto max-w-screen-sm">
            <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/70 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
              <div className="grid grid-cols-3">
                {bottomNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `flex flex-col items-center justify-center gap-1 py-3 ${
                      isActive ? 'text-emerald-700' : 'text-gray-500'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${item.to === '/worker/stitchings' ? 'stroke-[2.25]' : ''}`} />
                    <span className="text-[11px] font-medium leading-none">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default WorkerLayout;
