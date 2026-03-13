import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Plus, X, Check, ChevronDown, ChevronUp, Package, Store } from 'lucide-react';
import SARIcon from '../../components/ui/SARIcon';
import toast from 'react-hot-toast';

// ─── tiny field ───────────────────────────────────────────────────────────────
const Field = ({ label, ...props }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">{label}</label>
    <input
      {...props}
      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
    />
  </div>
);

// ─── status pill ──────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  assigned:    'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  completed:   'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};
const StatusPill = ({ status }) => (
  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.assigned}`}>
    {status === 'in_progress' ? 'In Progress' : status === 'completed' ? 'Done' : 'Assigned'}
  </span>
);

const summarizeShopAssignments = (items = []) => items.reduce((acc, item) => {
  acc.totalPieces += Number(item?.pieces) || 0;
  acc.amountReceived += Number(item?.amountReceived) || 0;
  acc.pendingAmount += Number(item?.pendingAmount) || 0;
  return acc;
}, {
  totalPieces: 0,
  amountReceived: 0,
  pendingAmount: 0
});

const getErrorMessage = (error, fallback) => {
  if (error?.response?.status === 429) {
    return 'Too many requests right now. Please wait a few seconds and try again.';
  }
  return error?.response?.data?.error || fallback;
};

// ─── main component ───────────────────────────────────────────────────────────
const FinisherShops = () => {
  const { t } = useTranslation();
  const { api } = useAuth();

  const [loading, setLoading]       = useState(true);
  const [shops, setShops]           = useState([]);
  const [assignments, setAssignments] = useState([]);

  // create shop
  const [createOpen, setCreateOpen]   = useState(false);
  const [shopForm, setShopForm]       = useState({ shopName: '', ownerName: '', phone: '', perPieceFinishing: '' });
  const [shopLoading, setShopLoading] = useState(false);

  // assign pieces (inline per shop)
  const [assignShopId, setAssignShopId]   = useState(null);
  const [assignForm, setAssignForm]       = useState({ description: '', pieces: '', ratePerPiece: '', amountReceived: '' });
  const [assignLoading, setAssignLoading] = useState(false);

  // quick assign for new customer/shop
  const [quickAssignOpen, setQuickAssignOpen] = useState(false);
  const [quickAssignForm, setQuickAssignForm] = useState({
    shopName: '',
    customerName: '',
    customerPhone: '',
    description: '',
    pieces: '',
    ratePerPiece: '',
    amountReceived: ''
  });
  const [quickAssignLoading, setQuickAssignLoading] = useState(false);

  // expanded shop assignments
  const [expanded, setExpanded] = useState(new Set());

  // received amount drafts & save state
  const [receivedDrafts, setReceivedDrafts] = useState({});
  const [savingIds, setSavingIds]           = useState(new Set());
  const [markingIds, setMarkingIds]         = useState(new Set());

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shopsRes, assignmentsRes] = await Promise.all([
        api.get('/finisher/panel/shops'),
        api.get('/finisher/panel/assignments'),
      ]);
      const loadedShops       = shopsRes.data?.shops || [];
      const loadedAssignments = assignmentsRes.data?.assignments || [];
      setShops(loadedShops);
      setAssignments(loadedAssignments);
      const drafts = {};
      loadedAssignments.forEach((a) => { drafts[a._id] = String(a.amountReceived ?? 0); });
      setReceivedDrafts(drafts);
      if (loadedShops.length) setExpanded(new Set([String(loadedShops[0]._id)]));
    } catch {
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  // group assignments by shop
  const assignmentsByShop = useMemo(() => {
    const map = {};
    assignments.forEach((a) => {
      const key = String(a.shopId?._id || a.shopId);
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [assignments]);

  const shopStatsMap = useMemo(() => {
    return shops.reduce((acc, shop) => {
      acc[String(shop._id)] = summarizeShopAssignments(assignmentsByShop[String(shop._id)] || []);
      return acc;
    }, {});
  }, [shops, assignmentsByShop]);

  const upsertShop = (shop) => {
    if (!shop?._id) return;
    setShops((prev) => {
      const exists = prev.some((item) => String(item._id) === String(shop._id));
      if (exists) {
        return prev.map((item) => (String(item._id) === String(shop._id) ? { ...item, ...shop } : item));
      }
      return [shop, ...prev];
    });
  };

  const upsertAssignment = (assignment) => {
    if (!assignment?._id) return;
    setAssignments((prev) => {
      const filtered = prev.filter((item) => String(item._id) !== String(assignment._id));
      return [assignment, ...filtered];
    });
  };

  // ── create shop ──
  const handleCreateShop = async (e) => {
    e.preventDefault();
    setShopLoading(true);
    try {
      const response = await api.post('/finisher/panel/shops', {
        ...shopForm,
        perPieceFinishing: Number(shopForm.perPieceFinishing) || 0,
      });
      toast.success('Shop created');
      upsertShop(response.data?.shop);
      setShopForm({ shopName: '', ownerName: '', phone: '', perPieceFinishing: '' });
      setCreateOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create shop'));
    }
    setShopLoading(false);
  };

  // ── open assign panel for a shop ──
  const openAssign = (shop) => {
    setAssignShopId(shop._id);
    setAssignForm({ description: '', pieces: '', ratePerPiece: String(shop.perPieceFinishing || ''), amountReceived: '' });
  };

  // ── create assignment ──
  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignLoading(true);
    try {
      const res = await api.post('/finisher/panel/assignments', {
        shopId: assignShopId,
        description: assignForm.description,
        pieces: Number(assignForm.pieces) || 0,
        ratePerPiece: Number(assignForm.ratePerPiece) || 0,
        amountReceived: Number(assignForm.amountReceived) || 0,
        status: 'assigned',
      });
      const newA = res.data?.assignment;
      if (res.data?.shop) upsertShop(res.data.shop);
      upsertAssignment(newA);
      setReceivedDrafts((prev) => ({ ...prev, [newA._id]: String(newA.amountReceived ?? 0) }));
      setExpanded((prev) => new Set([...prev, String(assignShopId)]));
      setAssignShopId(null);
      setAssignForm({ description: '', pieces: '', ratePerPiece: '', amountReceived: '' });
      toast.success('Pieces assigned');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to assign'));
    }
    setAssignLoading(false);
  };

  const handleQuickAssign = async (e) => {
    e.preventDefault();
    setQuickAssignLoading(true);
    try {
      const res = await api.post('/finisher/panel/assignments', {
        shopName: quickAssignForm.shopName,
        customerName: quickAssignForm.customerName,
        customerPhone: quickAssignForm.customerPhone,
        description: quickAssignForm.description,
        pieces: Number(quickAssignForm.pieces) || 0,
        ratePerPiece: Number(quickAssignForm.ratePerPiece) || 0,
        amountReceived: Number(quickAssignForm.amountReceived) || 0,
        status: 'assigned'
      });
      const createdAssignment = res.data?.assignment;
      if (res.data?.shop) {
        upsertShop(res.data.shop);
        setExpanded((prev) => new Set([String(res.data.shop._id), ...prev]));
      }
      upsertAssignment(createdAssignment);
      setReceivedDrafts((prev) => ({ ...prev, [createdAssignment._id]: String(createdAssignment.amountReceived ?? 0) }));
      setQuickAssignForm({
        shopName: '',
        customerName: '',
        customerPhone: '',
        description: '',
        pieces: '',
        ratePerPiece: '',
        amountReceived: ''
      });
      setQuickAssignOpen(false);
      toast.success(res.data?.createdShop ? 'Customer shop created and pieces assigned' : 'Pieces assigned');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to assign'));
    }
    setQuickAssignLoading(false);
  };

  // ── save received amount ──
  const saveReceived = async (assignmentId) => {
    setSavingIds((prev) => new Set([...prev, assignmentId]));
    try {
      const res = await api.put(`/finisher/panel/assignments/${assignmentId}/payment`, {
        amountReceived: Number(receivedDrafts[assignmentId]) || 0,
      });
      setAssignments((prev) => prev.map((a) => (a._id === assignmentId ? res.data.assignment : a)));
      toast.success('Saved');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save payment'));
    }
    setSavingIds((prev) => { const s = new Set(prev); s.delete(assignmentId); return s; });
  };

  // ── mark as done ──
  const markDone = async (assignmentId) => {
    setMarkingIds((prev) => new Set([...prev, assignmentId]));
    try {
      const res = await api.put(`/finisher/panel/assignments/${assignmentId}`, { status: 'completed' });
      setAssignments((prev) => prev.map((a) => (a._id === assignmentId ? res.data.assignment : a)));
      toast.success('Marked as done');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to mark as done'));
    }
    setMarkingIds((prev) => { const s = new Set(prev); s.delete(assignmentId); return s; });
  };

  const toggleExpand = (shopId) => {
    setExpanded((prev) => {
      const s = new Set(prev);
      s.has(String(shopId)) ? s.delete(String(shopId)) : s.add(String(shopId));
      return s;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* ── header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
            {t('nav.shops', { defaultValue: 'Shops' })}
          </h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
            {t('finishers.shopsSubtitle', { defaultValue: 'Create shops, assign pieces, and track received amounts.' })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              setQuickAssignOpen((v) => !v);
              if (!quickAssignOpen) setCreateOpen(false);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 text-gray-700 dark:text-slate-200 text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            {quickAssignOpen ? <X className="w-4 h-4" /> : <Package className="w-4 h-4" />}
            {quickAssignOpen ? t('common.cancel', { defaultValue: 'Cancel' }) : 'Quick Assign'}
          </button>
          <button
            onClick={() => {
              setCreateOpen((v) => !v);
              if (!createOpen) setQuickAssignOpen(false);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            {createOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {createOpen ? t('common.cancel', { defaultValue: 'Cancel' }) : t('finishers.newShop', { defaultValue: 'New Shop' })}
          </button>
        </div>
      </div>

      {quickAssignOpen && (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-6">
          <div className="flex flex-col gap-1 mb-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 uppercase tracking-wider">Quick Assign New Customer</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500">Enter a name and phone. If the customer shop does not exist yet, it will be created automatically.</p>
          </div>
          <form onSubmit={handleQuickAssign} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <Field
                label="Customer Name *"
                value={quickAssignForm.customerName}
                onChange={(e) => setQuickAssignForm((p) => ({ ...p, customerName: e.target.value }))}
                placeholder="Customer name"
                required
              />
              <Field
                label="Phone Number *"
                value={quickAssignForm.customerPhone}
                onChange={(e) => setQuickAssignForm((p) => ({ ...p, customerPhone: e.target.value }))}
                placeholder="+966…"
                required
              />
              <Field
                label="Shop Name"
                value={quickAssignForm.shopName}
                onChange={(e) => setQuickAssignForm((p) => ({ ...p, shopName: e.target.value }))}
                placeholder="Optional shop name"
              />
              <Field
                label="Note"
                value={quickAssignForm.description}
                onChange={(e) => setQuickAssignForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description…"
              />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Field
                label="Pieces *"
                type="number"
                min="1"
                value={quickAssignForm.pieces}
                onChange={(e) => setQuickAssignForm((p) => ({ ...p, pieces: e.target.value }))}
                placeholder="0"
                required
              />
              <Field
                label="Rate / Piece"
                type="number"
                min="0"
                step="0.01"
                value={quickAssignForm.ratePerPiece}
                onChange={(e) => setQuickAssignForm((p) => ({ ...p, ratePerPiece: e.target.value }))}
                placeholder="0.00"
              />
              <Field
                label="Received Amount"
                type="number"
                min="0"
                step="0.01"
                value={quickAssignForm.amountReceived}
                onChange={(e) => setQuickAssignForm((p) => ({ ...p, amountReceived: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={quickAssignLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white hover:opacity-90 disabled:opacity-60 text-white dark:text-gray-900 text-sm font-semibold rounded-xl transition-all active:scale-95"
              >
                {quickAssignLoading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" /> : <Package className="w-4 h-4" />}
                Create & Assign
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── create shop panel ── */}
      {createOpen && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 p-6">
          <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-5">
            {t('finishers.createShop', { defaultValue: 'Create Shop' })}
          </h2>
          <form onSubmit={handleCreateShop} className="space-y-4">
            <Field
              label={t('finishers.shopName', { defaultValue: 'Shop Name' })}
              value={shopForm.shopName}
              onChange={(e) => setShopForm((p) => ({ ...p, shopName: e.target.value }))}
              placeholder="e.g. Al Rawad Tailoring"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label={t('finishers.ownerName', { defaultValue: 'Owner Name' })}
                value={shopForm.ownerName}
                onChange={(e) => setShopForm((p) => ({ ...p, ownerName: e.target.value }))}
                placeholder="Owner"
              />
              <Field
                label={t('workers.phone')}
                value={shopForm.phone}
                onChange={(e) => setShopForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+966…"
              />
              <Field
                label={t('finishers.perPieceFinishing', { defaultValue: 'Rate / Piece' })}
                type="number"
                min="0"
                step="0.01"
                value={shopForm.perPieceFinishing}
                onChange={(e) => setShopForm((p) => ({ ...p, perPieceFinishing: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={shopLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
              >
                {shopLoading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Store className="w-4 h-4" />}
                {t('finishers.createShop', { defaultValue: 'Create Shop' })}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── shops list ── */}
      {shops.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Store className="w-7 h-7 text-gray-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-medium text-gray-400 dark:text-slate-500">No shops yet</p>
          <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">Click "New Shop" to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shops.map((shop) => {
            const shopAssignments = assignmentsByShop[String(shop._id)] || [];
            const isExpanded      = expanded.has(String(shop._id));
            const isAssigning     = assignShopId === shop._id;
            const stats           = shopStatsMap[String(shop._id)] || summarizeShopAssignments([]);

            return (
              <div
                key={shop._id}
                className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm"
              >
                {/* shop header row */}
                <div className="px-5 py-4 flex items-center gap-4">
                  {/* icon */}
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                    <Store className="w-5 h-5 text-amber-500" />
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-slate-100 truncate">{shop.shopName}</div>
                    <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                      {[shop.ownerName, shop.phone].filter(Boolean).join(' · ') || '—'}
                      {shop.perPieceFinishing ? <span className="ml-2 text-amber-500 font-medium">{shop.perPieceFinishing} / pc</span> : null}
                    </div>
                  </div>

                  {/* stats */}
                  <div className="hidden sm:flex items-center gap-5 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-gray-400 dark:text-slate-500">Pieces</div>
                      <div className="font-semibold text-gray-900 dark:text-slate-100">{stats.totalPieces || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 dark:text-slate-500">Pending</div>
                      <div className="font-semibold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                        {stats.pendingAmount || 0} <SARIcon className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 dark:text-slate-500">Received</div>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                        {stats.amountReceived || 0} <SARIcon className="w-3 h-3" />
                      </div>
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => isAssigning ? setAssignShopId(null) : openAssign(shop)}
                      type="button"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                        isAssigning
                          ? 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                          : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                      }`}
                    >
                      {isAssigning ? <X className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                      {isAssigning ? 'Cancel' : 'Assign Pieces'}
                    </button>
                    {shopAssignments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(shop._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                      >
                        {shopAssignments.length}
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* sm stats strip */}
                <div className="sm:hidden flex items-center gap-4 px-5 pb-3 text-xs">
                  <span className="text-gray-400">{stats.totalPieces || 0} pcs</span>
                  <span className="text-amber-500 font-medium inline-flex items-center gap-0.5">{stats.pendingAmount || 0}<SARIcon className="w-3 h-3" /> pending</span>
                  <span className="text-emerald-500 font-medium inline-flex items-center gap-0.5">{stats.amountReceived || 0}<SARIcon className="w-3 h-3" /> received</span>
                </div>

                {/* ── inline assign form ── */}
                {isAssigning && (
                  <form
                    onSubmit={handleAssign}
                    className="border-t border-dashed border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-900/5 px-5 py-4 space-y-4"
                  >
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Assign Pieces to {shop.shopName}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                      <Field
                        label="Pieces *"
                        type="number"
                        min="1"
                        value={assignForm.pieces}
                        onChange={(e) => setAssignForm((p) => ({ ...p, pieces: e.target.value }))}
                        placeholder="0"
                        required
                      />
                      <Field
                        label="Rate / Piece"
                        type="number"
                        min="0"
                        step="0.01"
                        value={assignForm.ratePerPiece}
                        onChange={(e) => setAssignForm((p) => ({ ...p, ratePerPiece: e.target.value }))}
                        placeholder={String(shop.perPieceFinishing || 0)}
                      />
                      <Field
                        label="Received Amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={assignForm.amountReceived}
                        onChange={(e) => setAssignForm((p) => ({ ...p, amountReceived: e.target.value }))}
                        placeholder="0"
                      />
                      <Field
                        label="Note (optional)"
                        value={assignForm.description}
                        onChange={(e) => setAssignForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Description…"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={assignLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
                      >
                        {assignLoading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Check className="w-4 h-4" />}
                        Assign
                      </button>
                    </div>
                  </form>
                )}

                {/* ── assignments list ── */}
                {isExpanded && shopAssignments.length > 0 && (
                  <div className="border-t border-gray-100 dark:border-slate-800 divide-y divide-gray-50 dark:divide-slate-800">
                    {shopAssignments.map((a) => {
                      const isDone    = a.status === 'completed';
                      const isMarking = markingIds.has(a._id);
                      const isSaving  = savingIds.has(a._id);
                      const draft     = receivedDrafts[a._id] ?? String(a.amountReceived ?? 0);

                      return (
                        <div key={a._id} className="px-5 py-4 flex flex-wrap items-center gap-4">
                          {/* left: info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <StatusPill status={a.status} />
                              {a.description && (
                                <span className="text-xs text-gray-400 dark:text-slate-500 truncate">{a.description}</span>
                              )}
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm">
                              <span className="text-gray-500 dark:text-slate-400">
                                <span className="font-semibold text-gray-900 dark:text-slate-100">{a.pieces}</span> pcs
                                {a.ratePerPiece ? <> × <span className="font-semibold text-gray-900 dark:text-slate-100">{a.ratePerPiece}</span></> : null}
                                <> = <span className="font-semibold text-gray-900 dark:text-slate-100 inline-flex items-center gap-0.5">{a.totalAmount}<SARIcon className="w-3 h-3" /></span></>
                              </span>
                              <span className="text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-0.5">
                                {a.pendingAmount}<SARIcon className="w-3 h-3" /> pending
                              </span>
                              <span className={`text-xs font-semibold ${a.paymentStatus === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : a.paymentStatus === 'partial' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-slate-500'}`}>
                                {a.paymentStatus === 'paid' ? 'Paid' : a.paymentStatus === 'partial' ? 'Partially Paid' : 'Unpaid'}
                              </span>
                            </div>
                          </div>

                          {/* right: received input + actions */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={draft}
                                onChange={(e) => setReceivedDrafts((p) => ({ ...p, [a._id]: e.target.value }))}
                                className="w-full sm:w-32 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all pr-7"
                                placeholder="Received"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                <SARIcon className="w-3 h-3 text-gray-400" />
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => saveReceived(a._id)}
                              disabled={isSaving}
                              title="Save received amount"
                              className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 disabled:opacity-50 transition-all active:scale-95"
                            >
                              {isSaving
                                ? <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent block" />
                                : <Check className="w-3.5 h-3.5" />}
                            </button>
                            {isDone ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                                <Check className="w-3.5 h-3.5" />
                                Done
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => markDone(a._id)}
                                disabled={isMarking}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold disabled:opacity-50 transition-all active:scale-95"
                              >
                                {isMarking
                                  ? <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
                                  : <Check className="w-3.5 h-3.5" />}
                                Mark Done
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FinisherShops;
