
/**
 * Shared constants for the Amrit Jal invoice module.
 * File: src/features/invoices/utils/invoiceConstants.js
 */

export const INVOICE_STATUS = {
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

export const INVOICE_STATUS_OPTIONS = [
  { label: "All Statuses", value: "All" },
  { label: "Unpaid", value: INVOICE_STATUS.UNPAID },
  { label: "Partially Paid", value: INVOICE_STATUS.PARTIAL },
  { label: "Paid", value: INVOICE_STATUS.PAID },
  { label: "Overdue", value: INVOICE_STATUS.OVERDUE },
];

export const DEFAULT_JAR_RATES = {
  thermal: 600,
  capsule: 200,
  dispenser: 150,
};

export const INVOICE_DEFAULTS = {
  prefix: "INV-",
  numberPadding: 6,
  currency: "INR",
  locale: "en-IN",
  initialStatus: INVOICE_STATUS.UNPAID,
  initialPaidAmount: 0,
};

export const INVOICE_TABLES = {
  invoices: "invoices",
  invoiceItems: "invoice_items",
  customers: "customers",
  deliveries: "deliveries",
  businesses: "businesses",
  settings: "business_invoice_settings",
};

export const INVOICE_MESSAGES = {
  loadError: "Unable to load invoice data. Please try again.",
  createSuccess: "Invoice created successfully.",
  createError: "Unable to create invoice. Please try again.",
  updateSuccess: "Invoice updated successfully.",
  updateError: "Unable to update invoice. Please try again.",
  deleteSuccess: "Invoice deleted successfully.",
  deleteError: "Unable to delete invoice. Please try again.",
  noInvoices: "No invoices found.",
  noCustomers: "No customers available. Add a customer first.",
  invalidPeriod: "The billing start date must not be after the end date.",
  invalidAmount: "Please enter a valid non-negative amount.",
  invalidQuantity: "Please enter a valid whole-number quantity.",
};

export const INVOICE_PAGE_SIZE = 10;

export const LOST_JAR_TYPES = [
  {
    key: "thermal",
    label: "Thermal Jar",
    quantityField: "thermal_jar_lost_qty",
    rateField: "thermal_jar_charge",
    defaultRate: DEFAULT_JAR_RATES.thermal,
  },
  {
    key: "capsule",
    label: "Capsule Jar",
    quantityField: "capsule_jar_lost_qty",
    rateField: "capsule_jar_charge",
    defaultRate: DEFAULT_JAR_RATES.capsule,
  },
  {
    key: "dispenser",
    label: "Dispenser Jar",
    quantityField: "dispenser_jar_lost_qty",
    rateField: "dispenser_jar_charge",
    defaultRate: DEFAULT_JAR_RATES.dispenser,
  },
];
