import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Plus, Upload, Trash2, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const EmbroideryDesigns = () => {
  const { t, i18n } = useTranslation();
  const { api } = useAuth();
  const navigate = useNavigate();

  const langKey = (i18n?.language || 'en').split('-')[0];

  const [loading, setLoading] = useState(true);
  const [designs, setDesigns] = useState([]);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState({ open: false, design: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, design: null, loading: false });

  const [uploading, setUploading] = useState(false);
  const [newDesign, setNewDesign] = useState({ name: '', image: null, preview: null });

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

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/embroidery-designs');
      setDesigns(Array.isArray(response.data?.designs) ? response.data.designs : []);
    } catch (error) {
      toast.error('Failed to load designs');
      setDesigns([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

  const sortedDesigns = useMemo(() => {
    return (designs || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
  }, [designs]);

  const openUploadModal = () => {
    setNewDesign({ name: '', image: null, preview: null });
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setNewDesign({ name: '', image: null, preview: null });
  };

  const convertImageToWebp = async (file, maxWidth = 1200, quality = 0.85) => {
    if (!file) return { webpFile: null, previewDataUrl: null };

    const readAsDataUrl = (f) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(f);
    });

    if (file.type === 'image/webp') {
      const dataUrl = await readAsDataUrl(file);
      return { webpFile: file, previewDataUrl: typeof dataUrl === 'string' ? dataUrl : null };
    }

    const inputDataUrl = await readAsDataUrl(file);
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
    const webpFile = new File([blob], `${base}.webp`, { type: 'image/webp' });
    const previewDataUrl = canvas.toDataURL('image/webp', quality);
    return { webpFile, previewDataUrl };
  };

  const handlePickDesignImage = async (file) => {
    try {
      const { webpFile, previewDataUrl } = await convertImageToWebp(file, 1200, 0.85);
      setNewDesign((prev) => ({ ...prev, image: webpFile, preview: previewDataUrl }));
    } catch (e) {
      toast.error('Failed to prepare image');
      setNewDesign((prev) => ({ ...prev, image: null, preview: null }));
    }
  };

  const handleUpload = async () => {
    if (!newDesign.name.trim()) {
      toast.error('Design name is required');
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      data.append('name', newDesign.name.trim());
      if (newDesign.image) data.append('image', newDesign.image);

      await api.post('/embroidery-designs', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Design uploaded');
      closeUploadModal();
      fetchDesigns();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    }
    setUploading(false);
  };

  const requestDelete = (design) => {
    setDeleteModal({ open: true, design, loading: false });
  };

  const closeDelete = () => {
    setDeleteModal({ open: false, design: null, loading: false });
  };

  const confirmDelete = async () => {
    const id = deleteModal?.design?._id;
    if (!id) {
      closeDelete();
      return;
    }
    setDeleteModal((p) => ({ ...p, loading: true }));
    try {
      await api.delete(`/embroidery-designs/${id}`);
      toast.success('Design deleted');
      closeDelete();
      fetchDesigns();
    } catch (error) {
      toast.error('Failed to delete');
      setDeleteModal((p) => ({ ...p, loading: false }));
    }
  };

  const openPreview = (design) => {
    setPreviewModal({ open: true, design });
  };

  const closePreview = () => {
    setPreviewModal({ open: false, design: null });
  };

  const createOrderWithDesign = (design) => {
    closePreview();
    navigate(`/user/stitchings/new?embroideryDesignId=${design._id}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('embroideryDesigns.title', { defaultValue: 'Embroidery Designs' })}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('embroideryDesigns.subtitle', { defaultValue: 'Upload your library and create orders faster.' })}</p>
        </div>
        <Button onClick={openUploadModal} icon={Plus}>
          {t('embroideryDesigns.uploadNew', { defaultValue: 'Upload New Design' })}
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardBody>
            <div className="flex items-center justify-center h-56">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
          </CardBody>
        </Card>
      ) : sortedDesigns.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-7 h-7 text-gray-400 dark:text-slate-500" />
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400">{t('embroideryDesigns.empty', { defaultValue: 'No designs yet. Upload your first design.' })}</div>
              <div className="mt-4 flex justify-center">
                <Button onClick={openUploadModal} icon={Upload}>{t('embroideryDesigns.uploadNew', { defaultValue: 'Upload New Design' })}</Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedDesigns.map((d) => {
            const imageUrl = d.image ? resolveUploadsUrl(d.image) : null;
            const imageSrc = imageUrl ? `${imageUrl}${d.imageUpdatedAt ? `?v=${d.imageUpdatedAt}` : ''}` : null;
            const displayName = d?.nameI18n?.[langKey] || d.name;

            return (
              <div
                key={d._id}
                className="group relative rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/30 dark:to-slate-900/10 overflow-hidden hover:shadow-xl hover:scale-[1.01] transition-all"
              >
                <button
                  type="button"
                  onClick={() => openPreview(d)}
                  className="w-full text-left"
                >
                  <div className="relative h-52 bg-gray-100 dark:bg-slate-800">
                    {imageSrc ? (
                      <img src={imageSrc} alt={d.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 opacity-90" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="text-white font-semibold truncate">{displayName}</div>
                      <div className="text-white/70 text-xs truncate">{t('embroideryDesigns.clickToView', { defaultValue: 'Click to preview' })}</div>
                    </div>
                  </div>
                </button>

                <div className="p-4 flex items-center justify-between gap-3">
                  <Button variant="success" onClick={() => createOrderWithDesign(d)}>
                    {t('embroideryDesigns.createOrder', { defaultValue: 'Create Order' })}
                  </Button>
                  <button
                    type="button"
                    onClick={() => requestDelete(d)}
                    className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    title={t('common.delete', { defaultValue: 'Delete' })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={uploadModalOpen}
        onClose={closeUploadModal}
        title={t('embroideryDesigns.uploadNew', { defaultValue: 'Upload New Design' })}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label={t('embroideryDesigns.designName', { defaultValue: 'Design Name' })}
            value={newDesign.name}
            onChange={(e) => setNewDesign({ ...newDesign, name: e.target.value })}
            placeholder="e.g. Golden Palm"
          />

          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-900/40">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-gray-700 dark:text-slate-200">{t('embroideryDesigns.designImage', { defaultValue: 'Design Image' })}</div>
              {newDesign.image ? (
                <button
                  type="button"
                  onClick={() => setNewDesign({ ...newDesign, image: null, preview: null })}
                  className="text-sm text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  {t('common.remove', { defaultValue: 'Remove' })}
                </button>
              ) : null}
            </div>

            <div className="mt-3 flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                {newDesign.preview ? (
                  <img src={newDesign.preview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-7 h-7 text-gray-300 dark:text-slate-600" />
                )}
              </div>
              <div>
                <label className="cursor-pointer">
                  <span className="px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {t('embroideryDesigns.chooseFile', { defaultValue: 'Choose File' })}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (!f) {
                        setNewDesign({ ...newDesign, image: null, preview: null });
                        return;
                      }
                      handlePickDesignImage(f);
                    }}
                    className="hidden"
                  />
                </label>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-2">PNG, JPG, WEBP up to 5MB</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleUpload} loading={uploading} className="flex-1">
              {t('common.save', { defaultValue: 'Save' })}
            </Button>
            <Button variant="secondary" onClick={closeUploadModal} className="flex-1">
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={previewModal.open}
        onClose={closePreview}
        title={(previewModal.design?.nameI18n?.[langKey] || previewModal.design?.name) || t('embroideryDesigns.preview', { defaultValue: 'Preview' })}
        size="xl"
      >
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800">
            {previewModal.design?.image ? (
              <img
                src={`${resolveUploadsUrl(previewModal.design.image)}${previewModal.design.imageUpdatedAt ? `?v=${previewModal.design.imageUpdatedAt}` : ''}`}
                alt={previewModal.design?.name}
                className="w-full max-h-[60vh] object-contain bg-black"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-300 dark:text-slate-600">
                <ImageIcon className="w-10 h-10" />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="success" onClick={() => previewModal.design && createOrderWithDesign(previewModal.design)} className="flex-1">
              {t('embroideryDesigns.createOrder', { defaultValue: 'Create Order' })}
            </Button>
            <Button variant="secondary" onClick={closePreview} className="flex-1">
              {t('common.close', { defaultValue: 'Close' })}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal.open}
        onClose={closeDelete}
        title={t('common.delete', { defaultValue: 'Delete' })}
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-900/10 p-4">
            <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
              {t('embroideryDesigns.deleteConfirmTitle', { defaultValue: 'Delete this design?' })}
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-300 mt-1">
              {t('embroideryDesigns.deleteConfirmSubtitle', { defaultValue: 'This action cannot be undone.' })}
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 bg-white/60 dark:bg-slate-900/30">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
              {deleteModal?.design?.image ? (
                <img
                  src={`${resolveUploadsUrl(deleteModal.design.image)}${deleteModal.design.imageUpdatedAt ? `?v=${deleteModal.design.imageUpdatedAt}` : ''}`}
                  alt={deleteModal?.design?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-7 h-7 text-gray-300 dark:text-slate-600" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                {deleteModal?.design?.nameI18n?.[langKey] || deleteModal?.design?.name || '—'}
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
                {t('embroideryDesigns.deleteConfirmHint', { defaultValue: 'Removing it will not delete existing orders that used this design.' })}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="danger" onClick={confirmDelete} loading={deleteModal.loading} className="flex-1">
              {t('common.delete', { defaultValue: 'Delete' })}
            </Button>
            <Button variant="secondary" onClick={closeDelete} className="flex-1" disabled={deleteModal.loading}>
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmbroideryDesigns;
