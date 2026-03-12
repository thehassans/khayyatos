import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import DemoBlockedModal from '../../components/ui/DemoBlockedModal';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const FinisherForm = () => {
  const { t } = useTranslation();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const isDemo = !!user?.isDemoSession;
  const [demoBlockedOpen, setDemoBlockedOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    language: 'en',
    isActive: true
  });

  useEffect(() => {
    if (isEdit) fetchFinisher();
  }, [id]);

  const fetchFinisher = async () => {
    try {
      const response = await api.get(`/finisher/${id}`);
      const finisher = response.data?.finisher;
      setFormData({
        name: finisher?.name || '',
        phone: finisher?.phone || '',
        password: '',
        language: finisher?.language || 'en',
        isActive: finisher?.isActive !== false
      });
    } catch (error) {
      toast.error('Failed to load finisher');
      navigate('/user/finishers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setLoading(true);
    try {
      const data = { ...formData };
      if (!data.password) delete data.password;
      if (isEdit) {
        await api.put(`/finisher/${id}`, data);
        toast.success('Finisher updated');
      } else {
        await api.post('/finisher', data);
        toast.success('Finisher created');
      }
      navigate('/user/finishers');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/user/finishers')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{isEdit ? t('finishers.editFinisher', { defaultValue: 'Edit Finisher' }) : t('finishers.createFinisher', { defaultValue: 'Create Finisher' })}</h1>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={t('workers.name')} value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} required />
              <Input label={t('workers.phone')} type="tel" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} placeholder="+966501234567" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={t('workers.password')} type="password" value={formData.password} onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))} placeholder={isEdit ? '••••••••' : ''} required={!isEdit} />
              <Select
                label={t('settings.language', { defaultValue: 'Language' })}
                value={formData.language}
                onChange={(e) => setFormData((prev) => ({ ...prev, language: e.target.value }))}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'ar', label: 'العربية' },
                  { value: 'hi', label: 'हिन्दी' },
                  { value: 'ur', label: 'اردو' },
                  { value: 'bn', label: 'বাংলা' }
                ]}
              />
            </div>

            {isEdit ? (
              <div className="flex items-center gap-3">
                <input type="checkbox" id="finisherIsActive" checked={formData.isActive} onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 text-primary-600" />
                <label htmlFor="finisherIsActive" className="text-sm font-medium text-gray-700 dark:text-slate-200">{t('common.active')}</label>
              </div>
            ) : null}

            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={loading} className="flex-1" disabled={isDemo}>
                {isEdit ? t('common.save') : t('finishers.createFinisher', { defaultValue: 'Create Finisher' })}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/user/finishers')}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <DemoBlockedModal isOpen={demoBlockedOpen} onClose={() => setDemoBlockedOpen(false)} title={t('demo.title', { defaultValue: 'Demo Mode' })} phone="+966596775485" />
    </div>
  );
};

export default FinisherForm;
