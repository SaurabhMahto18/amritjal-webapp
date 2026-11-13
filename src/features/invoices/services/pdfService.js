
const LOST_JAR_RATES = {
  capsule: 200,
  thermal: 600,
  dispenser: 150,
};

const DEFAULT_SETTINGS = {
  businessName: "AMRIT JAL",
  address: "",
  phone: "",
  email: "",
  logoUrl: "",
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  ifsc: "",
  upiId: "",
  paymentQrUrl: "",
  signatureUrl: "",
  ownerName: "",
  invoicePrefix: "INV",
  paymentTerms: "Please pay the outstanding balance promptly.",
  footerNote: "Thank you for choosing Amrit Jal.",
  currency: "INR",
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value, options = {}) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: options.month || "short",
    year: options.year === false ? undefined : "numeric",
  });
};

const getValue = (...values) =>
  values.find((value) => value !== undefined && value !== null);

const number = (...values) => {
  const value = getValue(...values);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCustomer = (invoice) =>
  invoice?.customer || invoice?.customers || {};

const getBusiness = (invoice) =>
  invoice?.business ||
  invoice?.businesses ||
  invoice?.businessSettings ||
  invoice?.business_settings ||
  {};

const getSettings = (invoice) => {
  const business = getBusiness(invoice);

  const suppliedSettings =
    invoice?.settings ||
    invoice?.invoiceSettings ||
    invoice?.invoice_settings ||
    business?.settings ||
    {};

  return {
    ...DEFAULT_SETTINGS,
    ...business,
    ...suppliedSettings,

    businessName:
      suppliedSettings.businessName ||
      suppliedSettings.business_name ||
      business.businessName ||
      business.business_name ||
      business.name ||
      DEFAULT_SETTINGS.businessName,

    address:
      suppliedSettings.address ||
      suppliedSettings.businessAddress ||
      suppliedSettings.business_address ||
      business.address ||
      "",

    phone:
      suppliedSettings.phone ||
      suppliedSettings.contactNumber ||
      suppliedSettings.contact_number ||
      business.phone ||
      business.contact_number ||
      "",

    email: suppliedSettings.email || business.email || "",

    logoUrl:
      suppliedSettings.logoUrl ||
      suppliedSettings.logo_url ||
      business.logo_url ||
      "",

    bankName:
      suppliedSettings.bankName ||
      suppliedSettings.bank_name ||
      business.bank_name ||
      "",

    accountHolder:
      suppliedSettings.accountHolder ||
      suppliedSettings.account_holder ||
      business.account_holder ||
      "",

    accountNumber:
      suppliedSettings.accountNumber ||
      suppliedSettings.account_number ||
      business.account_number ||
      "",

    ifsc:
      suppliedSettings.ifsc ||
      suppliedSettings.ifscCode ||
      suppliedSettings.ifsc_code ||
      business.ifsc ||
      business.ifsc_code ||
      "",

    upiId:
      suppliedSettings.upiId ||
      suppliedSettings.upi_id ||
      business.upi_id ||
      "",

    paymentQrUrl:
      suppliedSettings.paymentQrUrl ||
      suppliedSettings.payment_qr_url ||
      business.payment_qr_url ||
      "",

    signatureUrl:
      suppliedSettings.signatureUrl ||
      suppliedSettings.signature_url ||
      business.signature_url ||
      "",

    ownerName:
      suppliedSettings.ownerName ||
      suppliedSettings.owner_name ||
      business.owner_name ||
      "",

    invoicePrefix:
      suppliedSettings.invoicePrefix ||
      suppliedSettings.invoice_prefix ||
      DEFAULT_SETTINGS.invoicePrefix,

    paymentTerms:
      suppliedSettings.paymentTerms ||
      suppliedSettings.payment_terms ||
      DEFAULT_SETTINGS.paymentTerms,

    footerNote:
      suppliedSettings.footerNote ||
      suppliedSettings.footer_note ||
      DEFAULT_SETTINGS.footerNote,
  };
};

const getInvoiceNumber = (invoice, settings) => {
  const existing = getValue(
    invoice?.invoiceNumber,
    invoice?.invoice_number,
    invoice?.invoice_no
  );

  if (existing) return existing;

  const id = invoice?.id;

  if (id) {
    return `${settings.invoicePrefix}-${String(id)
      .slice(0, 8)
      .toUpperCase()}`;
  }

  return "—";
};

const getInvoiceItems = (invoice) => {
  const items = getValue(
    invoice?.items,
    invoice?.invoice_items,
    invoice?.invoiceItems
  );

  return Array.isArray(items) ? items : [];
};

const getLostJarItems = (invoice) => {
  if (Array.isArray(invoice?.lostJarItems)) {
    return invoice.lostJarItems
      .map((item) => ({
        label: item.label || item.name || "Lost jar",
        quantity: number(item.quantity, item.qty),
        rate: number(item.rate, item.unitPrice),
        amount: number(
          item.amount,
          number(item.quantity, item.qty) *
          number(item.rate, item.unitPrice)
        ),
      }))
      .filter((item) => item.quantity > 0);
  }

  const definitions = [
    {
      label: "Capsule Jar",
      quantity: number(
        invoice?.capsuleJarLostQty,
        invoice?.capsule_jar_lost_qty
      ),
      rate: LOST_JAR_RATES.capsule,
    },
    {
      label: "Thermal Jar",
      quantity: number(
        invoice?.thermalJarLostQty,
        invoice?.thermal_jar_lost_qty
      ),
      rate: LOST_JAR_RATES.thermal,
    },
    {
      label: "Dispenser Jar",
      quantity: number(
        invoice?.dispenserJarLostQty,
        invoice?.dispenser_jar_lost_qty
      ),
      rate: LOST_JAR_RATES.dispenser,
    },
  ];

  return definitions
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      ...item,
      amount: item.quantity * item.rate,
    }));
};

const getBillingMonth = (invoice) => {
  const startValue = getValue(
    invoice?.periodStart,
    invoice?.period_start,
    invoice?.invoiceDate,
    invoice?.invoice_date
  );

  const start = startValue ? new Date(startValue) : new Date();

  if (Number.isNaN(start.getTime())) {
    return { year: new Date().getFullYear(), month: new Date().getMonth() };
  }

  return {
    year: start.getFullYear(),
    month: start.getMonth(),
  };
};

const getMonthlyRegister = (invoice) => {
  const { year, month } = getBillingMonth(invoice);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const deliveryRecords = getValue(
    invoice?.deliveries,
    invoice?.dailyDeliveries,
    invoice?.daily_deliveries,
    invoice?.deliveryRecords,
    invoice?.delivery_records
  );

  const items = getInvoiceItems(invoice);

  const sourceRecords = Array.isArray(deliveryRecords)
    ? deliveryRecords
    : items;

  const byDate = new Map();

  sourceRecords.forEach((record) => {
    const dateValue = getValue(
      record.deliveryDate,
      record.delivery_date,
      record.date
    );

    if (!dateValue) return;

    const date = new Date(dateValue);

    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month
    ) {
      return;
    }

    const day = date.getDate();

    const delivered = number(
      record.delivered,
      record.delivered_quantity,
      record.delivered_qty,
      record.jar_quantity,
      record.quantity,
      record.deliveryQuantity
    );

    const returned = number(
      record.returned,
      record.returned_quantity,
      record.returned_qty,
      record.jar_returned,
      record.returnQuantity
    );

    const existing = byDate.get(day) || {
      delivered: 0,
      returned: 0,
    };

    existing.delivered += delivered;
    existing.returned += returned;

    byDate.set(day, existing);
  });

  const rows = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const counts = byDate.get(day) || {
      delivered: 0,
      returned: 0,
    };

    rows.push({
      day,
      date: new Date(year, month, day),
      delivered: counts.delivered,
      returned: counts.returned,
      net: counts.delivered - counts.returned,
    });
  }

  const totals = rows.reduce(
    (sum, row) => ({
      delivered: sum.delivered + row.delivered,
      returned: sum.returned + row.returned,
      net: sum.net + row.net,
    }),
    { delivered: 0, returned: 0, net: 0 }
  );

  return { rows, totals, year, month };
};

const getFinancials = (invoice) => {
  const items = getInvoiceItems(invoice);
  const lostJarItems = getLostJarItems(invoice);

  const itemSubtotal = items.reduce(
    (sum, item) =>
      sum +
      number(
        item.amount,
        number(item.quantity, item.jar_quantity) *
        number(item.rate, item.jar_rate)
      ),
    0
  );

  const lostJarSubtotal = lostJarItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const subtotal = number(
    invoice?.subtotal,
    invoice?.deliverySubtotal,
    invoice?.delivery_subtotal,
    itemSubtotal
  );

  const additionalCharges = number(
    invoice?.additionalCharges,
    invoice?.additional_charges,
    lostJarSubtotal
  );

  const discount = number(
    invoice?.discount,
    invoice?.discountAmount,
    invoice?.discount_amount
  );

  const total = number(
    invoice?.totalAmount,
    invoice?.total_amount,
    Math.max(0, subtotal + additionalCharges - discount)
  );

  const paid = number(
    invoice?.paidAmount,
    invoice?.paid_amount
  );

  return {
    items,
    lostJarItems,
    subtotal,
    additionalCharges,
    discount,
    total,
    paid,
    due: Math.max(0, total - paid),
    itemSubtotal,
    lostJarSubtotal,
  };
};

const customerName = (customer) =>
  customer?.name ||
  customer?.customer_name ||
  customer?.full_name ||
  "Customer";

const customerPhone = (customer) =>
  customer?.phone ||
  customer?.mobile ||
  customer?.phone_number ||
  "";

const customerAddress = (customer) =>
  customer?.address ||
  customer?.full_address ||
  customer?.billing_address ||
  "";

const renderRegister = (register) => `
  <table class="register-table">
    <thead>
      <tr>
        <th>Date</th>
        <th class="num">Del.</th>
        <th class="num">Ret.</th>
        <th class="num">Net</th>
      </tr>
    </thead>
    <tbody>
      ${register.rows
    .map(
      (row) => `
            <tr>
              <td>${formatDate(row.date, { year: false })}</td>
              <td class="num">${row.delivered}</td>
              <td class="num">${row.returned}</td>
              <td class="num">${row.net}</td>
            </tr>
          `
    )
    .join("")}
      <tr class="total-row">
        <td>Monthly total</td>
        <td class="num">${register.totals.delivered}</td>
        <td class="num">${register.totals.returned}</td>
        <td class="num">${register.totals.net}</td>
      </tr>
    </tbody>
  </table>
`;

const renderDeliveryItems = (items) => `
  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Date</th>
        <th class="num">Qty</th>
        <th class="num">Rate</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.length
    ? items
      .map((item) => {
        const qty = number(
          item.quantity,
          item.jar_quantity
        );
        const rate = number(item.rate, item.jar_rate);
        const amount = number(item.amount, qty * rate);

        return `
                  <tr>
                    <td>${escapeHtml(
          item.description || "Water jar delivery"
        )}</td>
                    <td>${formatDate(
          getValue(
            item.deliveryDate,
            item.delivery_date
          )
        )}</td>
                    <td class="num">${qty}</td>
                    <td class="num">${money(rate)}</td>
                    <td class="num">${money(amount)}</td>
                  </tr>
                `;
      })
      .join("")
    : `<tr><td colspan="5" class="empty-cell">No delivery line items recorded.</td></tr>`
  }
    </tbody>
  </table>
`;

const renderLostJarItems = (items) => `
  <table class="items-table">
    <thead>
      <tr>
        <th>Lost jar type</th>
        <th class="num">Qty</th>
        <th class="num">Rate</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.length
    ? items
      .map(
        (item) => `
                  <tr>
                    <td>${escapeHtml(item.label)}</td>
                    <td class="num">${item.quantity}</td>
                    <td class="num">${money(item.rate)}</td>
                    <td class="num">${money(item.amount)}</td>
                  </tr>
                `
      )
      .join("")
    : `<tr><td colspan="4" class="empty-cell">No lost jar charges.</td></tr>`
  }
    </tbody>
  </table>
`;

const renderPaymentSummary = (financials) => `
  <div class="payment-summary">
    <h3>Payment Summary</h3>
    <div class="summary-row">
      <span>Delivery subtotal</span>
      <strong>${money(financials.subtotal)}</strong>
    </div>
    <div class="summary-row">
      <span>Additional charges</span>
      <strong>${money(financials.additionalCharges)}</strong>
    </div>
    <div class="summary-row">
      <span>Discount</span>
      <strong>− ${money(financials.discount)}</strong>
    </div>
    <div class="summary-row">
      <span>Amount paid</span>
      <strong>${money(financials.paid)}</strong>
    </div>
    <div class="summary-row final-row">
      <span>Invoice amount</span>
      <strong>${money(financials.total)}</strong>
    </div>
    <div class="summary-row due-row">
      <span>Final balance due</span>
      <strong>${money(financials.due)}</strong>
    </div>
  </div>
`;

const renderPaymentDetails = (settings) => {
  const bankLines = [
    settings.bankName
      ? `<div><strong>Bank name:</strong> ${escapeHtml(settings.bankName)}</div>`
      : "",
    settings.accountHolder
      ? `<div><strong>Account holder:</strong> ${escapeHtml(settings.accountHolder)}</div>`
      : "",
    settings.accountNumber
      ? `<div><strong>Account number:</strong> ${escapeHtml(settings.accountNumber)}</div>`
      : "",
    settings.ifsc
      ? `<div><strong>IFSC:</strong> ${escapeHtml(settings.ifsc)}</div>`
      : "",
    settings.upiId
      ? `<div><strong>UPI ID:</strong> ${escapeHtml(settings.upiId)}</div>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  return `
    <section class="payment-details avoid-break">
      <h3>Bank Details &amp; QR Payment</h3>
      <div class="payment-details-grid">
        <div class="qr-column">
          ${settings.paymentQrUrl
      ? `<img class="payment-qr" src="${escapeHtml(
        settings.paymentQrUrl
      )}" alt="Payment QR" />`
      : `<div class="qr-placeholder">Payment QR<br/>Not configured</div>`
    }
          ${settings.upiId
      ? `<div class="small-text">${escapeHtml(settings.upiId)}</div>`
      : ""
    }
        </div>
        <div class="bank-column">
          ${bankLines ||
    `<div class="muted">Bank and payment details can be configured in Settings.</div>`
    }
        </div>
      </div>
    </section>
  `;
};

const renderSignature = (settings) => `
  <section class="signature-section avoid-break">
    <div class="acknowledgement">
      <div class="signature-line"></div>
      <strong>Customer acknowledgement</strong>
    </div>
    <div class="owner-signature">
      ${settings.signatureUrl
    ? `<img class="signature-image" src="${escapeHtml(
      settings.signatureUrl
    )}" alt="Authorized signature" />`
    : `<div class="signature-space"></div>`
  }
      <div class="signature-line"></div>
      <strong>Owner / Authorized Signature</strong>
      ${settings.ownerName
    ? `<div class="small-text">${escapeHtml(settings.ownerName)}</div>`
    : ""
  }
    </div>
  </section>
`;

const renderStyles = (mode) => {
  const thermal = mode === "thermal";

  return `
    @page {
      size: ${thermal ? "80mm auto" : "A4"};
      margin: ${thermal ? "4mm" : "12mm"};
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #111;
      font-family: Arial, Helvetica, sans-serif;
      font-size: ${thermal ? "10px" : "11px"};
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      padding: ${thermal ? "0" : "0"};
    }

    .invoice {
      width: 100%;
      max-width: ${thermal ? "72mm" : "186mm"};
      margin: 0 auto;
      background: #fff;
    }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 14px;
      border-bottom: 2px solid #111;
    }

    .brand {
      min-width: 0;
    }

    .logo {
      max-width: 110px;
      max-height: 56px;
      object-fit: contain;
      margin-bottom: 5px;
    }

    .brand h1 {
      font-size: ${thermal ? "18px" : "25px"};
      letter-spacing: 1.3px;
      margin: 0;
      font-weight: 800;
    }

    .brand p, .muted {
      color: #555;
      margin: 3px 0 0;
      overflow-wrap: anywhere;
    }

    .invoice-title {
      text-align: right;
      flex-shrink: 0;
    }

    .invoice-title h2 {
      margin: 0;
      font-size: ${thermal ? "13px" : "17px"};
      letter-spacing: .5px;
    }

    .invoice-title p {
      margin: 4px 0 0;
    }

    .section {
      margin-top: 17px;
    }

    .section h3, .payment-summary h3, .payment-details h3 {
      font-size: ${thermal ? "11px" : "13px"};
      margin: 0 0 9px;
      font-weight: 800;
    }

    .customer-grid {
      display: grid;
      grid-template-columns: ${thermal ? "1fr" : "1.2fr 1fr"};
      gap: 12px;
      border-bottom: 1px solid #bbb;
      padding-bottom: 14px;
    }

    .label {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .8px;
      color: #555;
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .customer-name {
      font-size: 14px;
      font-weight: 800;
      overflow-wrap: anywhere;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin-top: 14px;
    }

    .summary-card {
      border: 1px solid #ccc;
      padding: 9px;
      border-radius: 4px;
      min-width: 0;
    }

    .summary-card .label {
      margin-bottom: 4px;
    }

    .summary-card strong {
      font-size: ${thermal ? "11px" : "14px"};
      overflow-wrap: anywhere;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    th, td {
      padding: ${thermal ? "4px 2px" : "6px 7px"};
      border-bottom: 1px solid #ddd;
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
    }

    th {
      background: #f0f0f0 !important;
      border-top: 1px solid #aaa;
      border-bottom: 1px solid #aaa;
      font-weight: 800;
      font-size: ${thermal ? "9px" : "10px"};
    }

    td {
      font-size: ${thermal ? "9px" : "10.5px"};
    }

    .num {
      text-align: right;
      white-space: nowrap;
    }

    .total-row td {
      font-weight: 800;
      border-top: 1px solid #777;
      border-bottom: 2px solid #111;
    }

    .empty-cell {
      text-align: center;
      color: #666;
      padding: 12px 4px;
    }

    .note {
      color: #555;
      font-size: 9px;
      margin-top: 8px;
    }

    .payment-summary {
      margin-top: 17px;
      padding-top: 12px;
      border-top: 1px solid #999;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }

    .summary-row strong {
      text-align: right;
      white-space: nowrap;
    }

    .final-row {
      font-weight: 800;
      border-top: 1px solid #999;
      margin-top: 5px;
      padding-top: 9px;
    }

    .due-row {
      font-size: ${thermal ? "12px" : "14px"};
      font-weight: 800;
      border-bottom: 2px solid #111;
      padding: 9px 0;
    }

    .payment-details {
      margin-top: 18px;
      padding-top: 12px;
      border-top: 1px solid #999;
    }

    .payment-details-grid {
      display: grid;
      grid-template-columns: ${thermal ? "1fr" : "105px 1fr"};
      gap: 14px;
      align-items: center;
    }

    .qr-column {
      text-align: center;
      overflow-wrap: anywhere;
    }

    .payment-qr {
      width: ${thermal ? "100px" : "82px"};
      height: ${thermal ? "100px" : "82px"};
      object-fit: contain;
      display: block;
      margin: 0 auto 5px;
    }

    .qr-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${thermal ? "100px" : "82px"};
      height: ${thermal ? "100px" : "82px"};
      border: 1px dashed #999;
      color: #666;
      font-size: 9px;
      text-align: center;
      margin: 0 auto 5px;
    }

    .bank-column > div {
      margin: 4px 0;
      overflow-wrap: anywhere;
    }

    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: end;
      margin-top: 30px;
    }

    .signature-line {
      border-top: 1px solid #444;
      margin-top: 30px;
      padding-top: 6px;
    }

    .owner-signature {
      text-align: center;
    }

    .signature-space {
      height: 30px;
    }

    .signature-image {
      max-width: 130px;
      max-height: 45px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }

    .small-text {
      font-size: 9px;
      color: #555;
      overflow-wrap: anywhere;
    }

    .footer {
      border-top: 1px solid #bbb;
      margin-top: 20px;
      padding-top: 9px;
      text-align: center;
      color: #555;
      font-size: 9px;
    }

    .avoid-break {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .register-section {
      break-inside: auto;
    }

    .register-table thead {
      display: table-header-group;
    }

    .register-table tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    ${thermal
      ? `
          .header {
            display: block;
          }
          .invoice-title {
            text-align: left;
            margin-top: 10px;
          }
          .summary-cards {
            grid-template-columns: 1fr;
          }
          .signature-section {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .signature-section .signature-line {
            margin-top: 20px;
          }
        `
      : `
          @media screen {
            body {
              background: #e8ebef;
              padding: 20px;
            }
            .invoice {
              background: white;
              padding: 15mm;
              box-shadow: 0 3px 18px rgba(0,0,0,.12);
            }
          }
        `
    }

    @media print {
      body {
        background: white !important;
      }
      .invoice {
        max-width: none;
        box-shadow: none !important;
        padding: 0 !important;
      }
      th {
        background: #f0f0f0 !important;
      }
      a {
        color: inherit;
        text-decoration: none;
      }
    }
  `;
};

const buildInvoiceHtml = (invoice, options = {}) => {
  const mode = options.mode || "standard";
  const detailed = mode === "detailed";
  const thermal = mode === "thermal";

  const settings = getSettings(invoice);
  const customer = getCustomer(invoice);
  const financials = getFinancials(invoice);
  const register = getMonthlyRegister(invoice);

  const invoiceDate = getValue(
    invoice?.invoiceDate,
    invoice?.invoice_date
  );

  const billingMonth = new Date(
    register.year,
    register.month,
    1
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const logo = settings.logoUrl
    ? `<img class="logo" src="${escapeHtml(
      settings.logoUrl
    )}" alt="Business logo" />`
    : "";

  const addressLine = [
    settings.address,
    settings.phone,
    settings.email,
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join(" · ");

  const customerDetails = [
    customerPhone(customer),
    customerAddress(customer),
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join("<br/>");

  const summary = `
    <div class="summary-cards">
      <div class="summary-card">
        <div class="label">Invoice amount</div>
        <strong>${money(financials.total)}</strong>
      </div>
      <div class="summary-card">
        <div class="label">Paid</div>
        <strong>${money(financials.paid)}</strong>
      </div>
      <div class="summary-card">
        <div class="label">Due</div>
        <strong>${money(financials.due)}</strong>
      </div>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
      <title>${escapeHtml(
        getInvoiceNumber(invoice, settings)
      )}</title>

        <style>${renderStyles(mode)}</style>
      </head>
      <body>
        <main class="invoice">
          <header class="header">
            <div class="brand">
              ${logo}
              <h1>${escapeHtml(settings.businessName)}</h1>
              ${addressLine
      ? `<p>${addressLine}</p>`
      : `<p class="muted">Business address · Contact number</p>`
    }
            </div>
            <div class="invoice-title">
              <h2>${thermal ? "RECEIPT" : "MONTHLY INVOICE"}</h2>
              <p><strong>Invoice:</strong> ${escapeHtml(
      getInvoiceNumber(invoice, settings)
    )}</p>
              <p><strong>Billing month:</strong> ${escapeHtml(
      billingMonth
    )}</p>
              <p><strong>Invoice date:</strong> ${formatDate(
      invoiceDate
    )}</p>
            </div>
          </header>

          <section class="section customer-grid">
            <div>
              <div class="label">Customer</div>
              <div class="customer-name">${escapeHtml(
      customerName(customer)
    )}</div>
              <div class="muted">${customerDetails || "Phone · Address"}</div>
            </div>
            <div>
              <div class="label">Invoice summary</div>
              <div><strong>Invoice amount:</strong> ${money(
      financials.total
    )}</div>
              <div><strong>Paid:</strong> ${money(
      financials.paid
    )} · <strong>Due:</strong> ${money(
      financials.due
    )}</div>
            </div>
          </section>

          ${!thermal
      ? summary
      : ""
    }

          ${!thermal
      ? `
                <section class="section register-section">
                  <h3>Daily Delivery &amp; Jar Return Register</h3>
                  ${renderRegister(register)}
                  <p class="note">Register generated from the delivery and return records available for this invoice period.</p>
                </section>
              `
      : ""
    }

          ${detailed
      ? `
                <section class="section">
                  <h3>Delivery Line Items</h3>
                  ${renderDeliveryItems(financials.items)}
                </section>
                <section class="section">
                  <h3>Lost Jar Charges</h3>
                  ${renderLostJarItems(financials.lostJarItems)}
                </section>
              `
      : ""
    }

          ${thermal
      ? `
                <section class="section">
                  <h3>Items</h3>
                  ${renderDeliveryItems(financials.items)}
                </section>
                ${financials.lostJarItems.length
        ? `
                      <section class="section">
                        <h3>Lost Jar Charges</h3>
                        ${renderLostJarItems(financials.lostJarItems)}
                      </section>
                    `
        : ""
      }
              `
      : ""
    }

          ${renderPaymentSummary(financials)}
          ${renderPaymentDetails(settings)}
          ${renderSignature(settings)}

          ${invoice?.notes
      ? `<section class="section"><h3>Notes</h3><div>${escapeHtml(
        invoice.notes
      ).replace(/\n/g, "<br/>")}</div></section>`
      : ""
    }

          ${settings.paymentTerms
      ? `<section class="section"><strong>Payment terms:</strong> ${escapeHtml(
        settings.paymentTerms
      )}</section>`
      : ""
    }

          <footer class="footer">
            ${escapeHtml(settings.footerNote)}
          </footer>
        </main>
        <script>
          window.addEventListener("load", function () {
            const images = Array.from(document.images);
            Promise.all(images.map(function (image) {
              if (image.complete) return Promise.resolve();
              return new Promise(function (resolve) {
                image.onload = resolve;
                image.onerror = resolve;
              });
            })).then(function () {
              setTimeout(function () {
                window.focus();
                window.print();
              }, 250);
            });
          });
        </script>
      </body>
    </html>
  `;
};

const openPrintWindow = (invoice, options = {}) => {
  if (!invoice) {
    throw new Error("Invoice data is missing.");
  }

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    throw new Error(
      "The print window was blocked. Please allow pop-ups for this site and try again."
    );
  }

  const html = buildInvoiceHtml(invoice, options);

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  return printWindow;
};

const printInvoice = (invoice, options = {}) =>
  openPrintWindow(invoice, options);

const downloadStandardPdf = (invoice) =>
  printInvoice(invoice, { mode: "standard" });

const downloadDetailedPdf = (invoice) =>
  printInvoice(invoice, { mode: "detailed" });

const printThermalReceipt = (invoice) =>
  printInvoice(invoice, { mode: "thermal" });

export {
  LOST_JAR_RATES,
  buildInvoiceHtml,
  downloadStandardPdf,
  downloadDetailedPdf,
  printInvoice,
  printThermalReceipt,
};

export default {
  LOST_JAR_RATES,
  buildInvoiceHtml,
  downloadStandardPdf,
  downloadDetailedPdf,
  printInvoice,
  printThermalReceipt,
};
