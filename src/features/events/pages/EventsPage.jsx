
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Truck,
  CreditCard,
  ReceiptText,
  Info,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  Phone,
  X,
  IndianRupee,
  Wallet,
  Clock3,
  Package,
  MapPin,
} from "lucide-react";

import useEvents from "../hooks/useEvents";
import EventFilters from "../components/EventFilters";
import EventSummary from "../components/EventSummary";
import EventTable from "../components/EventTable";
import EventFormModal from "../components/EventFormModal";

import deliveryService from "../../deliveries/services/deliveryService";
import DeliveryForm from "../../deliveries/components/DeliveryForm";
import paymentService from "../../payments/services/paymentService";

const SEO = {
  title: "Event Management | Amrit Jal",
  description:
    "Manage event bookings, deliveries, payments and invoices with Amrit Jal.",
  robots: "noindex, nofollow, noarchive",
};

const TABS = [
  { id: "booking", label: "Booking", icon: CalendarDays },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "invoices", label: "Invoices", icon: ReceiptText },
  { id: "details", label: "Details", icon: Info },
];

const INITIAL_FILTERS = {
  from: "",
  to: "",
  status: "",
  duration: "",
  paymentStatus: "",
};

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

function updateMeta(name, content) {
  const selector = `meta[name="${name}"]`;
  const existing = document.querySelector(selector);
  const element = existing || document.createElement("meta");
  const previous = existing?.getAttribute("content");

  element.setAttribute("name", name);
  element.setAttribute("content", content);

  if (!existing) document.head.appendChild(element);

  return () => {
    if (existing) {
      if (previous === null) element.removeAttribute("content");
      else element.setAttribute("content", previous);
    } else {
      element.remove();
    }
  };
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Status({ value }) {
  const normalized = String(value || "").toLowerCase();

  const tone =
    normalized.includes("paid") ||
    normalized.includes("complete") ||
    normalized.includes("approved")
      ? "bg-emerald-50 text-emerald-700"
      : normalized.includes("cancel") ||
          normalized.includes("reject")
        ? "bg-rose-50 text-rose-700"
        : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}
    >
      {String(value || "Pending").replace(/[_-]/g, " ")}
    </span>
  );
}

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
        <Icon size={22} />
      </span>
      <h3 className="mt-3 text-sm font-bold text-slate-800">{title}</h3>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">
        {description}
      </p>
      {action}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function EventSelector({ events, value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-cyan-600"
      aria-label="Select event"
    >
      <option value="">Select an event</option>
      {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.eventName} — {event.customerName}
        </option>
      ))}
    </select>
  );
}

function PaymentModal({ event, onClose, onSaved }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  });
  const [method, setMethod] = useState("cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!event?.customerId) {
      setError(
        "This event has no registered customer. A customer is required for payment."
      );
      return;
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }

    setSaving(true);

    try {
      await paymentService.createPayment({
        customerId: event.customerId,
        eventId: event.id,
        amount: Number(amount),
        date,
        method,
        referenceNo,
        notes,
        purpose: "customer_payment",
      });

      await onSaved?.();
      onClose();
    } catch (err) {
      setError(err?.message || "Unable to save payment.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/10";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Add Event Payment
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {event?.eventName || "Selected event"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
            aria-label="Close payment form"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Customer">
            <input
              className={inputClass}
              value={event?.customerName || "No registered customer"}
              readOnly
            />
          </Field>

          <Field label="Payment Amount *">
            <div className="relative">
              <IndianRupee
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className={`${inputClass} pl-9`}
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </div>
          </Field>

          <Field label="Payment Date *">
            <input
              className={inputClass}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>

          <Field label="Payment Method">
            <select
              className={inputClass}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </Field>

          <Field label="Reference Number">
            <input
              className={inputClass}
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              maxLength={120}
              placeholder="Optional transaction reference"
            />
          </Field>

          <Field label="Notes">
            <textarea
              className={`${inputClass} h-20 resize-y py-3`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder="Optional notes"
            />
          </Field>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700"
            >
              {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-11 flex-1 rounded-xl bg-cyan-600 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EVENT LISTING PAGE                                                         */
/* No mobile bottom navigation on this page.                                 */
/* -------------------------------------------------------------------------- */

export default function EventsPage() {
  const {
    events = [],
    customers = [],
    loading,
    error,
    refresh,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useEvents();

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [pendingCreatedEvent, setPendingCreatedEvent] = useState(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = SEO.title;

    const restoreDescription = updateMeta("description", SEO.description);
    const restoreRobots = updateMeta("robots", SEO.robots);

    return () => {
      document.title = previousTitle;
      restoreDescription();
      restoreRobots();
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !query ||
        [event.eventName, event.customerName, event.customerPhone].some(
          (value) => String(value || "").toLowerCase().includes(query)
        );

      const matchesFrom = !filters.from || event.startOn >= filters.from;
      const matchesTo = !filters.to || event.startOn <= filters.to;
      const matchesStatus = !filters.status || event.status === filters.status;
      const matchesPayment =
        !filters.paymentStatus ||
        event.paymentStatus === filters.paymentStatus;

      return (
        matchesSearch &&
        matchesFrom &&
        matchesTo &&
        matchesStatus &&
        matchesPayment
      );
    });
  }, [events, search, filters]);

  // Fallback when the event hook does not return the created record.
  useEffect(() => {
    if (!pendingCreatedEvent || !events.length) return;

    const match = events.find(
      (event) =>
        event.eventName === pendingCreatedEvent.eventName &&
        (!pendingCreatedEvent.customerId ||
          String(event.customerId) === String(pendingCreatedEvent.customerId))
    );

    if (match) {
      setPendingCreatedEvent(null);
      navigate(`/events/${match.id}`, {
        state: { eventId: match.id },
      });
    }
  }, [events, pendingCreatedEvent, navigate]);

  async function saveEvent(input) {
    setSaving(true);
    setActionError("");

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, input);
        setEventModalOpen(false);
        setEditingEvent(null);
        await refresh();
        return;
      }

      const created = await createEvent(input);

      setEventModalOpen(false);
      setEditingEvent(null);

      if (created?.id) {
        navigate(`/events/${created.id}`, {
          state: { eventId: created.id },
        });
      } else {
        setPendingCreatedEvent({
          eventName: input.eventName,
          customerId: input.customerId || null,
        });
        await refresh();
      }
    } catch (err) {
      setActionError(err?.message || "Unable to save event.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function removeEvent(event) {
    const confirmed = window.confirm(
      `Delete "${event.eventName}" for ${event.customerName}?`
    );

    if (!confirmed) return;

    try {
      await deleteEvent(event.id);
    } catch (err) {
      setActionError(err?.message || "Unable to delete event.");
    }
  }

  async function refreshAll() {
    setRefreshing(true);
    setActionError("");

    try {
      await refresh();
    } catch (err) {
      setActionError(err?.message || "Unable to refresh event data.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F7F8] px-3 pb-6 pt-3 text-slate-800 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1440px] space-y-4 sm:space-y-5">
        

        {actionError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
          >
            {actionError}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
          >
            {error}
          </div>
        )}

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events or customers"
                  aria-label="Search events"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-cyan-600"
                />
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen((value) => !value)}
                className="h-11 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600"
                aria-expanded={filtersOpen}
              >
                Filters
              </button>
            </div>
          </div>

          {filtersOpen && (
            <EventFilters
              filters={filters}
              setFilters={setFilters}
              onClear={() => setFilters(INITIAL_FILTERS)}
            />
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setSummaryOpen((previous) => !previous)}
              aria-expanded={summaryOpen}
              className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left sm:hidden"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Event Summary
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  View booking overview and totals
                </p>
              </div>
              <span className="text-xs font-bold text-cyan-700">
                {summaryOpen ? "Hide" : "View"}
              </span>
            </button>

            {summaryOpen && (
              <div className="border-t border-slate-100 p-3 sm:hidden">
                <EventSummary events={events} />
              </div>
            )}

            <div className="hidden p-4 sm:block">
              <EventSummary events={events} />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Event Bookings
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {filteredEvents.length} events
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingEvent(null);
                  setEventModalOpen(true);
                }}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-cyan-600 px-3 text-xs font-bold text-white"
              >
                <Plus size={15} />
                Add Event
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                <RefreshCw size={17} className="animate-spin" />
                Loading events...
              </div>
            ) : filteredEvents.length ? (
              <>
                <div className="space-y-3 bg-slate-50 p-3 md:hidden">
                  {filteredEvents.map((event) => (
                    <article
                      key={event.id}
                      className="rounded-2xl border border-slate-200 bg-white p-3.5"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/events/${event.id}`, {
                            state: { eventId: event.id },
                          })
                        }
                        className="flex w-full items-start justify-between gap-3 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-sm font-bold text-slate-900">
                            {event.eventName}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {event.customerName}
                          </p>
                        </div>
                        <ChevronRight
                          size={18}
                          className="mt-1 shrink-0 text-slate-400"
                        />
                      </button>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span>
                          {formatDate(event.startOn)} – {formatDate(event.endOn)}
                        </span>
                        <Status value={event.paymentStatus} />
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                        <Status value={event.status} />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEvent(event);
                              setEventModalOpen(true);
                            }}
                            className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeEvent(event)}
                            className="min-h-9 rounded-lg px-3 text-xs font-semibold text-rose-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hidden md:block">
                  <EventTable
                    events={filteredEvents}
                    onEdit={(event) => {
                      setEditingEvent(event);
                      setEventModalOpen(true);
                    }}
                    onDelete={removeEvent}
                  />
                </div>
              </>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No events found"
                description="Create an event booking to start tracking deliveries and payments."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEvent(null);
                      setEventModalOpen(true);
                    }}
                    className="mt-4 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white"
                  >
                    Create first event
                  </button>
                }
              />
            )}
          </section>
        </section>
      </div>

      <EventFormModal
        open={eventModalOpen}
        event={editingEvent}
        customers={customers}
        saving={saving}
        onClose={() => {
          if (!saving) {
            setEventModalOpen(false);
            setEditingEvent(null);
          }
        }}
        onSave={saveEvent}
      />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* EVENT DETAILS PAGE                                                         */
/* Bottom navigation exists only here.                                       */
/* -------------------------------------------------------------------------- */

export function EventDetailsPage() {
  const navigate = useNavigate();

  const {
    events = [],
    customers = [],
    loading,
    error,
    refresh,
    updateEvent,
  } = useEvents();

  const [activeTab, setActiveTab] = useState("booking");
  const [deliveries, setDeliveries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loadingRecords, setLoadingRecords] = useState(false);
  const [actionError, setActionError] = useState("");
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);

  const eventId = window.location.pathname.split("/").filter(Boolean).pop();

  const selectedEvent = useMemo(
    () =>
      events.find((event) => String(event.id) === String(eventId)) || null,
    [events, eventId]
  );

  const selectedCustomer = useMemo(
    () =>
      selectedEvent
        ? customers.find(
            (customer) =>
              String(customer.id) === String(selectedEvent.customerId)
          )
        : null,
    [customers, selectedEvent]
  );

  const loadEventRecords = useCallback(async () => {
    if (!eventId) return;

    setLoadingRecords(true);
    setActionError("");

    try {
      const [deliveryRows, paymentRows] = await Promise.all([
        deliveryService.getAll({ eventId }),
        paymentService.getPayments({ eventId }),
      ]);

      setDeliveries(deliveryRows || []);
      setPayments(paymentRows || []);
    } catch (err) {
      setActionError(err?.message || "Unable to load event records.");
    } finally {
      setLoadingRecords(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEventRecords();
  }, [loadEventRecords]);

  useEffect(() => {
    let active = true;

    deliveryService
      .getEmployees()
      .then((rows) => {
        if (active) setEmployees(rows || []);
      })
      .catch(() => {
        if (active) setEmployees([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = selectedEvent
      ? `${selectedEvent.eventName} | Event Jar Booking | Amrit Jal`
      : "Event Details | Amrit Jal";

    const restoreDescription = updateMeta(
      "description",
      "View event jar bookings, deliveries, payments and event details."
    );
    const restoreRobots = updateMeta("robots", SEO.robots);

    return () => {
      document.title = previousTitle;
      restoreDescription();
      restoreRobots();
    };
  }, [selectedEvent]);

  async function saveDelivery(input) {
    if (!selectedEvent) return;

    await deliveryService.create({
      ...input,
      eventId: selectedEvent.id,
    });

    setDeliveryModalOpen(false);
    await loadEventRecords();
    await refresh();
  }

  async function savePayment() {
    await loadEventRecords();
    await refresh();
  }

  async function saveEventChanges(input) {
    if (!selectedEvent) return;

    setSavingEvent(true);

    try {
      await updateEvent(selectedEvent.id, input);
      setEditingEvent(false);
      await refresh();
    } catch (err) {
      setActionError(err?.message || "Unable to update event.");
    } finally {
      setSavingEvent(false);
    }
  }

  const totalDeliveredJars = deliveries.reduce(
    (sum, row) => sum + Number(row.quantity || 0),
    0
  );

  const totalReturnedJars = deliveries.reduce(
    (sum, row) => sum + Number(row.jarsReceived || 0),
    0
  );

  const totalProducts = deliveries.reduce(
    (sum, row) =>
      sum +
      (row.items || []).reduce(
        (itemSum, item) => itemSum + Number(item.quantity || 0),
        0
      ),
    0
  );

  const groupedDeliveries = useMemo(() => {
    const groups = new Map();

    deliveries.forEach((delivery) => {
      const key = delivery.date || "undated";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(delivery);
    });

    return Array.from(groups.entries()).sort((a, b) =>
      b[0].localeCompare(a[0])
    );
  }, [deliveries]);

  if (loading && !selectedEvent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <RefreshCw size={18} className="animate-spin" />
          Loading event...
        </div>
      </main>
    );
  }

  if (!selectedEvent) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5 text-center">
        <CalendarDays size={34} className="text-slate-400" />
        <h1 className="mt-3 text-lg font-bold text-slate-800">
          Event not found
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          This event may have been removed or is unavailable.
        </p>
        <button
          type="button"
          onClick={() => navigate("/events")}
          className="mt-5 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white"
        >
          Back to Events
        </button>
      </main>
    );
  }

  const tabContent = {
    booking: (
      <div className="space-y-5">
        <div className="px-1 pt-2">
          <h2 className="text-lg font-bold text-slate-900">
            {selectedEvent.eventName}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {selectedEvent.customerName} ·{" "}
            {formatDate(selectedEvent.startOn)}
            {selectedEvent.endOn !== selectedEvent.startOn &&
              ` – ${formatDate(selectedEvent.endOn)}`}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Event Jar Booking
          </h3>
          <Status value={selectedEvent.status} />
        </div>

        {loadingRecords ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading bookings...
          </div>
        ) : groupedDeliveries.length ? (
          <div className="space-y-5">
            {groupedDeliveries.map(([date, rows]) => (
              <section key={date}>
                <h4 className="mb-3 px-2 text-sm font-semibold text-slate-700">
                  {date === "undated" ? "Date not available" : formatDate(date)}
                </h4>

                <div className="space-y-3">
                  {rows.map((delivery) => {
                    const productCount = (delivery.items || []).reduce(
                      (sum, item) => sum + Number(item.quantity || 0),
                      0
                    );

                    return (
                      <article
                        key={delivery.id}
                        className="flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-3.5 shadow-[0_5px_18px_rgba(15,23,42,0.10)]"
                      >
                        <div className="relative flex size-[68px] shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                          <Package size={34} strokeWidth={2.2} />
                          <span className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white shadow">
                            {productCount}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-bold text-slate-900">
                            {selectedEvent.eventName}
                          </h3>
                          <p className="mt-1 text-xs text-slate-600">
                            Total Required Products - {productCount}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {delivery.deliveryPerson || "Delivery recorded"}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1 text-slate-400">
                          <Clock3 size={17} />
                          <span className="text-xs">
                            {delivery.shift || "—"}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No jar bookings yet"
            description="Add a delivery to start tracking jars and products for this event."
            action={
              <button
                type="button"
                onClick={() => setDeliveryModalOpen(true)}
                className="mt-4 rounded-xl bg-cyan-600 px-4 py-3 text-xs font-bold text-white"
              >
                Add First Booking
              </button>
            }
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase text-slate-400">
              Total Jars Delivered
            </p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">
              {totalDeliveredJars}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase text-slate-400">
              Jars Returned
            </p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">
              {totalReturnedJars}
            </p>
          </div>
        </div>
      </div>
    ),

    delivery: (
      <div className="space-y-4">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900">
                Event Deliveries
              </h2>
              <p className="mt-1 truncate text-xs text-slate-500">
                {selectedEvent.eventName} · {selectedEvent.customerName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeliveryModalOpen(true)}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-cyan-600 px-3 text-xs font-bold text-white"
            >
              <Plus size={15} />
              Add
            </button>
          </div>

          {loadingRecords ? (
            <div className="py-10 text-center text-xs text-slate-500">
              Loading deliveries...
            </div>
          ) : deliveries.length ? (
            <div className="divide-y divide-slate-100">
              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {formatDate(delivery.date)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {delivery.quantity} jars ·{" "}
                      {delivery.deliveryPerson || "No delivery person"}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-slate-900">
                    {currency(delivery.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Truck}
              title="No deliveries yet"
              description="Add the first delivery for this event."
              action={
                <button
                  type="button"
                  onClick={() => setDeliveryModalOpen(true)}
                  className="mt-4 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white"
                >
                  Add delivery
                </button>
              }
            />
          )}
        </section>
      </div>
    ),

    payment: (
      <div className="space-y-4">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900">
                Event Payments
              </h2>
              <p className="mt-1 truncate text-xs text-slate-500">
                {selectedEvent.eventName} · {selectedEvent.customerName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPaymentModalOpen(true)}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-cyan-600 px-3 text-xs font-bold text-white"
            >
              <Plus size={15} />
              Add
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">
                Invoice
              </p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {currency(selectedEvent.eventInvoice)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">
                Due
              </p>
              <p className="mt-1 text-base font-bold text-rose-600">
                {currency(selectedEvent.dueAmount)}
              </p>
            </div>
          </div>

          {loadingRecords ? (
            <div className="py-10 text-center text-xs text-slate-500">
              Loading payments...
            </div>
          ) : payments.length ? (
            <div className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {formatDate(payment.date)}
                    </p>
                    <p className="mt-1 text-xs capitalize text-slate-500">
                      {String(payment.method || "cash").replace(/_/g, " ")}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-emerald-700">
                    +{currency(payment.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Wallet}
              title="No payments yet"
              description="Add a payment received against this event."
              action={
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(true)}
                  className="mt-4 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white"
                >
                  Add payment
                </button>
              }
            />
          )}
        </section>
      </div>
    ),

    invoices: (
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <ReceiptText size={20} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-900">
                {selectedEvent.eventName}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {selectedEvent.customerName}
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {[
              ["Event Invoice", selectedEvent.eventInvoice],
              ["Advance Amount", selectedEvent.advanceAmount],
              ["Payment Received", selectedEvent.eventPayment],
              ["Outstanding Due", selectedEvent.dueAmount],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 p-3"
              >
                <span className="text-xs text-slate-500">{label}</span>
                <strong className="text-sm text-slate-900">
                  {currency(value)}
                </strong>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[11px] leading-5 text-slate-500">
            These amounts are the invoice and payment summary saved on the
            event booking. This view does not create or modify a separate
            invoice record.
          </p>
        </section>
      </div>
    ),

    details: (
      <div className="space-y-4">
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {selectedEvent.eventName}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Event #{String(selectedEvent.id).slice(-8)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingEvent(true)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
            >
              Edit
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Status value={selectedEvent.status} />
            <Status value={selectedEvent.paymentStatus} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ["Customer", selectedEvent.customerName],
              ["Phone", selectedEvent.customerPhone],
              ["Start Date", formatDate(selectedEvent.startOn)],
              ["End Date", formatDate(selectedEvent.endOn)],
              ["Delivered", selectedEvent.delivered],
              ["Received", selectedEvent.received],
              ["Unreceived", selectedEvent.unreceived],
              [
                "Delivery Address",
                selectedEvent.customerAddress ||
                  selectedCustomer?.address ||
                  "—",
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="min-w-0 rounded-xl bg-slate-50 p-3"
              >
                <p className="text-[10px] font-semibold uppercase text-slate-500">
                  {label}
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>

          {selectedEvent.customerPhone && (
            <a
              href={`tel:${String(selectedEvent.customerPhone).replace(/[^\d+]/g, "")}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-xs font-bold text-emerald-700"
            >
              <Phone size={14} />
              Call customer
            </a>
          )}

          {selectedEvent.notes && (
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs font-bold text-slate-700">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-500">
                {selectedEvent.notes}
              </p>
            </div>
          )}
        </section>

        {editingEvent && (
          <EventFormModal
            open={editingEvent}
            event={selectedEvent}
            customers={customers}
            saving={savingEvent}
            onClose={() => setEditingEvent(false)}
            onSave={saveEventChanges}
          />
        )}
      </div>
    ),
  };

  return (
    <main className="min-h-[100dvh] bg-[#F4F7F8] text-slate-800">
      {/* Event detail header */}
      <header className="sticky top-0 z-30 flex min-h-[72px] items-center gap-4 bg-[#079FCB] px-4 py-3 text-white shadow-sm">
        <button
          type="button"
          onClick={() => navigate("/events")}
          aria-label="Back to events"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/80"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold sm:text-xl">
            Event Jar Booking
          </h1>
          <p className="truncate text-[11px] text-white/80">
            {selectedEvent.eventName}
          </p>
        </div>

        <button
          type="button"
          onClick={loadEventRecords}
          aria-label="Refresh event records"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-white/90 hover:bg-white/10"
        >
          <RefreshCw size={18} />
        </button>
      </header>

      <div className="mx-auto w-full max-w-5xl px-3 pb-[calc(100px+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-8 sm:pt-6">
        {actionError && (
          <div
            role="alert"
            className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
          >
            {actionError}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
          >
            {error}
          </div>
        )}

        {/* Event heading / date */}
        <section className="mb-5 rounded-2xl bg-white px-4 py-4 shadow-sm">
          <p className="text-base font-semibold text-slate-900">
            {formatDate(selectedEvent.startOn)}
            {selectedEvent.endOn !== selectedEvent.startOn &&
              ` – ${formatDate(selectedEvent.endOn)}`}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Package size={14} />
              {totalProducts} products recorded
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Truck size={14} />
              {deliveries.length} deliveries
            </span>
          </div>
        </section>

        {/* Desktop tabs */}
        <nav
          className="mb-5 hidden border-b border-slate-200 sm:block"
          aria-label="Event sections"
        >
          <div className="flex gap-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={activeTab === id ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition ${
                  activeTab === id
                    ? "border-cyan-600 text-cyan-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        <section key={activeTab} className="min-w-0">
          {tabContent[activeTab]}
        </section>
      </div>

      {/* Floating add button on the Booking tab */}
      {activeTab === "booking" && (
        <button
          type="button"
          onClick={() => setDeliveryModalOpen(true)}
          aria-label="Add event jar booking"
          className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] right-5 z-30 flex size-16 items-center justify-center rounded-full bg-cyan-600 text-white shadow-[0_8px_24px_rgba(8,145,178,0.35)] transition active:scale-95 sm:bottom-8 sm:right-8"
        >
          <Plus size={32} />
        </button>
      )}

      {/* Mobile bottom navigation ONLY on EventDetailsPage */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-1 pt-2 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] pb-[max(8px,env(safe-area-inset-bottom))] sm:hidden"
        aria-label="Event sections"
      >
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition ${
                  active ? "text-cyan-700" : "text-slate-400"
                }`}
              >
                <span
                  className={`flex size-8 items-center justify-center rounded-xl ${
                    active ? "bg-cyan-50" : ""
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Delivery form */}
      {deliveryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4">
          <div className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Add Event Jar Booking
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedEvent.eventName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeliveryModalOpen(false)}
                className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
                aria-label="Close delivery form"
              >
                <X size={18} />
              </button>
            </div>

            <DeliveryForm
              customers={customers}
              employees={employees}
              initialData={{
                customerId: selectedEvent.customerId,
                date: selectedEvent.startOn,
              }}
              submitLabel="Save Event Delivery"
              onCancel={() => setDeliveryModalOpen(false)}
              onSubmit={saveDelivery}
            />
          </div>
        </div>
      )}

      {paymentModalOpen && (
        <PaymentModal
          event={selectedEvent}
          onClose={() => setPaymentModalOpen(false)}
          onSaved={savePayment}
        />
      )}
    </main>
  );
}
