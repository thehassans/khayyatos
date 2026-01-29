const crypto = require('crypto');

// TLV (Tag-Length-Value) encoding for ZATCA QR code (Phase 1)
const TLV_TAGS = {
  SELLER_NAME: 1,
  VAT_NUMBER: 2,
  TIMESTAMP: 3,
  INVOICE_TOTAL: 4,
  VAT_TOTAL: 5,
  INVOICE_HASH: 6,
  ECDSA_SIGNATURE: 7,
  ECDSA_PUBLIC_KEY: 8,
  ECDSA_STAMP_SIGNATURE: 9
};

// Encode a single TLV field
function encodeTLV(tag, value) {
  const valueBuffer = Buffer.from(value, 'utf-8');
  const tagBuffer = Buffer.from([tag]);
  const lengthBuffer = Buffer.from([valueBuffer.length]);
  return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
}

// Generate TLV encoded data for Phase 1 QR code
function generatePhase1TLV(invoiceData) {
  const {
    sellerName,
    vatNumber,
    timestamp,
    invoiceTotal,
    vatTotal
  } = invoiceData;

  const tlvBuffers = [
    encodeTLV(TLV_TAGS.SELLER_NAME, sellerName),
    encodeTLV(TLV_TAGS.VAT_NUMBER, vatNumber),
    encodeTLV(TLV_TAGS.TIMESTAMP, timestamp),
    encodeTLV(TLV_TAGS.INVOICE_TOTAL, invoiceTotal.toString()),
    encodeTLV(TLV_TAGS.VAT_TOTAL, vatTotal.toString())
  ];

  return Buffer.concat(tlvBuffers).toString('base64');
}

// Generate TLV encoded data for Phase 2 QR code (with hash and signature)
function generatePhase2TLV(invoiceData, hash, signature, publicKey) {
  const {
    sellerName,
    vatNumber,
    timestamp,
    invoiceTotal,
    vatTotal
  } = invoiceData;

  const tlvBuffers = [
    encodeTLV(TLV_TAGS.SELLER_NAME, sellerName),
    encodeTLV(TLV_TAGS.VAT_NUMBER, vatNumber),
    encodeTLV(TLV_TAGS.TIMESTAMP, timestamp),
    encodeTLV(TLV_TAGS.INVOICE_TOTAL, invoiceTotal.toString()),
    encodeTLV(TLV_TAGS.VAT_TOTAL, vatTotal.toString()),
    encodeTLV(TLV_TAGS.INVOICE_HASH, hash),
    encodeTLV(TLV_TAGS.ECDSA_SIGNATURE, signature),
    encodeTLV(TLV_TAGS.ECDSA_PUBLIC_KEY, publicKey)
  ];

  return Buffer.concat(tlvBuffers).toString('base64');
}

// Generate invoice hash using SHA-256
function generateInvoiceHash(xmlContent) {
  return crypto.createHash('sha256').update(xmlContent).digest('base64');
}

// Generate UUID for invoice (compatible with older Node versions)
function generateUUID() {
  // Use crypto.randomUUID if available (Node 14.17+), otherwise fallback
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older Node versions
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = crypto.randomBytes(1)[0] % 16;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate Invoice Counter Value (ICV)
function generateICV(counter) {
  return counter.toString().padStart(10, '0');
}

// Generate Previous Invoice Hash (PIH) - for first invoice use zeros
function generatePIH(previousHash = null) {
  if (!previousHash) {
    return Buffer.alloc(32, 0).toString('base64');
  }
  return previousHash;
}

// Format date to ZATCA format (ISO 8601)
function formatZATCADate(date = new Date()) {
  return date.toISOString();
}

// Calculate VAT amount
function calculateVAT(amount, vatRate = 15) {
  return Number((amount * vatRate / 100).toFixed(2));
}

// Invoice types
const INVOICE_TYPES = {
  STANDARD: '388',      // Standard Tax Invoice (B2B)
  SIMPLIFIED: '381',    // Simplified Tax Invoice (B2C)
  DEBIT_NOTE: '383',
  CREDIT_NOTE: '381'
};

// Invoice subtypes
const INVOICE_SUBTYPES = {
  STANDARD: '01',       // Standard
  SIMPLIFIED: '02'      // Simplified
};

// Generate UBL 2.1 XML for ZATCA Phase 2
function generateZATCAXML(invoiceData, settings) {
  const {
    invoiceNumber,
    uuid,
    issueDate,
    issueTime,
    invoiceType,
    invoiceSubtype,
    currency = 'SAR',
    seller,
    buyer,
    lineItems,
    taxTotal,
    invoiceTotal,
    previousInvoiceHash,
    invoiceCounter
  } = invoiceData;

  const icv = generateICV(invoiceCounter);
  const pih = generatePIH(previousInvoiceHash);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${invoiceNumber}</cbc:ID>
  <cbc:UUID>${uuid}</cbc:UUID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${issueTime}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${invoiceSubtype}">${invoiceType}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${currency}</cbc:TaxCurrencyCode>
  
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${icv}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${pih}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${seller.crn || ''}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${seller.street || ''}</cbc:StreetName>
        <cbc:BuildingNumber>${seller.buildingNumber || ''}</cbc:BuildingNumber>
        <cbc:PlotIdentification>${seller.plotId || ''}</cbc:PlotIdentification>
        <cbc:CitySubdivisionName>${seller.district || ''}</cbc:CitySubdivisionName>
        <cbc:CityName>${seller.city || ''}</cbc:CityName>
        <cbc:PostalZone>${seller.postalCode || ''}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>SA</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${seller.vatNumber}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${seller.name}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${buyer ? `
      <cac:PartyIdentification>
        <cbc:ID schemeID="${buyer.idType || 'NAT'}">${buyer.id || ''}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${buyer.street || ''}</cbc:StreetName>
        <cbc:CityName>${buyer.city || ''}</cbc:CityName>
        <cac:Country>
          <cbc:IdentificationCode>${buyer.country || 'SA'}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${buyer.vatNumber || ''}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${buyer.name || ''}</cbc:RegistrationName>
      </cac:PartyLegalEntity>` : ''}
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>10</cbc:PaymentMeansCode>
  </cac:PaymentMeans>
  
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${taxTotal.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${(invoiceTotal - taxTotal).toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${taxTotal.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>15</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${(invoiceTotal - taxTotal).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${(invoiceTotal - taxTotal).toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${invoiceTotal.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${invoiceTotal.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  
  ${lineItems.map((item, index) => `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="PCE">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${currency}">${item.lineTotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${currency}">${item.taxAmount.toFixed(2)}</cbc:TaxAmount>
      <cbc:RoundingAmount currencyID="${currency}">${(item.lineTotal + item.taxAmount).toFixed(2)}</cbc:RoundingAmount>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>${item.name}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>15</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${currency}">${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`).join('')}
</Invoice>`;

  return xml;
}

// Generate CSR (Certificate Signing Request) for ZATCA Phase 2 onboarding
function generateCSRConfig(settings) {
  return {
    commonName: settings.commonName || settings.businessName,
    serialNumber: `1-${settings.businessName}|2-${settings.unitName || 'Main'}|3-${settings.deviceSerialNumber || crypto.randomUUID()}`,
    organizationIdentifier: settings.vatNumber,
    organizationUnitName: settings.unitName || 'Main Branch',
    organizationName: settings.businessName,
    countryName: 'SA',
    invoiceType: settings.invoiceType || '1100', // 1100 for both standard and simplified
    locationAddress: settings.city || 'Riyadh',
    industryBusinessCategory: settings.businessCategory || 'Retail'
  };
}

// ZATCA API endpoints
const ZATCA_ENDPOINTS = {
  SANDBOX: {
    COMPLIANCE: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance',
    COMPLIANCE_CSID: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance/csid',
    PRODUCTION_CSID: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/production/csid',
    REPORTING: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/invoices/reporting/single',
    CLEARANCE: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/invoices/clearance/single'
  },
  SIMULATION: {
    COMPLIANCE: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/compliance',
    COMPLIANCE_CSID: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/compliance/csid',
    PRODUCTION_CSID: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/production/csid',
    REPORTING: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/invoices/reporting/single',
    CLEARANCE: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation/invoices/clearance/single'
  },
  PRODUCTION: {
    COMPLIANCE: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/compliance',
    COMPLIANCE_CSID: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/compliance/csid',
    PRODUCTION_CSID: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/production/csid',
    REPORTING: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/invoices/reporting/single',
    CLEARANCE: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/invoices/clearance/single'
  }
};

module.exports = {
  TLV_TAGS,
  encodeTLV,
  generatePhase1TLV,
  generatePhase2TLV,
  generateInvoiceHash,
  generateUUID,
  generateICV,
  generatePIH,
  formatZATCADate,
  calculateVAT,
  INVOICE_TYPES,
  INVOICE_SUBTYPES,
  generateZATCAXML,
  generateCSRConfig,
  ZATCA_ENDPOINTS
};
