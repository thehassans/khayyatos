import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import DemoBlockedModal from '../../components/ui/DemoBlockedModal';
import { ArrowLeft, ChevronDown, Calendar, Printer, Users, Image as ImageIcon, Plus, UserPlus, Search, User, X } from 'lucide-react';
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

const RELATION_TYPES = [
  { value: 'father', label: 'Father / الأب' },
  { value: 'son', label: 'Son / الابن' },
  { value: 'brother', label: 'Brother / الأخ' },
  { value: 'uncle', label: 'Uncle / العم' },
  { value: 'cousin', label: 'Cousin / ابن العم' },
  { value: 'friend', label: 'Friend / صديق' },
  { value: 'other', label: 'Other / آخر' }
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

  const isDemo = !!user?.isDemoSession;
  const [demoBlockedOpen, setDemoBlockedOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedRelation, setSelectedRelation] = useState(null);
  const selectedRelationIdRef = useRef(null);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [createdOrders, setCreatedOrders] = useState([]);
  const [customerDetailsLoading, setCustomerDetailsLoading] = useState(false);
  const [customerMeasurementsOpen, setCustomerMeasurementsOpen] = useState(true);
  const [orderForMeasurementsOpen, setOrderForMeasurementsOpen] = useState(false);
  const [orderForDetailsLoading, setOrderForDetailsLoading] = useState(false);
  const [styleCatalog, setStyleCatalog] = useState(null);
  const [styleCatalogLoading, setStyleCatalogLoading] = useState(false);
  const [styleOptionsOpen, setStyleOptionsOpen] = useState(false);
  const [measurementsCatalog, setMeasurementsCatalog] = useState(null);
  const [measurementsCatalogLoading, setMeasurementsCatalogLoading] = useState(false);
  const [thawbTypesCatalog, setThawbTypesCatalog] = useState(null);
  const [thawbTypesCatalogLoading, setThawbTypesCatalogLoading] = useState(false);
  const [fabricColorsCatalog, setFabricColorsCatalog] = useState(null);
  const [fabricColorsCatalogLoading, setFabricColorsCatalogLoading] = useState(false);
  const [fabrics, setFabrics] = useState([]);
  const [fabricsLoading, setFabricsLoading] = useState(false);
  const [selectedEmbroideryDesign, setSelectedEmbroideryDesign] = useState(null);

  const [orderItems, setOrderItems] = useState([]);
  const [familyControlsOpen, setFamilyControlsOpen] = useState(true);
  const [expandedOrderItemId, setExpandedOrderItemId] = useState(null);
  const autoExpandAfterRemoveRef = useRef(false);

  const [addFamilyOpen, setAddFamilyOpen] = useState(false);
  const [addFamilyType, setAddFamilyType] = useState('son');
  const [familyQuery, setFamilyQuery] = useState('');
  const [familySearching, setFamilySearching] = useState(false);
  const [familyResults, setFamilyResults] = useState([]);
  const [familySelected, setFamilySelected] = useState(null);
  const [familySaving, setFamilySaving] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyPhone, setNewFamilyPhone] = useState('');
  const [formData, setFormData] = useState({
    quantity: 1,
    price: '',
    paidAmount: '',
    description: '',
    dueDate: '',
    status: 'pending',
    thawbType: 'saudi',
    fabricColor: '',
    fabricId: '',
    rollsUsed: '',
    measurements: {},
    styleOptions: {},
    embroideryDesignId: null
  });

  const filteredCustomers = allCustomers.filter(customer => {
    if (!customerSearch) return true;
    const search = customerSearch.toLowerCase();
    return (customer.nameI18n?.[langKey] || customer.name || '')?.toLowerCase().includes(search) || 
           customer.phone?.includes(search);
  });

  useEffect(() => {
    fetchAllCustomers();
    fetchStyleCatalog();
    fetchMeasurementsCatalog();
    fetchThawbTypesCatalog();
    fetchFabricColorsCatalog();
    fetchFabrics();
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

  const loadCustomerDetails = useCallback(async (customerId) => {
    if (!customerId) return;
    try {
      setCustomerDetailsLoading(true);
      const resp = await api.get(`/customers/${customerId}`);
      const fetched = resp.data?.customer || null;
      if (!fetched) return;
      setSelectedCustomer(fetched);
      setSelectedRelation(null);
      selectedRelationIdRef.current = null;
      setCustomerMeasurementsOpen(true);
      setOrderForMeasurementsOpen(false);
      setFormData((prev) => ({
        ...prev,
        measurements: fetched.measurements || {}
      }));
      return fetched;
    } catch (e) {

    } finally {
      setCustomerDetailsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const preselectCustomer = async () => {
      if (isEdit) return;
      const customerId = searchParams.get('customerId');
      if (!customerId) return;
      if (selectedCustomer?._id === customerId) return;

      const fromList = (allCustomers || []).find((c) => c?._id === customerId);
      if (fromList) {
        await loadCustomerDetails(fromList._id);
        return;
      }

      try {
        await loadCustomerDetails(customerId);
      } catch (e) {

      }
    };

    preselectCustomer();
  }, [allCustomers, isEdit, loadCustomerDetails, searchParams, selectedCustomer?._id]);

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

  const fetchFabrics = async () => {
    try {
      setFabricsLoading(true);
      const res = await api.get('/fabrics');
      setFabrics(Array.isArray(res.data?.fabrics) ? res.data.fabrics : []);
    } catch (e) {
      setFabrics([]);
    }
    setFabricsLoading(false);
  };

  const fetchStitching = async () => {
    try {
      const response = await api.get(`/stitchings/${id}`);
      const stitch = response.data.stitching || response.data;
      const customerIdToLoad = typeof stitch.customerId === 'object' ? stitch.customerId?._id : stitch.customerId;
      setSelectedCustomer(stitch.customerId);
      if (customerIdToLoad) {
        try {
          const custResp = await api.get(`/customers/${customerIdToLoad}`);
          const fetched = custResp.data?.customer || null;
          if (fetched) setSelectedCustomer(fetched);
        } catch (e) {

        }
      }
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
        fabricId: (typeof stitch.fabricId === 'object' ? stitch.fabricId?._id : stitch.fabricId) || '',
        rollsUsed: (stitch.rollsUsed !== undefined && stitch.rollsUsed !== null) ? String(stitch.rollsUsed) : '',
        measurements: stitch.measurements || {},
        styleOptions: stitch.styleOptions || {},
        embroideryDesignId: designId || null
      });

      const relId = typeof stitch.relationId === 'object' ? stitch.relationId?._id : stitch.relationId;
      if (relId) {
        setSelectedRelation({
          _id: relId,
          name: stitch.relationName || stitch.relationId?.nameI18n?.[langKey] || stitch.relationId?.name || '',
          phone: stitch.relationId?.phone || '',
          type: stitch.relationType || '',
          measurements: stitch.measurements || {},
          raw: null
        });
        selectedRelationIdRef.current = String(relId);
        setCustomerMeasurementsOpen(false);
        setOrderForMeasurementsOpen(true);
      } else {
        setSelectedRelation(null);
        selectedRelationIdRef.current = null;
        setCustomerMeasurementsOpen(true);
        setOrderForMeasurementsOpen(false);
      }
    } catch (error) {
      toast.error('Failed to load');
      navigate('/user/stitchings');
    }
  };

  const handleCustomerSelect = async (customer) => {
    setDropdownOpen(false);
    setOrderItems([]);
    setFamilyControlsOpen(true);
    setExpandedOrderItemId(null);
    await loadCustomerDetails(customer?._id);
  };

  const normalizeRelationForUi = (rel) => {
    const ref = rel?.customerId && typeof rel.customerId === 'object' ? rel.customerId : null;
    const id = ref?._id || rel?.customerId || rel?._id || null;
    const type = rel?.relationType || rel?.type || '';
    const name = ref?.nameI18n?.[langKey] || ref?.name || rel?.customerName || rel?.name || '';
    const phone = ref?.phone || rel?.customerPhone || rel?.phone || '';
    const measurements = ref?.measurements || rel?.measurements || {};

    return {
      _id: id,
      name,
      phone,
      type,
      measurements,
      raw: rel
    };
  };

  const normalizeRelationForSave = (rel) => {
    const ref = rel?.customerId && typeof rel.customerId === 'object' ? rel.customerId : null;
    const id = ref?._id || rel?.customerId || rel?._id || null;
    const relationType = rel?.relationType || rel?.type || '';
    const customerName = ref?.nameI18n?.[langKey] || ref?.name || rel?.customerName || rel?.name || '';
    const customerPhone = ref?.phone || rel?.customerPhone || rel?.phone || '';
    return {
      customerId: id,
      customerName,
      customerPhone,
      relationType
    };
  };

  const openAddFamily = (prefillType = 'son') => {
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    setAddFamilyType(prefillType);
    setFamilyQuery('');
    setFamilySearching(false);
    setFamilyResults([]);
    setFamilySelected(null);
    setNewFamilyName('');
    setNewFamilyPhone('');
    setAddFamilyOpen(true);
  };

  useEffect(() => {
    if (!addFamilyOpen) return;

    const q = String(familyQuery || '').trim();
    if (!q) {
      setFamilyResults([]);
      setFamilySearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setFamilySearching(true);
        const resp = await api.get(`/customers/search?q=${encodeURIComponent(q)}`);
        const list = Array.isArray(resp.data?.customers)
          ? resp.data.customers
          : Array.isArray(resp.data)
            ? resp.data
            : [];
        const existingIds = new Set((selectedCustomer?.relations || []).map((r) => String(normalizeRelationForSave(r)?.customerId || '')));
        const filtered = list.filter((c) => String(c?._id) !== String(selectedCustomer?._id) && !existingIds.has(String(c?._id)));
        setFamilyResults(filtered);
      } catch (e) {
        setFamilyResults([]);
      }
      setFamilySearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [addFamilyOpen, api, familyQuery, selectedCustomer?._id, selectedCustomer?.relations]);

  const saveFamilyMember = async () => {
    if (!selectedCustomer?._id) return;
    if (!addFamilyType) return;
    if (familySaving) return;

    try {
      setFamilySaving(true);

      let target = familySelected;

      if (!target?._id) {
        const nm = String(newFamilyName || '').trim();
        const ph = String(newFamilyPhone || '').trim();
        if (!nm || !ph) {
          toast.error('Enter name and phone');
          setFamilySaving(false);
          return;
        }
        const created = await api.post('/customers', { name: nm, phone: ph });
        target = created.data?.customer || created.data;
      }

      if (!target?._id) {
        toast.error('Select a customer');
        setFamilySaving(false);
        return;
      }

      const next = (selectedCustomer?.relations || [])
        .map(normalizeRelationForSave)
        .filter((r) => r?.customerId);
      next.push({
        customerId: target._id,
        customerName: target?.nameI18n?.[langKey] || target?.name || '',
        customerPhone: target?.phone || '',
        relationType: addFamilyType
      });

      await api.put(`/customers/${selectedCustomer._id}`, { relations: next });
      setAddFamilyOpen(false);

      await loadCustomerDetails(selectedCustomer._id);
      handleRelationSelect({ customerId: target, relationType: addFamilyType });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Operation failed');
    }

    setFamilySaving(false);
  };

  const loadOrderForMeasurements = useCallback(async (relationCustomerId) => {
    if (!relationCustomerId) return {};
    try {
      setOrderForDetailsLoading(true);
      const resp = await api.get(`/customers/${relationCustomerId}`);
      const fetched = resp.data?.customer || null;
      return fetched?.measurements || {};
    } catch (e) {
      return {};
    } finally {
      setOrderForDetailsLoading(false);
    }
  }, [api]);

  const handleRelationSelect = (relation) => {
    const normalized = normalizeRelationForUi(relation);
    setSelectedRelation(normalized);
    selectedRelationIdRef.current = normalized?._id ? String(normalized._id) : null;
    setCustomerMeasurementsOpen(false);
    setOrderForMeasurementsOpen(true);
    setFormData((prev) => ({
      ...prev,
      measurements: normalized.measurements || {}
    }));
    if (normalized?._id) {
      loadOrderForMeasurements(normalized._id).then((m) => {
        if (String(selectedRelationIdRef.current || '') !== String(normalized._id)) return;
        if (m && Object.keys(m).length > 0) {
          setSelectedRelation((p) => {
            if (!p) return p;
            if (String(p._id) !== String(normalized._id)) return p;
            return { ...p, measurements: m };
          });
          setFormData((prev) => ({ ...prev, measurements: m }));
        }
      });
    }
  };

  const clearRelation = () => {
    setSelectedRelation(null);
    selectedRelationIdRef.current = null;
    setCustomerMeasurementsOpen(true);
    setOrderForMeasurementsOpen(false);
    // Restore customer's measurements
    setFormData((prev) => ({
      ...prev,
      measurements: selectedCustomer?.measurements || {}
    }));
  };

  const addCurrentToOrder = () => {
    if (!selectedCustomer?._id) return;

    const isSelf = !selectedRelation;
    const personKey = isSelf ? 'self' : String(selectedRelation?._id || '');
    const personName = isSelf
      ? (selectedCustomer?.nameI18n?.[langKey] || selectedCustomer?.name || '')
      : (selectedRelation?.name || '');

    if (!personName || !personKey) return;

    const measurementsSnap = { ...(formData.measurements || {}) };
    const newId = `${personKey}-${Date.now()}`;

    const existing = orderItems.find((x) => String(x.personKey) === String(personKey));
    setExpandedOrderItemId(existing?.id || newId);

    setOrderItems((prev) => {
      const idx = prev.findIndex((x) => String(x.personKey) === String(personKey));
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = {
          ...next[idx],
          quantity: (Number(next[idx]?.quantity) || 1) + 1
        };
        return next;
      }
      return prev.concat({
        id: newId,
        personKey,
        relationId: isSelf ? null : (selectedRelation?._id || null),
        relationName: isSelf ? null : (selectedRelation?.name || null),
        relationType: isSelf ? null : (selectedRelation?.type || null),
        orderFor: personName,
        quantity: 1,
        price: '',
        paidAmount: '',
        measurements: measurementsSnap
      });
    });

    setFamilyControlsOpen(false);
  };

  const updateOrderItem = (id, patch) => {
    setOrderItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const removeOrderItem = (id) => {
    if (String(expandedOrderItemId || '') === String(id)) {
      autoExpandAfterRemoveRef.current = true;
      setExpandedOrderItemId(null);
    }
    setOrderItems((prev) => prev.filter((x) => x.id !== id));
  };

  useEffect(() => {
    if (orderItems.length === 0) {
      if (expandedOrderItemId !== null) setExpandedOrderItemId(null);
      autoExpandAfterRemoveRef.current = false;
      return;
    }
    if (expandedOrderItemId === null) {
      if (autoExpandAfterRemoveRef.current) {
        autoExpandAfterRemoveRef.current = false;
        setExpandedOrderItemId(orderItems[orderItems.length - 1]?.id || null);
      }
      return;
    }
    if (orderItems.some((x) => String(x.id) === String(expandedOrderItemId))) return;
    setExpandedOrderItemId(orderItems[orderItems.length - 1]?.id || null);
  }, [orderItems, expandedOrderItemId]);

  const computeAllocations = (items, field, overrideTotal) => {
    const explicit = new Map();
    let sumExplicit = 0;
    let sumQtyEmpty = 0;

    items.forEach((it) => {
      const v = String(it?.[field] ?? '').trim();
      if (v === '') {
        sumQtyEmpty += Number(it?.quantity) || 0;
        return;
      }
      const num = Number(v);
      if (!Number.isFinite(num) || num < 0) {
        sumQtyEmpty += Number(it?.quantity) || 0;
        return;
      }
      explicit.set(it.id, num);
      sumExplicit += num;
    });

    const total = overrideTotal;
    if (total === null) {
      const map = new Map();
      items.forEach((it) => map.set(it.id, explicit.get(it.id) ?? 0));
      return map;
    }

    const remaining = Math.max(0, total - sumExplicit);
    const map = new Map();
    let distributed = 0;

    const emptyItems = items.filter((it) => !explicit.has(it.id));
    emptyItems.forEach((it, idx) => {
      if (sumQtyEmpty <= 0) {
        map.set(it.id, 0);
        return;
      }
      if (idx === emptyItems.length - 1) {
        map.set(it.id, Number((remaining - distributed).toFixed(2)));
        return;
      }
      const share = remaining * ((Number(it?.quantity) || 0) / sumQtyEmpty);
      const rounded = Number(share.toFixed(2));
      distributed += rounded;
      map.set(it.id, rounded);
    });

    items.forEach((it) => map.set(it.id, explicit.get(it.id) ?? map.get(it.id) ?? 0));
    return map;
  };

  const allocateRollsUsed = (items, totalRolls) => {
    const total = Number(totalRolls) || 0;
    const sumQty = items.reduce((s, it) => s + (Number(it?.quantity) || 0), 0);
    const map = new Map();
    if (total <= 0 || sumQty <= 0) {
      items.forEach((it) => map.set(it.id, 0));
      return map;
    }

    let used = 0;
    items.forEach((it, idx) => {
      if (idx === items.length - 1) {
        map.set(it.id, Number((total - used).toFixed(2)));
        return;
      }
      const share = total * ((Number(it?.quantity) || 0) / sumQty);
      const rounded = Number(share.toFixed(2));
      used += rounded;
      map.set(it.id, rounded);
    });
    return map;
  };

  const computePaidAllocationsByPrice = (items, totalPaid, priceAlloc) => {
    const total = Math.max(0, Number(totalPaid) || 0);
    const weights = items.map((it) => {
      const p = Number(priceAlloc?.get(it.id)) || 0;
      const q = Number(it?.quantity) || 0;
      return { id: it.id, price: p, qty: q };
    });

    const sumPrice = weights.reduce((s, x) => s + (Number(x.price) || 0), 0);
    const usePrice = sumPrice > 0;
    const denom = usePrice ? sumPrice : weights.reduce((s, x) => s + (Number(x.qty) || 0), 0);
    const map = new Map();

    if (denom <= 0) {
      items.forEach((it) => map.set(it.id, 0));
      return map;
    }

    let distributed = 0;
    weights.forEach((w, idx) => {
      if (idx === weights.length - 1) {
        map.set(w.id, Number((total - distributed).toFixed(2)));
        return;
      }
      const weight = usePrice ? w.price : w.qty;
      const share = total * ((Number(weight) || 0) / denom);
      const rounded = Number(share.toFixed(2));
      distributed += rounded;
      map.set(w.id, rounded);
    });

    return map;
  };

  const handlePrintLabel = async (orderToPrint) => {
    const order = orderToPrint || createdOrder || createdOrders?.[0];
    if (!order) return;
    
    const logoSrc = user?.logo && user.logo !== 'null' && user.logo !== 'undefined' ? user.logo : '';
    const trackUrl = `${window.location.origin}/track-order?id=${order._id}`;
    const labelLang = user?.labelLanguage || 'both';
    
    // Generate QR codes
    let qrCodeUrl = '';
    let zatcaQrUrl = '';
    const zatcaEnabled = user?.zatcaSettings?.enabled && user?.zatcaSettings?.showOnInvoice;
    
    try {
      qrCodeUrl = await QRCode.toDataURL(trackUrl, { width: 100, margin: 1 });
      
      if (zatcaEnabled && user?.zatcaSettings?.vatNumber) {
        const vatRate = 0.15;
        const total = parseFloat(order.price) || 0;
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
      orderFor: { en: 'Order For', ar: 'الطلب لـ' },
      relationType: { en: 'Relation', ar: 'الصلة' },
      phone: { en: 'Phone', ar: 'الهاتف' },
      quantity: { en: 'Quantity', ar: 'الكمية' },
      price: { en: 'Price', ar: 'السعر' },
      paid: { en: 'Paid', ar: 'المدفوع' },
      balance: { en: 'Pending', ar: 'المتبقي' },
      dueDate: { en: 'Due Date', ar: 'تاريخ التسليم' },
      status: { en: 'Status', ar: 'الحالة' },
      thawbType: { en: 'Thawb', ar: 'الثوب' },
      fabric: { en: 'Fabric', ar: 'القماش' },
      rollsUsed: { en: 'Rolls Used', ar: 'الرولات المستخدمة' },
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
      const status = order.status || formData.status || 'pending';
      const s = statusLabels[status] || statusLabels.pending;
      if (labelLang === 'en') return s.en;
      if (labelLang === 'ar') return s.ar;
      return `${s.en} / ${s.ar}`;
    };
    
    // SAR Icon SVG - Official Saudi Riyal Symbol
    const sarSvg = `<svg viewBox="0 0 1124.14 1256.39" width="14" height="14" style="display:inline;vertical-align:middle;margin:0 2px;" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" /><path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" /></svg>`;
    
    const isRTL = labelLang === 'ar';

    const customerNameEn = selectedCustomer?.nameI18n?.en || selectedCustomer?.name || '-';
    const customerNameAr = selectedCustomer?.nameI18n?.ar || selectedCustomer?.name || '-';
    const customerDisplay = labelLang === 'en' ? customerNameEn : labelLang === 'ar' ? customerNameAr : `${customerNameEn} / ${customerNameAr}`;

    const orderForNameEn = order?.relationId?.nameI18n?.en || order?.relationName || customerNameEn;
    const orderForNameAr = order?.relationId?.nameI18n?.ar || order?.relationName || customerNameAr;
    const orderForDisplay = labelLang === 'en' ? orderForNameEn : labelLang === 'ar' ? orderForNameAr : `${orderForNameEn} / ${orderForNameAr}`;

    const relTypeValue = order?.relationType ? `${String(order.relationType).charAt(0).toUpperCase()}${String(order.relationType).slice(1)}` : '';
    const fabricDisplay = order?.fabricId?.name ? `${order.fabricId.name}` : '-';
    const rollsUsedDisplay = (order?.rollsUsed !== undefined && order?.rollsUsed !== null) ? String(order.rollsUsed) : '0';
    const thawbTypeDisplay = order?.thawbType || formData.thawbType || '-';
    const dueDateDisplay = order?.dueDate ? new Date(order.dueDate).toLocaleDateString() : (formData.dueDate || '-');
    
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
        <div class="receipt-no">#${order.receiptNumber || order._id?.slice(-6)}</div>
        <div class="row"><span class="label">${getLabel('customer')}:</span><span class="value">${customerDisplay}</span></div>
        <div class="row"><span class="label">${getLabel('orderFor')}:</span><span class="value">${orderForDisplay}</span></div>
        ${relTypeValue ? `<div class="row"><span class="label">${getLabel('relationType')}:</span><span class="value">${relTypeValue}</span></div>` : ''}
        <div class="row"><span class="label">${getLabel('phone')}:</span><span class="value">${selectedCustomer?.phone || '-'}</span></div>
        <div class="row"><span class="label">${getLabel('thawbType')}:</span><span class="value">${thawbTypeDisplay}</span></div>
        <div class="row"><span class="label">${getLabel('fabric')}:</span><span class="value">${fabricDisplay}</span></div>
        <div class="row"><span class="label">${getLabel('rollsUsed')}:</span><span class="value">${rollsUsedDisplay}</span></div>
        <div class="row"><span class="label">${getLabel('quantity')}:</span><span class="value">${order.quantity || 1}</span></div>
        <div class="row"><span class="label">${getLabel('price')}:</span><span class="value">${order.price || 0} ${sarSvg}</span></div>
        <div class="row"><span class="label">${getLabel('paid')}:</span><span class="value">${order.paidAmount || 0} ${sarSvg}</span></div>
        <div class="row"><span class="label">${getLabel('balance')}:</span><span class="value">${(Number(order.price) || 0) - (Number(order.paidAmount) || 0)} ${sarSvg}</span></div>
        <div class="row"><span class="label">${getLabel('dueDate')}:</span><span class="value">${dueDateDisplay}</span></div>
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

  const handlePrintFamilySummary = async () => {
    const orders = (createdOrders && createdOrders.length > 0) ? createdOrders : [];
    if (orders.length === 0 || !selectedCustomer) return;

    const logoSrc = user?.logo && user.logo !== 'null' && user.logo !== 'undefined' ? user.logo : '';
    const labelLang = user?.labelLanguage || 'both';
    const zatcaEnabled = user?.zatcaSettings?.enabled && user?.zatcaSettings?.showOnInvoice;

    const totalQty = orders.reduce((s, o) => s + (Number(o?.quantity) || 0), 0);
    const totalPrice = orders.reduce((s, o) => s + (Number(o?.price) || 0), 0);
    const totalPaid = orders.reduce((s, o) => s + (Number(o?.paidAmount) || 0), 0);

    const customerNameEn = selectedCustomer?.nameI18n?.en || selectedCustomer?.name || '-';
    const customerNameAr = selectedCustomer?.nameI18n?.ar || selectedCustomer?.name || '-';
    const customerDisplay = labelLang === 'en' ? customerNameEn : labelLang === 'ar' ? customerNameAr : `${customerNameEn} / ${customerNameAr}`;

    const labels = {
      customer: { en: 'Customer', ar: 'العميل' },
      phone: { en: 'Phone', ar: 'الهاتف' },
      quantity: { en: 'Quantity', ar: 'الكمية' },
      price: { en: 'Price', ar: 'السعر' },
      paid: { en: 'Paid', ar: 'المدفوع' },
      balance: { en: 'Pending', ar: 'المتبقي' },
      member: { en: 'Member', ar: 'الفرد' },
      familyInvoice: { en: 'Family Invoice', ar: 'فاتورة العائلة' }
    };

    const getLabel = (key) => {
      if (labelLang === 'en') return labels[key].en;
      if (labelLang === 'ar') return labels[key].ar;
      return `${labels[key].en} / ${labels[key].ar}`;
    };

    let zatcaQrUrl = '';
    if (zatcaEnabled && user?.zatcaSettings?.vatNumber) {
      try {
        const vatRate = 0.15;
        const vatAmount = (totalPrice * vatRate / (1 + vatRate)).toFixed(2);
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
          { tag: 4, value: Number(totalPrice || 0).toFixed(2) },
          { tag: 5, value: vatAmount }
        ]);
        zatcaQrUrl = await QRCode.toDataURL(tlvData, { width: 110, margin: 1 });
      } catch (e) {
        zatcaQrUrl = '';
      }
    }

    const sarSvg = `<svg viewBox="0 0 1124.14 1256.39" width="14" height="14" style="display:inline;vertical-align:middle;margin:0 2px;" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" /><path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" /></svg>`;

    const isRTL = labelLang === 'ar';

    const rowsHtml = orders.map((o) => {
      const name = o.orderFor || o.relationName || '-';
      const q = Number(o.quantity) || 0;
      const p = Number(o.price) || 0;
      const paid = Number(o.paidAmount) || 0;
      return `
        <div class="item-row">
          <div class="item-name">${name}</div>
          <div class="item-meta">${getLabel('quantity')}: ${q} · ${getLabel('price')}: ${p} ${sarSvg} · ${getLabel('paid')}: ${paid} ${sarSvg}</div>
        </div>
      `;
    }).join('');

    const printWindow = window.open('', '_blank', 'width=340,height=720');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <title>Family Invoice</title>
        <style>
          @page { size: 80mm auto; margin: 2mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; width: 76mm; padding: 3mm; font-size: 11px; direction: ${isRTL ? 'rtl' : 'ltr'}; }
          .header { text-align: center; margin-bottom: 8px; border-bottom: 2px dashed #333; padding-bottom: 10px; }
          .logo { width: 60px; height: 60px; object-fit: contain; margin: 0 auto 8px; display: block; border-radius: 8px; }
          .no-logo { width: 60px; height: 60px; background: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #6b7280; font-size: 24px; margin: 0 auto 8px; }
          .shop-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
          .shop-name-ar { font-size: 13px; font-weight: bold; direction: rtl; color: #333; }
          .receipt-title { font-size: 14px; font-weight: 800; text-align: center; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ccc; }
          .label { color: #666; font-size: 10px; }
          .value { font-weight: 700; }
          .items { margin-top: 10px; }
          .item-row { padding: 6px 0; border-bottom: 1px dotted #ddd; }
          .item-name { font-weight: 800; font-size: 11px; }
          .item-meta { margin-top: 2px; font-size: 9px; color: #444; line-height: 1.2; }
          .qr { text-align: center; margin-top: 10px; padding-top: 10px; border-top: 2px dashed #333; }
          .qr img { width: 90px; height: 90px; border: 2px solid #e5e7eb; border-radius: 10px; padding: 4px; background: #fff; }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoSrc ? `<img src="${logoSrc}" class="logo" onerror="this.outerHTML='<div class=no-logo>${(user?.businessName || 'T').charAt(0)}</div>'" />` : `<div class="no-logo">${(user?.businessName || 'T').charAt(0)}</div>`}
          <div class="shop-name">${user?.businessName || 'Tailor Shop'}</div>
          ${user?.businessNameAr ? `<div class="shop-name-ar">${user.businessNameAr}</div>` : ''}
        </div>

        <div class="receipt-title">${getLabel('familyInvoice')}</div>

        <div class="row"><span class="label">${getLabel('customer')}:</span><span class="value">${customerDisplay}</span></div>
        <div class="row"><span class="label">${getLabel('phone')}:</span><span class="value">${selectedCustomer?.phone || '-'}</span></div>

        <div class="items">${rowsHtml}</div>

        <div class="row"><span class="label">${getLabel('quantity')}:</span><span class="value">${totalQty}</span></div>
        <div class="row"><span class="label">${getLabel('price')}:</span><span class="value">${Number(totalPrice || 0).toFixed(2)} ${sarSvg}</span></div>
        <div class="row"><span class="label">${getLabel('paid')}:</span><span class="value">${Number(totalPaid || 0).toFixed(2)} ${sarSvg}</span></div>
        <div class="row"><span class="label">${getLabel('balance')}:</span><span class="value">${Number((totalPrice || 0) - (totalPaid || 0)).toFixed(2)} ${sarSvg}</span></div>

        ${zatcaQrUrl ? `
          <div class="qr">
            <img src="${zatcaQrUrl}" alt="ZATCA QR" />
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
    const current = { ...(formData.styleOptions || {}) };
    if (!value) {
      delete current[group];
    } else {
      current[group] = value;
    }
    setFormData({
      ...formData,
      styleOptions: current
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) {
      setDemoBlockedOpen(true);
      return;
    }
    if (!selectedCustomer) {
      toast.error('Select a customer');
      return;
    }
    setLoading(true);

    try {
      const rollsUsedValue = formData.rollsUsed === '' ? 0 : Number(formData.rollsUsed);
      if (rollsUsedValue !== undefined && (!Number.isFinite(rollsUsedValue) || rollsUsedValue < 0)) {
        toast.error('Invalid rolls used');
        setLoading(false);
        return;
      }

      if (!formData.fabricId && Number(rollsUsedValue) > 0) {
        toast.error('Select fabric');
        setLoading(false);
        return;
      }

      if (isEdit) {
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
          fabricId: formData.fabricId ? formData.fabricId : null,
          rollsUsed: rollsUsedValue,
          measurements: formData.measurements,
          styleOptions: formData.styleOptions,
          embroideryDesignId: formData.embroideryDesignId || null
        };
        await api.put(`/stitchings/${id}`, data);
        toast.success('Updated');
        navigate('/user/stitchings');
      } else {
        if (batchMode) {
          const items = (orderItems || [])
            .map((it) => ({
              ...it,
              quantity: Math.max(1, Number(it?.quantity) || 1)
            }))
            .filter((it) => !!it.orderFor);

          if (items.length === 0) {
            toast.error('Add at least 1 family member');
            setLoading(false);
            return;
          }

          const priceAlloc = computeAllocations(items, 'price', null);
          const paidAlloc = computePaidAllocationsByPrice(items, totalPaidOverride === null ? 0 : totalPaidOverride, priceAlloc);
          const rollsAlloc = allocateRollsUsed(items, rollsUsedValue);

          const created = [];
          for (const it of items) {
            const data = {
              customerId: selectedCustomer._id,
              customerName: selectedCustomer.name,
              relationId: it.relationId || null,
              relationName: it.relationName || null,
              relationType: it.relationType || null,
              orderFor: it.orderFor,
              quantity: Math.max(1, Number(it.quantity) || 1),
              price: Number(priceAlloc.get(it.id)) || 0,
              paidAmount: Number(paidAlloc.get(it.id)) || 0,
              description: formData.description,
              dueDate: formData.dueDate,
              status: formData.status,
              thawbType: formData.thawbType,
              fabricColor: formData.fabricColor || null,
              fabricId: formData.fabricId ? formData.fabricId : null,
              rollsUsed: Number(rollsAlloc.get(it.id)) || 0,
              measurements: it.measurements || {},
              styleOptions: formData.styleOptions,
              embroideryDesignId: formData.embroideryDesignId || null
            };

            const response = await api.post('/stitchings', data);
            const order = response.data?.stitching || response.data;
            created.push(order);
          }

          setCreatedOrders(created);
          setCreatedOrder(created[0] || null);
          toast.success('Orders created! You can print labels now.');
        } else {
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
            fabricId: formData.fabricId ? formData.fabricId : null,
            rollsUsed: rollsUsedValue,
            measurements: formData.measurements,
            styleOptions: formData.styleOptions,
            embroideryDesignId: formData.embroideryDesignId || null
          };
          const response = await api.post('/stitchings', data);
          const order = response.data?.stitching || response.data;
          setCreatedOrders([]);
          setCreatedOrder(order);
          toast.success('Order created! You can print the label now.');
        }
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

  const batchMode = !isEdit && (orderItems?.length || 0) > 0;
  const batchQuantity = orderItems.reduce((sum, it) => sum + (Number(it?.quantity) || 0), 0);
  const batchItemsPrice = orderItems.reduce((sum, it) => sum + (Number(it?.price) || 0), 0);
  const totalPaidOverride = String(formData.paidAmount || '').trim() === '' ? null : (Number(formData.paidAmount) || 0);
  const batchTotalPrice = batchItemsPrice;
  const batchTotalPaid = totalPaidOverride === null ? 0 : totalPaidOverride;

  // If order created, show print option
  if (createdOrder) {
    const orders = (createdOrders && createdOrders.length > 0) ? createdOrders : [createdOrder];
    return (
      <div className="max-w-md mx-auto space-y-6 animate-fadeIn">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Order Created!</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">
            {orders.length > 1 ? `${orders.length} orders created` : `Receipt #${createdOrder.receiptNumber || createdOrder._id?.slice(-6)}`}
          </p>
          
          <div className="space-y-3">
            {orders.length === 1 ? (
              <Button onClick={() => handlePrintLabel(orders[0])} icon={Printer} className="w-full">
                Print Label (80mm)
              </Button>
            ) : (
              <div className="space-y-2">
                <Button onClick={handlePrintFamilySummary} icon={Printer} className="w-full">
                  Print Family Invoice
                </Button>
                {orders.map((o) => (
                  <Button
                    key={o._id}
                    variant="outline"
                    onClick={() => handlePrintLabel(o)}
                    icon={Printer}
                    className="w-full"
                  >
                    Print {o.orderFor || o.relationName || 'Order'} #{o.receiptNumber || o._id?.slice(-6)}
                  </Button>
                ))}
              </div>
            )}
            <Button variant="outline" onClick={() => navigate('/user/stitchings')} className="w-full">
              Back to Orders
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setCreatedOrder(null);
                setCreatedOrders([]);
                setOrderItems([]);
                setSelectedCustomer(null);
                setSelectedRelation(null);
                setSelectedEmbroideryDesign(null);
                setCustomerSearch('');
                setFormData({ quantity: 1, price: '', paidAmount: '', description: '', dueDate: '', status: 'pending', thawbType: 'saudi', fabricColor: '', measurements: {}, styleOptions: {}, embroideryDesignId: null });
              }}
              className="w-full"
            >
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
                        <span className="text-primary-700 dark:text-primary-200 font-medium text-sm">{(selectedCustomer.nameI18n?.[langKey] || selectedCustomer.name || '')?.charAt(0)}</span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-slate-100">{selectedCustomer.nameI18n?.[langKey] || selectedCustomer.name}</p>
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
                            className={`w-full p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center gap-3 text-left transition-colors border-b border-gray-100 dark:border-slate-700 last:border-b-0 ${
                              selectedCustomer?._id === customer._id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                            }`}
                          >
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                              <span className="text-primary-700 dark:text-primary-200 font-medium">{(customer.nameI18n?.[langKey] || customer.name || '')?.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-slate-100">{customer.nameI18n?.[langKey] || customer.name}</p>
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
              <button
                type="button"
                onClick={() => setStyleOptionsOpen((p) => !p)}
                className="w-full flex items-center justify-between mb-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('styleOptions.title')}</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 dark:text-slate-400 transition-transform ${styleOptionsOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {styleOptionsOpen ? (
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
                        const groupOptions = (group.options || [])
                          .filter((o) => o && o.enabled !== false)
                          .slice()
                          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                          .map((opt) => {
                            const label = opt.nameI18n?.[langKey] || opt.name || t(`styleOptions.options.${group.key}.${opt.key}`, { defaultValue: opt.key });
                            return { value: opt.key, label };
                          });

                        const selectedValue = (formData.styleOptions || {})[group.key] || '';
                        return (
                          <div key={group.key}>
                            <Select
                              label={groupTitle}
                              value={selectedValue}
                              onChange={(e) => handleStyleOptionChange(group.key, e.target.value)}
                              options={[
                                { value: '', label: t('common.select', { defaultValue: 'Select' }) },
                                ...groupOptions
                              ]}
                              className="rounded-2xl bg-white/70 dark:bg-slate-900/40 border-gray-200 dark:border-slate-700"
                            />
                          </div>
                        );
                      })
                  )}
                </div>
              ) : null}
            </div>

            {/* Thawb Type Selector */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 p-5">
              <label className="block text-sm font-semibold text-gray-800 dark:text-slate-100 mb-4">
                {t('thawbTypes.title')} / نوع الثوب *
              </label>
              {thawbTypesCatalogLoading && (
                <div className="text-sm text-gray-500 dark:text-slate-400 mb-4">Loading…</div>
              )}
              <Select
                value={formData.thawbType}
                onChange={(e) => setFormData({ ...formData, thawbType: e.target.value })}
                options={thawbTypes.map((thawb) => {
                  const title = thawb.name || t(`thawbTypes.${thawb.key}`, { defaultValue: thawb.fallbackLabel || thawb.key });
                  const subtitle = thawb.fallbackLabelAr || '';
                  return {
                    value: thawb.key,
                    label: subtitle ? `${title} / ${subtitle}` : title
                  };
                })}
                className="rounded-2xl bg-white/70 dark:bg-slate-900/40 border-gray-200 dark:border-slate-700"
              />
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 p-5">
              {/* Fabric (Roll) Selector (Optional) */}
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-800 dark:text-slate-100">
                  Fabric / القماش
                </label>
                <span className="text-xs text-gray-400 dark:text-slate-500">(Optional)</span>
              </div>
              {fabricsLoading ? (
                <div className="text-sm text-gray-500 dark:text-slate-400 mb-4">Loading…</div>
              ) : null}
              <Select
                value={formData.fabricId}
                onChange={(e) => setFormData((p) => ({ ...p, fabricId: e.target.value }))}
                options={[
                  { value: '', label: 'Not specified' },
                  ...(Array.isArray(fabrics) ? fabrics : []).map((f) => {
                    const stock = Number(f?.rollsInStock) || 0;
                    const label = `${f?.name || '—'} · Stock: ${stock}`;
                    return { value: f._id, label };
                  })
                ]}
                className="rounded-2xl bg-white/70 dark:bg-slate-900/40 border-gray-200 dark:border-slate-700"
              />

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Rolls Used / رول مستخدم</label>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {['0.25', '0.50', '0.75', '1'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, rollsUsed: preset }))}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                          String(formData.rollsUsed || '') === preset
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'bg-white/70 dark:bg-slate-900/40 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.rollsUsed}
                    onChange={(e) => setFormData((p) => ({ ...p, rollsUsed: e.target.value }))}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/30 p-4">
                  <div className="text-xs text-gray-500 dark:text-slate-400">Tip</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">Stock auto-updates</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">On create/update/delete, fabric stock will be adjusted automatically.</div>
                </div>
              </div>

              {/* Fabric Color Selector (Optional) */}
              <div className="mt-6">
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
            </div>

            {/* Price and Quantity */}
            {!batchMode ? (
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
                    className="no-spinner w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    className="no-spinner w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            ) : null}

            {/* Measurements - Premium Visual UI */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-gray-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 p-6">
                <button
                  type="button"
                  onClick={() => setCustomerMeasurementsOpen((p) => !p)}
                  className="w-full flex items-center justify-between"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('customers.measurements')} ({selectedCustomer?.nameI18n?.[langKey] || selectedCustomer?.name || ''})</h3>
                  <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-slate-400 transition-transform ${customerMeasurementsOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className="mt-2 flex items-center gap-2">
                  {selectedCustomer?.measurements && Object.keys(selectedCustomer.measurements).length > 0 ? (
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">
                      ✓ Auto-filled from customer
                    </span>
                  ) : null}
                  {selectedRelation ? (
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-full">
                      Read-only
                    </span>
                  ) : null}
                </div>

                {customerMeasurementsOpen ? (
                  <>
                    {measurementsCatalogLoading && (
                      <div className="text-sm text-gray-500 dark:text-slate-400 mt-4">Loading…</div>
                    )}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {measurementFields.map((field) => (
                        <MeasurementCard
                          key={field.key}
                          measurementKey={field.key}
                          label={field.label}
                          value={(selectedRelation ? (selectedCustomer?.measurements || {}) : (formData.measurements || {}))[field.key]}
                          onChange={(value) => {
                            if (selectedRelation) return;
                            handleMeasurementChange(field.key, value);
                          }}
                          disabled={!!selectedRelation}
                          imageSrc={field.image ? `${resolveUploadsUrl(field.image)}${field.imageUpdatedAt ? `?v=${field.imageUpdatedAt}` : ''}` : undefined}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              {selectedRelation ? (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/60 to-white dark:from-amber-900/20 dark:to-slate-900/50 p-6">
                  <button
                    type="button"
                    onClick={() => setOrderForMeasurementsOpen((p) => !p)}
                    className="w-full flex items-center justify-between"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('customers.measurements')} ({selectedRelation?.name || ''})</h3>
                    <ChevronDown className={`w-5 h-5 text-amber-500 transition-transform ${orderForMeasurementsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <div className="mt-2 flex items-center gap-2">
                    {orderForDetailsLoading ? (
                      <span className="text-xs text-gray-500 dark:text-slate-400">Loading…</span>
                    ) : null}
                    {selectedRelation?.measurements && Object.keys(selectedRelation.measurements).length > 0 ? (
                      <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
                        ✓ Auto-filled from {selectedRelation.name}
                      </span>
                    ) : null}
                  </div>

                  {orderForMeasurementsOpen ? (
                    <>
                      {measurementsCatalogLoading && (
                        <div className="text-sm text-gray-500 dark:text-slate-400 mt-4">Loading…</div>
                      )}
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>

            <Textarea
              label={t('stitchings.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

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

            {selectedCustomer && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900/50 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Family / شجرة العائلة</h3>
                    </div>
                    <div className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">Choose who this order is for (default: customer).</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {orderItems.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setFamilyControlsOpen((p) => !p)}
                        className="px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-white/60 dark:bg-slate-900/20 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-white inline-flex items-center gap-2"
                      >
                        <span>{familyControlsOpen ? 'Hide' : 'Show'} Controls</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${familyControlsOpen ? 'rotate-180' : ''}`} />
                      </button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openAddFamily('son')}
                      icon={UserPlus}
                      disabled={isDemo}
                    >
                      Add Member
                    </Button>
                  </div>
                </div>

                {(familyControlsOpen || orderItems.length === 0) ? (
                  <>
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-amber-200/70 dark:border-amber-800/40 bg-white/80 dark:bg-slate-900/25 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs font-semibold text-amber-800 dark:text-amber-200">Order for</div>
                          <div className="text-[11px] font-semibold text-amber-900/70 dark:text-amber-100/70">Use “Add Order” above</div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                              {selectedRelation ? (
                                <span className="text-amber-700 dark:text-amber-200 font-semibold">{(selectedRelation.name || '?').charAt(0)}</span>
                              ) : (
                                <User className="w-5 h-5 text-amber-700 dark:text-amber-200" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                                {selectedRelation ? selectedRelation.name : (selectedCustomer.nameI18n?.[langKey] || selectedCustomer.name)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                {selectedRelation ? (selectedRelation.type || '') : 'Self'}
                              </div>
                            </div>
                          </div>
                          {selectedRelation ? (
                            <button
                              type="button"
                              onClick={clearRelation}
                              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                            >
                              Use Self
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-200/70 dark:border-amber-800/40 bg-white/70 dark:bg-slate-900/20 p-4">
                        <div className="text-xs font-semibold text-amber-800 dark:text-amber-200">Quick add</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => openAddFamily('son')} className="px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-white/70 dark:bg-slate-900/20 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:shadow-sm">Add Son</button>
                          <button type="button" onClick={() => openAddFamily('brother')} className="px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-white/70 dark:bg-slate-900/20 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:shadow-sm">Add Brother</button>
                          <button type="button" onClick={() => openAddFamily('father')} className="px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-white/70 dark:bg-slate-900/20 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:shadow-sm">Add Father</button>
                          <button type="button" onClick={() => openAddFamily('other')} className="px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-white/70 dark:bg-slate-900/20 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:shadow-sm">Add Other</button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold text-amber-800 dark:text-amber-200">Select from family</div>
                        <button
                          type="button"
                          onClick={() => navigate(`/user/customers/${selectedCustomer._id}`)}
                          className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
                        >
                          View Family Tree
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={clearRelation}
                          className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${!selectedRelation ? 'border-amber-400 bg-amber-100/60 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100' : 'border-amber-200 dark:border-amber-800/40 bg-white/60 dark:bg-slate-900/20 text-slate-800 dark:text-slate-100 hover:bg-white'}`}
                        >
                          Self
                        </button>

                        {(selectedCustomer.relations || []).map((r, idx) => {
                          const relUi = normalizeRelationForUi(r);
                          const active = selectedRelation && String(selectedRelation._id) === String(relUi._id);
                          return (
                            <button
                              key={`${relUi._id || idx}`}
                              type="button"
                              onClick={() => handleRelationSelect(r)}
                              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${active ? 'border-amber-400 bg-amber-100/60 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100' : 'border-amber-200 dark:border-amber-800/40 bg-white/60 dark:bg-slate-900/20 text-slate-800 dark:text-slate-100 hover:bg-white'}`}
                              title={relUi.phone || ''}
                            >
                              {relUi.name || '-'}{relUi.type ? ` · ${relUi.type}` : ''}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => openAddFamily('son')}
                          className="px-3 py-2 rounded-xl border border-dashed border-amber-300 dark:border-amber-800/60 bg-white/40 dark:bg-slate-900/10 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-white"
                        >
                          <span className="inline-flex items-center gap-2"><Plus className="w-4 h-4" />Add</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-5 rounded-2xl border border-amber-200/70 dark:border-amber-800/40 bg-white/60 dark:bg-slate-900/20 p-4">
                    <div className="text-xs font-semibold text-amber-800 dark:text-amber-200">Controls hidden</div>
                    <div className="mt-1 text-xs text-amber-900/70 dark:text-amber-100/70">Use “Show Controls” to add more members.</div>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl border border-amber-200/70 dark:border-amber-800/40 bg-white/70 dark:bg-slate-900/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-amber-900/80 dark:text-amber-100/80">Add Order</div>
                        <div className="mt-1 flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            {selectedRelation ? (
                              <span className="text-amber-700 dark:text-amber-200 font-semibold">{(selectedRelation.name || '?').charAt(0)}</span>
                            ) : (
                              <User className="w-4 h-4 text-amber-700 dark:text-amber-200" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                              {selectedRelation ? selectedRelation.name : (selectedCustomer?.nameI18n?.[langKey] || selectedCustomer?.name || '-')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
                              {selectedRelation ? (selectedRelation.type || '') : 'Self'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFamilyControlsOpen(true)}
                          className="px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-white/60 dark:bg-slate-900/20 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-white"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={addCurrentToOrder}
                          disabled={isDemo}
                          className="px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-100/70 dark:bg-amber-900/25 text-xs font-semibold text-amber-900 dark:text-amber-100 hover:bg-amber-100 disabled:opacity-60"
                        >
                          <span className="inline-flex items-center gap-2"><Plus className="w-4 h-4" />Add</span>
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-amber-900/60 dark:text-amber-100/60">
                      Tip: New orders open automatically. Previous orders collapse to keep the page clean.
                    </div>
                  </div>

                  {orderItems.map((it, idx) => {
                      const isExpanded = String(expandedOrderItemId || '') === String(it.id);
                      const priceNum = Number(it.price);
                      const priceText = Number.isFinite(priceNum) ? priceNum : (String(it.price || '').trim() === '' ? 0 : it.price);

                      return (
                        <div key={it.id} className="rounded-2xl border border-amber-200/70 dark:border-amber-800/40 bg-white/80 dark:bg-slate-900/25 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => setExpandedOrderItemId((curr) => (String(curr || '') === String(it.id) ? null : it.id))}
                              className="flex-1 min-w-0 text-left"
                            >
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded-lg bg-amber-100/70 dark:bg-amber-900/25 text-[11px] font-bold text-amber-900 dark:text-amber-100">#{idx + 1}</span>
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{it.orderFor || '-'}</div>
                                  <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{it.relationType || 'Self'}</div>
                                </div>
                              </div>
                            </button>

                            <div className="flex items-center gap-2">
                              <div className="hidden sm:flex items-center gap-2">
                                <div className="px-2.5 py-1 rounded-xl border border-amber-200/70 dark:border-amber-800/40 bg-white/60 dark:bg-slate-900/20 text-[11px] font-semibold text-amber-900 dark:text-amber-100">Qty: {it.quantity}</div>
                                <div className="px-2.5 py-1 rounded-xl border border-amber-200/70 dark:border-amber-800/40 bg-white/60 dark:bg-slate-900/20 text-[11px] font-semibold text-amber-900 dark:text-amber-100">Price: {priceText}</div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setExpandedOrderItemId((curr) => (String(curr || '') === String(it.id) ? null : it.id))}
                                className="p-2 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-white/60 dark:bg-slate-900/20 text-amber-700 dark:text-amber-200 hover:bg-white"
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              <button
                                type="button"
                                onClick={() => removeOrderItem(it.id)}
                                className="p-2 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-white/60 dark:bg-slate-900/20 text-rose-600 dark:text-rose-400 hover:bg-white"
                                aria-label="Remove"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {isExpanded ? (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-amber-900/80 dark:text-amber-100/80 mb-1">Qty</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={it.quantity}
                                  onChange={(e) => updateOrderItem(it.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-amber-200/70 dark:border-amber-800/40 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-amber-900/80 dark:text-amber-100/80 mb-1">Price</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={it.price}
                                  onChange={(e) => updateOrderItem(it.id, { price: e.target.value })}
                                  placeholder="0"
                                  className="no-spinner w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-amber-200/70 dark:border-amber-800/40 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                  })}

                  {orderItems.length > 0 ? (
                    <div className="rounded-2xl border border-amber-200/70 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-900/15 p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-amber-900/70 dark:text-amber-100/70">Total Qty</div>
                          <div className="mt-1 text-sm font-semibold text-amber-900 dark:text-amber-100">{batchQuantity}</div>
                        </div>
                        <div>
                          <div className="text-xs text-amber-900/70 dark:text-amber-100/70">Total Price</div>
                          <div className="mt-1 text-sm font-semibold text-amber-900 dark:text-amber-100">{batchTotalPrice}</div>
                        </div>
                        <div>
                          <div className="text-xs text-amber-900/70 dark:text-amber-100/70">Total Paid</div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.paidAmount}
                            onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                            placeholder="0"
                            className="no-spinner mt-1 w-full px-3 py-2 bg-white/70 dark:bg-slate-900/20 border border-amber-200/70 dark:border-amber-800/40 rounded-xl text-sm font-semibold text-amber-900 dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-amber-900/70 dark:text-amber-100/70">Pending</div>
                          <div className="mt-1 text-sm font-semibold text-amber-900 dark:text-amber-100">{Number(batchTotalPrice || 0) - Number(batchTotalPaid || 0)}</div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-amber-900/70 dark:text-amber-100/70">
                        Total paid is distributed across members by price.
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" variant={isEdit ? 'primary' : 'success'} loading={loading} className="flex-1" disabled={isDemo}>
                {isEdit ? t('common.save') : t('stitchings.createOrder')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/user/stitchings')}>
                {t('common.cancel')}
              </Button>
            </div>

            <Modal
              isOpen={addFamilyOpen}
              onClose={() => setAddFamilyOpen(false)}
              title="Add Family Member"
              size="lg"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Relation type</div>
                    <select
                      value={addFamilyType}
                      onChange={(e) => setAddFamilyType(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D5B25B]/40"
                    >
                      {RELATION_TYPES.map((rt) => (
                        <option key={rt.value} value={rt.value}>{rt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Search existing customer</div>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        value={familyQuery}
                        onChange={(e) => {
                          setFamilyQuery(e.target.value);
                          setFamilySelected(null);
                        }}
                        placeholder="Search by name or phone"
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D5B25B]/40"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-4 py-3 bg-white dark:bg-slate-900/40 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Results</div>
                    {familySearching ? <div className="text-xs text-slate-400">Searching…</div> : null}
                  </div>
                  <div className="max-h-56 overflow-y-auto bg-gray-50/40 dark:bg-slate-900/20">
                    {!familyQuery ? (
                      <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">Type to search customers</div>
                    ) : null}
                    {(familyQuery && !familySearching && familyResults.length === 0) ? (
                      <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">No matches</div>
                    ) : null}
                    {familyResults.map((c) => {
                      const display = c?.nameI18n?.[langKey] || c?.name || '—';
                      const active = String(familySelected?._id) === String(c?._id);
                      return (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => setFamilySelected(c)}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-white dark:hover:bg-slate-900/40 transition-colors ${active ? 'bg-white dark:bg-slate-900/50' : ''}`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{display}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{c?.phone || ''}</div>
                          </div>
                          <div className={`w-9 h-9 rounded-full ring-2 ${active ? 'ring-[#D5B25B]/80' : 'ring-slate-300/70 dark:ring-slate-700/60'} bg-gradient-to-br from-white to-gray-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-sm font-semibold text-slate-900 dark:text-slate-100`}>
                            {String(display || '—').charAt(0)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 p-4">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Or create new customer</div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      value={newFamilyName}
                      onChange={(e) => {
                        setNewFamilyName(e.target.value);
                        setFamilySelected(null);
                      }}
                      placeholder="Name"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D5B25B]/40"
                    />
                    <input
                      value={newFamilyPhone}
                      onChange={(e) => {
                        setNewFamilyPhone(e.target.value);
                        setFamilySelected(null);
                      }}
                      placeholder="Phone"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D5B25B]/40"
                    />
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">If you select an existing customer above, these fields are ignored.</div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setAddFamilyOpen(false)}>
                    {t('common.cancel', { defaultValue: 'Cancel' })}
                  </Button>
                  <Button
                    type="button"
                    onClick={saveFamilyMember}
                    loading={familySaving}
                    disabled={familySaving}
                    icon={UserPlus}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Modal>

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

export default StitchingForm;
