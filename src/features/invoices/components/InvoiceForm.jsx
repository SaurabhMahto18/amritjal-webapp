import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  IndianRupee,
  Save,
  UserRound,
  AlertCircle,
  ReceiptText,
  Package,
  Tag,
} from "lucide-react";

import {
  calculateItemsSubtotal,
  formatCurrency,
  toNumber,
  validateBillingPeriod,
} from "../utils/invoiceUtils";

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const initialForm = {
  customer_id: "",
  invoice_date: getToday(),
  period_start: "",
  period_end: "",
  discount_amount: "0",
  tax_amount: "0",
  notes: "",
};

const getId = (value) => String(value ?? "");

const getDeliveryAmount = (delivery) => {
  if (delivery.amount !== null && delivery.amount !== undefined) {
    return toNumber(delivery.amount);
  }

  return (
    toNumber(delivery.jar_quantity) *
    toNumber(delivery.jar_rate)
  );
};

const inputClass =
  "mt-2 block min-h-[52px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 disabled:cursor-not-allowed disabled:bg-gray-50";

const labelClass =
  "block text-sm font-medium leading-5 text-gray-700";

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-6 flex items-start gap-3.5">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
        <Icon size={20} strokeWidth={1.9} />
      </div>

      <div className="min-w-0 pt-0.5">
        <h2 className="text-base font-semibold leading-6 text-gray-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm leading-5 text-gray-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function FormSection({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7 ${className}`}
    >
      {children}
    </section>
  );
}

export default function InvoiceForm({
  customers = [],
  deliveries = [],
  settings = {},
  initialValues = {},
  loading = false,
  submitLabel = "Create Invoice",
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(() => ({
    ...initialForm,
    ...initialValues,
  }));

  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      ...initialForm,
      ...initialValues,
    });
  }, [initialValues]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) setError("");
  };

  const filteredDeliveries = useMemo(() => {
    if (!form.customer_id) return [];

    return deliveries.filter((delivery) => {
      if (
        getId(delivery.customer_id) !==
        getId(form.customer_id)
      ) {
        return false;
      }

      if (
        form.period_start &&
        delivery.delivery_date < form.period_start
      ) {
        return false;
      }

      if (
        form.period_end &&
        delivery.delivery_date > form.period_end
      ) {
        return false;
      }

      return true;
    });
  }, [
    deliveries,
    form.customer_id,
    form.period_start,
    form.period_end,
  ]);

  const subtotal = useMemo(
    () =>
      calculateItemsSubtotal(
        filteredDeliveries.map((delivery) => ({
          amount: getDeliveryAmount(delivery),
        }))
      ),
    [filteredDeliveries]
  );

  const discountAmount = Math.max(
    0,
    toNumber(form.discount_amount)
  );

  const taxAmount = Math.max(
    0,
    toNumber(form.tax_amount)
  );

  const totalAmount = Math.max(
    0,
    subtotal - discountAmount + taxAmount
  );

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) =>
          getId(customer.id) === getId(form.customer_id)
      ) || null,
    [customers, form.customer_id]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.customer_id) {
      setError("Please select a customer.");
      return;
    }

    if (!form.invoice_date) {
      setError("Please select an invoice date.");
      return;
    }

    const periodValidation = validateBillingPeriod(
      form.period_start,
      form.period_end
    );

    if (!periodValidation.valid) {
      setError(periodValidation.message);
      return;
    }

    const discountInput = Number(form.discount_amount);
    const taxInput = Number(form.tax_amount);

    if (
      form.discount_amount === "" ||
      !Number.isFinite(discountInput) ||
      discountInput < 0
    ) {
      setError("Discount must be a valid non-negative amount.");
      return;
    }

    if (
      form.tax_amount === "" ||
      !Number.isFinite(taxInput) ||
      taxInput < 0
    ) {
      setError("Tax must be a valid non-negative amount.");
      return;
    }

    if (discountAmount > subtotal) {
      setError("Discount cannot be greater than the delivery subtotal.");
      return;
    }

    if (filteredDeliveries.length === 0) {
      setError(
        "No deliveries were found for this customer and billing period."
      );
      return;
    }

    if (typeof onSubmit !== "function") {
      setError("Invoice submit handler is not configured.");
      return;
    }

    try {
      await onSubmit({
        customer_id: form.customer_id,
        invoice_date: form.invoice_date,
        period_start: form.period_start,
        period_end: form.period_end,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        notes: form.notes.trim(),
        subtotal,
        total_amount: totalAmount,
        delivery_ids: filteredDeliveries.map(
          (delivery) => delivery.id
        ),
      });
    } catch (submitError) {
      setError(
        submitError?.message ||
          "Unable to save the invoice. Please try again."
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full space-y-6 p-4 sm:space-y-7 sm:p-6 lg:p-8"
    >
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p className="leading-5">{error}</p>
        </div>
      )}

      <FormSection>
        <SectionHeading
          icon={CalendarDays}
          title="Customer & Billing Period"
          description="Select the customer and define the invoice billing dates."
        />

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClass}>
              Customer <span className="text-red-500">*</span>
            </label>

            <select
              className={inputClass}
              value={form.customer_id}
              onChange={(event) =>
                updateField("customer_id", event.target.value)
              }
              disabled={loading}
              required
            >
              <option value="">Select customer</option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.code ? ` (${customer.code})` : ""}
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-gray-50 px-4 py-3.5">
                <span className="text-sm font-semibold text-gray-800">
                  {selectedCustomer.name}
                </span>

                <span className="text-sm text-gray-500">
                  {selectedCustomer.phone || "No phone number available"}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Invoice Date <span className="text-red-500">*</span>
            </label>

            <input
              type="date"
              className={inputClass}
              value={form.invoice_date}
              onChange={(event) =>
                updateField("invoice_date", event.target.value)
              }
              disabled={loading}
              required
            />
          </div>

          <div className="hidden md:block" />

          <div>
            <label className={labelClass}>
              Billing Period Start <span className="text-red-500">*</span>
            </label>

            <input
              type="date"
              className={inputClass}
              value={form.period_start}
              onChange={(event) =>
                updateField("period_start", event.target.value)
              }
              max={form.period_end || undefined}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className={labelClass}>
              Billing Period End <span className="text-red-500">*</span>
            </label>

            <input
              type="date"
              className={inputClass}
              value={form.period_end}
              onChange={(event) =>
                updateField("period_end", event.target.value)
              }
              min={form.period_start || undefined}
              disabled={loading}
              required
            />
          </div>
        </div>
      </FormSection>

      <FormSection>
        <SectionHeading
          icon={Package}
          title="Delivery Details"
          description="Deliveries matching the selected customer and billing period."
        />

        {!form.customer_id ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
            <UserRound className="mx-auto mb-3 text-gray-400" size={26} />
            <p className="text-sm font-medium text-gray-700">
              Select a customer first
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Customer delivery records will appear here.
            </p>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-10 text-center">
            <CalendarDays className="mx-auto mb-3 text-amber-600" size={26} />
            <p className="text-sm font-medium text-gray-800">
              No deliveries found
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Try changing the customer or billing period.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-4">Delivery Date</th>
                      <th className="px-4 py-4 text-right">Quantity</th>
                      <th className="px-4 py-4 text-right">Rate</th>
                      <th className="px-4 py-4 text-right">Amount</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredDeliveries.map((delivery) => (
                      <tr
                        key={delivery.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                          {delivery.delivery_date || "—"}
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums text-gray-700">
                          {toNumber(delivery.jar_quantity)}
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums text-gray-700">
                          {formatCurrency(delivery.jar_rate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums text-gray-900">
                          {formatCurrency(getDeliveryAmount(delivery))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-4">
              <span className="text-sm font-medium text-gray-500">
                {filteredDeliveries.length} delivery record(s)
              </span>
              <span className="text-sm font-semibold text-gray-900">
                Subtotal: {formatCurrency(subtotal)}
              </span>
            </div>
          </>
        )}
      </FormSection>

      <FormSection>
        <SectionHeading
          icon={Tag}
          title="Adjustments & Notes"
          description="Apply invoice discount, tax and optional remarks."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              Discount Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              max={subtotal}
              step="0.01"
              className={inputClass}
              value={form.discount_amount}
              onChange={(event) =>
                updateField("discount_amount", event.target.value)
              }
              disabled={loading}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className={labelClass}>
              Tax Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={form.tax_amount}
              onChange={(event) =>
                updateField("tax_amount", event.target.value)
              }
              disabled={loading}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className={labelClass}>
            Invoice Notes
          </label>
          <textarea
            rows={3}
            maxLength={2000}
            className={`${inputClass} min-h-[104px] resize-y`}
            value={form.notes}
            onChange={(event) =>
              updateField("notes", event.target.value)
            }
            placeholder="Add any additional information..."
            disabled={loading}
          />
          <p className="mt-2 text-right text-xs text-gray-400">
            {form.notes.length}/2000
          </p>
        </div>
      </FormSection>

      <section className="overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-teal-100 bg-teal-50/70 px-5 py-5 sm:px-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm">
            <ReceiptText size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Invoice Summary
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Review the calculated invoice amount.
            </p>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-gray-600">
              Deliveries ({filteredDeliveries.length})
            </span>
            <span className="font-medium tabular-nums text-gray-900">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-gray-600">Discount</span>
            <span className="font-medium tabular-nums text-gray-900">
              − {formatCurrency(discountAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium tabular-nums text-gray-900">
              + {formatCurrency(taxAmount)}
            </span>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-semibold text-gray-900">
              Total Invoice Amount
            </span>
            <span className="text-2xl font-bold tabular-nums text-teal-800">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <p className="border-t border-gray-100 pt-4 text-sm leading-6 text-gray-500">
            Previous outstanding, if any, will be calculated during invoice generation.
          </p>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={loading || filteredDeliveries.length === 0}
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Save size={17} />
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
