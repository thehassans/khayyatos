import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard } from '../../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/Badge';
import { Store, Package, Wallet, Clock } from 'lucide-react';
import SARIcon from '../../components/ui/SARIcon';

const FinisherDashboard = () => {
  const { t } = useTranslation();
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/finisher/panel/dashboard');
      setData(response.data);
    } catch (error) {
      setData(null);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('dashboard.title')}</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">{t('finishers.dashboardSubtitle', { defaultValue: 'Track shops, assignments, and received amounts.' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Store} label={t('nav.shops', { defaultValue: 'Shops' })} value={data?.stats?.totalShops || 0} color="primary" />
        <StatCard icon={Package} label={t('finishers.totalPieces', { defaultValue: 'Total Pieces' })} value={data?.stats?.totalPieces || 0} color="emerald" />
        <StatCard icon={() => <SARIcon className="w-6 h-6" />} label={t('finishers.receivedAmount', { defaultValue: 'Received Amount' })} value={<span className="inline-flex items-center gap-1">{data?.stats?.amountReceived || 0} <SARIcon className="w-5 h-5" /></span>} color="violet" />
        <StatCard icon={Clock} label={t('workers.pendingAmount')} value={<span className="inline-flex items-center gap-1">{data?.stats?.pendingAmount || 0} <SARIcon className="w-5 h-5" /></span>} color="amber" />
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100">{t('finishers.recentAssignments', { defaultValue: 'Recent Assignments' })}</h2>
        </div>
        {data?.recentAssignments?.length ? (
          <Table>
            <Thead>
              <Tr>
                <Th>{t('nav.shops', { defaultValue: 'Shops' })}</Th>
                <Th>{t('finishers.pieces', { defaultValue: 'Pieces' })}</Th>
                <Th>{t('workers.pendingAmount')}</Th>
                <Th>{t('common.status')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.recentAssignments.map((assignment) => (
                <Tr key={assignment._id}>
                  <Td>{assignment.shopId?.shopName || '-'}</Td>
                  <Td>{assignment.pieces || 0}</Td>
                  <Td><span className="inline-flex items-center gap-1">{assignment.pendingAmount || 0} <SARIcon className="w-3 h-3" /></span></Td>
                  <Td><StatusBadge status={assignment.status} /></Td>
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

export default FinisherDashboard;
