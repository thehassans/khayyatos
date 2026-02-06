import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import DemoBlockedModal from '../../components/ui/DemoBlockedModal';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import SARIcon from '../../components/ui/SARIcon';
import toast from 'react-hot-toast';

const Customers = () => {
  const { t, i18n } = useTranslation();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, customer: null, loading: false });
  const [demoBlockedOpen, setDemoBlockedOpen] = useState(false);

  const isDemo = !!user?.isDemoSession;

  const langKey = (i18n?.language || 'en').split('-')[0];

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      const params = search ? `?search=${search}` : '';
      const response = await api.get(`/customers${params}`);
      const data = response.data;
      setCustomers(Array.isArray(data) ? data : data.customers || []);
    } catch (error) {
      console.error('Error:', error);
      setCustomers([]);
    }
    setLoading(false);
  };

  const requestDelete = (customer) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setDeleteModal({ open: true, customer, loading: false });
  };

  const closeDelete = () => {
    setDeleteModal({ open: false, customer: null, loading: false });
  };

  const confirmDelete = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      closeDelete();
      return;
    }
    const id = deleteModal?.customer?._id;
    if (!id) {
      closeDelete();
      return;
    }
    setDeleteModal((p) => ({ ...p, loading: true }));
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      closeDelete();
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to delete');
      setDeleteModal((p) => ({ ...p, loading: false }));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">{t('customers.title')}</h1>
        <Button data-tutorial="customers-create-button" onClick={() => (isDemo ? setDemoBlockedOpen(true) : navigate('/user/customers/new'))} icon={Plus} className="w-full sm:w-auto">
          {t('customers.createCustomer')}
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('loyalty.searchCustomer')}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : customers.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>{t('customers.name')}</Th>
                <Th>{t('customers.phone')}</Th>
                <Th>{t('customers.totalOrders')}</Th>
                <Th>{t('customers.totalSpent')}</Th>
                <Th>{t('common.actions')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {customers.map((customer) => (
                <Tr key={customer._id} onClick={() => navigate(`/user/customers/${customer._id}`)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 dark:text-primary-200 font-medium">{(customer.nameI18n?.[langKey] || customer.name || '')?.charAt(0)}</span>
                      </div>
                      <div>
                        <span className="font-medium block">{customer.nameI18n?.[langKey] || customer.name}</span>
                        {customer.relations?.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="w-3 h-3 text-gray-400 dark:text-slate-400" />
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                              {customer.relations.map(r => r.customerName).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td>{customer.phone}</Td>
                  <Td>{customer.totalOrders || 0}</Td>
                  <Td className="font-medium flex items-center gap-1">{customer.totalSpent || 0} <SARIcon className="w-3 h-3" /></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isDemo) {
                            setDemoBlockedOpen(true);
                            return;
                          }
                          navigate(`/user/customers/${customer._id}/edit`);
                        }}
                        disabled={isDemo}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 text-gray-600 dark:text-slate-300 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); requestDelete(customer); }}
                        disabled={isDemo}
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
        onClose={closeDelete}
        title={t('common.delete', { defaultValue: 'Delete' })}
        message={t('customers.deleteConfirmTitle', { defaultValue: 'Delete this customer?' })}
        subtitle={t('customers.deleteConfirmSubtitle', { defaultValue: 'This will also delete all orders linked to this customer.' })}
        confirmText={t('common.delete', { defaultValue: 'Delete' })}
        cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
        confirmVariant="danger"
        loading={deleteModal.loading}
        onConfirm={confirmDelete}
        previewTitle={deleteModal?.customer?.nameI18n?.[langKey] || deleteModal?.customer?.name || ''}
        previewSubtitle={deleteModal?.customer?.phone || ''}
      />

      <DemoBlockedModal
        isOpen={demoBlockedOpen}
        onClose={() => setDemoBlockedOpen(false)}
        title={t('demo.title', { defaultValue: 'Demo Mode' })}
        phone="+966596775485"
      />
    </div>
  );
};

export default Customers;
