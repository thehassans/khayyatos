import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import DemoBlockedModal from '../../components/ui/DemoBlockedModal';
import SARIcon from '../../components/ui/SARIcon';
import { ArrowLeft, Users, Phone, Plus, Edit, Receipt, Calendar, Search, UserPlus, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const RELATION_TYPES = [
  { value: 'father', label: 'Father / الأب' },
  { value: 'son', label: 'Son / الابن' },
  { value: 'brother', label: 'Brother / الأخ' },
  { value: 'uncle', label: 'Uncle / العم' },
  { value: 'cousin', label: 'Cousin / ابن العم' },
  { value: 'friend', label: 'Friend / صديق' },
  { value: 'other', label: 'Other / آخر' }
];

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

  const [addFamilyOpen, setAddFamilyOpen] = useState(false);
  const [addFamilyType, setAddFamilyType] = useState('son');
  const [familyQuery, setFamilyQuery] = useState('');
  const [familySearching, setFamilySearching] = useState(false);
  const [familyResults, setFamilyResults] = useState([]);
  const [familySelected, setFamilySelected] = useState(null);
  const [familySaving, setFamilySaving] = useState(false);

  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);

  const treeScrollRef = useRef(null);
  const treeDidCenterRef = useRef(false);

  useEffect(() => {
    fetchCustomerProfile();
  }, [id]);

  useEffect(() => {
    treeDidCenterRef.current = false;
  }, [id]);

  useEffect(() => {
    setOrderHistoryOpen(false);
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

  const relationKey = (rel) => {
    const id = rel?.customerId?._id || rel?.customerId;
    return String(id || rel?.customerPhone || rel?.customerName || Math.random());
  };

  const relationTargetId = (rel) => rel?.customerId?._id || rel?.customerId;

  const formatBilingualName = (en, ar, fallback = '—') => {
    const cleanEn = typeof en === 'string' ? en.trim() : '';
    const cleanAr = typeof ar === 'string' ? ar.trim() : '';
    if (cleanEn && cleanAr && cleanEn !== cleanAr) return `${cleanEn} / ${cleanAr}`;
    return cleanEn || cleanAr || fallback;
  };

  const customerNameParts = (c, fallback) => {
    if (!c || typeof c !== 'object') {
      const fb = fallback || '—';
      return { en: fb, ar: '', full: fb };
    }

    const en = c?.nameI18n?.en || c?.nameI18n?.['en'] || '';
    const ar = c?.nameI18n?.ar || c?.nameI18n?.['ar'] || '';
    const fb = fallback || c?.name || '—';
    return { en: en || fb, ar: ar || '', full: formatBilingualName(en || fb, ar || '', fb) };
  };

  const relationNameParts = (rel) => {
    const ref = rel?.customerId;
    if (ref && typeof ref === 'object') return customerNameParts(ref, rel?.customerName || '—');
    const fb = rel?.customerName || '—';
    return { en: fb, ar: '', full: fb };
  };

  const relationDisplayName = (rel) => relationNameParts(rel).full;

  const relationDisplayPhone = (rel) => rel?.customerId?.phone || rel?.customerPhone || '';

  const normalizeRelation = (rel) => {
    const rid = relationTargetId(rel);
    const fallbackName = rel?.customerId?.nameI18n?.[langKey] || rel?.customerId?.name || rel?.customerName || '';
    const fallbackPhone = rel?.customerId?.phone || rel?.customerPhone || '';
    return {
      customerId: rid,
      customerName: fallbackName,
      customerPhone: fallbackPhone,
      relationType: rel?.relationType
    };
  };

  const relationsSorted = useMemo(() => {
    const order = {
      father: 0,
      son: 1,
      brother: 2,
      uncle: 3,
      cousin: 4,
      friend: 5,
      other: 6
    };
    return (customer?.relations || [])
      .slice()
      .sort((a, b) => (order[a?.relationType] ?? 99) - (order[b?.relationType] ?? 99));
  }, [customer?.relations]);

  const familyTree = useMemo(() => {
    const all = relationsSorted || [];
    const father = all.find((r) => r?.relationType === 'father') || null;
    const sons = all.filter((r) => r?.relationType === 'son');
    const siblings = all.filter((r) => r?.relationType === 'brother');
    const others = all.filter((r) => !['father', 'son', 'brother'].includes(r?.relationType));
    return { father, sons, siblings, others };
  }, [relationsSorted]);

  const sortedOrders = useMemo(() => {
    return (stitchings || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
  }, [stitchings]);

  useEffect(() => {
    if (!addFamilyOpen) return;

    const q = String(familyQuery || '').trim();
    setFamilySelected(null);

    if (!q) {
      setFamilyResults([]);
      setFamilySearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setFamilySearching(true);
        const resp = await api.get(`/customers/search?q=${encodeURIComponent(q)}`);
        const list = Array.isArray(resp.data?.customers) ? resp.data.customers : [];
        const existingIds = new Set((customer?.relations || []).map((r) => String(relationTargetId(r))));
        const filtered = list.filter((c) => String(c?._id) !== String(customer?._id) && !existingIds.has(String(c?._id)));
        setFamilyResults(filtered);
      } catch (e) {
        setFamilyResults([]);
      }
      setFamilySearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [addFamilyOpen, api, customer?._id, customer?.relations, familyQuery]);

  useEffect(() => {
    const el = treeScrollRef.current;
    if (!el || treeDidCenterRef.current) return;
    const timer = setTimeout(() => {
      const target = Math.max(0, Math.floor((el.scrollWidth - el.clientWidth) / 2));
      el.scrollLeft = target;
      treeDidCenterRef.current = true;
    }, 80);
    return () => clearTimeout(timer);
  }, [customer?._id, customer?.relations?.length]);

  const openAddFamily = (prefillType = 'son') => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setAddFamilyType(prefillType);
    setFamilyQuery('');
    setFamilyResults([]);
    setFamilySelected(null);
    setAddFamilyOpen(true);
  };

  const saveFamilyMember = async () => {
    if (!familySelected?._id || !addFamilyType) {
      toast.error('Select a customer');
      return;
    }
    if (familySaving) return;

    try {
      setFamilySaving(true);
      const next = (customer?.relations || []).map(normalizeRelation);
      next.push({
        customerId: familySelected._id,
        customerName: familySelected.nameI18n?.[langKey] || familySelected.name || '',
        customerPhone: familySelected.phone || '',
        relationType: addFamilyType
      });

      await api.put(`/customers/${customer._id}`, { relations: next });
      toast.success('Family member added');
      setAddFamilyOpen(false);
      await fetchCustomerProfile();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Operation failed');
    }
    setFamilySaving(false);
  };

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

  const FamilyNode = ({ nameParts, subtitle, tone = 'gold', dashed = false, onClick, icon }) => {
    const glow = {
      gold: 'from-[#D5B25B]/35 via-amber-200/15 to-white/0 dark:from-[#D5B25B]/20 dark:via-amber-300/10 dark:to-transparent',
      slate: 'from-slate-300/35 via-slate-200/15 to-white/0 dark:from-slate-500/20 dark:via-slate-400/10 dark:to-transparent',
      blue: 'from-sky-300/35 via-sky-200/15 to-white/0 dark:from-sky-700/25 dark:via-sky-600/10 dark:to-transparent',
      green: 'from-emerald-300/35 via-emerald-200/15 to-white/0 dark:from-emerald-700/25 dark:via-emerald-600/10 dark:to-transparent'
    }[tone] || 'from-[#D5B25B]/35 via-amber-200/15 to-white/0';

    const borderGrad = {
      gold: 'from-[#D5B25B]/70 via-amber-200/60 to-slate-200/40 dark:from-[#D5B25B]/55 dark:via-amber-700/20 dark:to-slate-700/60',
      slate: 'from-slate-300/80 via-slate-200/60 to-slate-200/30 dark:from-slate-500/45 dark:via-slate-500/15 dark:to-slate-700/60',
      blue: 'from-sky-400/70 via-sky-200/60 to-slate-200/30 dark:from-sky-600/45 dark:via-sky-700/20 dark:to-slate-700/60',
      green: 'from-emerald-400/70 via-emerald-200/60 to-slate-200/30 dark:from-emerald-600/45 dark:via-emerald-700/20 dark:to-slate-700/60'
    }[tone] || 'from-[#D5B25B]/70 via-amber-200/60 to-slate-200/40';

    const inner = dashed
      ? 'border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/25'
      : 'border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/35';

    return (
      <button
        type="button"
        onClick={onClick}
        className="group relative w-[240px] max-w-[82vw] rounded-2xl transition-transform hover:scale-[1.01]"
      >
        <div className={`pointer-events-none absolute -inset-1 rounded-[18px] bg-gradient-to-br ${glow} blur-md opacity-60 group-hover:opacity-90 transition-opacity`} />
        <div className={`relative rounded-2xl p-[1px] bg-gradient-to-br ${borderGrad} shadow-[0_10px_30px_rgba(15,23,42,0.08)] group-hover:shadow-[0_16px_40px_rgba(15,23,42,0.14)] transition-shadow`}>
          <div className={`rounded-2xl ${inner} px-4 py-3`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-gray-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-slate-100 font-semibold">
                {icon ? icon : <span className="text-base">{(nameParts?.en || nameParts?.ar || '—').charAt(0)}</span>}
              </div>
              <div className="min-w-0 text-left">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{nameParts?.en || nameParts?.ar || '—'}</div>
                {nameParts?.ar ? <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate" dir="rtl">{nameParts.ar}</div> : null}
                {subtitle ? <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</div> : null}
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  };

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
        </div>

        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('customers.orderHistory')}</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">{sortedOrders.length} orders</p>
              </div>
              <button
                type="button"
                onClick={() => setOrderHistoryOpen((p) => !p)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 hover:bg-gray-50 dark:hover:bg-slate-900/40 text-sm text-slate-700 dark:text-slate-200"
              >
                <span>{orderHistoryOpen ? t('common.close', { defaultValue: 'Close' }) : t('common.view', { defaultValue: 'View' })}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${orderHistoryOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {orderHistoryOpen ? (
              <CardBody>
                {sortedOrders.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-slate-800">
                    {sortedOrders.map((o) => (
                      <button
                        key={o._id}
                        type="button"
                        onClick={() => navigate(`/user/stitchings/${o._id}/edit`)}
                        className="w-full text-left py-4 px-2 rounded-xl hover:bg-[#D5B25B]/5 dark:hover:bg-[#D5B25B]/10 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{o.receiptNumber || o._id?.slice(-6)}</span>
                              <StatusBadge status={o.status} />
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                              <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4" />{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</span>
                              <span className="inline-flex items-center gap-1"><SARIcon className="w-4 h-4" />{o.price || 0}</span>
                              <span className="inline-flex items-center gap-1">Paid: {o.paidAmount || 0}</span>
                              {o.workerId?.name ? <span className="inline-flex items-center gap-1">Worker: {o.workerId?.nameI18n?.[langKey] || o.workerId.name}</span> : null}
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">Open</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-slate-400">{t('common.noData')}</div>
                )}
              </CardBody>
            ) : null}
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <CardBody>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#D5B25B]" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Family Tree / شجرة العائلة</h2>
              </div>

              <div ref={treeScrollRef} className="relative rounded-3xl border border-gray-200 dark:border-slate-700 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-amber-50/40 to-gray-50 dark:from-slate-900/35 dark:via-[#D5B25B]/5 dark:to-slate-900/10 p-4 overflow-x-auto">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white via-white/70 to-transparent dark:from-slate-950/30 dark:via-slate-950/10 dark:to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white via-white/70 to-transparent dark:from-slate-950/30 dark:via-slate-950/10 dark:to-transparent" />

                <div className="min-w-full w-max flex flex-col items-center py-6 px-10">
                  <div className="relative flex flex-col items-center">
                    {familyTree.father ? (
                      <FamilyNode
                        nameParts={relationNameParts(familyTree.father)}
                        subtitle={relationLabel('father')}
                        tone="blue"
                        onClick={() => navigate(`/user/customers/${relationTargetId(familyTree.father)}`)}
                      />
                    ) : (
                      <FamilyNode
                        nameParts={{ en: 'Add Father', ar: 'إضافة الأب' }}
                        subtitle={relationLabel('father')}
                        dashed
                        tone="blue"
                        icon={<UserPlus className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
                        onClick={() => openAddFamily('father')}
                      />
                    )}

                    <div className="h-10 w-px bg-gradient-to-b from-[#D5B25B]/30 via-[#D5B25B]/20 to-transparent" />

                    <FamilyNode
                      nameParts={customerNameParts(customer, displayName)}
                      subtitle="Customer / العميل"
                      tone="gold"
                      onClick={() => {}}
                    />
                  </div>

                  <div className="relative mt-10 w-full">
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 h-9 w-px bg-gradient-to-b from-[#D5B25B]/30 via-[#D5B25B]/20 to-transparent" />
                    <div className="absolute left-8 right-8 top-9 h-px bg-gradient-to-r from-transparent via-[#D5B25B]/30 to-transparent" />

                    <div className="pt-12 flex flex-nowrap justify-center gap-x-12 gap-y-8 px-8 w-max mx-auto">
                      {(familyTree.sons || []).map((rel) => (
                        <div key={relationKey(rel)} className="relative">
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-12 w-px bg-gradient-to-b from-transparent via-[#D5B25B]/25 to-[#D5B25B]/10" />
                          <FamilyNode
                            nameParts={relationNameParts(rel)}
                            subtitle={relationLabel('son')}
                            tone="green"
                            onClick={() => navigate(`/user/customers/${relationTargetId(rel)}`)}
                          />
                        </div>
                      ))}

                      <div className="relative">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-12 w-px bg-gradient-to-b from-transparent via-[#D5B25B]/25 to-[#D5B25B]/10" />
                        <FamilyNode
                          nameParts={{ en: 'Add Member', ar: 'إضافة فرد' }}
                          subtitle="Add family member"
                          dashed
                          tone="gold"
                          icon={<UserPlus className="w-5 h-5 text-[#7E6426]" />}
                          onClick={() => openAddFamily('son')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 w-full">
                    {familyTree.siblings.length > 0 ? (
                      <>
                        <div className="text-[11px] tracking-widest uppercase text-slate-500 dark:text-slate-400">Brothers / الإخوان</div>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {familyTree.siblings.map((rel) => (
                            <button
                              key={relationKey(rel)}
                              type="button"
                              onClick={() => navigate(`/user/customers/${relationTargetId(rel)}`)}
                              className="group inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/35 px-3 py-2 hover:shadow-[0_10px_20px_rgba(15,23,42,0.10)] transition-all"
                            >
                              <span className="w-7 h-7 rounded-full ring-2 ring-slate-300/70 dark:ring-slate-600/60 bg-gradient-to-br from-white to-gray-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {(relationDisplayName(rel) || '—').charAt(0)}
                              </span>
                              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 max-w-[180px] truncate">{relationDisplayName(rel)}</span>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => openAddFamily('brother')}
                            className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 dark:border-slate-700 bg-white/40 dark:bg-slate-900/20 px-3 py-2 hover:shadow-md transition-all"
                          >
                            <span className="w-7 h-7 rounded-full ring-2 ring-[#D5B25B]/60 bg-[#D5B25B]/10 flex items-center justify-center">
                              <Plus className="w-4 h-4 text-[#7E6426]" />
                            </span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Add</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => openAddFamily('brother')}
                          className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 dark:border-slate-700 bg-white/40 dark:bg-slate-900/20 px-3 py-2 hover:shadow-md transition-all"
                        >
                          <span className="w-7 h-7 rounded-full ring-2 ring-[#D5B25B]/60 bg-[#D5B25B]/10 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-[#7E6426]" />
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Add brother</span>
                        </button>
                      </div>
                    )}

                    {familyTree.others.length > 0 ? (
                      <>
                        <div className="text-[11px] tracking-widest uppercase text-slate-500 dark:text-slate-400 mt-7">Other Relations</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {familyTree.others.map((rel) => (
                            <button
                              key={relationKey(rel)}
                              type="button"
                              onClick={() => navigate(`/user/customers/${relationTargetId(rel)}`)}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/35 px-3 py-2 hover:shadow-[0_10px_20px_rgba(15,23,42,0.10)] transition-all"
                            >
                              <span className="w-7 h-7 rounded-full ring-2 ring-[#D5B25B]/60 bg-gradient-to-br from-white to-gray-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {(relationDisplayName(rel) || '—').charAt(0)}
                              </span>
                              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 max-w-[160px] truncate">{relationDisplayName(rel)}</span>
                              <span className="text-[10px] px-2 py-1 rounded-full bg-[#D5B25B]/10 text-[#7E6426] border border-[#D5B25B]/20 whitespace-nowrap">
                                {relationLabel(rel.relationType)}
                              </span>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => openAddFamily('other')}
                            className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 dark:border-slate-700 bg-white/40 dark:bg-slate-900/20 px-3 py-2 hover:shadow-md transition-all"
                          >
                            <span className="w-7 h-7 rounded-full ring-2 ring-[#D5B25B]/60 bg-[#D5B25B]/10 flex items-center justify-center">
                              <Plus className="w-4 h-4 text-[#7E6426]" />
                            </span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Add</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="mt-7 flex justify-center">
                        <button
                          type="button"
                          onClick={() => openAddFamily('other')}
                          className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 dark:border-slate-700 bg-white/40 dark:bg-slate-900/20 px-3 py-2 hover:shadow-md transition-all"
                        >
                          <span className="w-7 h-7 rounded-full ring-2 ring-[#D5B25B]/60 bg-[#D5B25B]/10 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-[#7E6426]" />
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Add relation</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={addFamilyOpen}
        onClose={() => setAddFamilyOpen(false)}
        title="Add Family Member"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Relation type</div>
              <select
                value={addFamilyType}
                onChange={(e) => setAddFamilyType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D5B25B]/40"
              >
                {RELATION_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value}>{rt.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Search customer</div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={familyQuery}
                  onChange={(e) => setFamilyQuery(e.target.value)}
                  placeholder="Search by name or phone"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D5B25B]/40"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-white dark:bg-slate-900/40 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Results</div>
              {familySearching ? <div className="text-xs text-slate-400">Searching…</div> : null}
            </div>
            <div className="max-h-64 overflow-y-auto bg-gray-50/40 dark:bg-slate-900/20">
              {(familyQuery && !familySearching && familyResults.length === 0) ? (
                <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">No matches</div>
              ) : null}
              {familyResults.map((c) => {
                const np = customerNameParts(c, c?.name || '—');
                const active = String(familySelected?._id) === String(c?._id);
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => setFamilySelected(c)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-white dark:hover:bg-slate-900/40 transition-colors ${active ? 'bg-white dark:bg-slate-900/50' : ''}`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{np.en || np.ar || '—'}</div>
                      {np.ar ? <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate" dir="rtl">{np.ar}</div> : null}
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.phone || ''}</div>
                    </div>
                    <div className={`w-9 h-9 rounded-full ring-2 ${active ? 'ring-[#D5B25B]/80' : 'ring-slate-300/70 dark:ring-slate-700/60'} bg-gradient-to-br from-white to-gray-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-sm font-semibold text-slate-900 dark:text-slate-100`}>
                      {(np.en || np.ar || '—').charAt(0)}
                    </div>
                  </button>
                );
              })}
              {!familyQuery ? (
                <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">Type to search customers</div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddFamilyOpen(false)}>
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              onClick={saveFamilyMember}
              loading={familySaving}
              disabled={!familySelected || familySaving}
              icon={UserPlus}
            >
              Add
            </Button>
          </div>
        </div>
      </Modal>

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
