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

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <Ruler className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{t('customers.measurements')}</p>
                  <p className="text-xs text-gray-500 truncate">{t('common.manage', { defaultValue: 'Review carefully before stitching' })}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-gray-700">{filledCount}/{totalCount}</div>
              <div className="text-[11px] text-gray-500">{t('common.completed', { defaultValue: 'Filled' })}</div>
            </div>
          </div>

          {missingCount > 0 ? (
            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-amber-900">{t('common.warning', { defaultValue: 'Some measurements are missing' })}</div>
                <div className="text-[11px] text-amber-800/80">{t('common.note', { defaultValue: 'Confirm missing values with the shop before starting work.' })}</div>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <div className="text-xs font-semibold text-emerald-900">{t('common.ready', { defaultValue: 'All measurements are filled' })}</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((r) => (
            <div
              key={r.key}
              className={`rounded-2xl border p-3 text-center transition-colors ${
                r.hasValue
                  ? 'border-emerald-100 bg-white shadow-sm'
                  : 'border-dashed border-gray-200 bg-gray-50/60'
              }`}
            >
              <p className="text-[11px] font-semibold text-gray-600 mb-1 truncate">{measurementLabels[r.key] || r.key}</p>
              <p className={`text-base font-extrabold ${r.hasValue ? 'text-gray-900' : 'text-gray-400'}`}>{r.hasValue ? r.value : '—'}</p>
              <p className={`mt-1 text-[11px] ${r.hasValue ? 'text-emerald-700' : 'text-gray-400'}`}>{r.hasValue ? t('common.filled', { defaultValue: 'Filled' }) : t('common.missing', { defaultValue: 'Missing' })}</p>
            </div>
          ))}
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
                <div className="grid grid-cols-2 gap-2">
                  {getPrimaryMeasurements(stitch.measurements).length > 0 ? (
                    getPrimaryMeasurements(stitch.measurements).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-xl bg-gray-50/60 px-3 py-2">
                        <span className="text-[11px] font-medium text-gray-500 truncate">{measurementLabels[key] || key}</span>
                        <span className="text-xs font-semibold text-gray-900">{value}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-sm text-gray-500">{t('common.noData')}</div>
                  )}
                </div>

                {(() => {
                  const meta = getMeasurementsMeta(stitch.measurements);
                  return (
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-[11px] font-semibold text-gray-600">
                        {t('common.filled', { defaultValue: 'Filled' })}: {meta.filled}/{meta.total}
                      </div>
                      {meta.missing > 0 ? (
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {t('common.missing', { defaultValue: 'Missing' })}: {meta.missing}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {t('common.ready', { defaultValue: 'Ready' })}
                        </div>
                      )}
                    </div>
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
