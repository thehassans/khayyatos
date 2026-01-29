import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Scissors, CheckCircle, Clock, Sparkles, Droplets, Package } from 'lucide-react';
import SARIcon from '../../components/ui/SARIcon';

const ORDER_STEPS = [
  { value: 'pending', label: 'Pending', labelAr: 'قيد الانتظار', icon: Clock, color: 'gray' },
  { value: 'stitching', label: 'Stitching', labelAr: 'الخياطة', icon: Scissors, color: 'blue' },
  { value: 'finishing', label: 'Finishing', labelAr: 'التشطيب', icon: Sparkles, color: 'purple' },
  { value: 'laundry', label: 'Laundry', labelAr: 'الغسيل', icon: Droplets, color: 'cyan' },
  { value: 'done', label: 'Done', labelAr: 'جاهز', icon: CheckCircle, color: 'green' }
];

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualId, setManualId] = useState('');

  const orderId = searchParams.get('id');

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrder = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/track/${id}`);
      if (!response.ok) throw new Error('Order not found');
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError('Order not found. Please check the order ID.');
    }
    setLoading(false);
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      window.location.href = `/track-order?id=${manualId.trim()}`;
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    return ORDER_STEPS.findIndex(s => s.value === order.status);
  };

  const currentStep = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-2xl px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-400/25 via-white/10 to-amber-400/25 rounded-2xl flex items-center justify-center border border-amber-300/20 shadow-2xl">
            <Scissors className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-white tracking-wide">KHAYYAT OS</h1>
            <p className="text-xs text-white/55 tracking-widest uppercase">Order Tracking / تتبع الطلب</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Manual Search */}
        {!orderId && !loading && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl shadow-2xl shadow-black/50 p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-white/55" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Track Your Order / تتبع طلبك</h2>
            <p className="text-white/55 mb-6">Enter order ID or receipt / أدخل رقم الطلب أو الإيصال</p>
            <form onSubmit={handleManualSearch} className="flex gap-2 max-w-sm mx-auto">
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="Order ID / Receipt"
                className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-2xl font-semibold tracking-wide hover:shadow-2xl hover:shadow-amber-500/20 transition-all"
              >
                Track
              </button>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl shadow-2xl shadow-black/50 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto"></div>
            <p className="text-white/55 mt-4">Loading order details... / جاري تحميل تفاصيل الطلب...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl shadow-2xl shadow-black/50 p-8 text-center">
            <div className="w-16 h-16 bg-rose-500/15 rounded-3xl border border-rose-400/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">😕</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Order Not Found / الطلب غير موجود</h2>
            <p className="text-white/55 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/track-order'}
              className="px-6 py-3 bg-white/10 text-white rounded-2xl font-medium hover:bg-white/15 transition-all"
            >
              Try Again / حاول مرة أخرى
            </button>
          </div>
        )}

        {/* Order Found */}
        {order && !loading && (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl shadow-2xl shadow-black/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-white/55">Order Number / رقم الطلب</p>
                  <h2 className="text-2xl font-bold text-white">#{order.receiptNumber || order._id?.slice(-6)}</h2>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  order.status === 'done' 
                    ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/20' 
                    : 'bg-amber-500/15 text-amber-200 border border-amber-300/20'
                }`}>
                  {order.status === 'done' ? 'Ready / جاهز' : 'In Progress / جاري العمل'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/55">Customer / العميل</p>
                  <p className="font-medium text-white">{order.customerName || '-'}</p>
                </div>
                <div>
                  <p className="text-white/55">Due Date / تاريخ التسليم</p>
                  <p className="font-medium text-white">{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl shadow-2xl shadow-black/50 p-6">
              <h3 className="font-semibold text-white mb-6">Order Progress / حالة الطلب</h3>
              
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10"></div>
                <div 
                  className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-amber-400 to-emerald-400 transition-all duration-500"
                  style={{ height: `${Math.max(0, (currentStep / (ORDER_STEPS.length - 1)) * 100)}%` }}
                ></div>

                {/* Steps */}
                <div className="space-y-6">
                  {ORDER_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;
                    
                    return (
                      <div key={step.value} className="flex items-center gap-4 relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                          isCompleted 
                            ? isCurrent 
                              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/30' 
                              : 'bg-emerald-500 text-white'
                            : 'bg-white/10 text-white/40'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isCompleted ? 'text-white' : 'text-white/40'}`}>
                            {step.label}
                          </p>
                          <p className={`text-sm ${isCompleted ? 'text-white/55' : 'text-white/25'}`}>
                            {step.labelAr}
                          </p>
                        </div>
                        {isCompleted && (
                          <CheckCircle className={`w-5 h-5 ${isCurrent ? 'text-amber-400' : 'text-emerald-400'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl shadow-2xl shadow-black/50 p-6">
              <h3 className="font-semibold text-white mb-4">Order Details / تفاصيل الطلب</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/55">Quantity / الكمية</span>
                  <span className="font-medium text-white">{order.quantity || 1}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/55">Total Price / السعر الإجمالي</span>
                  <span className="font-medium flex items-center gap-1 text-white">{order.price || 0} <SARIcon className="w-4 h-4" /></span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-white/55">Paid Amount / المدفوع</span>
                  <span className="font-medium text-emerald-300 flex items-center gap-1">{order.paidAmount || 0} <SARIcon className="w-4 h-4" /></span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-white/55">Balance Due / المتبقي</span>
                  <span className="font-medium text-amber-300 flex items-center gap-1">{(order.price || 0) - (order.paidAmount || 0)} <SARIcon className="w-4 h-4" /></span>
                </div>
              </div>
            </div>

            {/* Shop Info */}
            {order.shopName && (
              <div className="text-center text-sm text-gray-500 py-4">
                <p>{order.shopName}</p>
                {order.shopPhone && <p>{order.shopPhone}</p>}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-white/35 mt-10">
          Powered by KHAYYAT OS / بدعم من KHAYYAT OS
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
