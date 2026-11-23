
import { supabase } from "../../../lib/supabase";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const unique = (values) => [...new Set(values.filter(Boolean))];

const getAllocationAmount = (allocation) => {
  const knownAmount =
    allocation.allocated_amount ??
    allocation.amount_allocated ??
    allocation.allocation_amount ??
    allocation.applied_amount ??
    allocation.amount;

  if (knownAmount !== undefined && knownAmount !== null) {
    return toNumber(knownAmount);
  }

  const amountEntry = Object.entries(allocation).find(
    ([key, value]) =>
      /amount/i.test(key) &&
      /(allocat|applied)/i.test(key) &&
      value !== null &&
      value !== undefined
  );

  return toNumber(amountEntry?.[1]);
};

const isPreviousOutstandingLine = (line) => {
  const description = String(line.description || "").toLowerCase();

  return (
    description.includes("previous outstanding") ||
    description.includes("previous balance") ||
    description.includes("past due")
  );
};

/**
 * Loads invoice-specific data and resolves delivery lines
 * to their actual delivery date and quantities.
 */
export async function getInvoiceReportData(invoiceId) {
  if (!invoiceId) {
    throw new Error("Invoice ID is required.");
  }

  // --------------------------------------------------
  // 1. AUTHENTICATION
  // --------------------------------------------------

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;

  if (!user) {
    throw new Error("Please log in to view this invoice.");
  }

  // --------------------------------------------------
  // 2. BUSINESS
  // --------------------------------------------------

  // Keeping the existing owner-based lookup unchanged.
  // Team-member access should be migrated separately
  // using the application's established business-access helper.

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, owner_id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (businessError) throw businessError;

  if (!business) {
    throw new Error("Business profile not found.");
  }

  // --------------------------------------------------
  // 3. INVOICE
  // --------------------------------------------------

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("business_id", business.id)
    .single();

  if (invoiceError) throw invoiceError;

  // --------------------------------------------------
  // 4. FETCH RELATED DATA
  // --------------------------------------------------

  const [
    customerResult,
    linesResult,
    settingsResult,
    allocationsResult,
  ] = await Promise.all([
    supabase
      .from("customers")
      .select(
        `
          id,
          code,
          name,
          phone,
          address,
          area,
          opening_balance,
          security_deposit
        `
      )
      .eq("id", invoice.customer_id)
      .eq("business_id", business.id)
      .maybeSingle(),

    supabase
      .from("invoice_lines")
      .select("*")
      .eq("invoice_id", invoice.id)
      .eq("business_id", business.id)
      .order("created_at", { ascending: true }),

    supabase
      .from("business_invoice_settings")
      .select("*")
      .eq("business_id", business.id)
      .maybeSingle(),

    supabase
      .from("payment_allocations")
      .select("*")
      .eq("invoice_id", invoice.id)
      .eq("business_id", business.id),
  ]);

  const results = [
    customerResult,
    linesResult,
    settingsResult,
    allocationsResult,
  ];

  for (const result of results) {
    if (result.error) throw result.error;
  }

  const lines = linesResult.data || [];

  // --------------------------------------------------
  // 5. FETCH SOURCE DELIVERY ITEMS
  // --------------------------------------------------

  const sourceItemIds = unique(
    lines.map((line) => line.source_delivery_item_id)
  );

  let deliveryItems = [];

  if (sourceItemIds.length > 0) {
    const { data, error } = await supabase
      .from("delivery_items")
      .select(
        `
          id,
          delivery_id,
          product_id,
          quantity_delivered,
          quantity_returned,
          unit_price,
          line_total
        `
      )
      .eq("business_id", business.id)
      .in("id", sourceItemIds);

    if (error) throw error;

    deliveryItems = data || [];
  }

  // --------------------------------------------------
  // 6. FETCH DELIVERY AND PRODUCT DETAILS
  // --------------------------------------------------

  const deliveryIds = unique(
    deliveryItems.map((item) => item.delivery_id)
  );

  const productIds = unique([
    ...deliveryItems.map((item) => item.product_id),
    ...lines.map((line) => line.product_id),
  ]);

  const [deliveryResult, productResult] = await Promise.all([
    deliveryIds.length > 0
      ? supabase
          .from("deliveries")
          .select("id, delivery_date, customer_id")
          .eq("business_id", business.id)
          .in("id", deliveryIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    productIds.length > 0
      ? supabase
          .from("products")
          .select("id, name")
          .eq("business_id", business.id)
          .in("id", productIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);

  if (deliveryResult.error) throw deliveryResult.error;

  if (productResult.error) throw productResult.error;

  // --------------------------------------------------
  // 7. CREATE LOOKUP MAPS
  // --------------------------------------------------

  const deliveryById = new Map(
    (deliveryResult.data || []).map((row) => [
      row.id,
      row,
    ])
  );

  const deliveryItemById = new Map(
    deliveryItems.map((row) => [
      row.id,
      row,
    ])
  );

  const productById = new Map(
    (productResult.data || []).map((row) => [
      row.id,
      row,
    ])
  );

  // --------------------------------------------------
  // 8. NORMALIZE INVOICE LINES
  // --------------------------------------------------

  const normalizedLines = lines.map((line) => {
    const source = line.source_delivery_item_id
      ? deliveryItemById.get(line.source_delivery_item_id)
      : null;

    const delivery = source
      ? deliveryById.get(source.delivery_id)
      : null;

    const product = productById.get(
      line.product_id || source?.product_id
    );

    const isDeliveryLine = Boolean(
      source && delivery?.delivery_date
    );

    return {
      ...line,

      // Invoice quantities and amounts
      quantity: toNumber(line.quantity),

      unit_price: toNumber(line.unit_price),

      line_total: toNumber(
        line.line_total ??
          toNumber(line.quantity) *
            toNumber(line.unit_price)
      ),

      // Actual delivery information
      delivery_date: delivery?.delivery_date || null,

      delivered_quantity: source
        ? toNumber(source.quantity_delivered)
        : 0,

      returned_quantity: source
        ? toNumber(source.quantity_returned)
        : 0,

      // Product information
      product_name:
        product?.name ||
        line.description ||
        "Product",

      // Line identification
      is_delivery_line: isDeliveryLine,

      is_previous_outstanding:
        isPreviousOutstandingLine(line),
    };
  });

  // --------------------------------------------------
  // 9. PAYMENT HISTORY
  // --------------------------------------------------

  const allocations = allocationsResult.data || [];

  const paymentIds = unique(
    allocations.map((row) => row.payment_id)
  );

  let payments = [];

  if (paymentIds.length > 0) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("business_id", business.id)
      .in("id", paymentIds)
      .order("payment_date", {
        ascending: true,
      });

    if (error) throw error;

    payments = data || [];
  }

  const paymentById = new Map(
    payments.map((row) => [
      row.id,
      row,
    ])
  );

  const paymentHistory = allocations
    .map((allocation) => {
      const payment = paymentById.get(
        allocation.payment_id
      );

      if (!payment) return null;

      return {
        id:
          allocation.id ||
          `${payment.id}-${invoice.id}`,

        payment_id: payment.id,

        payment_date: payment.payment_date,

        method:
          payment.method ||
          payment.payment_method ||
          "other",

        reference_no:
          payment.reference_no || null,

        notes:
          payment.notes || null,

        amount: getAllocationAmount(allocation),

        payment_amount: toNumber(payment.amount),
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      String(a.payment_date).localeCompare(
        String(b.payment_date)
      )
    );

  // --------------------------------------------------
  // 10. PREVIOUS OUTSTANDING
  // --------------------------------------------------

  const previousOutstandingLineAmount =
    normalizedLines
      .filter(
        (line) => line.is_previous_outstanding
      )
      .reduce(
        (sum, line) => sum + line.line_total,
        0
      );

  const previousOutstanding = toNumber(
    previousOutstandingLineAmount ||
      invoice.previous_balance ||
      invoice.past_due_amount
  );

  // --------------------------------------------------
  // 11. FINAL REPORT DATA
  // --------------------------------------------------

  return {
    business,

    invoice,

    customer: customerResult.data || null,

    settings: settingsResult.data || null,

    items: normalizedLines,

    paymentHistory,

    previousOutstanding,
  };
}

export default {
  getInvoiceReportData,
};
