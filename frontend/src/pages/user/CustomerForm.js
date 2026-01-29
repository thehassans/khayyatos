import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
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
  const { t } = useTranslation();
  const { api } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '+966',
    notes: '',
    relations: [],
    measurements: {
      length: '',
      shoulderWidth: '',
      chest: '',
      sleeveLength: '',
      neck: '',
      wrist: '',
      expansion: '',
      armhole: ''
    }
  });
  const [newRelation, setNewRelation] = useState({ customerId: '', relationType: 'brother' });

  useEffect(() => {
    fetchAllCustomers();
    if (isEdit) fetchCustomer();
  }, [id]);

  const fetchAllCustomers = async () => {
    try {
      const response = await api.get('/customers');
      const data = response.data;
      setAllCustomers(Array.isArray(data) ? data : data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchCustomer = async () => {
    try {
      const response = await api.get(`/customers/${id}`);
      const customer = response.data.customer || response.data;
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '+966',
        notes: customer.notes || '',
        relations: customer.relations || [],
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
        customerName: customer.name,
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

  const measurementFields = [
    { key: 'length', label: t('measurements.length') },
    { key: 'shoulderWidth', label: t('measurements.shoulderWidth') },
    { key: 'chest', label: t('measurements.chest') },
    { key: 'sleeveLength', label: t('measurements.sleeveLength') },
    { key: 'neck', label: t('measurements.neck') },
    { key: 'wrist', label: t('measurements.wrist') },
    { key: 'expansion', label: t('measurements.expansion') },
    { key: 'armhole', label: t('measurements.armhole') }
  ];

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
              <Input
                label={t('customers.name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label={t('customers.phone')}
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+966501234567"
                required
              />
            </div>

            {/* Family Relations */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary-600" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-slate-200">Family Relations / العلاقات العائلية</h3>
              </div>
              
              {/* Add Relation */}
              <div className="flex gap-2 mb-4">
                <select
                  value={newRelation.customerId}
                  onChange={(e) => setNewRelation({ ...newRelation, customerId: e.target.value })}
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select existing customer...</option>
                  {allCustomers.filter(c => c._id !== id).map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} ({customer.phone})
                    </option>
                  ))}
                </select>
                <select
                  value={newRelation.relationType}
                  onChange={(e) => setNewRelation({ ...newRelation, relationType: e.target.value })}
                  className="px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {RELATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addRelation}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
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
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-gray-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                {t('customers.measurements')} <span className="text-sm font-normal text-gray-400 dark:text-slate-500">(optional)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {measurementFields.map((field) => (
                  <MeasurementCard
                    key={field.key}
                    measurementKey={field.key}
                    label={field.label}
                    value={formData.measurements[field.key]}
                    onChange={(value) => handleMeasurementChange(field.key, value)}
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
              <Button type="submit" loading={loading} className="flex-1">
                {isEdit ? t('common.save') : t('customers.createCustomer')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/user/customers')}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default CustomerForm;
