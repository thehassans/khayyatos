import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Settings as SettingsIcon, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const STYLE_GROUPS = [
  { key: 'collar', options: ['classic', 'round', 'mandarin', 'open'] },
  { key: 'pocket', options: ['none', 'chest', 'side', 'both'] },
  { key: 'bain', options: ['hidden', 'visible', 'zip', 'half'] },
  { key: 'cuff', options: ['single', 'double', 'round', 'angled'] },
  { key: 'buttons', options: ['classic', 'hidden', 'snap', 'premium'] },
  { key: 'embroidery', options: ['none', 'name', 'logo', 'premium'] }
];

const AdminSettings = () => {
  const { t } = useTranslation();
  const { api } = useAuth();

  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState(null);
  const [busyKey, setBusyKey] = useState('');

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

  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/style-option-images');
      setCatalog(response.data?.catalog || null);
    } catch (error) {
      toast.error('Failed to load admin settings');
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const uploadOptionImage = async (groupKey, optionKey, file) => {
    if (!file) return;
    const requestKey = `${groupKey}:${optionKey}`;
    setBusyKey(requestKey);
    try {
      const webp = await convertImageToWebp(file, 720, 0.85);
      const data = new FormData();
      data.append('groupKey', groupKey);
      data.append('optionKey', optionKey);
      data.append('image', webp || file);
      const response = await api.post('/admin/style-option-images/image', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCatalog(response.data?.catalog || null);
      toast.success('Image updated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload image');
    }
    setBusyKey('');
  };

  const deleteOptionImage = async (groupKey, optionKey) => {
    const requestKey = `${groupKey}:${optionKey}`;
    setBusyKey(requestKey);
    try {
      const response = await api.delete('/admin/style-option-images/image', {
        params: { groupKey, optionKey }
      });
      setCatalog(response.data?.catalog || null);
      toast.success('Image deleted');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete image');
    }
    setBusyKey('');
  };

  const displayGroups = useMemo(() => {
    const catalogGroups = Array.isArray(catalog?.groups) ? catalog.groups : [];
    return STYLE_GROUPS.map((group) => {
      const existingGroup = catalogGroups.find((item) => item.key === group.key);
      return {
        key: group.key,
        label: t(`styleOptions.${group.key}`, { defaultValue: group.key }),
        options: group.options.map((optionKey) => {
          const existingOption = existingGroup?.options?.find((item) => item.key === optionKey);
          const imageUrl = existingOption?.image ? resolveUploadsUrl(existingOption.image) : null;
          return {
            key: optionKey,
            label: t(`styleOptions.options.${group.key}.${optionKey}`, { defaultValue: optionKey }),
            imageSrc: imageUrl ? `${imageUrl}${existingOption?.imageUpdatedAt ? `?v=${existingOption.imageUpdatedAt}` : ''}` : null
          };
        })
      };
    });
  }, [catalog, resolveUploadsUrl, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.settings', { defaultValue: 'Settings' })}</h1>
          <p className="text-sm text-gray-500">Style option images for the measurement workspace. Uploads are converted to WebP automatically.</p>
        </div>
      </div>

      <Card>
        <CardBody className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            These images are managed from the admin panel and used in the user measurement workspace when a user has not uploaded a custom image.
          </div>

          <div className="space-y-6">
            {displayGroups.map((group) => (
              <div key={group.key} className="rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 mb-1">{group.key}</div>
                  <div className="text-lg font-semibold text-gray-900">{group.label}</div>
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {group.options.map((option) => {
                    const requestKey = `${group.key}:${option.key}`;
                    const isBusy = busyKey === requestKey;
                    return (
                      <div key={requestKey} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
                        <div className="aspect-square rounded-2xl border border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center">
                          {option.imageSrc ? (
                            <img src={option.imageSrc} alt={option.label} className="w-full h-full object-contain" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                              <ImageIcon className="w-8 h-8" />
                              <span className="text-xs font-medium">No image</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-gray-500">{option.key}</div>
                          <div className="mt-1 text-sm font-semibold text-gray-900">{option.label}</div>
                        </div>

                        <div className="flex gap-2">
                          <label className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => uploadOptionImage(group.key, option.key, e.target.files?.[0])}
                              disabled={isBusy}
                            />
                            <span className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${isBusy ? 'bg-gray-200 text-gray-500' : 'bg-gray-900 text-white hover:opacity-90'}`}>
                              <Upload className="w-4 h-4" />
                              Upload
                            </span>
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            className="px-3"
                            onClick={() => deleteOptionImage(group.key, option.key)}
                            disabled={isBusy || !option.imageSrc}
                            icon={Trash2}
                          >
                            Remove
                          </Button>
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
