import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const langKey = (i18n?.language || 'en').split('-')[0];
  const isRtl = langKey === 'ar' || langKey === 'ur';

  const sections = [
    {
      title: t('privacy.sections.collect.title', { defaultValue: '1. Information We Collect' }),
      content: t('privacy.sections.collect.content', { defaultValue: 'We collect the following types of information:\n\n• Account Information: Name, email address, phone number, business name, and password when you create an account.\n• Business Data: Customer records, worker information, orders, measurements, payment records, and other data you enter into the system.\n• Usage Data: Log data, device information, browser type, IP address, and pages visited to improve our Service.\n• Communication Data: Messages sent through WhatsApp integration (only metadata, not message content).' })
    },
    {
      title: t('privacy.sections.use.title', { defaultValue: '2. How We Use Your Information' }),
      content: t('privacy.sections.use.content', { defaultValue: 'We use your information to:\n\n• Provide, maintain, and improve the Service.\n• Process your transactions and manage your subscription.\n• Send you important notifications about your account and service updates.\n• Provide customer support and respond to your inquiries.\n• Ensure the security and integrity of the Service.\n• Comply with legal obligations including ZATCA e-invoicing requirements.' })
    },
    {
      title: t('privacy.sections.storage.title', { defaultValue: '3. Data Storage & Security' }),
      content: t('privacy.sections.storage.content', { defaultValue: 'Your data is stored on secure cloud servers with industry-standard encryption. We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. All data transmissions are encrypted using TLS/SSL protocols.' })
    },
    {
      title: t('privacy.sections.sharing.title', { defaultValue: '4. Data Sharing' }),
      content: t('privacy.sections.sharing.content', { defaultValue: 'We do not sell, trade, or rent your personal information to third parties. We may share your information only in these circumstances:\n\n• With your explicit consent.\n• With service providers who assist in operating our Service (hosting, payment processing).\n• When required by law, court order, or government regulation.\n• To protect the rights, safety, or property of KhayyatOS or its users.\n• In connection with a merger, acquisition, or sale of assets (with prior notice).' })
    },
    {
      title: t('privacy.sections.retention.title', { defaultValue: '5. Data Retention' }),
      content: t('privacy.sections.retention.content', { defaultValue: 'We retain your data for as long as your account is active or as needed to provide you the Service. If you close your account, we will delete or anonymize your data within 30 days, except where we are required to retain it for legal or regulatory purposes (e.g., tax records for ZATCA compliance may be retained for up to 7 years).' })
    },
    {
      title: t('privacy.sections.rights.title', { defaultValue: '6. Your Rights' }),
      content: t('privacy.sections.rights.content', { defaultValue: 'You have the right to:\n\n• Access: Request a copy of your personal data at any time.\n• Correction: Update or correct inaccurate information.\n• Deletion: Request deletion of your personal data (subject to legal retention requirements).\n• Export: Download all your business data in JSON format from Settings → Data & Backup.\n• Restriction: Request that we limit the processing of your personal data.\n• Objection: Object to the processing of your data for specific purposes.' })
    },
    {
      title: t('privacy.sections.cookies.title', { defaultValue: '7. Cookies & Local Storage' }),
      content: t('privacy.sections.cookies.content', { defaultValue: 'We use essential cookies and local storage to maintain your session, remember your language preference, and store your theme settings. We do not use tracking cookies or third-party advertising cookies. You can clear local storage from Settings → Data & Backup → Clear Cache.' })
    },
    {
      title: t('privacy.sections.thirdParty.title', { defaultValue: '8. Third-Party Services' }),
      content: t('privacy.sections.thirdParty.content', { defaultValue: 'The Service may integrate with third-party services including:\n\n• WhatsApp Cloud API (Meta) for customer notifications.\n• ZATCA for e-invoicing compliance.\n\nThese services have their own privacy policies. We recommend reviewing their policies. We only share the minimum data necessary for these integrations to function.' })
    },
    {
      title: t('privacy.sections.children.title', { defaultValue: '9. Children\'s Privacy' }),
      content: t('privacy.sections.children.content', { defaultValue: 'KhayyatOS is designed for business use and is not intended for children under 18. We do not knowingly collect personal information from children. If we discover that we have collected data from a child, we will delete it promptly.' })
    },
    {
      title: t('privacy.sections.changes.title', { defaultValue: '10. Changes to This Policy' }),
      content: t('privacy.sections.changes.content', { defaultValue: 'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and sending an in-app notification. Changes are effective when posted. We encourage you to review this policy periodically.' })
    },
    {
      title: t('privacy.sections.contact.title', { defaultValue: '11. Contact Us' }),
      content: t('privacy.sections.contact.content', { defaultValue: 'If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:\n\n• Email: support@khayyatos.com\n• Phone: +966 50 123 4567\n• Address: Riyadh, Kingdom of Saudi Arabia' })
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
              {t('privacy.title', { defaultValue: 'Privacy Policy' })}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {t('privacy.lastUpdated', { defaultValue: 'Last updated: February 2025' })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Introduction */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
            {t('privacy.intro', { defaultValue: 'At KhayyatOS, we take your privacy seriously. This Privacy Policy explains how we collect, use, store, and protect your information when you use our tailoring management platform. By using KhayyatOS, you consent to the practices described in this policy.' })}
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

export default PrivacyPolicy;
