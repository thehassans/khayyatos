import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import { ArrowLeft, ChevronDown, Calendar, Printer, Users, Image as ImageIcon } from 'lucide-react';
import MeasurementCard from '../../components/ui/MeasurementCard';
import SARIcon from '../../components/ui/SARIcon';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending / قيد الانتظار', color: 'gray' },
  { value: 'stitching', label: 'Stitching / الخياطة', color: 'blue' },
  { value: 'finishing', label: 'Finishing / التشطيب', color: 'purple' },
  { value: 'laundry', label: 'Laundry / الغسيل', color: 'cyan' },
  { value: 'done', label: 'Done / جاهز', color: 'green' }
];

const THAWB_TYPES = [
  { value: 'saudi', label: 'Saudi', labelAr: 'سعودي', image: '/images/saudi.png' },
  { value: 'qatari', label: 'Qatari', labelAr: 'قطري', image: '/images/qatari.png' },
  { value: 'emirati', label: 'Emirati', labelAr: 'إماراتي', image: '/images/emirati.png' },
  { value: 'kuwaiti', label: 'Kuwaiti', labelAr: 'كويتي', image: '/images/kuwati.png' },
  { value: 'omani', label: 'Omani', labelAr: 'عماني', image: '/images/omani.png' },
  { value: 'bahraini', label: 'Bahraini', labelAr: 'بحريني', image: '/images/Bahrini.png' },
  { value: 'noum', label: 'Noum', labelAr: 'نوم', image: '/images/noum.png' }
];

const StitchingForm = () => {
  const { t, i18n } = useTranslation();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const printRef = useRef();

  const langKey = (i18n?.language || 'en').split('-')[0];

  const [loading, setLoading] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedRelation, setSelectedRelation] = useState(null);
  const [relationDropdownOpen, setRelationDropdownOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [styleCatalog, setStyleCatalog] = useState(null);
  const [styleCatalogLoading, setStyleCatalogLoading] = useState(false);
  const [measurementsCatalog, setMeasurementsCatalog] = useState(null);
  const [measurementsCatalogLoading, setMeasurementsCatalogLoading] = useState(false);
  const [thawbTypesCatalog, setThawbTypesCatalog] = useState(null);
  const [thawbTypesCatalogLoading, setThawbTypesCatalogLoading] = useState(false);
  const [fabricColorsCatalog, setFabricColorsCatalog] = useState(null);
  const [fabricColorsCatalogLoading, setFabricColorsCatalogLoading] = useState(false);
  const [selectedEmbroideryDesign, setSelectedEmbroideryDesign] = useState(null);
  const [formData, setFormData] = useState({
    quantity: 1,
    price: '',
    paidAmount: '',
    description: '',
    dueDate: '',
    status: 'pending',
    thawbType: 'saudi',
    fabricColor: '',
    measurements: {},
    styleOptions: {},
    embroideryDesignId: null
  });

  const filteredCustomers = allCustomers.filter(customer => {
    if (!customerSearch) return true;
    const search = customerSearch.toLowerCase();
    return customer.name?.toLowerCase().includes(search) || 
           customer.phone?.includes(search);
  });

  useEffect(() => {
    fetchAllCustomers();
    fetchStyleCatalog();
    fetchMeasurementsCatalog();
    fetchThawbTypesCatalog();
    fetchFabricColorsCatalog();
    if (isEdit) fetchStitching();
  }, [id]);

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
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    const preselectCustomer = async () => {
      if (isEdit) return;
      const customerId = searchParams.get('customerId');
      if (!customerId) return;
      if (selectedCustomer?._id === customerId) return;

      const fromList = (allCustomers || []).find((c) => c?._id === customerId);
      if (fromList) {
        setSelectedCustomer(fromList);
        setSelectedRelation(null);
        setFormData((prev) => ({
          ...prev,
          measurements: fromList.measurements || {}
        }));
        return;
      }

      try {
        const resp = await api.get(`/customers/${customerId}`);
        const fetched = resp.data?.customer || null;
        if (fetched) {
          setSelectedCustomer(fetched);
          setSelectedRelation(null);
          setFormData((prev) => ({
            ...prev,
            measurements: fetched.measurements || {}
          }));
        }
      } catch (e) {

      }
    };

    preselectCustomer();
  }, [api, allCustomers, isEdit, searchParams, selectedCustomer?._id]);

  useEffect(() => {
    const preselectEmbroideryDesign = async () => {
      if (isEdit) return;
      const designId = searchParams.get('embroideryDesignId');
      if (!designId) return;
      if (formData.embroideryDesignId === designId) return;

      try {
        const resp = await api.get(`/embroidery-designs/${designId}`);
        const fetched = resp.data?.design || null;
        if (fetched) {
          setSelectedEmbroideryDesign(fetched);
          setFormData((prev) => ({ ...prev, embroideryDesignId: fetched._id }));
        }
      } catch (e) {

      }
    };

    preselectEmbroideryDesign();
  }, [api, formData.embroideryDesignId, isEdit, searchParams]);

  const fetchStyleCatalog = async () => {
    try {
      setStyleCatalogLoading(true);
      const response = await api.get('/settings/style-options');
      setStyleCatalog(response.data?.catalog || null);
    } catch (error) {
      setStyleCatalog(null);
    }
    setStyleCatalogLoading(false);
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

  const fetchThawbTypesCatalog = async () => {
    try {
      setThawbTypesCatalogLoading(true);
      const response = await api.get('/settings/thawb-types-catalog');
      setThawbTypesCatalog(response.data?.catalog || null);
    } catch (error) {
      setThawbTypesCatalog(null);
    }
    setThawbTypesCatalogLoading(false);
  };

  const fetchFabricColorsCatalog = async () => {
    try {
      setFabricColorsCatalogLoading(true);
      const response = await api.get('/settings/fabric-colors-catalog');
      setFabricColorsCatalog(response.data?.catalog || null);
    } catch (error) {
      setFabricColorsCatalog(null);
    }
    setFabricColorsCatalogLoading(false);
  };

  const fetchStitching = async () => {
    try {
      const response = await api.get(`/stitchings/${id}`);
      const stitch = response.data.stitching || response.data;
      setSelectedCustomer(stitch.customerId);
      const designId = typeof stitch.embroideryDesignId === 'object' ? stitch.embroideryDesignId?._id : stitch.embroideryDesignId;
      const designSnap = stitch.embroideryDesign || {};
      setSelectedEmbroideryDesign(designId ? {
        _id: designId,
        name: designSnap.name || '',
        image: designSnap.image || null,
        imageUpdatedAt: designSnap.imageUpdatedAt || null
      } : null);
      setFormData({
        quantity: stitch.quantity,
        price: stitch.price || '',
        paidAmount: stitch.paidAmount || '',
        description: stitch.description || '',
        dueDate: stitch.dueDate ? new Date(stitch.dueDate).toISOString().split('T')[0] : '',
        status: stitch.status || 'pending',
        thawbType: stitch.thawbType || 'saudi',
        fabricColor: stitch.fabricColor || '',
        measurements: stitch.measurements || {},
        styleOptions: stitch.styleOptions || {},
        embroideryDesignId: designId || null
      });
    } catch (error) {
      toast.error('Failed to load');
      navigate('/user/stitchings');
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSelectedRelation(null); // Reset relation when customer changes
    setFormData({
      ...formData,
      measurements: customer.measurements || {}
    });
    setDropdownOpen(false);
  };

  const handleRelationSelect = (relation) => {
    setSelectedRelation(relation);
    // Load relation's measurements if available
    if (relation?.measurements) {
      setFormData({
        ...formData,
        measurements: relation.measurements
      });
    }
    setRelationDropdownOpen(false);
  };

  const clearRelation = () => {
    setSelectedRelation(null);
    // Restore customer's measurements
    setFormData({
      ...formData,
      measurements: selectedCustomer?.measurements || {}
    });
  };

  const handlePrintLabel = async () => {
    if (!createdOrder) return;
    
    const logoSrc = user?.logo && user.logo !== 'null' && user.logo !== 'undefined' ? user.logo : '';
    const trackUrl = `${window.location.origin}/track-order?id=${createdOrder._id}`;
    const labelLang = user?.labelLanguage || 'both';
    
    // Generate QR codes
    let qrCodeUrl = '';
    let zatcaQrUrl = '';
    const zatcaEnabled = user?.zatcaSettings?.enabled && user?.zatcaSettings?.showOnInvoice;
    
    try {
      qrCodeUrl = await QRCode.toDataURL(trackUrl, { width: 100, margin: 1 });
      
      if (zatcaEnabled && user?.zatcaSettings?.vatNumber) {
        const vatRate = 0.15;
        const total = parseFloat(formData.price) || 0;
        const vatAmount = (total * vatRate / (1 + vatRate)).toFixed(2);
        const timestamp = new Date().toISOString();
        
        const generateTLV = (fields) => {
          let result = [];
          fields.forEach(f => {
            const value = String(f.value);
            const valueBytes = new TextEncoder().encode(value);
            result.push(f.tag, valueBytes.length, ...valueBytes);
          });
          return btoa(String.fromCharCode(...result));
        };
        
        const tlvData = generateTLV([
          { tag: 1, value: user?.businessName || '' },
          { tag: 2, value: user?.zatcaSettings?.vatNumber || '' },
          { tag: 3, value: timestamp },
          { tag: 4, value: total.toFixed(2) },
          { tag: 5, value: vatAmount }
        ]);
        zatcaQrUrl = await QRCode.toDataURL(tlvData, { width: 100, margin: 1 });
      }
    } catch (err) {
      console.error('QR generation error:', err);
    }
    
    // Bilingual labels
    const labels = {
      customer: { en: 'Customer', ar: 'العميل' },
      phone: { en: 'Phone', ar: 'الهاتف' },
      quantity: { en: 'Quantity', ar: 'الكمية' },
      price: { en: 'Price', ar: 'السعر' },
      paid: { en: 'Paid', ar: 'المدفوع' },
      balance: { en: 'Balance', ar: 'المتبقي' },
      dueDate: { en: 'Due Date', ar: 'تاريخ التسليم' },
      status: { en: 'Status', ar: 'الحالة' },
      scanToTrack: { en: 'Scan to track order', ar: 'امسح لتتبع الطلب' }
    };
    
    const getLabel = (key) => {
      if (labelLang === 'en') return labels[key].en;
      if (labelLang === 'ar') return labels[key].ar;
      return `${labels[key].en} / ${labels[key].ar}`;
    };
    
    const statusLabels = {
      pending: { en: 'Pending', ar: 'قيد الانتظار' },
      stitching: { en: 'Stitching', ar: 'الخياطة' },
      finishing: { en: 'Finishing', ar: 'التشطيب' },
      laundry: { en: 'Laundry', ar: 'الغسيل' },
      done: { en: 'Done', ar: 'جاهز' }
    };
    
    const getStatus = () => {
      const status = formData.status || 'pending';
      const s = statusLabels[status] || statusLabels.pending;
      if (labelLang === 'en') return s.en;
      if (labelLang === 'ar') return s.ar;
      return `${s.en} / ${s.ar}`;
    };
    
    // SAR Icon SVG - Official Saudi Riyal Symbol
    const sarSvg = `<svg viewBox="0 0 1124.14 1256.39" width="14" height="14" style="display:inline;vertical-align:middle;margin:0 2px;" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" /><path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" /></svg>`;
    
    const isRTL = labelLang === 'ar';
    
    const printWindow = window.open('', '_blank', 'width=320,height=650');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <title>Order Label</title>
        <style>
          @page { size: 80mm auto; margin: 2mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; width: 76mm; padding: 3mm; font-size: 11px; direction: ${isRTL ? 'rtl' : 'ltr'}; }
          .header { text-align: center; margin-bottom: 8px; border-bottom: 2px dashed #333; padding-bottom: 10px; }
          .logo { width: 60px; height: 60px; object-fit: contain; margin: 0 auto 8px; display: block; border-radius: 8px; }
          .shop-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
          .shop-name-ar { font-size: 13px; font-weight: bold; direction: rtl; color: #333; }
          .shop-address { font-size: 9px; color: #666; margin-top: 4px; }
          .receipt-no { font-size: 16px; font-weight: bold; text-align: center; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ccc; }
          .label { color: #666; font-size: 10px; }
          .value { font-weight: 600; }
          .status { text-align: center; padding: 6px; background: #f0f0f0; border-radius: 4px; margin: 8px 0; font-weight: bold; }
          .no-logo { width: 60px; height: 60px; background: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #6b7280; font-size: 24px; margin: 0 auto 8px; }
          .qr-container { display: flex; justify-content: center; gap: 16px; margin-top: 12px; padding-top: 12px; border-top: 2px dashed #333; }
          .qr-box { flex: 1; text-align: center; max-width: 100px; }
          .qr-box img { width: 70px; height: 70px; border: 2px solid #e5e7eb; border-radius: 8px; padding: 4px; background: #fff; }
          .qr-label { font-size: 8px; color: #374151; margin-top: 6px; font-weight: 600; line-height: 1.2; }
          .qr-sublabel { font-size: 7px; color: #6b7280; margin-top: 2px; }
          .single-qr { text-align: center; margin-top: 12px; padding-top: 12px; border-top: 2px dashed #333; }
          .single-qr img { width: 80px; height: 80px; border: 2px solid #e5e7eb; border-radius: 8px; padding: 4px; background: #fff; }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoSrc ? `<img src="${logoSrc}" class="logo" onerror="this.outerHTML='<div class=no-logo>${(user?.businessName || 'T').charAt(0)}</div>'" />` : `<div class="no-logo">${(user?.businessName || 'T').charAt(0)}</div>`}
          <div class="shop-name">${user?.businessName || 'Tailor Shop'}</div>
          ${user?.businessNameAr ? `<div class="shop-name-ar">${user.businessNameAr}</div>` : ''}
          ${user?.businessAddress ? `<div class="shop-address">${user.businessAddress}</div>` : ''}
        </div>
        <div class="receipt-no">#${createdOrder.receiptNumber || createdOrder._id?.slice(-6)}</div>
        <div class="row"><span class="label">${getLabel('customer')}:</span><span class="value">${selectedCustomer?.name || '-'}</span></div>
        <div class="row"><span class="label">${getLabel('phone')}:</span><span class="value">${selectedCustomer?.phone || '-'}</span></div>
        <div class="row"><span class="label">${getLabel('quantity')}:</span><span class="value">${formData.quantity}</span></div>
        <div class="row"><span class="label">${getLabel('price')}:</span><span class="value">${formData.price || 0} ${sarSvg}</span></div>
        <div class="row"><span class="label">${getLabel('paid')}:</span><span class="value">${formData.paidAmount || 0} ${sarSvg}</span></div>
        <div class="row"><span class="label">${getLabel('balance')}:</span><span class="value">${(formData.price || 0) - (formData.paidAmount || 0)} ${sarSvg}</span></div>
        <div class="row"><span class="label">${getLabel('dueDate')}:</span><span class="value">${formData.dueDate || '-'}</span></div>
        <div class="status">${getLabel('status')}: ${getStatus()}</div>
        ${zatcaQrUrl && qrCodeUrl ? `
        <div class="qr-container">
          <div class="qr-box">
            <img src="${zatcaQrUrl}" alt="ZATCA QR" />
            <div class="qr-label">ZATCA</div>
            <div class="qr-sublabel">فاتورة إلكترونية</div>
          </div>
          <div class="qr-box">
            <img src="${qrCodeUrl}" alt="Track QR" />
            <div class="qr-label">Track Order</div>
            <div class="qr-sublabel">تتبع الطلب</div>
          </div>
        </div>
        ` : qrCodeUrl ? `
        <div class="single-qr">
          <img src="${qrCodeUrl}" alt="QR Code" />
          <div class="qr-label" style="font-size: 9px; margin-top: 6px;">${getLabel('scanToTrack')}</div>
        </div>
        ` : ''}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
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

  const handleStyleOptionChange = (group, value) => {
    setFormData({
      ...formData,
      styleOptions: {
        ...(formData.styleOptions || {}),
        [group]: value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error('Select a customer');
      return;
    }
    setLoading(true);

    try {
      const data = {
        customerId: selectedCustomer._id,
        customerName: selectedCustomer.name,
        relationId: selectedRelation?._id || null,
        relationName: selectedRelation?.name || null,
        relationType: selectedRelation?.type || null,
        orderFor: selectedRelation ? selectedRelation.name : selectedCustomer.name,
        quantity: formData.quantity,
        price: parseFloat(formData.price) || 0,
        paidAmount: parseFloat(formData.paidAmount) || 0,
        description: formData.description,
        dueDate: formData.dueDate,
        status: formData.status,
        thawbType: formData.thawbType,
        fabricColor: formData.fabricColor || null,
        measurements: formData.measurements,
        styleOptions: formData.styleOptions,
        embroideryDesignId: formData.embroideryDesignId || null
      };

      if (isEdit) {
        await api.put(`/stitchings/${id}`, data);
        toast.success('Updated');
        navigate('/user/stitchings');
      } else {
        const response = await api.post('/stitchings', data);
        const order = response.data?.stitching || response.data;
        setCreatedOrder(order);
        toast.success('Order created! You can print the label now.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
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

  const fallbackThawbTypes = THAWB_TYPES.map((t) => ({
    key: t.value,
    name: '',
    enabled: true,
    sortOrder: 0,
    image: null,
    imageUpdatedAt: null,
    fallbackImage: t.image,
    fallbackLabel: t.label,
    fallbackLabelAr: t.labelAr
  }));

  const thawbTypes = thawbTypesCatalog?.types?.length
    ? thawbTypesCatalog.types
        .filter((x) => x && x.enabled !== false)
        .slice()
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((x) => {
          const fallback = THAWB_TYPES.find((t) => t.value === x.key);
          return {
            key: x.key,
            name: x.name || '',
            nameI18n: x.nameI18n || {},
            image: x.image,
            imageUpdatedAt: x.imageUpdatedAt,
            fallbackImage: fallback?.image,
            fallbackLabel: fallback?.label,
            fallbackLabelAr: fallback?.labelAr
          };
        })
    : fallbackThawbTypes;

  const fallbackFabricColors = [
    { key: 'white', name: 'White', nameAr: 'أبيض', hex: '#FFFFFF' },
    { key: 'cream', name: 'Cream', nameAr: 'كريمي', hex: '#FFFDD0' },
    { key: 'offwhite', name: 'Off White', nameAr: 'أوف وايت', hex: '#FAF9F6' },
    { key: 'beige', name: 'Beige', nameAr: 'بيج', hex: '#F5F5DC' },
    { key: 'grey', name: 'Grey', nameAr: 'رمادي', hex: '#808080' },
    { key: 'black', name: 'Black', nameAr: 'أسود', hex: '#000000' },
    { key: 'navy', name: 'Navy', nameAr: 'كحلي', hex: '#000080' },
    { key: 'brown', name: 'Brown', nameAr: 'بني', hex: '#8B4513' }
  ];

  const fabricColors = fabricColorsCatalog?.colors?.length
    ? fabricColorsCatalog.colors
        .filter((c) => c && c.enabled !== false)
        .slice()
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((c) => {
          const fallback = fallbackFabricColors.find((x) => x.key === c.key);
          return {
            key: c.key,
            name: c.nameI18n?.[langKey] || c.name || fallback?.name || c.key,
            nameAr: fallback?.nameAr || '',
            hex: c.hex || fallback?.hex || '#e5e7eb'
          };
        })
    : fallbackFabricColors;

  // If order created, show print option
  if (createdOrder) {
    return (
      <div className="max-w-md mx-auto space-y-6 animate-fadeIn">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Order Created!</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">Receipt #{createdOrder.receiptNumber || createdOrder._id?.slice(-6)}</p>
          
          <div className="space-y-3">
            <Button onClick={handlePrintLabel} icon={Printer} className="w-full">
              Print Label (80mm)
            </Button>
            <Button variant="outline" onClick={() => navigate('/user/stitchings')} className="w-full">
              Back to Orders
            </Button>
            <Button variant="secondary" onClick={() => { setCreatedOrder(null); setSelectedCustomer(null); setSelectedRelation(null); setSelectedEmbroideryDesign(null); setCustomerSearch(''); setFormData({ quantity: 1, price: '', paidAmount: '', description: '', dueDate: '', status: 'pending', thawbType: 'saudi', fabricColor: '', measurements: {}, styleOptions: {}, embroideryDesignId: null }); }} className="w-full">
              Create Another Order
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/user/stitchings')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 dark:text-slate-300 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          {isEdit ? t('stitchings.editOrder') : t('stitchings.createOrder')}
        </h1>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                {t('stitchings.customer')} *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 hover:bg-gray-100 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {selectedCustomer ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 dark:text-primary-200 font-medium text-sm">{selectedCustomer.name?.charAt(0)}</span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedCustomer.name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-slate-400">Select customer...</span>
                  )}
                  <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 z-50">
                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-100 dark:border-slate-700">
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Search by name or phone..."
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <button
                            key={customer._id}
                            type="button"
                            onClick={() => { handleCustomerSelect(customer); setCustomerSearch(''); }}
                            className={`w-full p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center gap-3 text-left transition-colors ${
                              selectedCustomer?._id === customer._id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                            }`}
                          >
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                              <span className="text-primary-700 dark:text-primary-200 font-medium">{customer.name?.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-slate-100">{customer.name}</p>
                              <p className="text-sm text-gray-500 dark:text-slate-400">{customer.phone}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 dark:text-slate-400">No customers found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedEmbroideryDesign ? (
              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('embroideryDesigns.title', { defaultValue: 'Embroidery Designs' })}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{t('embroideryDesigns.preview', { defaultValue: 'Preview' })}</p>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/user/embroidery-designs')}>
                    {t('embroideryDesigns.title', { defaultValue: 'Embroidery Designs' })}
                  </Button>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 p-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                    {selectedEmbroideryDesign?.image ? (
                      <img
                        src={`${resolveUploadsUrl(selectedEmbroideryDesign.image)}${selectedEmbroideryDesign.imageUpdatedAt ? `?v=${selectedEmbroideryDesign.imageUpdatedAt}` : ''}`}
                        alt={selectedEmbroideryDesign?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{selectedEmbroideryDesign?.name || '—'}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{t('embroideryDesigns.designName', { defaultValue: 'Design Name' })}</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-gray-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('styleOptions.title')}</h3>
              </div>

              <div className="space-y-5">
                {styleCatalogLoading ? (
                  <div className="text-sm text-gray-500 dark:text-slate-400">Loading…</div>
                ) : (
                  ((styleCatalog?.groups?.length ? styleCatalog.groups : [
                    { key: 'collar', name: '', enabled: true, sortOrder: 0, options: [ { key: 'classic', name: '' }, { key: 'round', name: '' }, { key: 'mandarin', name: '' }, { key: 'open', name: '' } ] },
                    { key: 'bain', name: '', enabled: true, sortOrder: 1, options: [ { key: 'hidden', name: '' }, { key: 'visible', name: '' }, { key: 'zip', name: '' }, { key: 'half', name: '' } ] },
                    { key: 'cuff', name: '', enabled: true, sortOrder: 2, options: [ { key: 'single', name: '' }, { key: 'double', name: '' }, { key: 'round', name: '' }, { key: 'angled', name: '' } ] },
                    { key: 'pocket', name: '', enabled: true, sortOrder: 3, options: [ { key: 'none', name: '' }, { key: 'chest', name: '' }, { key: 'side', name: '' }, { key: 'both', name: '' } ] },
                    { key: 'buttons', name: '', enabled: true, sortOrder: 4, options: [ { key: 'classic', name: '' }, { key: 'hidden', name: '' }, { key: 'snap', name: '' }, { key: 'premium', name: '' } ] },
                    { key: 'embroidery', name: '', enabled: true, sortOrder: 5, options: [ { key: 'none', name: '' }, { key: 'name', name: '' }, { key: 'logo', name: '' }, { key: 'premium', name: '' } ] }
                  ]))
                    .filter((g) => g && g.enabled !== false)
                    .slice()
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map((group) => {
                      const groupTitle = group.nameI18n?.[langKey] || group.name || t(`styleOptions.${group.key}`, { defaultValue: group.key });
                      return (
                        <div key={group.key}>
                          <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-slate-200">{groupTitle}</div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(group.options || [])
                              .filter((o) => o && o.enabled !== false)
                              .slice()
                              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                              .map((opt) => {
                                const selected = (formData.styleOptions || {})[group.key] === opt.key;
                                const fallbackBase = `/images/style/${group.key}/${opt.key}`;

                                const uploadUrl = opt.image ? resolveUploadsUrl(opt.image) : null;
                                const imgSrc = uploadUrl
                                  ? `${uploadUrl}${opt.imageUpdatedAt ? `?v=${opt.imageUpdatedAt}` : ''}`
                                  : `${fallbackBase}.webp`;

                                const label = opt.nameI18n?.[langKey] || opt.name || t(`styleOptions.options.${group.key}.${opt.key}`, { defaultValue: opt.key });

                                return (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => handleStyleOptionChange(group.key, opt.key)}
                                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
                                      selected
                                        ? 'border-primary-500 ring-2 ring-primary-500 bg-primary-50/70 dark:bg-primary-900/20'
                                        : 'border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                                  >
                                    <div className="p-3">
                                      <div className="relative h-20 w-full rounded-xl bg-gradient-to-br from-gray-100 to-white dark:from-slate-800 dark:to-slate-900 overflow-hidden">
                                        <img
                                          src={imgSrc}
                                          alt={label}
                                          className="absolute inset-0 w-full h-full object-cover"
                                          onError={(e) => {
                                            const src = e.currentTarget.src || '';
                                            if (!uploadUrl && src.endsWith('.webp')) {
                                              e.currentTarget.src = `${fallbackBase}.png`;
                                              return;
                                            }
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-slate-600 pointer-events-none">
                                          <svg viewBox="0 0 64 64" fill="currentColor" className="w-10 h-10 opacity-80">
                                            <path d="M14 18h36v28H14z" opacity="0.35" />
                                            <path d="M20 26h24v4H20z" />
                                            <path d="M20 34h16v4H20z" opacity="0.8" />
                                          </svg>
                                        </div>
                                      </div>
                                      <div className="mt-3 text-center">
                                        <div className={`text-sm font-semibold ${selected ? 'text-primary-700 dark:text-primary-200' : 'text-gray-800 dark:text-slate-100'}`}>{label}</div>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Order For - Relation/Sibling Selector */}
            {selectedCustomer && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <label className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Order For (Son / Brother / Relation)
                  </label>
                </div>
                
                {selectedRelation ? (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                        <span className="text-amber-700 dark:text-amber-200 font-medium">{selectedRelation.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedRelation.name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{selectedRelation.type}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearRelation}
                      className="text-sm text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Use Customer Instead
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setRelationDropdownOpen(!relationDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                    >
                      <span className="text-gray-600 dark:text-slate-300">
                        For {selectedCustomer.name} (Main Customer)
                      </span>
                      <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform ${relationDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {relationDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-amber-200 dark:border-amber-700 z-50 max-h-48 overflow-y-auto">
                        {selectedCustomer.relations && selectedCustomer.relations.length > 0 ? (
                          selectedCustomer.relations.map((relation, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleRelationSelect(relation)}
                              className="w-full p-3 hover:bg-amber-50 dark:hover:bg-amber-900/30 flex items-center gap-3 text-left transition-colors border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                            >
                              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                                <span className="text-amber-700 dark:text-amber-200 font-medium text-sm">{relation.name?.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-slate-100">{relation.name}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{relation.type}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500 dark:text-slate-400 text-sm">
                            No relations added for this customer.
                            <br />
                            <span className="text-xs">Add relations in Customer edit page</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Thawb Type Selector */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 p-5">
              <label className="block text-sm font-semibold text-gray-800 dark:text-slate-100 mb-4">
                {t('thawbTypes.title')} / نوع الثوب *
              </label>
              {thawbTypesCatalogLoading && (
                <div className="text-sm text-gray-500 dark:text-slate-400 mb-4">Loading…</div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {thawbTypes.map((thawb) => {
                  const isSelected = formData.thawbType === thawb.key;
                  const uploadUrl = thawb.image ? resolveUploadsUrl(thawb.image) : null;
                  const thawbImage = uploadUrl
                    ? `${uploadUrl}${thawb.imageUpdatedAt ? `?v=${thawb.imageUpdatedAt}` : ''}`
                    : (thawb.fallbackImage || '');
                  const title = thawb.name || t(`thawbTypes.${thawb.key}`, { defaultValue: thawb.fallbackLabel || thawb.key });
                  const subtitle = thawb.fallbackLabelAr || '';
                  return (
                    <button
                      key={thawb.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, thawbType: thawb.key })}
                      className={`relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-500 shadow-md' 
                          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-500'
                      }`}
                    >
                      {/* Thawb Image */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-24 sm:w-20 sm:h-28 relative overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-700">
                          <img 
                            src={thawbImage}
                            alt={title}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          {/* Fallback icon if image not found */}
                          <div className="absolute inset-0 items-center justify-center text-gray-400 dark:text-slate-500 hidden">
                            <svg viewBox="0 0 40 60" fill="currentColor" className="w-10 h-14">
                              <path d="M20 0 L8 8 L8 20 L4 20 L4 26 L8 26 L8 58 L16 58 L16 40 L24 40 L24 58 L32 58 L32 26 L36 26 L36 20 L32 20 L32 8 Z" opacity="0.9"/>
                              <circle cx="20" cy="12" r="3" fill="currentColor" opacity="0.6"/>
                            </svg>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className={`text-sm font-semibold ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-slate-200'}`}>
                            {title}
                          </p>
                          {subtitle ? (
                            <p className={`text-xs ${isSelected ? 'text-amber-500 dark:text-amber-300' : 'text-gray-500 dark:text-slate-400'}`}>
                              {subtitle}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {/* Selected checkmark */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fabric Color Selector (Optional) */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-800 dark:text-slate-100">
                  Fabric Color / لون القماش
                </label>
                <span className="text-xs text-gray-400 dark:text-slate-500">(Optional)</span>
              </div>
              {fabricColorsCatalogLoading && (
                <div className="text-sm text-gray-500 dark:text-slate-400 mb-4">Loading…</div>
              )}
              <div className="flex flex-wrap gap-3">
                {/* No color option */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, fabricColor: '' })}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    !formData.fabricColor
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-gray-300'
                  }`}
                >
                  Not specified
                </button>
                {fabricColors.map((color) => {
                  const isSelected = formData.fabricColor === color.key;
                  return (
                    <button
                      key={color.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, fabricColor: color.key })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500'
                          : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-gray-300 dark:border-slate-500"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className={`text-sm font-medium ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-slate-200'}`}>
                        {color.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price and Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">{t('stitchings.quantity')}</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2 flex items-center gap-1">{t('stitchings.price')} <SARIcon className="w-4 h-4" /></label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2 flex items-center gap-1">{t('stitchings.paidAmount')} <SARIcon className="w-4 h-4" /></label>
                <input
                  type="number"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Due Date - Premium Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">{t('stitchings.dueDate')}</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-400" />
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Measurements - Premium Visual UI */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-gray-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('customers.measurements')}</h3>
                {selectedRelation?.measurements && Object.keys(selectedRelation.measurements).length > 0 ? (
                  <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
                    ✓ Auto-filled from {selectedRelation.name}
                  </span>
                ) : selectedCustomer?.measurements && Object.keys(selectedCustomer.measurements).length > 0 && (
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">
                    ✓ Auto-filled from customer
                  </span>
                )}
              </div>
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
              label={t('stitchings.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" variant={isEdit ? 'primary' : 'success'} loading={loading} className="flex-1">
                {isEdit ? t('common.save') : t('stitchings.createOrder')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/user/stitchings')}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default StitchingForm;
