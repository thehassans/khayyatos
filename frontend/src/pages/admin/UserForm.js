import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUserForm = () => {
  const { t } = useTranslation();
  const { api } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    businessName: '',
    businessNameAr: '',
    businessAddress: '',
    receiptPrefix: 'RCP',
    phone: '',
    password: '',
    subscriptionType: 'trial',
    logo: null
  });

  useEffect(() => {
    if (isEdit) fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      const user = response.data.user;
      setFormData({
        name: user.name,
        nameAr: user.nameAr || '',
        businessName: user.businessName,
        businessNameAr: user.businessNameAr || '',
        businessAddress: user.businessAddress || '',
        receiptPrefix: user.receiptPrefix || 'RCP',
        phone: user.phone,
        password: '',
        subscriptionType: user.subscriptionType,
        isActive: user.isActive
      });
      if (user.logo) setLogoPreview(user.logo);
    } catch (error) {
      toast.error('Failed to load user');
      navigate('/admin/users');
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logo: file });
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('nameAr', formData.nameAr || formData.name);
      data.append('businessName', formData.businessName);
      data.append('businessNameAr', formData.businessNameAr || formData.businessName);
      data.append('businessAddress', formData.businessAddress);
      data.append('receiptPrefix', formData.receiptPrefix);
      data.append('phone', formData.phone);
      if (formData.password) data.append('password', formData.password);
      data.append('subscriptionType', formData.subscriptionType);
      if (formData.logo) data.append('logo', formData.logo);
      if (isEdit && formData.isActive !== undefined) {
        data.append('isActive', formData.isActive);
      }

      if (isEdit) {
        await api.put(`/admin/users/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('User updated successfully');
      } else {
        await api.post('/admin/users', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('User created successfully');
      }
      navigate('/admin/users');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? t('admin.editUser') : t('admin.createUser')}
        </h1>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                    {t('settings.uploadLogo')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 5MB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('workers.name') + ' (English)'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, nameAr: formData.nameAr || e.target.value })}
                required
              />
              <Input
                label={t('workers.name') + ' (Arabic)'}
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="الاسم بالعربي"
                dir="rtl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('admin.businessName') + ' (English)'}
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value, businessNameAr: formData.businessNameAr || e.target.value })}
                required
                disabled={isEdit}
              />
              <Input
                label={t('admin.businessName') + ' (Arabic)'}
                value={formData.businessNameAr}
                onChange={(e) => setFormData({ ...formData, businessNameAr: e.target.value })}
                placeholder="اسم المحل بالعربي"
                dir="rtl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business Address"
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                placeholder="Street, Building, City"
              />
              <Input
                label="Receipt Prefix"
                value={formData.receiptPrefix}
                onChange={(e) => setFormData({ ...formData, receiptPrefix: e.target.value.toUpperCase() })}
                placeholder="RCP"
                maxLength={5}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('auth.phone')}
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+966501234567"
                required
              />
              <Input
                label={t('auth.password')}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={isEdit ? '••••••••' : ''}
                required={!isEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.subscription')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['trial', 'yearly', 'lifetime'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, subscriptionType: type })}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.subscriptionType === type
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`font-medium ${formData.subscriptionType === type ? 'text-primary-700' : 'text-gray-700'}`}>
                      {t(`admin.${type}`)}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {isEdit && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  {t('common.active')}
                </label>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={loading} className="flex-1">
                {isEdit ? t('common.save') : t('admin.createUser')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminUserForm;
