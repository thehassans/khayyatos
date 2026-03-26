import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { 
  MessageCircle, Send, Settings, CheckCircle, XCircle, 
  Zap, Bell, Package, Truck, ExternalLink, Info, RefreshCw,
  Receipt, Clock, Users, FileText, Lock, Phone, Sparkles, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const GOLD = '#D5B25B';

const WhatsApp = () => {
  const { t } = useTranslation();
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testPhone, setTestPhone] = useState('+966');
  const [addonStatus, setAddonStatus] = useState({ activated: false, pricing: {} });
  const [addonLoading, setAddonLoading] = useState(true);
  
  const [sendingReminders, setSendingReminders] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    autoMessageOnOrder: true,
    autoMessageOnReady: true,
    autoMessageOnDelivery: true,
    autoInvoice: false,
    autoStatusUpdate: false,
    autoDueReminder: false,
    orderMessageTemplate: '',
    readyMessageTemplate: '',
    deliveryMessageTemplate: '',
    invoiceMessageTemplate: '',
    statusUpdateMessageTemplate: '',
    dueReminderMessageTemplate: ''
  });

  const defaultTemplates = {
    order: 'Thank you for your order at {businessName}! Your order #{receiptNumber} has been received. Total: {price} SAR. Due date: {dueDate}. We will notify you when it is ready.\n\nشكراً لطلبكم من {businessName}! تم استلام طلبكم رقم #{receiptNumber}. المبلغ: {price} ريال. موعد التسليم: {dueDate}.',
    ready: 'Good news! Your order #{receiptNumber} at {businessName} is ready for pickup. Please visit us at your earliest convenience.\n\nأخبار سارة! طلبكم رقم #{receiptNumber} جاهز للاستلام. نتطلع لزيارتكم!',
    delivery: 'Thank you for choosing {businessName}! Your order #{receiptNumber} has been delivered. We hope to serve you again soon!\n\nشكراً لاختياركم {businessName}! تم تسليم طلبكم رقم #{receiptNumber}. نتمنى خدمتكم مرة أخرى!',
    invoice: '🧾 Invoice from {businessName}\n\nOrder: #{receiptNumber}\nCustomer: {customerName}\nTotal: {price} SAR\nPaid: {paidAmount} SAR\nBalance: {balance} SAR\nDue Date: {dueDate}\n\nThank you for your business!',
    statusUpdate: '📋 Order Update from {businessName}\n\nYour order #{receiptNumber} status has been updated to: {status}\n\nWe will keep you informed of any further changes.',
    dueReminder: '⏰ Reminder from {businessName}\n\nYour order #{receiptNumber} is due on {dueDate}. Please visit us to collect your order.\n\nBalance remaining: {balance} SAR'
  };

  useEffect(() => {
    fetchAddonStatus();
    fetchSettings();
  }, []);

  const fetchAddonStatus = async () => {
    try {
      const res = await api.get('/whatsapp/addon-status');
      setAddonStatus(res.data);
    } catch (e) { console.error(e); }
    setAddonLoading(false);
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/whatsapp/settings');
      setSettings({
        ...response.data,
        accessToken: '',
        orderMessageTemplate: response.data.orderMessageTemplate || defaultTemplates.order,
        readyMessageTemplate: response.data.readyMessageTemplate || defaultTemplates.ready,
        deliveryMessageTemplate: response.data.deliveryMessageTemplate || defaultTemplates.delivery,
        invoiceMessageTemplate: response.data.invoiceMessageTemplate || defaultTemplates.invoice,
        statusUpdateMessageTemplate: response.data.statusUpdateMessageTemplate || defaultTemplates.statusUpdate,
        dueReminderMessageTemplate: response.data.dueReminderMessageTemplate || defaultTemplates.dueReminder
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
      toast.success(t('whatsapp.saveSettings') + ' ✓');
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
        setConnectionStatus({ success: true, phoneNumber: response.data.phoneNumber, verifiedName: response.data.verifiedName, qualityRating: response.data.qualityRating });
        toast.success(t('whatsapp.connectedSuccess'));
      } else {
        setConnectionStatus({ success: false, error: response.data.error });
        toast.error(response.data.error || t('whatsapp.connectionFailed'));
      }
    } catch (error) {
      setConnectionStatus({ success: false, error: error.response?.data?.error || t('whatsapp.connectionFailed') });
      toast.error(error.response?.data?.error || t('whatsapp.connectionFailed'));
    }
    setVerifying(false);
  };

  const handleTestMessage = async () => {
    if (!testPhone || testPhone.length < 10) { toast.error('Enter a valid phone number'); return; }
    setTesting(true);
    try {
      const response = await api.post('/whatsapp/test', { phone: testPhone });
      if (response.data.success) toast.success('Test message sent!');
      else toast.error(response.data.error || 'Failed');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    }
    setTesting(false);
  };

  const isActive = addonStatus.activated;
  const billingLabel = { monthly: t('whatsapp.monthly'), yearly: t('whatsapp.yearly'), 'one-time': t('whatsapp.oneTime') };

  const addonFeatures = [
    { key: 'featureAutoMsg', icon: Zap, color: 'emerald' },
    { key: 'featureAutoInvoice', icon: Receipt, color: 'blue' },
    { key: 'featureStatusUpdate', icon: Bell, color: 'purple' },
    { key: 'featureTemplates', icon: FileText, color: 'amber' },
    { key: 'featureDueReminder', icon: Clock, color: 'rose' },
    { key: 'featureBulkMsg', icon: Users, color: 'indigo' }
  ];

  const colorMap = {
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
    rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' }
  };

  const tabs = [
    { id: 'overview', label: t('whatsapp.addonBadge'), icon: Sparkles },
    ...(isActive ? [
      { id: 'settings', label: t('whatsapp.tabSettings'), icon: Settings },
      { id: 'automation', label: t('whatsapp.tabAutomation'), icon: Zap },
      { id: 'templates', label: t('whatsapp.tabTemplates'), icon: MessageCircle }
    ] : [])
  ];

  if (addonLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-gray-200 dark:border-slate-700 border-t-emerald-500 rounded-full" />
      </div>
    );
  }

  return (
    <div data-tutorial="page-whatsapp" className="space-y-6 animate-fadeIn">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#25D36615' }}>
            <MessageCircle className="w-6 h-6" style={{ color: '#25D366' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('whatsapp.title')}</h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider" style={{ background: `${GOLD}20`, color: GOLD }}>{t('whatsapp.addonBadge')}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">{t('whatsapp.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isActive ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> {t('whatsapp.addonActive')}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-full text-sm font-medium">
              <Lock className="w-4 h-4" /> {t('whatsapp.addonInactive')}
            </span>
          )}
          {settings.enabled && isActive && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" /> API {t('whatsapp.connected')}
            </span>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════ OVERVIEW TAB ══════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Addon Status Banner */}
          {!isActive ? (
            <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)' }}>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-16 -right-16 w-[300px] h-[300px] rounded-full opacity-15" style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-5 h-5" style={{ color: GOLD }} />
                  <span className="text-sm font-bold tracking-wider" style={{ color: GOLD }}>{t('whatsapp.addonBadge')}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{t('whatsapp.title')}</h2>
                <p className="text-white/50 text-sm mb-5 max-w-lg">{t('whatsapp.addonContactAdmin')}</p>
                {addonStatus.pricing?.price > 0 && (
                  <div className="flex items-center gap-4 mb-5">
                    <div className="text-white">
                      <span className="text-2xl font-bold">{addonStatus.pricing.price}</span>
                      <span className="text-white/50 text-sm ml-1">{addonStatus.pricing.currency} / {billingLabel[addonStatus.pricing.billingCycle] || addonStatus.pricing.billingCycle}</span>
                    </div>
                  </div>
                )}
                <a href="https://wa.me/966596775485" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:brightness-95" style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96A)` }}>
                  <Phone className="w-4 h-4" /> {t('whatsapp.addonCallSales')}
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-900 dark:text-emerald-100">{t('whatsapp.addonBadge')} — {t('whatsapp.addonActive')}</div>
                    {addonStatus.activatedAt && (
                      <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">
                        {t('whatsapp.addonActivatedOn')}: {new Date(addonStatus.activatedAt).toLocaleDateString()}
                        {addonStatus.activatedBy && ` · ${t('whatsapp.addonActivatedBy')}: ${addonStatus.activatedBy}`}
                      </p>
                    )}
                  </div>
                </div>
                {!settings.enabled && (
                  <button onClick={() => setActiveTab('settings')} className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                    {t('whatsapp.tabSettings')} →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Feature Cards Grid */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">{t('whatsapp.title')} — {t('whatsapp.addonBadge')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {addonFeatures.map((f) => {
                const c = colorMap[f.color];
                return (
                  <div key={f.key} className={`relative rounded-2xl border p-5 transition-all ${isActive ? 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900' : 'border-gray-200/60 dark:border-slate-700/60 bg-gray-50/50 dark:bg-slate-800/30'}`}>
                    {!isActive && (
                      <div className="absolute top-3 right-3">
                        <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3 ${!isActive ? 'opacity-50' : ''}`}>
                      <f.icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <div className={`text-sm font-bold mb-1 ${!isActive ? 'text-gray-500 dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'}`}>
                      {t(`whatsapp.${f.key}`)}
                    </div>
                    <div className={`text-xs leading-relaxed ${!isActive ? 'text-gray-400 dark:text-slate-600' : 'text-gray-500 dark:text-slate-400'}`}>
                      {t(`whatsapp.${f.key}Desc`)}
                    </div>
                    <div className="mt-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider" style={{ background: `${GOLD}15`, color: !isActive ? `${GOLD}80` : GOLD }}>
                        {t('whatsapp.addonBadge')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════ SETTINGS TAB ══════ */}
      {activeTab === 'settings' && isActive && (
        <div className="space-y-6">
          <Card className="p-5 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">{t('whatsapp.setupGuideTitle')}</h3>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>{t('whatsapp.setupStep1')}</li>
                  <li>{t('whatsapp.setupStep2')}</li>
                  <li>{t('whatsapp.setupStep3')}</li>
                  <li>{t('whatsapp.setupStep4')}</li>
                </ol>
                <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  <ExternalLink className="w-4 h-4" /> {t('whatsapp.viewDocs')}
                </a>
              </div>
            </div>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">{t('whatsapp.apiCredentials')}</h2>
            </div>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="enabled" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                <label htmlFor="enabled" className="text-sm font-medium text-gray-700 dark:text-slate-200">{t('whatsapp.enableIntegration')}</label>
              </div>
              <Input label={t('whatsapp.phoneNumberId')} value={settings.phoneNumberId} onChange={(e) => setSettings({ ...settings, phoneNumberId: e.target.value })} placeholder="e.g., 123456789012345" />
              <Input label={t('whatsapp.accessToken')} type="password" value={settings.accessToken} onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })} placeholder={settings.hasAccessToken ? '••••••••••••••••' : 'Paste your access token'} />
              <Input label={t('whatsapp.businessAccountId')} value={settings.businessAccountId} onChange={(e) => setSettings({ ...settings, businessAccountId: e.target.value })} placeholder="e.g., 123456789012345" />
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSaveSettings} loading={loading}>{t('whatsapp.saveSettings')}</Button>
                <Button variant="outline" onClick={handleVerifyConnection} loading={verifying} icon={RefreshCw}>{t('whatsapp.verifyConnection')}</Button>
              </div>
              {connectionStatus && (
                <div className={`p-4 rounded-lg ${connectionStatus.success ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                  {connectionStatus.success ? (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="font-medium text-emerald-800 dark:text-emerald-200">{t('whatsapp.connectedSuccess')}</p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">Phone: {connectionStatus.phoneNumber}<br />Name: {connectionStatus.verifiedName}<br />Quality: {connectionStatus.qualityRating}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">{t('whatsapp.connectionFailed')}</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{connectionStatus.error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">{t('whatsapp.testMessage')}</h2>
            </div>
            <CardBody>
              <div className="flex gap-3">
                <Input placeholder="+966501234567" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="flex-1" />
                <Button onClick={handleTestMessage} loading={testing} icon={Send}>{t('whatsapp.sendTest')}</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ══════ AUTOMATION TAB ══════ */}
      {activeTab === 'automation' && isActive && (
        <div className="space-y-4">
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">{t('whatsapp.autoNotifications')}</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('whatsapp.autoNotificationsDesc')}</p>
            </div>
            <CardBody className="space-y-3">
              {[
                { key: 'autoMessageOnOrder', title: t('whatsapp.autoOrder'), desc: t('whatsapp.autoOrderDesc'), icon: Package, color: 'blue' },
                { key: 'autoMessageOnReady', title: t('whatsapp.autoReady'), desc: t('whatsapp.autoReadyDesc'), icon: Bell, color: 'emerald' },
                { key: 'autoMessageOnDelivery', title: t('whatsapp.autoDelivery'), desc: t('whatsapp.autoDeliveryDesc'), icon: Truck, color: 'purple' }
              ].map((item) => {
                const c = colorMap[item.color];
                return (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                        <item.icon className={`w-5 h-5 ${c.text}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-100">{item.title}</p>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <input type="checkbox" checked={settings[item.key]} onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  </div>
                );
              })}
            </CardBody>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                {t('whatsapp.autoInvoice')}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider" style={{ background: `${GOLD}20`, color: GOLD }}>{t('whatsapp.addonBadge')}</span>
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('whatsapp.autoInvoiceDesc')}</p>
            </div>
            <CardBody>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${colorMap.blue.bg} flex items-center justify-center`}>
                    <Receipt className={`w-5 h-5 ${colorMap.blue.text}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{t('whatsapp.autoInvoice')}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{t('whatsapp.autoInvoiceDesc')}</p>
                  </div>
                </div>
                <input type="checkbox" checked={settings.autoInvoice} onChange={(e) => setSettings({ ...settings, autoInvoice: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                {t('whatsapp.autoStatusUpdate')}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider" style={{ background: `${GOLD}20`, color: GOLD }}>{t('whatsapp.addonBadge')}</span>
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('whatsapp.autoStatusUpdateDesc')}</p>
            </div>
            <CardBody>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${colorMap.purple.bg} flex items-center justify-center`}>
                    <Bell className={`w-5 h-5 ${colorMap.purple.text}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{t('whatsapp.autoStatusUpdate')}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{t('whatsapp.autoStatusUpdateDesc')}</p>
                  </div>
                </div>
                <input type="checkbox" checked={settings.autoStatusUpdate} onChange={(e) => setSettings({ ...settings, autoStatusUpdate: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                {t('whatsapp.autoDueReminder')}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider" style={{ background: `${GOLD}20`, color: GOLD }}>{t('whatsapp.addonBadge')}</span>
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('whatsapp.autoDueReminderDesc')}</p>
            </div>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${colorMap.rose.bg} flex items-center justify-center`}>
                    <Clock className={`w-5 h-5 ${colorMap.rose.text}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{t('whatsapp.autoDueReminder')}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{t('whatsapp.autoDueReminderDesc')}</p>
                  </div>
                </div>
                <input type="checkbox" checked={settings.autoDueReminder} onChange={(e) => setSettings({ ...settings, autoDueReminder: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
              </div>
              {settings.autoDueReminder && (
                <Button
                  variant="outline"
                  loading={sendingReminders}
                  icon={Clock}
                  onClick={async () => {
                    setSendingReminders(true);
                    try {
                      const res = await api.post('/whatsapp/send-due-reminders');
                      if (res.data.success) toast.success(`Sent ${res.data.sent} of ${res.data.total} reminders`);
                      else toast.error(res.data.error || 'Failed');
                    } catch (e) { toast.error('Failed to send reminders'); }
                    setSendingReminders(false);
                  }}
                >
                  {t('whatsapp.sendDueRemindersNow')}
                </Button>
              )}
            </CardBody>
          </Card>

          <div className="pt-2">
            <Button onClick={handleSaveSettings} loading={loading}>{t('whatsapp.saveSettings')}</Button>
          </div>
        </div>
      )}

      {/* ══════ TEMPLATES TAB ══════ */}
      {activeTab === 'templates' && isActive && (
        <div className="space-y-6">
          <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">{t('whatsapp.availableVars')}</h3>
            <div className="flex flex-wrap gap-2">
              {['{businessName}', '{receiptNumber}', '{customerName}', '{price}', '{paidAmount}', '{balance}', '{dueDate}', '{status}'].map((v) => (
                <code key={v} className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded text-sm">{v}</code>
              ))}
            </div>
          </Card>

          {[
            { key: 'orderMessageTemplate', label: t('whatsapp.orderTemplate'), dflt: defaultTemplates.order },
            { key: 'readyMessageTemplate', label: t('whatsapp.readyTemplate'), dflt: defaultTemplates.ready },
            { key: 'deliveryMessageTemplate', label: t('whatsapp.deliveryTemplate'), dflt: defaultTemplates.delivery },
            { key: 'invoiceMessageTemplate', label: t('whatsapp.autoInvoice'), dflt: defaultTemplates.invoice, addon: true },
            { key: 'statusUpdateMessageTemplate', label: t('whatsapp.autoStatusUpdate'), dflt: defaultTemplates.statusUpdate, addon: true },
            { key: 'dueReminderMessageTemplate', label: t('whatsapp.autoDueReminder'), dflt: defaultTemplates.dueReminder, addon: true }
          ].map((tmpl) => (
            <Card key={tmpl.key}>
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  {tmpl.label}
                  {tmpl.addon && <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider" style={{ background: `${GOLD}20`, color: GOLD }}>{t('whatsapp.addonBadge')}</span>}
                </h2>
              </div>
              <CardBody>
                <Textarea value={settings[tmpl.key]} onChange={(e) => setSettings({ ...settings, [tmpl.key]: e.target.value })} rows={4} />
                <button onClick={() => setSettings({ ...settings, [tmpl.key]: tmpl.dflt })} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mt-2">{t('whatsapp.resetDefault')}</button>
              </CardBody>
            </Card>
          ))}

          <Button onClick={handleSaveSettings} loading={loading}>{t('whatsapp.saveTemplates')}</Button>
        </div>
      )}
    </div>
  );
};

export default WhatsApp;
