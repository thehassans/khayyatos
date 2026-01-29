import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { Users, UserPlus, Clock, CheckCircle, AlertCircle, Search, Plus, Calendar } from 'lucide-react';
import SARIcon from '../../components/ui/SARIcon';
import { Button } from '../../components/ui/Button';
import DemoBlockedModal from '../../components/ui/DemoBlockedModal';

const UserDashboard = () => {
  const { t, i18n } = useTranslation();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState('');
  const isRTL = ['ar', 'ur'].includes((i18n?.language || 'en').split('-')[0]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState({ orders: [], customers: [], workers: [] });
  const [workersCache, setWorkersCache] = useState(null);
  const searchWrapRef = useRef(null);
  const debounceRef = useRef(null);

  const isDemo = !!user?.isDemoSession;
  const [demoBlockedOpen, setDemoBlockedOpen] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/user/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
    setLoading(false);
  };

  const runGlobalSearch = async (q) => {
    setSearchLoading(true);
    try {
      const isPhone = /^\d{3,}$/.test(q);
      const [ordersRes, customersRes, workersRes] = await Promise.all([
        api.get('/stitchings/search', { params: isPhone ? { receipt: q, phone: q } : { receipt: q } }),
        api.get('/customers/search', { params: { q } }),
        workersCache ? Promise.resolve({ data: { workers: workersCache } }) : api.get('/worker')
      ]);

      const ordersRaw = ordersRes.data?.stitchings || [];
      const customersRaw = customersRes.data?.customers || [];

      const workersRaw = workersCache || workersRes.data?.workers || [];
      if (!workersCache) {
        setWorkersCache(workersRaw);
      }

      const qLower = q.toLowerCase();
      const workersFiltered = Array.isArray(workersRaw)
        ? workersRaw
            .filter((w) => {
              const name = (w.name || '').toLowerCase();
              const phone = String(w.phone || '');
              return name.includes(qLower) || phone.includes(q);
            })
            .slice(0, 6)
        : [];

      setSearchResults({
        orders: Array.isArray(ordersRaw) ? ordersRaw.slice(0, 6) : [],
        customers: Array.isArray(customersRaw) ? customersRaw.slice(0, 6) : [],
        workers: workersFiltered
      });
      setSearchOpen(true);
      setActiveIndex(-1);
    } catch (error) {
      console.error('Global search error:', error);
      setSearchResults({ orders: [], customers: [], workers: [] });
      setSearchOpen(true);
      setActiveIndex(-1);
    }
    setSearchLoading(false);
  };

  const navigateToResult = (result) => {
    if (!result) return;
    if (result.type === 'order') {
      navigate(`/user/stitchings/${result.item._id}/edit`);
      return;
    }
    if (result.type === 'customer') {
      navigate(`/user/customers/${result.item._id}/edit`);
      return;
    }
    if (result.type === 'worker') {
      navigate(`/user/workers/${result.item._id}/edit`);
    }
  };

  useEffect(() => {
    const q = orderSearch.trim();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (!q) {
      setSearchLoading(false);
      setSearchOpen(false);
      setSearchResults({ orders: [], customers: [], workers: [] });
      setActiveIndex(-1);
      return;
    }
    debounceRef.current = setTimeout(() => {
      runGlobalSearch(q);
    }, 220);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [orderSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target)) {
        setSearchOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div ref={searchWrapRef} className="relative w-full lg:max-w-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = orderSearch.trim();
              const flat = [
                ...searchResults.orders.map((item) => ({ type: 'order', item })),
                ...searchResults.customers.map((item) => ({ type: 'customer', item })),
                ...searchResults.workers.map((item) => ({ type: 'worker', item }))
              ];

              if (activeIndex >= 0 && flat[activeIndex]) {
                navigateToResult(flat[activeIndex]);
                setSearchOpen(false);
                return;
              }

              if (!q) {
                navigate('/user/stitchings');
                return;
              }

              navigate(`/user/stitchings?search=${encodeURIComponent(q)}`);
            }}
            className="relative w-full"
          >
            <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-400`} />
            {searchLoading && (
              <div className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400`}>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              onFocus={() => {
                const q = orderSearch.trim();
                if (q) setSearchOpen(true);
              }}
              onKeyDown={(e) => {
                const flat = [
                  ...searchResults.orders.map((item) => ({ type: 'order', item })),
                  ...searchResults.customers.map((item) => ({ type: 'customer', item })),
                  ...searchResults.workers.map((item) => ({ type: 'worker', item }))
                ];
                if (e.key === 'Escape') {
                  setSearchOpen(false);
                  setActiveIndex(-1);
                  return;
                }
                if (e.key === 'ArrowDown') {
                  if (!flat.length) return;
                  e.preventDefault();
                  setSearchOpen(true);
                  setActiveIndex((prev) => {
                    const next = prev + 1;
                    return next >= flat.length ? 0 : next;
                  });
                  return;
                }
                if (e.key === 'ArrowUp') {
                  if (!flat.length) return;
                  e.preventDefault();
                  setSearchOpen(true);
                  setActiveIndex((prev) => {
                    const next = prev - 1;
                    return next < 0 ? flat.length - 1 : next;
                  });
                  return;
                }
                if (e.key === 'Enter') {
                  if (activeIndex >= 0 && flat[activeIndex]) {
                    e.preventDefault();
                    navigateToResult(flat[activeIndex]);
                    setSearchOpen(false);
                  }
                }
              }}
              placeholder={`${t('common.search')}...`}
              className={`w-full ${isRTL ? 'pr-11 pl-12' : 'pl-11 pr-12'} py-3 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-gray-200/70 dark:border-slate-700/70 rounded-2xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 shadow-soft focus:ring-2 focus:ring-primary-500`}
            />
          </form>

          {searchOpen && (
            <div className="absolute z-40 mt-2 w-full rounded-2xl border border-gray-200/70 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-soft overflow-hidden">
              <div className="p-2">
                {(() => {
                  let cursor = -1;
                  const sections = [
                    { key: 'orders', title: t('stitchings.title'), type: 'order', items: searchResults.orders },
                    { key: 'customers', title: t('customers.title'), type: 'customer', items: searchResults.customers },
                    { key: 'workers', title: t('workers.title'), type: 'worker', items: searchResults.workers }
                  ];
                  const hasAny = sections.some((s) => (s.items || []).length > 0);

                  if (!hasAny && !searchLoading) {
                    return (
                      <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-slate-400">
                        {t('common.noData')}
                      </div>
                    );
                  }

                  return sections
                    .filter((s) => (s.items || []).length > 0)
                    .map((section) => (
                      <div key={section.key} className="mb-2 last:mb-0">
                        <div className="px-3 py-2 text-[11px] font-semibold tracking-wide text-gray-400 dark:text-slate-500 uppercase">
                          {section.title}
                        </div>
                        <div className="space-y-1">
                          {section.items.map((item) => {
                            cursor += 1;
                            const idx = cursor;
                            const isActive = idx === activeIndex;

                            const primary =
                              section.type === 'order'
                                ? `#${item.receiptNumber || ''}`
                                : item.name || '';
                            const secondary =
                              section.type === 'order'
                                ? `${item.customerId?.name || '-'}${item.customerId?.phone ? ` • ${item.customerId.phone}` : ''}`
                                : String(item.phone || '');

                            return (
                              <button
                                key={item._id}
                                type="button"
                                onMouseEnter={() => setActiveIndex(idx)}
                                onClick={() => {
                                  navigateToResult({ type: section.type, item });
                                  setSearchOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                                  isActive
                                    ? 'bg-primary-50 dark:bg-primary-900/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                                      {primary || '-'}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{secondary || ''}</div>
                                  </div>
                                  <div className="text-[11px] font-semibold text-gray-400 dark:text-slate-500">
                                    {section.type === 'order'
                                      ? t('stitchings.title')
                                      : section.type === 'customer'
                                      ? t('customers.title')
                                      : t('workers.title')}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ));
                })()}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button
            onClick={() => (isDemo ? setDemoBlockedOpen(true) : navigate('/user/stitchings/new'))}
            icon={Plus}
            variant="success"
            className="rounded-2xl px-5 py-3"
            disabled={isDemo}
          >
            {t('stitchings.createOrder')}
          </Button>
          <Button
            variant="outline"
            onClick={() => (isDemo ? setDemoBlockedOpen(true) : navigate('/user/customers/new'))}
            icon={UserPlus}
            className="rounded-2xl px-5 py-3"
            disabled={isDemo}
          >
            {t('customers.createCustomer')}
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('dashboard.title')}</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">{t('common.welcome')}</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-emerald-900/10 dark:border-emerald-400/10 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 shadow-soft">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-28 -left-28 w-96 h-96 rounded-full bg-black/10 blur-3xl" />
        </div>
        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-white/70">{t('dashboard.todaysSummary')}</p>
                <p className="text-sm sm:text-base font-semibold text-white">
                  {new Intl.DateTimeFormat(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div>
                <p className="text-[11px] font-medium text-white/60">{t('dashboard.pendingOrders')}</p>
                <p className="mt-1 text-lg sm:text-xl font-bold text-white">{data?.stats?.pendingStitchings || 0}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-white/60">{t('dashboard.totalRevenue')}</p>
                <p className="mt-1 text-lg sm:text-xl font-bold text-white flex items-center gap-1">
                  {data?.stats?.totalRevenue?.toLocaleString() || 0}
                  <SARIcon className="w-4 h-4" color="white" />
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-white/60">{t('dashboard.pendingPayments')}</p>
                <p className="mt-1 text-lg sm:text-xl font-bold text-white flex items-center gap-1">
                  {data?.stats?.pendingPayments?.toLocaleString() || 0}
                  <SARIcon className="w-4 h-4" color="white" />
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-white/60">{t('dashboard.totalCustomers')}</p>
                <p className="mt-1 text-lg sm:text-xl font-bold text-white">{data?.stats?.customersCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Alert */}
      {data?.subscription?.daysRemaining <= 7 && data?.subscription?.type !== 'lifetime' && (
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-300" />
          <p className="text-amber-800 dark:text-amber-200">
            {t('dashboard.subscriptionStatus')}: {data.subscription.daysRemaining} {t('dashboard.daysRemaining')}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label={t('dashboard.totalWorkers')}
          value={data?.stats?.workersCount || 0}
          color="primary"
        />
        <StatCard
          icon={UserPlus}
          label={t('dashboard.totalCustomers')}
          value={data?.stats?.customersCount || 0}
          color="emerald"
        />
        <StatCard
          icon={Clock}
          label={t('dashboard.pendingOrders')}
          value={data?.stats?.pendingStitchings || 0}
          color="amber"
        />
        <StatCard
          icon={() => <SARIcon className="w-6 h-6" />}
          label={t('dashboard.totalRevenue')}
          value={<span className="flex items-center gap-1">{data?.stats?.totalRevenue?.toLocaleString() || 0} <SARIcon className="w-5 h-5" /></span>}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">{t('dashboard.inProgress')}</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">{data?.stats?.inProgressStitchings || 0}</p>
            </div>
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">{t('common.completed')}</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{data?.stats?.completedStitchings || 0}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">{t('common.pending')} Payments</p>
              <p className="text-3xl font-bold text-amber-600 mt-1 flex items-center gap-1">{data?.stats?.pendingPayments?.toLocaleString() || 0} <SARIcon className="w-6 h-6" /></p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <SARIcon className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">{t('dashboard.upcomingDue', { defaultValue: 'Upcoming Due Dates' })}</h2>
            <button
              type="button"
              onClick={() => navigate('/user/stitchings')}
              className="text-sm font-medium text-primary-600 dark:text-primary-300 hover:underline"
            >
              {t('common.view', { defaultValue: 'View' })}
            </button>
          </div>
          {(data?.upcomingDueStitchings || []).length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {(data.upcomingDueStitchings || []).slice(0, 8).map((stitch) => {
                const due = stitch?.dueDate ? new Date(stitch.dueDate) : null;
                const today = new Date();
                const dueMid = due ? new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() : null;
                const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
                const diffDays = dueMid === null ? null : Math.round((dueMid - todayMid) / (1000 * 60 * 60 * 24));
                const isOverdue = typeof diffDays === 'number' && diffDays < 0;

                return (
                  <button
                    key={stitch._id}
                    type="button"
                    onClick={() => navigate(`/user/stitchings/${stitch._id}/edit`)}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">#{stitch.receiptNumber || ''}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
                          {stitch.customerId?.name || '-'}
                          {stitch.customerId?.phone ? ` • ${stitch.customerId.phone}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-slate-100'}`}>
                            {due ? due.toLocaleDateString() : '-'}
                          </div>
                          {typeof diffDays === 'number' ? (
                            <div className={`text-[11px] font-medium ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500 dark:text-slate-400'}`}>
                              {isOverdue
                                ? t('dashboard.overdueByDays', { defaultValue: 'Overdue by {{count}}d', count: Math.abs(diffDays) })
                                : t('dashboard.dueInDays', { defaultValue: 'Due in {{count}}d', count: diffDays })}
                            </div>
                          ) : null}
                        </div>
                        <StatusBadge status={stitch.status} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-slate-400">{t('common.noData')}</div>
          )}
        </Card>

        {/* Recent Orders */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">{t('dashboard.recentOrders')}</h2>
          </div>
          {data?.recentStitchings?.length > 0 ? (
            <Table>
              <Thead>
                <Tr>
                  <Th>{t('stitchings.receiptNumber')}</Th>
                  <Th>{t('stitchings.customer')}</Th>
                  <Th>{t('stitchings.worker')}</Th>
                  <Th>{t('common.status')}</Th>
                  <Th>{t('stitchings.price')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.recentStitchings.map((stitch) => (
                  <Tr key={stitch._id} onClick={() => navigate(`/user/stitchings/${stitch._id}/edit`)}>
                    <Td className="font-medium">{stitch.receiptNumber}</Td>
                    <Td>{stitch.customerId?.name || '-'}</Td>
                    <Td>{stitch.workerId?.name || '-'}</Td>
                    <Td><StatusBadge status={stitch.status} /></Td>
                    <Td className="flex items-center gap-1">{stitch.price} <SARIcon className="w-3 h-3" /></Td>
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

      <DemoBlockedModal
        isOpen={demoBlockedOpen}
        onClose={() => setDemoBlockedOpen(false)}
        title={t('demo.title', { defaultValue: 'Demo Mode' })}
        phone="+966596775485"
      />
    </div>
  );
};

export default UserDashboard;
