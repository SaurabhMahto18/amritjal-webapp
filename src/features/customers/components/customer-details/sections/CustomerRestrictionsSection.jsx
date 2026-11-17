
import { memo, useEffect, useId, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Info,
  Save,
  ShieldCheck,
  IndianRupee,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";

const DEFAULT_SETTINGS = {
  warningEnabled: false,
  deliveryBlocked: false,
  dueLimit: "",
  warningMessage: "",
  blockReason: "",
};

const inputClass =
  "h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
  icon: Icon,
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon size={19} aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {title}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-teal-600/15 ${
          checked ? "bg-teal-700" : "bg-slate-300"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function CustomerRestrictionsSection({
  customer,
  isArchived = false,
  settings,
  onSave,
  saving = false,
}) {
  const idPrefix = useId();

  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Avoid resetting the form merely because the parent
  // creates a new settings object during an unrelated render.
  const settingsKey = JSON.stringify(settings ?? {});

  useEffect(() => {
    let source = {};

    try {
      source = JSON.parse(settingsKey) || {};
    } catch {
      source = {};
    }

    setForm({
      ...DEFAULT_SETTINGS,
      ...source,
      warningEnabled: Boolean(source.warningEnabled),
      deliveryBlocked: Boolean(source.deliveryBlocked),
      dueLimit:
        source.dueLimit === null || source.dueLimit === undefined
          ? ""
          : String(source.dueLimit),
      warningMessage: String(source.warningMessage ?? ""),
      blockReason: String(source.blockReason ?? ""),
    });

    setError("");
    setSuccess("");
  }, [customer?.id, settingsKey]);

  const fieldDisabled = isArchived || saving;

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

    const dueLimit = String(form.dueLimit ?? "").trim();

    if (
      dueLimit !== "" &&
      (!Number.isFinite(Number(dueLimit)) || Number(dueLimit) < 0)
    ) {
      setError("Please enter a valid non-negative due limit.");
      return;
    }

    if (form.warningEnabled && !form.warningMessage.trim()) {
      setError("Please enter a warning message.");
      return;
    }

    if (form.deliveryBlocked && !form.blockReason.trim()) {
      setError("Please enter a reason for blocking delivery.");
      return;
    }

    if (typeof onSave !== "function") {
      setError(
        "Restriction settings are not connected to the database yet."
      );
      return;
    }

    try {
      await onSave({
        customerId: customer.id,
        ...form,
        dueLimit: dueLimit === "" ? null : Number(dueLimit),
      });

      setSuccess("Customer restrictions saved successfully.");
    } catch (err) {
      setError(
        err?.message || "Unable to save customer restrictions."
      );
    }
  }

  return (
    <section
      aria-labelledby={`${idPrefix}-title`}
      className="w-full min-w-0 space-y-4 sm:space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <ShieldCheck size={22} aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <h2
            id={`${idPrefix}-title`}
            className="text-base font-bold text-slate-900 sm:text-lg"
          >
            Customer Warn / Block
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            Manage customer payment warnings and delivery restrictions.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Warning Settings */}
        <section className="rounded-2xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5">
          <div className="flex items-center gap-2 border-b border-slate-100 py-3">
            <AlertTriangle
              size={18}
              className="text-amber-600"
              aria-hidden="true"
            />
            <h3 className="text-sm font-bold text-slate-800">
              Payment Warning
            </h3>
          </div>

          <ToggleRow
            icon={AlertTriangle}
            title="Enable Customer Warning"
            description="Show a warning when this customer's pending dues reach the configured limit."
            checked={form.warningEnabled}
            onChange={(value) => updateField("warningEnabled", value)}
            disabled={fieldDisabled}
          />

          {form.warningEnabled && (
            <div className="border-t border-slate-100 py-4">
              <label
                htmlFor={`${idPrefix}-warning-message`}
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Warning Message
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <textarea
                id={`${idPrefix}-warning-message`}
                value={form.warningMessage}
                onChange={(event) =>
                  updateField("warningMessage", event.target.value)
                }
                placeholder="Example: Please clear your pending payment."
                rows={3}
                maxLength={500}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 disabled:bg-slate-50"
                disabled={fieldDisabled}
                required
              />

              <p className="mt-1.5 text-right text-xs text-slate-400">
                {form.warningMessage.length}/500
              </p>
            </div>
          )}
        </section>

        {/* Due Limit */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <IndianRupee size={19} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800">
                Outstanding Due Limit
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Set the outstanding amount at which the customer should
                receive a warning.
              </p>
            </div>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Due Limit (₹)
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.dueLimit}
              onChange={(event) =>
                updateField("dueLimit", event.target.value)
              }
              placeholder="Enter due limit"
              className={inputClass}
              disabled={fieldDisabled}
            />
          </label>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Leave blank if you do not want to configure a due threshold.
          </p>
        </section>

        {/* Delivery Restriction */}
        <section className="rounded-2xl border border-rose-200 bg-white px-4 shadow-sm sm:px-5">
          <div className="flex items-center gap-2 border-b border-rose-100 py-3">
            <Ban
              size={18}
              className="text-rose-600"
              aria-hidden="true"
            />
            <h3 className="text-sm font-bold text-slate-800">
              Delivery Restriction
            </h3>
          </div>

          <ToggleRow
            icon={Ban}
            title="Block Customer Delivery"
            description="Mark this customer as blocked for future deliveries."
            checked={form.deliveryBlocked}
            onChange={(value) => updateField("deliveryBlocked", value)}
            disabled={fieldDisabled}
          />

          {form.deliveryBlocked && (
            <div className="border-t border-rose-100 py-4">
              <label
                htmlFor={`${idPrefix}-block-reason`}
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Block Reason
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <textarea
                id={`${idPrefix}-block-reason`}
                value={form.blockReason}
                onChange={(event) =>
                  updateField("blockReason", event.target.value)
                }
                placeholder="Enter reason for blocking delivery"
                rows={3}
                maxLength={500}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 disabled:bg-slate-50"
                disabled={fieldDisabled}
                required
              />

              <p className="mt-1.5 text-right text-xs text-slate-400">
                {form.blockReason.length}/500
              </p>
            </div>
          )}
        </section>

        {/* Error */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"
          >
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="leading-5">{error}</p>
          </div>
        )}

        {/* Success */}
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
            <p className="leading-5">{success}</p>
          </div>
        )}

        {/* Save Button */}
        {!isArchived && (
          <div className="sticky bottom-0 z-10 -mx-3.5 border-t border-slate-200 bg-white/95 px-3.5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
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
                  Save Restrictions
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* Accounting Information */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3.5 sm:p-4">
        <Info
          size={19}
          className="mt-0.5 shrink-0 text-amber-700"
          aria-hidden="true"
        />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Important: Separate Accounting Treatment
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-800 sm:text-sm">
            Warning and delivery restriction settings are separate from
            customer opening balance and security deposit. They must not
            modify customer ledger or automatically adjust outstanding dues.
          </p>
        </div>
      </div>

      {/* Archived Notice */}
      {isArchived && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          <ShieldCheck
            size={17}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          This customer is archived. Restriction settings cannot be edited.
        </div>
      )}
    </section>
  );
}

export default memo(CustomerRestrictionsSection);
