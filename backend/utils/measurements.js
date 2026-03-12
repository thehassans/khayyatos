const normalizeMeasurementValues = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};

  return Object.entries(input).reduce((acc, [key, value]) => {
    const normalizedKey = typeof key === 'string' ? key.trim() : '';
    if (!normalizedKey) return acc;

    if (value === '' || value === null || value === undefined) return acc;

    if (typeof value === 'number' && Number.isFinite(value)) {
      acc[normalizedKey] = value;
      return acc;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return acc;
      const numeric = Number(trimmed);
      acc[normalizedKey] = Number.isFinite(numeric) ? numeric : trimmed;
      return acc;
    }

    acc[normalizedKey] = value;
    return acc;
  }, {});
};

const mergeMeasurementValues = (currentValue, nextValue) => {
  const current = normalizeMeasurementValues(currentValue);
  const next = normalizeMeasurementValues(nextValue);
  return { ...current, ...next };
};

module.exports = {
  normalizeMeasurementValues,
  mergeMeasurementValues
};
