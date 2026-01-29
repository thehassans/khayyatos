import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { 
  Settings as SettingsIcon, Upload, Globe, Sun, Moon, 
  Shield, Download, Bell, Database, ChevronRight, 
  Check, Smartphone, Mail, Lock, Key, Trash2,
  FileText, HelpCircle, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { api, user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(user?.logo || null);
  const [settings, setSettings] = useState({
    language: user?.language || 'en',
    theme: user?.theme || 'light',
    receiptPrefix: '',
    receiptCounter: 0,
    logo: null,
    businessName: user?.businessName || '',
    labelLanguage: user?.labelLanguage || 'both',
    primaryColor: user?.primaryColor || 'sky',
    notifications: {
      orderUpdates: true,
      paymentReminders: true,
      weeklyReport: false,
      sound: true
    }
  });

  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  const colorPresets = [
    { name: 'sky', color: '#0ea5e9' },
    { name: 'indigo', color: '#6366f1' },
    { name: 'violet', color: '#8b5cf6' },
    { name: 'rose', color: '#f43f5e' },
    { name: 'emerald', color: '#10b981' },
    { name: 'amber', color: '#f59e0b' },
  ];

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ur', label: 'اردو', flag: '🇵🇰' },
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩' }
  ];

  const sections = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Backup', icon: Database },
    { id: 'about', label: 'About', icon: Info },
  ];

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(prev => ({
        ...prev,
        language: response.data.settings.language,
        theme: response.data.settings.theme || prev.theme || user?.theme || 'light',
        receiptPrefix: response.data.settings.receiptPrefix,
        receiptCounter: response.data.settings.receiptCounter,
        businessName: response.data.settings.businessName || user?.businessName || ''
      }));
      if (response.data.settings.logo && response.data.settings.logo !== 'null') {
        setLogoPreview(response.data.settings.logo);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSettings({ ...settings, logo: file });
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      data.append('language', settings.language);
      data.append('theme', settings.theme);
      data.append('receiptPrefix', settings.receiptPrefix);
      data.append('businessName', settings.businessName);
      if (settings.logo) data.append('logo', settings.logo);

      await api.put('/settings', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      updateUser({ 
        language: settings.language, 
        theme: settings.theme, 
        businessName: settings.businessName, 
        logo: logoPreview,
        primaryColor: settings.primaryColor
      });
      toast.success(t('settings.saved'));
    } catch (error) {
      toast.error('Failed to save settings');
    }
    setLoading(false);
  };

  const handleExportData = async () => {
    try {
      toast.loading('Preparing export...');
      const response = await api.get('/settings/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success('Data exported successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Export failed');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.new.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await api.put('/settings/password', {
        currentPassword: passwordData.current,
        newPassword: passwordData.new
      });
      toast.success('Password updated successfully');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    }
  };

  const Toggle = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-slate-600'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  );

  const SettingRow = ({ icon: Icon, title, description, children, onClick }) => (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 p-4 ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50' : ''} transition-colors`}
    >
      <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-gray-600 dark:text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-slate-100">{title}</p>
        {description && <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{description}</p>}
      </div>
      {children || (onClick && <ChevronRight className="w-5 h-5 text-gray-400" />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Manage your account preferences</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Navigation */}
        <div className="w-56 flex-shrink-0 hidden lg:block">
          <nav className="space-y-1 sticky top-6">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeSection === section.id
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile Section Tabs */}
          <div className="lg:hidden mb-6 flex gap-2 overflow-x-auto pb-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    activeSection === section.id
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{section.label}</span>
                </button>
              );
            })}
          </div>

          {/* General Section */}
          {activeSection === 'general' && (
            <div className="space-y-6">
              {/* Business Profile */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Business Profile</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center overflow-hidden">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Upload className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl cursor-pointer transition-opacity">
                        <Upload className="w-5 h-5 text-white" />
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                      </label>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Business Name</label>
                      <input
                        type="text"
                        value={settings.businessName}
                        onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border-0 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                        placeholder="Your business name"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Language */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Language</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-5 gap-3">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { setSettings({ ...settings, language: lang.code }); i18n.changeLanguage(lang.code); }}
                        className={`p-4 rounded-xl text-center transition-all ${
                          settings.language === lang.code
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                            : 'bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{lang.flag}</span>
                        <span className="text-xs font-medium">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Receipt Settings */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Receipt Settings</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Prefix</label>
                      <input
                        type="text"
                        value={settings.receiptPrefix}
                        onChange={(e) => setSettings({ ...settings, receiptPrefix: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border-0 rounded-xl"
                        placeholder="RCP"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Counter</label>
                      <input
                        type="number"
                        value={settings.receiptCounter}
                        onChange={(e) => setSettings({ ...settings, receiptCounter: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border-0 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Mode */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Theme Mode</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => { setSettings({ ...settings, theme: 'light' }); updateUser({ theme: 'light' }); }}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        settings.theme === 'light'
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                      }`}
                    >
                      <Sun className={`w-8 h-8 mx-auto mb-3 ${settings.theme === 'light' ? 'text-amber-500' : 'text-gray-400'}`} />
                      <span className="font-semibold text-gray-900 dark:text-white block">Light</span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">Clean & bright</span>
                      {settings.theme === 'light' && <Check className="w-5 h-5 text-amber-500 mx-auto mt-2" />}
                    </button>
                    <button
                      onClick={() => { setSettings({ ...settings, theme: 'dark' }); updateUser({ theme: 'dark' }); }}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        settings.theme === 'dark'
                          ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                      }`}
                    >
                      <Moon className={`w-8 h-8 mx-auto mb-3 ${settings.theme === 'dark' ? 'text-indigo-500' : 'text-gray-400'}`} />
                      <span className="font-semibold text-gray-900 dark:text-white block">Dark</span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">Easy on eyes</span>
                      {settings.theme === 'dark' && <Check className="w-5 h-5 text-indigo-500 mx-auto mt-2" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Accent Color</h2>
                </div>
                <div className="p-6">
                  <div className="flex gap-4">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => { setSettings({ ...settings, primaryColor: preset.name }); updateUser({ primaryColor: preset.name }); }}
                        className={`w-12 h-12 rounded-full transition-all ${
                          settings.primaryColor === preset.name ? 'ring-4 ring-offset-4 ring-gray-900 dark:ring-white dark:ring-offset-slate-900 scale-110' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: preset.color }}
                      >
                        {settings.primaryColor === preset.name && <Check className="w-5 h-5 text-white mx-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                <SettingRow icon={Bell} title="Order Updates" description="Get notified when order status changes">
                  <Toggle enabled={settings.notifications.orderUpdates} onChange={(v) => setSettings({...settings, notifications: {...settings.notifications, orderUpdates: v}})} />
                </SettingRow>
                <SettingRow icon={Mail} title="Payment Reminders" description="Reminders for pending payments">
                  <Toggle enabled={settings.notifications.paymentReminders} onChange={(v) => setSettings({...settings, notifications: {...settings.notifications, paymentReminders: v}})} />
                </SettingRow>
                <SettingRow icon={FileText} title="Weekly Reports" description="Receive weekly business summary">
                  <Toggle enabled={settings.notifications.weeklyReport} onChange={(v) => setSettings({...settings, notifications: {...settings.notifications, weeklyReport: v}})} />
                </SettingRow>
                <SettingRow icon={Smartphone} title="Sound Effects" description="Play sounds for notifications">
                  <Toggle enabled={settings.notifications.sound} onChange={(v) => setSettings({...settings, notifications: {...settings.notifications, sound: v}})} />
                </SettingRow>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border-0 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border-0 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border-0 rounded-xl"
                    />
                  </div>
                  <button
                    onClick={handlePasswordChange}
                    className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data Section */}
          {activeSection === 'data' && (
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Management</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                <SettingRow icon={Download} title="Export Data" description="Download all your data as JSON" onClick={handleExportData} />
                <SettingRow icon={Database} title="Storage Used" description="Calculate your storage usage">
                  <span className="text-sm text-gray-500">— MB</span>
                </SettingRow>
                <SettingRow icon={Trash2} title="Clear Cache" description="Clear temporary app data" onClick={() => { localStorage.clear(); toast.success('Cache cleared'); }} />
              </div>
            </div>
          )}

          {/* About Section */}
          {activeSection === 'about' && (
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About KhayyatOS</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                <SettingRow icon={Info} title="Version" description="Current app version">
                  <span className="text-sm font-mono text-gray-500">v2.0.0</span>
                </SettingRow>
                <SettingRow icon={HelpCircle} title="Help & Support" description="Get help with the app" onClick={() => window.open('mailto:support@khayyatos.com')} />
                <SettingRow icon={FileText} title="Terms of Service" description="Read our terms" onClick={() => {}} />
                <SettingRow icon={Shield} title="Privacy Policy" description="How we protect your data" onClick={() => {}} />
              </div>
              <div className="p-6 text-center text-sm text-gray-500 dark:text-slate-400">
                Made with ❤️ for tailors everywhere
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
