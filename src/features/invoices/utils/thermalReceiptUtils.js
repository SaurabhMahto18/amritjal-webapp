
import { buildReceiptDocument } from "../services/printer/escPosService.js";

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatThermalCurrency(value, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(number(value));
}

export function formatThermalDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function clean(value, fallback = "-") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function addText(sections, text, type = "text") {
  if (text !== null && text !== undefined && text !== "") {
    sections.push({ type, text: String(text) });
  }
}

function addSeparator(sections) {
  sections.push({ type: "separator", character: "-" });
}

function addColumns(sections, left, right) {
  sections.push({
    type: "columns",
    left: String(left ?? ""),
    right: String(right ?? ""),
  });
}

function getItemQuantity(item) {
  return number(
    item.quantity ??
    item.jar_quantity ??
    item.qty ??
    0
  );
}

function getItemRate(item) {
  return number(
    item.rate ??
    item.jar_rate ??
    item.price ??
    0
  );
}

function getItemAmount(item) {
  const amount = item.amount ?? item.total ?? item.line_total;

  if (amount !== null && amount !== undefined) {
    return number(amount);
  }

  return getItemQuantity(item) * getItemRate(item);
}

/**
 * Expected normalized input:
 *
 * {
 *   business: { name, phone, address, gstin },
 *   invoice: {
 *     invoice_number, invoice_date, billing_period,
 *     subtotal, charges, previous_outstanding,
 *     total, paid_amount, balance_due, notes
 *   },
 *   customer: { name, phone, address, code },
 *   items: [{ name, quantity, rate, amount }],
 *   payment: { method, reference, date },
 *   paperWidth: "58" | "80"
 * }
 */
export function buildThermalReceiptSections({
  business = {},
  invoice = {},
  customer = {},
  items = [],
  payment = {},
  paperWidth = "80",
  currency = "INR",
}) {
  const sections = [];

  const money = (value) =>
    formatThermalCurrency(value, currency);

  // BUSINESS HEADER
  addText(sections, clean(business.name, "AMRIT JAL"), "bold");
  addText(sections, business.address);
  addText(
    sections,
    business.phone ? `Phone: ${business.phone}` : ""
  );

  if (business.gstin) {
    addText(sections, `GSTIN: ${business.gstin}`);
  }

  sections.push({ type: "feed", lines: 1 });
  addSeparator(sections);

  // INVOICE INFORMATION
  addText(sections, "INVOICE", "center");
  addColumns(
    sections,
    "Invoice No.",
    clean(invoice.invoice_number)
  );
  addColumns(
    sections,
    "Date",
    formatThermalDate(invoice.invoice_date || invoice.created_at)
  );

  if (invoice.billing_period) {
    addText(
      sections,
      `Billing Period: ${invoice.billing_period}`
    );
  }

  addSeparator(sections);

  // CUSTOMER INFORMATION
  addText(sections, "CUSTOMER DETAILS", "bold");
  addText(sections, `Name: ${clean(customer.name)}`);

  if (customer.code) {
    addText(sections, `Code: ${customer.code}`);
  }

  if (customer.phone) {
    addText(sections, `Phone: ${customer.phone}`);
  }

  if (customer.address) {
    addText(sections, `Address: ${customer.address}`);
  }

  addSeparator(sections);

  // ITEMS
  addText(sections, "ITEM DETAILS", "bold");

  if (Array.isArray(items) && items.length) {
    items.forEach((item) => {
      const name = clean(item.name || item.product_name, "Item");
      const quantity = getItemQuantity(item);
      const rate = getItemRate(item);
      const amount = getItemAmount(item);

      addText(sections, name, "bold");

      addColumns(
        sections,
        `${quantity} x ${money(rate)}`,
        money(amount)
      );
    });
  } else {
    addText(sections, "No invoice items found.");
  }

  addSeparator(sections);

  // AMOUNTS
  addText(sections, "BILL SUMMARY", "bold");

  addColumns(
    sections,
    "Subtotal",
    money(invoice.subtotal)
  );

  if (number(invoice.charges) !== 0) {
    addColumns(
      sections,
      "Additional Charges",
      money(invoice.charges)
    );
  }

  if (number(invoice.previous_outstanding) !== 0) {
    addColumns(
      sections,
      "Previous Outstanding",
      money(invoice.previous_outstanding)
    );
  }

  if (number(invoice.discount) !== 0) {
    addColumns(
      sections,
      "Discount",
      money(invoice.discount)
    );
  }

  addSeparator(sections);

  addColumns(
    sections,
    "TOTAL",
    money(invoice.total)
  );

  addColumns(
    sections,
    "PAID",
    money(invoice.paid_amount)
  );

  addText(sections, "BALANCE DUE", "bold");
  addText(
    sections,
    money(invoice.balance_due),
    "bold"
  );

  addSeparator(sections);

  // PAYMENT DETAILS
  if (payment.method || payment.reference || payment.date) {
    addText(sections, "PAYMENT DETAILS", "bold");

    if (payment.method) {
      addText(sections, `Method: ${payment.method}`);
    }

    if (payment.reference) {
      addText(sections, `Reference: ${payment.reference}`);
    }

    if (payment.date) {
      addText(
        sections,
        `Payment Date: ${formatThermalDate(payment.date)}`
      );
    }

    addSeparator(sections);
  }

  // NOTES
  if (invoice.notes || invoice.remark) {
    addText(sections, "NOTE", "bold");
    addText(sections, invoice.notes || invoice.remark);
    addSeparator(sections);
  }

  // FOOTER
  addText(sections, "Thank you!", "center");
  addText(sections, "AMRIT JAL", "center");

  return sections;
}

export function createThermalReceiptBytes(options = {}) {
  const paperWidth = String(options.paperWidth || "80");

  const sections = buildThermalReceiptSections({
    ...options,
    paperWidth,
  });

  return buildReceiptDocument({
    paperWidth,
    sections,
    cut: true,
  });
}
