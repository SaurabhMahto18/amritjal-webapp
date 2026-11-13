
import { supabase } from "../../../lib/supabase";

/**
 * Fetch the current payment summary for an invoice.
 *
 * The current schema stores paid_amount and status on invoices.
 * It does not include a confirmed payment-history table, so this
 * function cannot return individual payment transactions.
 */
export async function getInvoicePaymentSummary({
  invoiceId,
  businessId,
}) {
  if (!invoiceId || !businessId) {
    throw new Error("Invoice ID and business ID are required.");
  }

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, invoice_date, total_amount, paid_amount, status"
    )
    .eq("id", invoiceId)
    .eq("business_id", businessId)
    .single();

  if (error) throw error;

  const totalAmount = Math.max(
    0,
    Number(data.total_amount) || 0
  );

  const paidAmount = Math.max(
    0,
    Number(data.paid_amount) || 0
  );

  return {
    invoiceId: data.id,
    invoiceNumber: data.invoice_number,
    invoiceDate: data.invoice_date,
    totalAmount,
    paidAmount,
    balance: Math.max(0, totalAmount - paidAmount),
    status: data.status,
    transactions: [],
    historyAvailable: false,
  };
}

/**
 * Payment transaction history requires a separate database table.
 * This function intentionally does not write to an unverified table.
 */
export async function getInvoicePaymentHistory() {
  throw new Error(
    "Payment history is not configured yet. Create and secure a payment-history table in Supabase first."
  );
}
