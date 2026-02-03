import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from './ui/Modal';
import { Button } from './ui/Button';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const EXAMPLE_CUSTOMER_PHONE = '0512456789';

const OnboardingWizard = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { api, user, updateUser } = useAuth();

  const steps = useMemo(() => {
    return [
      {
        key: 'language',
        title: t('onboardingWizard.language.title'),
        description: t('onboardingWizard.language.description')
      },
      {
        key: 'dashboard',
        title: t('onboardingWizard.steps.dashboard.title'),
        description: t('onboardingWizard.steps.dashboard.description'),
        actions: [
          { label: t('onboardingWizard.steps.dashboard.action'), to: '/user/dashboard' }
        ]
      },
      {
        key: 'createWorker',
        title: t('onboardingWizard.steps.createWorker.title'),
        description: t('onboardingWizard.steps.createWorker.description'),
        actions: [
          { label: t('onboardingWizard.steps.createWorker.action'), to: '/user/workers/new' }
        ]
      },
      {
        key: 'workerAmounts',
        title: t('onboardingWizard.steps.workerAmounts.title'),
        description: t('onboardingWizard.steps.workerAmounts.description'),
        actions: [
          { label: t('onboardingWizard.steps.workerAmounts.action'), to: '/user/worker-amounts' }
        ]
      },
      {
        key: 'createCustomer',
        title: t('onboardingWizard.steps.createCustomer.title'),
        description: t('onboardingWizard.steps.createCustomer.description', { phone: EXAMPLE_CUSTOMER_PHONE }),
        actions: [
          { label: t('onboardingWizard.steps.createCustomer.action'), to: `/user/customers/new?tutorial=1&name=${encodeURIComponent('Example Customer')}&phone=${encodeURIComponent(EXAMPLE_CUSTOMER_PHONE)}` }
        ]
      },
      {
        key: 'createOrder',
        title: t('onboardingWizard.steps.createOrder.title'),
        description: t('onboardingWizard.steps.createOrder.description', { phone: EXAMPLE_CUSTOMER_PHONE }),
        actions: [
          { label: t('onboardingWizard.steps.createOrder.action'), to: `/user/stitchings/new?tutorial=1&customerPhone=${encodeURIComponent(EXAMPLE_CUSTOMER_PHONE)}&fillMeasurements=1` }
        ]
      },
      {
        key: 'embroidery',
        title: t('onboardingWizard.steps.embroidery.title'),
        description: t('onboardingWizard.steps.embroidery.description'),
        actions: [
          { label: t('onboardingWizard.steps.embroidery.action'), to: '/user/embroidery-designs?tutorial=1&create=1' }
        ]
      },
      {
        key: 'laundry',
        title: t('onboardingWizard.steps.laundry.title'),
        description: t('onboardingWizard.steps.laundry.description'),
        actions: [
          { label: t('onboardingWizard.steps.laundry.action'), to: '/user/laundry?tutorial=1&create=1' }
        ]
      },
      {
        key: 'fabrics',
        title: t('onboardingWizard.steps.fabrics.title'),
        description: t('onboardingWizard.steps.fabrics.description'),
        actions: [
          { label: t('onboardingWizard.steps.fabrics.action'), to: '/user/fabrics?tutorial=1&create=1' }
        ]
      },
      {
        key: 'loyalty',
        title: t('onboardingWizard.steps.loyalty.title'),
        description: t('onboardingWizard.steps.loyalty.description'),
        actions: [
          { label: t('onboardingWizard.steps.loyalty.action'), to: '/user/loyalty' }
        ]
      },
      {
        key: 'whatsapp',
        title: t('onboardingWizard.steps.whatsapp.title'),
        description: t('onboardingWizard.steps.whatsapp.description'),
        actions: [
          { label: t('onboardingWizard.steps.whatsapp.action'), to: '/user/whatsapp' }
        ]
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
        ]
      }
    ];
  }, [i18n?.language, t]);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState('');
  const bootstrappedRef = useRef(false);

  const langKey = (i18n?.language || 'en').split('-')[0];
  const isRtl = langKey === 'ar' || langKey === 'ur';

  useEffect(() => {
    if (!isOpen) {
      bootstrappedRef.current = false;
      return;
    }
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const s = Number(user?.onboardingStep);
    const safe = Number.isFinite(s) && s >= 0 ? s : 0;
    setStep(Math.max(0, Math.min(safe, steps.length - 1)));
    setLanguage((user?.language || i18n?.language || 'en').split('-')[0]);
  }, [isOpen, steps.length, user?.onboardingStep, user?.language, i18n?.language]);

  const savePreferences = async (payload) => {
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
  };

  const goToStep = async (nextStep) => {
    const safe = Math.max(0, Math.min(nextStep, steps.length - 1));
    setStep(safe);
    await savePreferences({ onboardingStep: safe });
  };

  const handleFinish = async () => {
    const ok = await savePreferences({ onboardingCompleted: true, onboardingStep: steps.length - 1 });
    if (!ok) return;
    onClose?.();
  };

  const handleLanguageContinue = async () => {
    if (!language) return;
    i18n.changeLanguage(language);
    const ok = await savePreferences({ language, onboardingStep: 1 });
    if (!ok) return;
    setStep(1);
  };

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
    <div
      className={`fixed bottom-4 z-[90] ${isRtl ? 'left-4' : 'right-4'} w-[92vw] max-w-[420px]`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-800">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-500 dark:text-slate-400">
              {t('onboardingWizard.stepCount', { current: Math.min(step, totalSteps - 1), total: totalSteps - 1 })}
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{t('onboardingWizard.liveTutorial')}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800/50"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">
          <div>
            <div className="text-base font-bold text-gray-900 dark:text-slate-100">{current.title}</div>
            <div className="mt-2 text-sm text-gray-600 dark:text-slate-300 whitespace-pre-line">{current.description}</div>
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
            >
              {t('common.back')}
            </Button>

            {step < totalSteps - 1 ? (
              <Button size="sm" onClick={() => goToStep(step + 1)} disabled={saving} loading={saving}>
                {t('common.next')}
              </Button>
            ) : (
              <Button size="sm" onClick={handleFinish} disabled={saving} loading={saving}>
                {t('onboardingWizard.buttons.finish')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
