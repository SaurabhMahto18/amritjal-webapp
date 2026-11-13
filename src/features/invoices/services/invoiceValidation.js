
/**
 * Invoice validation helpers for Amrit Jal.
 * File: src/features/invoices/utils/invoiceValidation.js
 */

const isEmpty = (value) =>
  value === null ||
  value === undefined ||
  String(value).trim() === "";

export function validateRequired(value, fieldName) {
  if (isEmpty(value)) {
    return `${fieldName} is required.`;
  }

  return "";
}

export function validateNonNegativeAmount(value, fieldName = "Amount") {
  if (isEmpty(value)) {
    return `${fieldName} is required.`;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return `${fieldName} must be a valid non-negative amount.`;
  }

  return "";
}

export function validatePositiveAmount(value, fieldName = "Amount") {
  if (isEmpty(value)) {
    return `${fieldName} is required.`;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return `${fieldName} must be greater than zero.`;
  }

  return "";
}

export function validateQuantity(value, fieldName = "Quantity") {
  if (isEmpty(value)) {
    return `${fieldName} is required.`;
  }

  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity < 0) {
    return `${fieldName} must be a whole number greater than or equal to zero.`;
  }

  return "";
}

export function validateDate(value, fieldName = "Date") {
  if (isEmpty(value)) {
    return `${fieldName} is required.`;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return `Please enter a valid ${fieldName.toLowerCase()}.`;
  }

  return "";
}

export function validateBillingPeriod(startDate, endDate) {
  const startError = validateDate(startDate, "Billing start date");

  if (startError) {
    return {
      valid: false,
      message: startError,
    };
  }

  const endError = validateDate(endDate, "Billing end date");

  if (endError) {
    return {
      valid: false,
      message: endError,
    };
  }

  if (startDate > endDate) {
    return {
      valid: false,
      message: "Billing start date must not be after the end date.",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

/**
 * Validate invoice creation form data.
 * Returns the first validation error, or an empty string.
 */
export function validateInvoiceForm(form) {
  if (!form || typeof form !== "object") {
    return "Invoice form data is missing.";
  }

  const customerError = validateRequired(
    form.customer_id,
    "Customer"
  );

  if (customerError) return customerError;

  const invoiceDateError = validateDate(
    form.invoice_date,
    "Invoice date"
  );

  if (invoiceDateError) return invoiceDateError;

  const period = validateBillingPeriod(
    form.period_start,
    form.period_end
  );

  if (!period.valid) return period.message;

  const additionalChargesError = validateNonNegativeAmount(
    form.additional_charges ?? 0,
    "Additional charges"
  );

  if (additionalChargesError) return additionalChargesError;

  const quantities = [
    ["thermal_jar_lost_qty", "Thermal jar quantity"],
    ["capsule_jar_lost_qty", "Capsule jar quantity"],
    ["dispenser_jar_lost_qty", "Dispenser jar quantity"],
  ];

  for (const [field, label] of quantities) {
    const error = validateQuantity(form[field] ?? 0, label);

    if (error) return error;
  }

  return "";
}

/**
 * Validate a payment before recording it.
 */
export function validateInvoicePayment(paymentAmount, balance) {
  const amountError = validatePositiveAmount(
    paymentAmount,
    "Payment amount"
  );

  if (amountError) return amountError;

  const amount = Number(paymentAmount);
  const outstandingBalance = Number(balance);

  if (
    !Number.isFinite(outstandingBalance) ||
    outstandingBalance < 0
  ) {
    return "Invoice balance is invalid.";
  }

  if (outstandingBalance === 0) {
    return "This invoice is already fully paid.";
  }

  if (amount > outstandingBalance) {
    return "Payment cannot exceed the outstanding balance.";
  }

  return "";
}
