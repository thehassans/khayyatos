import QRCode from 'qrcode';
import { formatSaudiRiyal } from './saudi';

const buildTlv = (fields) => {
  const result = [];
  fields.forEach((field) => {
    const value = String(field.value ?? '');
    const valueBytes = new TextEncoder().encode(value);
    result.push(field.tag, valueBytes.length, ...valueBytes);
  });
  return btoa(String.fromCharCode(...result));
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const normalizeInvoiceLanguage = (value) => (['en', 'ar', 'both'].includes(value) ? value : 'both');

const joinUniqueValues = (...values) => {
  const seen = new Set();
  const items = values
    .map((value) => String(value || '').trim())
    .filter((value) => {
      if (!value) return false;
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  return items.join(' / ');
};

const formatDisplayDate = (value, locale) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(locale).format(date);
};

export const printStitchingInvoice = async ({ stitch, user, resolveUploadsUrl }) => {
  if (!stitch || !user) return;

  const invoiceLanguage = normalizeInvoiceLanguage(user?.invoiceLanguage);
  const isArabic = invoiceLanguage === 'ar';
  const isEnglish = invoiceLanguage === 'en';
  const locale = isArabic ? 'ar-SA' : 'en-GB';
  const dir = isArabic ? 'rtl' : 'ltr';
  const align = isArabic ? 'right' : 'left';

  const logoBase = user?.logo && user.logo !== 'null' && user.logo !== 'undefined'
    ? (typeof resolveUploadsUrl === 'function' ? resolveUploadsUrl(user.logo) : user.logo)
    : '';
  const logoSrc = logoBase || '';

  const customerNameEn = stitch.customerId?.nameI18n?.en || stitch.customerId?.name || '-';
  const customerNameAr = stitch.customerId?.nameI18n?.ar || stitch.customerId?.name || customerNameEn || '-';
  const businessNameEn = user?.businessName || 'Tailor Shop';
  const businessNameAr = user?.businessNameAr || businessNameEn;

  const resolveLangValue = ({ en, ar, fallback = '-' }) => {
    const enValue = String(en || '').trim();
    const arValue = String(ar || '').trim();
    if (isEnglish) return enValue || arValue || fallback;
    if (isArabic) return arValue || enValue || fallback;
    return joinUniqueValues(enValue, arValue) || fallback;
  };

  const labels = {
    invoice: { en: 'Invoice', ar: 'فاتورة' },
    invoiceNumber: { en: 'Invoice No.', ar: 'رقم الفاتورة' },
    issueDate: { en: 'Issue Date', ar: 'تاريخ الإصدار' },
    dueDate: { en: 'Due Date', ar: 'تاريخ التسليم' },
    customer: { en: 'Customer', ar: 'العميل' },
    phone: { en: 'Phone', ar: 'الهاتف' },
    oldInvoice: { en: 'Old Invoice', ar: 'رقم فاتورة سابق' },
    status: { en: 'Status', ar: 'الحالة' },
    quantity: { en: 'Quantity', ar: 'الكمية' },
    price: { en: 'Price', ar: 'السعر' },
    paid: { en: 'Paid', ar: 'المدفوع' },
    pending: { en: 'Pending', ar: 'المتبقي' },
    notes: { en: 'Notes', ar: 'ملاحظات' },
    measurementImage: { en: 'Measurement Image', ar: 'صورة المقاس' },
    scanToTrack: { en: 'Scan to track order', ar: 'امسح لتتبع الطلب' },
    electronicInvoice: { en: 'Electronic Invoice', ar: 'فاتورة إلكترونية' }
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

  const getLabel = (key) => resolveLangValue({
    en: labels[key]?.en,
    ar: labels[key]?.ar,
    fallback: key
  });

  const getStatusLabel = (status) => {
    const resolved = statusLabels[status] || { en: status || 'Pending', ar: status || 'Pending' };
    return resolveLangValue({ en: resolved.en, ar: resolved.ar, fallback: status || '-' });
  };

  const sarSvg = `<svg viewBox="0 0 1124.14 1256.39" width="14" height="14" style="display:inline;vertical-align:middle;margin-${isArabic ? 'left' : 'right'}:4px;" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" /><path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" /></svg>`;

  let qrCodeUrl = '';
  let zatcaQrUrl = '';
  const zatcaEnabled = user?.zatcaSettings?.enabled && user?.zatcaSettings?.showOnInvoice;

  try {
    qrCodeUrl = await QRCode.toDataURL(`${window.location.origin}/track-order?id=${stitch._id}`, { width: 120, margin: 1 });

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
      zatcaQrUrl = await QRCode.toDataURL(tlvData, { width: 120, margin: 1 });
    }
  } catch (error) {
    console.error('QR generation error:', error);
  }

  const balance = (parseFloat(stitch.price) || 0) - (parseFloat(stitch.paidAmount) || 0);
  const formattedPrice = formatSaudiRiyal(stitch.price || 0);
  const formattedPaid = formatSaudiRiyal(stitch.paidAmount || 0);
  const formattedBalance = formatSaudiRiyal(balance);
  const formattedIssueDate = formatDisplayDate(stitch.createdAt || new Date(), locale);
  const formattedDueDate = formatDisplayDate(stitch.dueDate, locale);
  const measurementImageBase = stitch.measurementImage
    ? (typeof resolveUploadsUrl === 'function' ? resolveUploadsUrl(stitch.measurementImage) : stitch.measurementImage)
    : '';
  const measurementImageSrc = measurementImageBase
    ? `${measurementImageBase}${stitch.measurementImageUpdatedAt ? `${measurementImageBase.includes('?') ? '&' : '?'}v=${stitch.measurementImageUpdatedAt}` : ''}`
    : '';

  const infoCards = [
    { label: getLabel('customer'), value: resolveLangValue({ en: customerNameEn, ar: customerNameAr }) },
    { label: getLabel('phone'), value: stitch.customerId?.phone || '-' },
    { label: getLabel('dueDate'), value: formattedDueDate },
    { label: getLabel('status'), value: getStatusLabel(stitch.status) }
  ];

  if (stitch.oldInvoiceNumber) {
    infoCards.push({ label: getLabel('oldInvoice'), value: stitch.oldInvoiceNumber });
  }

  const notesHtml = stitch.notes
    ? escapeHtml(stitch.notes).replace(/\n/g, '<br />')
    : '';

  const printWindow = window.open('', '_blank', 'width=960,height=1280');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="${dir}">
    <head>
      <title>${escapeHtml(getLabel('invoice'))}</title>
      <style>
        @page { size: A4; margin: 12mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; background: #ffffff; color: #0f172a; direction: ${dir}; }
        .sheet { width: 100%; max-width: 186mm; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 24px; padding: 24px; }
        .header { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; border-bottom: 1px solid #e5e7eb; padding-bottom: 18px; }
        .brand { display: flex; gap: 16px; align-items: flex-start; flex: 1; }
        .logo { width: 76px; height: 76px; object-fit: contain; border-radius: 18px; background: #f8fafc; border: 1px solid #e5e7eb; padding: 8px; }
        .brand-text { text-align: ${align}; }
        .business-name { font-size: 24px; font-weight: 700; line-height: 1.2; }
        .business-name-ar { font-size: 18px; color: #334155; margin-top: 4px; }
        .business-address { font-size: 13px; color: #64748b; margin-top: 8px; max-width: 420px; line-height: 1.5; }
        .meta-card { min-width: 250px; border: 1px solid #e5e7eb; background: #f8fafc; border-radius: 20px; padding: 16px 18px; }
        .invoice-title { font-size: 26px; font-weight: 800; margin-bottom: 16px; text-align: ${align}; }
        .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .meta-item { border-radius: 16px; background: #ffffff; border: 1px solid #e5e7eb; padding: 12px; }
        .meta-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
        .meta-value { margin-top: 6px; font-size: 15px; font-weight: 700; word-break: break-word; }
        .info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
        .info-card { border: 1px solid #e5e7eb; border-radius: 18px; padding: 14px 16px; background: #ffffff; min-height: 84px; }
        .info-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
        .info-value { margin-top: 8px; font-size: 16px; font-weight: 700; line-height: 1.4; word-break: break-word; }
        .table-wrap { margin-top: 20px; border: 1px solid #e5e7eb; border-radius: 20px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        thead { background: #f8fafc; }
        th, td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; text-align: ${align}; }
        th { font-size: 12px; color: #475569; font-weight: 700; }
        td { font-size: 15px; font-weight: 700; }
        tbody tr:last-child td { border-bottom: 0; }
        .amount { white-space: nowrap; }
        .pending { color: ${balance > 0 ? '#b45309' : '#15803d'}; }
        .notes { margin-top: 20px; border: 1px solid #e5e7eb; border-radius: 18px; background: #fffbeb; padding: 16px; }
        .notes-label { font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; }
        .notes-value { margin-top: 10px; font-size: 14px; line-height: 1.7; color: #451a03; white-space: normal; word-break: break-word; }
        .measurement-photo { margin-top: 20px; border: 1px solid #e5e7eb; border-radius: 20px; background: #ffffff; padding: 16px; }
        .measurement-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; margin-bottom: 12px; }
        .measurement-photo img { width: 100%; max-height: 320px; object-fit: cover; border-radius: 16px; display: block; }
        .footer { margin-top: 20px; display: flex; justify-content: space-between; gap: 16px; align-items: stretch; }
        .footer-note { flex: 1; border: 1px solid #e5e7eb; border-radius: 20px; padding: 16px; background: #f8fafc; display: flex; align-items: center; font-size: 14px; color: #334155; }
        .qr-grid { display: flex; gap: 12px; }
        .qr-box { width: 132px; border: 1px solid #e5e7eb; border-radius: 20px; background: #ffffff; padding: 12px; text-align: center; }
        .qr-box img { width: 96px; height: 96px; display: block; margin: 0 auto; }
        .qr-title { margin-top: 10px; font-size: 11px; font-weight: 700; color: #334155; line-height: 1.4; }
        .currency { display: inline-flex; align-items: center; gap: 4px; }
        @media print {
          body { background: #ffffff; }
          .sheet { border: 0; border-radius: 0; padding: 0; max-width: none; }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="header">
          <div class="brand">
            ${logoSrc ? `<img src="${escapeHtml(logoSrc)}" class="logo" alt="Logo" />` : ''}
            <div class="brand-text">
              <div class="business-name">${escapeHtml(resolveLangValue({ en: businessNameEn, ar: businessNameAr, fallback: 'Tailor Shop' }))}</div>
              ${isArabic && businessNameAr ? `<div class="business-name-ar">${escapeHtml(businessNameAr)}</div>` : ''}
              ${user?.businessAddress ? `<div class="business-address">${escapeHtml(user.businessAddress)}</div>` : ''}
            </div>
          </div>

          <div class="meta-card">
            <div class="invoice-title">${escapeHtml(getLabel('invoice'))}</div>
            <div class="meta-grid">
              <div class="meta-item">
                <div class="meta-label">${escapeHtml(getLabel('invoiceNumber'))}</div>
                <div class="meta-value">#${escapeHtml(stitch.receiptNumber || stitch._id?.slice(-6) || 'N/A')}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">${escapeHtml(getLabel('issueDate'))}</div>
                <div class="meta-value">${escapeHtml(formattedIssueDate)}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="info-grid">
          ${infoCards.map((item) => `
            <div class="info-card">
              <div class="info-label">${escapeHtml(item.label)}</div>
              <div class="info-value">${escapeHtml(item.value)}</div>
            </div>
          `).join('')}
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(getLabel('quantity'))}</th>
                <th>${escapeHtml(getLabel('price'))}</th>
                <th>${escapeHtml(getLabel('paid'))}</th>
                <th>${escapeHtml(getLabel('pending'))}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${escapeHtml(String(stitch.quantity || 1))}</td>
                <td class="amount"><span class="currency">${sarSvg}${escapeHtml(formattedPrice)}</span></td>
                <td class="amount"><span class="currency">${sarSvg}${escapeHtml(formattedPaid)}</span></td>
                <td class="amount pending"><span class="currency">${sarSvg}${escapeHtml(formattedBalance)}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        ${notesHtml ? `
          <div class="notes">
            <div class="notes-label">${escapeHtml(getLabel('notes'))}</div>
            <div class="notes-value">${notesHtml}</div>
          </div>
        ` : ''}

        ${measurementImageSrc ? `
          <div class="measurement-photo">
            <div class="measurement-label">${escapeHtml(getLabel('measurementImage'))}</div>
            <img src="${escapeHtml(measurementImageSrc)}" alt="Measurement" />
          </div>
        ` : ''}

        <div class="footer">
          <div class="footer-note">${escapeHtml(getLabel('scanToTrack'))}</div>
          ${(zatcaQrUrl || qrCodeUrl) ? `
            <div class="qr-grid">
              ${zatcaQrUrl ? `
                <div class="qr-box">
                  <img src="${zatcaQrUrl}" alt="ZATCA QR" />
                  <div class="qr-title">${escapeHtml(getLabel('electronicInvoice'))}</div>
                </div>
              ` : ''}
              ${qrCodeUrl ? `
                <div class="qr-box">
                  <img src="${qrCodeUrl}" alt="Track QR" />
                  <div class="qr-title">${escapeHtml(getLabel('scanToTrack'))}</div>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `);

  printWindow.document.close();
};

export default printStitchingInvoice;
