import { supabase } from "../../../lib/supabase";
import { toNumber } from "../utils/invoiceUtils";
import { DEFAULT_JAR_RATES } from "../utils/invoiceConstants";

/**
 * Convert database invoice fields into a consistent UI shape.
 * Database columns remain the source of truth.
 */
function normalizeInvoice(invoice) {
  if (!invoice) return null;

  const totalAmount = toNumber(invoice.total_amount);
  const amountPaid = toNumber(invoice.amount_paid);
  const discountAmount = toNumber(invoice.discount_amount);

  return {
    ...invoice,

    invoiceNumber: invoice.invoice_number,
    invoiceDate: invoice.invoice_date,
    startDate: invoice.period_start,
    endDate: invoice.period_end,

    subtotal: toNumber(invoice.subtotal),
    discount: discountAmount,
    discount_amount: discountAmount,

    totalAmount,
    total_amount: totalAmount,
    amountToPay: totalAmount,
    amount_to_pay: totalAmount,

    paidAmount: amountPaid,
    paid_amount: amountPaid,
    amount_paid: amountPaid,

    remainingAmount: Math.max(0, totalAmount - amountPaid),

    // Compatibility with older UI labels.
    // This is the database subtotal, not an additional-charges column.
    additionalCharges: toNumber(invoice.subtotal),

    status: invoice.status,
  };
}

/**
 * Preview only. The actual invoice number must be generated
 * inside the database transaction.
 */
export async function getNextInvoiceNumber(businessId) {
  if (!businessId) {
    throw new Error("Business ID is required.");
  }

  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  const lastNumber = toNumber(data?.[0]?.invoice_number);

  return lastNumber + 1;
}

/**
 * Build separate invoice lines for each lost-jar category.
 * Keeping quantity and rate on each row makes charges clear to customers.
 */
function buildExtraLines(invoiceData, settings) {
  const thermalQuantity = Math.max(
    0,
    toNumber(invoiceData?.thermal_jar_lost_qty)
  );

  const capsuleQuantity = Math.max(
    0,
    toNumber(invoiceData?.capsule_jar_lost_qty)
  );

  const dispenserQuantity = Math.max(
    0,
    toNumber(invoiceData?.dispenser_jar_lost_qty)
  );

  const thermalRate = toNumber(
    settings?.thermal_jar_charge ?? DEFAULT_JAR_RATES.thermal
  );

  const capsuleRate = toNumber(
    settings?.capsule_jar_charge ?? DEFAULT_JAR_RATES.capsule
  );

  const dispenserRate = toNumber(
    settings?.dispenser_jar_charge ?? DEFAULT_JAR_RATES.dispenser
  );

  const lines = [];

  if (thermalQuantity > 0) {
    lines.push({
      description: "Lost 20L Thermal Jar",
      quantity: thermalQuantity,
      unit_price: thermalRate,
      line_total: thermalQuantity * thermalRate,
    });
  }

  if (capsuleQuantity > 0) {
    lines.push({
      description: "Lost 20L Capsule Jar",
      quantity: capsuleQuantity,
      unit_price: capsuleRate,
      line_total: capsuleQuantity * capsuleRate,
    });
  }

  if (dispenserQuantity > 0) {
    lines.push({
      description: "Lost Dispenser Jar",
      quantity: dispenserQuantity,
      unit_price: dispenserRate,
      line_total: dispenserQuantity * dispenserRate,
    });
  }

  const additionalCharges = Math.max(
    0,
    toNumber(invoiceData?.additional_charges)
  );

  if (additionalCharges > 0) {
    lines.push({
      description: "Additional charges",
      quantity: 1,
      unit_price: additionalCharges,
      line_total: additionalCharges,
    });
  }

  return lines;
}

/**
 * Create invoice using the discount-aware atomic PostgreSQL RPC.
 *
 * The 9-argument RPC calls the existing 8-argument invoice function
 * in the same transaction, then records and applies the discount.
 */
export async function createInvoice({
  businessId,
  customerId,
  invoiceData,
  deliveryIds = [],
  settings = {},
}) {
  if (!businessId) {
    throw new Error("Business ID is required.");
  }

  if (!customerId) {
    throw new Error("Please select a customer.");
  }

  if (!invoiceData?.invoice_date) {
    throw new Error("Invoice date is required.");
  }

  if (!invoiceData?.period_start || !invoiceData?.period_end) {
    throw new Error("Billing period dates are required.");
  }

  if (invoiceData.period_start > invoiceData.period_end) {
    throw new Error(
      "Billing start date cannot be after end date."
    );
  }

  if (!Array.isArray(deliveryIds) || deliveryIds.length === 0) {
    throw new Error("No delivery records were selected.");
  }

  const uniqueDeliveryIds = [...new Set(deliveryIds)];

  if (uniqueDeliveryIds.length !== deliveryIds.length) {
    throw new Error("Duplicate delivery records were selected.");
  }

  // Validate discount.
  const rawDiscount = invoiceData?.discount_amount ?? 0;
  const discountAmount = Number(rawDiscount);

  if (
    rawDiscount === "" ||
    !Number.isFinite(discountAmount) ||
    discountAmount < 0
  ) {
    throw new Error(
      "Discount must be a valid non-negative amount."
    );
  }

  const extraLines = buildExtraLines(invoiceData, settings);

  // Call the 9-argument discount-aware RPC.
  const { data, error } = await supabase.rpc(
    "create_invoice_atomic",
    {
      p_business_id: businessId,
      p_customer_id: customerId,
      p_invoice_date: invoiceData.invoice_date,
      p_period_start: invoiceData.period_start,
      p_period_end: invoiceData.period_end,
      p_delivery_ids: uniqueDeliveryIds,
      p_extra_lines: extraLines,
      p_notes: invoiceData.notes?.trim() || null,
      p_discount_amount: discountAmount,
    }
  );

  if (error) {
    console.error("Invoice creation failed:", error);

    throw new Error(
      error.message || "Unable to create invoice."
    );
  }

  const invoice = Array.isArray(data) ? data[0] : data;

  if (!invoice?.id) {
    throw new Error(
      "Invoice creation response did not contain an invoice ID."
    );
  }

  return normalizeInvoice(invoice);
}





export async function updateInvoice({
  invoiceId,
  businessId,
  invoiceData,
  items,
}) {
  if (!invoiceId || !businessId) {
    throw new Error("Invoice and business are required.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one invoice item is required.");
  }

  const lines = items.map((item) => ({
    description: String(item.description || "").trim(),
    quantity: Number(item.quantity || 0),
    unit_price: Number(item.unit_price ?? item.rate ?? 0),
    product_id: item.product_id || null,
    source_delivery_item_id: item.source_delivery_item_id || null,
  }));

  const { data, error } = await supabase.rpc(
    "update_invoice_atomic",
    {
      p_invoice_id: invoiceId,
      p_business_id: businessId,
      p_invoice_date: invoiceData.invoice_date,
      p_period_start: invoiceData.period_start,
      p_period_end: invoiceData.period_end,
      p_due_date: invoiceData.due_date || null,
      p_notes: invoiceData.notes || null,
      p_discount_amount: Number(invoiceData.discount_amount || 0),
      p_lines: lines,
    }
  );

  if (error) {
    throw new Error(error.message || "Unable to update invoice.");
  }

  const updated = Array.isArray(data) ? data[0] : data;

  if (!updated?.id) {
    throw new Error("Invoice update did not return an invoice.");
  }

  return normalizeInvoice(updated);
}

/**
 * Load invoice list for a business.
 *
 * Optional filters:
 * {
 *   customerId,
 *   startDate,
 *   endDate,
 *   status
 * }
 */
export async function getInvoices(
  businessId,
  {
    customerId = "",
    startDate = "",
    endDate = "",
    status = "",
  } = {}
) {
  if (!businessId) {
    throw new Error("Business ID is required.");
  }

  let query = supabase
    .from("invoices")
    .select("*")
    .eq("business_id", businessId)
    .order("invoice_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  if (startDate) {
    query = query.gte("invoice_date", startDate);
  }

  if (endDate) {
    query = query.lte("invoice_date", endDate);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []).map(normalizeInvoice);
}

/**
 * Fetch invoice lines and their source delivery information.
 *
 * invoice_lines has:
 * quantity, unit_price, line_total, source_delivery_item_id.
 *
 * Delivery date is retrieved from deliveries through delivery_items.
 */
async function getInvoiceLines(invoiceId, businessId) {
  const { data: lines, error } = await supabase
    .from("invoice_lines")
    .select(`
      id,
      business_id,
      invoice_id,
      product_id,
      description,
      quantity,
      unit_price,
      line_total,
      source_delivery_item_id,
      created_at
    `)
    .eq("invoice_id", invoiceId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const invoiceLines = lines ?? [];

  const sourceIds = [
    ...new Set(
      invoiceLines
        .map((line) => line.source_delivery_item_id)
        .filter(Boolean)
    ),
  ];

  let sourceMap = new Map();

  if (sourceIds.length > 0) {
    const { data: sourceItems, error: sourceError } =
      await supabase
        .from("delivery_items")
        .select(`
          id,
          delivery_id,
          product_id,
          quantity_delivered,
          unit_price,
          line_total
        `)
        .eq("business_id", businessId)
        .in("id", sourceIds);

    if (sourceError) throw sourceError;

    const deliveryIds = [
      ...new Set(
        (sourceItems ?? [])
          .map((item) => item.delivery_id)
          .filter(Boolean)
      ),
    ];

    let deliveryDateMap = new Map();

    if (deliveryIds.length > 0) {
      const {
        data: deliveries,
        error: deliveryError,
      } = await supabase
        .from("deliveries")
        .select("id, delivery_date")
        .eq("business_id", businessId)
        .in("id", deliveryIds);

      if (deliveryError) throw deliveryError;

      deliveryDateMap = new Map(
        (deliveries ?? []).map((delivery) => [
          delivery.id,
          delivery.delivery_date,
        ])
      );
    }

    sourceMap = new Map(
      (sourceItems ?? []).map((item) => [
        item.id,
        {
          ...item,
          delivery_date:
            deliveryDateMap.get(item.delivery_id) ?? null,
        },
      ])
    );
  }

  return invoiceLines.map((line) => {
    const source = line.source_delivery_item_id
      ? sourceMap.get(line.source_delivery_item_id)
      : null;

    const quantity = toNumber(line.quantity);
    const rate = toNumber(line.unit_price);
    const amount = toNumber(line.line_total);

    return {
      ...line,

      // Existing InvoiceDetailPage compatibility.
      delivery_date: source?.delivery_date ?? null,
      quantity,
      rate,
      amount,

      // Canonical DB fields are retained.
      unit_price: rate,
      line_total: amount,
    };
  });
}

/**
 * Load one invoice with its line items.
 */
export async function getInvoiceById(invoiceId, businessId) {
  if (!invoiceId || !businessId) {
    throw new Error(
      "Invoice ID and business ID are required."
    );
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("business_id", businessId)
    .single();

  if (invoiceError) throw invoiceError;

  const items = await getInvoiceLines(invoiceId, businessId);

  return {
    ...normalizeInvoice(invoice),
    items,
  };
}

/**
 * Get invoices for one customer.
 * Used by Customer Details > Invoices.
 */
export async function getCustomerInvoices(businessId, customerId) {
  if (!businessId || !customerId) {
    throw new Error(
      "Business ID and customer ID are required."
    );
  }

  return getInvoices(businessId, { customerId });
}

const invoiceService = {
  getNextInvoiceNumber,
  createInvoice,
  getInvoices,
  getInvoiceById,
  getCustomerInvoices,
  updateInvoice,
};

export default invoiceService;