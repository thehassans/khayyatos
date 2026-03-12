import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ArrowLeft, Plus, Edit, Trash2, LogIn, Store } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminFinishers = () => {
  const { t } = useTranslation();
  const { api, loginAsFinisher } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [targetUser, setTargetUser] = useState(null);
  const [finishers, setFinishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginFinisherId, setLoginFinisherId] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, finisher: null, loading: false });

  useEffect(() => {
    fetchData();
  }, [userId]);

  const scopedConfig = {
    headers: {
      'x-login-as-user': userId
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userResponse, finishersResponse] = await Promise.all([
        api.get(`/admin/users/${userId}`),
        api.get('/finisher', scopedConfig)
      ]);
      setTargetUser(userResponse.data?.user || null);
      setFinishers(finishersResponse.data?.finishers || []);
    } catch (error) {
      setTargetUser(null);
      setFinishers([]);
      toast.error(error.response?.data?.error || 'Failed to load finishers');
    }
    setLoading(false);
  };

  const handleLoginAsFinisher = async (finisherId) => {
    setLoginFinisherId(finisherId);
    const result = await loginAsFinisher(finisherId, userId);
    setLoginFinisherId('');
    if (result?.success) {
      toast.success(t('finishers.loginAsFinisherSuccess', { defaultValue: 'Logged in as finisher' }));
      navigate('/finisher/dashboard');
      return;
    }
    toast.error(result?.error || t('common.error', { defaultValue: 'Error' }));
  };

  const confirmDelete = async () => {
    const finisherId = deleteModal?.finisher?._id;
    if (!finisherId) return;
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await api.delete(`/finisher/${finisherId}`, scopedConfig);
      toast.success('Finisher deleted');
      setDeleteModal({ open: false, finisher: null, loading: false });
      fetchData();
    } catch (error) {
      setDeleteModal((prev) => ({ ...prev, loading: false }));
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/admin/users')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{t('finishers.title', { defaultValue: 'Finishers' })}</h1>
            </div>
            <p className="text-sm text-gray-500">
              {targetUser?.businessName
                ? `Manage finishers for ${targetUser.businessName}`
                : 'Manage finishers for this shop'}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/admin/users/${userId}/finishers/new`)} icon={Plus}>
          {t('finishers.createFinisher', { defaultValue: 'Create Finisher' })}
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : finishers.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>{t('workers.name')}</Th>
                <Th>{t('workers.phone')}</Th>
                <Th>{t('settings.language', { defaultValue: 'Language' })}</Th>
                <Th>{t('common.status')}</Th>
                <Th>{t('common.actions')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {finishers.map((finisher) => (
                <Tr key={finisher._id}>
                  <Td className="font-medium">{finisher.name}</Td>
                  <Td>{finisher.phone}</Td>
                  <Td>{String(finisher.language || 'en').toUpperCase()}</Td>
                  <Td><StatusBadge status={finisher.isActive ? 'active' : 'inactive'} /></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoginAsFinisher(finisher._id)}
                        disabled={loginFinisherId === finisher._id}
                        className="p-2 hover:bg-primary-50 text-primary-600 rounded-lg disabled:opacity-50"
                        title={t('finishers.loginAsFinisherSuccess', { defaultValue: 'Login as finisher' })}
                      >
                        <LogIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/users/${userId}/finishers/${finisher._id}/edit`)}
                        className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg"
                        title={t('common.edit', { defaultValue: 'Edit' })}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, finisher, loading: false })}
                        className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg"
                        title={t('common.delete', { defaultValue: 'Delete' })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <div className="p-12 text-center text-gray-500">{t('common.noData')}</div>
        )}
      </Card>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, finisher: null, loading: false })}
        title={t('common.delete', { defaultValue: 'Delete' })}
        message={t('finishers.deleteConfirmTitle', { defaultValue: 'Delete this finisher?' })}
        subtitle={t('finishers.deleteConfirmSubtitle', { defaultValue: 'All linked shops and assignments will also be removed.' })}
        confirmText={t('common.delete', { defaultValue: 'Delete' })}
        cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
        confirmVariant="danger"
        loading={deleteModal.loading}
        onConfirm={confirmDelete}
        previewTitle={deleteModal?.finisher?.name || ''}
        previewSubtitle={deleteModal?.finisher?.phone || ''}
      />
    </div>
  );
};

export default AdminFinishers;
