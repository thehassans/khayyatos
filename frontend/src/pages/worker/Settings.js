import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Settings as SettingsIcon, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const WorkerSettings = () => {
  const { t, i18n } = useTranslation();
  const { api, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(user?.language || i18n.language || 'en');

  const handleLanguageChange = async (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/worker/panel/settings', { language });
      toast.success(t('settings.saved'));
    } catch (error) {
      toast.error('Failed to save');
    }
    setLoading(false);
  };

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ur', label: 'اردو', flag: '🇵🇰' },
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩' }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
      </div>

      {/* Language */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">{t('settings.language')}</h2>
        </div>
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  language === lang.code
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl mb-1 block">{lang.flag}</span>
                <span className={`text-sm font-medium ${
                  language === lang.code ? 'text-emerald-700' : 'text-gray-700'
                }`}>
                  {lang.label}
                </span>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} loading={loading} className="w-full">
        {t('common.save')} {t('settings.title')}
      </Button>
    </div>
  );
};

export default WorkerSettings;
