import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Printer, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import DemoBlockedModal from '../../components/ui/DemoBlockedModal';
import MeasurementImageInput from '../../components/ui/MeasurementImageInput';
import SARIcon from '../../components/ui/SARIcon';
import printStitchingInvoice from '../../utils/printStitchingInvoice';
import { formatSaudiRiyal, normalizeSaudiPhone } from '../../utils/saudi';

const computeReceiptPrefix = (businessName) => {
  const rawShop = typeof businessName === 'string' ? businessName : '';
  const shop = rawShop.trim().replace(/\s+/g, '-');
  const safeShop = shop.replace(/[^\p{L}\p{N}-]/gu, '').slice(0, 24);
  return safeShop || 'SHOP';
};

const buildSuggestedReceiptNumber = ({ businessName, receiptCounter }) => {
  const prefix = computeReceiptPrefix(businessName);
  const nextCounter = (Number(receiptCounter) || 0) + 1;
  return `${prefix}-${nextCounter}`;
};

const initialFormState = {
  customerName: '',
  phone: '+966',
  quantity: 1,
  price: '',
  paidAmount: '',
  receiptNumber: '',
  oldInvoiceNumber: '',
  dueDate: '',
  measurementImageFile: null,
  measurementImagePreview: ''
};

const InvoiceForm = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();

  const isDemo = !!user?.isDemoSession;
  const [demoBlockedOpen, setDemoBlockedOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(true);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [suggestedReceiptNumber, setSuggestedReceiptNumber] = useState('');
  const [showOldInvoiceField, setShowOldInvoiceField] = useState(false);

  const loadSuggestedReceiptNumber = useCallback(async ({ overwriteReceipt = false } = {}) => {
    setReceiptLoading(true);
    try {
      const response = await api.get('/settings');
      const settings = response.data?.settings || {};
      const suggested = buildSuggestedReceiptNumber({
        businessName: settings.businessName || user?.businessName || '',
        receiptCounter: settings.receiptCounter ?? user?.receiptCounter ?? 0
      });
      setSuggestedReceiptNumber(suggested);
      setFormData((prev) => ({
        ...prev,
        receiptNumber: overwriteReceipt ? suggested : (prev.receiptNumber || suggested)
      }));
    } catch (error) {
      const fallback = buildSuggestedReceiptNumber({
        businessName: user?.businessName || '',
        receiptCounter: user?.receiptCounter ?? 0
      });
      setSuggestedReceiptNumber(fallback);
      setFormData((prev) => ({
        ...prev,
        receiptNumber: overwriteReceipt ? fallback : (prev.receiptNumber || fallback)
      }));
    } finally {
      setReceiptLoading(false);
    }
  }, [api, user?.businessName, user?.receiptCounter]);

  useEffect(() => {
    loadSuggestedReceiptNumber();
  }, [loadSuggestedReceiptNumber]);

  const resolveUploadsUrl = useCallback((src) => {
    if (!src) return src;
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (!src.startsWith('/uploads/')) return src;
    const baseUrl = api?.defaults?.baseURL;
    if (!baseUrl || typeof baseUrl !== 'string') return src;
    try {
      if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
        return `${new URL(baseUrl).origin}${src}`;
      }
    } catch (error) {
      return src;
    }
    return src;
  }, [api]);

  const buildUploadedImageSrc = useCallback((src, updatedAt) => {
    const resolved = resolveUploadsUrl(src);
    if (!resolved) return '';
    const separator = resolved.includes('?') ? '&' : '?';
    return updatedAt ? `${resolved}${separator}v=${updatedAt}` : resolved;
  }, [resolveUploadsUrl]);

  const revokeObjectUrl = useCallback((src) => {
    if (src && typeof src === 'string' && src.startsWith('blob:')) {
      URL.revokeObjectURL(src);
    }
  }, []);

  const buildMultipartPayload = useCallback((payload, measurementImageFile) => {
    const multipart = new FormData();
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value === undefined) return;
      if (value === null) {
        multipart.append(key, '');
        return;
      }
      multipart.append(key, String(value));
    });
    if (measurementImageFile) multipart.append('measurementImage', measurementImageFile);
    return multipart;
  }, []);

  const balance = useMemo(() => {
    const price = Number(formData.price) || 0;
    const paidAmount = Number(formData.paidAmount) || 0;
    return price - paidAmount;
  }, [formData.price, formData.paidAmount]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      phone: normalizeSaudiPhone(value)
    }));
  };

  const handleOldInvoiceToggle = () => {
    setShowOldInvoiceField((prev) => {
      const next = !prev;
      if (!next) {
        setFormData((current) => ({
          ...current,
          oldInvoiceNumber: ''
        }));
      }
      return next;
    });
  };

  const resetForm = () => {
    revokeObjectUrl(formData.measurementImagePreview);
    setCreatedInvoice(null);
    setShowOldInvoiceField(false);
    setFormData({
      ...initialFormState,
      receiptNumber: suggestedReceiptNumber || buildSuggestedReceiptNumber({
        businessName: user?.businessName || '',
        receiptCounter: user?.receiptCounter ?? 0
      })
    });
    loadSuggestedReceiptNumber({ overwriteReceipt: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }

    const customerName = String(formData.customerName || '').trim();
    const phone = normalizeSaudiPhone(formData.phone);
    const receiptNumber = String(formData.receiptNumber || '').trim();
    const oldInvoiceNumber = String(formData.oldInvoiceNumber || '').trim();
    const quantity = Math.max(1, Number(formData.quantity) || 1);
    const price = Number(formData.price);
    const paidAmount = Number(formData.paidAmount || 0);
    const dueDate = String(formData.dueDate || '').trim();

    if (!customerName) {
      toast.error('Customer name is required');
      return;
    }

    if (!phone) {
      toast.error('Phone number is required');
      return;
    }

    if (!receiptNumber) {
      toast.error('Invoice number is required');
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      toast.error('Total amount is invalid');
      return;
    }

    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      toast.error('Paid amount is invalid');
      return;
    }

    if (paidAmount > price) {
      toast.error('Paid amount cannot be greater than total');
      return;
    }

    setLoading(true);
    try {
      const customerResponse = await api.post('/customers', {
        name: customerName,
        phone
      });

      const customer = customerResponse.data?.customer;
      if (!customer?._id) {
        throw new Error('Customer not created');
      }

      const payload = {
        customerId: customer._id,
        quantity,
        price,
        paidAmount,
        receiptNumber,
        oldInvoiceNumber: showOldInvoiceField ? oldInvoiceNumber : '',
        description: 'Invoice',
        dueDate: dueDate || null
      };
      const response = await api.post('/stitchings', buildMultipartPayload(payload, formData.measurementImageFile));

      const invoice = response.data?.stitching || response.data;
      await loadSuggestedReceiptNumber({ overwriteReceipt: true });
      setCreatedInvoice(invoice);
      toast.success('Invoice created successfully');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleMeasurementImageChange = (file) => {
    setFormData((prev) => {
      revokeObjectUrl(prev.measurementImagePreview);
      return {
        ...prev,
        measurementImageFile: file,
        measurementImagePreview: file ? URL.createObjectURL(file) : ''
      };
    });
  };

  const handleMeasurementImageRemove = () => {
    setFormData((prev) => {
      revokeObjectUrl(prev.measurementImagePreview);
      return {
        ...prev,
        measurementImageFile: null,
        measurementImagePreview: ''
      };
    });
  };

  if (createdInvoice) {
    return (
      <div className="max-w-md mx-auto space-y-6 animate-fadeIn">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Invoice Created!</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">
            Invoice #{createdInvoice.receiptNumber || createdInvoice._id?.slice(-6)} saved in Stitchings
          </p>

          <div className="space-y-3">
            {createdInvoice?.measurementImage ? (
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40">
                <img
                  src={buildUploadedImageSrc(createdInvoice.measurementImage, createdInvoice.measurementImageUpdatedAt)}
                  alt="Measurement"
                  className="h-56 w-full object-cover"
                />
              </div>
            ) : null}
            <Button onClick={() => printStitchingInvoice({ stitch: createdInvoice, user, resolveUploadsUrl })} icon={Printer} className="w-full">
              Print Invoice
            </Button>
            <Button variant="outline" onClick={() => navigate('/user/stitchings')} className="w-full">
              View Stitchings
            </Button>
            <Button variant="secondary" onClick={resetForm} className="w-full">
              Create Another Invoice
            </Button>
          </div>
        </Card>

        <DemoBlockedModal isOpen={demoBlockedOpen} onClose={() => setDemoBlockedOpen(false)} title="Live Demo" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/user/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 dark:text-slate-300 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Create Invoice</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Save a simple invoice and print the same stitching invoice format.</p>
        </div>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                  placeholder="+966501234567"
                  required
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
                    Invoice Number
                  </label>
                  <button
                    type="button"
                    onClick={handleOldInvoiceToggle}
                    className="text-xs font-medium text-primary-600 dark:text-primary-300 hover:underline"
                  >
                    {showOldInvoiceField ? 'Hide old invoice number' : 'Add old invoice number'}
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.receiptNumber}
                  onChange={(e) => handleChange('receiptNumber', e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                  placeholder={receiptLoading ? 'Loading invoice number...' : suggestedReceiptNumber}
                  required
                  readOnly={!receiptLoading}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">Auto-generated from your next invoice number.</p>
              </div>

              {showOldInvoiceField ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                    Old Invoice Number
                  </label>
                  <input
                    type="text"
                    value={formData.oldInvoiceNumber}
                    onChange={(e) => handleChange('oldInvoiceNumber', e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                    placeholder="Enter old invoice number for reference"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">Saved as a searchable reference without changing the new invoice number.</p>
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                  Total
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                  Paid
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.paidAmount}
                  onChange={(e) => handleChange('paidAmount', e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/10 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Quantity</p>
                  <p className="mt-1 font-bold text-gray-900 dark:text-slate-100">{Math.max(1, Number(formData.quantity) || 1)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Total</p>
                  <p className="mt-1 font-bold text-gray-900 dark:text-slate-100 inline-flex items-center gap-1">{formatSaudiRiyal(formData.price || 0)} <SARIcon className="w-3 h-3" /></p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Due Date</p>
                  <p className="mt-1 font-bold text-gray-900 dark:text-slate-100">
                    {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Pending</p>
                  <p className={`mt-1 font-bold inline-flex items-center gap-1 ${balance > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-slate-100'}`}>
                    {formatSaudiRiyal(balance)} <SARIcon className="w-3 h-3" />
                  </p>
                </div>
              </div>
            </div>

            <MeasurementImageInput
              label="Measurement Image"
              hint="Upload a measurement reference image or take a photo from the camera for this invoice."
              previewSrc={formData.measurementImagePreview}
              fileName={formData.measurementImageFile?.name || ''}
              onFileChange={handleMeasurementImageChange}
              onRemove={handleMeasurementImageRemove}
              disabled={loading}
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" icon={Save} className="sm:flex-1" disabled={loading || receiptLoading}>
                {loading ? 'Saving...' : 'Save Invoice'}
              </Button>
              <Button type="button" variant="outline" icon={Printer} className="sm:flex-1" disabled>
                Print after save
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <DemoBlockedModal isOpen={demoBlockedOpen} onClose={() => setDemoBlockedOpen(false)} title="Live Demo" />
    </div>
  );
};

export default InvoiceForm;
