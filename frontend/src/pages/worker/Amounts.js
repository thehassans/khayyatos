import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { TrendingUp, Clock } from 'lucide-react';
import SARIcon from '../../components/ui/SARIcon';

const WorkerAmounts = () => {
  const { t } = useTranslation();
  const { api } = useAuth();
  const [data, setData] = useState({ payments: [], summary: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAmounts();
  }, []);

  const fetchAmounts = async () => {
    try {
      const response = await api.get('/worker/panel/amounts');
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <SARIcon className="w-8 h-8 text-emerald-500" />
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.amounts')}</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('workers.totalEarnings')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1 flex items-center gap-1">{data.summary?.totalEarnings || 0} <SARIcon className="w-6 h-6" /></p>
            </div>
            <div className="p-3 bg-violet-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-violet-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('workers.totalPaid')}</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1 flex items-center gap-1">{data.summary?.totalPaid || 0} <SARIcon className="w-6 h-6" /></p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <SARIcon className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('workers.pendingAmount')}</p>
              <p className="text-3xl font-bold text-amber-600 mt-1 flex items-center gap-1">{data.summary?.pendingAmount || 0} <SARIcon className="w-6 h-6" /></p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('workers.paymentHistory')}</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          </div>
        ) : data.payments?.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>{t('common.date')}</Th>
                <Th>{t('common.amount')}</Th>
                <Th>Type</Th>
                <Th>Description</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.payments.map((payment) => (
                <Tr key={payment._id}>
                  <Td>{new Date(payment.createdAt).toLocaleDateString()}</Td>
                  <Td className="font-medium text-emerald-600"><span className="inline-flex items-center gap-1">+{payment.amount} <SARIcon className="w-3 h-3" /></span></Td>
                  <Td className="capitalize">{payment.type?.replace('_', ' ')}</Td>
                  <Td className="text-gray-500">{payment.description || '-'}</Td>
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

export default WorkerAmounts;
