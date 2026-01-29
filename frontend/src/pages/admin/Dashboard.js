import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { Users, UserCheck, Clock, Crown, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { api } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.title')}</p>
        </div>
        <Button onClick={() => navigate('/admin/users/new')} icon={Plus}>
          {t('admin.createUser')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Users}
          label={t('admin.totalUsers')}
          value={data?.stats?.totalUsers || 0}
          color="primary"
        />
        <StatCard
          icon={UserCheck}
          label={t('admin.activeUsers')}
          value={data?.stats?.activeUsers || 0}
          color="emerald"
        />
        <StatCard
          icon={Clock}
          label={t('admin.trialUsers')}
          value={data?.stats?.trialUsers || 0}
          color="amber"
        />
        <StatCard
          icon={Crown}
          label={t('admin.yearlyUsers')}
          value={data?.stats?.yearlyUsers || 0}
          color="violet"
        />
        <StatCard
          icon={Crown}
          label={t('admin.lifetimeUsers')}
          value={data?.stats?.lifetimeUsers || 0}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{t('dashboard.recentOrders')}</h2>
          </div>
          <Table>
            <Thead>
              <Tr>
                <Th>{t('admin.businessName')}</Th>
                <Th>{t('admin.subscription')}</Th>
                <Th>{t('common.status')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data?.recentUsers?.slice(0, 5).map((user) => (
                <Tr key={user._id} onClick={() => navigate(`/admin/users/${user._id}/edit`)}>
                  <Td>
                    <div>
                      <p className="font-medium text-gray-900">{user.businessName}</p>
                      <p className="text-sm text-gray-500">{user.phone}</p>
                    </div>
                  </Td>
                  <Td><StatusBadge status={user.subscriptionType} /></Td>
                  <Td><StatusBadge status={user.isActive ? 'active' : 'inactive'} /></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>

        {/* Expiring Soon */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900">{t('admin.expiringUsers')}</h2>
          </div>
          {data?.expiringUsers?.length > 0 ? (
            <Table>
              <Thead>
                <Tr>
                  <Th>{t('admin.businessName')}</Th>
                  <Th>{t('dashboard.expiresOn')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data?.expiringUsers?.map((user) => (
                  <Tr key={user._id} onClick={() => navigate(`/admin/users/${user._id}/edit`)}>
                    <Td>
                      <p className="font-medium text-gray-900">{user.businessName}</p>
                    </Td>
                    <Td>
                      <p className="text-amber-600 font-medium">
                        {new Date(user.subscriptionEndDate).toLocaleDateString()}
                      </p>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <div className="p-6 text-center text-gray-500">
              {t('common.noData')}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
