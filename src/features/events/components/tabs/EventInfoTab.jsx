
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  LoaderCircle,
  MapPin,
  Phone,
  UserRound,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import useEvents from "../../hooks/useEvents";

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
  "h-12 w-full min-w-0 border-b-2 border-[#079FCB] bg-transparent px-0 text-base text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-cyan-700 disabled:opacity-60";

function SectionTitle({ children }) {
  return (
    <h3 className="mb-6 w-fit border-b-[3px] border-slate-300 pb-2 text-lg font-medium text-slate-800">
      {children}
    </h3>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1 block text-sm font-medium text-[#269DB8]">
        {label}
      </span>
      {children}
    </label>
  );
}

function AddressInput({ value, onChange, disabled }) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter address"
        autoComplete="street-address"
        disabled={disabled}
        className={`${inputClass} pr-11`}
      />

      <MapPin
        size={23}
        className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[#079FCB]"
      />
    </div>
  );
}

function DateInput({ label, value, onChange, min, disabled }) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type="date"
          value={value || ""}
          min={min}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${inputClass} pr-8 text-sm`}
        />

        <CalendarDays
          size={21}
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#079FCB]"
        />
      </div>
    </Field>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-[54px] shrink-0 rounded-full transition ${
        checked ? "bg-[#83DDE4]" : "bg-slate-300"
      } disabled:opacity-50`}
    >
      <span
        className={`absolute top-0.5 size-6 rounded-full shadow-sm transition ${
          checked
            ? "left-[28px] bg-[#08B5C8]"
            : "left-0.5 bg-white"
        }`}
      />
    </button>
  );
}

export default function EventInfoTab({
  event,
  customer,
  customers = [],
  onUpdated,
}) {
  const { updateEvent, refresh } = useEvents();

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeCustomers = useMemo(
    () =>
      Array.isArray(customers)
        ? customers.filter(
            (item) =>
              !item.archived && item.status !== "inactive"
          )
        : [],
    [customers]
  );

  const selectedCustomer = useMemo(
    () =>
      activeCustomers.find(
        (item) => String(item.id) === String(form.customerId)
      ),
    [activeCustomers, form.customerId]
  );

  useEffect(() => {
    if (!event?.id) return;

    const customerId = event.customerId || event.customer_id || "";

    setForm({
      customerId,
      customerType: customerId ? "existing" : "new",
      customerName:
        event.customerName ||
        event.customer_name ||
        customer?.name ||
        "",
      customerPhone:
        event.customerPhone ||
        event.customer_phone ||
        customer?.phone ||
        "",
      customerAddress:
        event.customerAddress ||
        event.customer_address ||
        customer?.address ||
        customer?.area ||
        "",
      agentEnabled:
        event.agentEnabled ??
        event.agent_enabled ??
        true,
      eventName:
        event.eventName ||
        event.event_name ||
        "",
      startOn:
        event.startOn ||
        event.start_on ||
        "",
      endOn:
        event.endOn ||
        event.end_on ||
        event.startOn ||
        event.start_on ||
        "",
      sameAsCustomerAddress:
        event.sameAsCustomerAddress ??
        event.same_as_customer_address ??
        true,
      eventAddress:
        event.eventAddress ||
        event.event_address ||
        "",
      ratePerJar:
        event.ratePerJar ??
        event.rate_per_jar ??
        "",
    });

    setError("");
    setSuccess("");
  }, [event?.id, customer?.id]);

  useEffect(() => {
    if (
      form.customerType !== "existing" ||
      !selectedCustomer
    ) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      customerName: selectedCustomer.name || "",
      customerPhone: selectedCustomer.phone || "",
      customerAddress:
        selectedCustomer.address ||
        selectedCustomer.area ||
        "",
    }));
  }, [selectedCustomer, form.customerType]);

  function update(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setError("");
    setSuccess("");
  }

  function handleCustomerType(value) {
    if (value === "new") {
      setForm((previous) => ({
        ...previous,
        customerType: "new",
        customerId: "",
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        sameAsCustomerAddress: false,
      }));
    } else {
      setForm((previous) => ({
        ...previous,
        customerType: "existing",
        customerId: "",
        customerName: "",
        customerPhone: "",
        customerAddress: "",
      }));
    }

    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!event?.id) {
      setError("Event information not found.");
      return;
    }

    if (
      form.customerType === "existing" &&
      !form.customerId
    ) {
      setError("Please select an existing customer.");
      return;
    }

    if (!form.customerName.trim()) {
      setError("Please enter customer name.");
      return;
    }

    const phone = form.customerPhone.replace(/\D/g, "");

    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
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
      form.ratePerJar !== "" &&
      (
        !Number.isFinite(Number(form.ratePerJar)) ||
        Number(form.ratePerJar) < 0
      )
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

    const payload = {
      id: event.id,
      customerId:
        form.customerType === "existing"
          ? form.customerId
          : null,
      customerType: form.customerType,
      customerName: form.customerName.trim(),
      customerPhone: phone,
      customerAddress: form.customerAddress.trim(),
      agentEnabled: form.agentEnabled,
      eventName: form.eventName.trim(),
      startOn: form.startOn,
      endOn: form.endOn,
      sameAsCustomerAddress: form.sameAsCustomerAddress,
      eventAddress,
      ratePerJar:
        form.ratePerJar === ""
          ? null
          : Number(form.ratePerJar),
    };

    setSaving(true);

    try {
      await updateEvent(event.id, payload);

      await refresh();

      onUpdated?.(payload);

      setSuccess("Event details updated successfully.");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Event update failed:", err);
      setError(err?.message || "Unable to update event.");
    } finally {
      setSaving(false);
    }
  }

  if (!event) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center">
        <AlertCircle
          size={30}
          className="mx-auto text-slate-400"
        />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          Event information not available.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-t-[24px] bg-white shadow-sm sm:rounded-2xl">
      {/* Header */}
      <header className="flex min-h-[76px] items-center gap-4 bg-[#079FCB] px-5 py-4 text-white">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/80">
          <ArrowLeft size={25} />
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-bold">
            Update Event
          </h2>
          <p className="mt-0.5 truncate text-xs text-cyan-50">
            {event.eventName || "Event Information"}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="space-y-8 px-5 pb-8 pt-7 sm:px-8">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs leading-5 text-rose-700"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-medium text-emerald-700"
            >
              <CheckCircle2 size={17} />
              {success}
            </div>
          )}

          {/* CUSTOMER DETAILS */}
          <section>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <SectionTitle>Customer Details</SectionTitle>

              <select
                value={form.customerType}
                onChange={(e) =>
                  handleCustomerType(e.target.value)
                }
                disabled={saving}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-cyan-700 outline-none focus:border-cyan-500"
              >
                <option value="existing">Existing Customer</option>
                <option value="new">New Customer</option>
              </select>
            </div>

            {form.customerType === "existing" && (
              <Field label="Select Customer *">
                <select
                  value={form.customerId}
                  onChange={(e) =>
                    update("customerId", e.target.value)
                  }
                  disabled={saving}
                  required
                  className={inputClass}
                >
                  <option value="">Choose customer</option>

                  {activeCustomers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.phone ? ` · ${item.phone}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <div className="mt-4 space-y-4">
              <Field label="Name *">
                <div className="relative">
                  <input
                    value={form.customerName}
                    onChange={(e) =>
                      update("customerName", e.target.value)
                    }
                    placeholder="Enter customer name"
                    autoComplete="name"
                    disabled={saving}
                    required
                    className={`${inputClass} pr-11`}
                  />

                  <UserRound
                    size={23}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-[#079FCB]"
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
                    placeholder="Enter mobile number"
                    autoComplete="tel"
                    disabled={saving}
                    required
                    className={`${inputClass} pr-11`}
                  />

                  <Phone
                    size={22}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-[#079FCB]"
                  />
                </div>
              </Field>

              <Field label="Address">
                <AddressInput
                  value={form.customerAddress}
                  onChange={(value) =>
                    update("customerAddress", value)
                  }
                  disabled={saving}
                />
              </Field>
            </div>

            {/* Agent Toggle */}
            <div className="mt-7 flex min-h-11 items-center justify-between">
              <span className="text-base font-medium text-slate-800">
                Agent
              </span>

              <Toggle
                checked={form.agentEnabled}
                onChange={(value) =>
                  update("agentEnabled", value)
                }
                disabled={saving}
              />
            </div>
          </section>

          {/* EVENT DETAILS */}
          <section>
            <SectionTitle>Event Details</SectionTitle>

            <div className="space-y-5">
              <Field label="Event Name *">
                <input
                  value={form.eventName}
                  onChange={(e) =>
                    update("eventName", e.target.value)
                  }
                  placeholder="Enter event name"
                  maxLength={100}
                  disabled={saving}
                  required
                  className={inputClass}
                />

                <p className="mt-1 text-right text-xs text-slate-400">
                  {form.eventName.length}/100
                </p>
              </Field>

              <div className="grid grid-cols-2 gap-5">
                <DateInput
                  label="Start date *"
                  value={form.startOn}
                  onChange={(value) => {
                    setForm((previous) => ({
                      ...previous,
                      startOn: value,
                      endOn:
                        !previous.endOn || previous.endOn < value
                          ? value
                          : previous.endOn,
                    }));
                    setError("");
                  }}
                  disabled={saving}
                />

                <DateInput
                  label="End date *"
                  value={form.endOn}
                  min={form.startOn}
                  onChange={(value) => update("endOn", value)}
                  disabled={saving}
                />
              </div>
            </div>
          </section>

          {/* EVENT ADDRESS */}
          <section className="space-y-5">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.sameAsCustomerAddress}
                onChange={(e) =>
                  update(
                    "sameAsCustomerAddress",
                    e.target.checked
                  )
                }
                disabled={saving}
                className="size-5 shrink-0 accent-[#079FCB]"
              />

              <span>
                Set event address same as customer address
              </span>

              {form.sameAsCustomerAddress && (
                <Check
                  size={18}
                  className="ml-auto shrink-0 text-cyan-600"
                />
              )}
            </label>

            <Field label="Address">
              {form.sameAsCustomerAddress ? (
                <div className="relative">
                  <input
                    value={form.customerAddress}
                    readOnly
                    className={`${inputClass} pr-11`}
                  />

                  <MapPin
                    size={23}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-[#079FCB]"
                  />
                </div>
              ) : (
                <AddressInput
                  value={form.eventAddress}
                  onChange={(value) =>
                    update("eventAddress", value)
                  }
                  disabled={saving}
                />
              )}
            </Field>

            {!form.sameAsCustomerAddress && (
              <p className="text-xs leading-5 text-slate-400">
                Enter the actual event venue or delivery location.
              </p>
            )}
          </section>

          {/* RATE */}
          <section>
            <Field label="Rate Per Jar">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.ratePerJar}
                onChange={(e) =>
                  update("ratePerJar", e.target.value)
                }
                placeholder="Enter rate per jar"
                disabled={saving}
                className={inputClass}
              />
            </Field>
          </section>
        </div>

        {/* Sticky Update Button */}
        <div className="sticky bottom-0 border-t border-slate-100 bg-white px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:px-8">
          <button
            type="submit"
            disabled={saving}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#079FCB] px-5 text-base font-semibold text-white shadow-sm transition hover:bg-[#078BB1] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <LoaderCircle size={19} className="animate-spin" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
