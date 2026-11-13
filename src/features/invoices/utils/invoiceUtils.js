
/**
 * Shared invoice utilities for Amrit Jal.
 * File: src/features/invoices/utils/invoiceUtils.js
 */

/**
 * Format a numeric amount as Indian Rupees.
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

/**
 * Format a date-only string without timezone shifting.
 * Expected input: YYYY-MM-DD
 */
export function formatDate(value) {
  if (!value) return "—";

  const parts = String(value).split("-");

  if (parts.length !== 3) return String(value);

  const [year, month, day] = parts;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Safely convert a value to a finite number.
 */
export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const result = Number(value);

  return Number.isFinite(result) ? result : fallback;
}

/**
 * Calculate the remaining invoice balance.
 */
export function calculateBalance(totalAmount, paidAmount) {
  return Math.max(
    0,
    toNumber(totalAmount) - toNumber(paidAmount)
  );
}

/**
 * Calculate the amount for a delivery.
 * Uses the stored amount when it is present; otherwise,
 * calculates quantity multiplied by rate.
 */
export function calculateDeliveryAmount(delivery) {
  if (!delivery) return 0;

  if (
    delivery.amount !== null &&
    delivery.amount !== undefined &&
    delivery.amount !== ""
  ) {
    return toNumber(delivery.amount);
  }

  return (
    toNumber(delivery.jar_quantity ?? delivery.quantity) *
    toNumber(delivery.jar_rate ?? delivery.rate)
  );
}

/**
 * Calculate the subtotal for invoice line items.
 */
export function calculateItemsSubtotal(items = []) {
  return items.reduce(
    (total, item) => total + toNumber(item.amount),
    0
  );
}

/**
 * Calculate the total charge for lost jars using the configured rates.
 */
export function calculateLostJarCharges({
  thermalQuantity = 0,
  capsuleQuantity = 0,
  dispenserQuantity = 0,
  thermalRate = 600,
  capsuleRate = 200,
  dispenserRate = 150,
} = {}) {
  const thermal = Math.max(0, toNumber(thermalQuantity));
  const capsule = Math.max(0, toNumber(capsuleQuantity));
  const dispenser = Math.max(0, toNumber(dispenserQuantity));

  const thermalAmount = thermal * toNumber(thermalRate);
  const capsuleAmount = capsule * toNumber(capsuleRate);
  const dispenserAmount = dispenser * toNumber(dispenserRate);

  return {
    thermalAmount,
    capsuleAmount,
    dispenserAmount,
    total: thermalAmount + capsuleAmount + dispenserAmount,
  };
}

/**
 * Calculate an invoice total from its components.
 */
export function calculateInvoiceTotal({
  subtotal = 0,
  lostJarCharges = 0,
  additionalCharges = 0,
} = {}) {
  return (
    toNumber(subtotal) +
    toNumber(lostJarCharges) +
    toNumber(additionalCharges)
  );
}

/**
 * Return the remaining balance and a display status.
 *
 * This helper does not determine whether an invoice is overdue,
 * because the current invoice schema has no due-date column.
 */
export function getInvoicePaymentStatus(totalAmount, paidAmount) {
  const total = Math.max(0, toNumber(totalAmount));
  const paid = Math.max(0, toNumber(paidAmount));
  const balance = calculateBalance(total, paid);

  let status = "Unpaid";

  if (total > 0 && paid >= total) {
    status = "Paid";
  } else if (paid > 0 && balance > 0) {
    status = "Partial";
  }

  return {
    total,
    paid,
    balance,
    status,
  };
}

/**
 * Convert a string into a printable invoice number.
 * Example: 102 -> INV-000102
 *
 * This is a display helper only. It does not create or reserve
 * invoice numbers in the database.
 */
export function formatInvoiceNumber(invoiceNumber, prefix = "INV-") {
  if (
    invoiceNumber === null ||
    invoiceNumber === undefined ||
    invoiceNumber === ""
  ) {
    return "—";
  }

  const number = String(invoiceNumber);

  return `${prefix}${number.padStart(6, "0")}`;
}

/**
 * Validate a billing period.
 */
export function validateBillingPeriod(startDate, endDate) {
  if (!startDate || !endDate) {
    return {
      valid: false,
      message: "Select both the billing start and end dates.",
    };
  }

  if (startDate > endDate) {
    return {
      valid: false,
      message: "The billing start date must not be after the end date.",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

/**
 * Validate a non-negative monetary amount.
 */
export function isValidAmount(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return false;
  }

  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0;
}

/**
 * Validate a non-negative whole-number quantity.
 */
export function isValidQuantity(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return false;
  }

  const quantity = Number(value);

  return (
    Number.isInteger(quantity) &&
    quantity >= 0
  );
}
