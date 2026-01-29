import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Scissors, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const WorkerStitchings = () => {
  const { t } = useTranslation();
  const { api } = useAuth();
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
    neck: t('measurements.neck'),
    wrist: t('measurements.wrist'),
    expansion: t('measurements.expansion'),
    armhole: t('measurements.armhole')
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Scissors className="w-8 h-8 text-emerald-500" />
        <h1 className="text-2xl font-bold text-gray-900">{t('stitchings.title')}</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'assigned', 'in_progress', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === '' ? 'All' : t(`stitchings.status${status.charAt(0).toUpperCase() + status.slice(1).replace('_', '')}`)}
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
              className="p-5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setDetailModal({ open: true, stitching: stitch })}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900">{stitch.receiptNumber}</p>
                  <p className="text-sm text-gray-500">{stitch.customerId?.name}</p>
                </div>
                <StatusBadge status={stitch.status} />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('stitchings.quantity')}:</span>
                  <span className="font-medium">{stitch.quantity}</span>
                </div>
                {stitch.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('stitchings.dueDate')}:</span>
                    <span className="font-medium">{new Date(stitch.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
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
        <Card className="p-12 text-center text-gray-500">
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
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{t('stitchings.customer')}</h4>
              <p>{detailModal.stitching.customerId?.name}</p>
              <p className="text-sm text-gray-500">{detailModal.stitching.customerId?.phone}</p>
            </div>

            {/* Measurements */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('customers.measurements')}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(detailModal.stitching.measurements || {}).map(([key, value]) => (
                  value && (
                    <div key={key} className="bg-emerald-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-emerald-600 mb-1">{measurementLabels[key] || key}</p>
                      <p className="font-semibold text-emerald-800">{value}</p>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Description */}
            {detailModal.stitching.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{t('stitchings.description')}</h4>
                <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{detailModal.stitching.description}</p>
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
