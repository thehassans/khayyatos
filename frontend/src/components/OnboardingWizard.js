import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from './ui/Modal';
import { Button } from './ui/Button';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const EXAMPLE_CUSTOMER_NAME = 'Example Customer';
const EXAMPLE_CUSTOMER_PHONE = '0512456789';
const AUTO_STEP_DELAY_MS = 4500;
const AUTO_STEP_DELAY_LONG_MS = 6500;

const measurementTen = () => ({
  length: 10,
  shoulderWidth: 10,
  chest: 10,
  waist: 10,
  hips: 10,
  sleeveLength: 10,
  bicep: 10,
  forearm: 10,
  neck: 10,
  wrist: 10,
  cuffWidth: 10,
  expansion: 10,
  armhole: 10,
  bottom: 10
});

const OnboardingWizard = ({ isOpen, openSource = 'auto', onClose }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { api, user, updateUser } = useAuth();

  const steps = useMemo(() => {
    return [
      {
        key: 'language',
        title: t('onboardingWizard.language.title'),
        description: t('onboardingWizard.language.description'),
        target: '[data-tutorial="header-tutorial"]'
      },
      {
        key: 'dashboard',
        title: t('onboardingWizard.steps.dashboard.title'),
        description: t('onboardingWizard.steps.dashboard.description'),
        actions: [
          { label: t('onboardingWizard.steps.dashboard.action'), to: '/user/dashboard' }
        ],
        target: '[data-tutorial="page-dashboard"]',
        autoTo: '/user/dashboard'
      },
      {
        key: 'createWorker',
        title: t('onboardingWizard.steps.createWorker.title'),
        description: t('onboardingWizard.steps.createWorker.description'),
        actions: [
          { label: t('onboardingWizard.steps.createWorker.action'), to: '/user/workers/new' }
        ],
        target: '[data-tutorial="workers-create-button"]',
        autoTo: '/user/workers?tutorial=1'
      },
      {
        key: 'workerAmounts',
        title: t('onboardingWizard.steps.workerAmounts.title'),
        description: t('onboardingWizard.steps.workerAmounts.description'),
        actions: [
          { label: t('onboardingWizard.steps.workerAmounts.action'), to: '/user/worker-amounts' }
        ],
        target: '[data-tutorial="page-worker-amounts"]',
        autoTo: '/user/worker-amounts'
      },
      {
        key: 'createCustomer',
        title: t('onboardingWizard.steps.createCustomer.title'),
        description: t('onboardingWizard.steps.createCustomer.description', { phone: EXAMPLE_CUSTOMER_PHONE }),
        actions: [
          { label: t('onboardingWizard.steps.createCustomer.action'), to: `/user/customers/new?tutorial=1&name=${encodeURIComponent(EXAMPLE_CUSTOMER_NAME)}&phone=${encodeURIComponent(EXAMPLE_CUSTOMER_PHONE)}` }
        ],
        target: '[data-tutorial="customers-create-button"]',
        autoTo: '/user/customers?tutorial=1'
      },
      {
        key: 'createOrder',
        title: t('onboardingWizard.steps.createOrder.title'),
        description: t('onboardingWizard.steps.createOrder.description', { phone: EXAMPLE_CUSTOMER_PHONE }),
        actions: [
          { label: t('onboardingWizard.steps.createOrder.action'), to: `/user/stitchings/new?tutorial=1&customerPhone=${encodeURIComponent(EXAMPLE_CUSTOMER_PHONE)}&fillMeasurements=1` }
        ],
        target: '[data-tutorial="stitchings-create-button"]',
        autoTo: '/user/stitchings?tutorial=1'
      },
      {
        key: 'embroidery',
        title: t('onboardingWizard.steps.embroidery.title'),
        description: t('onboardingWizard.steps.embroidery.description'),
        actions: [
          { label: t('onboardingWizard.steps.embroidery.action'), to: '/user/embroidery-designs?tutorial=1' }
        ],
        target: '[data-tutorial="embroidery-upload-button"]',
        autoTo: '/user/embroidery-designs?tutorial=1'
      },
      {
        key: 'laundry',
        title: t('onboardingWizard.steps.laundry.title'),
        description: t('onboardingWizard.steps.laundry.description'),
        actions: [
          { label: t('onboardingWizard.steps.laundry.action'), to: '/user/laundry?tutorial=1' }
        ],
        target: '[data-tutorial="laundry-create-button"]',
        autoTo: '/user/laundry?tutorial=1'
      },
      {
        key: 'fabrics',
        title: t('onboardingWizard.steps.fabrics.title'),
        description: t('onboardingWizard.steps.fabrics.description'),
        actions: [
          { label: t('onboardingWizard.steps.fabrics.action'), to: '/user/fabrics?tutorial=1' }
        ],
        target: '[data-tutorial="fabrics-create-button"]',
        autoTo: '/user/fabrics?tutorial=1'
      },
      {
        key: 'loyalty',
        title: t('onboardingWizard.steps.loyalty.title'),
        description: t('onboardingWizard.steps.loyalty.description'),
        actions: [
          { label: t('onboardingWizard.steps.loyalty.action'), to: '/user/loyalty' }
        ],
        target: '[data-tutorial="page-loyalty"]',
        autoTo: '/user/loyalty'
      },
      {
        key: 'whatsapp',
        title: t('onboardingWizard.steps.whatsapp.title'),
        description: t('onboardingWizard.steps.whatsapp.description'),
        actions: [
          { label: t('onboardingWizard.steps.whatsapp.action'), to: '/user/whatsapp' }
        ],
        target: '[data-tutorial="page-whatsapp"]',
        autoTo: '/user/whatsapp'
      },
      {
        key: 'settingsCatalogs',
        title: t('onboardingWizard.steps.settingsCatalogs.title'),
        description: t('onboardingWizard.steps.settingsCatalogs.description'),
        actions: [
          { label: t('onboardingWizard.steps.settingsCatalogs.actions.styleOptions'), to: '/user/settings?section=styleOptions' },
          { label: t('onboardingWizard.steps.settingsCatalogs.actions.measurements'), to: '/user/settings?section=measurements' },
          { label: t('onboardingWizard.steps.settingsCatalogs.actions.thawbTypes'), to: '/user/settings?section=thawbTypes' },
          { label: t('onboardingWizard.steps.settingsCatalogs.actions.fabricColors'), to: '/user/settings?section=fabricColors' }
        ],
        target: '[data-tutorial="page-settings"]',
        autoTo: '/user/settings?section=styleOptions'
      }
    ];
  }, [i18n?.language, t]);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState('');
  const [autoTick, setAutoTick] = useState(0);
  const bootstrappedRef = useRef(false);
  const autoTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const autoBusyRef = useRef(false);
  const executedRef = useRef(new Set());
  const [exampleCustomerId, setExampleCustomerId] = useState(null);
  const [exampleOrderId, setExampleOrderId] = useState(null);
  const [spotlight, setSpotlight] = useState(null);
  const spotlightDidScrollRef = useRef(false);
  const [coachmark, setCoachmark] = useState(null);
  const coachmarkRef = useRef(null);
  const [coachmarkRect, setCoachmarkRect] = useState(null);
  const coachmarkArrowRef = useRef(null);
  const arrowAnimRafRef = useRef(0);
  const arrowAnimatedStepRef = useRef(null);
  const [arrowStroke, setArrowStroke] = useState({ len: 0, offset: 0, animate: false });

  const langKey = (i18n?.language || 'en').split('-')[0];
  const isRtl = langKey === 'ar' || langKey === 'ur';

  useEffect(() => {
    if (!isOpen) {
      bootstrappedRef.current = false;
      executedRef.current = new Set();
      if (autoTimeoutRef.current) {
        clearTimeout(autoTimeoutRef.current);
        autoTimeoutRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      setSpotlight(null);
      spotlightDidScrollRef.current = false;
      return;
    }
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const s = Number(user?.onboardingStep);
    const safe = Number.isFinite(s) && s >= 0 ? s : 0;
    const userLang = (user?.language || i18n?.language || 'en').split('-')[0];
    setLanguage(userLang);

    if (openSource === 'manual' && userLang) {
      setStep(1);
      return;
    }

    setStep(Math.max(0, Math.min(safe, steps.length - 1)));
  }, [isOpen, openSource, steps.length, user?.onboardingStep, user?.language, i18n?.language]);

  useEffect(() => {
    if (!isOpen) return;

    const target = steps?.[step]?.target;
    if (!target || typeof window === 'undefined') {
      setSpotlight(null);
      return;
    }

    setSpotlight(null);
    spotlightDidScrollRef.current = false;

    let alive = true;
    let tries = 0;

    const compute = () => {
      if (!alive) return;
      const el = document.querySelector(target);
      if (!el) {
        tries += 1;
        if (tries < 60) {
          setTimeout(compute, 250);
        } else {
          setSpotlight(null);
        }
        return;
      }

      if (!spotlightDidScrollRef.current) {
        spotlightDidScrollRef.current = true;
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        } catch (e) {

        }
      }

      const rect = el.getBoundingClientRect();
      const pad = 6;
      setSpotlight({
        top: Math.max(0, rect.top - pad),
        left: Math.max(0, rect.left - pad),
        width: Math.min(window.innerWidth, rect.width + pad * 2),
        height: Math.min(window.innerHeight, rect.height + pad * 2)
      });
    };

    compute();

    const onResize = () => compute();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);

    return () => {
      alive = false;
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [isOpen, step, steps]);

  useEffect(() => {
    if (!isOpen) {
      setCoachmark(null);
      setCoachmarkRect(null);
      return;
    }
    if (!spotlight || typeof window === 'undefined') {
      setCoachmark(null);
      setCoachmarkRect(null);
      return;
    }

    const vw = window.innerWidth || 0;
    const vh = window.innerHeight || 0;
    const margin = 14;
    const boxW = Math.min(380, Math.max(260, vw - margin * 2));

    const rightSpace = vw - (spotlight.left + spotlight.width);
    const leftSpace = spotlight.left;
    const topSpace = spotlight.top;
    const bottomSpace = vh - (spotlight.top + spotlight.height);

    let placement = 'bottom';

    const wantRight = !isRtl;
    if (wantRight && rightSpace >= boxW + margin) placement = 'right';
    else if (!wantRight && leftSpace >= boxW + margin) placement = 'left';
    else if (bottomSpace >= 220) placement = 'bottom';
    else if (topSpace >= 220) placement = 'top';
    else placement = rightSpace >= leftSpace ? 'right' : 'left';

    const centerY = spotlight.top + spotlight.height / 2;
    const centerX = spotlight.left + spotlight.width / 2;

    let top = margin;
    let left = margin;

    if (placement === 'right') {
      left = Math.min(vw - boxW - margin, spotlight.left + spotlight.width + margin);
      top = Math.min(vh - margin - 60, Math.max(margin, centerY - 120));
    } else if (placement === 'left') {
      left = Math.max(margin, spotlight.left - boxW - margin);
      top = Math.min(vh - margin - 60, Math.max(margin, centerY - 120));
    } else if (placement === 'top') {
      left = Math.min(vw - boxW - margin, Math.max(margin, centerX - boxW / 2));
      top = Math.max(margin, spotlight.top - margin - 220);
    } else {
      left = Math.min(vw - boxW - margin, Math.max(margin, centerX - boxW / 2));
      top = Math.min(vh - margin - 220, spotlight.top + spotlight.height + margin);
    }

    setCoachmark({ top, left, placement, width: boxW });
  }, [isOpen, isRtl, spotlight, step]);

  const coachmarkArrowPath = useMemo(() => {
    if (!coachmarkRect || !spotlight || !coachmark?.placement) return null;

    const endX = spotlight.left + spotlight.width / 2;
    const endY = spotlight.top + spotlight.height / 2;

    let startX = coachmarkRect.left + coachmarkRect.width / 2;
    let startY = coachmarkRect.top + coachmarkRect.height / 2;

    if (coachmark.placement === 'left') {
      startX = coachmarkRect.left + coachmarkRect.width;
      startY = coachmarkRect.top + coachmarkRect.height / 2;
    } else if (coachmark.placement === 'right') {
      startX = coachmarkRect.left;
      startY = coachmarkRect.top + coachmarkRect.height / 2;
    } else if (coachmark.placement === 'top') {
      startX = coachmarkRect.left + coachmarkRect.width / 2;
      startY = coachmarkRect.top + coachmarkRect.height;
    } else {
      startX = coachmarkRect.left + coachmarkRect.width / 2;
      startY = coachmarkRect.top;
    }

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    const curve = 110;
    let controlX = midX;
    let controlY = midY;

    if (coachmark.placement === 'left' || coachmark.placement === 'right') {
      controlY = midY - curve;
    } else {
      controlX = midX + (isRtl ? -curve : curve);
    }

    return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
  }, [coachmark?.placement, coachmarkRect, isRtl, spotlight]);

  useEffect(() => {
    if (!isOpen) return;
    if (!coachmarkRef.current) return;

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = coachmarkRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setCoachmarkRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      });
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [isOpen, coachmark, step]);

  useEffect(() => {
    if (!isOpen) return;
    if (!coachmarkArrowRef.current) return;
    if (!coachmarkArrowPath) return;

    let len = 0;
    try {
      len = coachmarkArrowRef.current.getTotalLength();
    } catch (e) {
      len = 0;
    }

    const shouldAnimate = arrowAnimatedStepRef.current !== step;
    if (shouldAnimate) {
      arrowAnimatedStepRef.current = step;
      setArrowStroke({ len, offset: len, animate: false });
      cancelAnimationFrame(arrowAnimRafRef.current);
      arrowAnimRafRef.current = requestAnimationFrame(() => {
        arrowAnimRafRef.current = requestAnimationFrame(() => {
          setArrowStroke({ len, offset: 0, animate: true });
        });
      });
    } else {
      setArrowStroke((s) => ({ ...s, len, offset: 0, animate: true }));
    }

    return () => {
      cancelAnimationFrame(arrowAnimRafRef.current);
    };
  }, [coachmarkArrowPath, isOpen, step]);

  const waitForElement = useCallback((selector, timeoutMs = 12000) => {
    if (!selector || typeof window === 'undefined') return Promise.resolve(null);
    return new Promise((resolve) => {
      const found = document.querySelector(selector);
      if (found) return resolve(found);

      let done = false;
      const finish = (el) => {
        if (done) return;
        done = true;
        try {
          observer.disconnect();
        } catch (e) {

        }
        clearTimeout(timer);
        resolve(el || null);
      };

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) finish(el);
      });

      try {
        observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
      } catch (e) {

      }

      const timer = setTimeout(() => finish(null), timeoutMs);
    });
  }, []);

  const savePreferences = useCallback(async (payload) => {
    try {
      setSaving(true);
      const res = await api.put('/settings/preferences', payload);
      const next = res?.data?.settings || {};
      updateUser({
        language: next.language,
        theme: next.theme,
        onboardingCompleted: next.onboardingCompleted,
        onboardingStep: next.onboardingStep
      });
      setSaving(false);
      return true;
    } catch (e) {
      setSaving(false);
      toast.error(e.response?.data?.error || t('common.error'));
      return false;
    }
  }, [api, t, updateUser]);

  const goToStep = useCallback(async (nextStep) => {
    if (autoTimeoutRef.current) {
      clearTimeout(autoTimeoutRef.current);
      autoTimeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    const safe = Math.max(0, Math.min(nextStep, steps.length - 1));
    setStep(safe);
    await savePreferences({ onboardingStep: safe });
  }, [savePreferences, steps.length]);

  const handleFinish = useCallback(async () => {
    if (autoTimeoutRef.current) {
      clearTimeout(autoTimeoutRef.current);
      autoTimeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    const ok = await savePreferences({ onboardingCompleted: true, onboardingStep: steps.length - 1 });
    if (!ok) return;
    onClose?.();
  }, [onClose, savePreferences, steps.length]);

  const handleLanguageContinue = useCallback(async () => {
    if (!language) return;
    try {
      await i18n.changeLanguage(language);
    } catch (e) {

    }
    const ok = await savePreferences({ language, onboardingStep: 1 });
    if (!ok) return;
    setStep(1);
  }, [i18n, language, savePreferences]);

  const ensureExampleCustomer = useCallback(async () => {
    if (exampleCustomerId) return exampleCustomerId;

    const normalizePhone = (p) => String(p || '').replace(/\D/g, '').replace(/^0+/, '');
    const want = normalizePhone(EXAMPLE_CUSTOMER_PHONE);

    try {
      const search = await api.get(`/customers?search=${encodeURIComponent(EXAMPLE_CUSTOMER_PHONE)}`);
      const list = Array.isArray(search.data) ? search.data : search.data?.customers || [];
      const found = list.find((c) => normalizePhone(c?.phone) === want);
      if (found?._id) {
        setExampleCustomerId(found._id);
        return found._id;
      }
    } catch (e) {

    }

    try {
      const res = await api.post('/customers', {
        name: EXAMPLE_CUSTOMER_NAME,
        phone: EXAMPLE_CUSTOMER_PHONE,
        measurements: measurementTen()
      });
      const customer = res?.data?.customer || res?.data;
      const id = customer?._id;
      if (id) setExampleCustomerId(id);
      return id;
    } catch (e) {
      try {
        const search = await api.get(`/customers?search=${encodeURIComponent(EXAMPLE_CUSTOMER_PHONE)}`);
        const list = Array.isArray(search.data) ? search.data : search.data?.customers || [];
        const found = list.find((c) => normalizePhone(c?.phone) === want);
        if (found?._id) {
          setExampleCustomerId(found._id);
          return found._id;
        }
      } catch (e2) {

      }
      throw e;
    }
  }, [api, exampleCustomerId]);

  const ensureExampleOrder = useCallback(async (customerId) => {
    if (exampleOrderId) return exampleOrderId;
    try {
      const existing = await api.get(`/stitchings/search?phone=${encodeURIComponent(EXAMPLE_CUSTOMER_PHONE)}`);
      const list = Array.isArray(existing.data?.stitchings) ? existing.data.stitchings : [];
      const match = list.find((s) => {
        const cid = s?.customerId?._id || s?.customerId;
        if (String(cid || '') !== String(customerId || '')) return false;
        return String(s?.description || '') === 'Tutorial order';
      });
      if (match?._id) {
        setExampleOrderId(match._id);
        return match._id;
      }
    } catch (e) {

    }
    const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await api.post('/stitchings', {
      customerId,
      quantity: 1,
      price: 100,
      paidAmount: 0,
      description: 'Tutorial order',
      dueDate: due,
      thawbType: 'saudi',
      measurements: measurementTen(),
      styleOptions: {}
    });
    const order = res?.data?.stitching || res?.data;
    const id = order?._id;
    if (id) setExampleOrderId(id);
    return id;
  }, [api, exampleOrderId]);

  useEffect(() => {
    if (!isOpen) return;
    if (step === 0) return;
    if (!api) return;

    const currentStep = steps?.[step];
    if (!currentStep?.key) return;

    const execKey = `${openSource}:${currentStep.key}:${step}`;
    if (executedRef.current.has(execKey)) return;
    executedRef.current.add(execKey);

    let alive = true;

    const run = async () => {
      if (user?.isDemoSession) return;

      autoBusyRef.current = true;
      try {
        if (currentStep.key === 'createCustomer') {
          if (alive) navigate('/user/customers?tutorial=1');
          void ensureExampleCustomer().catch(() => {});
        } else if (currentStep.key === 'createOrder') {
          if (alive) navigate('/user/stitchings?tutorial=1');
          void ensureExampleCustomer()
            .then((cid) => (cid ? ensureExampleOrder(cid) : null))
            .catch(() => {});
        } else if (typeof currentStep.autoTo === 'string' && currentStep.autoTo) {
          navigate(currentStep.autoTo);
        }
      } catch (e) {
        toast.error(e?.response?.data?.error || e?.message || t('common.error'));
        executedRef.current.delete(execKey);
        autoBusyRef.current = false;
        return;
      }

      autoBusyRef.current = false;

      if (!alive) return;

      const readyEl = await waitForElement(currentStep?.target, 12000);
      if (!alive) return;
      if (currentStep?.target && !readyEl) {
        executedRef.current.delete(execKey);
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
        retryTimeoutRef.current = setTimeout(() => {
          if (!alive) return;
          setAutoTick((x) => x + 1);
        }, 900);
        return;
      }

      if (autoTimeoutRef.current) {
        clearTimeout(autoTimeoutRef.current);
        autoTimeoutRef.current = null;
      }
      const delay = (currentStep.key === 'createCustomer' || currentStep.key === 'createOrder')
        ? AUTO_STEP_DELAY_LONG_MS
        : AUTO_STEP_DELAY_MS;

      autoTimeoutRef.current = setTimeout(() => {
        if (!alive) return;
        if (step < steps.length - 1) {
          goToStep(step + 1);
        } else {
          handleFinish();
        }
      }, delay);
    };

    run();
    return () => {
      alive = false;
    };
  }, [api, autoTick, ensureExampleCustomer, ensureExampleOrder, goToStep, handleFinish, isOpen, navigate, openSource, step, steps, t, user?.isDemoSession, waitForElement]);

  const current = steps[step] || steps[0];
  const totalSteps = steps.length;

  if (!isOpen) return null;

  if (step === 0) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title={t('onboardingWizard.title')}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{current.title}</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-300 whitespace-pre-line">{current.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { code: 'en', label: 'English' },
              { code: 'ar', label: 'العربية' },
              { code: 'hi', label: 'हिन्दी' },
              { code: 'ur', label: 'اردو' },
              { code: 'bn', label: 'বাংলা' }
            ].map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code)}
                className={`p-4 rounded-2xl border text-left transition-colors ${
                  language === l.code
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{l.label}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">{l.code.toUpperCase()}</div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              {t('onboardingWizard.buttons.skipForNow')}
            </Button>
            <Button onClick={handleLanguageContinue} disabled={!language || saving} loading={saving}>
              {t('onboardingWizard.buttons.startTutorial')}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <>
      {spotlight ? (
        <div className="fixed inset-0 z-[110] pointer-events-none">
          <div className="absolute inset-0 bg-black/30 transition-opacity duration-300" />
          <div
            className="absolute rounded-2xl border-2 border-primary-400 shadow-[0_0_0_10px_rgba(59,130,246,0.22)] animate-pulse transition-all duration-300 ease-out"
            style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}
          />
          <div
            className="absolute"
            style={{
              top: Math.max(0, spotlight.top - 14),
              left: Math.max(0, spotlight.left + spotlight.width / 2 - 6)
            }}
          >
            <div className="relative">
              <div className="absolute inline-flex h-3 w-3 rounded-full bg-primary-400 opacity-75 animate-ping" />
              <div className="relative inline-flex h-3 w-3 rounded-full bg-primary-500 shadow" />
            </div>
          </div>
        </div>
      ) : null}

      {spotlight && coachmarkArrowPath ? (
        <svg className="fixed inset-0 z-[115] pointer-events-none" width="100%" height="100%">
          <defs>
            <marker
              id="coachmark-arrowhead"
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="6"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M 0 0 L 0 12 L 12 6 z" fill="rgba(2,6,23,0.92)" />
            </marker>
          </defs>
          <path
            ref={coachmarkArrowRef}
            d={coachmarkArrowPath}
            fill="none"
            stroke="rgba(2,6,23,0.92)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd="url(#coachmark-arrowhead)"
            style={{
              filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.45))',
              strokeDasharray: arrowStroke.len ? `${arrowStroke.len}` : undefined,
              strokeDashoffset: arrowStroke.len ? `${arrowStroke.offset}` : undefined,
              transition: arrowStroke.animate
                ? 'stroke-dashoffset 900ms cubic-bezier(0.2, 0.9, 0.2, 1)'
                : 'none'
            }}
          />
        </svg>
      ) : null}

      <div
        className="fixed z-[120] pointer-events-auto transition-all duration-300 ease-out"
        ref={coachmarkRef}
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{
          top: coachmark?.top ?? 16,
          left: coachmark?.left ?? 16,
          width: coachmark?.width ?? 360
        }}
      >
        <div className="relative transition-all duration-300 ease-out">
          <div className="rounded-[28px] p-[1px] bg-gradient-to-br from-white/15 via-white/5 to-white/10 shadow-2xl shadow-black/50">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/90 backdrop-blur-2xl">
              <div className="px-5 pt-5">
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400"
                    style={{ width: `${Math.max(5, Math.min(100, (Math.max(1, step) / Math.max(1, totalSteps - 1)) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="flex items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold tracking-wide text-white/60">
                    {t('onboardingWizard.stepCount', { current: Math.min(step, totalSteps - 1), total: totalSteps - 1 })}
                  </div>
                  <div className="text-sm font-bold text-white truncate">{current.title}</div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-white/10"
                  aria-label={t('common.close')}
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>

              <div className="px-5 pb-5 space-y-4">
                <div className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
                  {current.description}
                </div>

                {Array.isArray(current.actions) && current.actions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {current.actions.map((a, idx) => (
                      <Button
                        key={`${current.key}-${idx}`}
                        variant={idx === 0 ? 'outline' : 'secondary'}
                        size="sm"
                        onClick={() => navigate(a.to)}
                        disabled={saving}
                        className="rounded-2xl"
                      >
                        {a.label}
                      </Button>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => goToStep(step - 1)}
                    disabled={saving || step <= 1}
                    className="rounded-2xl"
                  >
                    {t('common.back')}
                  </Button>

                  {step < totalSteps - 1 ? (
                    <Button size="sm" onClick={() => goToStep(step + 1)} disabled={saving} loading={saving} className="rounded-2xl">
                      {t('common.next')}
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleFinish} disabled={saving} loading={saving} className="rounded-2xl">
                      {t('onboardingWizard.buttons.finish')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingWizard;
