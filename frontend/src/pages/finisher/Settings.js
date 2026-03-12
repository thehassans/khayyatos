import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import toast from 'react-hot-toast';

const FinisherSettings = () => {
  const { t } = useTranslation();
  const { api, user, updateUser } = useAuth();
  const [language, setLanguage] = useState(user?.language || 'en');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLanguage(user?.language || 'en');
  }, [user?.language]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put('/finisher/panel/settings', { language });
      updateUser(response.data?.user || { language });
      toast.success('Settings saved');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save settings');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('nav.settings')}</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('finishers.settingsSubtitle', { defaultValue: 'Manage your finisher preferences.' })}</p>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <Select
            label={t('settings.language', { defaultValue: 'Language' })}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'ar', label: 'العربية' },
              { value: 'hi', label: 'हिन्दी' },
              { value: 'ur', label: 'اردو' },
              { value: 'bn', label: 'বাংলা' }
            ]}
          />
          <Button onClick={handleSave} loading={loading}>{t('common.save')}</Button>
        </CardBody>
      </Card>
    </div>
  );
};

export default FinisherSettings;
