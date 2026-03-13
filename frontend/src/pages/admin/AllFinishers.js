import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Plus, Search, LogIn, Edit, Trash2, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminAllFinishers = () => {
  const { t } = useTranslation();
  const { api, loginAsFinisher } = useAuth();
  const navigate = useNavigate();

  const [finishers, setFinishers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [loginFinisherId, setLoginFinisherId] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, finisher: null, loading: false });

  const [createModal, setCreateModal] = useState({ open: false });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userDropOpen, setUserDropOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    fetchFinishers();
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setUserDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      const data = response.data;
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch {
      setUsers([]);
    }
  };

  const handleLoginAs = async (finisher) => {
    const userId = finisher.userId?._id || finisher.userId;
    setLoginFinisherId(finisher._id);
    const result = await loginAsFinisher(finisher._id, userId, true);
    setLoginFinisherId('');
    if (result?.success) {
      toast.success('Logged in as finisher');
      navigate('/finisher/dashboard');
      return;
    }
    toast.error(result?.error || 'Failed');
  };

  const requestDelete = (finisher) => {
    setDeleteModal({ open: true, finisher, loading: false });
  };

  const confirmDelete = async () => {
    const finisher = deleteModal.finisher;
    if (!finisher) return;
    const userId = finisher.userId?._id || finisher.userId;
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await api.delete(`/admin/users/${userId}/finishers/${finisher._id}`);
      toast.success('Finisher deleted');
      setDeleteModal({ open: false, finisher: null, loading: false });
      fetchFinishers();
    } catch (error) {
      setDeleteModal((prev) => ({ ...prev, loading: false }));
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setUserSearch('');
    setCreateModal({ open: true });
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return !q || u.businessName?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q) || u.phone?.includes(q);
  });

  const handleCreateProceed = () => {
    if (!selectedUser) {
      toast.error('Please select a user/shop first');
      return;
    }
    setCreateModal({ open: false });
    navigate(`/admin/users/${selectedUser._id}/finishers/new`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.finishers', { defaultValue: 'Finishers' })}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('finishers.allFinishersSubtitle', { defaultValue: 'All finishers across all shops' })}</p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
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
                <Th>{t('admin.shop', { defaultValue: 'Shop / User' })}</Th>
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
                finishers.map((finisher) => {
                  const userId = finisher.userId?._id || finisher.userId;
                  const shopName = finisher.userId?.businessName || '—';
                  return (
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
                      <Td>
                        <button
                          onClick={() => navigate(`/admin/users/${userId}/finishers`)}
                          className="text-primary-600 hover:underline text-sm font-medium"
                        >
                          {shopName}
                        </button>
                      </Td>
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
                            onClick={() => navigate(`/admin/users/${userId}/finishers/${finisher._id}/edit`)}
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
                  );
                })
              )}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Create Finisher Modal — pick a user/shop first */}
      {createModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{t('finishers.selectShop', { defaultValue: 'Select Shop / User' })}</h2>
              <button onClick={() => setCreateModal({ open: false })} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{t('finishers.selectShopDesc', { defaultValue: 'Choose which shop this finisher will belong to.' })}</p>

            <div className="relative" ref={dropRef}>
              <button
                type="button"
                onClick={() => setUserDropOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white hover:border-gray-300 transition-colors"
              >
                <span className={selectedUser ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                  {selectedUser ? `${selectedUser.businessName} — ${selectedUser.name}` : t('finishers.selectShopPlaceholder', { defaultValue: 'Select a shop…' })}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userDropOpen ? 'rotate-180' : ''}`} />
              </button>
              {userDropOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search…"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400">No shops found</div>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => { setSelectedUser(u); setUserDropOpen(false); }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${selectedUser?._id === u._id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}
                        >
                          <div className="font-medium">{u.businessName}</div>
                          <div className="text-xs text-gray-400">{u.name} · {u.phone}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={() => setCreateModal({ open: false })}>
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button className="flex-1" onClick={handleCreateProceed} disabled={!selectedUser}>
                {t('common.continue', { defaultValue: 'Continue' })}
              </Button>
            </div>
          </div>
        </div>
      )}

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
