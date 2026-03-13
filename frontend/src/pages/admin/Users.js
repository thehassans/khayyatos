import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Plus, Search, LogIn, Edit, Trash2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const { t } = useTranslation();
  const { api, loginAsUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ status: '', subscription: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null, loading: false });
  const [resetModal, setResetModal] = useState({ open: false, user: null, loading: false });

  useEffect(() => {
    fetchUsers();
  }, [search, filter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filter.status) params.append('status', filter.status);
      if (filter.subscription) params.append('subscription', filter.subscription);
      
      const response = await api.get(`/admin/users?${params}`);
      const data = response.data;
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
    setLoading(false);
  };

  const handleLoginAs = async (userId) => {
    const result = await loginAsUser(userId);
    if (result.success) {
      navigate('/user/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  const requestDelete = (u) => {
    setDeleteModal({ open: true, user: u, loading: false });
  };

  const closeDelete = () => {
    setDeleteModal({ open: false, user: null, loading: false });
  };

  const confirmDelete = async () => {
    const id = deleteModal?.user?._id;
    if (!id) {
      closeDelete();
      return;
    }
    setDeleteModal((p) => ({ ...p, loading: true }));
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted successfully');
      closeDelete();
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
      setDeleteModal((p) => ({ ...p, loading: false }));
    }
  };

  const requestReset = (u) => {
    setResetModal({ open: true, user: u, loading: false });
  };

  const closeReset = () => {
    setResetModal({ open: false, user: null, loading: false });
  };

  const confirmReset = async () => {
    const id = resetModal?.user?._id;
    if (!id) {
      closeReset();
      return;
    }
    setResetModal((p) => ({ ...p, loading: true }));
    try {
      await api.post(`/admin/users/${id}/reset-data`);
      toast.success('User data reset successfully');
      closeReset();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset user data');
      setResetModal((p) => ({ ...p, loading: false }));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.users')}</h1>
        <Button onClick={() => navigate('/admin/users/new')} icon={Plus}>
          {t('admin.createUser')}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('common.search')}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="active">{t('common.active')}</option>
            <option value="inactive">{t('common.inactive')}</option>
          </select>
          <select
            value={filter.subscription}
            onChange={(e) => setFilter({ ...filter, subscription: e.target.value })}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <option value="">All Plans</option>
            <option value="trial">{t('admin.trial')}</option>
            <option value="yearly">{t('admin.yearly')}</option>
            <option value="lifetime">{t('admin.lifetime')}</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>{t('admin.businessName')}</Th>
                <Th>{t('auth.phone')}</Th>
                <Th>{t('admin.subscription')}</Th>
                <Th>{t('dashboard.expiresOn')}</Th>
                <Th>{t('common.status')}</Th>
                <Th>{t('common.actions')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user._id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {user.logo ? (
                        <img src={user.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <span className="text-primary-700 font-medium">{user.businessName?.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{user.businessName}</p>
                        <p className="text-sm text-gray-500">{user.name}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>{user.phone}</Td>
                  <Td><StatusBadge status={user.subscriptionType} /></Td>
                  <Td>{new Date(user.subscriptionEndDate).toLocaleDateString()}</Td>
                  <Td><StatusBadge status={user.isActive ? 'active' : 'inactive'} /></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoginAs(user._id)}
                        className="p-2 hover:bg-primary-50 text-primary-600 rounded-lg"
                        title={t('admin.loginAsUser')}
                      >
                        <LogIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/users/${user._id}/edit`)}
                        className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => requestReset(user)}
                        className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg"
                        title="Reset user data"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => requestDelete(user)}
                        className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        {!loading && users.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            {t('common.noData')}
          </div>
        )}
      </Card>

      <ConfirmModal
        isOpen={resetModal.open}
        onClose={closeReset}
        title="Reset User Data"
        message="Delete all business data for this user?"
        subtitle="This keeps the account but removes customers, invoices, workers, laundry records, payments, fabrics, and embroidery designs."
        confirmText="Reset Data"
        cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
        confirmVariant="danger"
        loading={resetModal.loading}
        onConfirm={confirmReset}
        previewTitle={resetModal?.user?.businessName || ''}
        previewSubtitle={resetModal?.user?.phone || ''}
      />

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={closeDelete}
        title={t('common.delete', { defaultValue: 'Delete' })}
        message={t('admin.deleteConfirmTitle', { defaultValue: 'Delete this user?' })}
        subtitle={t('admin.deleteConfirmSubtitle', { defaultValue: 'This will remove the shop and all related data.' })}
        confirmText={t('common.delete', { defaultValue: 'Delete' })}
        cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
        confirmVariant="danger"
        loading={deleteModal.loading}
        onConfirm={confirmDelete}
        previewTitle={deleteModal?.user?.businessName || ''}
        previewSubtitle={deleteModal?.user?.phone || ''}
      />
    </div>
  );
};

export default AdminUsers;
