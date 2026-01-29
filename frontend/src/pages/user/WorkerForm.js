import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const WorkerForm = () => {
  const { t } = useTranslation();
  const { api } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    paymentType: 'per_stitching',
    paymentAmount: 0,
    isActive: true
  });

  useEffect(() => {
    if (isEdit) fetchWorker();
  }, [id]);

  const fetchWorker = async () => {
    try {
      const response = await api.get(`/worker/${id}`);
      const worker = response.data.worker;
      setFormData({
        name: worker.name,
        phone: worker.phone,
        password: '',
        paymentType: worker.paymentType,
        paymentAmount: worker.paymentAmount,
        isActive: worker.isActive
      });
    } catch (error) {
      toast.error('Failed to load worker');
      navigate('/user/workers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = { ...formData };
      if (!data.password) delete data.password;

      if (isEdit) {
        await api.put(`/worker/${id}`, data);
        toast.success('Worker updated');
      } else {
        await api.post('/worker', data);
        toast.success('Worker created');
      }
      navigate('/user/workers');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/user/workers')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          {isEdit ? t('workers.editWorker') : t('workers.createWorker')}
        </h1>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('workers.name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label={t('workers.phone')}
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+966501234567"
                required
              />
            </div>

            <Input
              label={t('workers.password')}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={isEdit ? '••••••••' : ''}
              required={!isEdit}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                {t('workers.paymentType')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentType: 'per_stitching' })}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.paymentType === 'per_stitching'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                >
                  <p className={`font-medium ${formData.paymentType === 'per_stitching' ? 'text-primary-700 dark:text-primary-200' : 'text-gray-700 dark:text-slate-200'}`}>
                    {t('workers.perStitching')}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentType: 'salary' })}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.paymentType === 'salary'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                >
                  <p className={`font-medium ${formData.paymentType === 'salary' ? 'text-primary-700 dark:text-primary-200' : 'text-gray-700 dark:text-slate-200'}`}>
                    {t('workers.salary')}
                  </p>
                </button>
              </div>
            </div>

            <Input
              label={t('workers.paymentAmount')}
              type="number"
              value={formData.paymentAmount}
              onChange={(e) => setFormData({ ...formData, paymentAmount: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
            />

            {isEdit && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 text-primary-600"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-slate-200">
                  {t('common.active')}
                </label>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={loading} className="flex-1">
                {isEdit ? t('common.save') : t('workers.createWorker')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/user/workers')}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default WorkerForm;
