import React, { useMemo } from 'react';
import { Ruler, Sparkles, Shirt, PencilRuler } from 'lucide-react';

const thawbImageMap = {
  saudi: '/images/saudi.png',
  qatari: '/images/qatari.png',
  emirati: '/images/emirati.png',
  kuwaiti: '/images/kuwati.png',
  omani: '/images/omani.png',
  bahraini: '/images/Bahrini.png',
  noum: '/images/noum.png'
};

const groupedKeys = {
  core: ['length', 'shoulderWidth', 'chest', 'waist', 'hips', 'bottom'],
  sleeve: ['sleeveLength', 'armhole', 'bicep', 'forearm', 'wrist', 'cuffWidth', 'neck', 'expansion']
};

const toneMap = {
  slate: {
    ring: 'ring-slate-200/80 dark:ring-slate-700/60',
    border: 'border-slate-200 dark:border-slate-700',
    card: 'from-stone-50 via-white to-slate-50 dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-800/60',
    accentBg: 'bg-slate-900 dark:bg-slate-100',
    accentText: 'text-white dark:text-slate-900',
    soft: 'bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200',
    field: 'focus:ring-slate-400/40 focus:border-slate-400/40'
  },
  amber: {
    ring: 'ring-amber-200/80 dark:ring-amber-800/40',
    border: 'border-amber-200 dark:border-amber-800/40',
    card: 'from-amber-50 via-white to-stone-50 dark:from-amber-950/20 dark:via-slate-900/60 dark:to-slate-800/50',
    accentBg: 'bg-amber-600 dark:bg-amber-500',
    accentText: 'text-white',
    soft: 'bg-amber-100/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-100',
    field: 'focus:ring-amber-400/40 focus:border-amber-400/40'
  }
};

const defaultTone = toneMap.slate;

const formatValue = (value) => {
  if (value === undefined || value === null || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return `${Number(num.toFixed(1))} cm`;
};

const PreviewGarment = ({ thawbType }) => {
  const imageSrc = thawbImageMap[thawbType] || thawbImageMap.saudi;
  return (
    <div className="relative mx-auto w-full max-w-[220px] aspect-[4/5] rounded-[2rem] border border-black/5 dark:border-white/10 bg-gradient-to-b from-white to-stone-100 dark:from-slate-800 dark:to-slate-900 shadow-inner overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.75),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)]" />
      <div className="absolute inset-0 flex items-center justify-center p-5">
        <img src={imageSrc} alt={thawbType || 'thawb'} className="h-full w-full object-contain drop-shadow-[0_18px_28px_rgba(15,23,42,0.12)]" />
      </div>
      <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/85 dark:bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
        <Shirt className="w-3.5 h-3.5" />
        {String(thawbType || 'saudi').replace(/(^.|-.)/g, (m) => m.replace('-', ' ').toUpperCase())}
      </div>
    </div>
  );
};

const MeasurementFieldRow = ({ field, value, onChange, disabled, tone }) => {
  const palette = toneMap[tone] || defaultTone;
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 rounded-2xl border ${palette.border} bg-white/75 dark:bg-slate-900/45 px-4 py-3 shadow-sm backdrop-blur-sm`}>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Measurement</div>
        <div className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{field.label}</div>
      </div>
      <div className="relative">
        <input
          type="number"
          step="0.1"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="0"
          className={`no-spinner w-full rounded-xl border ${palette.border} bg-stone-50/90 dark:bg-slate-950/80 px-3 py-2.5 pr-10 text-center text-base font-semibold text-slate-900 dark:text-slate-100 outline-none transition-all ${palette.field} ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">cm</span>
      </div>
    </div>
  );
};

const MeasurementAtelierPanel = ({
  title,
  subtitle,
  fields,
  values,
  onChange,
  disabled = false,
  loading = false,
  thawbType = 'saudi',
  badges = [],
  tone = 'slate'
}) => {
  const palette = toneMap[tone] || defaultTone;

  const orderedFields = useMemo(() => {
    const map = new Map((fields || []).map((field) => [field.key, field]));
    const makeGroup = (keys) => keys.map((key) => map.get(key)).filter(Boolean);
    const used = new Set([...groupedKeys.core, ...groupedKeys.sleeve]);
    const remaining = (fields || []).filter((field) => !used.has(field.key));
    return {
      core: makeGroup(groupedKeys.core),
      sleeve: makeGroup(groupedKeys.sleeve).concat(remaining)
    };
  }, [fields]);

  const completion = useMemo(() => {
    const total = Array.isArray(fields) ? fields.length : 0;
    if (!total) return 0;
    const filled = (fields || []).filter((field) => {
      const value = values?.[field.key];
      return value !== undefined && value !== null && String(value).trim() !== '';
    }).length;
    return Math.round((filled / total) * 100);
  }, [fields, values]);

  const spotlight = useMemo(() => {
    return (fields || [])
      .filter((field) => values?.[field.key] !== undefined && values?.[field.key] !== null && String(values?.[field.key]).trim() !== '')
      .slice(0, 4);
  }, [fields, values]);

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border ${palette.border} bg-gradient-to-br ${palette.card} p-5 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] ring-1 ${palette.ring}`}>
      <div className="absolute inset-0 opacity-60 pointer-events-none bg-[linear-gradient(135deg,rgba(255,255,255,0.45),transparent_32%,rgba(255,255,255,0.18)_60%,transparent)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_28%,rgba(255,255,255,0.03)_60%,transparent)]" />
      <div className="relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-900/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300 shadow-sm">
              <PencilRuler className="w-3.5 h-3.5" />
              Measurement Workspace
            </div>
            <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h3>
            {subtitle ? <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <div className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold shadow-sm ${palette.soft}`}>
              <Sparkles className="w-4 h-4" />
              {completion}% complete
            </div>
            {badges.map((badge) => (
              <div key={badge} className={`inline-flex items-center rounded-2xl px-3 py-2 text-xs font-semibold shadow-sm ${palette.soft}`}>
                {badge}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1.15fr_0.9fr_1.15fr] gap-5 items-start">
          <div className="space-y-3">
            {orderedFields.core.map((field) => (
              <MeasurementFieldRow
                key={field.key}
                field={field}
                value={values?.[field.key]}
                onChange={(value) => onChange(field.key, value)}
                disabled={disabled}
                tone={tone}
              />
            ))}
          </div>

          <div className="space-y-4">
            <div className={`rounded-[2rem] border ${palette.border} bg-white/70 dark:bg-slate-900/45 p-4 shadow-sm`}>
              <PreviewGarment thawbType={thawbType} />
            </div>
            <div className={`rounded-[1.75rem] border ${palette.border} bg-white/70 dark:bg-slate-900/45 p-4 shadow-sm`}>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Ruler className="w-4 h-4" />
                Fit snapshot
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {spotlight.length > 0 ? spotlight.map((field) => (
                  <div key={field.key} className="rounded-2xl bg-stone-50/90 dark:bg-slate-950/70 px-3 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 truncate">{field.label}</div>
                    <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{formatValue(values?.[field.key])}</div>
                  </div>
                )) : (
                  <div className="col-span-2 rounded-2xl bg-stone-50/90 dark:bg-slate-950/70 px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                    Start entering measurements to build the fit summary.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {orderedFields.sleeve.map((field) => (
              <MeasurementFieldRow
                key={field.key}
                field={field}
                value={values?.[field.key]}
                onChange={(value) => onChange(field.key, value)}
                disabled={disabled}
                tone={tone}
              />
            ))}
          </div>
        </div>

        {loading ? <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading…</div> : null}
      </div>
    </div>
  );
};

export default MeasurementAtelierPanel;
