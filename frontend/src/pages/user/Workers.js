import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import SARIcon from '../../components/ui/SARIcon';
import toast from 'react-hot-toast';

const Workers = () => {
  const { t } = useTranslation();
  const { api } = useAuth();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/worker');
      const data = response.data;
      setWorkers(Array.isArray(data) ? data : data.workers || []);
    } catch (error) {
      console.error('Error fetching workers:', error);
      setWorkers([]);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/worker/${id}`);
      toast.success('Worker deleted');
      fetchWorkers();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('workers.title')}</h1>
        <Button onClick={() => navigate('/user/workers/new')} icon={Plus}>
          {t('workers.createWorker')}
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : workers.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>{t('workers.name')}</Th>
                <Th>{t('workers.phone')}</Th>
                <Th>{t('workers.paymentType')}</Th>
                <Th>{t('workers.pendingAmount')}</Th>
                <Th>{t('common.status')}</Th>
                <Th>{t('common.actions')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {workers.map((worker) => (
                <Tr key={worker._id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <span className="text-emerald-700 dark:text-emerald-200 font-medium">{worker.name?.charAt(0)}</span>
                      </div>
                      <span className="font-medium">{worker.name}</span>
                    </div>
                  </Td>
                  <Td>{worker.phone}</Td>
                  <Td>
                    <span className="capitalize">
                      {worker.paymentType === 'per_stitching' ? t('workers.perStitching') : t('workers.salary')}
                    </span>
                    <span className="text-gray-500 dark:text-slate-400 ml-1 inline-flex items-center gap-1">({worker.paymentAmount} <SARIcon className="w-3 h-3" />)</span>
                  </Td>
                  <Td className="font-medium text-amber-600"><span className="inline-flex items-center gap-1">{worker.pendingAmount || 0} <SARIcon className="w-3 h-3" /></span></Td>
                  <Td><StatusBadge status={worker.isActive ? 'active' : 'inactive'} /></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/user/workers/${worker._id}/edit`)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 text-gray-600 dark:text-slate-300 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(worker._id)}
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
          <div className="p-12 text-center text-gray-500 dark:text-slate-400">
            {t('common.noData')}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Workers;
