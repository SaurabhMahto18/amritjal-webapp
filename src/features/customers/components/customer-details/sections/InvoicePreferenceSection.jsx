
import { useEffect, useState } from "react";
import {
  CalendarDays,
  FileText,
  Info,
  Mail,
  Phone,
  ReceiptText,
} from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50";

const initialPreferences = {
  invoiceFrequency: "monthly",
  paymentTerms: "7",
  gstInvoice: false,
  billingEmail: "",
  billingPhone: "",
  invoiceNotes: "",
};

export default function InvoicePreferenceSection({
  customer,
  isArchived = false,
  preferences,
  onSave,
  saving = false,
}) {
  const [form, setForm] = useState(initialPreferences);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      ...initialPreferences,
      ...(preferences || {}),
      billingEmail:
        preferences?.billingEmail ?? customer?.email ?? "",
      billingPhone:
        preferences?.billingPhone ??
        customer?.billingPhone ??
        customer?.phone ??
        "",
    });
  }, [customer?.id, customer?.email, customer?.phone, customer?.billingPhone, preferences]);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (isArchived) {
      setError("Archived customers cannot be updated.");
      return;
    }

    if (!["daily", "weekly", "monthly"].includes(form.invoiceFrequency)) {
      setError("Please select a valid invoice frequency.");
      return;
    }

    if (
      !Number.isInteger(Number(form.paymentTerms)) ||
      Number(form.paymentTerms) < 0 ||
      Number(form.paymentTerms) > 365
    ) {
      setError("Payment terms must be between 0 and 365 days.");
      return;
    }

    if (
      form.billingEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.billingEmail)
    ) {
      setError("Please enter a valid billing email address.");
      return;
    }

    if (typeof onSave !== "function") {
      setError(
        "Invoice preferences are not connected to the database yet."
      );
      return;
    }

    onSave({
      customerId: customer?.id,
      ...form,
      paymentTerms: Number(form.paymentTerms),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ReceiptText size={22} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">
            Customer Invoice Preference
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Configure billing and invoice preferences.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Invoice Frequency */}
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-slate-600">
            Invoice Generation Frequency
          </legend>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                  form.invoiceFrequency === option.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="invoiceFrequency"
                  value={option.value}
                  checked={form.invoiceFrequency === option.value}
                  onChange={(event) =>
                    updateField("invoiceFrequency", event.target.value)
                  }
                  disabled={isArchived}
                  className="size-4 accent-blue-600"
                />
                <span className="text-sm font-semibold text-slate-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Payment Terms */}
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">
            Payment Terms (Days)
          </span>
          <div className="relative">
            <CalendarDays
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="number"
              min="0"
              max="365"
              step="1"
              value={form.paymentTerms}
              onChange={(event) =>
                updateField("paymentTerms", event.target.value)
              }
              className={`${inputClass} pl-10`}
              disabled={isArchived}
            />
          </div>
        </label>

        {/* GST Preference */}
        <div className="rounded-xl border border-slate-200 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.gstInvoice}
              onChange={(event) =>
                updateField("gstInvoice", event.target.checked)
              }
              disabled={isArchived}
              className="mt-1 size-4 accent-blue-600"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">
                Generate GST Invoice
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Enable GST invoice preference for this customer. Actual tax
                calculation and GST compliance require verified business
                and customer tax details.
              </span>
            </span>
          </label>
        </div>

        {/* Billing Contact */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-800">
            Billing Contact Details
          </h4>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Billing Email
            </span>
            <div className="relative">
              <Mail
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                value={form.billingEmail}
                onChange={(event) =>
                  updateField("billingEmail", event.target.value)
                }
                className={`${inputClass} pl-10`}
                placeholder="billing@example.com"
                disabled={isArchived}
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Billing Mobile Number
            </span>
            <div className="relative">
              <Phone
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="tel"
                value={form.billingPhone}
                onChange={(event) =>
                  updateField("billingPhone", event.target.value)
                }
                className={`${inputClass} pl-10`}
                placeholder="Billing mobile number"
                disabled={isArchived}
              />
            </div>
          </label>
        </div>

        {/* Notes */}
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">
            Invoice Notes
          </span>
          <textarea
            rows={3}
            value={form.invoiceNotes}
            onChange={(event) =>
              updateField("invoiceNotes", event.target.value)
            }
            className={inputClass}
            placeholder="Additional invoice instructions..."
            disabled={isArchived}
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        )}

        {!isArchived && (
          <div className="flex justify-end border-t border-slate-200 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Invoice Preference"}
            </button>
          </div>
        )}
      </form>

      <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <p className="text-xs leading-5 text-blue-700">
          These preferences do not automatically generate invoices.
          Invoice generation and delivery will be connected through the
          billing workflow.
        </p>
      </div>
    </div>
  );
}
