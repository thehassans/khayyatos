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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center">
            <Scissors className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">KHAYYAT OS</h1>
            <p className="text-xs text-gray-500">Order Tracking</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Manual Search */}
        {!orderId && !loading && (
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Track Your Order</h2>
            <p className="text-gray-500 mb-6">Enter your order ID or receipt number</p>
            <form onSubmit={handleManualSearch} className="flex gap-2 max-w-sm mx-auto">
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="Enter Order ID"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Track
              </button>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading order details...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">😕</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/track-order'}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Order Found */}
        {order && !loading && (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <h2 className="text-2xl font-bold text-gray-900">#{order.receiptNumber || order._id?.slice(-6)}</h2>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  order.status === 'done' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {order.status === 'done' ? 'Ready for Pickup' : 'In Progress'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900">{order.customerName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Due Date</p>
                  <p className="font-medium text-gray-900">{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6">
              <h3 className="font-semibold text-gray-900 mb-6">Order Progress</h3>
              
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div 
                  className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-amber-500 to-emerald-500 transition-all duration-500"
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
                              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30' 
                              : 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                            {step.label}
                          </p>
                          <p className={`text-sm ${isCompleted ? 'text-gray-500' : 'text-gray-300'}`}>
                            {step.labelAr}
                          </p>
                        </div>
                        {isCompleted && (
                          <CheckCircle className={`w-5 h-5 ${isCurrent ? 'text-amber-500' : 'text-emerald-500'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Quantity</span>
                  <span className="font-medium">{order.quantity || 1}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Total Price</span>
                  <span className="font-medium flex items-center gap-1">{order.price || 0} <SARIcon className="w-4 h-4" /></span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Paid Amount</span>
                  <span className="font-medium text-emerald-600 flex items-center gap-1">{order.paidAmount || 0} <SARIcon className="w-4 h-4" /></span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Balance Due</span>
                  <span className="font-medium text-amber-600 flex items-center gap-1">{(order.price || 0) - (order.paidAmount || 0)} <SARIcon className="w-4 h-4" /></span>
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
        <div className="text-center text-xs text-gray-400 mt-8">
          Powered by KHAYYAT OS
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
