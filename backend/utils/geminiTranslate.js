const axios = require('axios');
const SystemSettings = require('../models/SystemSettings');

const DEFAULT_TARGET_LANGS = ['en', 'ar', 'ur', 'hi', 'bn'];

let cachedGeminiConfig = null;
let cachedGeminiConfigAt = 0;
const GEMINI_CONFIG_TTL_MS = 60 * 1000;

const invalidateGeminiConfigCache = () => {
  cachedGeminiConfig = null;
  cachedGeminiConfigAt = 0;
};

const getGeminiConfig = async () => {
  const now = Date.now();
  if (cachedGeminiConfig && now - cachedGeminiConfigAt < GEMINI_CONFIG_TTL_MS) {
    return cachedGeminiConfig;
  }

  try {
    const doc = await SystemSettings.findOne({}).lean();
    const cfg = doc?.gemini || {};
    cachedGeminiConfig = {
      enabled: cfg.enabled === true,
      apiKey: typeof cfg.apiKey === 'string' ? cfg.apiKey : '',
      model: typeof cfg.model === 'string' && cfg.model.trim() ? cfg.model.trim() : 'gemini-3-flash-preview'
    };
    cachedGeminiConfigAt = now;
    return cachedGeminiConfig;
  } catch (e) {
    cachedGeminiConfig = { enabled: false, apiKey: '', model: 'gemini-3-flash-preview' };
    cachedGeminiConfigAt = now;
    return cachedGeminiConfig;
  }
};

const stripCodeFences = (text) => {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed.replace(/^```[a-zA-Z]*\s*/m, '').replace(/```\s*$/m, '').trim();
};

const extractJsonPayload = (text) => {
  const cleaned = stripCodeFences(text);
  const objectStart = cleaned.indexOf('{');
  const arrayStart = cleaned.indexOf('[');
  const useArray = arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart);
  const first = useArray ? arrayStart : objectStart;
  const last = useArray ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    throw new Error('No JSON payload found in model response');
  }
  return cleaned.slice(first, last + 1);
};

const collectResponseText = (resp) => {
  const parts = resp?.data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .filter(Boolean)
    .join('\n')
    .trim();
};

const normalizeParsedTranslations = (parsed) => {
  if (Array.isArray(parsed)) {
    return parsed.reduce((acc, item) => {
      const id = String(item?.id || item?.key || '');
      if (!id) return acc;
      acc[id] = item?.translations && typeof item.translations === 'object' ? item.translations : item;
      return acc;
    }, {});
  }

  if (parsed?.translations && typeof parsed.translations === 'object' && !Array.isArray(parsed.translations)) {
    return parsed.translations;
  }

  return parsed && typeof parsed === 'object' ? parsed : {};
};

const buildFallbackI18n = (value, targetLangs = DEFAULT_TARGET_LANGS) => {
  const v = typeof value === 'string' ? value : '';
  const out = {};
  targetLangs.forEach((l) => {
    out[l] = v;
  });
  return out;
};

const translateMany = async ({ entries, targetLangs = DEFAULT_TARGET_LANGS, apiKey, model, enabled } = {}) => {
  let cfg = {
    enabled: enabled === true,
    apiKey: typeof apiKey === 'string' ? apiKey : '',
    model: typeof model === 'string' && model.trim() ? model.trim() : ''
  };

  if (!cfg.apiKey || !cfg.model) {
    const fromDb = await getGeminiConfig();
    cfg = {
      enabled: enabled === true ? true : fromDb.enabled,
      apiKey: cfg.apiKey || fromDb.apiKey,
      model: cfg.model || fromDb.model
    };
  }

  if (!cfg.enabled || !cfg.apiKey) {
    const fallback = {};
    (entries || []).forEach((e) => {
      if (!e?.id) return;
      fallback[String(e.id)] = buildFallbackI18n(e.text || '', targetLangs);
    });
    return fallback;
  }

  const safeEntries = (Array.isArray(entries) ? entries : [])
    .map((e) => ({ id: String(e.id || ''), text: typeof e.text === 'string' ? e.text : '' }))
    .filter((e) => e.id && e.text);

  if (safeEntries.length === 0) return {};

  const prompt = [
    'You are a translation engine.',
    `Translate each item text into the following languages: ${targetLangs.join(', ')}.`,
    'Input is a JSON array of objects: {"id": string, "text": string}.',
    'Return ONLY valid JSON.',
    'Return a JSON object mapping each id to an object of translations.',
    'Do not omit any id or requested language.',
    'If the input is a person name, transliterate it naturally into the target script.',
    'Example output:',
    '{"123": {"en": "...", "ar": "...", "ur": "...", "hi": "...", "bn": "..."}}',
    'Do not include markdown or code fences.',
    'Preserve meaning and keep translations short.',
    'Input:',
    JSON.stringify(safeEntries)
  ].join('\n');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;

  try {
    const resp = await axios.post(
      url,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json'
        }
      },
      { timeout: 20000 }
    );

    const text = collectResponseText(resp);
    const jsonText = extractJsonPayload(text);
    const parsed = normalizeParsedTranslations(JSON.parse(jsonText));

    const result = {};
    safeEntries.forEach((e) => {
      const fromModel = parsed?.[e.id];
      if (fromModel && typeof fromModel === 'object') {
        const out = {};
        targetLangs.forEach((l) => {
          if (typeof fromModel[l] === 'string' && fromModel[l].trim()) {
            out[l] = fromModel[l].trim();
          } else if (typeof fromModel?.translations?.[l] === 'string' && fromModel.translations[l].trim()) {
            out[l] = fromModel.translations[l].trim();
          } else {
            out[l] = e.text;
          }
        });
        result[e.id] = out;
      } else {
        result[e.id] = buildFallbackI18n(e.text, targetLangs);
      }
    });

    return result;
  } catch (e) {
    console.error('Gemini translation failed:', e?.response?.data || e?.message || e);
    const fallback = {};
    safeEntries.forEach((x) => {
      fallback[x.id] = buildFallbackI18n(x.text, targetLangs);
    });
    return fallback;
  }
};

module.exports = {
  DEFAULT_TARGET_LANGS,
  translateMany,
  getGeminiConfig,
  invalidateGeminiConfigCache,
  buildFallbackI18n
};
