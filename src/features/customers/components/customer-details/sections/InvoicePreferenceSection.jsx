
import { memo, useEffect, useState } from "react";
import {
  CalendarDays,
  Info,
  Mail,
  Phone,
  ReceiptText,
  Save,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ShieldCheck,
  FileText,
  Clock3,
  ChevronRight,
} from "lucide-react";

const initialPreferences = {
  invoiceFrequency: "monthly",
  paymentTerms: "7",
  gstInvoice: false,
  billingEmail: "",
  billingPhone: "",
  invoiceNotes: "",
};

const inputClass =
  "h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

function FrequencyCard({
  value,
  selected,
  onChange,
  disabled,
  title,
  description,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={() => onChange(value)}
      className={`flex min-h-[90px] min-w-0 flex-col justify-between rounded-xl border p-3 text-left transition active:scale-[0.98] sm:p-4 ${
        selected
          ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/10"
          : "border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span
          className={`flex size-8 items-center justify-center rounded-lg ${
            selected
              ? "bg-teal-100 text-teal-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <CalendarDays size={16} aria-hidden="true" />
        </span>

        <span
          className={`flex size-5 items-center justify-center rounded-full border ${
            selected
              ? "border-teal-600 bg-teal-600"
              : "border-slate-300 bg-white"
          }`}
        >
          {selected && (
            <span className="size-2 rounded-full bg-white" />
          )}
        </span>
      </div>

      <span className="mt-3 block min-w-0">
        <span className="block text-sm font-bold text-slate-800">
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </button>
  );
}

function ContactField({
  label,
  name,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
  autoComplete,
  disabled,
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <div className="relative">
        <Icon
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`${inputClass} pl-10`}
        />
      </div>
    </label>
  );
}

function InvoicePreferenceSection({
  customer,
  isArchived = false,
  preferences,
  onSave,
  saving = false,
}) {
  const [form, setForm] = useState(() => ({
    ...initialPreferences,
    ...(preferences || {}),
    billingEmail:
      preferences?.billingEmail ?? customer?.email ?? "",
    billingPhone:
      preferences?.billingPhone ??
      customer?.billingPhone ??
      customer?.phone ??
      "",
  }));

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    setError("");
    setSuccess("");
  }, [
    customer?.id,
    customer?.email,
    customer?.phone,
    customer?.billingPhone,
    preferences,
  ]);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (isArchived) {
      setError("Archived customers cannot be updated.");
      return;
    }

    if (!customer?.id) {
      setError("Customer information is unavailable.");
      return;
    }

    if (
      !["daily", "weekly", "monthly"].includes(
        form.invoiceFrequency
      )
    ) {
      setError("Please select a valid invoice frequency.");
      return;
    }

    const paymentTerms = Number(form.paymentTerms);

    if (
      String(form.paymentTerms).trim() === "" ||
      !Number.isInteger(paymentTerms) ||
      paymentTerms < 0 ||
      paymentTerms > 365
    ) {
      setError("Payment terms must be between 0 and 365 days.");
      return;
    }

    const billingEmail = String(form.billingEmail || "").trim();

    if (
      billingEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)
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

    try {
      await onSave({
        customerId: customer.id,
        ...form,
        billingEmail,
        paymentTerms,
      });

      setSuccess("Invoice preferences saved successfully.");
    } catch (err) {
      setError(
        err?.message || "Unable to save invoice preferences."
      );
    }
  }

  const frequencyOptions = [
    {
      value: "daily",
      title: "Daily",
      description: "Every day",
    },
    {
      value: "weekly",
      title: "Weekly",
      description: "Once a week",
    },
    {
      value: "monthly",
      title: "Monthly",
      description: "Once a month",
    },
  ];

  return (
    <section
      aria-labelledby="invoice-preference-title"
      className="w-full min-w-0 space-y-4 sm:space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <ReceiptText size={22} aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h2
              id="invoice-preference-title"
              className="text-base font-bold text-slate-900 sm:text-lg"
            >
              Invoice Preferences
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Configure billing and invoice preferences.
            </p>
          </div>
        </div>

        {isArchived && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700">
            Archived
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Invoice Frequency */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Invoice Generation Frequency
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Choose how often invoices should be generated.
            </p>
          </div>

          <fieldset
            disabled={isArchived || saving}
            className="grid grid-cols-1 gap-2.5 min-[390px]:grid-cols-3"
          >
            <legend className="sr-only">
              Invoice Generation Frequency
            </legend>

            {frequencyOptions.map((option) => (
              <FrequencyCard
                key={option.value}
                {...option}
                selected={form.invoiceFrequency === option.value}
                onChange={(value) =>
                  updateField("invoiceFrequency", value)
                }
                disabled={isArchived || saving}
              />
            ))}
          </fieldset>
        </section>

        {/* Payment Terms */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Clock3
              size={18}
              className="text-teal-700"
              aria-hidden="true"
            />
            <h3 className="text-sm font-bold text-slate-800">
              Payment Terms
            </h3>
          </div>

          <label htmlFor="payment-terms" className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Payment Due Period (Days)
            </span>

            <div className="relative">
              <CalendarDays
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="payment-terms"
                name="paymentTerms"
                type="number"
                min="0"
                max="365"
                step="1"
                inputMode="numeric"
                value={form.paymentTerms}
                onChange={(event) =>
                  updateField("paymentTerms", event.target.value)
                }
                className={`${inputClass} pl-10`}
                disabled={isArchived || saving}
              />
            </div>

            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Enter 0 for payment due immediately, or up to 365 days.
            </p>
          </label>
        </section>

        {/* GST Preference */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <ReceiptText size={19} aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <label
                htmlFor="gst-invoice"
                className="flex cursor-pointer items-center justify-between gap-3"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-800">
                    GST Invoice
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    Enable GST invoice preference for this customer.
                  </span>
                </span>

                <input
                  id="gst-invoice"
                  type="checkbox"
                  checked={Boolean(form.gstInvoice)}
                  onChange={(event) =>
                    updateField("gstInvoice", event.target.checked)
                  }
                  disabled={isArchived || saving}
                  className="size-5 shrink-0 accent-teal-700"
                />
              </label>
            </div>
          </div>

          {form.gstInvoice && (
            <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs leading-5 text-amber-800">
                GST invoice preference is enabled. Actual tax
                calculation and GST compliance require verified
                business and customer tax details.
              </p>
            </div>
          )}
        </section>

        {/* Billing Contact */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3.5 sm:px-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Phone size={18} aria-hidden="true" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Billing Contact Details
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Contact information for billing communication.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <ContactField
              label="Billing Email"
              name="billing-email"
              value={form.billingEmail}
              onChange={(event) =>
                updateField("billingEmail", event.target.value)
              }
              placeholder="billing@example.com"
              icon={Mail}
              type="email"
              autoComplete="email"
              disabled={isArchived || saving}
            />

            <ContactField
              label="Billing Mobile Number"
              name="billing-phone"
              value={form.billingPhone}
              onChange={(event) =>
                updateField("billingPhone", event.target.value)
              }
              placeholder="Billing mobile number"
              icon={Phone}
              type="tel"
              autoComplete="tel"
              disabled={isArchived || saving}
            />
          </div>
        </section>

        {/* Invoice Notes */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3.5 sm:px-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <FileText size={18} aria-hidden="true" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Invoice Notes
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Optional billing instructions.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <label htmlFor="invoice-notes" className="sr-only">
              Invoice Notes
            </label>

            <textarea
              id="invoice-notes"
              name="invoiceNotes"
              rows={4}
              value={form.invoiceNotes}
              onChange={(event) =>
                updateField("invoiceNotes", event.target.value)
              }
              className="min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 disabled:cursor-not-allowed disabled:bg-slate-50"
              placeholder="Additional invoice instructions..."
              disabled={isArchived || saving}
            />
          </div>
        </section>

        {/* Feedback */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="min-w-0 leading-5">{error}</p>
          </div>
        )}

        {success && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700"
          >
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="min-w-0 leading-5">{success}</p>
          </div>
        )}

        {/* Save Button */}
        {!isArchived && (
          <div className="sticky bottom-0 z-10 -mx-1 border-t border-slate-200 bg-white/95 px-1 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-56"
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} aria-hidden="true" />
                  Save Invoice Preference
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* Information */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3.5 sm:p-4">
        <Info
          size={19}
          className="mt-0.5 shrink-0 text-blue-700"
          aria-hidden="true"
        />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-blue-900">
            Billing Workflow Information
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-800 sm:text-sm">
            These preferences do not automatically generate invoices.
            Invoice generation, tax calculation and invoice delivery
            depend on the billing workflow and connected services.
          </p>
        </div>
      </div>

      {isArchived && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          <ShieldCheck
            size={17}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          This customer is archived. Invoice preferences cannot be edited.
        </div>
      )}
    </section>
  );
}

export default memo(InvoicePreferenceSection);
