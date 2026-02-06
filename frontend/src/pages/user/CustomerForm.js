import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import DemoBlockedModal from '../../components/ui/DemoBlockedModal';
import { ArrowLeft, Plus, X, Users } from 'lucide-react';
import MeasurementCard from '../../components/ui/MeasurementCard';
import toast from 'react-hot-toast';

const RELATION_TYPES = [
  { value: 'father', label: 'Father / الأب' },
  { value: 'son', label: 'Son / الابن' },
  { value: 'brother', label: 'Brother / الأخ' },
  { value: 'uncle', label: 'Uncle / العم' },
  { value: 'cousin', label: 'Cousin / ابن العم' },
  { value: 'friend', label: 'Friend / صديق' },
  { value: 'other', label: 'Other / آخر' }
];

const CustomerForm = () => {
  const { t, i18n } = useTranslation();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const isDemo = !!user?.isDemoSession;
  const [demoBlockedOpen, setDemoBlockedOpen] = useState(false);

  const langKey = (i18n?.language || 'en').split('-')[0];
  const isRtl = langKey === 'ar' || langKey === 'ur';

  const [loading, setLoading] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [measurementsCatalog, setMeasurementsCatalog] = useState(null);
  const [measurementsCatalogLoading, setMeasurementsCatalogLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '+966',
    notes: '',
    relations: [],
    measurements: {
      length: '',
      shoulderWidth: '',
      chest: '',
      waist: '',
      hips: '',
      sleeveLength: '',
      bicep: '',
      forearm: '',
      neck: '',
      wrist: '',
      cuffWidth: '',
      expansion: '',
      armhole: '',
      bottom: ''
    }
  });
  const [newRelation, setNewRelation] = useState({ customerId: '', relationType: 'brother' });

  const translateTimerRef = useRef(null);
  const [nameTranslating, setNameTranslating] = useState(false);
  const [nameI18nPreview, setNameI18nPreview] = useState(null);

  useEffect(() => {
    fetchAllCustomers();
    fetchMeasurementsCatalog();
    if (isEdit) fetchCustomer();
  }, [id]);

  useEffect(() => {
    if (isEdit) return;
    const isTutorial = (searchParams.get('tutorial') || '') === '1';
    if (!isTutorial) return;

    const nextName = String(searchParams.get('name') || 'Example Customer');
    const nextPhone = String(searchParams.get('phone') || '0512456789');

    setFormData((prev) => {
      const shouldFill = !prev?.name && (!prev?.phone || prev?.phone === '+966');
      if (!shouldFill) return prev;
      return {
        ...prev,
        name: nextName,
        phone: nextPhone,
        measurements: {
          length: 10,
          shoulderWidth: 10,
          chest: 10,
          waist: 10,
          hips: 10,
          sleeveLength: 10,
          bicep: 10,
          forearm: 10,
          neck: 10,
          wrist: 10,
          cuffWidth: 10,
          expansion: 10,
          armhole: 10,
          bottom: 10
        }
      };
    });
  }, [isEdit, searchParams]);

  useEffect(() => {
    const text = typeof formData.name === 'string' ? formData.name.trim() : '';

    if (translateTimerRef.current) {
      clearTimeout(translateTimerRef.current);
      translateTimerRef.current = null;
    }

    if (!text) {
      setNameI18nPreview(null);
      setNameTranslating(false);
      return;
    }

    translateTimerRef.current = setTimeout(async () => {
      try {
        setNameTranslating(true);
        const resp = await api.post('/settings/translate', {
          entries: [{ id: 'name', text }],
          targetLangs: ['en', 'ar', 'ur', 'hi', 'bn']
        });
        const tr = resp.data?.translations?.name || null;
        if (tr && typeof tr === 'object') {
          setNameI18nPreview(tr);
        }
      } catch (e) {

      }
      setNameTranslating(false);
    }, 650);

    return () => {
      if (translateTimerRef.current) {
        clearTimeout(translateTimerRef.current);
        translateTimerRef.current = null;
      }
    };
  }, [api, formData.name]);

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

  const fetchAllCustomers = async () => {
    try {
      const response = await api.get('/customers');
      const data = response.data;
      setAllCustomers(Array.isArray(data) ? data : data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchMeasurementsCatalog = async () => {
    try {
      setMeasurementsCatalogLoading(true);
      const response = await api.get('/settings/measurements-catalog');
      setMeasurementsCatalog(response.data?.catalog || null);
    } catch (error) {
      setMeasurementsCatalog(null);
    }
    setMeasurementsCatalogLoading(false);
  };

  const fetchCustomer = async () => {
    try {
      const response = await api.get(`/customers/${id}`);
      const customer = response.data.customer || response.data;
      const normalizedRelations = Array.isArray(customer.relations)
        ? customer.relations.map((r) => {
            const ref = r?.customerId;
            const refId = typeof ref === 'object' && ref ? ref._id : ref;
            const refName = typeof ref === 'object' && ref ? (ref.nameI18n?.[langKey] || ref.name) : null;
            const refPhone = typeof ref === 'object' && ref ? ref.phone : null;
            return {
              ...r,
              customerId: refId,
              customerName: refName || r.customerName || '',
              customerPhone: refPhone || r.customerPhone || ''
            };
          })
        : [];
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '+966',
        notes: customer.notes || '',
        relations: normalizedRelations,
        measurements: customer.measurements || {}
      });
    } catch (error) {
      toast.error('Failed to load customer');
      navigate('/user/customers');
    }
  };

  const addRelation = () => {
    if (!newRelation.customerId) {
      toast.error('Select a customer');
      return;
    }
    const customer = allCustomers.find(c => c._id === newRelation.customerId);
    if (!customer) return;
    
    const exists = formData.relations.find(r => r.customerId === newRelation.customerId);
    if (exists) {
      toast.error('Relation already exists');
      return;
    }

    setFormData({
      ...formData,
      relations: [...formData.relations, {
        customerId: newRelation.customerId,
        customerName: customer.nameI18n?.[langKey] || customer.name,
        customerPhone: customer.phone,
        relationType: newRelation.relationType
      }]
    });
    setNewRelation({ customerId: '', relationType: 'brother' });
  };

  const removeRelation = (customerId) => {
    setFormData({
      ...formData,
      relations: formData.relations.filter(r => r.customerId !== customerId)
    });
  };

  const handleMeasurementChange = (field, value) => {
    setFormData({
      ...formData,
      measurements: {
        ...formData.measurements,
        [field]: value ? parseFloat(value) : ''
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        phone: formData.phone,
        notes: formData.notes,
        relations: formData.relations,
        measurements: Object.fromEntries(
          Object.entries(formData.measurements).filter(([_, v]) => v !== '' && v !== null)
        )
      };

      if (isEdit) {
        await api.put(`/customers/${id}`, data);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', data);
        toast.success('Customer created');
      }
      navigate('/user/customers');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
    setLoading(false);
  };

  const fallbackMeasurementFields = [
    { key: 'length', label: t('measurements.length') },
    { key: 'shoulderWidth', label: t('measurements.shoulderWidth') },
    { key: 'chest', label: t('measurements.chest') },
    { key: 'waist', label: t('measurements.waist') },
    { key: 'hips', label: t('measurements.hips') },
    { key: 'sleeveLength', label: t('measurements.sleeveLength') },
    { key: 'bicep', label: t('measurements.bicep') },
    { key: 'forearm', label: t('measurements.forearm') },
    { key: 'neck', label: t('measurements.neck') },
    { key: 'wrist', label: t('measurements.wrist') },
    { key: 'cuffWidth', label: t('measurements.cuffWidth') },
    { key: 'expansion', label: t('measurements.expansion') },
    { key: 'armhole', label: t('measurements.armhole') },
    { key: 'bottom', label: t('measurements.bottom') }
  ];

  const measurementFields = measurementsCatalog?.fields?.length
    ? measurementsCatalog.fields
        .filter((f) => f && f.enabled !== false)
        .slice()
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((f) => ({
          key: f.key,
          label: f.nameI18n?.[langKey] || f.name || t(`measurements.${f.key}`, { defaultValue: f.key }),
          image: f.image,
          imageUpdatedAt: f.imageUpdatedAt
        }))
    : fallbackMeasurementFields;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/user/customers')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 dark:text-slate-300 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          {isEdit ? t('customers.editCustomer') : t('customers.createCustomer')}
        </h1>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input
                  label={t('customers.name')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-tutorial="customer-form-name"
                  required
                />
                {nameI18nPreview?.[langKey] ? (
                  <div className="text-xs text-gray-500 dark:text-slate-400" dir={isRtl ? 'rtl' : 'ltr'}>
                    {nameI18nPreview[langKey]}
                  </div>
                ) : null}
              </div>
              <Input
                label={t('customers.phone')}
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+966501234567"
                data-tutorial="customer-form-phone"
                required
              />
            </div>

            {(nameTranslating || nameI18nPreview?.[langKey]) ? (
              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{t('common.translation', { defaultValue: 'Translation' })}</div>
                  {nameTranslating ? (
                    <div className="text-xs text-gray-500 dark:text-slate-400">{t('common.loading', { defaultValue: 'Loading...' })}</div>
                  ) : null}
                </div>
                {nameI18nPreview?.[langKey] ? (
                  <div className="mt-3 text-xs text-gray-700 dark:text-slate-200" dir={isRtl ? 'rtl' : 'ltr'}>
                    {nameI18nPreview[langKey] || ''}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Family Relations */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary-600" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-slate-200">Family Relations / العلاقات العائلية</h3>
              </div>
              
              {/* Add Relation */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <select
                  value={newRelation.customerId}
                  onChange={(e) => setNewRelation({ ...newRelation, customerId: e.target.value })}
                  className="flex-1 min-w-0 px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select existing customer...</option>
                  {allCustomers.filter(c => c._id !== id).map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.nameI18n?.[langKey] || customer.name} ({customer.phone})
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <select
                    value={newRelation.relationType}
                    onChange={(e) => setNewRelation({ ...newRelation, relationType: e.target.value })}
                    className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {RELATION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addRelation}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Relations List */}
              {formData.relations.length > 0 ? (
                <div className="space-y-2">
                  {formData.relations.map((relation) => (
                    <div key={relation.customerId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/40 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-slate-100">{relation.customerName}</span>
                        <span className="text-gray-500 dark:text-slate-400 text-sm mx-2">•</span>
                        <span className="text-sm text-gray-500 dark:text-slate-400">{relation.customerPhone}</span>
                        <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-200 text-xs rounded-full">
                          {RELATION_TYPES.find(t => t.value === relation.relationType)?.label || relation.relationType}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRelation(relation.customerId)}
                        className="p-1 text-gray-400 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-2">No family relations added</p>
              )}
            </div>

            {/* Measurements - Premium Visual UI */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-gray-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                {t('customers.measurements')} <span className="text-sm font-normal text-gray-400 dark:text-slate-500">(optional)</span>
              </h3>
              {measurementsCatalogLoading && (
                <div className="text-sm text-gray-500 dark:text-slate-400 mb-4">Loading…</div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {measurementFields.map((field) => (
                  <MeasurementCard
                    key={field.key}
                    measurementKey={field.key}
                    label={field.label}
                    value={formData.measurements[field.key]}
                    onChange={(value) => handleMeasurementChange(field.key, value)}
                    imageSrc={field.image ? `${resolveUploadsUrl(field.image)}${field.imageUpdatedAt ? `?v=${field.imageUpdatedAt}` : ''}` : undefined}
                  />
                ))}
              </div>
            </div>

            <Textarea
              label={t('customers.notes')}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={loading} className="flex-1" disabled={isDemo}>
                {isEdit ? t('common.save') : t('customers.createCustomer')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/user/customers')}>
                {t('common.cancel')}
              </Button>
            </div>

            <DemoBlockedModal
              isOpen={demoBlockedOpen}
              onClose={() => setDemoBlockedOpen(false)}
              title={t('demo.title', { defaultValue: 'Demo Mode' })}
              phone="+966596775485"
            />
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default CustomerForm;
