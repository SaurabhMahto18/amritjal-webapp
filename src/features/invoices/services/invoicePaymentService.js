
import { supabase } from "../../../lib/supabase";

/**
 * Record a payment against an invoice.
 *
 * Note:
 * This implementation updates the invoice's paid_amount and status.
 * It does not create a separate payment-history record because
 * no invoice payments table schema has been provided yet.
 */
export async function recordInvoicePayment({
  invoiceId,
  businessId,
  paymentAmount,
}) {
  if (!invoiceId || !businessId) {
    throw new Error("Invoice ID and business ID are required.");
  }

  const amount = Number(paymentAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("id, total_amount, paid_amount, status")
    .eq("id", invoiceId)
    .eq("business_id", businessId)
    .single();

  if (fetchError) throw fetchError;

  const totalAmount = Number(invoice.total_amount) || 0;
  const currentPaidAmount = Number(invoice.paid_amount) || 0;
  const balance = Math.max(0, totalAmount - currentPaidAmount);

  if (balance <= 0) {
    throw new Error("This invoice is already fully paid.");
  }

  if (amount > balance) {
    throw new Error(
      `Payment exceeds the remaining balance of ₹${balance.toFixed(2)}.`
    );
  }

  const newPaidAmount = currentPaidAmount + amount;
  const newBalance = Math.max(0, totalAmount - newPaidAmount);

  let newStatus = "Unpaid";

  if (newBalance === 0) {
    newStatus = "Paid";
  } else if (newPaidAmount > 0) {
    newStatus = "Partial";
  }

  const { data: updatedInvoice, error: updateError } = await supabase
    .from("invoices")
    .update({
      paid_amount: newPaidAmount,
      status: newStatus,
    })
    .eq("id", invoiceId)
    .eq("business_id", businessId)
    .select("*")
    .single();

  if (updateError) throw updateError;

  return {
    invoice: updatedInvoice,
    paymentAmount: amount,
    paidAmount: newPaidAmount,
    balance: newBalance,
    status: newStatus,
  };
}

/**
 * Recalculate and synchronize an invoice's payment status.
 */
export async function refreshInvoicePaymentStatus({
  invoiceId,
  businessId,
}) {
  if (!invoiceId || !businessId) {
    throw new Error("Invoice ID and business ID are required.");
  }

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("id, total_amount, paid_amount")
    .eq("id", invoiceId)
    .eq("business_id", businessId)
    .single();

  if (fetchError) throw fetchError;

  const totalAmount = Math.max(0, Number(invoice.total_amount) || 0);
  const paidAmount = Math.max(0, Number(invoice.paid_amount) || 0);
  const balance = Math.max(0, totalAmount - paidAmount);

  let status = "Unpaid";

  if (totalAmount > 0 && paidAmount >= totalAmount) {
    status = "Paid";
  } else if (paidAmount > 0) {
    status = "Partial";
  }

  const { data: updatedInvoice, error: updateError } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", invoiceId)
    .eq("business_id", businessId)
    .select("*")
    .single();

  if (updateError) throw updateError;

  return {
    invoice: updatedInvoice,
    paidAmount,
    balance,
    status,
  };
}
