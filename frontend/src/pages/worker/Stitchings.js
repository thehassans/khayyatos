import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Scissors, CheckCircle, Calendar, Ruler, User as UserIcon, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const WorkerStitchings = () => {
  const { t, i18n } = useTranslation();
  const { api } = useAuth();
  const langKey = (i18n?.language || 'en').split('-')[0];
  const [stitchings, setStitchings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModal, setDetailModal] = useState({ open: false, stitching: null });

  useEffect(() => {
    fetchStitchings();
  }, [statusFilter]);

  const fetchStitchings = async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const response = await api.get(`/worker/panel/stitchings${params}`);
      setStitchings(response.data.stitchings);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/worker/panel/stitchings/${id}/status`, { status });
      toast.success('Status updated');
      fetchStitchings();
      setDetailModal({ open: false, stitching: null });
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const measurementLabels = {
    length: t('measurements.length'),
    shoulderWidth: t('measurements.shoulderWidth'),
    chest: t('measurements.chest'),
    sleeveLength: t('measurements.sleeveLength'),
    waist: t('measurements.waist', { defaultValue: 'Waist' }),
    hips: t('measurements.hips', { defaultValue: 'Hips' }),
    bicep: t('measurements.bicep', { defaultValue: 'Bicep' }),
    forearm: t('measurements.forearm', { defaultValue: 'Forearm' }),
    neck: t('measurements.neck'),
    wrist: t('measurements.wrist'),
    cuffWidth: t('measurements.cuffWidth', { defaultValue: 'Cuff Width' }),
    expansion: t('measurements.expansion'),
    armhole: t('measurements.armhole'),
    bottom: t('measurements.bottom', { defaultValue: 'Bottom' })
  };

  const measurementKeys = [
    'length',
    'chest',
    'shoulderWidth',
    'sleeveLength',
    'waist',
    'hips',
    'neck',
    'wrist',
    'bicep',
    'forearm',
    'armhole',
    'cuffWidth',
    'expansion',
    'bottom'
  ];

  const styleOptionLabels = {
    collar: t('styleOptions.collar', { defaultValue: 'Collar' }),
    bain: t('styleOptions.bain', { defaultValue: 'Bain' }),
    cuff: t('styleOptions.cuff', { defaultValue: 'Cuff' }),
    pocket: t('styleOptions.pocket', { defaultValue: 'Pocket' }),
    buttons: t('styleOptions.buttons', { defaultValue: 'Buttons' }),
    embroidery: t('styleOptions.embroidery', { defaultValue: 'Embroidery' })
  };

  const thawbTypeLabels = {
    saudi: t('thawbTypes.saudi', { defaultValue: 'Saudi' }),
    qatari: t('thawbTypes.qatari', { defaultValue: 'Qatari' }),
    emirati: t('thawbTypes.emirati', { defaultValue: 'Emirati' }),
    kuwaiti: t('thawbTypes.kuwaiti', { defaultValue: 'Kuwaiti' }),
    omani: t('thawbTypes.omani', { defaultValue: 'Omani' }),
    bahraini: t('thawbTypes.bahraini', { defaultValue: 'Bahraini' }),
    noum: t('thawbTypes.noum', { defaultValue: 'Noum' })
  };

  const renderStyleOptionsGrid = (styleOptions) => {
    const s = styleOptions || {};
    const keys = Object.keys(styleOptionLabels);
    return (
      <div className="rounded-2xl border border-gray-100 bg-white">
        <div className="p-4">
          <div className="text-sm font-semibold text-gray-900">{t('styleOptions.title', { defaultValue: 'Style Options' })}</div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {keys.map((k) => {
              const v = s?.[k];
              const hasValue = v !== undefined && v !== null && String(v).trim() !== '';
              return (
                <div key={k} className="py-2 flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-gray-600 truncate">{styleOptionLabels[k] || k}</div>
                  <div className={`text-sm font-semibold ${hasValue ? 'text-gray-900' : 'text-gray-400'}`}>{hasValue ? v : '—'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const formatDueDate = (date) => {
    try {
      if (!date) return null;
      return new Date(date).toLocaleDateString();
    } catch {
      return null;
    }
  };

  const statusOptions = [
    { key: '', label: 'All' },
    { key: 'assigned', label: t('stitchings.statusAssigned') },
    { key: 'in_progress', label: t('stitchings.statusInprogress') },
    { key: 'completed', label: t('stitchings.statusCompleted') }
  ];

  const getPrimaryMeasurements = (measurements) => {
    const m = measurements || {};
    const ordered = [
      ['length', m.length],
      ['chest', m.chest],
      ['shoulderWidth', m.shoulderWidth],
      ['sleeveLength', m.sleeveLength]
    ];
    return ordered.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '').slice(0, 4);
  };

  const getMeasurementsMeta = (measurements) => {
    const m = measurements || {};
    const extras = Object.keys(m).filter((k) => !measurementKeys.includes(k));
    const allKeys = measurementKeys.concat(extras);
    const filled = allKeys.reduce((s, k) => {
      const v = m?.[k];
      return s + (v !== undefined && v !== null && String(v).trim() !== '' ? 1 : 0);
    }, 0);
    return {
      filled,
      total: allKeys.length,
      missing: Math.max(0, allKeys.length - filled)
    };
  };

  const renderMeasurementsGrid = (measurements) => {
    const m = measurements || {};
    const extras = Object.keys(m).filter((k) => !measurementKeys.includes(k));
    const allKeys = measurementKeys.concat(extras);

    const rows = allKeys.map((key) => {
      const value = m?.[key];
      const hasValue = value !== undefined && value !== null && String(value).trim() !== '';
      return { key, value: hasValue ? value : '', hasValue };
    });

    const filledCount = rows.filter((r) => r.hasValue).length;
    const totalCount = rows.length;
    const missingCount = totalCount - filledCount;
    const progress = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

    return (
      <div className="rounded-2xl border border-gray-100 bg-white">
        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <Ruler className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{t('customers.measurements')}</div>
                <div className="text-[11px] text-gray-500 truncate">{t('common.filled', { defaultValue: 'Filled' })}: {filledCount}/{totalCount}</div>
              </div>
            </div>

            {missingCount > 0 ? (
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                <AlertCircle className="w-3.5 h-3.5" />
                {t('common.missing', { defaultValue: 'Missing' })}: {missingCount}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle className="w-3.5 h-3.5" />
                {t('common.ready', { defaultValue: 'Ready' })}
              </div>
            )}
          </div>

          <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="border-t border-gray-100" />

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {rows.map((r) => (
              <div key={r.key} className="py-2 flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-gray-600 truncate">{measurementLabels[r.key] || r.key}</div>
                <div className={`text-sm font-semibold ${r.hasValue ? 'text-gray-900' : 'text-gray-400'}`}>{r.hasValue ? r.value : '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md flex items-center justify-center">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('stitchings.title')}</h1>
            <p className="text-sm text-gray-500">{t('common.manage', { defaultValue: 'Manage your assigned stitchings' })}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statusOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setStatusFilter(opt.key)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all border shadow-sm ${
              statusFilter === opt.key
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-700 border-gray-200/70 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Stitchings Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : stitchings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stitchings.map((stitch) => (
            <Card 
              key={stitch._id} 
              className="p-5 cursor-pointer hover:shadow-md transition-shadow rounded-2xl"
              onClick={() => setDetailModal({ open: true, stitching: stitch })}
            >
              <div className="flex items-start justify-between mb-4 gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{stitch.receiptNumber}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <UserIcon className="w-4 h-4" />
                    <span className="truncate">{stitch.customerId?.nameI18n?.[langKey] || stitch.customerId?.name || '-'}</span>
                  </div>
                </div>
                <StatusBadge status={stitch.status} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                  <p className="text-[11px] font-medium text-gray-500">{t('stitchings.quantity')}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{stitch.quantity}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                  <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {t('stitchings.dueDate')}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatDueDate(stitch.dueDate) || '-'}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Ruler className="w-4 h-4 text-emerald-700" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{t('customers.measurements')}</p>
                </div>
                {(() => {
                  const meta = getMeasurementsMeta(stitch.measurements);
                  const progress = meta.total > 0 ? Math.round((meta.filled / meta.total) * 100) : 0;
                  const prim = getPrimaryMeasurements(stitch.measurements).slice(0, 2);
                  return (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] font-semibold text-gray-600">{t('common.filled', { defaultValue: 'Filled' })}: {meta.filled}/{meta.total}</div>
                        {meta.missing > 0 ? (
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {meta.missing}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {t('common.ready', { defaultValue: 'Ready' })}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
                      </div>

                      <div className="mt-2 text-[11px] text-gray-500">
                        {prim.length > 0 ? prim.map(([k, v]) => `${measurementLabels[k] || k}: ${v}`).join(' · ') : t('common.noData')}
                      </div>
                    </>
                  );
                })()}
              </div>

              {stitch.status !== 'completed' && (
                <Button
                  onClick={(e) => { e.stopPropagation(); handleStatusUpdate(stitch._id, 'completed'); }}
                  variant="success"
                  size="sm"
                  className="w-full mt-4"
                  icon={CheckCircle}
                >
                  {t('stitchings.markComplete')}
                </Button>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-gray-500 rounded-2xl">
          {t('common.noData')}
        </Card>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, stitching: null })}
        title={detailModal.stitching?.receiptNumber}
        size="lg"
      >
        {detailModal.stitching && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs text-gray-500">{t('stitchings.receiptNumber', { defaultValue: 'Receipt Number' })}</div>
                  <div className="mt-1 text-lg font-bold text-gray-900">{detailModal.stitching.receiptNumber || '-'}</div>
                  <div className="mt-2 text-xs text-gray-500">{t('stitchings.customer', { defaultValue: 'Customer' })}</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {detailModal.stitching.customerId?.nameI18n?.[langKey] || detailModal.stitching.customerId?.name || '-'}
                  </div>
                  {detailModal.stitching.customerId?.phone ? (
                    <div className="mt-1 text-sm text-gray-500">{detailModal.stitching.customerId.phone}</div>
                  ) : null}
                </div>

                <div className="flex items-start gap-3">
                  <div>
                    <div className="text-xs text-gray-500">{t('common.status', { defaultValue: 'Status' })}</div>
                    <div className="mt-1 inline-block"><StatusBadge status={detailModal.stitching.status} /></div>
                    <div className="mt-3 text-xs text-gray-500">{t('stitchings.dueDate', { defaultValue: 'Due Date' })}</div>
                    <div className="mt-1 font-semibold text-gray-900">{formatDueDate(detailModal.stitching.dueDate) || '—'}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="text-[11px] font-medium text-gray-500">{t('stitchings.quantity', { defaultValue: 'Quantity' })}</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">{detailModal.stitching.quantity || 1}</div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="text-[11px] font-medium text-gray-500">{t('stitchings.thawbType', { defaultValue: 'Thawb Type' })}</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {thawbTypeLabels[detailModal.stitching.thawbType] || detailModal.stitching.thawbType || '—'}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="text-[11px] font-medium text-gray-500">{t('stitchings.fabric', { defaultValue: 'Fabric' })}</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {detailModal.stitching.fabricId?.name || detailModal.stitching.customFabricName || detailModal.stitching.fabricColor || '—'}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="text-[11px] font-medium text-gray-500">{t('stitchings.rollsUsed', { defaultValue: 'Rolls Used' })}</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">{Number(detailModal.stitching.rollsUsed) || 0}</div>
                </div>
              </div>

              {(detailModal.stitching.orderFor || detailModal.stitching.relationId || detailModal.stitching.relationName) ? (
                <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="text-[11px] font-medium text-gray-500">{t('stitchings.orderFor', { defaultValue: 'Order For' })}</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {detailModal.stitching.orderFor || detailModal.stitching.relationName || (detailModal.stitching.relationId?.nameI18n?.[langKey] || detailModal.stitching.relationId?.name) || '—'}
                  </div>
                  {detailModal.stitching.relationType ? (
                    <div className="mt-1 text-xs text-gray-500">{detailModal.stitching.relationType}</div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <h4 className="font-medium text-gray-900 mb-2">{t('stitchings.customer')}</h4>
              <p>{detailModal.stitching.customerId?.nameI18n?.[langKey] || detailModal.stitching.customerId?.name}</p>
              <p className="text-sm text-gray-500">{detailModal.stitching.customerId?.phone}</p>
            </div>

            {/* Measurements */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('customers.measurements')}</h4>
              {renderMeasurementsGrid(detailModal.stitching.measurements)}
            </div>

            {/* Style Options */}
            <div>
              {renderStyleOptionsGrid(detailModal.stitching.styleOptions)}
            </div>

            {/* Embroidery */}
            {(detailModal.stitching.embroideryDesign?.name || detailModal.stitching.styleOptions?.embroidery) ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">{t('stitchings.embroidery', { defaultValue: 'Embroidery' })}</div>
                <div className="mt-2 text-sm text-gray-600">
                  {detailModal.stitching.embroideryDesign?.name || detailModal.stitching.styleOptions?.embroidery || '—'}
                </div>
              </div>
            ) : null}

            {/* Description */}
            {detailModal.stitching.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{t('stitchings.description')}</h4>
                <p className="text-gray-600 bg-gray-50 rounded-2xl p-4">{detailModal.stitching.description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              {detailModal.stitching.status === 'assigned' && (
                <Button 
                  onClick={() => handleStatusUpdate(detailModal.stitching._id, 'in_progress')}
                  className="flex-1"
                >
                  Start Working
                </Button>
              )}
              {detailModal.stitching.status === 'in_progress' && (
                <Button 
                  onClick={() => handleStatusUpdate(detailModal.stitching._id, 'completed')}
                  variant="success"
                  className="flex-1"
                  icon={CheckCircle}
                >
                  {t('stitchings.markComplete')}
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={() => setDetailModal({ open: false, stitching: null })}
              >
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkerStitchings;
