import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const langKey = (i18n?.language || 'en').split('-')[0];
  const isRtl = langKey === 'ar' || langKey === 'ur';

  const sections = [
    {
      title: t('terms.sections.acceptance.title', { defaultValue: '1. Acceptance of Terms' }),
      content: t('terms.sections.acceptance.content', { defaultValue: 'By accessing or using KhayyatOS ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service. These terms apply to all users including shop owners, workers, and administrators.' })
    },
    {
      title: t('terms.sections.description.title', { defaultValue: '2. Service Description' }),
      content: t('terms.sections.description.content', { defaultValue: 'KhayyatOS is a cloud-based tailoring management system that provides tools for managing orders, customers, workers, measurements, payments, embroidery designs, fabric inventory, laundry services, WhatsApp notifications, ZATCA e-invoicing, and more. The Service is provided on a subscription basis.' })
    },
    {
      title: t('terms.sections.accounts.title', { defaultValue: '3. User Accounts' }),
      content: t('terms.sections.accounts.content', { defaultValue: 'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and complete information when creating an account. You are responsible for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.' })
    },
    {
      title: t('terms.sections.subscription.title', { defaultValue: '4. Subscription & Payments' }),
      content: t('terms.sections.subscription.content', { defaultValue: 'The Service offers Trial (7 days), Yearly, and Lifetime subscription plans. Subscription fees are non-refundable except as required by applicable law. We reserve the right to modify pricing with 30 days advance notice. Access to the Service may be restricted if your subscription expires.' })
    },
    {
      title: t('terms.sections.usage.title', { defaultValue: '5. Acceptable Use' }),
      content: t('terms.sections.usage.content', { defaultValue: 'You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to gain unauthorized access to the Service or its related systems; (c) interfere with or disrupt the Service; (d) upload malicious code or content; (e) resell or redistribute the Service without authorization; (f) use the Service to store or transmit content that violates any third party rights.' })
    },
    {
      title: t('terms.sections.data.title', { defaultValue: '6. Data Ownership' }),
      content: t('terms.sections.data.content', { defaultValue: 'You retain ownership of all data you enter into the Service, including customer information, orders, measurements, and business data. We do not claim ownership of your data. You grant us a limited license to use your data solely for the purpose of providing and improving the Service.' })
    },
    {
      title: t('terms.sections.availability.title', { defaultValue: '7. Service Availability' }),
      content: t('terms.sections.availability.content', { defaultValue: 'We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We will make reasonable efforts to notify users of planned downtime in advance.' })
    },
    {
      title: t('terms.sections.liability.title', { defaultValue: '8. Limitation of Liability' }),
      content: t('terms.sections.liability.content', { defaultValue: 'To the maximum extent permitted by law, KhayyatOS shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, or goodwill. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.' })
    },
    {
      title: t('terms.sections.termination.title', { defaultValue: '9. Termination' }),
      content: t('terms.sections.termination.content', { defaultValue: 'We may suspend or terminate your access to the Service at any time for violation of these terms. Upon termination, your right to use the Service will immediately cease. You may request export of your data within 30 days of termination. After 30 days, your data may be permanently deleted.' })
    },
    {
      title: t('terms.sections.changes.title', { defaultValue: '10. Changes to Terms' }),
      content: t('terms.sections.changes.content', { defaultValue: 'We reserve the right to modify these terms at any time. We will notify users of material changes via email or in-app notification at least 14 days before they take effect. Continued use of the Service after changes become effective constitutes acceptance of the new terms.' })
    },
    {
      title: t('terms.sections.governing.title', { defaultValue: '11. Governing Law' }),
      content: t('terms.sections.governing.content', { defaultValue: 'These terms are governed by the laws of the Kingdom of Saudi Arabia. Any disputes arising from these terms shall be resolved in the competent courts of Riyadh, Saudi Arabia.' })
    },
    {
      title: t('terms.sections.contact.title', { defaultValue: '12. Contact Information' }),
      content: t('terms.sections.contact.content', { defaultValue: 'For questions about these Terms of Service, please contact us at support@khayyatos.com or call +966 50 123 4567.' })
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 text-gray-600 dark:text-slate-400 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('terms.title', { defaultValue: 'Terms of Service' })}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {t('terms.lastUpdated', { defaultValue: 'Last updated: February 2025' })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Introduction */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
            {t('terms.intro', { defaultValue: 'Welcome to KhayyatOS. Please read these Terms of Service carefully before using our platform. These terms govern your use of KhayyatOS and constitute a legally binding agreement between you and KhayyatOS.' })}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, i) => (
            <div key={i} className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">{section.title}</h2>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-xs text-gray-400 dark:text-slate-500">
            © {new Date().getFullYear()} KhayyatOS. {t('landing.footerRights', { defaultValue: 'All rights reserved.' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
