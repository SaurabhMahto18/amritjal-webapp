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
 * Loads the complete, invoice-specific data set used by
 * the detailed A4 report.
 */
export async function getInvoiceReportData(invoiceId) {
  if (!invoiceId) {
    throw new Error("Invoice ID is required.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;

  if (!user) {
    throw new Error("Please log in to view this invoice.");
  }

  const { data: business, error: businessError } =
    await supabase
      .from("businesses")
      .select("id, name, owner_id")
      .eq("owner_id", user.id)
      .maybeSingle();

  if (businessError) throw businessError;

  if (!business) {
    throw new Error("Business profile not found.");
  }

  const { data: invoice, error: invoiceError } =
    await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .eq("business_id", business.id)
      .single();

  if (invoiceError) throw invoiceError;

  const [
    customerResult,
    linesResult,
    settingsResult,
    allocationsResult,
  ] = await Promise.all([
    supabase
      .from("customers")
      .select(
        "id, code, name, phone, address, area, opening_balance"
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

  for (const result of [
    customerResult,
    linesResult,
    settingsResult,
    allocationsResult,
  ]) {
    if (result.error) throw result.error;
  }

  const lines = linesResult.data || [];

  const sourceItemIds = unique(
    lines.map((line) => line.source_delivery_item_id)
  );

  let deliveryItems = [];
  let deliveries = [];
  let products = [];

  if (sourceItemIds.length) {
    const { data, error } = await supabase
      .from("delivery_items")
      .select(
        "id, delivery_id, product_id, quantity_delivered, quantity_returned, unit_price, line_total"
      )
      .eq("business_id", business.id)
      .in("id", sourceItemIds);

    if (error) throw error;

    deliveryItems = data || [];
  }

  const deliveryIds = unique(
    deliveryItems.map((item) => item.delivery_id)
  );

  const productIds = unique([
    ...deliveryItems.map((item) => item.product_id),
    ...lines.map((line) => line.product_id),
  ]);

  const secondaryResults = await Promise.all([
    deliveryIds.length
      ? supabase
          .from("deliveries")
          .select("id, delivery_date")
          .eq("business_id", business.id)
          .in("id", deliveryIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    productIds.length
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

  if (secondaryResults[0].error) {
    throw secondaryResults[0].error;
  }

  if (secondaryResults[1].error) {
    throw secondaryResults[1].error;
  }

  deliveries = secondaryResults[0].data || [];
  products = secondaryResults[1].data || [];

  const deliveryById = new Map(
    deliveries.map((row) => [row.id, row])
  );

  const deliveryItemById = new Map(
    deliveryItems.map((row) => [row.id, row])
  );

  const productById = new Map(
    products.map((row) => [row.id, row])
  );

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

    return {
      ...line,

      quantity: toNumber(line.quantity),
      unit_price: toNumber(line.unit_price),

      line_total: toNumber(
        line.line_total ??
          toNumber(line.quantity) *
            toNumber(line.unit_price)
      ),

      delivery_date: delivery?.delivery_date || null,

      product_name:
        product?.name ||
        line.description ||
        "Product",

      is_delivery_line: Boolean(
        line.source_delivery_item_id
      ),

      is_previous_outstanding:
        isPreviousOutstandingLine(line),
    };
  });

  // Get invoice-specific payment allocations.
  const allocations = allocationsResult.data || [];

  const paymentIds = unique(
    allocations.map((row) => row.payment_id)
  );

  let payments = [];

  if (paymentIds.length) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("business_id", business.id)
      .in("id", paymentIds)
      .order("payment_date", { ascending: true });

    if (error) throw error;

    payments = data || [];
  }

  const paymentById = new Map(
    payments.map((row) => [row.id, row])
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

        notes: payment.notes || null,

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

  const previousOutstandingLineAmount =
    normalizedLines
      .filter((line) => line.is_previous_outstanding)
      .reduce(
        (sum, line) => sum + line.line_total,
        0
      );

  const previousOutstanding = toNumber(
    previousOutstandingLineAmount ||
      invoice.previous_balance ||
      invoice.past_due_amount
  );

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