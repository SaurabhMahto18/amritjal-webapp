
import { memo, useEffect, useState } from "react";
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
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ShieldCheck,
  Send,
} from "lucide-react";

const DEFAULT_SETTINGS = {
  mobile: "",
  smsEnabled: true,
  whatsappEnabled: true,
  deliveryNotification: true,
  paymentReminder: true,
  invoiceNotification: true,
  promotionalMessages: false,
};

function ChannelCard({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  disabled,
  color = "teal",
}) {
  const active = checked;

  const colorClasses =
    color === "green"
      ? active
        ? "border-emerald-300 bg-emerald-50"
        : "border-slate-200 bg-white"
      : active
        ? "border-teal-300 bg-teal-50"
        : "border-slate-200 bg-white";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={title}
      disabled={disabled}
      onClick={() => onChange(!active)}
      className={`flex min-h-[112px] min-w-0 flex-col justify-between rounded-2xl border p-3.5 text-left transition active:scale-[0.98] sm:p-4 ${colorClasses} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            active
              ? color === "green"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-teal-100 text-teal-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <Icon size={20} aria-hidden="true" />
        </div>

        <span
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
            active ? "bg-teal-700" : "bg-slate-300"
          }`}
        >
          <span
            className={`size-4 rounded-full bg-white shadow-sm transition ${
              active ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </span>
      </div>

      <div className="mt-3 min-w-0">
        <p className="text-sm font-bold text-slate-800">
          {title}
        </p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </button>
  );
}

function PreferenceCard({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  disabled,
  promotional = false,
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 transition sm:p-3.5 ${
        checked
          ? "border-teal-100 bg-teal-50/50"
          : "border-slate-100 bg-slate-50/70"
      }`}
    >
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          checked
            ? "bg-teal-100 text-teal-700"
            : "bg-white text-slate-500"
        }`}
      >
        <Icon size={19} aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">
          {description}
        </p>
        {promotional && (
          <span className="mt-1 inline-flex text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Consent required
          </span>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          checked ? "bg-teal-700" : "bg-slate-300"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span
          className={`size-4 rounded-full bg-white shadow-sm transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function MessageSettingsSection({
  customer,
  isArchived = false,
  settings,
  onSave,
  saving = false,
}) {
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    setError("");
    setSuccess("");
  }, [
    customer?.id,
    customer?.phone,
    customer?.billingPhone,
    settings,
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

    const mobile = String(form.mobile || "").replace(/\D/g, "");

    if (
      (form.smsEnabled || form.whatsappEnabled) &&
      !/^[6-9]\d{9}$/.test(mobile)
    ) {
      setError(
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    if (typeof onSave !== "function") {
      setError(
        "Message preferences are not connected to the database yet."
      );
      return;
    }

    try {
      await onSave({
        customerId: customer.id,
        ...form,
        mobile,
      });

      setSuccess("Message settings saved successfully.");
    } catch (err) {
      setError(
        err?.message || "Unable to save message settings."
      );
    }
  }

  const activeChannels = [
    form.smsEnabled,
    form.whatsappEnabled,
  ].filter(Boolean).length;

  const activePreferences = [
    form.deliveryNotification,
    form.paymentReminder,
    form.invoiceNotification,
    form.promotionalMessages,
  ].filter(Boolean).length;

  return (
    <section
      aria-labelledby="message-settings-title"
      className="w-full min-w-0 space-y-4 sm:space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Bell size={22} aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h2
              id="message-settings-title"
              className="text-base font-bold text-slate-900 sm:text-lg"
            >
              Communication Settings
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Manage customer notifications.
            </p>
          </div>
        </div>

        {isArchived && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700 sm:text-xs">
            Archived
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Mobile Number */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Phone
              size={17}
              className="text-teal-700"
              aria-hidden="true"
            />
            <h3 className="text-sm font-bold text-slate-800">
              Notification Number
            </h3>
          </div>

          <label htmlFor="notification-mobile" className="sr-only">
            Notification Mobile Number
          </label>

          <div className="flex min-w-0 items-center rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-600/10">
            <span className="flex h-12 shrink-0 items-center gap-1 border-r border-slate-200 px-3 text-sm font-semibold text-slate-600">
              <Phone size={15} aria-hidden="true" />
              +91
            </span>

            <input
              id="notification-mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={form.mobile}
              onChange={(event) =>
                updateField(
                  "mobile",
                  event.target.value.replace(/\D/g, "").slice(0, 10)
                )
              }
              placeholder="10-digit mobile number"
              className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isArchived || saving}
            />
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            This number will be used for SMS and WhatsApp notifications.
          </p>
        </section>

        {/* Communication Channels */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Communication Channels
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Choose how to contact this customer.
              </p>
            </div>

            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
              {activeChannels}/2 Active
            </span>
          </div>

          <fieldset
            disabled={isArchived || saving}
            className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2"
          >
            <ChannelCard
              icon={MessageSquare}
              title="SMS"
              description="Text message alerts"
              checked={form.smsEnabled}
              onChange={(value) => updateField("smsEnabled", value)}
              disabled={isArchived || saving}
            />

            <ChannelCard
              icon={MessageCircle}
              title="WhatsApp"
              description="WhatsApp messages"
              checked={form.whatsappEnabled}
              onChange={(value) => updateField("whatsappEnabled", value)}
              disabled={isArchived || saving}
              color="green"
            />
          </fieldset>
        </section>

        {/* Notification Preferences */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Notification Preferences
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Select the messages this customer can receive.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {activePreferences}/4 Enabled
            </span>
          </div>

          <div className="space-y-2.5">
            <PreferenceCard
              icon={Truck}
              title="Delivery Updates"
              description="Notify after a delivery is recorded."
              checked={form.deliveryNotification}
              onChange={(value) =>
                updateField("deliveryNotification", value)
              }
              disabled={isArchived || saving}
            />

            <PreferenceCard
              icon={Wallet}
              title="Payment Reminders"
              description="Send reminders for pending payments."
              checked={form.paymentReminder}
              onChange={(value) =>
                updateField("paymentReminder", value)
              }
              disabled={isArchived || saving}
            />

            <PreferenceCard
              icon={ReceiptText}
              title="Invoice Notifications"
              description="Notify when a new invoice is generated."
              checked={form.invoiceNotification}
              onChange={(value) =>
                updateField("invoiceNotification", value)
              }
              disabled={isArchived || saving}
            />

            <PreferenceCard
              icon={Send}
              title="Promotional Messages"
              description="Optional offers and business updates."
              checked={form.promotionalMessages}
              onChange={(value) =>
                updateField("promotionalMessages", value)
              }
              disabled={isArchived || saving}
              promotional
            />
          </div>
        </section>

        {/* Messages */}
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

        {/* Save */}
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
                  Save Message Settings
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
            Communication & Customer Consent
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-800 sm:text-sm">
            These settings store communication preferences only.
            Actual SMS and WhatsApp delivery requires a connected
            messaging provider. Promotional messages should only
            be sent with appropriate customer consent.
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
          This customer is archived. Communication settings cannot be edited.
        </div>
      )}
    </section>
  );
}

export default memo(MessageSettingsSection);
