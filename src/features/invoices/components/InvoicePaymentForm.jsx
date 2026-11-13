
import { useState } from "react";
import {
  Banknote,
  CalendarDays,
  CreditCard,
  IndianRupee,
  Smartphone,
} from "lucide-react";
import { formatCurrency } from "../utils/invoiceUtils";
import { validateInvoicePayment } from "../utils/invoiceValidation";

const PAYMENT_METHODS = [
  { value: "Cash", label: "Cash", icon: Banknote },
  { value: "UPI", label: "UPI", icon: Smartphone },
  { value: "Bank Transfer", label: "Bank Transfer", icon: CreditCard },
  { value: "Other", label: "Other", icon: IndianRupee },
];

export default function InvoicePaymentForm({
  invoice,
  loading = false,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState({
    payment_amount: "",
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "Cash",
    reference_number: "",
    notes: "",
  });

  const [error, setError] = useState("");

  const totalAmount = Number(invoice?.total_amount) || 0;
  const paidAmount = Number(invoice?.paid_amount) || 0;
  const balance = Math.max(0, totalAmount - paidAmount);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!invoice?.id) {
      setError("Invoice information is missing.");
      return;
    }

    const paymentError = validateInvoicePayment(
      form.payment_amount,
      balance
    );

    if (paymentError) {
      setError(paymentError);
      return;
    }

    if (!form.payment_date) {
      setError("Please select the payment date.");
      return;
    }

    if (typeof onSubmit !== "function") {
      setError("Payment submit handler is not configured.");
      return;
    }

    try {
      await onSubmit({
        invoice_id: invoice.id,
        payment_amount: Number(form.payment_amount),
        payment_date: form.payment_date,
        payment_method: form.payment_method,
        reference_number: form.reference_number.trim() || null,
        notes: form.notes.trim() || null,
      });
    } catch (submitError) {
      setError(
        submitError?.message ||
          "Unable to record payment. Please try again."
      );
    }
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass =
    "block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Invoice</p>
        <p className="mt-1 text-lg font-semibold text-gray-900">
          {invoice?.invoice_number != null
            ? `INV-${String(invoice.invoice_number).padStart(6, "0")}`
            : "Invoice"}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-500">Invoice Total</p>
            <p className="mt-1 font-semibold text-gray-900">
              {formatCurrency(totalAmount)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Already Paid</p>
            <p className="mt-1 font-semibold text-green-700">
              {formatCurrency(paidAmount)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Balance Due</p>
            <p className="mt-1 font-semibold text-red-600">
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
      </section>

      {balance <= 0 ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          This invoice is fully paid. No additional payment is required.
        </div>
      ) : (
        <>
          <div>
            <label className={labelClass}>
              Payment Amount (₹) *
            </label>

            <input
              type="number"
              min="0.01"
              max={balance}
              step="0.01"
              className={inputClass}
              value={form.payment_amount}
              onChange={(event) =>
                updateField("payment_amount", event.target.value)
              }
              placeholder="Enter payment amount"
              required
            />

            <button
              type="button"
              onClick={() =>
                updateField("payment_amount", balance.toFixed(2))
              }
              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Pay full balance ({formatCurrency(balance)})
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={15} />
                  Payment Date *
                </span>
              </label>

              <input
                type="date"
                className={inputClass}
                value={form.payment_date}
                onChange={(event) =>
                  updateField("payment_date", event.target.value)
                }
                required
              />
            </div>

            <div>
              <label className={labelClass}>
                Payment Method *
              </label>

              <select
                className={inputClass}
                value={form.payment_method}
                onChange={(event) =>
                  updateField("payment_method", event.target.value)
                }
                required
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Transaction / Reference Number
            </label>

            <input
              type="text"
              className={inputClass}
              value={form.reference_number}
              onChange={(event) =>
                updateField("reference_number", event.target.value)
              }
              placeholder="Optional UPI or bank reference"
            />
          </div>

          <div>
            <label className={labelClass}>
              Payment Notes
            </label>

            <textarea
              rows={3}
              className={inputClass}
              value={form.notes}
              onChange={(event) =>
                updateField("notes", event.target.value)
              }
              placeholder="Optional payment notes"
            />
          </div>
        </>
      )}

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
        )}

        {balance > 0 && (
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Recording Payment..." : "Record Payment"}
          </button>
        )}
      </div>
    </form>
  );
}
