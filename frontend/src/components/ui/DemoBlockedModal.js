import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { PhoneCall } from 'lucide-react';

const DemoBlockedModal = ({ isOpen, onClose, title, phone = '+966596775485' }) => {
  const { t } = useTranslation();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || t('demo.title', { defaultValue: 'Demo Mode' })}
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 p-4">
          <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{t('demo.blockedTitle', { defaultValue: 'This action is disabled in Live Demo.' })}</div>
          <div className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            {t('demo.blockedSubtitle', { defaultValue: 'Contact sales team {{phone}} to get a free trial.', phone })}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`https://wa.me/${String(phone || '').replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity"
          >
            <PhoneCall className="w-4 h-4" />
            {t('demo.callSales', { defaultValue: 'Call Sales' })}
          </a>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            {t('common.close', { defaultValue: 'Close' })}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DemoBlockedModal;
