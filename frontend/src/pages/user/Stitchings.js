import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { Plus, Search, UserPlus, Trash2, Printer } from 'lucide-react';
import SARIcon from '../../components/ui/SARIcon';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

const Stitchings = () => {
  const { t } = useTranslation();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stitchings, setStitchings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignModal, setAssignModal] = useState({ open: false, stitching: null });

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearch((prev) => (prev === q ? prev : q));
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      
      const [stitchRes, workersRes] = await Promise.all([
        api.get(`/stitchings?${params}`),
        api.get('/worker')
      ]);
      const stitchData = stitchRes.data;
      const workerData = workersRes.data;
      setStitchings(Array.isArray(stitchData) ? stitchData : stitchData.stitchings || []);
      setWorkers(Array.isArray(workerData) ? workerData : workerData.workers || []);
    } catch (error) {
      console.error('Error:', error);
      setStitchings([]);
      setWorkers([]);
    }
    setLoading(false);
  };

  const handleAssign = async (workerId) => {
    try {
      await api.put(`/stitchings/${assignModal.stitching._id}/assign`, { workerId });
      toast.success('Worker assigned');
      setAssignModal({ open: false, stitching: null });
      fetchData();
    } catch (error) {
      toast.error('Failed to assign');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await api.delete(`/stitchings/${id}`);
      toast.success('Deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/stitchings/${id}`, { status });
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handlePrintLabel = async (stitch) => {
    const logoSrc = user?.logo && user.logo !== 'null' && user.logo !== 'undefined' ? user.logo : '';
    const labelLang = user?.labelLanguage || 'both';
    
    // Generate QR code
    let qrCodeUrl = '';
    let zatcaQrUrl = '';
    const zatcaEnabled = user?.zatcaSettings?.enabled && user?.zatcaSettings?.showOnInvoice;
    
    try {
      // Track order QR
      qrCodeUrl = await QRCode.toDataURL(`${window.location.origin}/track-order?id=${stitch._id}`, { width: 100, margin: 1 });
      
      // ZATCA QR if enabled
      if (zatcaEnabled && user?.zatcaSettings?.vatNumber) {
        const vatRate = 0.15;
        const total = parseFloat(stitch.price) || 0;
        const vatAmount = (total * vatRate / (1 + vatRate)).toFixed(2);
        const timestamp = new Date().toISOString();
        
        // Generate TLV encoded ZATCA QR data
        const tlvData = generateTLV([
          { tag: 1, value: user?.businessName || '' },
          { tag: 2, value: user?.zatcaSettings?.vatNumber || '' },
          { tag: 3, value: timestamp },
          { tag: 4, value: total.toFixed(2) },
          { tag: 5, value: vatAmount }
        ]);
        zatcaQrUrl = await QRCode.toDataURL(tlvData, { width: 100, margin: 1 });
      }
    } catch (err) {
      console.error('QR generation error:', err);
    }
    
    // TLV encoding helper
    function generateTLV(fields) {
      let result = [];
      fields.forEach(f => {
        const value = String(f.value);
        const valueBytes = new TextEncoder().encode(value);
        result.push(f.tag, valueBytes.length, ...valueBytes);
      });
      return btoa(String.fromCharCode(...result));
    }
    
    const labels = {
      customer: { en: 'Customer', ar: 'العميل' },
      phone: { en: 'Phone', ar: 'الهاتف' },
      quantity: { en: 'Quantity', ar: 'الكمية' },
      price: { en: 'Price', ar: 'السعر' },
      paid: { en: 'Paid', ar: 'المدفوع' },
      balance: { en: 'Balance', ar: 'المتبقي' },
      dueDate: { en: 'Due Date', ar: 'تاريخ التسليم' },
      status: { en: 'Status', ar: 'الحالة' },
      scanToTrack: { en: 'Scan to track order', ar: 'امسح لتتبع الطلب' }
    };
    
    const getLabel = (key) => {
      if (labelLang === 'en') return labels[key].en;
      if (labelLang === 'ar') return labels[key].ar;
      return `${labels[key].en} / ${labels[key].ar}`;
    };
    
    const statusLabels = {
      pending: { en: 'Pending', ar: 'قيد الانتظار' },
      assigned: { en: 'Assigned', ar: 'تم التعيين' },
      in_progress: { en: 'In Progress', ar: 'جاري العمل' },
      completed: { en: 'Completed', ar: 'مكتمل' },
      delivered: { en: 'Delivered', ar: 'تم التسليم' }
    };
    
    const getStatusLabel = (status) => {
      const s = statusLabels[status] || { en: status, ar: status };
      if (labelLang === 'en') return s.en;
      if (labelLang === 'ar') return s.ar;
      return `${s.en} / ${s.ar}`;
    };
    
    const balance = (parseFloat(stitch.price) || 0) - (parseFloat(stitch.paidAmount) || 0);
    
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${labelLang === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <title>Print Label</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; padding: 8px; width: 80mm; }
          .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 10px; margin-bottom: 8px; }
          .logo { width: 60px; height: 60px; object-fit: contain; margin: 0 auto 8px; display: block; border-radius: 8px; }
          .shop-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
          .shop-name-ar { font-size: 13px; font-weight: bold; direction: rtl; color: #333; }
          .shop-address { font-size: 9px; color: #666; margin-top: 4px; }
          .receipt-no { font-size: 16px; font-weight: bold; margin: 8px 0; text-align: center; }
          .info-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ccc; }
          .label { color: #666; }
          .value { font-weight: 600; }
          .qr-container { display: flex; justify-content: center; gap: 16px; margin-top: 12px; padding-top: 12px; border-top: 2px dashed #333; }
          .qr-box { flex: 1; text-align: center; max-width: 100px; }
          .qr-box img { width: 70px; height: 70px; border: 2px solid #e5e7eb; border-radius: 8px; padding: 4px; background: #fff; }
          .qr-label { font-size: 8px; color: #374151; margin-top: 6px; font-weight: 600; line-height: 1.2; }
          .qr-sublabel { font-size: 7px; color: #6b7280; margin-top: 2px; }
          .single-qr { text-align: center; margin-top: 12px; padding-top: 12px; border-top: 2px dashed #333; }
          .single-qr img { width: 80px; height: 80px; border: 2px solid #e5e7eb; border-radius: 8px; padding: 4px; background: #fff; }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoSrc ? `<img src="${logoSrc}" class="logo" />` : ''}
          <div class="shop-name">${user?.businessName || 'Tailor Shop'}</div>
          ${user?.businessNameAr ? `<div class="shop-name-ar">${user.businessNameAr}</div>` : ''}
          ${user?.businessAddress ? `<div class="shop-address">${user.businessAddress}</div>` : ''}
        </div>
        <div class="receipt-no">#${stitch.receiptNumber || stitch._id?.slice(-6) || 'N/A'}</div>
        <div class="info-row"><span class="label">${getLabel('customer')}</span><span class="value">${stitch.customerId?.name || '-'}</span></div>
        <div class="info-row"><span class="label">${getLabel('phone')}</span><span class="value">${stitch.customerId?.phone || '-'}</span></div>
        <div class="info-row"><span class="label">${getLabel('quantity')}</span><span class="value">${stitch.quantity}</span></div>
        <div class="info-row"><span class="label">${getLabel('price')}</span><span class="value">${stitch.price} SAR</span></div>
        <div class="info-row"><span class="label">${getLabel('paid')}</span><span class="value">${stitch.paidAmount || 0} SAR</span></div>
        <div class="info-row"><span class="label">${getLabel('balance')}</span><span class="value" style="color: ${balance > 0 ? '#dc2626' : '#16a34a'}">${balance} SAR</span></div>
        <div class="info-row"><span class="label">${getLabel('dueDate')}</span><span class="value">${stitch.dueDate ? new Date(stitch.dueDate).toLocaleDateString() : '-'}</span></div>
        <div class="info-row"><span class="label">${getLabel('status')}</span><span class="value">${getStatusLabel(stitch.status)}</span></div>
        ${zatcaQrUrl && qrCodeUrl ? `
        <div class="qr-container">
          <div class="qr-box">
            <img src="${zatcaQrUrl}" alt="ZATCA QR" />
            <div class="qr-label">ZATCA</div>
            <div class="qr-sublabel">فاتورة إلكترونية</div>
          </div>
          <div class="qr-box">
            <img src="${qrCodeUrl}" alt="Track QR" />
            <div class="qr-label">Track Order</div>
            <div class="qr-sublabel">تتبع الطلب</div>
          </div>
        </div>
        ` : qrCodeUrl ? `
        <div class="single-qr">
          <img src="${qrCodeUrl}" alt="QR Code" />
          <div class="qr-label" style="font-size: 9px; margin-top: 6px;">${getLabel('scanToTrack')}</div>
        </div>
        ` : ''}
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('stitchings.title')}</h1>
        <Button onClick={() => navigate('/user/stitchings/new')} icon={Plus}>
          {t('stitchings.createOrder')}
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('stitchings.receiptNumber')}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100"
          >
            <option value="">All Status</option>
            <option value="pending">{t('stitchings.statusPending')}</option>
            <option value="assigned">{t('stitchings.statusAssigned')}</option>
            <option value="in_progress">{t('stitchings.statusInProgress')}</option>
            <option value="completed">{t('stitchings.statusCompleted')}</option>
            <option value="delivered">{t('stitchings.statusDelivered')}</option>
          </select>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : stitchings.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>{t('stitchings.receiptNumber')}</Th>
                <Th>{t('stitchings.customer')}</Th>
                <Th>{t('stitchings.worker')}</Th>
                <Th>{t('stitchings.quantity')}</Th>
                <Th>{t('stitchings.price')}</Th>
                <Th>Payment</Th>
                <Th>{t('common.status')}</Th>
                <Th>{t('common.actions')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {stitchings.map((stitch) => (
                <Tr key={stitch._id}>
                  <Td className="font-medium">{stitch.receiptNumber}</Td>
                  <Td>
                    <div>
                      <p className="font-medium">{stitch.customerName || stitch.customerId?.name || '-'}</p>
                      {stitch.orderFor && stitch.orderFor !== (stitch.customerName || stitch.customerId?.name) && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">For: {stitch.orderFor}</p>
                      )}
                    </div>
                  </Td>
                  <Td>
                    {stitch.workerId ? (
                      <button
                        onClick={() => setAssignModal({ open: true, stitching: stitch })}
                        className="group flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-all cursor-pointer"
                        title="Click to change worker"
                      >
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{stitch.workerId.name?.charAt(0)}</span>
                        </div>
                        <span className="text-emerald-700 dark:text-emerald-300 font-medium text-sm">{stitch.workerId.name}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setAssignModal({ open: true, stitching: stitch })}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg transition-all"
                      >
                        <UserPlus className="w-4 h-4 text-primary-600 dark:text-primary-300" />
                        <span className="text-primary-600 dark:text-primary-300 font-medium text-sm">{t('stitchings.assignWorker')}</span>
                      </button>
                    )}
                  </Td>
                  <Td>{stitch.quantity}</Td>
                  <Td className="flex items-center gap-1">{stitch.price} <SARIcon className="w-3 h-3" /></Td>
                  <Td>
                    {(parseFloat(stitch.paidAmount) || 0) >= (parseFloat(stitch.price) || 0) ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
                        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-white tracking-wide">PAID</span>
                      </div>
                    ) : (parseFloat(stitch.paidAmount) || 0) > 0 ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-white tracking-wide">PARTIAL</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30">
                        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-white tracking-wide">PENDING</span>
                      </div>
                    )}
                  </Td>
                  <Td>
                    <select
                      value={stitch.status}
                      onChange={(e) => handleStatusChange(stitch._id, e.target.value)}
                      className="text-sm bg-transparent border-none cursor-pointer text-gray-700 dark:text-slate-200"
                    >
                      <option value="pending">{t('stitchings.statusPending')}</option>
                      <option value="assigned">{t('stitchings.statusAssigned')}</option>
                      <option value="in_progress">{t('stitchings.statusInProgress')}</option>
                      <option value="completed">{t('stitchings.statusCompleted')}</option>
                      <option value="delivered">{t('stitchings.statusDelivered')}</option>
                    </select>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePrintLabel(stitch)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-lg"
                        title="Print Label"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(stitch._id)}
                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <div className="p-12 text-center text-gray-500 dark:text-slate-400">{t('common.noData')}</div>
        )}
      </Card>

      {/* Assign Worker Modal */}
      <Modal 
        isOpen={assignModal.open} 
        onClose={() => setAssignModal({ open: false, stitching: null })} 
        title={t('stitchings.assignWorker')}
      >
        <div className="space-y-3">
          {workers.filter(w => w.isActive).map((worker) => (
            <button
              key={worker._id}
              onClick={() => handleAssign(worker._id)}
              className="w-full p-4 bg-gray-50 dark:bg-slate-800/40 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-3 transition-colors"
            >
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <span className="text-emerald-700 dark:text-emerald-200 font-medium">{worker.name?.charAt(0)}</span>
              </div>
              <div className="text-left">
                <p className="font-medium">{worker.name}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">{worker.phone}</p>
              </div>
            </button>
          ))}
          {workers.filter(w => w.isActive).length === 0 && (
            <p className="text-center text-gray-500 dark:text-slate-400 py-4">{t('common.noData')}</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Stitchings;
