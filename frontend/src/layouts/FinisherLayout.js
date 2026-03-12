import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Store, Settings, LogOut, Menu, ChevronDown, Scissors } from 'lucide-react';

const FinisherLayout = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const currentLang = (i18n?.language || 'en').split('-')[0];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/finisher/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/finisher/shops', icon: Store, label: t('nav.shops', { defaultValue: 'Shops' }) },
    { to: '/finisher/settings', icon: Settings, label: t('nav.settings') }
  ];

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'ur', label: 'اردو' },
    { code: 'bn', label: 'বাংলা' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-gray-900 dark:text-slate-100 truncate">{t('nav.finisher', { defaultValue: 'Finisher' })}</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.name || ''}</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200' : 'text-gray-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800/50'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t('auth.logout')}
          </button>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg lg:hidden">
              <Menu className="w-5 h-5 text-gray-700 dark:text-slate-200" />
            </button>

            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{user?.name || ''}</div>
              <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.phone || ''}</div>
            </div>

            <div className="relative">
              <button
                onClick={() => setLangOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800/50"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-slate-100">{languages.find((lang) => lang.code === currentLang)?.label || 'English'}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-100 dark:border-slate-800 py-1 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        i18n.changeLanguage(lang.code);
                        setLangOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-800 ${currentLang === lang.code ? 'text-amber-600 font-medium' : 'text-gray-700 dark:text-slate-200'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
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

export default FinisherLayout;
