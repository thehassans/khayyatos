import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Phone, Mail, MessageCircle, Clock, 
  BookOpen, Video, FileText, ChevronRight, 
  HelpCircle, Zap, Shield, Globe
} from 'lucide-react';

const HelpSupport = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const langKey = (i18n?.language || 'en').split('-')[0];
  const isRtl = langKey === 'ar' || langKey === 'ur';

  const faqs = [
    {
      q: t('help.faq.q1', { defaultValue: 'How do I create my first order?' }),
      a: t('help.faq.a1', { defaultValue: 'Go to Stitchings → Create Order. Select or create a customer, fill in measurements, choose thawb type and style options, set the price and due date, then save.' })
    },
    {
      q: t('help.faq.q2', { defaultValue: 'How do I add workers and assign orders?' }),
      a: t('help.faq.a2', { defaultValue: 'Go to Workers → Create Worker. Once created, you can assign any order to a worker from the order details page. Track their progress and payments from Worker Amounts.' })
    },
    {
      q: t('help.faq.q3', { defaultValue: 'How does WhatsApp integration work?' }),
      a: t('help.faq.a3', { defaultValue: 'Go to Settings → WhatsApp. Enter your WhatsApp Cloud API credentials (Phone Number ID and Access Token). Once connected, automatic notifications will be sent for new orders, ready orders, and deliveries.' })
    },
    {
      q: t('help.faq.q4', { defaultValue: 'Can I use the app in Arabic?' }),
      a: t('help.faq.a4', { defaultValue: 'Yes! KhayyatOS supports 5 languages including Arabic with full RTL layout. Go to Settings → General → Language to switch.' })
    },
    {
      q: t('help.faq.q5', { defaultValue: 'How do I set up ZATCA e-invoicing?' }),
      a: t('help.faq.a5', { defaultValue: 'Go to ZATCA from the sidebar. Enable the integration, enter your VAT number and business details, then follow the onboarding steps to get your compliance and production certificates.' })
    },
    {
      q: t('help.faq.q6', { defaultValue: 'How do I track fabric inventory?' }),
      a: t('help.faq.a6', { defaultValue: 'Go to Fabrics → Add Fabric. Enter the fabric name, made in, price per roll, and stock quantity. You can adjust stock anytime and the system tracks total inventory value.' })
    }
  ];

  const contactMethods = [
    {
      icon: Phone,
      title: t('help.contact.phone', { defaultValue: 'Phone Support' }),
      desc: t('help.contact.phoneDesc', { defaultValue: 'Call us for immediate assistance' }),
      value: '+966 50 123 4567',
      action: () => window.open('tel:+966501234567'),
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
    },
    {
      icon: MessageCircle,
      title: t('help.contact.whatsapp', { defaultValue: 'WhatsApp' }),
      desc: t('help.contact.whatsappDesc', { defaultValue: 'Message us on WhatsApp' }),
      value: '+966 50 123 4567',
      action: () => window.open('https://wa.me/966501234567', '_blank'),
      color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
    },
    {
      icon: Mail,
      title: t('help.contact.email', { defaultValue: 'Email' }),
      desc: t('help.contact.emailDesc', { defaultValue: 'Send us an email' }),
      value: 'support@khayyatos.com',
      action: () => window.open('mailto:support@khayyatos.com'),
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    }
  ];

  const guides = [
    {
      icon: Zap,
      title: t('help.guides.quickStart', { defaultValue: 'Quick Start Guide' }),
      desc: t('help.guides.quickStartDesc', { defaultValue: 'Get up and running in 5 minutes' })
    },
    {
      icon: BookOpen,
      title: t('help.guides.orders', { defaultValue: 'Managing Orders' }),
      desc: t('help.guides.ordersDesc', { defaultValue: 'Create, assign, and track stitching orders' })
    },
    {
      icon: Globe,
      title: t('help.guides.languages', { defaultValue: 'Language & RTL Setup' }),
      desc: t('help.guides.languagesDesc', { defaultValue: 'Configure Arabic, Urdu, and other languages' })
    },
    {
      icon: Shield,
      title: t('help.guides.zatca', { defaultValue: 'ZATCA E-Invoicing' }),
      desc: t('help.guides.zatcaDesc', { defaultValue: 'Set up Saudi tax compliance' })
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
              {t('help.title', { defaultValue: 'Help & Support' })}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {t('help.subtitle', { defaultValue: 'Get help with KhayyatOS' })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Contact Methods */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('help.contactUs', { defaultValue: 'Contact Us' })}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {contactMethods.map((method, i) => (
              <button
                key={i}
                onClick={method.action}
                className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 text-start hover:shadow-md transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${method.color}`}>
                  <method.icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{method.title}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{method.desc}</p>
                <p className="text-xs font-mono text-gray-600 dark:text-slate-300 mt-2" dir="ltr">{method.value}</p>
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{t('help.workingHours', { defaultValue: 'Available Sunday – Thursday, 9 AM – 6 PM (Saudi Time)' })}</span>
          </div>
        </section>

        {/* Quick Guides */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('help.guidesTitle', { defaultValue: 'Quick Guides' })}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guides.map((guide, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <guide.icon className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{guide.title}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{guide.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('help.faqTitle', { defaultValue: 'Frequently Asked Questions' })}
          </h2>
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden divide-y divide-gray-100 dark:divide-slate-700">
            {faqs.map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors list-none">
                  <HelpCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-sm text-gray-900 dark:text-white flex-1">{faq.q}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-4 ps-11">
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {t('help.footer', { defaultValue: 'Still need help? Contact us and we\'ll respond within 24 hours.' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
