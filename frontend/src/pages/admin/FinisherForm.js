import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { ArrowLeft, Store } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminFinisherForm = () => {
  const { t } = useTranslation();
  const { api } = useAuth();
  const navigate = useNavigate();
  const { finisherId } = useParams();
  const isEdit = !!finisherId;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    language: 'en',
    isActive: true
  });

  useEffect(() => {
    if (isEdit) fetchData();
    else setFetching(false);
  }, [finisherId]);

  const fetchData = async () => {
    try {
      setFetching(true);
      const finisherResponse = await api.get(`/admin/finishers/${finisherId}`);
      const finisher = finisherResponse.data?.finisher;
      setFormData({
        name: finisher?.name || '',
        phone: finisher?.phone || '',
        password: '',
        language: finisher?.language || 'en',
        isActive: finisher?.isActive !== false
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load finisher');
      navigate('/admin/finishers');
    }
    setFetching(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...formData };
      if (!data.password) delete data.password;
      if (isEdit) {
        await api.put(`/admin/finishers/${finisherId}`, data);
        toast.success('Finisher updated');
      } else {
        await api.post('/admin/finishers', data);
        toast.success('Finisher created');
      }
      navigate('/admin/finishers');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
    setLoading(false);
  };

  if (fetching) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/admin/finishers')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? t('finishers.editFinisher', { defaultValue: 'Edit Finisher' }) : t('finishers.createFinisher', { defaultValue: 'Create Finisher' })}</h1>
          </div>
          <p className="text-sm text-gray-500">{t('finishers.standaloneDesc', { defaultValue: 'Standalone finisher account — not linked to any shop' })}</p>
        </div>
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
                <input type="checkbox" id="adminFinisherIsActive" checked={formData.isActive} onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                <label htmlFor="adminFinisherIsActive" className="text-sm font-medium text-gray-700">{t('common.active')}</label>
              </div>
            ) : null}

            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={loading} className="flex-1">
                {isEdit ? t('common.save') : t('finishers.createFinisher', { defaultValue: 'Create Finisher' })}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/finishers')}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminFinisherForm;
