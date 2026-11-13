
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Info,
  Save,
  ShieldCheck,
} from "lucide-react";

const DEFAULT_SETTINGS = {
  warningEnabled: false,
  deliveryBlocked: false,
  dueLimit: "",
  warningMessage: "",
  blockReason: "",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50";

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
  icon: Icon,
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon size={19} />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
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
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        } disabled:opacity-50`}
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function CustomerRestrictionsSection({
  customer,
  isArchived = false,
  settings,
  onSave,
  saving = false,
}) {
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      ...DEFAULT_SETTINGS,
      ...(settings || {}),
    });
  }, [customer?.id, settings]);

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

    const dueLimit = form.dueLimit.trim();

    if (dueLimit !== "" && (!Number.isFinite(Number(dueLimit)) || Number(dueLimit) < 0)) {
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

    onSave({
      customerId: customer?.id,
      ...form,
      dueLimit: dueLimit === "" ? null : Number(dueLimit),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <ShieldCheck size={22} />
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">
            Customer Warn / Block
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Manage payment warnings and delivery restrictions.
          </p>
        </div>
      </div>

      {/* Customer status */}
      <div className="rounded-xl border border-slate-200 bg-white px-4">
        <ToggleRow
          icon={AlertTriangle}
          title="Enable Customer Warning"
          description="Show a warning when this customer has pending dues."
          checked={form.warningEnabled}
          onChange={(value) => updateField("warningEnabled", value)}
          disabled={isArchived}
        />

        {form.warningEnabled && (
          <div className="border-t border-slate-100 py-4">
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Warning Message
            </label>

            <textarea
              value={form.warningMessage}
              onChange={(event) =>
                updateField("warningMessage", event.target.value)
              }
              placeholder="Example: Please clear your pending payment."
              rows={3}
              className={inputClass}
              disabled={isArchived}
            />
          </div>
        )}
      </div>

      {/* Due limit */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-slate-800">
          Outstanding Due Limit
        </h4>

        <p className="mt-1 text-xs text-slate-500">
          Set the amount at which the customer should receive a warning.
        </p>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium text-slate-600">
            Due Limit (₹)
          </span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={form.dueLimit}
            onChange={(event) =>
              updateField("dueLimit", event.target.value)
            }
            placeholder="Enter due limit"
            className={inputClass}
            disabled={isArchived}
          />
        </label>
      </section>

      {/* Delivery block */}
      <section className="rounded-xl border border-rose-200 bg-white p-4">
        <ToggleRow
          icon={Ban}
          title="Block Customer Delivery"
          description="Mark this customer as blocked for future deliveries."
          checked={form.deliveryBlocked}
          onChange={(value) => updateField("deliveryBlocked", value)}
          disabled={isArchived}
        />

        {form.deliveryBlocked && (
          <div className="border-t border-rose-100 pt-4">
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Block Reason
            </label>

            <textarea
              value={form.blockReason}
              onChange={(event) =>
                updateField("blockReason", event.target.value)
              }
              placeholder="Enter reason for blocking delivery"
              rows={3}
              className={inputClass}
              disabled={isArchived}
            />

            <p className="mt-2 text-xs text-rose-600">
              Note: This setting will only affect actual delivery
              operations after backend integration.
            </p>
          </div>
        )}
      </section>

      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}

      {!isArchived && (
        <div className="flex justify-end border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Restrictions"}
          </button>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <p className="text-xs leading-5 text-blue-700">
          Warning and block preferences are separate from customer
          opening balance and security deposit. They must not modify
          customer ledger or automatically adjust outstanding dues.
        </p>
      </div>
    </div>
  );
}
