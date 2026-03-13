import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Plus, Search, LogIn, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminAllFinishers = () => {
  const { t } = useTranslation();
  const { api, loginAsFinisher } = useAuth();
  const navigate = useNavigate();

  const [finishers, setFinishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [loginFinisherId, setLoginFinisherId] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, finisher: null, loading: false });

  useEffect(() => {
    fetchFinishers();
  }, [search]);

  const fetchFinishers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const response = await api.get(`/admin/finishers?${params}`);
      setFinishers(response.data?.finishers || []);
    } catch (error) {
      toast.error('Failed to load finishers');
      setFinishers([]);
    }
    setLoading(false);
  };

  const handleLoginAs = async (finisher) => {
    setLoginFinisherId(finisher._id);
    const result = await loginAsFinisher(finisher._id);
    setLoginFinisherId('');
    if (result?.success) {
      toast.success('Logged in as finisher');
      navigate('/finisher/dashboard');
      return;
    }
    toast.error(result?.error || 'Failed');
  };

  const requestDelete = (finisher) => setDeleteModal({ open: true, finisher, loading: false });

  const confirmDelete = async () => {
    const finisher = deleteModal.finisher;
    if (!finisher) return;
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await api.delete(`/admin/finishers/${finisher._id}`);
      toast.success('Finisher deleted');
      setDeleteModal({ open: false, finisher: null, loading: false });
      fetchFinishers();
    } catch (error) {
      setDeleteModal((prev) => ({ ...prev, loading: false }));
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.finishers', { defaultValue: 'Finishers' })}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('finishers.allFinishersSubtitle', { defaultValue: 'All finishers across all shops' })}</p>
        </div>
        <Button onClick={() => navigate('/admin/finishers/new')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('finishers.createFinisher', { defaultValue: 'Create Finisher' })}
        </Button>
      </div>

      <Card className="mb-6">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('common.search', { defaultValue: 'Search by name, phone or shop…' })}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="p-12 text-center text-gray-500">{t('common.loading', { defaultValue: 'Loading…' })}</div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>{t('common.name', { defaultValue: 'Name' })}</Th>
                <Th>{t('auth.phone')}</Th>
                <Th>{t('common.status')}</Th>
                <Th>{t('common.actions')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {finishers.length === 0 ? (
                <Tr>
                  <Td colSpan={5} className="text-center text-gray-500 py-10">
                    {t('finishers.noFinishers', { defaultValue: 'No finishers found' })}
                  </Td>
                </Tr>
              ) : (
                finishers.map((finisher) => (
                    <Tr key={finisher._id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <span className="text-emerald-700 font-semibold text-sm">{finisher.name?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{finisher.name}</p>
                            <p className="text-xs text-gray-400">{finisher.language?.toUpperCase()}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>{finisher.phone}</Td>
                      <Td><StatusBadge status={finisher.isActive ? 'active' : 'inactive'} /></Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLoginAs(finisher)}
                            disabled={loginFinisherId === finisher._id}
                            className="p-2 hover:bg-primary-50 text-primary-600 rounded-lg disabled:opacity-50"
                            title={t('workers.loginAsWorker', { defaultValue: 'Login as Finisher' })}
                          >
                            <LogIn className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/finishers/${finisher._id}/edit`)}
                            className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg"
                            title={t('common.edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => requestDelete(finisher)}
                            className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  ))
              )}
            </Tbody>
          </Table>
        )}
      </Card>

      <ConfirmModal
        isOpen={deleteModal.open}
        title={t('finishers.deleteFinisher', { defaultValue: 'Delete Finisher' })}
        message={t('finishers.deleteFinisherConfirm', { defaultValue: `Are you sure you want to delete "${deleteModal.finisher?.name}"? This cannot be undone.` })}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ open: false, finisher: null, loading: false })}
        loading={deleteModal.loading}
        confirmText={t('common.delete')}
        variant="danger"
      />
    </div>
  );
};

export default AdminAllFinishers;
