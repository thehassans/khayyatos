const axios = require('axios');

const DEFAULT_TARGET_LANGS = ['en', 'ar', 'ur', 'hi', 'bn'];

const stripCodeFences = (text) => {
  if (typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed.replace(/^```[a-zA-Z]*\s*/m, '').replace(/```\s*$/m, '').trim();
};

const extractJsonObject = (text) => {
  const cleaned = stripCodeFences(text);
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    throw new Error('No JSON object found in model response');
  }
  return cleaned.slice(first, last + 1);
};

const buildFallbackI18n = (value, targetLangs = DEFAULT_TARGET_LANGS) => {
  const v = typeof value === 'string' ? value : '';
  const out = {};
  targetLangs.forEach((l) => {
    out[l] = v;
  });
  return out;
};

const translateMany = async ({ entries, targetLangs = DEFAULT_TARGET_LANGS }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

  if (!apiKey) {
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
    'Return ONLY a valid JSON object mapping each id to an object of translations.',
    'Example output:',
    '{"123": {"en": "...", "ar": "...", "ur": "...", "hi": "...", "bn": "..."}}',
    'Do not include markdown or code fences.',
    'Preserve meaning and keep translations short.',
    'Input:',
    JSON.stringify(safeEntries)
  ].join('\n');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const resp = await axios.post(
      url,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048
        }
      },
      { timeout: 20000 }
    );

    const text = resp?.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonText = extractJsonObject(text);
    const parsed = JSON.parse(jsonText);

    const result = {};
    safeEntries.forEach((e) => {
      const fromModel = parsed?.[e.id];
      if (fromModel && typeof fromModel === 'object') {
        const out = {};
        targetLangs.forEach((l) => {
          out[l] = typeof fromModel[l] === 'string' ? fromModel[l] : e.text;
        });
        result[e.id] = out;
      } else {
        result[e.id] = buildFallbackI18n(e.text, targetLangs);
      }
    });

    return result;
  } catch (e) {
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
  buildFallbackI18n
};
