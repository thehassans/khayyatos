import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Settings as SettingsIcon, Upload, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const sanitizeKey = (value) => String(value || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');

const AdminSettings = () => {
  const { t } = useTranslation();
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [measurementsCatalog, setMeasurementsCatalog] = useState(null);
  const [styleCatalog, setStyleCatalog] = useState(null);
  const [busyKey, setBusyKey] = useState('');
  const [savingMeasurements, setSavingMeasurements] = useState(false);
  const [savingStyles, setSavingStyles] = useState(false);
  const [measurementDraft, setMeasurementDraft] = useState({ key: '', name: '' });
  const [optionDrafts, setOptionDrafts] = useState({});

  const resolveUploadsUrl = useCallback((src) => {
    if (!src) return src;
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (!src.startsWith('/uploads/')) return src;
    const baseUrl = api?.defaults?.baseURL;
    if (!baseUrl || typeof baseUrl !== 'string') return src;
    try {
      if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
        return `${new URL(baseUrl).origin}${src}`;
      }
    } catch (e) {
      return src;
    }
    return src;
  }, [api]);

  const convertImageToWebp = async (file, maxWidth = 720, quality = 0.85) => {
    if (!file) return null;
    if (file.type === 'image/webp') return file;
    const inputDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to load image'));
      el.src = typeof inputDataUrl === 'string' ? inputDataUrl : '';
    });
    const scale = img.width ? Math.min(1, maxWidth / img.width) : 1;
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available');
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob) throw new Error('Failed to convert image');
    const base = (file.name || 'image').replace(/\.[^/.]+$/, '');
    return new File([blob], `${base}.webp`, { type: 'image/webp' });
  };

  const fetchCatalogs = useCallback(async () => {
    try {
      setLoading(true);
      const [measurementsResponse, styleResponse] = await Promise.all([
        api.get('/admin/measurements-catalog'),
        api.get('/admin/style-options-catalog')
      ]);
      setMeasurementsCatalog(measurementsResponse.data?.catalog || { fields: [] });
      setStyleCatalog(styleResponse.data?.catalog || { groups: [] });
    } catch (error) {
      toast.error('Failed to load admin settings');
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  const sortedMeasurements = useMemo(() => (measurementsCatalog?.fields || []).slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)), [measurementsCatalog]);
  const sortedGroups = useMemo(() => (styleCatalog?.groups || []).slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)), [styleCatalog]);

  const updateMeasurementField = (key, patch) => {
    setMeasurementsCatalog((prev) => ({
      ...prev,
      fields: (prev?.fields || []).map((field) => (field.key === key ? { ...field, ...patch } : field))
    }));
  };

  const addMeasurementField = () => {
    const key = sanitizeKey(measurementDraft.key || measurementDraft.name);
    if (!key) {
      toast.error('Enter measurement key or name');
      return;
    }
    if ((measurementsCatalog?.fields || []).some((field) => field.key === key)) {
      toast.error('Measurement already exists');
      return;
    }
    setMeasurementsCatalog((prev) => ({
      ...prev,
      fields: [...(prev?.fields || []), { key, name: measurementDraft.name || '', enabled: true, sortOrder: (prev?.fields || []).length, image: null, imageUpdatedAt: null }]
    }));
    setMeasurementDraft({ key: '', name: '' });
  };

  const saveMeasurementsCatalog = async () => {
    if (!measurementsCatalog) return;
    setSavingMeasurements(true);
    try {
      const response = await api.put('/admin/measurements-catalog', measurementsCatalog);
      setMeasurementsCatalog(response.data?.catalog || measurementsCatalog);
      toast.success('Measurements catalog saved');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save measurements catalog');
    }
    setSavingMeasurements(false);
  };

  const persistMeasurementsCatalog = async () => {
    if (!measurementsCatalog) return measurementsCatalog;
    const response = await api.put('/admin/measurements-catalog', measurementsCatalog);
    const nextCatalog = response.data?.catalog || measurementsCatalog;
    setMeasurementsCatalog(nextCatalog);
    return nextCatalog;
  };

  const updateGroup = (groupKey, patch) => {
    setStyleCatalog((prev) => ({
      ...prev,
      groups: (prev?.groups || []).map((group) => (group.key === groupKey ? { ...group, ...patch } : group))
    }));
  };

  const updateOption = (groupKey, optionKey, patch) => {
    setStyleCatalog((prev) => ({
      ...prev,
      groups: (prev?.groups || []).map((group) => {
        if (group.key !== groupKey) return group;
        return {
          ...group,
          options: (group.options || []).map((option) => (option.key === optionKey ? { ...option, ...patch } : option))
        };
      })
    }));
  };

  const addOption = (groupKey) => {
    const draft = optionDrafts[groupKey] || { key: '', name: '' };
    const key = sanitizeKey(draft.key || draft.name);
    if (!key) {
      toast.error('Enter option key or name');
      return;
    }
    setStyleCatalog((prev) => ({
      ...prev,
      groups: (prev?.groups || []).map((group) => {
        if (group.key !== groupKey) return group;
        if ((group.options || []).some((option) => option.key === key)) return group;
        return {
          ...group,
          options: [...(group.options || []), { key, name: draft.name || '', enabled: true, sortOrder: (group.options || []).length, image: null, imageUpdatedAt: null }]
        };
      })
    }));
    setOptionDrafts((prev) => ({ ...prev, [groupKey]: { key: '', name: '' } }));
  };

  const saveStyleCatalog = async () => {
    if (!styleCatalog) return;
    setSavingStyles(true);
    try {
      const response = await api.put('/admin/style-options-catalog', styleCatalog);
      setStyleCatalog(response.data?.catalog || styleCatalog);
      toast.success('Style options catalog saved');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save style catalog');
    }
    setSavingStyles(false);
  };

  const persistStyleCatalog = async () => {
    if (!styleCatalog) return styleCatalog;
    const response = await api.put('/admin/style-options-catalog', styleCatalog);
    const nextCatalog = response.data?.catalog || styleCatalog;
    setStyleCatalog(nextCatalog);
    return nextCatalog;
  };

  const uploadMeasurementImage = async (fieldKey, file) => {
    if (!file) return;
    setBusyKey(`m:${fieldKey}`);
    try {
      await persistMeasurementsCatalog();
      const webp = await convertImageToWebp(file, 720, 0.85);
      const data = new FormData();
      data.append('fieldKey', fieldKey);
      data.append('image', webp || file);
      const response = await api.post('/admin/measurements-catalog/image', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMeasurementsCatalog(response.data?.catalog || measurementsCatalog);
      toast.success('Image updated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload image');
    }
    setBusyKey('');
  };

  const deleteMeasurementImage = async (fieldKey) => {
    setBusyKey(`m:${fieldKey}`);
    try {
      const response = await api.delete('/admin/measurements-catalog/image', { params: { fieldKey } });
      setMeasurementsCatalog(response.data?.catalog || measurementsCatalog);
      toast.success('Image deleted');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete image');
    }
    setBusyKey('');
  };

  const uploadOptionImage = async (groupKey, optionKey, file) => {
    if (!file) return;
    setBusyKey(`${groupKey}:${optionKey}`);
    try {
      await persistStyleCatalog();
      const webp = await convertImageToWebp(file, 720, 0.85);
      const data = new FormData();
      data.append('groupKey', groupKey);
      data.append('optionKey', optionKey);
      data.append('image', webp || file);
      const response = await api.post('/admin/style-option-images/image', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setStyleCatalog(response.data?.catalog || styleCatalog);
      toast.success('Image updated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload image');
    }
    setBusyKey('');
  };

  const deleteOptionImage = async (groupKey, optionKey) => {
    setBusyKey(`${groupKey}:${optionKey}`);
    try {
      const response = await api.delete('/admin/style-option-images/image', { params: { groupKey, optionKey } });
      setStyleCatalog(response.data?.catalog || styleCatalog);
      toast.success('Image deleted');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete image');
    }
    setBusyKey('');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center"><SettingsIcon className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('nav.settings', { defaultValue: 'Settings' })}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Manage system measurement fields and style options used across all shops.</p>
        </div>
      </div>

      <Card>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-slate-100">Measurements Catalog</div>
              <div className="text-sm text-gray-500 dark:text-slate-400">Add, edit, enable, and upload images for system measurement fields.</div>
            </div>
            <Button onClick={saveMeasurementsCatalog} loading={savingMeasurements}>Save Measurements</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label="Field Key" value={measurementDraft.key} onChange={(e) => setMeasurementDraft((prev) => ({ ...prev, key: e.target.value }))} placeholder="inseam" />
            <Input label="Display Name" value={measurementDraft.name} onChange={(e) => setMeasurementDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="Inseam" />
            <div className="flex items-end"><Button type="button" icon={Plus} className="w-full" onClick={addMeasurementField}>Add Field</Button></div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {sortedMeasurements.map((field) => {
              const imageUrl = field.image ? resolveUploadsUrl(field.image) : null;
              const imageSrc = imageUrl ? `${imageUrl}${field.imageUpdatedAt ? `?v=${field.imageUpdatedAt}` : ''}` : null;
              const isBusy = busyKey === `m:${field.key}`;
              return (
                <div key={field.key} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 p-4 space-y-4">
                  <div className="flex gap-4">
                    <div className="w-20">
                      <div className="relative w-20 h-20 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden bg-gray-50 dark:bg-slate-900">
                        {imageSrc ? <img src={imageSrc} alt={field.key} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600"><ImageIcon className="w-6 h-6" /></div>}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="text-xs font-semibold text-gray-500 dark:text-slate-400">{field.key}</div>
                      <Input value={field.name || ''} onChange={(e) => updateMeasurementField(field.key, { name: e.target.value })} placeholder="Display name" />
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
                        <input type="checkbox" checked={field.enabled !== false} onChange={(e) => updateMeasurementField(field.key, { enabled: e.target.checked })} className="rounded border-gray-300 dark:border-slate-700" />
                        Enabled
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadMeasurementImage(field.key, e.target.files?.[0])} disabled={isBusy} />
                      <span className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${isBusy ? 'bg-gray-200 text-gray-500' : 'bg-gray-900 text-white hover:opacity-90'}`}><Upload className="w-4 h-4" />Upload</span>
                    </label>
                    <Button type="button" variant="outline" className="px-3" onClick={() => deleteMeasurementImage(field.key)} disabled={isBusy || !field.image} icon={Trash2}>Remove</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-slate-100">Style Options Catalog</div>
              <div className="text-sm text-gray-500 dark:text-slate-400">Edit group names, enable or disable options, add new pocket styles, and manage images.</div>
            </div>
            <Button onClick={saveStyleCatalog} loading={savingStyles}>Save Style Options</Button>
          </div>

          <div className="space-y-6">
            {sortedGroups.map((group) => (
              <div key={group.key} className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="px-5 py-4 bg-gray-50 dark:bg-slate-900/40 border-b border-gray-200 dark:border-slate-700 space-y-3">
                  <div className="text-xs font-semibold text-gray-500 dark:text-slate-400">{group.key}</div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
                    <Input value={group.name || ''} onChange={(e) => updateGroup(group.key, { name: e.target.value })} placeholder="Group display name" />
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
                      <input type="checkbox" checked={group.enabled !== false} onChange={(e) => updateGroup(group.key, { enabled: e.target.checked })} className="rounded border-gray-300 dark:border-slate-700" />
                      Enabled
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input value={optionDrafts[group.key]?.key || ''} onChange={(e) => setOptionDrafts((prev) => ({ ...prev, [group.key]: { ...(prev[group.key] || {}), key: e.target.value } }))} placeholder="Option key" />
                    <Input value={optionDrafts[group.key]?.name || ''} onChange={(e) => setOptionDrafts((prev) => ({ ...prev, [group.key]: { ...(prev[group.key] || {}), name: e.target.value } }))} placeholder="Option display name" />
                    <div className="flex items-end"><Button type="button" icon={Plus} className="w-full" onClick={() => addOption(group.key)}>Add Option</Button></div>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {(group.options || []).slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((option) => {
                    const imageUrl = option.image ? resolveUploadsUrl(option.image) : null;
                    const imageSrc = imageUrl ? `${imageUrl}${option.imageUpdatedAt ? `?v=${option.imageUpdatedAt}` : ''}` : null;
                    const requestKey = `${group.key}:${option.key}`;
                    const isBusy = busyKey === requestKey;
                    return (
                      <div key={requestKey} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 p-4 space-y-4">
                        <div className="flex gap-4">
                          <div className="w-20 h-20 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                            {imageSrc ? <img src={imageSrc} alt={option.key} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-gray-300 dark:text-slate-600" />}
                          </div>
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="text-xs font-semibold text-gray-500 dark:text-slate-400">{option.key}</div>
                            <Input value={option.name || ''} onChange={(e) => updateOption(group.key, option.key, { name: e.target.value })} placeholder="Option display name" />
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
                              <input type="checkbox" checked={option.enabled !== false} onChange={(e) => updateOption(group.key, option.key, { enabled: e.target.checked })} className="rounded border-gray-300 dark:border-slate-700" />
                              Enabled
                            </label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <label className="flex-1">
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadOptionImage(group.key, option.key, e.target.files?.[0])} disabled={isBusy} />
                            <span className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${isBusy ? 'bg-gray-200 text-gray-500' : 'bg-gray-900 text-white hover:opacity-90'}`}><Upload className="w-4 h-4" />Upload</span>
                          </label>
                          <Button type="button" variant="outline" className="px-3" onClick={() => deleteOptionImage(group.key, option.key)} disabled={isBusy || !option.image} icon={Trash2}>Remove</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminSettings;
