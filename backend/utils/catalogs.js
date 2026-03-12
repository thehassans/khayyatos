const emptyI18n = () => ({ en: '', ar: '', ur: '', hi: '', bn: '' });

const DEFAULT_STYLE_GROUPS = [
  { key: 'collar', options: ['classic', 'round', 'mandarin', 'open'] },
  { key: 'bain', options: ['hidden', 'visible', 'zip', 'half'] },
  { key: 'cuff', options: ['single', 'double', 'round', 'angled'] },
  { key: 'pocket', options: ['none', 'chest', 'side', 'both'] },
  { key: 'buttons', options: ['classic', 'hidden', 'snap', 'premium'] },
  { key: 'embroidery', options: ['none', 'name', 'logo', 'premium'] }
];

const DEFAULT_MEASUREMENT_KEYS = [
  'length',
  'shoulderWidth',
  'chest',
  'waist',
  'hips',
  'sleeveLength',
  'bicep',
  'forearm',
  'neck',
  'wrist',
  'cuffWidth',
  'expansion',
  'armhole',
  'bottom'
];

const sanitizeLowerKey = (value) => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
};

const sanitizeCatalogKey = (value) => {
  if (!value) return '';
  return String(value)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9_-]/g, '');
};

const buildDefaultMeasurementsCatalog = () => ({
  fields: DEFAULT_MEASUREMENT_KEYS.map((key, idx) => ({
    key,
    name: '',
    nameI18n: emptyI18n(),
    enabled: true,
    sortOrder: idx,
    image: null,
    imageUpdatedAt: null
  }))
});

const buildDefaultStyleOptionsCatalog = () => ({
  groups: DEFAULT_STYLE_GROUPS.map((group, groupIdx) => ({
    key: group.key,
    name: '',
    nameI18n: emptyI18n(),
    enabled: true,
    sortOrder: groupIdx,
    options: group.options.map((optionKey, optionIdx) => ({
      key: optionKey,
      name: '',
      nameI18n: emptyI18n(),
      image: null,
      imageUpdatedAt: null,
      enabled: true,
      sortOrder: optionIdx
    }))
  }))
});

const normalizeMeasurementsCatalog = (catalog) => {
  const rawFields = Array.isArray(catalog?.fields) ? catalog.fields : [];
  const seen = new Set();
  const fields = rawFields
    .map((field, idx) => {
      const key = sanitizeCatalogKey(field?.key);
      if (!key || seen.has(key)) return null;
      seen.add(key);
      return {
        key,
        name: typeof field?.name === 'string' ? field.name : '',
        nameI18n: typeof field?.nameI18n === 'object' && field?.nameI18n ? field.nameI18n : emptyI18n(),
        enabled: field?.enabled !== false,
        sortOrder: Number.isFinite(field?.sortOrder) ? field.sortOrder : idx,
        image: typeof field?.image === 'string' ? field.image : null,
        imageUpdatedAt: typeof field?.imageUpdatedAt === 'number' ? field.imageUpdatedAt : null
      };
    })
    .filter(Boolean);

  return { fields };
};

const normalizeStyleOptionsCatalog = (catalog) => {
  const baseGroups = buildDefaultStyleOptionsCatalog().groups;
  const incomingGroups = Array.isArray(catalog?.groups) ? catalog.groups : [];

  const groups = baseGroups.map((baseGroup, groupIdx) => {
    const inputGroup = incomingGroups.find((group) => sanitizeLowerKey(group?.key) === baseGroup.key) || {};
    const rawOptions = Array.isArray(inputGroup?.options) ? inputGroup.options : baseGroup.options;
    const seen = new Set();
    const normalizedOptions = rawOptions
      .map((option, optionIdx) => {
        const fallbackKey = baseGroup.options[optionIdx]?.key || '';
        const key = sanitizeLowerKey(option?.key || fallbackKey || option?.name);
        if (!key || seen.has(key)) return null;
        seen.add(key);
        const baseOption = baseGroup.options.find((item) => item.key === key) || {};
        return {
          key,
          name: typeof option?.name === 'string' ? option.name : (baseOption.name || ''),
          nameI18n: typeof option?.nameI18n === 'object' && option?.nameI18n ? option.nameI18n : (baseOption.nameI18n || emptyI18n()),
          image: typeof option?.image === 'string' ? option.image : (baseOption.image || null),
          imageUpdatedAt: typeof option?.imageUpdatedAt === 'number' ? option.imageUpdatedAt : (baseOption.imageUpdatedAt || null),
          enabled: option?.enabled !== false,
          sortOrder: Number.isFinite(option?.sortOrder) ? option.sortOrder : optionIdx
        };
      })
      .filter(Boolean);

    baseGroup.options.forEach((baseOption, optionIdx) => {
      if (normalizedOptions.some((item) => item.key === baseOption.key)) return;
      normalizedOptions.push({ ...baseOption, sortOrder: optionIdx });
    });

    return {
      key: baseGroup.key,
      name: typeof inputGroup?.name === 'string' ? inputGroup.name : baseGroup.name,
      nameI18n: typeof inputGroup?.nameI18n === 'object' && inputGroup?.nameI18n ? inputGroup.nameI18n : baseGroup.nameI18n,
      enabled: inputGroup?.enabled !== false,
      sortOrder: Number.isFinite(inputGroup?.sortOrder) ? inputGroup.sortOrder : groupIdx,
      options: normalizedOptions
        .slice()
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    };
  });

  return { groups };
};

const mergeMeasurementsCatalog = (systemCatalog, userCatalog) => {
  const normalizedSystem = normalizeMeasurementsCatalog(systemCatalog?.fields?.length ? systemCatalog : buildDefaultMeasurementsCatalog());
  const normalizedUser = normalizeMeasurementsCatalog(userCatalog || { fields: [] });
  const userMap = new Map((normalizedUser.fields || []).map((field) => [field.key, field]));
  const merged = [];
  const used = new Set();

  (normalizedSystem.fields || []).forEach((field, idx) => {
    const local = userMap.get(field.key) || {};
    used.add(field.key);
    merged.push({
      ...field,
      ...local,
      key: field.key,
      name: typeof local.name === 'string' && local.name.trim() ? local.name : field.name,
      nameI18n: typeof local.name === 'string' && local.name.trim() ? (local.nameI18n || emptyI18n()) : (field.nameI18n || emptyI18n()),
      image: local.image || field.image || null,
      imageUpdatedAt: local.imageUpdatedAt || field.imageUpdatedAt || null,
      enabled: field.enabled !== false && local.enabled !== false,
      sortOrder: Number.isFinite(local.sortOrder) ? local.sortOrder : (Number.isFinite(field.sortOrder) ? field.sortOrder : idx)
    });
  });

  (normalizedUser.fields || []).forEach((field) => {
    if (used.has(field.key)) return;
    merged.push(field);
  });

  return {
    fields: merged.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  };
};

const mergeStyleOptionsCatalog = (systemCatalog, userCatalog) => {
  const normalizedSystem = normalizeStyleOptionsCatalog(systemCatalog?.groups?.length ? systemCatalog : buildDefaultStyleOptionsCatalog());
  const normalizedUser = normalizeStyleOptionsCatalog(userCatalog || { groups: [] });
  const userGroups = new Map((normalizedUser.groups || []).map((group) => [group.key, group]));

  return {
    groups: (normalizedSystem.groups || []).map((group, groupIdx) => {
      const localGroup = userGroups.get(group.key) || {};
      const localOptions = new Map((localGroup.options || []).map((option) => [option.key, option]));
      const mergedOptions = [];
      const usedOptions = new Set();

      (group.options || []).forEach((option, optionIdx) => {
        const localOption = localOptions.get(option.key) || {};
        usedOptions.add(option.key);
        mergedOptions.push({
          ...option,
          ...localOption,
          key: option.key,
          name: typeof localOption.name === 'string' && localOption.name.trim() ? localOption.name : option.name,
          nameI18n: typeof localOption.name === 'string' && localOption.name.trim() ? (localOption.nameI18n || emptyI18n()) : (option.nameI18n || emptyI18n()),
          image: localOption.image || option.image || null,
          imageUpdatedAt: localOption.imageUpdatedAt || option.imageUpdatedAt || null,
          enabled: group.enabled !== false && option.enabled !== false && localOption.enabled !== false,
          sortOrder: Number.isFinite(localOption.sortOrder) ? localOption.sortOrder : (Number.isFinite(option.sortOrder) ? option.sortOrder : optionIdx)
        });
      });

      (localGroup.options || []).forEach((option) => {
        if (usedOptions.has(option.key)) return;
        mergedOptions.push(option);
      });

      return {
        ...group,
        ...localGroup,
        key: group.key,
        name: typeof localGroup.name === 'string' && localGroup.name.trim() ? localGroup.name : group.name,
        nameI18n: typeof localGroup.name === 'string' && localGroup.name.trim() ? (localGroup.nameI18n || emptyI18n()) : (group.nameI18n || emptyI18n()),
        enabled: group.enabled !== false && localGroup.enabled !== false,
        sortOrder: Number.isFinite(localGroup.sortOrder) ? localGroup.sortOrder : (Number.isFinite(group.sortOrder) ? group.sortOrder : groupIdx),
        options: mergedOptions.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      };
    })
  };
};

const extractUserMeasurementsCatalog = (systemCatalog, userCatalog) => {
  const normalizedSystem = normalizeMeasurementsCatalog(systemCatalog?.fields?.length ? systemCatalog : buildDefaultMeasurementsCatalog());
  const normalizedUser = normalizeMeasurementsCatalog(userCatalog || { fields: [] });
  const systemMap = new Map((normalizedSystem.fields || []).map((field) => [field.key, field]));

  const fields = (normalizedUser.fields || []).map((field, idx) => {
    const systemField = systemMap.get(field.key);
    if (!systemField) {
      return { ...field, sortOrder: Number.isFinite(field.sortOrder) ? field.sortOrder : idx };
    }

    const local = {
      key: field.key,
      name: typeof field.name === 'string' && field.name.trim() && field.name !== systemField.name ? field.name : '',
      nameI18n: typeof field.name === 'string' && field.name.trim() && field.name !== systemField.name ? (field.nameI18n || emptyI18n()) : emptyI18n(),
      enabled: field.enabled === false ? false : true,
      sortOrder: Number.isFinite(field.sortOrder) ? field.sortOrder : idx,
      image: field.image && field.image !== systemField.image ? field.image : null,
      imageUpdatedAt: field.image && field.image !== systemField.image ? (field.imageUpdatedAt || null) : null
    };

    const hasOverride = local.name || local.enabled === false || local.image || local.sortOrder !== (Number.isFinite(systemField.sortOrder) ? systemField.sortOrder : idx);
    return hasOverride ? local : null;
  }).filter(Boolean);

  return { fields };
};

const extractUserStyleOptionsCatalog = (systemCatalog, userCatalog) => {
  const normalizedSystem = normalizeStyleOptionsCatalog(systemCatalog?.groups?.length ? systemCatalog : buildDefaultStyleOptionsCatalog());
  const normalizedUser = normalizeStyleOptionsCatalog(userCatalog || { groups: [] });
  const systemGroups = new Map((normalizedSystem.groups || []).map((group) => [group.key, group]));

  const groups = (normalizedUser.groups || []).map((group, groupIdx) => {
    const systemGroup = systemGroups.get(group.key);
    if (!systemGroup) {
      return group;
    }

    const systemOptions = new Map((systemGroup.options || []).map((option) => [option.key, option]));
    const options = (group.options || []).map((option, optionIdx) => {
      const systemOption = systemOptions.get(option.key);
      if (!systemOption) {
        return option;
      }

      const localOption = {
        key: option.key,
        name: typeof option.name === 'string' && option.name.trim() && option.name !== systemOption.name ? option.name : '',
        nameI18n: typeof option.name === 'string' && option.name.trim() && option.name !== systemOption.name ? (option.nameI18n || emptyI18n()) : emptyI18n(),
        image: option.image && option.image !== systemOption.image ? option.image : null,
        imageUpdatedAt: option.image && option.image !== systemOption.image ? (option.imageUpdatedAt || null) : null,
        enabled: option.enabled === false ? false : true,
        sortOrder: Number.isFinite(option.sortOrder) ? option.sortOrder : optionIdx
      };

      const hasOverride = localOption.name || localOption.image || localOption.enabled === false || localOption.sortOrder !== (Number.isFinite(systemOption.sortOrder) ? systemOption.sortOrder : optionIdx);
      return hasOverride ? localOption : null;
    }).filter(Boolean);

    const localGroup = {
      key: group.key,
      name: typeof group.name === 'string' && group.name.trim() && group.name !== systemGroup.name ? group.name : '',
      nameI18n: typeof group.name === 'string' && group.name.trim() && group.name !== systemGroup.name ? (group.nameI18n || emptyI18n()) : emptyI18n(),
      enabled: group.enabled === false ? false : true,
      sortOrder: Number.isFinite(group.sortOrder) ? group.sortOrder : groupIdx,
      options
    };

    const hasGroupOverride = localGroup.name || localGroup.enabled === false || localGroup.sortOrder !== (Number.isFinite(systemGroup.sortOrder) ? systemGroup.sortOrder : groupIdx) || options.length;
    return hasGroupOverride ? localGroup : null;
  }).filter(Boolean);

  return { groups };
};

module.exports = {
  DEFAULT_STYLE_GROUPS,
  DEFAULT_MEASUREMENT_KEYS,
  buildDefaultMeasurementsCatalog,
  buildDefaultStyleOptionsCatalog,
  normalizeMeasurementsCatalog,
  normalizeStyleOptionsCatalog,
  mergeMeasurementsCatalog,
  mergeStyleOptionsCatalog,
  extractUserMeasurementsCatalog,
  extractUserStyleOptionsCatalog,
  sanitizeLowerKey,
  sanitizeCatalogKey,
  emptyI18n
};
