import QRCode from 'qrcode';

const buildTlv = (fields) => {
  const result = [];
  fields.forEach((field) => {
    const value = String(field.value ?? '');
    const valueBytes = new TextEncoder().encode(value);
    result.push(field.tag, valueBytes.length, ...valueBytes);
  });
  return btoa(String.fromCharCode(...result));
};

export const printStitchingInvoice = async ({ stitch, user }) => {
  if (!stitch || !user) return;

  const logoSrc = user?.logo && user.logo !== 'null' && user.logo !== 'undefined' ? user.logo : '';
  const labelLang = user?.labelLanguage || 'both';
  const customerNameEn = stitch.customerId?.nameI18n?.en || stitch.customerId?.name || '-';
  const customerNameAr = stitch.customerId?.nameI18n?.ar || stitch.customerId?.name || '-';
  const customerDisplayName =
    labelLang === 'en'
      ? customerNameEn
      : labelLang === 'ar'
        ? customerNameAr
        : `${customerNameEn} / ${customerNameAr}`;

  const sarSvg = `<svg viewBox="0 0 1124.14 1256.39" width="14" height="14" style="display:inline;vertical-align:middle;margin:0 2px;" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" /><path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" /></svg>`;

  let qrCodeUrl = '';
  let zatcaQrUrl = '';
  const zatcaEnabled = user?.zatcaSettings?.enabled && user?.zatcaSettings?.showOnInvoice;

  try {
    qrCodeUrl = await QRCode.toDataURL(`${window.location.origin}/track-order?id=${stitch._id}`, { width: 100, margin: 1 });

    if (zatcaEnabled && user?.zatcaSettings?.vatNumber) {
      const vatRate = 0.15;
      const total = parseFloat(stitch.price) || 0;
      const vatAmount = (total * vatRate / (1 + vatRate)).toFixed(2);
      const timestamp = new Date().toISOString();
      const tlvData = buildTlv([
        { tag: 1, value: user?.businessName || '' },
        { tag: 2, value: user?.zatcaSettings?.vatNumber || '' },
        { tag: 3, value: timestamp },
        { tag: 4, value: total.toFixed(2) },
        { tag: 5, value: vatAmount }
      ]);
      zatcaQrUrl = await QRCode.toDataURL(tlvData, { width: 100, margin: 1 });
    }
  } catch (error) {
    console.error('QR generation error:', error);
  }

  const labels = {
    customer: { en: 'Customer', ar: 'العميل' },
    phone: { en: 'Phone', ar: 'الهاتف' },
    fabric: { en: 'Fabric', ar: 'القماش' },
    quantity: { en: 'Quantity', ar: 'الكمية' },
    price: { en: 'Price', ar: 'السعر' },
    paid: { en: 'Paid', ar: 'المدفوع' },
    balance: { en: 'Pending', ar: 'المتبقي' },
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
    assigned: { en: 'Assigned', ar: 'تم التعيين' },
    in_progress: { en: 'In Progress', ar: 'جاري العمل' },
    completed: { en: 'Completed', ar: 'مكتمل' },
    delivered: { en: 'Delivered', ar: 'تم التسليم' },
    stitching: { en: 'Stitching', ar: 'الخياطة' },
    finishing: { en: 'Finishing', ar: 'التشطيب' },
    laundry: { en: 'Laundry', ar: 'الغسيل' },
    done: { en: 'Done', ar: 'جاهز' }
  };

  const getStatusLabel = (status) => {
    const resolved = statusLabels[status] || { en: status || 'Pending', ar: status || 'Pending' };
    if (labelLang === 'en') return resolved.en;
    if (labelLang === 'ar') return resolved.ar;
    return `${resolved.en} / ${resolved.ar}`;
  };

  const balance = (parseFloat(stitch.price) || 0) - (parseFloat(stitch.paidAmount) || 0);
  const fabricDisplay = stitch.fabricId?.name || stitch.customFabricName || '-';

  const printWindow = window.open('', '_blank', 'width=350,height=600');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="${labelLang === 'ar' ? 'rtl' : 'ltr'}">
    <head>
      <title>Print Label</title>
      <style>
        @page { size: 80mm auto; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-weight: bold !important; }
        body { font-family: Arial, sans-serif; font-size: 11px; padding: 8px; width: 80mm; font-weight: bold !important; word-break: break-word; overflow-wrap: break-word; }
        .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 10px; margin-bottom: 8px; }
        .logo { width: 60px; height: 60px; object-fit: contain; margin: 0 auto 8px; display: block; border-radius: 8px; }
        .shop-name { font-size: 14px; font-weight: bold !important; margin-bottom: 2px; }
        .shop-name-ar { font-size: 13px; font-weight: bold !important; direction: rtl; color: #333; }
        .shop-address { font-size: 9px; color: #333; font-weight: bold !important; margin-top: 4px; word-break: break-word; overflow-wrap: break-word; }
        .receipt-no { font-size: 16px; font-weight: bold !important; margin: 8px 0; text-align: center; }
        .info-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 4px; padding: 4px 0; border-bottom: 1px dotted #ccc; }
        .label { color: #333; font-weight: bold !important; }
        .value { font-weight: bold !important; word-break: break-word; overflow-wrap: break-word; }
        .qr-container { display: flex; justify-content: center; gap: 16px; margin-top: 12px; padding-top: 12px; border-top: 2px dashed #333; }
        .qr-box { flex: 1; text-align: center; max-width: 100px; }
        .qr-box img { width: 70px; height: 70px; border: 2px solid #e5e7eb; border-radius: 8px; padding: 4px; background: #fff; }
        .qr-label { font-size: 8px; color: #374151; margin-top: 6px; font-weight: bold !important; line-height: 1.2; }
        .qr-sublabel { font-size: 7px; color: #333; font-weight: bold !important; margin-top: 2px; }
        .single-qr { text-align: center; margin-top: 12px; padding-top: 12px; border-top: 2px dashed #333; }
        .single-qr img { width: 80px; height: 80px; border: 2px solid #e5e7eb; border-radius: 8px; padding: 4px; background: #fff; }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoSrc ? `<img src="${logoSrc}" class="logo" />` : ''}
        <div class="shop-name">${user?.businessName || 'Tailor Shop'}</div>
        ${user?.businessNameAr ? `<div class="shop-name-ar">${user.businessNameAr}</div>` : ''}
        ${user?.businessAddress ? `<div class="shop-address">${user.businessAddress}</div>` : ''}
      </div>
      <div class="receipt-no">#${stitch.receiptNumber || stitch._id?.slice(-6) || 'N/A'}</div>
      <div class="info-row"><span class="label">${getLabel('customer')}</span><span class="value">${customerDisplayName}</span></div>
      <div class="info-row"><span class="label">${getLabel('phone')}</span><span class="value">${stitch.customerId?.phone || '-'}</span></div>
      <div class="info-row"><span class="label">${getLabel('fabric')}</span><span class="value">${fabricDisplay}</span></div>
      <div class="info-row"><span class="label">${getLabel('quantity')}</span><span class="value">${stitch.quantity || 1}</span></div>
      <div class="info-row"><span class="label">${getLabel('price')}</span><span class="value">${stitch.price || 0} ${sarSvg}</span></div>
      <div class="info-row"><span class="label">${getLabel('paid')}</span><span class="value">${stitch.paidAmount || 0} ${sarSvg}</span></div>
      <div class="info-row"><span class="label">${getLabel('balance')}</span><span class="value" style="color: ${balance > 0 ? '#dc2626' : '#16a34a'}">${balance} ${sarSvg}</span></div>
      <div class="info-row"><span class="label">${getLabel('dueDate')}</span><span class="value">${stitch.dueDate ? new Date(stitch.dueDate).toLocaleDateString() : '-'}</span></div>
      <div class="info-row"><span class="label">${getLabel('status')}</span><span class="value">${getStatusLabel(stitch.status)}</span></div>
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
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);

  printWindow.document.close();
};

export default printStitchingInvoice;
