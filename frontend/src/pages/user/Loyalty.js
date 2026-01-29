import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { Search, Heart, TrendingUp } from 'lucide-react';
import SARIcon from '../../components/ui/SARIcon';

const Loyalty = () => {
  const { t } = useTranslation();
  const { api } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ totalCustomers: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLoyalty();
  }, [search]);

  const fetchLoyalty = async () => {
    try {
      const params = search ? `?search=${search}` : '';
      const response = await api.get(`/customers/loyalty${params}`);
      const data = response.data;
      setCustomers(Array.isArray(data) ? data : data.customers || []);
      setStats(data.stats || { totalCustomers: 0, totalSpent: 0 });
    } catch (error) {
      console.error('Error:', error);
      setCustomers([]);
      setStats({ totalCustomers: 0, totalSpent: 0 });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Heart className="w-8 h-8 text-rose-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('loyalty.title')}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">{t('admin.totalUsers')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-1">{stats.totalCustomers}</p>
            </div>
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <Heart className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">{t('loyalty.allTimeSpending')}</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1 flex items-center gap-1">{stats.totalSpent?.toLocaleString() || 0} <SARIcon className="w-6 h-6" /></p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
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

      {/* Top Customers */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100">{t('loyalty.topCustomers')}</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : customers.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>#</Th>
                <Th>{t('customers.name')}</Th>
                <Th>{t('customers.phone')}</Th>
                <Th>{t('loyalty.orderCount')}</Th>
                <Th>{t('customers.totalSpent')}</Th>
                <Th>{t('customers.loyaltyPoints')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {customers.map((customer, index) => (
                <Tr key={customer._id}>
                  <Td>
                    <span className={`
                      inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                      ${index === 0 ? 'bg-amber-100 text-amber-700' : 
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'}
                    `}>
                      {index + 1}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
                        <span className="text-rose-700 dark:text-rose-200 font-medium">{customer.name?.charAt(0)}</span>
                      </div>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                  </Td>
                  <Td>{customer.phone}</Td>
                  <Td>{customer.totalOrders || 0}</Td>
                  <Td className="font-medium text-emerald-600 flex items-center gap-1">{customer.totalSpent || 0} <SARIcon className="w-3 h-3" /></Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200 rounded-full text-sm">
                      <Heart className="w-3 h-3" />
                      {customer.loyaltyPoints || 0}
                    </span>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <div className="p-12 text-center text-gray-500 dark:text-slate-400">{t('common.noData')}</div>
        )}
      </Card>
    </div>
  );
};

export default Loyalty;
