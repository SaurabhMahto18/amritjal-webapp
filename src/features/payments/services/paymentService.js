
import { supabase } from "../../../lib/supabase/client";

const PAYMENTS_TABLE = "payments";
const CUSTOMERS_TABLE = "customers";
const EMPLOYEES_TABLE = "staff_employees";
const EVENTS_TABLE = "events";

// ==========================================
// GET CURRENT BUSINESS ID
// ==========================================

async function getBusinessId() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;

  if (!user) {
    throw new Error("Please sign in to continue.");
  }

  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (error) throw error;

  if (!data?.id) {
    throw new Error("Business profile not found.");
  }

  return data.id;
}

// ==========================================
// HELPERS
// ==========================================

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizePayment = (row) => ({
  id: row.id,
  businessId: row.business_id,
  eventId: row.event_id || null,

  customerId: row.customer_id,
  customerName: row.customers?.name || "Unknown Customer",
  customerPhone: row.customers?.phone || "",

  employeeId: row.employee_id || null,

  date: row.payment_date,
  amount: toNumber(row.amount),
  method: row.method || "cash",
  purpose: row.purpose || "customer_payment",

  notes: row.notes || "",
  referenceNo: row.reference_no || "",
  createdAt: row.created_at,
});

// ==========================================
// VALIDATE PAYMENT
// ==========================================

function validatePayment(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Please provide payment details.");
  }

  const customerId = input.customerId;
  const amount = Number(input.amount);
  const date = input.date;

  const method = input.method || "cash";
  const purpose = input.purpose || "customer_payment";

  if (!customerId) {
    throw new Error("Please select a customer.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Please select a valid payment date.");
  }

  const validMethods = [
    "cash",
    "upi",
    "bank_transfer",
    "card",
    "cheque",
    "wallet",
    "other",
  ];

  if (!validMethods.includes(method)) {
    throw new Error("Please select a valid payment method.");
  }

  const validPurposes = [
    "customer_payment",
    "employee_payment",
    "refund",
    "advance",
    "other",
  ];

  if (!validPurposes.includes(purpose)) {
    throw new Error("Please select a valid payment purpose.");
  }

  if (purpose !== "customer_payment") {
    throw new Error(
      "This form only supports customer payments."
    );
  }

  const notes = String(input.notes || "").trim();
  const referenceNo = String(input.referenceNo || "").trim();

  if (notes.length > 500) {
    throw new Error("Notes cannot exceed 500 characters.");
  }

  if (referenceNo.length > 120) {
    throw new Error("Reference number cannot exceed 120 characters.");
  }

  return {
    customerId,
    amount,
    date,
    method,
    notes,
    referenceNo,
    purpose,
    eventId: input.eventId || null,
  };
}

// ==========================================
// PAYMENT SELECT
// ==========================================

const PAYMENT_SELECT = `
  id,
  business_id,
  event_id,
  customer_id,
  employee_id,
  payment_date,
  amount,
  method,
  purpose,
  reference_no,
  notes,
  created_at,
  customers(name, phone)
`;

// ==========================================
// PAYMENT UPDATE EVENT
// ==========================================

function notifyPaymentsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("amrit-jal-payments-updated")
    );
  }
}

// ==========================================
// VERIFY CUSTOMER
// ==========================================

async function verifyCustomer(customerId, businessId) {
  const { data: customer, error } = await supabase
    .from(CUSTOMERS_TABLE)
    .select("id")
    .eq("id", customerId)
    .eq("business_id", businessId)
    .eq("archived", false)
    .maybeSingle();

  if (error) throw error;

  if (!customer) {
    throw new Error("Selected customer is unavailable.");
  }
}

// ==========================================
// VERIFY EVENT
// ==========================================

async function verifyEvent(eventId, businessId) {
  if (!eventId) return;

  const { data: event, error } = await supabase
    .from(EVENTS_TABLE)
    .select("id, business_id")
    .eq("id", eventId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) throw error;

  if (!event) {
    throw new Error("Selected event is unavailable.");
  }
}

// ==========================================
// GET CUSTOMERS
// ==========================================

export async function getCustomers() {
  const businessId = await getBusinessId();

  const { data, error } = await supabase
    .from(CUSTOMERS_TABLE)
    .select(`
      id,
      name,
      phone,
      opening_balance,
      archived,
      status
    `)
    .eq("business_id", businessId)
    .eq("archived", false)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data || [])
    .filter((customer) => customer.status !== "inactive")
    .map((customer) => ({
      id: customer.id,
      name: customer.name || "Unnamed Customer",
      phone: customer.phone || "",
      openingBalance: toNumber(customer.opening_balance),
    }));
}

// ==========================================
// GET EMPLOYEES
// ==========================================

export async function getEmployees() {
  const businessId = await getBusinessId();

  const { data, error } = await supabase
    .from(EMPLOYEES_TABLE)
    .select(`
      id,
      business_id,
      name,
      phone,
      role
    `)
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data || []).map((employee) => ({
    id: employee.id,
    name: employee.name || "",
    full_name: employee.name || "",
    phone: employee.phone || "",
    role: employee.role || "",
  }));
}

// ==========================================
// GET PAYMENTS
// ==========================================

export async function getPayments({
  date = "",
  customerId = "",
  eventId = "",
} = {}) {
  const businessId = await getBusinessId();

  let query = supabase
    .from(PAYMENTS_TABLE)
    .select(PAYMENT_SELECT)
    .eq("business_id", businessId)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (date) {
    query = query.eq("payment_date", date);
  }

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(normalizePayment);
}

// ==========================================
// CREATE PAYMENT
// ==========================================

export async function createPayment(input) {
  const businessId = await getBusinessId();
  const payment = validatePayment(input);

  await verifyCustomer(payment.customerId, businessId);
  await verifyEvent(payment.eventId, businessId);

  /*
   * IMPORTANT:
   * payments.employee_id currently references
   * employees(id, business_id), NOT staff_employees.
   *
   * Therefore employee_id remains NULL until
   * the database FK is migrated.
   */

  const payload = {
    business_id: businessId,
    customer_id: payment.customerId,

    employee_id: null,

    event_id: payment.eventId,
    payment_date: payment.date,
    amount: payment.amount,
    method: payment.method,
    purpose: payment.purpose,
    reference_no: payment.referenceNo || null,
    notes: payment.notes || null,
  };

  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .insert(payload)
    .select(PAYMENT_SELECT)
    .single();

  if (error) throw error;

  notifyPaymentsUpdated();

  return normalizePayment(data);
}

// ==========================================
// UPDATE PAYMENT
// ==========================================

export async function updatePayment(paymentId, input) {
  if (!paymentId) {
    throw new Error("Payment ID is required.");
  }

  const businessId = await getBusinessId();
  const payment = validatePayment(input);

  // Verify payment belongs to current business.
  const { data: existing, error: existingError } =
    await supabase
      .from(PAYMENTS_TABLE)
      .select("id, business_id")
      .eq("id", paymentId)
      .eq("business_id", businessId)
      .maybeSingle();

  if (existingError) throw existingError;

  if (!existing) {
    throw new Error("Payment not found or access denied.");
  }

  // Verify customer and event ownership.
  await verifyCustomer(payment.customerId, businessId);
  await verifyEvent(payment.eventId, businessId);

  const payload = {
    customer_id: payment.customerId,
    event_id: payment.eventId,
    payment_date: payment.date,
    amount: payment.amount,
    method: payment.method,
    purpose: payment.purpose,
    reference_no: payment.referenceNo || null,
    notes: payment.notes || null,
  };

  const { data, error } = await supabase
    .from(PAYMENTS_TABLE)
    .update(payload)
    .eq("id", paymentId)
    .eq("business_id", businessId)
    .select(PAYMENT_SELECT)
    .single();

  if (error) throw error;

  notifyPaymentsUpdated();

  return normalizePayment(data);
}

// ==========================================
// DELETE PAYMENT
// ==========================================

export async function deletePayment(paymentId) {
  if (!paymentId) {
    throw new Error("Payment ID is required.");
  }

  const businessId = await getBusinessId();

  // Verify payment belongs to current business.
  const { data: existing, error: existingError } =
    await supabase
      .from(PAYMENTS_TABLE)
      .select("id")
      .eq("id", paymentId)
      .eq("business_id", businessId)
      .maybeSingle();

  if (existingError) throw existingError;

  if (!existing) {
    throw new Error("Payment not found or access denied.");
  }

  const { error } = await supabase
    .from(PAYMENTS_TABLE)
    .delete()
    .eq("id", paymentId)
    .eq("business_id", businessId);

  if (error) throw error;

  notifyPaymentsUpdated();

  return true;
}

// ==========================================
// PAYMENT SERVICE
// ==========================================

const paymentService = {
  getCustomers,
  getEmployees,
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
};

export default paymentService;
