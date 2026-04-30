import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, Upload, Globe, Sun, Moon, 
  Shield, Download, Bell, Database, ChevronRight, 
  Check, Smartphone, Mail, Lock, Key, Trash2, Plus,
  FileText, HelpCircle, Info, Ruler, Palette, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { api, user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(false);
  const langKey = (i18n?.language || 'en').split('-')[0];
  const isRtl = langKey === 'ar' || langKey === 'ur';
  const [logoPreview, setLogoPreview] = useState(null);
  const [settings, setSettings] = useState({
    language: user?.language || 'en',
    theme: user?.theme || 'light',
    invoiceLanguage: user?.invoiceLanguage || 'both',
    measurementUi: user?.measurementUi || 'cards',
    receiptPrefix: '',
    receiptCounter: 0,
    logo: null,
    businessName: user?.businessName || '',
    labelLanguage: user?.labelLanguage || 'both',
    primaryColor: user?.primaryColor || 'sky',
    notifications: {
      orderUpdates: true,
      paymentReminders: true,
      weeklyReport: false,
      sound: true
    }
  });

  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  const [styleCatalog, setStyleCatalog] = useState(null);
  const [styleCatalogLoading, setStyleCatalogLoading] = useState(false);
  const [styleCatalogSaving, setStyleCatalogSaving] = useState(false);
  const [newOptionDraft, setNewOptionDraft] = useState({});

  const [measurementsCatalog, setMeasurementsCatalog] = useState(null);
  const [measurementsCatalogLoading, setMeasurementsCatalogLoading] = useState(false);
  const [measurementsCatalogSaving, setMeasurementsCatalogSaving] = useState(false);

  const [thawbTypesCatalog, setThawbTypesCatalog] = useState(null);
  const [thawbTypesCatalogLoading, setThawbTypesCatalogLoading] = useState(false);
  const [thawbTypesCatalogSaving, setThawbTypesCatalogSaving] = useState(false);

  const [fabricColorsCatalog, setFabricColorsCatalog] = useState(null);
  const [fabricColorsCatalogLoading, setFabricColorsCatalogLoading] = useState(false);
  const [fabricColorsCatalogSaving, setFabricColorsCatalogSaving] = useState(false);

  const catalogTranslateTimersRef = useRef({});
  const [catalogNameTranslating, setCatalogNameTranslating] = useState({});
  const [catalogNameI18nPreview, setCatalogNameI18nPreview] = useState({});

  const colorPresets = [
    { name: 'sky', color: '#0ea5e9' },
    { name: 'indigo', color: '#6366f1' },
    { name: 'violet', color: '#8b5cf6' },
    { name: 'rose', color: '#f43f5e' },
    { name: 'emerald', color: '#10b981' },
    { name: 'amber', color: '#f59e0b' },
  ];

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ur', label: 'اردو', flag: '🇵🇰' },
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩' }
  ];

  const invoiceLanguageOptions = [
    {
      value: 'en',
      title: 'English',
      description: 'Left-to-right invoice in English only.'
    },
    {
      value: 'ar',
      title: 'العربية',
      description: 'فاتورة عربية كاملة من اليمين إلى اليسار.'
    },
    {
      value: 'both',
      title: 'English + العربية',
      description: 'Bilingual invoice with both languages.'
    }
  ];

  const measurementUiOptions = [
    {
      value: 'cards',
      title: 'Tailor Sheet',
      description: 'Balanced sheet layout with the logo header, measurement table, thawb preview, and integrated style controls.',
      badge: 'Image 1',
      activeClasses: 'border-gray-900 dark:border-white ring-2 ring-gray-900/10 dark:ring-white/10 bg-white dark:bg-slate-900 shadow-lg',
      inactiveClasses: 'border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 hover:border-gray-300 dark:hover:border-slate-600',
      badgeActiveClasses: 'bg-gray-900 text-white dark:bg-white dark:text-gray-900',
      badgeInactiveClasses: 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-300',
      preview: (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2 rounded-2xl border border-gray-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-950/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700" />
              <div className="grid grid-cols-3 gap-2 flex-1">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="h-8 rounded-lg border border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70" />
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 p-3">
            <div className="h-20 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 bg-stone-50 dark:bg-slate-950/40" />
          </div>
          <div className="space-y-2">
            {[0, 1].map((idx) => (
              <div key={idx} className="h-[54px] rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70" />
            ))}
          </div>
        </div>
      )
    },
    {
      value: 'atelier',
      title: 'Order Board',
      description: 'Board-style workspace with the top measurement strip, central garment board, and right detail rail.',
      badge: 'Image 2',
      activeClasses: 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-400/20 bg-white dark:bg-slate-900 shadow-lg',
      inactiveClasses: 'border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 hover:border-amber-300 dark:hover:border-amber-700/60',
      badgeActiveClasses: 'bg-amber-500 text-white',
      badgeInactiveClasses: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200',
      preview: (
        <div className="mt-4 grid grid-cols-[1fr_120px_1fr] gap-3 items-stretch">
          <div className="space-y-2">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-950/60 px-3 py-3">
                <div className="h-2.5 w-16 rounded-full bg-gray-200 dark:bg-slate-700" />
                <div className="mt-3 h-10 rounded-xl border border-gray-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900" />
              </div>
            ))}
          </div>
          <div className="rounded-[1.75rem] border border-gray-200 dark:border-slate-700 bg-gradient-to-b from-white to-stone-100 dark:from-slate-800 dark:to-slate-900" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-950/60 px-3 py-3">
                <div className="h-2.5 w-20 rounded-full bg-gray-200 dark:bg-slate-700" />
                <div className="mt-3 h-10 rounded-xl border border-gray-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900" />
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      value: 'monarch',
      title: 'Monarch Minimal',
      description: 'Ultra-premium minimalist sheet with large whitespace, restrained details, and a luxury editorial feel.',
      badge: 'Ultra',
      activeClasses: 'border-violet-500 dark:border-violet-400 ring-2 ring-violet-400/20 bg-white dark:bg-slate-900 shadow-lg',
      inactiveClasses: 'border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 hover:border-violet-300 dark:hover:border-violet-700/60',
      badgeActiveClasses: 'bg-violet-500 text-white',
      badgeInactiveClasses: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-200',
      preview: (
        <div className="mt-4 rounded-[1.9rem] border border-violet-100 dark:border-violet-900/30 bg-gradient-to-br from-white via-violet-50/70 to-stone-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="h-10 w-10 rounded-full border border-violet-200/70 dark:border-violet-800/40 bg-white/90 dark:bg-slate-900/70" />
            <div className="h-2.5 w-24 rounded-full bg-violet-100 dark:bg-violet-900/30" />
          </div>
          <div className="mt-4 grid grid-cols-[1.15fr_0.85fr] gap-4">
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="h-16 rounded-2xl border border-violet-100 dark:border-violet-900/30 bg-white/85 dark:bg-slate-900/60" />
              ))}
            </div>
            <div className="rounded-[1.75rem] border border-violet-100 dark:border-violet-900/30 bg-gradient-to-b from-white to-violet-50 dark:from-slate-900 dark:to-slate-950" />
          </div>
        </div>
      )
    },
    {
      value: 'noir',
      title: 'Noir Atelier',
      description: 'Ultra-premium dark workspace with a restrained luxury board, glass panels, and minimal visual noise.',
      badge: 'Noir',
      activeClasses: 'border-slate-900 dark:border-white ring-2 ring-slate-900/10 dark:ring-white/10 bg-slate-950 text-white shadow-lg',
      inactiveClasses: 'border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 hover:border-slate-400 dark:hover:border-slate-500',
      badgeActiveClasses: 'bg-white text-slate-950',
      badgeInactiveClasses: 'bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-200',
      preview: (
        <div className="mt-4 rounded-[1.9rem] border border-slate-800 dark:border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
          <div className="grid grid-cols-[0.8fr_1.2fr] gap-4 items-stretch">
            <div className="space-y-2">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="rounded-2xl border border-slate-800 dark:border-slate-700 bg-white/5 px-3 py-3">
                  <div className="h-2.5 w-12 rounded-full bg-slate-700" />
                  <div className="mt-3 h-10 rounded-xl border border-slate-800 dark:border-slate-700 bg-white/5" />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="h-24 rounded-[1.75rem] border border-slate-800 dark:border-slate-700 bg-white/5" />
              <div className="grid grid-cols-2 gap-3">
                {[0, 1].map((idx) => (
                  <div key={idx} className="h-20 rounded-2xl border border-slate-800 dark:border-slate-700 bg-white/5" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const activeMeasurementUiLabel = measurementUiOptions.find((option) => option.value === settings.measurementUi)?.title || 'Tailor Sheet';

  const sections = [
    { id: 'general', label: t('settings.sections.general', { defaultValue: 'General' }), icon: SettingsIcon },
    { id: 'styleOptions', label: t('settings.sections.styleOptions', { defaultValue: 'Style Options' }), icon: FileText },
    { id: 'measurements', label: t('settings.sections.measurements', { defaultValue: 'Measurements' }), icon: Ruler },
    { id: 'thawbTypes', label: t('settings.sections.thawbTypes', { defaultValue: 'Thawb Types' }), icon: Tag },
    { id: 'fabricColors', label: t('settings.sections.fabricColors', { defaultValue: 'Fabric Colors' }), icon: Palette },
    { id: 'appearance', label: t('settings.sections.appearance', { defaultValue: 'Appearance' }), icon: Sun },
    { id: 'notifications', label: t('settings.sections.notifications', { defaultValue: 'Notifications' }), icon: Bell },
    { id: 'security', label: t('settings.sections.security', { defaultValue: 'Security' }), icon: Shield },
    { id: 'data', label: t('settings.sections.data', { defaultValue: 'Data & Backup' }), icon: Database },
    { id: 'about', label: t('settings.sections.about', { defaultValue: 'About' }), icon: Info }
  ];

  useEffect(() => { fetchSettings(); }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const section = params.get('section');
      if (section) {
        setActiveSection(section);
      }
    } catch (e) {

    }
  }, [location.search]);

  const sanitizeKey = (value) => {
    if (!value) return '';
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '');
  };

  const computeReceiptPrefix = (businessName) => {
    const rawShop = typeof businessName === 'string' ? businessName : '';
    const shop = rawShop.trim().replace(/\s+/g, '-');
    const safeShop = shop.replace(/[^\p{L}\p{N}-]/gu, '').slice(0, 24);
    return safeShop || 'SHOP';
  };

  const autoReceiptPrefix = computeReceiptPrefix(settings.businessName || user?.businessName || '');

  const resolveUploadsUrl = useCallback((src) => {
    if (!src) return src;
    if (src.startsWith('data:')) return src;
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (!src.startsWith('/uploads/')) return src;
    const baseUrl = api?.defaults?.baseURL;
    if (!baseUrl || typeof baseUrl !== 'string') return src;
    try {
      if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
        return `${new URL(baseUrl).origin}${src}`;
      }
    } catch (e) {
      return src;
    }
    return src;
  }, [api]);

  const buildLogoSrc = useCallback((src, cacheBust = false) => {
    const resolvedSrc = resolveUploadsUrl(src);
    if (!resolvedSrc) return null;
    if (!cacheBust) return resolvedSrc;
    const separator = resolvedSrc.includes('?') ? '&' : '?';
    return `${resolvedSrc}${separator}v=${Date.now()}`;
  }, [resolveUploadsUrl]);

  useEffect(() => {
    if (settings.logo) return;
    setLogoPreview(buildLogoSrc(user?.logo || null));
  }, [user?.logo, settings.logo, buildLogoSrc]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(prev => ({
        ...prev,
        language: response.data.settings.language,
        theme: response.data.settings.theme || prev.theme || user?.theme || 'light',
        invoiceLanguage: response.data.settings.invoiceLanguage || prev.invoiceLanguage || user?.invoiceLanguage || 'both',
        measurementUi: response.data.settings.measurementUi || prev.measurementUi || user?.measurementUi || 'cards',
        receiptPrefix: response.data.settings.receiptPrefix,
        receiptCounter: response.data.settings.receiptCounter,
        businessName: response.data.settings.businessName || user?.businessName || ''
      }));
      setLogoPreview(buildLogoSrc(response.data.settings.logo && response.data.settings.logo !== 'null' ? response.data.settings.logo : null));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchStyleCatalog = useCallback(async () => {
    try {
      setStyleCatalogLoading(true);
      const response = await api.get('/settings/style-options');
      setStyleCatalog(response.data?.catalog || null);
    } catch (error) {
      toast.error('Failed to load style options');
    }
    setStyleCatalogLoading(false);
  }, [api]);

  const fetchMeasurementsCatalog = useCallback(async () => {
    try {
      setMeasurementsCatalogLoading(true);
      const response = await api.get('/settings/measurements-catalog');
      setMeasurementsCatalog(response.data?.catalog || null);
    } catch (error) {
      toast.error('Failed to load measurements');
    }
    setMeasurementsCatalogLoading(false);
  }, [api]);

  const fetchThawbTypesCatalog = useCallback(async () => {
    try {
      setThawbTypesCatalogLoading(true);
      const response = await api.get('/settings/thawb-types-catalog');
      setThawbTypesCatalog(response.data?.catalog || null);
    } catch (error) {
      toast.error('Failed to load thawb types');
    }
    setThawbTypesCatalogLoading(false);
  }, [api]);

  const fetchFabricColorsCatalog = useCallback(async () => {
    try {
      setFabricColorsCatalogLoading(true);
      const response = await api.get('/settings/fabric-colors-catalog');
      setFabricColorsCatalog(response.data?.catalog || null);
    } catch (error) {
      toast.error('Failed to load fabric colors');
    }
    setFabricColorsCatalogLoading(false);
  }, [api]);

  useEffect(() => {
    if (activeSection === 'styleOptions') {
      fetchStyleCatalog();
    }
  }, [activeSection, fetchStyleCatalog]);

  useEffect(() => {
    if (activeSection === 'measurements') {
      fetchMeasurementsCatalog();
    }
  }, [activeSection, fetchMeasurementsCatalog]);

  useEffect(() => {
    if (activeSection === 'thawbTypes') {
      fetchThawbTypesCatalog();
    }
  }, [activeSection, fetchThawbTypesCatalog]);

  useEffect(() => {
    if (activeSection === 'fabricColors') {
      fetchFabricColorsCatalog();
    }
  }, [activeSection, fetchFabricColorsCatalog]);

  useEffect(() => {
    return () => {
      const timers = catalogTranslateTimersRef.current || {};
      Object.keys(timers).forEach((k) => {
        try {
          clearTimeout(timers[k]);
        } catch (e) {

        }
      });
      catalogTranslateTimersRef.current = {};
    };
  }, []);

  const scheduleCatalogTranslate = useCallback((id, text) => {
    const key = String(id || '');
    const value = typeof text === 'string' ? text.trim() : '';
    if (!key) return;

    const timers = catalogTranslateTimersRef.current || {};
    if (timers[key]) {
      clearTimeout(timers[key]);
      delete timers[key];
      catalogTranslateTimersRef.current = timers;
    }

    if (!value) {
      setCatalogNameI18nPreview((p) => {
        const next = { ...(p || {}) };
        delete next[key];
        return next;
      });
      setCatalogNameTranslating((p) => ({ ...(p || {}), [key]: false }));
      return;
    }

    setCatalogNameTranslating((p) => ({ ...(p || {}), [key]: true }));

    timers[key] = setTimeout(async () => {
      try {
        const resp = await api.post('/settings/translate', {
          entries: [{ id: key, text: value }],
          targetLangs: ['en', 'ar', 'ur', 'hi', 'bn']
        });
        const tr = resp.data?.translations?.[key] || null;
        if (tr && typeof tr === 'object') {
          setCatalogNameI18nPreview((p) => ({ ...(p || {}), [key]: tr }));
        }
      } catch (e) {

      }
      setCatalogNameTranslating((p) => ({ ...(p || {}), [key]: false }));
    }, 650);

    catalogTranslateTimersRef.current = timers;
  }, [api]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSettings((prev) => ({ ...prev, logo: file }));
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      data.append('language', settings.language);
      data.append('theme', settings.theme);
      data.append('invoiceLanguage', settings.invoiceLanguage);
      data.append('measurementUi', settings.measurementUi);
      data.append('receiptPrefix', autoReceiptPrefix);
      data.append('businessName', settings.businessName);
      if (settings.logo) data.append('logo', settings.logo);

      const response = await api.put('/settings', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const savedSettings = response.data?.settings || {};
      const savedLogo = savedSettings.logo && savedSettings.logo !== 'null'
        ? buildLogoSrc(savedSettings.logo, true)
        : null;

      setLogoPreview(savedLogo);
      setSettings((prev) => ({
        ...prev,
        language: savedSettings.language || prev.language,
        theme: savedSettings.theme || prev.theme,
        invoiceLanguage: savedSettings.invoiceLanguage || prev.invoiceLanguage,
        measurementUi: savedSettings.measurementUi || prev.measurementUi,
        receiptPrefix: savedSettings.receiptPrefix,
        receiptCounter: savedSettings.receiptCounter,
        businessName: savedSettings.businessName || prev.businessName,
        logo: null
      }));

      updateUser({
        language: savedSettings.language || settings.language,
        theme: savedSettings.theme || settings.theme,
        invoiceLanguage: savedSettings.invoiceLanguage || settings.invoiceLanguage,
        measurementUi: savedSettings.measurementUi || settings.measurementUi,
        businessName: savedSettings.businessName || settings.businessName,
        logo: savedLogo,
        primaryColor: settings.primaryColor
      });
      toast.success(t('settings.saved'));
    } catch (error) {
      toast.error('Failed to save settings');
    }
    setLoading(false);
  };

  const handleSaveStyleCatalog = async () => {
    if (!styleCatalog) return;
    setStyleCatalogSaving(true);
    try {
      const response = await api.put('/settings/style-options', styleCatalog);
      setStyleCatalog(response.data?.catalog || styleCatalog);
      toast.success('Style options saved');
    } catch (error) {
      toast.error('Failed to save style options');
    }
    setStyleCatalogSaving(false);
  };

  const handleSaveMeasurementsCatalog = async () => {
    if (!measurementsCatalog) return;
    setMeasurementsCatalogSaving(true);
    try {
      const response = await api.put('/settings/measurements-catalog', measurementsCatalog);
      setMeasurementsCatalog(response.data?.catalog || measurementsCatalog);
      toast.success('Measurements saved');
    } catch (error) {
      toast.error('Failed to save measurements');
    }
    setMeasurementsCatalogSaving(false);
  };

  const handleSaveMeasurementUi = async () => {
    try {
      await api.put('/settings/preferences', { measurementUi: settings.measurementUi });
      updateUser({ measurementUi: settings.measurementUi });
    } catch (error) {
      toast.error('Failed to save measurement UI');
      throw error;
    }
  };

  const handleSaveThawbTypesCatalog = async () => {
    if (!thawbTypesCatalog) return;
    setThawbTypesCatalogSaving(true);
    try {
      const response = await api.put('/settings/thawb-types-catalog', thawbTypesCatalog);
      setThawbTypesCatalog(response.data?.catalog || thawbTypesCatalog);
      toast.success('Thawb types saved');
    } catch (error) {
      toast.error('Failed to save thawb types');
    }
    setThawbTypesCatalogSaving(false);
  };

  const handleSaveFabricColorsCatalog = async () => {
    if (!fabricColorsCatalog) return;
    setFabricColorsCatalogSaving(true);
    try {
      const response = await api.put('/settings/fabric-colors-catalog', fabricColorsCatalog);
      setFabricColorsCatalog(response.data?.catalog || fabricColorsCatalog);
      toast.success('Fabric colors saved');
    } catch (error) {
      toast.error('Failed to save fabric colors');
    }
    setFabricColorsCatalogSaving(false);
  };

  const handleSaveClick = async () => {
    if (activeSection === 'styleOptions') {
      await handleSaveStyleCatalog();
      return;
    }
    if (activeSection === 'measurements') {
      await handleSaveMeasurementUi();
      await handleSaveMeasurementsCatalog();
      return;
    }
    if (activeSection === 'thawbTypes') {
      await handleSaveThawbTypesCatalog();
      return;
    }
    if (activeSection === 'fabricColors') {
      await handleSaveFabricColorsCatalog();
      return;
    }
    await handleSave();
  };

  const updateMeasurementsField = (key, patch) => {
    if (patch && typeof patch.name === 'string') {
      scheduleCatalogTranslate(`m:${key}`, patch.name);
    }
    setMeasurementsCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: (prev.fields || []).map((f) => (f.key === key ? { ...f, ...patch } : f))
      };
    });
  };

  const convertImageToWebp = async (file, maxWidth = 720, quality = 0.85) => {
    if (!file) return null;
    if (file.type === 'image/webp') return file;

    const inputDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to load image'));
      el.src = typeof inputDataUrl === 'string' ? inputDataUrl : '';
    });

    const scale = img.width ? Math.min(1, maxWidth / img.width) : 1;
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available');
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob) throw new Error('Failed to convert image');

    const base = (file.name || 'image').replace(/\.[^/.]+$/, '');
    return new File([blob], `${base}.webp`, { type: 'image/webp' });
  };

  const uploadMeasurementImage = async (fieldKey, file) => {
    if (!file) return;
    setMeasurementsCatalogSaving(true);
    try {
      const webp = await convertImageToWebp(file, 720, 0.85);
      const data = new FormData();
      data.append('fieldKey', fieldKey);
      data.append('image', webp || file);
      const response = await api.post('/settings/measurements-catalog/image', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMeasurementsCatalog(response.data?.catalog || measurementsCatalog);
      toast.success('Image updated');
    } catch (error) {
      toast.error('Failed to upload image');
    }
    setMeasurementsCatalogSaving(false);
  };

  const deleteMeasurementImage = async (fieldKey) => {
    setMeasurementsCatalogSaving(true);
    try {
      const response = await api.delete('/settings/measurements-catalog/image', { params: { fieldKey } });
      setMeasurementsCatalog(response.data?.catalog || measurementsCatalog);
      toast.success('Image deleted');
    } catch (error) {
      toast.error('Failed to delete image');
    }
    setMeasurementsCatalogSaving(false);
  };

  const updateThawbType = (key, patch) => {
    if (patch && typeof patch.name === 'string') {
      scheduleCatalogTranslate(`t:${key}`, patch.name);
    }
    setThawbTypesCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        types: (prev.types || []).map((t) => (t.key === key ? { ...t, ...patch } : t))
      };
    });
  };

  const uploadThawbImage = async (typeKey, file) => {
    if (!file) return;
    setThawbTypesCatalogSaving(true);
    try {
      const webp = await convertImageToWebp(file, 720, 0.85);
      const data = new FormData();
      data.append('typeKey', typeKey);
      data.append('image', webp || file);
      const response = await api.post('/settings/thawb-types-catalog/image', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setThawbTypesCatalog(response.data?.catalog || thawbTypesCatalog);
      toast.success('Image updated');
    } catch (error) {
      toast.error('Failed to upload image');
    }
    setThawbTypesCatalogSaving(false);
  };

  const deleteThawbImage = async (typeKey) => {
    setThawbTypesCatalogSaving(true);
    try {
      const response = await api.delete('/settings/thawb-types-catalog/image', { params: { typeKey } });
      setThawbTypesCatalog(response.data?.catalog || thawbTypesCatalog);
      toast.success('Image deleted');
    } catch (error) {
      toast.error('Failed to delete image');
    }
    setThawbTypesCatalogSaving(false);
  };

  const updateFabricColor = (key, patch) => {
    if (patch && typeof patch.name === 'string') {
      scheduleCatalogTranslate(`c:${key}`, patch.name);
    }
    setFabricColorsCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        colors: (prev.colors || []).map((c) => (c.key === key ? { ...c, ...patch } : c))
      };
    });
  };

  const updateGroupName = (groupKey, value) => {
    if (typeof value === 'string') {
      scheduleCatalogTranslate(`g:${groupKey}`, value);
    }
    setStyleCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        groups: (prev.groups || []).map((g) => (g.key === groupKey ? { ...g, name: value } : g))
      };
    });
  };

  const updateOptionName = (groupKey, optionKey, value) => {
    if (typeof value === 'string') {
      scheduleCatalogTranslate(`o:${groupKey}:${optionKey}`, value);
    }
    setStyleCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        groups: (prev.groups || []).map((g) => {
          if (g.key !== groupKey) return g;
          return {
            ...g,
            options: (g.options || []).map((o) => (o.key === optionKey ? { ...o, name: value } : o))
          };
        })
      };
    });
  };

  const deleteOption = async (groupKey, optionKey) => {
    setStyleCatalogSaving(true);
    try {
      const response = await api.delete('/settings/style-options/option', {
        params: { groupKey, optionKey }
      });
      setStyleCatalog(response.data?.catalog || styleCatalog);
      toast.success('Option deleted');
    } catch (error) {
      toast.error('Failed to delete option');
    }
    setStyleCatalogSaving(false);
  };

  const addOptionLocal = (groupKey) => {
    const draft = newOptionDraft[groupKey] || { key: '', name: '' };
    const candidateKey = sanitizeKey(draft.key || draft.name);
    if (!candidateKey) {
      toast.error('Enter option key or name');
      return;
    }

    setStyleCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        groups: (prev.groups || []).map((g) => {
          if (g.key !== groupKey) return g;
          const existing = (g.options || []).some((o) => o.key === candidateKey);
          if (existing) return g;
          const nextOptions = [...(g.options || []), {
            key: candidateKey,
            name: draft.name || '',
            image: null,
            imageUpdatedAt: Date.now(),
            enabled: true,
            sortOrder: (g.options || []).length
          }];
          return { ...g, options: nextOptions };
        })
      };
    });

    setNewOptionDraft((prev) => ({
      ...prev,
      [groupKey]: { key: '', name: '' }
    }));
  };

  const handleExportData = async () => {
    try {
      toast.loading('Preparing export...');
      const response = await api.get('/settings/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success('Data exported successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Export failed');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.new.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await api.put('/settings/password', {
        currentPassword: passwordData.current,
        newPassword: passwordData.new
      });
      toast.success('Password updated successfully');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    }
  };

  const Toggle = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-slate-600'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  );

  const SettingRow = ({ icon: Icon, title, description, children, onClick }) => (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 p-4 ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50' : ''} transition-colors`}
    >
      <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-gray-600 dark:text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-slate-100">{title}</p>
        {description && <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{description}</p>}
      </div>
      {children || (onClick && <ChevronRight className="w-5 h-5 text-gray-400" />)}
    </div>
  );

  return (
    <div data-tutorial="page-settings" className="max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settings.title', { defaultValue: 'Settings' })}</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">{t('settings.subtitle', { defaultValue: 'Manage your account preferences' })}</p>
      </div>

      <div className="space-y-6">
        {/* Horizontal Section Tabs (all screens) */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all ${
                  activeSection === section.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="min-w-0">

          {/* General Section */}
          {activeSection === 'general' && (
            <div className="space-y-6">
              {/* Business Profile */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.businessProfile', { defaultValue: 'Business Profile' })}</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-40 h-20 bg-gray-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center overflow-hidden px-3">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Upload className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl cursor-pointer transition-opacity">
                        <Upload className="w-5 h-5 text-white" />
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                      </label>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('settings.businessName', { defaultValue: 'Business Name' })}</label>
                      <input
                        type="text"
                        value={settings.businessName}
                        onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border-0 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                        placeholder={t('settings.placeholders.businessName', { defaultValue: 'Your business name' })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Language */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.language', { defaultValue: 'Language' })}</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-5 gap-3">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { setSettings({ ...settings, language: lang.code }); i18n.changeLanguage(lang.code); }}
                        className={`p-4 rounded-xl text-center transition-all ${
                          settings.language === lang.code
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                            : 'bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{lang.flag}</span>
                        <span className="text-xs font-medium">{lang.label}</span>
                      </button>
                    ))}
                </div>
              </div>
              </div>

              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice Language</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {invoiceLanguageOptions.map((option) => {
                      const active = settings.invoiceLanguage === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSettings((prev) => ({ ...prev, invoiceLanguage: option.value }))}
                          className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                            active
                              ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                              : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-white'
                          }`}
                        >
                          <div className="text-sm font-semibold">{option.title}</div>
                          <div className={`mt-1 text-xs ${active ? 'text-white/80 dark:text-gray-600' : 'text-gray-500 dark:text-slate-400'}`}>{option.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.receiptSettings', { defaultValue: 'Receipt Settings' })}</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('settings.receiptPrefix', { defaultValue: 'Receipt Prefix' })}</label>
                      <input
                        type="text"
                        value={autoReceiptPrefix}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border-0 rounded-xl"
                        placeholder={t('settings.placeholders.receiptPrefix', { defaultValue: 'RCP' })}
                        disabled
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('settings.receiptCounter', { defaultValue: 'Receipt Counter' })}</label>
                      <input
                        type="number"
                        value={settings.receiptCounter}
                        onChange={(e) => setSettings({ ...settings, receiptCounter: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border-0 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'measurements' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.sections.measurements', { defaultValue: 'Measurements' })}</h2>
                </div>

                <div className="p-6">
                  <div className="mb-6 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-stone-50 via-white to-slate-50 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-800/40 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Measurement UI</div>
                        <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">Choose between four premium measurement workspaces. All modes save the same measurements, thawb type, and style selections.</div>
                      </div>
                      <div className="inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-gray-600 dark:text-slate-300">
                        Active: {activeMeasurementUiLabel}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {measurementUiOptions.map((option) => {
                        const isActive = settings.measurementUi === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setSettings((prev) => ({ ...prev, measurementUi: option.value }))}
                            className={`rounded-[1.75rem] border p-4 text-left transition-all ${isActive ? option.activeClasses : option.inactiveClasses}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{option.title}</div>
                                <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{option.description}</div>
                              </div>
                              <div className={`rounded-full px-3 py-1 text-[11px] font-bold ${isActive ? option.badgeActiveClasses : option.badgeInactiveClasses}`}>{option.badge}</div>
                            </div>
                            {option.preview}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {measurementsCatalogLoading ? (
                    <div className="text-sm text-gray-500 dark:text-slate-400">{t('common.loading', { defaultValue: 'Loading...' })}</div>
                  ) : !measurementsCatalog?.fields?.length ? (
                    <div className="text-sm text-gray-500 dark:text-slate-400">{t('common.noData', { defaultValue: 'No data available' })}</div>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {(measurementsCatalog.fields || [])
                        .slice()
                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                        .map((field) => {
                          const imageUrl = field.image ? resolveUploadsUrl(field.image) : null;
                          const imageSrc = imageUrl ? `${imageUrl}${field.imageUpdatedAt ? `?v=${field.imageUpdatedAt}` : ''}` : null;
                          return (
                            <div key={field.key} className={`min-w-[260px] rounded-2xl border ${field.enabled === false ? 'border-gray-200 dark:border-slate-700 opacity-70' : 'border-gray-200 dark:border-slate-700'} bg-gradient-to-br from-gray-50 to-white dark:from-slate-900/40 dark:to-slate-900/10 p-4`}>
                              <div className="flex items-start gap-4">
                                <div className="w-16">
                                  <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 overflow-hidden">
                                    {imageSrc ? (
                                      <img src={imageSrc} alt={field.key} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600">
                                        <Upload className="w-6 h-6" />
                                      </div>
                                    )}
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                      <Upload className="w-5 h-5 text-white" />
                                      <input type="file" accept="image/*" onChange={(e) => uploadMeasurementImage(field.key, e.target.files?.[0])} className="hidden" />
                                    </label>
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">{field.key}</div>
                                  <input
                                    type="text"
                                    value={field.name || ''}
                                    onChange={(e) => updateMeasurementsField(field.key, { name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                    placeholder={t('settings.placeholders.displayNameOptional', { defaultValue: 'Display name (optional)' })}
                                  />
                                  {(catalogNameTranslating[`m:${field.key}`] || catalogNameI18nPreview[`m:${field.key}`]) ? (
                                    <div className="mt-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-3">
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="text-xs font-semibold text-gray-900 dark:text-slate-100">{t('common.translation', { defaultValue: 'Translation' })}</div>
                                        {catalogNameTranslating[`m:${field.key}`] ? (
                                          <div className="text-[11px] text-gray-500 dark:text-slate-400">{t('common.loading', { defaultValue: 'Loading...' })}</div>
                                        ) : null}
                                      </div>
                                      {catalogNameI18nPreview[`m:${field.key}`]?.[langKey] ? (
                                        <div className="mt-2 text-[11px] text-gray-700 dark:text-slate-200" dir={isRtl ? 'rtl' : 'ltr'}>
                                          {catalogNameI18nPreview[`m:${field.key}`]?.[langKey] || ''}
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500 dark:text-slate-400">{t('settings.enabled', { defaultValue: 'Enabled' })}</span>
                                      <Toggle enabled={field.enabled !== false} onChange={(v) => updateMeasurementsField(field.key, { enabled: v })} />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => deleteMeasurementImage(field.key)}
                                      className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                      title={t('settings.deleteImage', { defaultValue: 'Delete image' })}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'thawbTypes' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.sections.thawbTypes', { defaultValue: 'Thawb Types' })}</h2>
                </div>
                <div className="p-6">
                  {thawbTypesCatalogLoading ? (
                    <div className="text-sm text-gray-500 dark:text-slate-400">{t('common.loading', { defaultValue: 'Loading...' })}</div>
                  ) : !thawbTypesCatalog?.types?.length ? (
                    <div className="text-sm text-gray-500 dark:text-slate-400">{t('common.noData', { defaultValue: 'No data available' })}</div>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {(thawbTypesCatalog.types || [])
                        .slice()
                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                        .map((type) => {
                          const imageUrl = type.image ? resolveUploadsUrl(type.image) : null;
                          const imageSrc = imageUrl ? `${imageUrl}${type.imageUpdatedAt ? `?v=${type.imageUpdatedAt}` : ''}` : null;
                          return (
                            <div key={type.key} className={`min-w-[260px] rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-gray-50 to-white dark:from-slate-900/40 dark:to-slate-900/10 p-4 ${type.enabled === false ? 'opacity-70' : ''}`}>
                              <div className="flex items-start gap-4">
                                <div className="w-16">
                                  <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 overflow-hidden">
                                    {imageSrc ? (
                                      <img src={imageSrc} alt={type.key} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600">
                                        <Upload className="w-6 h-6" />
                                      </div>
                                    )}
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                      <Upload className="w-5 h-5 text-white" />
                                      <input type="file" accept="image/*" onChange={(e) => uploadThawbImage(type.key, e.target.files?.[0])} className="hidden" />
                                    </label>
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">{type.key}</div>
                                  <input
                                    type="text"
                                    value={type.name || ''}
                                    onChange={(e) => updateThawbType(type.key, { name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                    placeholder={t('settings.placeholders.displayNameOptional', { defaultValue: 'Display name (optional)' })}
                                  />
                                  {(catalogNameTranslating[`t:${type.key}`] || catalogNameI18nPreview[`t:${type.key}`]) ? (
                                    <div className="mt-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-3">
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="text-xs font-semibold text-gray-900 dark:text-slate-100">{t('common.translation', { defaultValue: 'Translation' })}</div>
                                        {catalogNameTranslating[`t:${type.key}`] ? (
                                          <div className="text-[11px] text-gray-500 dark:text-slate-400">{t('common.loading', { defaultValue: 'Loading...' })}</div>
                                        ) : null}
                                      </div>
                                      {catalogNameI18nPreview[`t:${type.key}`]?.[langKey] ? (
                                        <div className="mt-2 text-[11px] text-gray-700 dark:text-slate-200" dir={isRtl ? 'rtl' : 'ltr'}>
                                          {catalogNameI18nPreview[`t:${type.key}`]?.[langKey] || ''}
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500 dark:text-slate-400">{t('settings.enabled', { defaultValue: 'Enabled' })}</span>
                                      <Toggle enabled={type.enabled !== false} onChange={(v) => updateThawbType(type.key, { enabled: v })} />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => deleteThawbImage(type.key)}
                                      className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                      title={t('settings.deleteImage', { defaultValue: 'Delete image' })}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'fabricColors' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.sections.fabricColors', { defaultValue: 'Fabric Colors' })}</h2>
                </div>
                <div className="p-6">
                  {fabricColorsCatalogLoading ? (
                    <div className="text-sm text-gray-500 dark:text-slate-400">{t('common.loading', { defaultValue: 'Loading...' })}</div>
                  ) : !fabricColorsCatalog?.colors?.length ? (
                    <div className="text-sm text-gray-500 dark:text-slate-400">{t('common.noData', { defaultValue: 'No data available' })}</div>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {(fabricColorsCatalog.colors || [])
                        .slice()
                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                        .map((c) => (
                          <div key={c.key} className={`min-w-[260px] rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-gray-50 to-white dark:from-slate-900/40 dark:to-slate-900/10 p-4 ${c.enabled === false ? 'opacity-70' : ''}`}>
                            <div className="flex items-start gap-4">
                              <div className="w-16">
                                <div className="w-16 h-16 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center">
                                  <span className="w-10 h-10 rounded-full border border-gray-300 dark:border-slate-600" style={{ backgroundColor: c.hex || '#e5e7eb' }} />
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">{c.key}</div>
                                <input
                                  type="text"
                                  value={c.name || ''}
                                  onChange={(e) => updateFabricColor(c.key, { name: e.target.value })}
                                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                  placeholder={t('settings.placeholders.displayNameOptional', { defaultValue: 'Display name (optional)' })}
                                />
                                {(catalogNameTranslating[`c:${c.key}`] || catalogNameI18nPreview[`c:${c.key}`]) ? (
                                  <div className="mt-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="text-xs font-semibold text-gray-900 dark:text-slate-100">{t('common.translation', { defaultValue: 'Translation' })}</div>
                                      {catalogNameTranslating[`c:${c.key}`] ? (
                                        <div className="text-[11px] text-gray-500 dark:text-slate-400">{t('common.loading', { defaultValue: 'Loading...' })}</div>
                                      ) : null}
                                    </div>
                                    {catalogNameI18nPreview[`c:${c.key}`]?.[langKey] ? (
                                      <div className="mt-2 text-[11px] text-gray-700 dark:text-slate-200" dir={isRtl ? 'rtl' : 'ltr'}>
                                        {catalogNameI18nPreview[`c:${c.key}`]?.[langKey] || ''}
                                      </div>
                                    ) : null}
                                  </div>
                                ) : null}
                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 dark:text-slate-400">{t('settings.enabled', { defaultValue: 'Enabled' })}</span>
                                    <Toggle enabled={c.enabled !== false} onChange={(v) => updateFabricColor(c.key, { enabled: v })} />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={c.hex || '#e5e7eb'}
                                      onChange={(e) => updateFabricColor(c.key, { hex: e.target.value })}
                                      className="w-10 h-10 p-0 border-0 bg-transparent"
                                      title={t('settings.pickColor', { defaultValue: 'Pick color' })}
                                    />
                                    <input
                                      type="text"
                                      value={c.hex || ''}
                                      onChange={(e) => updateFabricColor(c.key, { hex: e.target.value })}
                                      className="w-24 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                                      placeholder={t('settings.placeholders.hex', { defaultValue: '#FFFFFF' })}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'styleOptions' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.sections.styleOptions', { defaultValue: 'Style Options' })}</h2>
                </div>

                <div className="p-6 space-y-6">
                  {styleCatalogLoading ? (
                    <div className="text-sm text-gray-500 dark:text-slate-400">{t('common.loading', { defaultValue: 'Loading...' })}</div>
                  ) : !styleCatalog?.groups?.length ? (
                    <div className="text-sm text-gray-500 dark:text-slate-400">{t('common.noData', { defaultValue: 'No data available' })}</div>
                  ) : (
                    (styleCatalog.groups || [])
                      .filter((g) => g && g.enabled !== false)
                      .slice()
                      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                      .map((group) => (
                        <div key={group.key} className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                          <div className="p-4 bg-gray-50 dark:bg-slate-900/40 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">{group.key}</div>
                              <input
                                type="text"
                                value={group.name || ''}
                                onChange={(e) => updateGroupName(group.key, e.target.value)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                placeholder={t('settings.placeholders.groupNameOptional', { defaultValue: 'Group name (optional)' })}
                              />
                              {(catalogNameTranslating[`g:${group.key}`] || catalogNameI18nPreview[`g:${group.key}`]) ? (
                                <div className="mt-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 p-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs font-semibold text-gray-900 dark:text-slate-100">{t('common.translation', { defaultValue: 'Translation' })}</div>
                                    {catalogNameTranslating[`g:${group.key}`] ? (
                                      <div className="text-[11px] text-gray-500 dark:text-slate-400">{t('common.loading', { defaultValue: 'Loading...' })}</div>
                                    ) : null}
                                  </div>
                                  {catalogNameI18nPreview[`g:${group.key}`]?.[langKey] ? (
                                    <div className="mt-2 text-[11px] text-gray-700 dark:text-slate-200" dir={isRtl ? 'rtl' : 'ltr'}>
                                      {catalogNameI18nPreview[`g:${group.key}`]?.[langKey] || ''}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="p-4 space-y-3">
                            {(group.options || [])
                              .filter((o) => o && o.enabled !== false)
                              .slice()
                              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                              .map((opt) => {
                                const imageUrl = opt.image ? resolveUploadsUrl(opt.image) : null;
                                const imageSrc = imageUrl ? `${imageUrl}${opt.imageUpdatedAt ? `?v=${opt.imageUpdatedAt}` : ''}` : null;

                                return (
                                  <div key={opt.key} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-700">
                                    <div className="w-16">
                                      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                                        {imageSrc ? (
                                          <img src={imageSrc} alt={opt.key} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600">
                                            <Upload className="w-6 h-6" />
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">{opt.key}</div>
                                      <input
                                        type="text"
                                        value={opt.name || ''}
                                        onChange={(e) => updateOptionName(group.key, opt.key, e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                        placeholder={t('settings.placeholders.displayNameOptional', { defaultValue: 'Display name (optional)' })}
                                      />
                                      {(catalogNameTranslating[`o:${group.key}:${opt.key}`] || catalogNameI18nPreview[`o:${group.key}:${opt.key}`]) ? (
                                        <div className="mt-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 p-3">
                                          <div className="flex items-center justify-between gap-3">
                                            <div className="text-xs font-semibold text-gray-900 dark:text-slate-100">{t('common.translation', { defaultValue: 'Translation' })}</div>
                                            {catalogNameTranslating[`o:${group.key}:${opt.key}`] ? (
                                              <div className="text-[11px] text-gray-500 dark:text-slate-400">{t('common.loading', { defaultValue: 'Loading...' })}</div>
                                            ) : null}
                                          </div>
                                          {catalogNameI18nPreview[`o:${group.key}:${opt.key}`]?.[langKey] ? (
                                            <div className="mt-2 text-[11px] text-gray-700 dark:text-slate-200" dir={isRtl ? 'rtl' : 'ltr'}>
                                              {catalogNameI18nPreview[`o:${group.key}:${opt.key}`]?.[langKey] || ''}
                                            </div>
                                          ) : null}
                                        </div>
                                      ) : null}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => deleteOption(group.key, opt.key)}
                                        className="p-2 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                        title={t('settings.deleteOption', { defaultValue: 'Delete option' })}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>

                                  </div>
                                );
                              })}

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                              <input
                                type="text"
                                value={(newOptionDraft[group.key]?.key) || ''}
                                onChange={(e) => setNewOptionDraft((prev) => ({ ...prev, [group.key]: { ...(prev[group.key] || { key: '', name: '' }), key: e.target.value } }))}
                                className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl"
                                placeholder={t('settings.placeholders.newOptionKey', { defaultValue: 'New option key' })}
                              />
                              <input
                                type="text"
                                value={(newOptionDraft[group.key]?.name) || ''}
                                onChange={(e) => setNewOptionDraft((prev) => ({ ...prev, [group.key]: { ...(prev[group.key] || { key: '', name: '' }), name: e.target.value } }))}
                                className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl"
                                placeholder={t('settings.placeholders.newOptionName', { defaultValue: 'New option name' })}
                              />
                              <button
                                type="button"
                                onClick={() => addOptionLocal(group.key)}
                                className="px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                {t('settings.addOption', { defaultValue: 'Add option' })}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Mode */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Theme Mode</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => { setSettings({ ...settings, theme: 'light' }); updateUser({ theme: 'light' }); }}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        settings.theme === 'light'
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                      }`}
                    >
                      <Sun className={`w-8 h-8 mx-auto mb-3 ${settings.theme === 'light' ? 'text-amber-500' : 'text-gray-400'}`} />
                      <span className="font-semibold text-gray-900 dark:text-white block">Light</span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">Clean & bright</span>
                      {settings.theme === 'light' && <Check className="w-5 h-5 text-amber-500 mx-auto mt-2" />}
                    </button>
                    <button
                      onClick={() => { setSettings({ ...settings, theme: 'dark' }); updateUser({ theme: 'dark' }); }}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        settings.theme === 'dark'
                          ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                      }`}
                    >
                      <Moon className={`w-8 h-8 mx-auto mb-3 ${settings.theme === 'dark' ? 'text-indigo-500' : 'text-gray-400'}`} />
                      <span className="font-semibold text-gray-900 dark:text-white block">Dark</span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">Easy on eyes</span>
                      {settings.theme === 'dark' && <Check className="w-5 h-5 text-indigo-500 mx-auto mt-2" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Accent Color</h2>
                </div>
                <div className="p-6">
                  <div className="flex gap-4">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => { setSettings({ ...settings, primaryColor: preset.name }); updateUser({ primaryColor: preset.name }); }}
                        className={`w-12 h-12 rounded-full transition-all ${
                          settings.primaryColor === preset.name ? 'ring-4 ring-offset-4 ring-gray-900 dark:ring-white dark:ring-offset-slate-900 scale-110' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: preset.color }}
                      >
                        {settings.primaryColor === preset.name && <Check className="w-5 h-5 text-white mx-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                <SettingRow icon={Bell} title="Order Updates" description="Get notified when order status changes">
                  <Toggle enabled={settings.notifications.orderUpdates} onChange={(v) => setSettings({...settings, notifications: {...settings.notifications, orderUpdates: v}})} />
                </SettingRow>
                <SettingRow icon={Mail} title="Payment Reminders" description="Reminders for pending payments">
                  <Toggle enabled={settings.notifications.paymentReminders} onChange={(v) => setSettings({...settings, notifications: {...settings.notifications, paymentReminders: v}})} />
                </SettingRow>
                <SettingRow icon={FileText} title="Weekly Reports" description="Receive weekly business summary">
                  <Toggle enabled={settings.notifications.weeklyReport} onChange={(v) => setSettings({...settings, notifications: {...settings.notifications, weeklyReport: v}})} />
                </SettingRow>
                <SettingRow icon={Smartphone} title="Sound Effects" description="Play sounds for notifications">
                  <Toggle enabled={settings.notifications.sound} onChange={(v) => setSettings({...settings, notifications: {...settings.notifications, sound: v}})} />
                </SettingRow>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.security.changePassword', { defaultValue: 'Change Password' })}</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('settings.security.currentPassword', { defaultValue: 'Current Password' })}</label>
                    <input
                      type="password"
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border-0 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('settings.security.newPassword', { defaultValue: 'New Password' })}</label>
                    <input
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border-0 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('settings.security.confirmPassword', { defaultValue: 'Confirm Password' })}</label>
                    <input
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border-0 rounded-xl"
                    />
                  </div>
                  <button
                    onClick={handlePasswordChange}
                    className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    {t('settings.security.updatePassword', { defaultValue: 'Update Password' })}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data Section */}
          {activeSection === 'data' && (
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.data.title', { defaultValue: 'Data Management' })}</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                <SettingRow icon={Download} title={t('settings.data.exportData', { defaultValue: 'Export Data' })} description={t('settings.data.exportDesc', { defaultValue: 'Download all your data as JSON' })} onClick={handleExportData} />
                <SettingRow icon={Database} title={t('settings.data.storageUsed', { defaultValue: 'Storage Used' })} description={t('settings.data.storageDesc', { defaultValue: 'Calculate your storage usage' })}>
                  <span className="text-sm text-gray-500">— MB</span>
                </SettingRow>
                <SettingRow icon={Trash2} title={t('settings.data.clearCache', { defaultValue: 'Clear Cache' })} description={t('settings.data.clearCacheDesc', { defaultValue: 'Clear temporary app data' })} onClick={() => { localStorage.clear(); toast.success(t('settings.data.cacheCleared', { defaultValue: 'Cache cleared' })); }} />
              </div>
            </div>
          )}

          {/* About Section */}
          {activeSection === 'about' && (
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.about.title', { defaultValue: 'About KhayyatOS' })}</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                <SettingRow icon={Info} title={t('settings.about.version', { defaultValue: 'Version' })} description={t('settings.about.versionDesc', { defaultValue: 'Current app version' })}>
                  <span className="text-sm font-mono text-gray-500">v2.0.0</span>
                </SettingRow>
                <SettingRow icon={HelpCircle} title={t('settings.about.help', { defaultValue: 'Help & Support' })} description={t('settings.about.helpDesc', { defaultValue: 'Get help with the app' })} onClick={() => window.open('/help', '_blank')} />
                <SettingRow icon={FileText} title={t('settings.about.terms', { defaultValue: 'Terms of Service' })} description={t('settings.about.termsDesc', { defaultValue: 'Read our terms' })} onClick={() => window.open('/terms', '_blank')} />
                <SettingRow icon={Shield} title={t('settings.about.privacy', { defaultValue: 'Privacy Policy' })} description={t('settings.about.privacyDesc', { defaultValue: 'How we protect your data' })} onClick={() => window.open('/privacy', '_blank')} />
              </div>
              <div className="p-6 text-center text-sm text-gray-500 dark:text-slate-400">
                {t('settings.about.madeForTailors', { defaultValue: 'Made with ❤️ for tailors everywhere' })}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSaveClick}
              disabled={loading || styleCatalogSaving || measurementsCatalogSaving || thawbTypesCatalogSaving || fabricColorsCatalogSaving}
              className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {loading || styleCatalogSaving || measurementsCatalogSaving || thawbTypesCatalogSaving || fabricColorsCatalogSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {t('settings.saveChanges', { defaultValue: 'Save Changes' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
