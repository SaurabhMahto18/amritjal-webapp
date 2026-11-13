
import { useEffect, useState } from "react";
import {
  Bell,
  Info,
  MessageCircle,
  MessageSquare,
  Phone,
  ReceiptText,
  Save,
  Truck,
  Wallet,
} from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50";

const DEFAULT_SETTINGS = {
  mobile: "",
  smsEnabled: true,
  whatsappEnabled: true,
  deliveryNotification: true,
  paymentReminder: true,
  invoiceNotification: true,
  promotionalMessages: false,
};

function NotificationToggle({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  disabled,
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-b-0">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={19} />
        </div>

        <div className="min-w-0">
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
        } disabled:cursor-not-allowed disabled:opacity-50`}
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

export default function MessageSettingsSection({
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
      mobile:
        settings?.mobile ??
        customer?.billingPhone ??
        customer?.phone ??
        "",
    });
  }, [customer?.id, customer?.phone, customer?.billingPhone, settings]);

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

    const mobile = form.mobile.replace(/\D/g, "");

    if (
      (form.smsEnabled || form.whatsappEnabled) &&
      !/^[6-9]\d{9}$/.test(mobile)
    ) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (typeof onSave !== "function") {
      setError(
        "Message preferences are not connected to the database yet."
      );
      return;
    }

    onSave({
      customerId: customer?.id,
      ...form,
      mobile,
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Bell size={22} />
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">
            SMS / WhatsApp Settings
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer communication preferences.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Contact Number */}
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">
            Notification Mobile Number
          </span>

          <div className="relative">
            <Phone
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="tel"
              value={form.mobile}
              onChange={(event) =>
                updateField("mobile", event.target.value)
              }
              placeholder="Enter 10-digit mobile number"
              className={`${inputClass} pl-10`}
              disabled={isArchived}
            />
          </div>
        </label>

        {/* Channels */}
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="mb-2 text-sm font-semibold text-slate-800">
            Notification Channels
          </h4>

          <NotificationToggle
            icon={MessageSquare}
            title="SMS Notifications"
            description="Allow SMS notifications for this customer."
            checked={form.smsEnabled}
            onChange={(value) => updateField("smsEnabled", value)}
            disabled={isArchived}
          />

          <NotificationToggle
            icon={MessageCircle}
            title="WhatsApp Notifications"
            description="Allow WhatsApp notifications for this customer."
            checked={form.whatsappEnabled}
            onChange={(value) => updateField("whatsappEnabled", value)}
            disabled={isArchived}
          />
        </section>

        {/* Notification Types */}
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="mb-2 text-sm font-semibold text-slate-800">
            Notification Preferences
          </h4>

          <NotificationToggle
            icon={Truck}
            title="Delivery Notification"
            description="Send a message after a delivery is recorded."
            checked={form.deliveryNotification}
            onChange={(value) =>
              updateField("deliveryNotification", value)
            }
            disabled={isArchived}
          />

          <NotificationToggle
            icon={Wallet}
            title="Payment Reminder"
            description="Send payment due reminders to the customer."
            checked={form.paymentReminder}
            onChange={(value) => updateField("paymentReminder", value)}
            disabled={isArchived}
          />

          <NotificationToggle
            icon={ReceiptText}
            title="Invoice Notification"
            description="Notify the customer when an invoice is generated."
            checked={form.invoiceNotification}
            onChange={(value) =>
              updateField("invoiceNotification", value)
            }
            disabled={isArchived}
          />

          <NotificationToggle
            icon={MessageCircle}
            title="Promotional Messages"
            description="Allow optional promotional and business updates."
            checked={form.promotionalMessages}
            onChange={(value) =>
              updateField("promotionalMessages", value)
            }
            disabled={isArchived}
          />
        </section>

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
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Message Settings"}
            </button>
          </div>
        )}
      </form>

      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />

        <p className="text-xs leading-5 text-blue-700">
          These controls store communication preferences only. Actual SMS
          and WhatsApp delivery requires a connected messaging provider.
          Promotional messages should only be sent with appropriate
          customer consent.
        </p>
      </div>
    </div>
  );
}
