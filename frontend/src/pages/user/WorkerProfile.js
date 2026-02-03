import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import DemoBlockedModal from '../../components/ui/DemoBlockedModal';
import SARIcon from '../../components/ui/SARIcon';
import { ArrowLeft, Phone, Users, ClipboardList, Edit, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const WorkerProfile = () => {
  const { t, i18n } = useTranslation();
  const { api, user, loginAsWorker } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const langKey = (i18n?.language || 'en').split('-')[0];
  const isDemo = !!user?.isDemoSession;

  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState(null);
  const [stitchings, setStitchings] = useState([]);
  const [stats, setStats] = useState(null);
  const [demoBlockedOpen, setDemoBlockedOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/worker/profile/${id}`);
      setWorker(res.data?.worker || null);
      setStitchings(Array.isArray(res.data?.stitchings) ? res.data.stitchings : []);
      setStats(res.data?.stats || null);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to load worker');
      navigate('/user/workers');
    }
    setLoading(false);
  };

  const assignedCustomers = useMemo(() => {
    const map = new Map();
    for (const s of stitchings) {
      if (!s?.customerId?._id) continue;
      if (!['assigned', 'in_progress'].includes(s.status)) continue;
      const cid = String(s.customerId._id);
      const prev = map.get(cid) || { customer: s.customerId, count: 0 };
      prev.count += 1;
      map.set(cid, prev);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [stitchings]);

  const recentOrders = useMemo(() => {
    return (stitchings || []).slice(0, 20);
  }, [stitchings]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/user/workers')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 dark:text-slate-300 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('workers.title')}</h1>
        </div>
        <Card>
          <CardBody>
            <div className="flex items-center justify-center h-56">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!worker) return null;

  const displayName = worker?.nameI18n?.[langKey] || worker.name;

  const handleLoginAsWorker = async () => {
    if (!worker?._id) return;
    setLoginLoading(true);
    const result = await loginAsWorker(worker._id);
    setLoginLoading(false);
    if (result?.success) {
      toast.success(t('workers.loginAsWorkerSuccess', { defaultValue: 'Logged in as worker' }));
      navigate('/worker/dashboard');
      return;
    }
    toast.error(result?.error || t('common.error', { defaultValue: 'Error' }));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/user/workers')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 dark:text-slate-300 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 truncate">{displayName}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1"><Phone className="w-4 h-4" />{worker.phone}</span>
              <span className="inline-flex items-center gap-1"><SARIcon className="w-4 h-4" />{worker.pendingAmount || 0}</span>
              <span className="inline-flex items-center gap-1">{t('workers.paymentType')}:</span>
              <span className="inline-flex items-center gap-1">
                {worker.paymentType === 'per_stitching' ? t('workers.perStitching') : t('workers.salary')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleLoginAsWorker}
            icon={LogIn}
            loading={loginLoading}
          >
            {t('workers.loginAsWorker', { defaultValue: 'Login as worker' })}
          </Button>
          <Button
            variant="secondary"
            onClick={() => (isDemo ? setDemoBlockedOpen(true) : navigate(`/user/workers/${worker._id}/edit`))}
            icon={Edit}
            disabled={isDemo}
          >
            {t('common.edit', { defaultValue: 'Edit' })}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/user/worker-amounts')}
            icon={ClipboardList}
          >
            {t('nav.workerAmounts', { defaultValue: 'Worker Amounts' })}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/10 flex items-center justify-center">
                  <span className="text-emerald-700 dark:text-emerald-200 font-bold text-xl">{(displayName || '')?.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{displayName}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{worker.phone}</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 bg-white/60 dark:bg-slate-900/30">
                  <div className="text-xs text-gray-500 dark:text-slate-400">{t('workers.pendingAmount')}</div>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1">{worker.pendingAmount || 0} <SARIcon className="w-4 h-4" /></div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 bg-white/60 dark:bg-slate-900/30">
                  <div className="text-xs text-gray-500 dark:text-slate-400">{t('workers.paymentAmount')}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1">{worker.paymentAmount || 0} <SARIcon className="w-4 h-4" /></div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 bg-white/60 dark:bg-slate-900/30">
                  <div className="text-xs text-gray-500 dark:text-slate-400">Total Orders</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{stats?.total || 0}</div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 bg-white/60 dark:bg-slate-900/30">
                  <div className="text-xs text-gray-500 dark:text-slate-400">Unique Customers</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{stats?.uniqueCustomers || 0}</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 bg-white/60 dark:bg-slate-900/30">
                  <div className="text-xs text-gray-500 dark:text-slate-400">{t('stitchings.statusAssigned', { defaultValue: 'Assigned' })}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{stats?.assigned || 0}</div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 bg-white/60 dark:bg-slate-900/30">
                  <div className="text-xs text-gray-500 dark:text-slate-400">{t('stitchings.statusInProgress', { defaultValue: 'In Progress' })}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{stats?.inProgress || 0}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 bg-white/60 dark:bg-slate-900/30">
                  <div className="text-xs text-gray-500 dark:text-slate-400">{t('stitchings.statusCompleted', { defaultValue: 'Completed' })}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{stats?.completed || 0}</div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 bg-white/60 dark:bg-slate-900/30">
                  <div className="text-xs text-gray-500 dark:text-slate-400">{t('stitchings.statusDelivered', { defaultValue: 'Delivered' })}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{stats?.delivered || 0}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardBody>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary-600" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Assigned Customers</h2>
              </div>

              {assignedCustomers.length > 0 ? (
                <div className="space-y-2">
                  {assignedCustomers.slice(0, 12).map((row) => (
                    <button
                      key={String(row.customer._id)}
                      type="button"
                      onClick={() => navigate(`/user/customers/${row.customer._id}`)}
                      className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="min-w-0 text-left">
                        <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                          {row.customer?.nameI18n?.[langKey] || row.customer?.name || '—'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{row.customer?.phone || ''}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200 whitespace-nowrap">
                        {row.count} active
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-slate-400">{t('common.noData')}</div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">{recentOrders.length} orders</p>
              </div>
            </div>
            <CardBody>
              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((o) => (
                    <button
                      key={o._id}
                      type="button"
                      onClick={() => navigate(`/user/stitchings/${o._id}/edit`)}
                      className="w-full text-left rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/30 dark:to-slate-900/10 hover:shadow-lg hover:scale-[1.01] transition-all p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                              {o.receiptNumber || o._id?.slice(-6)}
                            </span>
                            <StatusBadge status={o.status} />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              Customer: {o.customerId?.nameI18n?.[langKey] || o.customerId?.name || '-'}
                              {o.customerId?.phone ? ` • ${o.customerId.phone}` : ''}
                            </span>
                            {o.dueDate ? (
                              <span className="inline-flex items-center gap-1">Due: {new Date(o.dueDate).toLocaleDateString()}</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">View</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-slate-400">{t('common.noData')}</div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <DemoBlockedModal
        isOpen={demoBlockedOpen}
        onClose={() => setDemoBlockedOpen(false)}
        title={t('demo.title', { defaultValue: 'Demo Mode' })}
        phone="+966596775485"
      />
    </div>
  );
};

export default WorkerProfile;
