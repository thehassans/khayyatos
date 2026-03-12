import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import DemoBlockedModal from '../../components/ui/DemoBlockedModal';
import { Plus, Edit, Trash2, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const Finishers = () => {
  const { t } = useTranslation();
  const { api, user, loginAsFinisher } = useAuth();
  const navigate = useNavigate();
  const [finishers, setFinishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginFinisherId, setLoginFinisherId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, finisher: null, loading: false });
  const [demoBlockedOpen, setDemoBlockedOpen] = useState(false);

  const isDemo = !!user?.isDemoSession;

  useEffect(() => {
    fetchFinishers();
  }, []);

  const fetchFinishers = async () => {
    try {
      const response = await api.get('/finisher');
      setFinishers(response.data?.finishers || []);
    } catch (error) {
      setFinishers([]);
      toast.error('Failed to load finishers');
    }
    setLoading(false);
  };

  const handleLoginAsFinisher = async (finisherId) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setLoginFinisherId(finisherId);
    const result = await loginAsFinisher(finisherId);
    setLoginFinisherId(null);
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
      await api.delete(`/finisher/${finisherId}`);
      toast.success('Finisher deleted');
      setDeleteModal({ open: false, finisher: null, loading: false });
      fetchFinishers();
    } catch (error) {
      setDeleteModal((prev) => ({ ...prev, loading: false }));
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">{t('finishers.title', { defaultValue: 'Finishers' })}</h1>
        <Button onClick={() => (isDemo ? setDemoBlockedOpen(true) : navigate('/user/finishers/new'))} icon={Plus} className="w-full sm:w-auto">
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
                <Th>{t('common.status')}</Th>
                <Th>{t('common.actions')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {finishers.map((finisher) => (
                <Tr key={finisher._id}>
                  <Td className="font-medium">{finisher.name}</Td>
                  <Td>{finisher.phone}</Td>
                  <Td><StatusBadge status={finisher.isActive ? 'active' : 'inactive'} /></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoginAsFinisher(finisher._id)}
                        disabled={loginFinisherId === finisher._id}
                        className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-300 rounded-lg disabled:opacity-50"
                      >
                        <LogIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/user/finishers/${finisher._id}/edit`)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 text-gray-600 dark:text-slate-300 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, finisher, loading: false })}
                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg"
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
          <div className="p-12 text-center text-gray-500 dark:text-slate-400">{t('common.noData')}</div>
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

      <DemoBlockedModal
        isOpen={demoBlockedOpen}
        onClose={() => setDemoBlockedOpen(false)}
        title="Live Demo"
        phone="+966596775485"
      />
    </div>
  );
};

export default Finishers;
