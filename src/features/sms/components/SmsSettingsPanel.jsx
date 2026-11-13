import { Settings2 } from "lucide-react";

import MessageChannelSelector from "./MessageChannelSelector";
import NotificationToggle from "./NotificationToggle";
import NotificationAccordion from "./NotificationAccordion";
import PaymentReminder from "./PaymentReminder";
import SmsWarning from "./SmsWarning";

const notificationItems = [
  {
    key: "delivery",
    title: "Send Delivery SMS",
    description:
      "Automatically notify this customer when a delivery is recorded.",
  },
  {
    key: "payment_received",
    title: "Send Payment Received SMS",
    description:
      "Send a message when a payment is received from this customer.",
  },
  {
    key: "invoice_ready",
    title: "Send Invoice Ready SMS",
    description:
      "Notify this customer when a new invoice is ready.",
  },
];

export default function SmsSettingsPanel({
  customer,
  settings = {},
  reminder = {},
  onSettingsChange,
  onReminderChange,
  onSave,
  saving = false,
  hasActivePlan = false,
}) {
  if (!customer) {
    return (
      <section className="flex min-h-[420px] items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div>
          <Settings2
            size={34}
            className="mx-auto mb-3 text-slate-300"
          />

          <h2 className="font-semibold text-slate-800">
            Select a customer
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select a customer from the list to manage their SMS settings.
          </p>
        </div>
      </section>
    );
  }

  const customerName =
    customer.name ||
    customer.customer_name ||
    "Customer";

  const channel = settings.channel || "message";

  const updateSetting = (key, value) => {
    onSettingsChange?.({
      ...settings,
      [key]: value,
    });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* HEADER */}

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            SMS Settings
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Automated message settings for this customer.
          </p>
        </div>

        <span className="max-w-[220px] truncate rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          {customerName}
        </span>
      </header>

      <div className="space-y-5 p-4 sm:p-5">
        {/* PLAN WARNING */}

        {!hasActivePlan && (
          <SmsWarning
            message="Ensure you have an active SMS plan to send automated messages to customers."
          />
        )}

        {/* MESSAGE CHANNEL */}

        <MessageChannelSelector
          value={channel}
          onChange={(value) =>
            updateSetting("channel", value)
          }
        />

        {/* NOTIFICATION SETTINGS */}

        <div className="space-y-2.5">
          {notificationItems.map((item) => (
            <NotificationAccordion
              key={item.key}
              title={item.title}
            >
              <NotificationToggle
                title={item.title}
                description={item.description}
                checked={Boolean(settings[item.key])}
                onChange={(value) =>
                  updateSetting(item.key, value)
                }
              />
            </NotificationAccordion>
          ))}

          {/* PAYMENT REMINDER */}

          <NotificationAccordion title="Payment Reminder">
            <PaymentReminder
              value={reminder}
              onChange={onReminderChange}
              disabled={saving}
            />
          </NotificationAccordion>
        </div>

        {/* SAVE BUTTON */}

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="rounded-lg bg-[#3976bd] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2864a8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </section>
  );
}