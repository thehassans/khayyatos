import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  FileText, 
  QrCode, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Send,
  Download,
  RefreshCw,
  Building2,
  CreditCard,
  FileCode,
  Shield,
  Zap,
  ChevronRight,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

const Zatca = () => {
  const { t } = useTranslation();
  const { api, user } = useAuth();
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    vatNumber: '',
    crn: '',
    street: '',
    buildingNumber: '',
    district: '',
    city: '',
    postalCode: '',
    plotId: '',
    phase: 1,
    environment: 'sandbox',
    invoiceCounter: 0,
    enabled: false,
    csid: '',
    csidSecret: '',
    productionCsid: '',
    productionCsidSecret: '',
    otp: '',
    onboardingStatus: ''
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [xmlPreview, setXmlPreview] = useState(null);
  const [selectedStitching, setSelectedStitching] = useState(null);
  const [stitchings, setStitchings] = useState([]);

  useEffect(() => {
    fetchSettings();
    fetchStitchings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/zatca/settings');
      if (response.data.settings) {
        setSettings(prev => ({ ...prev, ...response.data.settings }));
      }
    } catch (error) {
      console.error('Error fetching ZATCA settings:', error);
    }
  };

  const fetchStitchings = async () => {
    try {
      const response = await api.get('/stitchings?limit=50');
      setStitchings(response.data.stitchings || []);
    } catch (error) {
      console.error('Error fetching stitchings:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/zatca/invoices');
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await api.put('/zatca/settings', settings);
      toast.success(t('zatca.settingsSaved'));
    } catch (error) {
      toast.error(t('zatca.settingsError'));
    }
    setLoading(false);
  };

  const generateQRCode = async (stitchingId) => {
    setLoading(true);
    try {
      const response = await api.post('/zatca/generate-qr', { stitchingId });
      setQrCodeData(response.data);
      
      // Generate QR code image
      const qrImage = await QRCode.toDataURL(response.data.qrData, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
      setQrCodeImage(qrImage);
      toast.success(t('zatca.qrGenerated'));
    } catch (error) {
      toast.error(error.response?.data?.error || t('zatca.qrError'));
    }
    setLoading(false);
  };

  const generateXML = async (stitchingId) => {
    setLoading(true);
    try {
      const response = await api.post('/zatca/generate-xml', { 
        stitchingId,
        invoiceType: 'SIMPLIFIED'
      });
      setXmlPreview(response.data);
      toast.success(t('zatca.xmlGenerated'));
    } catch (error) {
      toast.error(error.response?.data?.error || t('zatca.xmlError'));
    }
    setLoading(false);
  };

  const reportInvoice = async () => {
    if (!xmlPreview) return;
    setLoading(true);
    try {
      const response = await api.post('/zatca/report-invoice', {
        invoiceXml: xmlPreview.xml,
        invoiceHash: xmlPreview.invoiceHash,
        uuid: xmlPreview.uuid,
        receiptNumber: xmlPreview.invoiceNumber
      });
      if (response.data.success) {
        toast.success(t('zatca.invoiceReported'));
        fetchInvoices();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || t('zatca.reportError'));
    }
    setLoading(false);
  };

  const handleOnboarding = async (step) => {
    setLoading(true);
    try {
      if (step === 'compliance') {
        if (!settings.otp) {
          toast.error('Please enter OTP from ZATCA portal');
          setLoading(false);
          return;
        }
        const response = await api.post('/zatca/onboarding/compliance-csid', {
          otp: settings.otp
        });
        if (response.data.success) {
          toast.success(t('zatca.complianceCsidObtained'));
          fetchSettings();
        }
      } else if (step === 'production') {
        const response = await api.post('/zatca/onboarding/production-csid', {
          complianceRequestId: settings.complianceRequestId
        });
        if (response.data.success) {
          toast.success(t('zatca.productionCsidObtained'));
          fetchSettings();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || t('zatca.onboardingError'));
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadXML = () => {
    if (!xmlPreview?.xml) return;
    const blob = new Blob([xmlPreview.xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${xmlPreview.invoiceNumber}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'settings', label: t('zatca.settings'), icon: Settings },
    { id: 'phase1', label: t('zatca.phase1'), icon: QrCode },
    { id: 'phase2', label: t('zatca.phase2'), icon: FileCode },
    { id: 'onboarding', label: t('zatca.onboarding'), icon: Shield },
    { id: 'invoices', label: t('zatca.invoices'), icon: FileText }
  ];

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      REPORTED: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
      CLEARED: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle },
      FAILED: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
      PENDING: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertCircle }
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('zatca.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">{t('zatca.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            settings.phase === 2 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          }`}>
            <Zap className="w-4 h-4" />
            {t(`zatca.phase${settings.phase}`)}
          </span>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            settings.enabled
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {settings.enabled ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {settings.enabled ? t('zatca.enabled') : t('zatca.disabled')}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'invoices') fetchInvoices();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-500" />
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">{t('zatca.businessInfo')}</h2>
            </div>
            <CardBody className="space-y-4">
              <Input
                label={t('zatca.vatNumber')}
                value={settings.vatNumber}
                onChange={(e) => setSettings({ ...settings, vatNumber: e.target.value })}
                placeholder="3XXXXXXXXXX00003"
              />
              <Input
                label={t('zatca.crn')}
                value={settings.crn}
                onChange={(e) => setSettings({ ...settings, crn: e.target.value })}
                placeholder="Commercial Registration Number"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('zatca.city')}
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                />
                <Input
                  label={t('zatca.district')}
                  value={settings.district}
                  onChange={(e) => setSettings({ ...settings, district: e.target.value })}
                />
              </div>
              <Input
                label={t('zatca.street')}
                value={settings.street}
                onChange={(e) => setSettings({ ...settings, street: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label={t('zatca.buildingNumber')}
                  value={settings.buildingNumber}
                  onChange={(e) => setSettings({ ...settings, buildingNumber: e.target.value })}
                />
                <Input
                  label={t('zatca.postalCode')}
                  value={settings.postalCode}
                  onChange={(e) => setSettings({ ...settings, postalCode: e.target.value })}
                />
                <Input
                  label={t('zatca.plotId')}
                  value={settings.plotId}
                  onChange={(e) => setSettings({ ...settings, plotId: e.target.value })}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">{t('zatca.configuration')}</h2>
            </div>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                  {t('zatca.environment')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['sandbox', 'simulation', 'production'].map((env) => (
                    <button
                      key={env}
                      onClick={() => setSettings({ ...settings, environment: env })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        settings.environment === env
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {t(`zatca.${env}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                  {t('zatca.phase')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((phase) => (
                    <button
                      key={phase}
                      onClick={() => setSettings({ ...settings, phase })}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border-2 ${
                        settings.phase === phase
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="text-lg font-bold mb-1">{t(`zatca.phase${phase}`)}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        {phase === 1 ? t('zatca.qrCodeGeneration') : t('zatca.integrationReporting')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <div className="font-medium text-gray-900 dark:text-slate-100">{t('zatca.enableZatca')}</div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">{t('zatca.enableDescription')}</div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings.enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.enabled ? 'left-8' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <div className="font-medium text-gray-900 dark:text-slate-100">{t('zatca.showOnInvoice')}</div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">{t('zatca.showOnInvoiceDesc')}</div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, showOnInvoice: !settings.showOnInvoice })}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings.showOnInvoice ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.showOnInvoice ? 'left-8' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="pt-2">
                <div className="text-sm text-gray-500 dark:text-slate-400 mb-2">
                  {t('zatca.invoiceCounter')}: <span className="font-bold text-gray-900 dark:text-slate-100">{settings.invoiceCounter}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="lg:col-span-2">
            <Button onClick={handleSaveSettings} loading={loading} className="w-full">
              {t('common.save')} {t('zatca.settings')}
            </Button>
          </div>
        </div>
      )}

      {/* Phase 1 Tab - QR Code Generation */}
      {activeTab === 'phase1' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">{t('zatca.selectOrder')}</h2>
            </div>
            <CardBody>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {stitchings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                    {t('zatca.noOrders')}
                  </div>
                ) : (
                  stitchings.map((stitching) => (
                    <button
                      key={stitching._id}
                      onClick={() => setSelectedStitching(stitching)}
                      className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                        selectedStitching?._id === stitching._id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-slate-100">
                            {stitching.receiptNumber}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-slate-400">
                            {stitching.customer?.name || 'Walk-in Customer'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            {stitching.price} SAR
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(stitching.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
              {selectedStitching && (
                <Button 
                  onClick={() => generateQRCode(selectedStitching._id)} 
                  loading={loading}
                  className="w-full mt-4"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  {t('zatca.generateQR')}
                </Button>
              )}
            </CardBody>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">{t('zatca.qrCodePreview')}</h2>
            </div>
            <CardBody>
              {qrCodeImage ? (
                <div className="text-center space-y-4">
                  <div className="inline-block p-4 bg-white rounded-2xl shadow-lg">
                    <img src={qrCodeImage} alt="ZATCA QR Code" className="w-48 h-48" />
                  </div>
                  <div className="space-y-2 text-left bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-slate-400">{t('zatca.seller')}:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-slate-100">{qrCodeData?.invoiceData?.sellerName}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-slate-400">{t('zatca.vatNumber')}:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-slate-100">{qrCodeData?.invoiceData?.vatNumber}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-slate-400">{t('zatca.total')}:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-slate-100">{qrCodeData?.invoiceData?.invoiceTotal} SAR</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-slate-400">{t('zatca.vat')}:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-slate-100">{qrCodeData?.invoiceData?.vatTotal} SAR</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      onClick={() => copyToClipboard(qrCodeData?.qrData)}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {t('zatca.copyData')}
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = 'zatca-qr.png';
                        link.href = qrCodeImage;
                        link.click();
                      }}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t('zatca.download')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <QrCode className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                  <p className="text-gray-500 dark:text-slate-400">{t('zatca.selectOrderToGenerate')}</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Phase 2 Tab - XML Generation & Reporting */}
      {activeTab === 'phase2' && (
        <div className="space-y-6">
          {settings.phase !== 2 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-amber-800 dark:text-amber-200">{t('zatca.phase2Notice')}</div>
                <div className="text-sm text-amber-600 dark:text-amber-300">{t('zatca.phase2NoticeDesc')}</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                <h2 className="font-semibold text-gray-900 dark:text-slate-100">{t('zatca.generateXml')}</h2>
              </div>
              <CardBody>
                <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
                  {stitchings.map((stitching) => (
                    <button
                      key={stitching._id}
                      onClick={() => setSelectedStitching(stitching)}
                      className={`w-full p-3 rounded-xl text-left transition-all border-2 ${
                        selectedStitching?._id === stitching._id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{stitching.receiptNumber}</span>
                        <span className="text-emerald-600 font-bold">{stitching.price} SAR</span>
                      </div>
                    </button>
                  ))}
                </div>
                {selectedStitching && (
                  <Button 
                    onClick={() => generateXML(selectedStitching._id)} 
                    loading={loading}
                    className="w-full"
                  >
                    <FileCode className="w-4 h-4 mr-2" />
                    {t('zatca.generateXml')}
                  </Button>
                )}
              </CardBody>
            </Card>

            <Card>
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-slate-100">{t('zatca.xmlPreview')}</h2>
                {xmlPreview && (
                  <Button variant="secondary" size="sm" onClick={downloadXML}>
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <CardBody>
                {xmlPreview ? (
                  <div className="space-y-4">
                    <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-64">
                      <pre className="text-xs text-green-400 whitespace-pre-wrap">
                        {xmlPreview.xml?.substring(0, 1500)}...
                      </pre>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
                        <div className="text-gray-500 dark:text-slate-400">Invoice #</div>
                        <div className="font-medium">{xmlPreview.invoiceNumber}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
                        <div className="text-gray-500 dark:text-slate-400">UUID</div>
                        <div className="font-mono text-xs truncate">{xmlPreview.uuid}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={reportInvoice} 
                        loading={loading}
                        className="flex-1"
                        disabled={!settings.csid}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {t('zatca.reportToZatca')}
                      </Button>
                    </div>
                    {!settings.csid && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                        {t('zatca.completeOnboardingFirst')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileCode className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                    <p className="text-gray-500 dark:text-slate-400">{t('zatca.selectOrderForXml')}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Onboarding Tab */}
      {activeTab === 'onboarding' && (
        <div className="space-y-6">
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">{t('zatca.onboardingSteps')}</h2>
            </div>
            <CardBody>
              <div className="space-y-4">
                {/* Step 1 */}
                <div className={`p-4 rounded-xl border-2 ${
                  settings.csid ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      settings.csid ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'
                    }`}>
                      {settings.csid ? <CheckCircle className="w-5 h-5 text-white" /> : <span className="text-white font-bold">1</span>}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-slate-100">{t('zatca.step1Title')}</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">{t('zatca.step1Desc')}</div>
                    </div>
                  </div>
                  {!settings.csid && (
                    <div className="ml-11 space-y-3">
                      <Input
                        label={t('zatca.otp')}
                        value={settings.otp}
                        onChange={(e) => setSettings({ ...settings, otp: e.target.value })}
                        placeholder="Enter OTP from ZATCA portal"
                      />
                      <Button onClick={() => handleOnboarding('compliance')} loading={loading}>
                        {t('zatca.getComplianceCsid')}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Step 2 */}
                <div className={`p-4 rounded-xl border-2 ${
                  settings.productionCsid ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      settings.productionCsid ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'
                    }`}>
                      {settings.productionCsid ? <CheckCircle className="w-5 h-5 text-white" /> : <span className="text-white font-bold">2</span>}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-slate-100">{t('zatca.step2Title')}</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">{t('zatca.step2Desc')}</div>
                    </div>
                  </div>
                  {settings.csid && !settings.productionCsid && (
                    <div className="ml-11">
                      <Button onClick={() => handleOnboarding('production')} loading={loading}>
                        {t('zatca.getProductionCsid')}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Credentials Display */}
                {(settings.csid || settings.productionCsid) && (
                  <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 dark:text-slate-100">{t('zatca.credentials')}</h3>
                      <button
                        onClick={() => setShowSecrets(!showSecrets)}
                        className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {settings.csid && (
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-slate-400">Compliance CSID:</span>
                          <code className="ml-2 px-2 py-1 bg-gray-200 dark:bg-slate-700 rounded text-xs">
                            {showSecrets ? settings.csid?.substring(0, 50) + '...' : '••••••••'}
                          </code>
                        </div>
                      </div>
                    )}
                    {settings.productionCsid && (
                      <div className="space-y-2 text-sm mt-2">
                        <div>
                          <span className="text-gray-500 dark:text-slate-400">Production CSID:</span>
                          <code className="ml-2 px-2 py-1 bg-gray-200 dark:bg-slate-700 rounded text-xs">
                            {showSecrets ? settings.productionCsid?.substring(0, 50) + '...' : '••••••••'}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">{t('zatca.invoiceHistory')}</h2>
            <Button variant="secondary" size="sm" onClick={fetchInvoices}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <CardBody>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                <p className="text-gray-500 dark:text-slate-400">{t('zatca.noInvoices')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-800">
                      <th className="pb-3 font-medium">{t('zatca.invoiceNumber')}</th>
                      <th className="pb-3 font-medium">{t('zatca.customer')}</th>
                      <th className="pb-3 font-medium">{t('zatca.amount')}</th>
                      <th className="pb-3 font-medium">{t('zatca.status')}</th>
                      <th className="pb-3 font-medium">{t('zatca.date')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {invoices.map((invoice) => (
                      <tr key={invoice._id} className="text-sm">
                        <td className="py-3 font-medium text-gray-900 dark:text-slate-100">
                          {invoice.receiptNumber}
                        </td>
                        <td className="py-3 text-gray-600 dark:text-slate-300">
                          {invoice.customer?.name || '-'}
                        </td>
                        <td className="py-3 font-medium text-emerald-600 dark:text-emerald-400">
                          {invoice.price} SAR
                        </td>
                        <td className="py-3">
                          <StatusBadge status={invoice.zatcaStatus} />
                        </td>
                        <td className="py-3 text-gray-500 dark:text-slate-400">
                          {new Date(invoice.zatcaReportedAt || invoice.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default Zatca;
