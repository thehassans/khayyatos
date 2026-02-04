import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import DemoBlockedModal from '../../components/ui/DemoBlockedModal';
import { Input } from '../../components/ui/Input';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import SARIcon from '../../components/ui/SARIcon';
import { Layers, Plus, Minus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const FabricRollar = () => {
  const { t } = useTranslation();
  const { api, user } = useAuth();
  const [searchParams] = useSearchParams();

  const isDemo = !!user?.isDemoSession;
  const [demoBlockedOpen, setDemoBlockedOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [fabrics, setFabrics] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const tutorialCreateOpenedRef = useRef(false);

  const [createForm, setCreateForm] = useState({ name: '', madeIn: '', pricePerRoll: '', rollsInStock: '' });
  const [editForm, setEditForm] = useState({ id: null, name: '', madeIn: '', pricePerRoll: '', rollsInStock: '' });
  const [stockForm, setStockForm] = useState({ id: null, name: '', delta: '' });

  const [deleteModal, setDeleteModal] = useState({ open: false, fabric: null, loading: false });

  const computed = useMemo(() => {
    const list = Array.isArray(fabrics) ? fabrics : [];
    const totalRolls = list.reduce((sum, x) => sum + (Number(x.rollsInStock) || 0), 0);
    const totalValue = list.reduce((sum, x) => sum + ((Number(x.rollsInStock) || 0) * (Number(x.pricePerRoll) || 0)), 0);
    return { totalRolls, totalValue };
  }, [fabrics]);

  const fetchFabrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fabrics');
      setFabrics(Array.isArray(res.data?.fabrics) ? res.data.fabrics : []);
    } catch (e) {
      setFabrics([]);
      toast.error(t('common.error', { defaultValue: 'Error' }));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFabrics();
  }, []);

  const openCreate = () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setCreateForm({ name: '', madeIn: '', pricePerRoll: '', rollsInStock: '' });
    setCreateOpen(true);
  };

  useEffect(() => {
    const shouldOpen = (searchParams.get('create') || '') === '1';
    if (!shouldOpen) return;
    if (tutorialCreateOpenedRef.current) return;
    if (createOpen) return;
    tutorialCreateOpenedRef.current = true;
    openCreate();
  }, [createOpen, openCreate, searchParams]);

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateForm({ name: '', madeIn: '', pricePerRoll: '', rollsInStock: '' });
  };

  const submitCreate = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }

    const name = String(createForm.name || '').trim();
    const madeIn = String(createForm.madeIn || '').trim();
    const pricePerRoll = Number(createForm.pricePerRoll);
    const rollsInStock = Number(createForm.rollsInStock);

    if (!name) {
      toast.error(t('common.required', { defaultValue: 'Required' }));
      return;
    }

    try {
      await api.post('/fabrics', {
        name,
        madeIn,
        pricePerRoll: Number.isFinite(pricePerRoll) && pricePerRoll >= 0 ? pricePerRoll : 0,
        rollsInStock: Number.isFinite(rollsInStock) && rollsInStock >= 0 ? rollsInStock : 0
      });
      toast.success(t('common.success', { defaultValue: 'Success' }));
      closeCreate();
      fetchFabrics();
    } catch (e) {
      toast.error(e?.response?.data?.error || t('common.error', { defaultValue: 'Error' }));
    }
  };

  const openEdit = (f) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setEditForm({
      id: f?._id,
      name: f?.name || '',
      madeIn: f?.madeIn || '',
      pricePerRoll: String(f?.pricePerRoll ?? ''),
      rollsInStock: String(f?.rollsInStock ?? '')
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditForm({ id: null, name: '', madeIn: '', pricePerRoll: '', rollsInStock: '' });
  };

  const submitEdit = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    const id = editForm.id;
    if (!id) return;

    const name = String(editForm.name || '').trim();
    const madeIn = String(editForm.madeIn || '').trim();
    const pricePerRoll = Number(editForm.pricePerRoll);
    const rollsInStock = Number(editForm.rollsInStock);

    if (!name) {
      toast.error(t('common.required', { defaultValue: 'Required' }));
      return;
    }

    try {
      await api.put(`/fabrics/${id}`, {
        name,
        madeIn,
        pricePerRoll: Number.isFinite(pricePerRoll) && pricePerRoll >= 0 ? pricePerRoll : 0,
        rollsInStock: Number.isFinite(rollsInStock) && rollsInStock >= 0 ? rollsInStock : 0
      });
      toast.success(t('common.success', { defaultValue: 'Success' }));
      closeEdit();
      fetchFabrics();
    } catch (e) {
      toast.error(e?.response?.data?.error || t('common.error', { defaultValue: 'Error' }));
    }
  };

  const openStock = (f) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setStockForm({ id: f?._id, name: f?.name || '', delta: '' });
    setStockOpen(true);
  };

  const closeStock = () => {
    setStockOpen(false);
    setStockForm({ id: null, name: '', delta: '' });
  };

  const submitStock = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    const id = stockForm.id;
    if (!id) return;

    const delta = Number(stockForm.delta);
    if (!Number.isFinite(delta) || delta === 0) {
      toast.error(t('common.invalidAmount', { defaultValue: 'Invalid amount' }));
      return;
    }

    try {
      await api.post(`/fabrics/${id}/stock`, { delta });
      toast.success(t('common.success', { defaultValue: 'Success' }));
      closeStock();
      fetchFabrics();
    } catch (e) {
      toast.error(e?.response?.data?.error || t('common.error', { defaultValue: 'Error' }));
    }
  };

  const requestDelete = (fabric) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setDeleteModal({ open: true, fabric, loading: false });
  };

  const closeDelete = () => {
    setDeleteModal({ open: false, fabric: null, loading: false });
  };

  const confirmDelete = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      closeDelete();
      return;
    }

    const id = deleteModal?.fabric?._id;
    if (!id) {
      closeDelete();
      return;
    }

    setDeleteModal((p) => ({ ...p, loading: true }));
    try {
      await api.delete(`/fabrics/${id}`);
      toast.success(t('common.success', { defaultValue: 'Success' }));
      closeDelete();
      fetchFabrics();
    } catch (e) {
      toast.error(e?.response?.data?.error || t('common.error', { defaultValue: 'Error' }));
      setDeleteModal((p) => ({ ...p, loading: false }));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D5B25B] to-amber-700 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('fabrics.title', { defaultValue: 'Fabric Rollar' })}</h1>
            <div className="text-sm text-gray-500 dark:text-slate-400">{t('fabrics.subtitle', { defaultValue: 'Create fabrics, manage price per roll, made in, and stock.' })}</div>
          </div>
        </div>
        <Button data-tutorial="fabrics-create-button" onClick={openCreate} icon={Plus} className="rounded-2xl px-5 py-3">
          {t('fabrics.addFabric', { defaultValue: 'Add Fabric' })}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-500 dark:text-slate-400">{t('fabrics.totalRollsInStock', { defaultValue: 'Total Rolls In Stock' })}</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{computed.totalRolls}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-500 dark:text-slate-400">{t('fabrics.inventoryValue', { defaultValue: 'Inventory Value' })}</div>
          <div className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            {computed.totalValue.toFixed(2)} <SARIcon className="w-5 h-5" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="font-semibold text-gray-900 dark:text-slate-100">{t('fabrics.listTitle', { defaultValue: 'Fabrics' })}</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        ) : fabrics.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>{t('fabrics.name', { defaultValue: 'Name' })}</Th>
                <Th>{t('fabrics.madeIn', { defaultValue: 'Made In' })}</Th>
                <Th>{t('fabrics.pricePerRoll', { defaultValue: 'Price / Roll' })}</Th>
                <Th>{t('fabrics.stock', { defaultValue: 'Stock' })}</Th>
                <Th>{t('fabrics.value', { defaultValue: 'Value' })}</Th>
                <Th>{t('common.actions', { defaultValue: 'Actions' })}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fabrics.map((f) => {
                const price = Number(f.pricePerRoll) || 0;
                const stock = Number(f.rollsInStock) || 0;
                const value = price * stock;
                return (
                  <Tr key={f._id}>
                    <Td className="font-medium">{f.name}</Td>
                    <Td className="text-gray-700 dark:text-slate-200">{f.madeIn || '-'}</Td>
                    <Td className="text-gray-700 dark:text-slate-200">
                      <span className="inline-flex items-center gap-1">{price.toFixed(2)} <SARIcon className="w-3 h-3" /></span>
                    </Td>
                    <Td className="text-gray-700 dark:text-slate-200">{stock}</Td>
                    <Td className="font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="inline-flex items-center gap-1">{value.toFixed(2)} <SARIcon className="w-3 h-3" /></span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => openStock(f)}
                          className="rounded-xl px-4 py-2"
                          disabled={isDemo}
                          icon={Layers}
                        >
                          {t('fabrics.stockAction', { defaultValue: 'Stock' })}
                        </Button>
                        <button
                          type="button"
                          onClick={() => openEdit(f)}
                          disabled={isDemo}
                          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/50 text-gray-600 dark:text-slate-300"
                          title={t('common.edit', { defaultValue: 'Edit' })}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(f)}
                          disabled={isDemo}
                          className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                          title={t('common.delete', { defaultValue: 'Delete' })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        ) : (
          <div className="p-12 text-center text-gray-500 dark:text-slate-400">{t('common.noData', { defaultValue: 'No data' })}</div>
        )}
      </Card>

      <Modal isOpen={createOpen} onClose={closeCreate} title={t('fabrics.addModalTitle', { defaultValue: 'Add Fabric' })} size="lg">
        <div data-tutorial="fabrics-create-modal" className="space-y-4">
          <Input label={t('fabrics.name', { defaultValue: 'Name' })} value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label={t('fabrics.madeIn', { defaultValue: 'Made In' })} value={createForm.madeIn} onChange={(e) => setCreateForm((p) => ({ ...p, madeIn: e.target.value }))} />
          <Input label={t('fabrics.pricePerRoll', { defaultValue: 'Price / Roll' })} type="number" min="0" step="0.01" value={createForm.pricePerRoll} onChange={(e) => setCreateForm((p) => ({ ...p, pricePerRoll: e.target.value }))} />
          <Input label={t('fabrics.stock', { defaultValue: 'Stock' })} type="number" min="0" step="1" value={createForm.rollsInStock} onChange={(e) => setCreateForm((p) => ({ ...p, rollsInStock: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button onClick={submitCreate} className="flex-1 rounded-2xl" disabled={isDemo}>{t('common.save', { defaultValue: 'Save' })}</Button>
            <Button variant="secondary" onClick={closeCreate} className="flex-1 rounded-2xl">{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editOpen} onClose={closeEdit} title={t('fabrics.editModalTitle', { defaultValue: 'Edit Fabric' })} size="lg">
        <div className="space-y-4">
          <Input label={t('fabrics.name', { defaultValue: 'Name' })} value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label={t('fabrics.madeIn', { defaultValue: 'Made In' })} value={editForm.madeIn} onChange={(e) => setEditForm((p) => ({ ...p, madeIn: e.target.value }))} />
          <Input label={t('fabrics.pricePerRoll', { defaultValue: 'Price / Roll' })} type="number" min="0" step="0.01" value={editForm.pricePerRoll} onChange={(e) => setEditForm((p) => ({ ...p, pricePerRoll: e.target.value }))} />
          <Input label={t('fabrics.stock', { defaultValue: 'Stock' })} type="number" min="0" step="1" value={editForm.rollsInStock} onChange={(e) => setEditForm((p) => ({ ...p, rollsInStock: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button onClick={submitEdit} className="flex-1 rounded-2xl" disabled={isDemo}>{t('common.save', { defaultValue: 'Save' })}</Button>
            <Button variant="secondary" onClick={closeEdit} className="flex-1 rounded-2xl">{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={stockOpen} onClose={closeStock} title={t('fabrics.adjustStockTitle', { defaultValue: 'Adjust Stock' })} size="lg">
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-4">
            <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{stockForm.name || ''}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{t('fabrics.adjustStockHint', { defaultValue: 'Use a positive number to add rolls, or negative to subtract.' })}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label={t('fabrics.deltaLabel', { defaultValue: 'Delta (± rolls)' })}
                type="number"
                step="1"
                value={stockForm.delta}
                onChange={(e) => setStockForm((p) => ({ ...p, delta: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-1 flex items-end gap-2">
              <button
                type="button"
                onClick={() => setStockForm((p) => ({ ...p, delta: String((Number(p.delta) || 0) + 1) }))}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:bg-gray-50 dark:hover:bg-slate-900/60 text-gray-700 dark:text-slate-200"
              >
                <Plus className="w-4 h-4" />
                {t('fabrics.quickAddOne', { defaultValue: '+1' })}
              </button>
              <button
                type="button"
                onClick={() => setStockForm((p) => ({ ...p, delta: String((Number(p.delta) || 0) - 1) }))}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:bg-gray-50 dark:hover:bg-slate-900/60 text-gray-700 dark:text-slate-200"
              >
                <Minus className="w-4 h-4" />
                {t('fabrics.quickSubtractOne', { defaultValue: '-1' })}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={submitStock} className="flex-1 rounded-2xl" disabled={isDemo}>{t('common.save', { defaultValue: 'Save' })}</Button>
            <Button variant="secondary" onClick={closeStock} className="flex-1 rounded-2xl">{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={closeDelete}
        title={t('common.delete', { defaultValue: 'Delete' })}
        message={t('fabrics.deleteConfirmMessage', { defaultValue: 'Delete this fabric?' })}
        subtitle={t('fabrics.deleteConfirmSubtitle', { defaultValue: 'This action cannot be undone. If this fabric is used by orders, deletion will be blocked.' })}
        confirmText={t('common.delete', { defaultValue: 'Delete' })}
        cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
        confirmVariant="danger"
        loading={deleteModal.loading}
        onConfirm={confirmDelete}
        previewTitle={deleteModal?.fabric?.name || ''}
        previewSubtitle={deleteModal?.fabric ? (
          <span className="inline-flex items-center gap-1">
            {Number(deleteModal.fabric.rollsInStock || 0)} {t('fabrics.rollsUnit', { defaultValue: 'rolls' })} · {Number(deleteModal.fabric.pricePerRoll || 0).toFixed(2)} <SARIcon className="w-3 h-3" /> {t('fabrics.perRollUnit', { defaultValue: '/ roll' })}
          </span>
        ) : ''}
      />

      <DemoBlockedModal
        isOpen={demoBlockedOpen}
        onClose={() => setDemoBlockedOpen(false)}
        title={t('demo.title', { defaultValue: 'Demo Mode' })}
        phone="+966596775485"
      />
    </div>
  );
};

export default FabricRollar;
