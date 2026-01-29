import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { Scissors, CheckCircle, Clock } from 'lucide-react';
import SARIcon from '../../components/ui/SARIcon';

const WorkerDashboard = () => {
  const { t } = useTranslation();
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/worker/panel/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-500 mt-1">{t('common.welcome')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label={t('stitchings.statusAssigned')}
          value={data?.stats?.assignedStitchings || 0}
          color="primary"
        />
        <StatCard
          icon={CheckCircle}
          label={t('common.completed')}
          value={data?.stats?.completedStitchings || 0}
          color="emerald"
        />
        <StatCard
          icon={() => <SARIcon className="w-6 h-6" />}
          label={t('workers.totalEarnings')}
          value={<span className="flex items-center gap-1">{data?.stats?.totalEarnings || 0} <SARIcon className="w-5 h-5" /></span>}
          color="violet"
        />
        <StatCard
          icon={() => <SARIcon className="w-6 h-6" />}
          label={t('workers.pendingAmount')}
          value={<span className="flex items-center gap-1">{data?.stats?.pendingAmount || 0} <SARIcon className="w-5 h-5" /></span>}
          color="amber"
        />
      </div>

      {/* Recent Stitchings */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('dashboard.recentOrders')}</h2>
        </div>
        {data?.recentStitchings?.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>{t('stitchings.receiptNumber')}</Th>
                <Th>{t('stitchings.customer')}</Th>
                <Th>{t('stitchings.quantity')}</Th>
                <Th>{t('common.status')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.recentStitchings.map((stitch) => (
                <Tr key={stitch._id}>
                  <Td className="font-medium">{stitch.receiptNumber}</Td>
                  <Td>
                    <div>
                      <p>{stitch.customerId?.name || '-'}</p>
                      <p className="text-xs text-gray-500">{stitch.customerId?.phone}</p>
                    </div>
                  </Td>
                  <Td>{stitch.quantity}</Td>
                  <Td><StatusBadge status={stitch.status} /></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <div className="p-12 text-center text-gray-500">
            {t('common.noData')}
          </div>
        )}
      </Card>
    </div>
  );
};

export default WorkerDashboard;
