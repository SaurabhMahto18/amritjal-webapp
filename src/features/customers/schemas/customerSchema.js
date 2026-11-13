// src/features/customers/schemas/customerSchema.js

const ALLOWED_SHIFTS = [
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
];

const ALLOWED_PAYMENT_REMINDERS = [
  "Daily",
  "Weekly",
  "Monthly",
];

const normalizePhone = (value) =>
  String(value ?? "").replace(/\D/g, "");

const isValidAmount = (value) => {
  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0;
};

export function validateCustomerSchema(values = {}) {
  const errors = {};

  const name = String(values.name ?? "").trim();
  const phone = normalizePhone(values.phone);
  const billingPhone = normalizePhone(
    values.sameBillingPhone !== false
      ? values.phone
      : values.billingPhone
  );

  const email = String(values.email ?? "").trim();

  const jarRate = values.jarRate;
  const openingBalance = values.openingBalance;
  const securityDeposit = values.securityDeposit ?? 0;

  // Customer name
  if (!name) {
    errors.name = "Customer name is required.";
  }

  // Primary mobile
  if (phone.length !== 10) {
    errors.phone = "Enter a valid 10-digit mobile number.";
  }

  // Billing mobile
  if (billingPhone.length !== 10) {
    errors.billingPhone =
      "Enter a valid 10-digit billing mobile number.";
  }

  // Email
  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    errors.email = "Enter a valid email address.";
  }

  // Customer group
  if (!String(values.customerGroupId ?? "").trim()) {
    errors.customerGroupId = "Please select a customer group.";
  }

  // Delivery shift
  if (!ALLOWED_SHIFTS.includes(values.shift || "Morning")) {
    errors.shift = "Please select a valid delivery shift.";
  }

  // Payment reminder
  if (
    !ALLOWED_PAYMENT_REMINDERS.includes(
      values.paymentReminder || "Monthly"
    )
  ) {
    errors.paymentReminder =
      "Please select a valid payment reminder.";
  }

  // Jar rate
  if (
    String(jarRate ?? "").trim() === "" ||
    !isValidAmount(jarRate)
  ) {
    errors.jarRate = "Enter a valid non-negative jar rate.";
  }

  // Opening balance
  if (
    String(openingBalance ?? "").trim() === "" ||
    !Number.isFinite(Number(openingBalance))
  ) {
    errors.openingBalance = "Enter a valid opening balance.";
  }

  // Security deposit
  if (
    String(securityDeposit).trim() === "" ||
    !isValidAmount(securityDeposit)
  ) {
    errors.securityDeposit =
      "Enter a valid non-negative security deposit.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ==========================================
// CUSTOMER PAYLOAD NORMALIZATION
// ==========================================

export function getCustomerPayload(values = {}) {
  const sameBillingPhone = values.sameBillingPhone !== false;

  return {
    ...values,

    name: String(values.name ?? "").trim(),

    phone: normalizePhone(values.phone),

    billingPhone: sameBillingPhone
      ? normalizePhone(values.phone)
      : normalizePhone(values.billingPhone),

    sameBillingPhone,

    email: String(values.email ?? "").trim(),

    address: String(values.address ?? "").trim(),

    area: String(values.area ?? "").trim(),

    jarRate: Number(values.jarRate ?? 0),

    openingBalance: Number(values.openingBalance ?? 0),

    // Refundable deposit, separate from outstanding dues
    securityDeposit: Number(values.securityDeposit ?? 0),

    notes: String(values.notes ?? "").trim(),

    shift: values.shift || "Morning",

    paymentReminder: values.paymentReminder || "Monthly",
  };
}