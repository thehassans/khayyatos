import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import DemoBlockedModal from '../../components/ui/DemoBlockedModal';
import SARIcon from '../../components/ui/SARIcon';
import { ArrowLeft, Users, Phone, Plus, Edit, Receipt, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerProfile = () => {
  const { t, i18n } = useTranslation();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const langKey = (i18n?.language || 'en').split('-')[0];

  const isDemo = !!user?.isDemoSession;
  const [demoBlockedOpen, setDemoBlockedOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [stitchings, setStitchings] = useState([]);

  useEffect(() => {
    fetchCustomerProfile();
  }, [id]);

  const fetchCustomerProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/customers/${id}`);
      setCustomer(response.data?.customer || null);
      setStitchings(Array.isArray(response.data?.stitchings) ? response.data.stitchings : []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load customer');
      navigate('/user/customers');
    }
    setLoading(false);
  };

  const relationLabel = (type) => {
    const map = {
      father: 'Father / الأب',
      son: 'Son / الابن',
      brother: 'Brother / الأخ',
      uncle: 'Uncle / العم',
      cousin: 'Cousin / ابن العم',
      friend: 'Friend / صديق',
      other: 'Other / آخر'
    };
    return map[type] || type;
  };

  const sortedOrders = useMemo(() => {
    return (stitchings || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
  }, [stitchings]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/user/customers')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 dark:text-slate-300 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('customers.title')}</h1>
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

  if (!customer) return null;

  const displayName = customer?.nameI18n?.[langKey] || customer.name;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => navigate('/user/customers')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 dark:text-slate-300 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 truncate">{displayName}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1"><Phone className="w-4 h-4" />{customer.phone}</span>
              <span className="inline-flex items-center gap-1"><Receipt className="w-4 h-4" />{customer.totalOrders || 0} {t('customers.totalOrders')}</span>
              <span className="inline-flex items-center gap-1"><SARIcon className="w-4 h-4" />{customer.totalSpent || 0}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="success"
            onClick={() => (isDemo ? setDemoBlockedOpen(true) : navigate(`/user/stitchings/new?customerId=${customer._id}`))}
            icon={Plus}
            disabled={isDemo}
          >
            {t('stitchings.createOrder')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => (isDemo ? setDemoBlockedOpen(true) : navigate(`/user/customers/${customer._id}/edit`))}
            icon={Edit}
            disabled={isDemo}
          >
            {t('common.edit', { defaultValue: 'Edit' })}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-900/10 flex items-center justify-center">
                  <span className="text-primary-700 dark:text-primary-200 font-bold text-xl">{(displayName || '')?.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{displayName}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{customer.phone}</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 bg-white/60 dark:bg-slate-900/30">
                  <div className="text-xs text-gray-500 dark:text-slate-400">{t('customers.totalOrders')}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-slate-100">{customer.totalOrders || 0}</div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 bg-white/60 dark:bg-slate-900/30">
                  <div className="text-xs text-gray-500 dark:text-slate-400">{t('customers.totalSpent')}</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1">{customer.totalSpent || 0} <SARIcon className="w-4 h-4" /></div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardBody>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary-600" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Family Relations / العلاقات العائلية</h2>
              </div>

              {(customer.relations || []).length > 0 ? (
                <div className="space-y-2">
                  {customer.relations.map((rel) => (
                    <button
                      key={String(rel.customerId?._id || rel.customerId)}
                      type="button"
                      onClick={() => navigate(`/user/customers/${rel.customerId?._id || rel.customerId}`)}
                      className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="min-w-0 text-left">
                        <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{rel.customerId?.nameI18n?.[langKey] || rel.customerId?.name || rel.customerName || '—'}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{rel.customerId?.phone || rel.customerPhone || ''}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200 whitespace-nowrap">
                        {relationLabel(rel.relationType)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-slate-400">No relations</div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('customers.orderHistory')}</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">{sortedOrders.length} orders</p>
              </div>
            </div>
            <CardBody>
              {sortedOrders.length > 0 ? (
                <div className="space-y-3">
                  {sortedOrders.map((o) => (
                    <button
                      key={o._id}
                      type="button"
                      onClick={() => navigate(`/user/stitchings/${o._id}/edit`)}
                      className="w-full text-left rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/30 dark:to-slate-900/10 hover:shadow-lg hover:scale-[1.01] transition-all p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{o.receiptNumber || o._id?.slice(-6)}</span>
                            <StatusBadge status={o.status} />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4" />{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</span>
                            <span className="inline-flex items-center gap-1"><SARIcon className="w-4 h-4" />{o.price || 0}</span>
                            <span className="inline-flex items-center gap-1">Paid: {o.paidAmount || 0}</span>
                            {o.workerId?.name ? <span className="inline-flex items-center gap-1">Worker: {o.workerId?.nameI18n?.[langKey] || o.workerId.name}</span> : null}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">Edit</div>
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

export default CustomerProfile;
