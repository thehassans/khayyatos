import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { 
  MessageCircle, Send, Settings, CheckCircle, XCircle, 
  Zap, Bell, Package, Truck, ExternalLink, Info, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const WhatsApp = () => {
  const { t } = useTranslation();
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testPhone, setTestPhone] = useState('+966');
  
  const [settings, setSettings] = useState({
    enabled: false,
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    autoMessageOnOrder: true,
    autoMessageOnReady: true,
    autoMessageOnDelivery: true,
    orderMessageTemplate: '',
    readyMessageTemplate: '',
    deliveryMessageTemplate: ''
  });

  const defaultTemplates = {
    order: 'Thank you for your order at {businessName}! Your order #{receiptNumber} has been received. Total: {price} SAR. Due date: {dueDate}. We will notify you when it is ready.\n\nشكراً لطلبكم من {businessName}! تم استلام طلبكم رقم #{receiptNumber}. المبلغ: {price} ريال. موعد التسليم: {dueDate}.',
    ready: 'Good news! Your order #{receiptNumber} at {businessName} is ready for pickup. Please visit us at your earliest convenience.\n\nأخبار سارة! طلبكم رقم #{receiptNumber} جاهز للاستلام. نتطلع لزيارتكم!',
    delivery: 'Thank you for choosing {businessName}! Your order #{receiptNumber} has been delivered. We hope to serve you again soon!\n\nشكراً لاختياركم {businessName}! تم تسليم طلبكم رقم #{receiptNumber}. نتمنى خدمتكم مرة أخرى!'
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/whatsapp/settings');
      setSettings({
        ...response.data,
        accessToken: '',
        orderMessageTemplate: response.data.orderMessageTemplate || defaultTemplates.order,
        readyMessageTemplate: response.data.readyMessageTemplate || defaultTemplates.ready,
        deliveryMessageTemplate: response.data.deliveryMessageTemplate || defaultTemplates.delivery
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const dataToSave = { ...settings };
      if (!dataToSave.accessToken) delete dataToSave.accessToken;
      
      await api.put('/whatsapp/settings', dataToSave);
      toast.success('Settings saved successfully!');
      fetchSettings();
    } catch (error) {
      toast.error('Failed to save settings');
    }
    setLoading(false);
  };

  const handleVerifyConnection = async () => {
    setVerifying(true);
    try {
      const response = await api.post('/whatsapp/verify');
      if (response.data.success) {
        setConnectionStatus({
          success: true,
          phoneNumber: response.data.phoneNumber,
          verifiedName: response.data.verifiedName,
          qualityRating: response.data.qualityRating
        });
        toast.success('Connection verified!');
      } else {
        setConnectionStatus({ success: false, error: response.data.error });
        toast.error(response.data.error || 'Verification failed');
      }
    } catch (error) {
      setConnectionStatus({ success: false, error: error.response?.data?.error || 'Connection failed' });
      toast.error(error.response?.data?.error || 'Connection failed');
    }
    setVerifying(false);
  };

  const handleTestMessage = async () => {
    if (!testPhone || testPhone.length < 10) {
      toast.error('Enter a valid phone number');
      return;
    }
    setTesting(true);
    try {
      const response = await api.post('/whatsapp/test', { phone: testPhone });
      if (response.data.success) {
        toast.success('Test message sent!');
      } else {
        toast.error(response.data.error || 'Failed to send test message');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send test message');
    }
    setTesting(false);
  };

  const tabs = [
    { id: 'settings', label: 'API Settings', icon: Settings },
    { id: 'automation', label: 'Auto Messages', icon: Zap },
    { id: 'templates', label: 'Templates', icon: MessageCircle }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">WhatsApp Integration</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Live auto-messaging via WhatsApp Cloud API</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {settings.enabled ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Enabled
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-full text-sm font-medium">
              <XCircle className="w-4 h-4" /> Disabled
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* API Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Setup Guide */}
          <Card className="p-5 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Setup WhatsApp Cloud API</h3>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">developers.facebook.com</a> and create an app</li>
                  <li>Add WhatsApp product to your app</li>
                  <li>Get your Phone Number ID and Access Token from the WhatsApp dashboard</li>
                  <li>Paste them below and verify the connection</li>
                </ol>
                <a 
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" /> View Documentation
                </a>
              </div>
            </div>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">API Credentials</h2>
            </div>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-gray-700 dark:text-slate-200">
                  Enable WhatsApp Integration
                </label>
              </div>

              <Input
                label="Phone Number ID"
                value={settings.phoneNumberId}
                onChange={(e) => setSettings({ ...settings, phoneNumberId: e.target.value })}
                placeholder="e.g., 123456789012345"
              />

              <Input
                label="Access Token"
                type="password"
                value={settings.accessToken}
                onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                placeholder={settings.hasAccessToken ? '••••••••••••••••' : 'Paste your access token'}
              />

              <Input
                label="Business Account ID (Optional)"
                value={settings.businessAccountId}
                onChange={(e) => setSettings({ ...settings, businessAccountId: e.target.value })}
                placeholder="e.g., 123456789012345"
              />

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSaveSettings} loading={loading}>
                  Save Settings
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleVerifyConnection} 
                  loading={verifying}
                  icon={RefreshCw}
                >
                  Verify Connection
                </Button>
              </div>

              {connectionStatus && (
                <div className={`p-4 rounded-lg ${
                  connectionStatus.success 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  {connectionStatus.success ? (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="font-medium text-emerald-800 dark:text-emerald-200">Connected Successfully!</p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                          Phone: {connectionStatus.phoneNumber}<br />
                          Name: {connectionStatus.verifiedName}<br />
                          Quality: {connectionStatus.qualityRating}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">Connection Failed</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{connectionStatus.error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Test Message */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">Send Test Message</h2>
            </div>
            <CardBody>
              <div className="flex gap-3">
                <Input
                  placeholder="+966501234567"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleTestMessage} loading={testing} icon={Send}>
                  Send Test
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Auto Messages Tab */}
      {activeTab === 'automation' && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Automatic Notifications</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Configure when to automatically send WhatsApp messages to customers</p>
          </div>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">New Order</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Send confirmation when order is placed</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoMessageOnOrder}
                onChange={(e) => setSettings({ ...settings, autoMessageOnOrder: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">Order Ready</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Notify when order is ready for pickup</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoMessageOnReady}
                onChange={(e) => setSettings({ ...settings, autoMessageOnReady: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">Order Delivered</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Send thank you message after delivery</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoMessageOnDelivery}
                onChange={(e) => setSettings({ ...settings, autoMessageOnDelivery: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveSettings} loading={loading}>
                Save Settings
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Available Variables</h3>
            <div className="flex flex-wrap gap-2">
              {['{businessName}', '{receiptNumber}', '{customerName}', '{price}', '{paidAmount}', '{balance}', '{dueDate}'].map((v) => (
                <code key={v} className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded text-sm">
                  {v}
                </code>
              ))}
            </div>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">New Order Message</h2>
            </div>
            <CardBody>
              <Textarea
                value={settings.orderMessageTemplate}
                onChange={(e) => setSettings({ ...settings, orderMessageTemplate: e.target.value })}
                rows={4}
                placeholder="Message sent when a new order is created..."
              />
              <button 
                onClick={() => setSettings({ ...settings, orderMessageTemplate: defaultTemplates.order })}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mt-2"
              >
                Reset to default
              </button>
            </CardBody>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">Order Ready Message</h2>
            </div>
            <CardBody>
              <Textarea
                value={settings.readyMessageTemplate}
                onChange={(e) => setSettings({ ...settings, readyMessageTemplate: e.target.value })}
                rows={4}
                placeholder="Message sent when order is ready for pickup..."
              />
              <button 
                onClick={() => setSettings({ ...settings, readyMessageTemplate: defaultTemplates.ready })}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mt-2"
              >
                Reset to default
              </button>
            </CardBody>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">Delivery Message</h2>
            </div>
            <CardBody>
              <Textarea
                value={settings.deliveryMessageTemplate}
                onChange={(e) => setSettings({ ...settings, deliveryMessageTemplate: e.target.value })}
                rows={4}
                placeholder="Message sent after order is delivered..."
              />
              <button 
                onClick={() => setSettings({ ...settings, deliveryMessageTemplate: defaultTemplates.delivery })}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mt-2"
              >
                Reset to default
              </button>
            </CardBody>
          </Card>

          <Button onClick={handleSaveSettings} loading={loading}>
            Save All Templates
          </Button>
        </div>
      )}
    </div>
  );
};

export default WhatsApp;
