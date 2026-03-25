import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Key, Sparkles, Send, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TEST_LANGS = ['en', 'ar', 'ur', 'hi', 'bn'];

const GeminiSettings = () => {
  const { t, i18n } = useTranslation();
  const { api } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [model, setModel] = useState('gemini-3-flash-preview');
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const [testText, setTestText] = useState('');
  const [testTranslations, setTestTranslations] = useState(null);

  useEffect(() => {
    fetchGemini();
  }, []);

  const fetchGemini = async () => {
    try {
      setLoading(true);
      const resp = await api.get('/admin/gemini');
      const g = resp.data?.gemini || {};
      setEnabled(g.enabled === true);
      setModel(g.model || 'gemini-3-flash-preview');
      setHasApiKey(!!g.hasApiKey);
      setUpdatedAt(g.updatedAt || null);
    } catch (e) {
      toast.error('Failed to load Gemini settings');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        enabled,
        model
      };
      if (apiKey && apiKey.trim()) payload.apiKey = apiKey.trim();

      const resp = await api.put('/admin/gemini', payload);
      const g = resp.data?.gemini || {};
      setEnabled(g.enabled === true);
      setModel(g.model || model);
      setHasApiKey(!!g.hasApiKey);
      setUpdatedAt(g.updatedAt || null);
      setApiKey('');
      toast.success('Gemini settings saved');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save');
    }
    setSaving(false);
  };

  const handleClearApiKey = async () => {
    try {
      setSaving(true);
      const resp = await api.put('/admin/gemini', { clearApiKey: true, enabled: false });
      const g = resp.data?.gemini || {};
      setEnabled(g.enabled === true);
      setHasApiKey(!!g.hasApiKey);
      setUpdatedAt(g.updatedAt || null);
      setApiKey('');
      toast.success('API key cleared');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to clear');
    }
    setSaving(false);
  };

  const handleTest = async () => {
    const text = (testText || '').trim();
    if (!text) {
      toast.error('Enter text to translate');
      return;
    }

    try {
      setTesting(true);
      setTestTranslations(null);
      const resp = await api.post('/admin/gemini/translate', {
        text,
        targetLangs: TEST_LANGS
      });
      const translations = resp.data?.translations?.text || null;
      setTestTranslations(translations);
      if (!translations || !Object.keys(translations).length) toast.error('No translations returned');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Translation failed');
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.gemini.title', { defaultValue: 'Gemini AI' })}</h1>
          <p className="text-sm text-gray-500">{t('admin.gemini.subtitle', { defaultValue: 'Configure API key + model for live translations' })}</p>
        </div>
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{t('admin.gemini.enabled', { defaultValue: 'Enabled' })}</div>
                  <div className="text-xs text-gray-500">{t('admin.gemini.enabledHint', { defaultValue: 'If disabled, translation will fall back to original text' })}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEnabled((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-4">
              <div className="text-sm font-semibold text-gray-900">{t('admin.gemini.status', { defaultValue: 'Status' })}</div>
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                <div>
                  {t('admin.gemini.hasKey', { defaultValue: 'API Key' })}: <span className="font-semibold">{hasApiKey ? 'Saved' : 'Missing'}</span>
                </div>
                <div>
                  {t('admin.gemini.model', { defaultValue: 'Model' })}: <span className="font-semibold">{model}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {updatedAt ? `Updated: ${new Date(updatedAt).toLocaleString()}` : 'Updated: —'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('admin.gemini.model', { defaultValue: 'Model' })}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gemini-3-flash-preview"
            />

            <Input
              label={t('admin.gemini.apiKey', { defaultValue: 'API Key' })}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasApiKey ? '•••••••• (already saved)' : 'Paste API key'}
              type="password"
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button onClick={handleSave} loading={saving} icon={Save}>
              {t('common.save', { defaultValue: 'Save' })}
            </Button>
            <Button variant="danger" onClick={handleClearApiKey} loading={saving} icon={Trash2}>
              {t('admin.gemini.clearKey', { defaultValue: 'Clear Key' })}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">{t('admin.gemini.test', { defaultValue: 'Test Translation' })}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-4">
              <Input
                label={t('admin.gemini.testText', { defaultValue: 'Text' })}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter a name or catalog label"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleTest} loading={testing} icon={Send} className="w-full">
                {t('admin.gemini.run', { defaultValue: 'Run' })}
              </Button>
            </div>
          </div>

          {testTranslations ? (
            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TEST_LANGS.map((lang) => {
                  const value = testTranslations?.[lang] || '';
                  const activeLang = (i18n?.language || 'en').split('-')[0] === lang;
                  return (
                    <div
                      key={lang}
                      className={`rounded-xl border p-3 ${activeLang ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white'}`}
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">{lang}</div>
                      <div className="text-sm text-gray-900 break-words">{value || '—'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
};

export default GeminiSettings;
