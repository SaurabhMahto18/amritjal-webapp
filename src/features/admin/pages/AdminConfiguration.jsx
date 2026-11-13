
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Settings2,
  Building2,
  Receipt,
  CalendarClock,
  Bell,
  ShieldCheck,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Globe,
  Mail,
  Phone,
  Link2,
  IndianRupee,
  Clock3,
  CalendarDays,
  Wrench,
  UserPlus,
  ChevronRight,
  LoaderCircle,
  Info,
  AlertTriangle,
} from "lucide-react";

import {
  getPlatformConfiguration,
  savePlatformSetting,
} from "../services/adminConfigurationService";

const SECTIONS = [
  {
    id: "general",
    label: "General",
    description: "Platform identity and contact",
    icon: Building2,
  },
  {
    id: "billing",
    label: "Billing & Tax",
    description: "Currency, GST and invoices",
    icon: Receipt,
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    description: "Trials and renewal defaults",
    icon: CalendarClock,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Platform alert preferences",
    icon: Bell,
  },
  {
    id: "platform",
    label: "Platform Controls",
    description: "Maintenance and registration",
    icon: ShieldCheck,
  },
];

const DEFAULTS = {
  general: {
    platform_name: "Amrit Jal",
    support_email: "",
    support_phone: "",
    website_url: "",
    timezone: "Asia/Kolkata",
  },
  billing: {
    currency: "INR",
    currency_symbol: "₹",
    gst_enabled: false,
    gst_rate: 18,
    invoice_prefix: "AJ",
    invoice_footer: "Thank you for choosing Amrit Jal.",
  },
  subscriptions: {
    default_trial_days: 14,
    default_billing_cycle: "monthly",
    auto_renewal_enabled: false,
    expiry_reminder_days: [7, 3, 1],
  },
  notifications: {
    payment_notifications: true,
    renewal_notifications: true,
    expiry_notifications: true,
    support_notifications: true,
  },
  platform: {
    maintenance_mode: false,
    maintenance_message:
      "We are performing scheduled maintenance. Please try again later.",
    new_business_registration: true,
  },
};

function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs leading-5 text-slate-400">{hint}</p>
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-stone-200 bg-[#FCFCFA] px-4 py-3 text-sm text-[#24262B] outline-none transition placeholder:text-slate-400 focus:border-[#D9BB3C] focus:ring-2 focus:ring-[#E9CA43]/20"
    />
  );
}

function SelectInput({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-stone-200 bg-[#FCFCFA] px-4 py-3 text-sm text-[#24262B] outline-none transition focus:border-[#D9BB3C] focus:ring-2 focus:ring-[#E9CA43]/20"
    >
      {children}
    </select>
  );
}

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-[#6F987B]" : "bg-stone-300"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-stone-100 bg-[#FCFCFA] p-4">
      <div>
        <p className="text-sm font-semibold text-[#24262B]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <div className="rounded-2xl border border-[#EDEAE0] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 border-b border-stone-100 pb-4">
        <h3 className="font-bold text-[#24262B]">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function ReminderDays({ value, onChange }) {
  const options = [1, 3, 7, 14, 30];

  function toggleDay(day) {
    const next = value.includes(day)
      ? value.filter((item) => item !== day)
      : [...value, day];

    onChange(next.sort((a, b) => b - a));
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((day) => {
        const active = value.includes(day);

        return (
          <button
            key={day}
            type="button"
            onClick={() => toggleDay(day)}
            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              active
                ? "border-[#D9BB3C] bg-[#FBF5D9] text-[#806B19]"
                : "border-stone-200 bg-white text-slate-500 hover:bg-stone-50"
            }`}
          >
            {day} days
          </button>
        );
      })}
    </div>
  );
}

export default function AdminConfiguration() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [original, setOriginal] = useState(DEFAULTS);
  const [activeSection, setActiveSection] = useState("general");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadSettings = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError("");
    setSuccess("");

    try {
      const data = await getPlatformConfiguration();

      const merged = {};

      Object.keys(DEFAULTS).forEach((key) => {
        merged[key] = {
          ...DEFAULTS[key],
          ...(data[key] || {}),
        };
      });

      setSettings(merged);
      setOriginal(merged);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Unable to load platform configuration.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(original);
  }, [settings, original]);

  const updateField = (section, field, value) => {
    setSettings((previous) => ({
      ...previous,
      [section]: {
        ...previous[section],
        [field]: value,
      },
    }));

    setSuccess("");
  };

  const validateSection = (section) => {
    const data = settings[section];

    if (section === "general") {
      if (!data.platform_name.trim()) {
        return "Platform name is required.";
      }

      if (
        data.support_email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.support_email)
      ) {
        return "Enter a valid support email address.";
      }

      if (
        data.website_url &&
        !/^https?:\/\/.+/i.test(data.website_url)
      ) {
        return "Website URL must start with http:// or https://.";
      }
    }

    if (section === "billing") {
      if (!data.invoice_prefix.trim()) {
        return "Invoice prefix is required.";
      }

      if (
        !Number.isFinite(Number(data.gst_rate)) ||
        Number(data.gst_rate) < 0 ||
        Number(data.gst_rate) > 100
      ) {
        return "GST rate must be between 0 and 100.";
      }
    }

    if (section === "subscriptions") {
      if (
        !Number.isInteger(Number(data.default_trial_days)) ||
        Number(data.default_trial_days) < 0 ||
        Number(data.default_trial_days) > 365
      ) {
        return "Trial days must be between 0 and 365.";
      }

      if (
        !data.expiry_reminder_days.length ||
        data.expiry_reminder_days.some(
          (day) => !Number.isInteger(day) || day < 1 || day > 365
        )
      ) {
        return "Select at least one valid expiry reminder.";
      }
    }

    if (section === "platform" && !data.maintenance_message.trim()) {
      return "Maintenance message cannot be empty.";
    }

    return null;
  };

  async function saveCurrentSection() {
    setError("");
    setSuccess("");

    const validationError = validateSection(activeSection);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const dataToSave = { ...settings[activeSection] };

      if (activeSection === "billing") {
        dataToSave.gst_rate = Number(dataToSave.gst_rate);
      }

      if (activeSection === "subscriptions") {
        dataToSave.default_trial_days = Number(
          dataToSave.default_trial_days
        );
        dataToSave.expiry_reminder_days = [
          ...dataToSave.expiry_reminder_days,
        ].sort((a, b) => b - a);
      }

      const saved = await savePlatformSetting(
        activeSection,
        dataToSave
      );

      const next = {
        ...settings,
        [activeSection]: {
          ...settings[activeSection],
          ...(saved || dataToSave),
        },
      };

      setSettings(next);
      setOriginal(next);
      setLastUpdated(new Date());
      setSuccess("Configuration saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save configuration.");
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    if (!window.confirm("Discard unsaved changes in this section?")) {
      return;
    }

    setSettings((previous) => ({
      ...previous,
      [activeSection]: original[activeSection],
    }));

    setError("");
    setSuccess("");
  }

  function changeSection(nextSection) {
    if (hasChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Discard them and switch section?"
      );

      if (!confirmed) return;

      setSettings((previous) => ({
        ...previous,
        [activeSection]: original[activeSection],
      }));
    }

    setActiveSection(nextSection);
    setError("");
    setSuccess("");
  }

  const currentSection = SECTIONS.find(
    (section) => section.id === activeSection
  );

  const CurrentIcon = currentSection?.icon || Settings2;

  const data = settings[activeSection];

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center bg-[#F7F6F0]">
        <LoaderCircle size={30} className="animate-spin text-[#B69A27]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#F7F6F0] p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#9A8540]">
            <Settings2 size={15} />
            Platform administration
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#24262B] sm:text-3xl">
            Platform Configuration
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage global settings for your Amrit Jal platform.
          </p>
        </div>

        <button
          onClick={() => loadSettings(true)}
          disabled={refreshing || saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E1D6] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-stone-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-auto font-bold"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Information */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p className="leading-6">
          Changes are stored centrally. Some settings, such as maintenance
          mode, GST and subscription defaults, require separate application
          enforcement before they affect existing workflows.
        </p>
      </div>

      {/* Main layout */}
      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">

        {/* Sidebar */}
        <aside className="rounded-2xl border border-[#EDEAE0] bg-white p-3 shadow-sm">
          <p className="px-3 pb-3 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Configuration sections
          </p>

          <div className="space-y-1">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => changeSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                    active
                      ? "bg-[#FBF5D9] text-[#806B19]"
                      : "text-slate-600 hover:bg-stone-50"
                  }`}
                >
                  <div
                    className={`rounded-lg p-2 ${
                      active
                        ? "bg-white text-[#9A7E17]"
                        : "bg-stone-100 text-slate-500"
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{section.label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {section.description}
                    </p>
                  </div>

                  <ChevronRight
                    size={16}
                    className={active ? "text-[#9A7E17]" : "text-slate-300"}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-stone-100 bg-[#FCFCFA] p-3">
            <p className="text-xs font-semibold text-[#24262B]">
              Last refreshed
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {lastUpdated
                ? lastUpdated.toLocaleTimeString("en-IN")
                : "Not available"}
            </p>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 space-y-5">

          {/* Section heading */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-3 text-[#9A7E17] shadow-sm">
              <CurrentIcon size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#24262B]">
                {currentSection?.label}
              </h2>
              <p className="text-xs text-slate-500">
                {currentSection?.description}
              </p>
            </div>
          </div>

          {/* GENERAL */}
          {activeSection === "general" && (
            <SectionCard
              title="Platform identity"
              description="Manage your platform name and official contact information."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Platform Name">
                  <TextInput
                    value={data.platform_name}
                    onChange={(value) =>
                      updateField("general", "platform_name", value)
                    }
                    placeholder="Amrit Jal"
                  />
                </Field>

                <Field label="Support Email">
                  <TextInput
                    type="email"
                    value={data.support_email}
                    onChange={(value) =>
                      updateField("general", "support_email", value)
                    }
                    placeholder="support@example.com"
                  />
                </Field>

                <Field label="Support Phone">
                  <TextInput
                    value={data.support_phone}
                    onChange={(value) =>
                      updateField("general", "support_phone", value)
                    }
                    placeholder="+91 9876543210"
                  />
                </Field>

                <Field label="Website URL">
                  <TextInput
                    value={data.website_url}
                    onChange={(value) =>
                      updateField("general", "website_url", value)
                    }
                    placeholder="https://example.com"
                  />
                </Field>

                <Field
                  label="Platform Timezone"
                  hint="Used as the configured timezone for platform settings."
                >
                  <SelectInput
                    value={data.timezone}
                    onChange={(value) =>
                      updateField("general", "timezone", value)
                    }
                  >
                    <option value="Asia/Kolkata">
                      India Standard Time (IST)
                    </option>
                    <option value="UTC">UTC</option>
                  </SelectInput>
                </Field>
              </div>
            </SectionCard>
          )}

          {/* BILLING */}
          {activeSection === "billing" && (
            <div className="space-y-5">
              <SectionCard
                title="Currency configuration"
                description="Set the platform currency and display symbol."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Currency">
                    <SelectInput
                      value={data.currency}
                      onChange={(value) =>
                        updateField("billing", "currency", value)
                      }
                    >
                      <option value="INR">Indian Rupee (INR)</option>
                    </SelectInput>
                  </Field>

                  <Field label="Currency Symbol">
                    <TextInput
                      value={data.currency_symbol}
                      onChange={(value) =>
                        updateField("billing", "currency_symbol", value)
                      }
                      placeholder="₹"
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                title="GST configuration"
                description="Configure the GST rate for applicable billing workflows."
              >
                <div className="space-y-5">
                  <ToggleRow
                    title="Enable GST"
                    description="Enable GST for future applicable billing calculations."
                    checked={data.gst_enabled}
                    onChange={(value) =>
                      updateField("billing", "gst_enabled", value)
                    }
                  />

                  <div className="max-w-sm">
                    <Field label="GST Rate (%)">
                      <TextInput
                        type="number"
                        value={data.gst_rate}
                        onChange={(value) =>
                          updateField("billing", "gst_rate", value)
                        }
                        placeholder="18"
                      />
                    </Field>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Invoice configuration"
                description="Set the default prefix and footer for invoices."
              >
                <div className="space-y-5">
                  <div className="max-w-sm">
                    <Field label="Invoice Prefix">
                      <TextInput
                        value={data.invoice_prefix}
                        onChange={(value) =>
                          updateField("billing", "invoice_prefix", value)
                        }
                        placeholder="AJ"
                      />
                    </Field>
                  </div>

                  <Field label="Invoice Footer">
                    <textarea
                      rows={3}
                      value={data.invoice_footer}
                      onChange={(event) =>
                        updateField(
                          "billing",
                          "invoice_footer",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-stone-200 bg-[#FCFCFA] px-4 py-3 text-sm outline-none focus:border-[#D9BB3C]"
                    />
                  </Field>
                </div>
              </SectionCard>
            </div>
          )}

          {/* SUBSCRIPTIONS */}
          {activeSection === "subscriptions" && (
            <div className="space-y-5">
              <SectionCard
                title="Default subscription settings"
                description="Configure defaults used when creating new subscriptions."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Default Trial Duration (Days)">
                    <TextInput
                      type="number"
                      value={data.default_trial_days}
                      onChange={(value) =>
                        updateField(
                          "subscriptions",
                          "default_trial_days",
                          value
                        )
                      }
                      placeholder="14"
                    />
                  </Field>

                  <Field label="Default Billing Cycle">
                    <SelectInput
                      value={data.default_billing_cycle}
                      onChange={(value) =>
                        updateField(
                          "subscriptions",
                          "default_billing_cycle",
                          value
                        )
                      }
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </SelectInput>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                title="Renewal preferences"
                description="Configure renewal automation and expiry reminders."
              >
                <div className="space-y-5">
                  <ToggleRow
                    title="Automatic Renewal"
                    description="Default preference for automatic subscription renewal."
                    checked={data.auto_renewal_enabled}
                    onChange={(value) =>
                      updateField(
                        "subscriptions",
                        "auto_renewal_enabled",
                        value
                      )
                    }
                  />

                  <Field
                    label="Subscription Expiry Reminders"
                    hint="Choose how many days before expiry reminders should be sent."
                  >
                    <ReminderDays
                      value={data.expiry_reminder_days}
                      onChange={(value) =>
                        updateField(
                          "subscriptions",
                          "expiry_reminder_days",
                          value
                        )
                      }
                    />
                  </Field>
                </div>
              </SectionCard>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === "notifications" && (
            <SectionCard
              title="Notification preferences"
              description="Configure which platform notification categories are enabled."
            >
              <div className="space-y-3">
                <ToggleRow
                  title="Payment Notifications"
                  description="Notifications related to subscription payments."
                  checked={data.payment_notifications}
                  onChange={(value) =>
                    updateField(
                      "notifications",
                      "payment_notifications",
                      value
                    )
                  }
                />

                <ToggleRow
                  title="Renewal Notifications"
                  description="Notifications related to subscription renewals."
                  checked={data.renewal_notifications}
                  onChange={(value) =>
                    updateField(
                      "notifications",
                      "renewal_notifications",
                      value
                    )
                  }
                />

                <ToggleRow
                  title="Expiry Notifications"
                  description="Notifications for upcoming and expired subscriptions."
                  checked={data.expiry_notifications}
                  onChange={(value) =>
                    updateField(
                      "notifications",
                      "expiry_notifications",
                      value
                    )
                  }
                />

                <ToggleRow
                  title="Support Notifications"
                  description="Notifications when support tickets are created or updated."
                  checked={data.support_notifications}
                  onChange={(value) =>
                    updateField(
                      "notifications",
                      "support_notifications",
                      value
                    )
                  }
                />
              </div>
            </SectionCard>
          )}

          {/* PLATFORM */}
          {activeSection === "platform" && (
            <div className="space-y-5">
              <SectionCard
                title="Maintenance mode"
                description="Control the maintenance state of the platform."
              >
                <div className="space-y-5">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <Wrench
                        size={19}
                        className="mt-0.5 text-amber-700"
                      />
                      <div>
                        <p className="text-sm font-bold text-amber-900">
                          Use with caution
                        </p>
                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          Enabling this setting only stores the maintenance
                          preference. Application-wide maintenance enforcement
                          must be implemented separately.
                        </p>
                      </div>
                    </div>
                  </div>

                  <ToggleRow
                    title="Enable Maintenance Mode"
                    description="Mark the platform as undergoing maintenance."
                    checked={data.maintenance_mode}
                    onChange={(value) =>
                      updateField("platform", "maintenance_mode", value)
                    }
                  />

                  <Field label="Maintenance Message">
                    <textarea
                      rows={4}
                      value={data.maintenance_message}
                      onChange={(event) =>
                        updateField(
                          "platform",
                          "maintenance_message",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-stone-200 bg-[#FCFCFA] px-4 py-3 text-sm outline-none focus:border-[#D9BB3C]"
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                title="Business registration"
                description="Control whether new businesses can register on the platform."
              >
                <ToggleRow
                  title="Allow New Business Registration"
                  description="Enable or disable new business registration at the platform level."
                  checked={data.new_business_registration}
                  onChange={(value) =>
                    updateField(
                      "platform",
                      "new_business_registration",
                      value
                    )
                  }
                />
              </SectionCard>
            </div>
          )}

          {/* Save actions */}
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#EDEAE0] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:px-5">
            <div>
              <p className="text-sm font-bold text-[#24262B]">
                {hasChanges ? "Unsaved changes" : "All changes saved"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Changes apply to the selected configuration section.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={discardChanges}
                disabled={!hasChanges || saving}
                className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Discard
              </button>

              <button
                onClick={saveCurrentSection}
                disabled={!hasChanges || saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E9CA43] px-5 py-2.5 text-sm font-bold text-[#24262B] transition hover:bg-[#dfbd2f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
