import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import SARIcon from '../../components/ui/SARIcon';
import toast from 'react-hot-toast';

const FinisherShops = () => {
  const { t } = useTranslation();
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [shopForm, setShopForm] = useState({ shopName: '', ownerName: '', phone: '', perPieceFinishing: '' });
  const [assignmentForm, setAssignmentForm] = useState({ shopId: '', description: '', pieces: '', ratePerPiece: '', amountReceived: '', status: 'assigned' });
  const [editingAssignmentId, setEditingAssignmentId] = useState('');
  const [assignmentDrafts, setAssignmentDrafts] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shopsRes, assignmentsRes] = await Promise.all([
        api.get('/finisher/panel/shops'),
        api.get('/finisher/panel/assignments')
      ]);
      setShops(shopsRes.data?.shops || []);
      setAssignments(assignmentsRes.data?.assignments || []);
      const nextDrafts = {};
      (assignmentsRes.data?.assignments || []).forEach((assignment) => {
        nextDrafts[assignment._id] = {
          amountReceived: assignment.amountReceived || 0,
          status: assignment.status || 'assigned'
        };
      });
      setAssignmentDrafts(nextDrafts);
    } catch (error) {
      toast.error('Failed to load finisher data');
    }
    setLoading(false);
  };

  const shopOptions = useMemo(() => (
    shops.map((shop) => ({ value: shop._id, label: shop.shopName }))
  ), [shops]);

  const createShop = async (e) => {
    e.preventDefault();
    setShopLoading(true);
    try {
      await api.post('/finisher/panel/shops', {
        ...shopForm,
        perPieceFinishing: Number(shopForm.perPieceFinishing) || 0
      });
      toast.success('Shop created');
      setShopForm({ shopName: '', ownerName: '', phone: '', perPieceFinishing: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create shop');
    }
    setShopLoading(false);
  };

  const createAssignment = async (e) => {
    e.preventDefault();
    setAssignmentLoading(true);
    try {
      await api.post('/finisher/panel/assignments', {
        ...assignmentForm,
        pieces: Number(assignmentForm.pieces) || 0,
        ratePerPiece: Number(assignmentForm.ratePerPiece) || 0,
        amountReceived: Number(assignmentForm.amountReceived) || 0
      });
      toast.success('Assignment created');
      setAssignmentForm({ shopId: '', description: '', pieces: '', ratePerPiece: '', amountReceived: '', status: 'assigned' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create assignment');
    }
    setAssignmentLoading(false);
  };

  const saveAssignment = async (assignmentId) => {
    const draft = assignmentDrafts[assignmentId];
    if (!draft) return;
    setEditingAssignmentId(assignmentId);
    try {
      const response = await api.put(`/finisher/panel/assignments/${assignmentId}`, {
        amountReceived: Number(draft.amountReceived) || 0,
        status: draft.status || 'assigned'
      });
      const nextAssignment = response.data?.assignment;
      setAssignments((prev) => prev.map((item) => (item._id === assignmentId ? nextAssignment : item)));
      toast.success('Assignment updated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update assignment');
    }
    setEditingAssignmentId('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('nav.shops', { defaultValue: 'Shops' })}</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('finishers.shopsSubtitle', { defaultValue: 'Create shops, assign pieces, and track received amounts.' })}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <form onSubmit={createShop} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('finishers.createShop', { defaultValue: 'Create Shop' })}</h2>
              <Input label={t('finishers.shopName', { defaultValue: 'Shop Name' })} value={shopForm.shopName} onChange={(e) => setShopForm((prev) => ({ ...prev, shopName: e.target.value }))} required />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label={t('finishers.ownerName', { defaultValue: 'Owner Name' })} value={shopForm.ownerName} onChange={(e) => setShopForm((prev) => ({ ...prev, ownerName: e.target.value }))} />
                <Input label={t('workers.phone')} value={shopForm.phone} onChange={(e) => setShopForm((prev) => ({ ...prev, phone: e.target.value }))} />
              </div>
              <Input label={t('finishers.perPieceFinishing', { defaultValue: 'Per Piece Finishing' })} type="number" min="0" step="0.01" value={shopForm.perPieceFinishing} onChange={(e) => setShopForm((prev) => ({ ...prev, perPieceFinishing: e.target.value }))} />
              <Button type="submit" loading={shopLoading}>{t('finishers.createShop', { defaultValue: 'Create Shop' })}</Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <form onSubmit={createAssignment} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('finishers.assignPieces', { defaultValue: 'Assign Pieces' })}</h2>
              <Select label={t('nav.shops', { defaultValue: 'Shops' })} value={assignmentForm.shopId} onChange={(e) => setAssignmentForm((prev) => ({ ...prev, shopId: e.target.value }))} options={[{ value: '', label: t('common.select', { defaultValue: 'Select' }) }, ...shopOptions]} required />
              <Textarea label={t('common.description', { defaultValue: 'Description' })} value={assignmentForm.description} onChange={(e) => setAssignmentForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label={t('finishers.pieces', { defaultValue: 'Pieces' })} type="number" min="1" value={assignmentForm.pieces} onChange={(e) => setAssignmentForm((prev) => ({ ...prev, pieces: e.target.value }))} required />
                <Input label={t('finishers.ratePerPiece', { defaultValue: 'Rate Per Piece' })} type="number" min="0" step="0.01" value={assignmentForm.ratePerPiece} onChange={(e) => setAssignmentForm((prev) => ({ ...prev, ratePerPiece: e.target.value }))} />
                <Input label={t('finishers.receivedAmount', { defaultValue: 'Received Amount' })} type="number" min="0" step="0.01" value={assignmentForm.amountReceived} onChange={(e) => setAssignmentForm((prev) => ({ ...prev, amountReceived: e.target.value }))} />
              </div>
              <Select
                label={t('common.status')}
                value={assignmentForm.status}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, status: e.target.value }))}
                options={[
                  { value: 'assigned', label: t('stitchings.statusAssigned', { defaultValue: 'Assigned' }) },
                  { value: 'in_progress', label: t('stitchings.statusInProgress', { defaultValue: 'In Progress' }) },
                  { value: 'completed', label: t('stitchings.statusCompleted', { defaultValue: 'Completed' }) }
                ]}
              />
              <Button type="submit" loading={assignmentLoading}>{t('finishers.assignPieces', { defaultValue: 'Assign Pieces' })}</Button>
            </form>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('nav.shops', { defaultValue: 'Shops' })}</h2>
            {shops.length ? shops.map((shop) => (
              <div key={shop._id} className="rounded-2xl border border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-gray-900 dark:text-slate-100">{shop.shopName}</div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">{shop.ownerName || '-'}{shop.phone ? ` · ${shop.phone}` : ''}</div>
                  </div>
                  <StatusBadge status={shop.isActive ? 'active' : 'inactive'} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-3">
                    <div className="text-gray-500 dark:text-slate-400">{t('finishers.totalPieces', { defaultValue: 'Total Pieces' })}</div>
                    <div className="mt-1 font-semibold text-gray-900 dark:text-slate-100">{shop.stats?.totalPieces || 0}</div>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-3">
                    <div className="text-gray-500 dark:text-slate-400">{t('workers.pendingAmount')}</div>
                    <div className="mt-1 font-semibold text-gray-900 dark:text-slate-100 inline-flex items-center gap-1">{shop.stats?.pendingAmount || 0} <SARIcon className="w-3 h-3" /></div>
                  </div>
                </div>
              </div>
            )) : <div className="text-sm text-gray-500 dark:text-slate-400">{t('common.noData')}</div>}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('finishers.assignments', { defaultValue: 'Assignments' })}</h2>
            {assignments.length ? assignments.map((assignment) => {
              const draft = assignmentDrafts[assignment._id] || { amountReceived: assignment.amountReceived || 0, status: assignment.status || 'assigned' };
              return (
                <div key={assignment._id} className="rounded-2xl border border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900/40 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-gray-900 dark:text-slate-100">{assignment.shopId?.shopName || '-'}</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">{assignment.description || t('common.noData')}</div>
                    </div>
                    <StatusBadge status={assignment.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-3"><div className="text-gray-500 dark:text-slate-400">{t('finishers.pieces', { defaultValue: 'Pieces' })}</div><div className="mt-1 font-semibold text-gray-900 dark:text-slate-100">{assignment.pieces || 0}</div></div>
                    <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-3"><div className="text-gray-500 dark:text-slate-400">{t('finishers.totalAmount', { defaultValue: 'Total Amount' })}</div><div className="mt-1 font-semibold text-gray-900 dark:text-slate-100 inline-flex items-center gap-1">{assignment.totalAmount || 0} <SARIcon className="w-3 h-3" /></div></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input label={t('finishers.receivedAmount', { defaultValue: 'Received Amount' })} type="number" min="0" step="0.01" value={draft.amountReceived} onChange={(e) => setAssignmentDrafts((prev) => ({ ...prev, [assignment._id]: { ...draft, amountReceived: e.target.value } }))} />
                    <Select
                      label={t('common.status')}
                      value={draft.status}
                      onChange={(e) => setAssignmentDrafts((prev) => ({ ...prev, [assignment._id]: { ...draft, status: e.target.value } }))}
                      options={[
                        { value: 'assigned', label: t('stitchings.statusAssigned', { defaultValue: 'Assigned' }) },
                        { value: 'in_progress', label: t('stitchings.statusInProgress', { defaultValue: 'In Progress' }) },
                        { value: 'completed', label: t('stitchings.statusCompleted', { defaultValue: 'Completed' }) }
                      ]}
                    />
                    <div className="flex items-end"><Button type="button" loading={editingAssignmentId === assignment._id} onClick={() => saveAssignment(assignment._id)} className="w-full">{t('common.save')}</Button></div>
                  </div>
                </div>
              );
            }) : <div className="text-sm text-gray-500 dark:text-slate-400">{t('common.noData')}</div>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default FinisherShops;
