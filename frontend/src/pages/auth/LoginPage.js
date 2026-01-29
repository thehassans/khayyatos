import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [credentials, setCredentials] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    // Delay video load to prioritize form rendering
    const timer = setTimeout(() => setVideoReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'ur', label: 'اردو' },
    { code: 'bn', label: 'বাংলা' }
  ];

  const currentLang = (i18n?.language || 'en').split('-')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login({ 
        identifier: credentials.identifier, 
        password: credentials.password 
      });
      
      if (result.success) {
        if (result.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (result.role === 'user') {
          navigate('/user/dashboard');
        } else if (result.role === 'worker') {
          navigate('/worker/dashboard');
        }
      } else {
        toast.error(result.error || t('auth.invalidCredentials'));
      }
    } catch (error) {
      toast.error(t('auth.invalidCredentials'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[100svh] min-h-[100dvh] relative overflow-hidden bg-black">
      {/* Video Background - Saudi Thawb/Dishdasha Tailoring (Lazy loaded) */}
      {videoReady && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          loop
          disablePictureInPicture
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover opacity-0 animate-[fadeInVideo_1.5s_ease-out_forwards]"
        >
          <source src="/videos/Thawb.webm" type="video/webm" />
          <source src="/videos/Thawb.mp4" type="video/mp4" />
        </video>
      )}

      {/* Elegant Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

      {/* Subtle Grain Texture */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Language Selector - Premium Glass */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-50">
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <span className="text-sm font-light text-white/90 tracking-wide">
              {languages.find(l => l.code === currentLang)?.label || 'English'}
            </span>
            <ChevronDown className={`w-4 h-4 text-white/60 transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`} />
          </button>
          {langOpen && (
            <div className="absolute right-0 mt-3 w-44 bg-black/80 backdrop-blur-2xl rounded-2xl border border-white/10 py-2 shadow-2xl animate-fadeIn">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    i18n.changeLanguage(lang.code);
                    setLangOpen(false);
                  }}
                  className={`w-full px-5 py-3 text-left text-sm tracking-wide transition-all duration-200 ${
                    currentLang === lang.code 
                      ? 'text-amber-400 bg-white/5' 
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-[100svh] min-h-[100dvh] flex items-center justify-center px-4 py-8 sm:p-6 md:p-8">
        <div className={`w-full max-w-[340px] sm:max-w-sm md:max-w-md transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Logo & Brand - Ultra Minimal */}
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            {/* Animated Scissors Icon */}
            <div className="relative inline-flex items-center justify-center mb-6 sm:mb-8">
              <div className="absolute w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
              <svg 
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white relative" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="6" cy="6" r="3" className="animate-[spin_8s_linear_infinite]" style={{ transformOrigin: '6px 6px' }} />
                <circle cx="6" cy="18" r="3" className="animate-[spin_8s_linear_infinite_reverse]" style={{ transformOrigin: '6px 18px' }} />
                <line x1="20" y1="4" x2="8.12" y2="15.88" />
                <line x1="14.47" y1="14.48" x2="20" y2="20" />
                <line x1="8.12" y1="8.12" x2="12" y2="12" />
              </svg>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extralight text-white tracking-[0.2em] sm:tracking-[0.3em] mb-2 sm:mb-3">
              KHAYYAT
            </h1>
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2">
              <div className="w-8 sm:w-10 md:w-12 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
              <span className="text-amber-400/80 text-[8px] sm:text-[10px] font-medium tracking-[0.3em] sm:tracking-[0.4em]">OS</span>
              <div className="w-8 sm:w-10 md:w-12 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            </div>
            <p className="text-white/40 text-[10px] sm:text-xs font-light tracking-[0.15em] sm:tracking-[0.25em]">
              TAILORING EXCELLENCE
            </p>
          </div>

          {/* Login Form - Glassmorphism */}
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-white/10 to-amber-500/20 rounded-3xl blur-xl opacity-50" />
            
            <div className="relative bg-white/[0.08] backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-white/10 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-light text-white/50 tracking-widest uppercase">
                    {t('auth.email', { defaultValue: 'Email' })} / {t('auth.phone', { defaultValue: 'Phone' })}
                  </label>
                  <input
                    type="text"
                    value={credentials.identifier}
                    onChange={(e) => setCredentials({ ...credentials, identifier: e.target.value })}
                    className="w-full px-0 py-3 sm:py-4 bg-transparent border-0 border-b border-white/20 text-white text-base sm:text-lg font-light placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-colors duration-300"
                    placeholder={t('auth.identifierPlaceholder', { defaultValue: 'Enter email or phone' })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-light text-white/50 tracking-widest uppercase">
                    {t('auth.password', { defaultValue: 'Password' })}
                  </label>
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full px-0 py-3 sm:py-4 bg-transparent border-0 border-b border-white/20 text-white text-base sm:text-lg font-light placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-colors duration-300"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="pt-3 sm:pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full py-3.5 sm:py-4 overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-500 disabled:opacity-50"
                  >
                    {/* Button Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    
                    {/* Button Content */}
                    <span className="relative flex items-center justify-center gap-3 text-black font-medium tracking-widest text-sm">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span>{t('common.loading', { defaultValue: 'Loading...' }).toUpperCase()}</span>
                        </>
                      ) : (
                        <>
                          <span>{t('auth.login', { defaultValue: 'Login' }).toUpperCase()}</span>
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-full rounded-2xl bg-black/20 backdrop-blur-2xl border border-white/10 px-4 py-3">
                    <div className="text-white/60 text-[11px] sm:text-xs tracking-wide">
                      {t('auth.noAccount', { defaultValue: "Don't have an account?" })}{' '}
                      <a
                        href="https://wa.me/96659675485"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-300 hover:text-amber-200 underline underline-offset-4"
                      >
                        {t('auth.contactSales', { defaultValue: 'Contact Sales' })}
                      </a>
                    </div>
                  </div>

                  <div className="text-[10px] sm:text-[11px] tracking-[0.24em] text-white/55">
                    ZATCA PHASE 1 &amp; 2 INTEGRATED
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-white/30 text-[10px] sm:text-xs font-light tracking-wider sm:tracking-widest mt-6 sm:mt-8 md:mt-10 space-y-2">
            <div>Made for Khayyat by <a className="underline hover:text-white" href="https://hassanscode.com" target="_blank" rel="noreferrer">Hassan Sarwar</a></div>
            <div className="text-white/20">© {new Date().getFullYear()} KHAYYAT OS</div>
          </div>
        </div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/30 rounded-full animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + i}s`,
            }}
          />
        ))}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-30px) translateX(10px); opacity: 0.6; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default LoginPage;
