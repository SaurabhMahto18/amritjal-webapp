
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  MapPin,
  Phone,
  UserRound,
  X,
} from "lucide-react";

const EMPTY_FORM = {
  customerId: "",
  customerType: "new",
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  agentEnabled: true,
  eventName: "",
  startOn: "",
  endOn: "",
  sameAsCustomerAddress: true,
  eventAddress: "",
  ratePerJar: "",
};

const inputClass =
  "h-12 w-full min-w-0 border-b border-slate-300 bg-transparent px-0 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#08A6D0] disabled:opacity-60";

const labelClass = "mb-1 block text-xs font-medium text-slate-500";

function getToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function SectionTitle({ children }) {
  return (
    <h3 className="mb-3 w-fit border-b-2 border-slate-300 pb-2 text-sm font-medium text-slate-700">
      {children}
    </h3>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function SelectField({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-xs text-[#079BC4] outline-none focus:border-[#08A6D0]"
      >
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

function AddressField({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pr-10`}
        autoComplete="street-address"
      />
      <MapPin
        size={18}
        className="absolute right-1 top-1/2 -translate-y-1/2 text-[#08A6D0]"
      />
    </div>
  );
}

export default function EventFormModal({
  open,
  event,
  customers = [],
  onClose,
  onSave,
  saving = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const activeCustomers = useMemo(
    () =>
      Array.isArray(customers)
        ? customers.filter(
            (customer) =>
              !customer.archived && customer.status !== "inactive"
          )
        : [],
    [customers]
  );

  const selectedCustomer = useMemo(
    () =>
      activeCustomers.find(
        (customer) => String(customer.id) === String(form.customerId)
      ),
    [activeCustomers, form.customerId]
  );

  useEffect(() => {
    if (!open) return;

    setError("");

    if (event) {
      const customerId = event.customerId || "";

      setForm({
        ...EMPTY_FORM,
        customerId,
        customerType: customerId ? "existing" : "new",
        customerName: event.customerName || "",
        customerPhone: event.customerPhone || "",
        customerAddress: event.customerAddress || "",
        agentEnabled: event.agentEnabled ?? true,
        eventName: event.eventName || "",
        startOn: event.startOn || getToday(),
        endOn: event.endOn || event.startOn || getToday(),
        sameAsCustomerAddress: event.sameAsCustomerAddress ?? true,
        eventAddress: event.eventAddress || "",
        ratePerJar: event.ratePerJar ?? "",
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        startOn: getToday(),
        endOn: getToday(),
      });
    }
  }, [open, event]);

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (e) => {
      if (e.key === "Escape" && !saving) onClose?.();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, saving, onClose]);

  useEffect(() => {
    if (form.customerType !== "existing" || !selectedCustomer) return;

    setForm((previous) => ({
      ...previous,
      customerName: selectedCustomer.name || "",
      customerPhone: selectedCustomer.phone || "",
      customerAddress:
        selectedCustomer.address || selectedCustomer.area || "",
    }));
  }, [form.customerType, selectedCustomer]);

  if (!open) return null;

  const update = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.customerName.trim()) {
      setError("Please enter customer name.");
      return;
    }

    const phone = form.customerPhone.replace(/\D/g, "");

    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    let customerId = form.customerId;

    if (form.customerType === "existing") {
      if (!customerId) {
        setError("Please select an existing customer.");
        return;
      }
    } else {
      // Match a new-contact phone against existing customers.
      // Never send a null customer_id to the events table.
      const matchedCustomer = activeCustomers.find(
        (customer) =>
          String(customer.phone || "").replace(/\D/g, "") === phone
      );

      if (!matchedCustomer) {
        setError(
          "This mobile number is not registered. Please create the customer in Customer Management first, then select Existing Customer."
        );
        return;
      }

      customerId = matchedCustomer.id;
    }

    if (!form.eventName.trim()) {
      setError("Please enter event name.");
      return;
    }

    if (!form.startOn || !form.endOn) {
      setError("Please select event start and end dates.");
      return;
    }

    if (form.endOn < form.startOn) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    if (
      form.ratePerJar === "" ||
      !Number.isFinite(Number(form.ratePerJar)) ||
      Number(form.ratePerJar) < 0
    ) {
      setError("Please enter a valid rate per jar.");
      return;
    }

    const eventAddress = form.sameAsCustomerAddress
      ? form.customerAddress.trim()
      : form.eventAddress.trim();

    if (!eventAddress) {
      setError("Please enter the event address.");
      return;
    }

    try {
      await onSave({
        id: event?.id,
        customerId,
        customerType: "existing",
        customerName: form.customerName.trim(),
        customerPhone: phone,
        customerAddress: form.customerAddress.trim(),
        agentEnabled: form.agentEnabled,
        eventName: form.eventName.trim(),
        startOn: form.startOn,
        endOn: form.endOn,
        sameAsCustomerAddress: form.sameAsCustomerAddress,
        eventAddress,
        ratePerJar: Number(form.ratePerJar),
      });
    } catch (saveError) {
      setError(saveError?.message || "Unable to save event.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose?.();
      }}
    >
      <form
        onSubmit={handleSubmit}
        aria-labelledby="event-form-title"
        className="flex max-h-[95dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center gap-3 bg-[#079FCB] px-4 py-3 text-white">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close form"
            className="flex size-9 items-center justify-center rounded-full border border-white/70"
          >
            <X size={19} />
          </button>

          <div>
            <h2 id="event-form-title" className="text-base font-semibold">
              {event ? "Update Event" : "Create Event"}
            </h2>
            <p className="text-[11px] text-white/80">
              Customer and event information
            </p>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <SectionTitle>Customer Details</SectionTitle>

              <SelectField
                value={form.customerType}
                onChange={(value) => {
                  setForm((previous) => ({
                    ...previous,
                    customerType: value,
                    customerId: "",
                    customerName: "",
                    customerPhone: "",
                    customerAddress: "",
                  }));
                  setError("");
                }}
                options={[
                  ["new", "New Customer"],
                  ["existing", "Existing Customer"],
                ]}
              />
            </div>

            {form.customerType === "existing" && (
              <Field label="Select Customer *">
                <select
                  value={form.customerId}
                  onChange={(e) => update("customerId", e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Choose existing customer</option>
                  {activeCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.phone ? ` · ${customer.phone}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {form.customerType === "new" && (
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">
                If this contact is already registered, its mobile number will
                be matched automatically. Otherwise, create the customer first
                in Customer Management.
              </p>
            )}

            <div className="mt-3 space-y-3">
              <Field label="Name *">
                <div className="relative">
                  <input
                    value={form.customerName}
                    onChange={(e) => update("customerName", e.target.value)}
                    placeholder="Enter customer name"
                    className={inputClass}
                    autoComplete="name"
                    required
                  />
                  <UserRound
                    size={17}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </Field>

              <Field label="Mobile No. *">
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.customerPhone}
                    onChange={(e) =>
                      update(
                        "customerPhone",
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    placeholder="Enter 10-digit mobile number"
                    className={inputClass}
                    autoComplete="tel"
                    required
                  />
                  <Phone
                    size={17}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </Field>

              <Field label="Address">
                <AddressField
                  value={form.customerAddress}
                  onChange={(value) => update("customerAddress", value)}
                  placeholder="Enter customer address"
                />
              </Field>

              <p className="text-[11px] leading-4 text-slate-500">
                For more accuracy, use the actual customer address.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Agent
              </span>

              <button
                type="button"
                role="switch"
                aria-checked={form.agentEnabled}
                onClick={() => update("agentEnabled", !form.agentEnabled)}
                className={`relative h-6 w-11 rounded-full transition ${
                  form.agentEnabled ? "bg-[#80DDE4]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-[#08B5C8] shadow transition ${
                    form.agentEnabled ? "left-[22px]" : "left-0.5 bg-white"
                  }`}
                />
              </button>
            </div>
          </section>

          <section>
            <SectionTitle>Event Details</SectionTitle>

            <div className="space-y-3">
              <Field label="Event Name *">
                <input
                  value={form.eventName}
                  onChange={(e) => update("eventName", e.target.value)}
                  placeholder="Enter event name"
                  maxLength={100}
                  className={inputClass}
                  required
                />
                <p className="mt-1 text-right text-[10px] text-slate-400">
                  {form.eventName.length}/100
                </p>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Date *">
                  <div className="relative">
                    <input
                      type="date"
                      value={form.startOn}
                      onChange={(e) => {
                        const startOn = e.target.value;
                        setForm((previous) => ({
                          ...previous,
                          startOn,
                          endOn:
                            !previous.endOn || previous.endOn < startOn
                              ? startOn
                              : previous.endOn,
                        }));
                      }}
                      className={inputClass}
                      required
                    />
                    <CalendarDays
                      size={17}
                      className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[#08A6D0]"
                    />
                  </div>
                </Field>

                <Field label="End Date *">
                  <div className="relative">
                    <input
                      type="date"
                      min={form.startOn || undefined}
                      value={form.endOn}
                      onChange={(e) => update("endOn", e.target.value)}
                      className={inputClass}
                      required
                    />
                    <CalendarDays
                      size={17}
                      className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[#08A6D0]"
                    />
                  </div>
                </Field>
              </div>
            </div>
          </section>

          <section>
            <div className="space-y-3">
              <label className="flex min-h-11 items-center gap-3 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={form.sameAsCustomerAddress}
                  onChange={(e) =>
                    update("sameAsCustomerAddress", e.target.checked)
                  }
                  className="size-5 accent-[#08A6D0]"
                />
                <span>Set event address same as customer address</span>
              </label>

              {!form.sameAsCustomerAddress ? (
                <Field label="Event Address *">
                  <AddressField
                    value={form.eventAddress}
                    onChange={(value) => update("eventAddress", value)}
                    placeholder="Enter event venue address"
                  />
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    Enter the venue or delivery location for this event.
                  </p>
                </Field>
              ) : (
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {form.customerAddress || "Customer address will be used."}
                </div>
              )}
            </div>
          </section>

          <section>
            <SectionTitle>Jar Rate</SectionTitle>

            <Field label="Rate Per Jar (₹) *">
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={form.ratePerJar}
                  onChange={(e) => update("ratePerJar", e.target.value)}
                  placeholder="Enter rate per jar"
                  className={`${inputClass} pl-5`}
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                This rate will be used for this event's jar deliveries.
              </p>
            </Field>
          </section>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-12 flex-1 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex h-12 flex-[1.5] items-center justify-center gap-2 rounded-lg bg-[#079FCB] text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Check size={17} />
                  {event ? "Update Event" : "Next"}
                </>
              )}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
