import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import DemoBlockedModal from '../../components/ui/DemoBlockedModal';
import { Input } from '../../components/ui/Input';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import SARIcon from '../../components/ui/SARIcon';
import { Droplets, Edit, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Laundry = () => {
  const { t } = useTranslation();
  const { api, user } = useAuth();

  const isDemo = !!user?.isDemoSession;
  const [demoBlockedOpen, setDemoBlockedOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [laundries, setLaundries] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const [createForm, setCreateForm] = useState({ name: '', pricePerPiece: '' });
  const [editForm, setEditForm] = useState({ id: null, name: '', pricePerPiece: '' });
  const [assignForm, setAssignForm] = useState({ id: null, pieces: '' });

  const [deleteModal, setDeleteModal] = useState({ open: false, laundry: null, loading: false });

  const computed = useMemo(() => {
    const list = Array.isArray(laundries) ? laundries : [];
    const totalAssigned = list.reduce((sum, x) => sum + (Number(x.totalAssigned) || 0), 0);
    const totalAmount = list.reduce((sum, x) => sum + ((Number(x.totalAssigned) || 0) * (Number(x.pricePerPiece) || 0)), 0);
    return { totalAssigned, totalAmount };
  }, [laundries]);

  const fetchLaundries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/laundry');
      setLaundries(Array.isArray(res.data?.laundries) ? res.data.laundries : []);
    } catch (e) {
      setLaundries([]);
      toast.error(t('common.error', { defaultValue: 'Error' }));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLaundries();
  }, []);

  const openCreate = () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setCreateForm({ name: '', pricePerPiece: '' });
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateForm({ name: '', pricePerPiece: '' });
  };

  const submitCreate = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    const name = String(createForm.name || '').trim();
    const pricePerPiece = Number(createForm.pricePerPiece);
    if (!name) {
      toast.error(t('laundry.nameRequired', { defaultValue: 'Laundry name is required' }));
      return;
    }

    try {
      await api.post('/laundry', {
        name,
        pricePerPiece: Number.isFinite(pricePerPiece) && pricePerPiece >= 0 ? pricePerPiece : 0
      });
      toast.success(t('common.success', { defaultValue: 'Success' }));
      closeCreate();
      fetchLaundries();
    } catch (e) {
      toast.error(e?.response?.data?.error || t('common.error', { defaultValue: 'Error' }));
    }
  };

  const openEdit = (l) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setEditForm({
      id: l?._id,
      name: l?.name || '',
      pricePerPiece: String(l?.pricePerPiece ?? '')
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditForm({ id: null, name: '', pricePerPiece: '' });
  };

  const submitEdit = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    const id = editForm.id;
    if (!id) return;

    const name = String(editForm.name || '').trim();
    const pricePerPiece = Number(editForm.pricePerPiece);

    if (!name) {
      toast.error(t('laundry.nameRequired', { defaultValue: 'Laundry name is required' }));
      return;
    }

    try {
      await api.put(`/laundry/${id}`, {
        name,
        pricePerPiece: Number.isFinite(pricePerPiece) && pricePerPiece >= 0 ? pricePerPiece : 0
      });
      toast.success(t('common.success', { defaultValue: 'Success' }));
      closeEdit();
      fetchLaundries();
    } catch (e) {
      toast.error(e?.response?.data?.error || t('common.error', { defaultValue: 'Error' }));
    }
  };

  const openAssign = (l) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setAssignForm({ id: l?._id, pieces: '' });
    setAssignOpen(true);
  };

  const closeAssign = () => {
    setAssignOpen(false);
    setAssignForm({ id: null, pieces: '' });
  };

  const submitAssign = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    const id = assignForm.id;
    const pieces = Number(assignForm.pieces);
    if (!id) return;

    if (!Number.isFinite(pieces) || pieces <= 0) {
      toast.error(t('laundry.invalidPieces', { defaultValue: 'Enter valid pieces' }));
      return;
    }

    try {
      await api.post(`/laundry/${id}/assign`, { pieces });
      toast.success(t('common.success', { defaultValue: 'Success' }));
      closeAssign();
      fetchLaundries();
    } catch (e) {
      toast.error(e?.response?.data?.error || t('common.error', { defaultValue: 'Error' }));
    }
  };

  const requestDelete = (l) => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setDeleteModal({ open: true, laundry: l, loading: false });
  };

  const closeDelete = () => {
    setDeleteModal({ open: false, laundry: null, loading: false });
  };

  const confirmDelete = async () => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      closeDelete();
      return;
    }
    const id = deleteModal?.laundry?._id;
    if (!id) {
      closeDelete();
      return;
    }
    setDeleteModal((p) => ({ ...p, loading: true }));
    try {
      await api.delete(`/laundry/${id}`);
      toast.success(t('common.success', { defaultValue: 'Success' }));
      closeDelete();
      fetchLaundries();
    } catch (e) {
      toast.error(t('common.error', { defaultValue: 'Error' }));
      setDeleteModal((p) => ({ ...p, loading: false }));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('laundry.title', { defaultValue: 'Laundry' })}</h1>
            <div className="text-sm text-gray-500 dark:text-slate-400">{t('laundry.subtitle', { defaultValue: 'Manage laundry pricing and assigned pieces.' })}</div>
          </div>
        </div>
        <Button onClick={openCreate} icon={Plus} className="rounded-2xl px-5 py-3">
          {t('laundry.addLaundry', { defaultValue: 'Add Laundry' })}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-500 dark:text-slate-400">{t('laundry.totalAssigned', { defaultValue: 'Total Assigned' })}</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{computed.totalAssigned}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-500 dark:text-slate-400">{t('laundry.totalAmount', { defaultValue: 'Total Amount' })}</div>
          <div className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            {computed.totalAmount.toFixed(2)} <SARIcon className="w-5 h-5" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="font-semibold text-gray-900 dark:text-slate-100">{t('laundry.list', { defaultValue: 'Laundries' })}</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        ) : laundries.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>{t('laundry.name', { defaultValue: 'Name' })}</Th>
                <Th>{t('laundry.pricePerPiece', { defaultValue: 'Price / Piece' })}</Th>
                <Th>{t('laundry.assigned', { defaultValue: 'Assigned' })}</Th>
                <Th>{t('laundry.amount', { defaultValue: 'Amount' })}</Th>
                <Th>{t('common.actions', { defaultValue: 'Actions' })}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {laundries.map((l) => {
                const price = Number(l.pricePerPiece) || 0;
                const assigned = Number(l.totalAssigned) || 0;
                const amount = price * assigned;
                return (
                  <Tr key={l._id}>
                    <Td className="font-medium">{l.name}</Td>
                    <Td className="text-gray-700 dark:text-slate-200">
                      <span className="inline-flex items-center gap-1">{price.toFixed(2)} <SARIcon className="w-3 h-3" /></span>
                    </Td>
                    <Td className="text-gray-700 dark:text-slate-200">{assigned}</Td>
                    <Td className="font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="inline-flex items-center gap-1">{amount.toFixed(2)} <SARIcon className="w-3 h-3" /></span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => openAssign(l)} className="rounded-xl px-4 py-2">
                          {t('laundry.assign', { defaultValue: 'Assign' })}
                        </Button>
                        <button
                          type="button"
                          onClick={() => openEdit(l)}
                          disabled={isDemo}
                          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/50 text-gray-600 dark:text-slate-300"
                          title={t('common.edit', { defaultValue: 'Edit' })}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(l)}
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

      <Modal
        isOpen={createOpen}
        onClose={closeCreate}
        title={t('laundry.addLaundry', { defaultValue: 'Add Laundry' })}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label={t('laundry.name', { defaultValue: 'Name' })}
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            placeholder={t('laundry.namePlaceholder', { defaultValue: 'e.g. Al Noor Laundry' })}
          />
          <Input
            label={t('laundry.pricePerPiece', { defaultValue: 'Price / Piece' })}
            type="number"
            min="0"
            step="0.01"
            value={createForm.pricePerPiece}
            onChange={(e) => setCreateForm((p) => ({ ...p, pricePerPiece: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={submitCreate} className="flex-1 rounded-2xl" disabled={isDemo}>
              {t('common.save', { defaultValue: 'Save' })}
            </Button>
            <Button variant="secondary" onClick={closeCreate} className="flex-1 rounded-2xl">
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={editOpen}
        onClose={closeEdit}
        title={t('common.edit', { defaultValue: 'Edit' })}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label={t('laundry.name', { defaultValue: 'Name' })}
            value={editForm.name}
            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label={t('laundry.pricePerPiece', { defaultValue: 'Price / Piece' })}
            type="number"
            min="0"
            step="0.01"
            value={editForm.pricePerPiece}
            onChange={(e) => setEditForm((p) => ({ ...p, pricePerPiece: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={submitEdit} className="flex-1 rounded-2xl" disabled={isDemo}>
              {t('common.save', { defaultValue: 'Save' })}
            </Button>
            <Button variant="secondary" onClick={closeEdit} className="flex-1 rounded-2xl">
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={assignOpen}
        onClose={closeAssign}
        title={t('laundry.assignPieces', { defaultValue: 'Assign Pieces' })}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label={t('laundry.pieces', { defaultValue: 'Pieces' })}
            type="number"
            min="1"
            step="1"
            value={assignForm.pieces}
            onChange={(e) => setAssignForm((p) => ({ ...p, pieces: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={submitAssign} className="flex-1 rounded-2xl" disabled={isDemo}>
              {t('common.save', { defaultValue: 'Save' })}
            </Button>
            <Button variant="secondary" onClick={closeAssign} className="flex-1 rounded-2xl">
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={closeDelete}
        title={t('common.delete', { defaultValue: 'Delete' })}
        message={t('laundry.deleteConfirmTitle', { defaultValue: 'Delete this laundry?' })}
        subtitle={t('laundry.deleteConfirmSubtitle', { defaultValue: 'This action cannot be undone.' })}
        confirmText={t('common.delete', { defaultValue: 'Delete' })}
        cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
        confirmVariant="danger"
        loading={deleteModal.loading}
        onConfirm={confirmDelete}
        previewTitle={deleteModal?.laundry?.name || ''}
        previewSubtitle={deleteModal?.laundry ? `${Number(deleteModal.laundry.pricePerPiece || 0).toFixed(2)} SAR / piece` : ''}
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

export default Laundry;
