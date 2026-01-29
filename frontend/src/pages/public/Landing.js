import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import {
  Sparkles,
  Scissors,
  ShieldCheck,
  Globe,
  Image as ImageIcon,
  Receipt,
  Users,
  MessageCircle,
  Database,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

const Landing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    {
      icon: Scissors,
      title: t('landing.features.orders.title', { defaultValue: 'Orders & Stitchings' }),
      desc: t('landing.features.orders.desc', { defaultValue: 'Create, assign, track, and print receipts with a premium workflow.' })
    },
    {
      icon: ImageIcon,
      title: t('landing.features.embroidery.title', { defaultValue: 'Embroidery Designs' }),
      desc: t('landing.features.embroidery.desc', { defaultValue: 'Upload design library, auto-WEBP, preview, and create orders with one click.' })
    },
    {
      icon: Users,
      title: t('landing.features.customers.title', { defaultValue: 'Customers & Profiles' }),
      desc: t('landing.features.customers.desc', { defaultValue: 'Full customer profiles, relations, history timeline, and quick actions.' })
    },
    {
      icon: TrendingUp,
      title: t('landing.features.loyalty.title', { defaultValue: 'Customer Loyalty' }),
      desc: t('landing.features.loyalty.desc', { defaultValue: 'Loyalty points, totals, and retention-focused tools built-in.' })
    },
    {
      icon: MessageCircle,
      title: t('landing.features.whatsapp.title', { defaultValue: 'WhatsApp Integration' }),
      desc: t('landing.features.whatsapp.desc', { defaultValue: 'Send order updates and notifications with templates and automation.' })
    },
    {
      icon: Receipt,
      title: t('landing.features.zatca.title', { defaultValue: 'ZATCA E‑Invoicing' }),
      desc: t('landing.features.zatca.desc', { defaultValue: 'Saudi ZATCA-ready workflow with QR and compliance features.' })
    },
    {
      icon: Globe,
      title: t('landing.features.languages.title', { defaultValue: 'Multi‑Language' }),
      desc: t('landing.features.languages.desc', { defaultValue: 'English, العربية, हिन्दी, اردو, বাংলা with RTL support.' })
    },
    {
      icon: Database,
      title: t('landing.features.backup.title', { defaultValue: 'Backup & Export' }),
      desc: t('landing.features.backup.desc', { defaultValue: 'Export data safely and keep your shop protected.' })
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-black text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="absolute -top-52 right-0 w-[560px] h-[560px] rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-[520px] h-[520px] rounded-full bg-amber-500/15 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-[0.25em]">KHAYYAT</div>
                <div className="text-xs text-white/60">Tailoring OS</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => navigate('/track-order')}>
                {t('landing.trackOrder', { defaultValue: 'Track Order' })}
              </Button>
              <Button variant="success" onClick={() => navigate('/login')}>
                {t('auth.login', { defaultValue: 'Login' })}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs tracking-widest">
                <Sparkles className="w-4 h-4 text-amber-300" />
                {t('landing.badge', { defaultValue: 'ULTRA‑PREMIUM TAILORING PLATFORM' })}
              </div>

              <h1 className="mt-6 text-4xl md:text-5xl font-semibold leading-tight">
                {t('landing.heroTitle', { defaultValue: 'Run your tailor shop like a modern SaaS.' })}
              </h1>
              <p className="mt-4 text-white/70 text-base md:text-lg max-w-xl">
                {t('landing.heroSubtitle', { defaultValue: 'Orders, customers, workers, catalogs, ZATCA, WhatsApp, embroidery designs, multi-language, and more — crafted with premium UX.' })}
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Button variant="success" size="lg" onClick={() => navigate('/login')} className="rounded-2xl">
                  {t('landing.ctaPrimary', { defaultValue: 'Get Started' })}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/track-order')} className="rounded-2xl border-white/20 text-white hover:bg-white/10">
                  {t('landing.ctaSecondary', { defaultValue: 'Track an Order' })}
                </Button>
              </div>

              <div className="mt-8 flex items-center gap-3 text-xs text-white/60">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  {t('landing.zatcaReady', { defaultValue: 'ZATCA Ready' })}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <Globe className="w-4 h-4 text-white/70" />
                  {t('landing.multiLang', { defaultValue: 'Multi‑Language + RTL' })}
                </div>
              </div>
            </div>

            <div>
              <Card className="bg-white/[0.06] border border-white/10 rounded-3xl overflow-hidden">
                <CardBody>
                  <div className="p-6">
                    <div className="text-sm font-semibold text-white/80 tracking-widest">
                      {t('landing.whatsInside', { defaultValue: 'WHAT’S INSIDE' })}
                    </div>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {features.slice(0, 4).map((f) => (
                        <div key={f.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                              <f.icon className="w-5 h-5 text-white/80" />
                            </div>
                            <div className="text-sm font-semibold text-white">{f.title}</div>
                          </div>
                          <div className="mt-2 text-sm text-white/60 leading-relaxed">{f.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          <div className="mt-12">
            <div className="text-sm font-semibold text-white/80 tracking-widest">
              {t('landing.featuresTitle', { defaultValue: 'A‑to‑Z FEATURES' })}
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((f) => (
                <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.06] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <f.icon className="w-4 h-4 text-white/80" />
                    </div>
                    <div className="text-sm font-semibold text-white truncate">{f.title}</div>
                  </div>
                  <div className="mt-2 text-xs text-white/60 leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 border-t border-white/10 pt-8 pb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-sm text-white/60">
                {t('landing.contact', { defaultValue: 'Contact' })}: <a className="text-white underline" href="tel:+596775485">+596775485</a>
              </div>
              <div className="text-sm text-white/60">
                Made for Khayyat by <a className="text-white underline" href="https://hassanscode.com" target="_blank" rel="noreferrer">Hassan Sarwar</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
