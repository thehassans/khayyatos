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

  // ── create shop ──
  const handleCreateShop = async (e) => {
    e.preventDefault();
    setShopLoading(true);
    try {
      await api.post('/finisher/panel/shops', {
        ...shopForm,
        perPieceFinishing: Number(shopForm.perPieceFinishing) || 0,
      });
      toast.success('Shop created');
      setShopForm({ shopName: '', ownerName: '', phone: '', perPieceFinishing: '' });
      setCreateOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create shop');
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
      setAssignments((prev) => [newA, ...prev]);
      setReceivedDrafts((prev) => ({ ...prev, [newA._id]: String(newA.amountReceived ?? 0) }));
      setExpanded((prev) => new Set([...prev, String(assignShopId)]));
      setAssignShopId(null);
      toast.success('Pieces assigned');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign');
    }
    setAssignLoading(false);
  };

  // ── save received amount ──
  const saveReceived = async (assignmentId) => {
    setSavingIds((prev) => new Set([...prev, assignmentId]));
    try {
      const res = await api.put(`/finisher/panel/assignments/${assignmentId}`, {
        amountReceived: Number(receivedDrafts[assignmentId]) || 0,
      });
      setAssignments((prev) => prev.map((a) => (a._id === assignmentId ? res.data.assignment : a)));
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
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
    } catch {
      toast.error('Failed');
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
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
            {t('nav.shops', { defaultValue: 'Shops' })}
          </h1>
          <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
            {t('finishers.shopsSubtitle', { defaultValue: 'Create shops, assign pieces, and track received amounts.' })}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          {createOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {createOpen ? t('common.cancel', { defaultValue: 'Cancel' }) : t('finishers.newShop', { defaultValue: 'New Shop' })}
        </button>
      </div>

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
                      <div className="font-semibold text-gray-900 dark:text-slate-100">{shop.stats?.totalPieces || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 dark:text-slate-500">Pending</div>
                      <div className="font-semibold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                        {shop.stats?.pendingAmount || 0} <SARIcon className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 dark:text-slate-500">Received</div>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                        {shop.stats?.amountReceived || 0} <SARIcon className="w-3 h-3" />
                      </div>
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => isAssigning ? setAssignShopId(null) : openAssign(shop)}
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
                  <span className="text-gray-400">{shop.stats?.totalPieces || 0} pcs</span>
                  <span className="text-amber-500 font-medium inline-flex items-center gap-0.5">{shop.stats?.pendingAmount || 0}<SARIcon className="w-3 h-3" /> pending</span>
                  <span className="text-emerald-500 font-medium inline-flex items-center gap-0.5">{shop.stats?.amountReceived || 0}<SARIcon className="w-3 h-3" /> received</span>
                </div>

                {/* ── inline assign form ── */}
                {isAssigning && (
                  <form
                    onSubmit={handleAssign}
                    className="border-t border-dashed border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-900/5 px-5 py-4 space-y-4"
                  >
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Assign Pieces to {shop.shopName}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                              {!isDone && (
                                <span className="text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-0.5">
                                  {a.pendingAmount}<SARIcon className="w-3 h-3" /> pending
                                </span>
                              )}
                            </div>
                          </div>

                          {/* right: received input + actions */}
                          {!isDone ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={draft}
                                  onChange={(e) => setReceivedDrafts((p) => ({ ...p, [a._id]: e.target.value }))}
                                  className="w-28 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all pr-7"
                                  placeholder="Received"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                  <SARIcon className="w-3 h-3 text-gray-400" />
                                </span>
                              </div>
                              <button
                                onClick={() => saveReceived(a._id)}
                                disabled={isSaving}
                                title="Save received amount"
                                className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 disabled:opacity-50 transition-all active:scale-95"
                              >
                                {isSaving
                                  ? <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent block" />
                                  : <Check className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => markDone(a._id)}
                                disabled={isMarking}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold disabled:opacity-50 transition-all active:scale-95"
                              >
                                {isMarking
                                  ? <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
                                  : <Check className="w-3.5 h-3.5" />}
                                Mark Done
                              </button>
                            </div>
                          ) : (
                            <div className="shrink-0 flex items-center gap-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                              <Check className="w-4 h-4" />
                              <span className="inline-flex items-center gap-0.5">{a.amountReceived}<SARIcon className="w-3 h-3" /> received</span>
                            </div>
                          )}
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
