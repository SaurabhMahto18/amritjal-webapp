
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Truck,
  CreditCard,
  ReceiptText,
  Package,
  Plus,
  RefreshCw,
  Phone,
  MapPin,
  Info,
} from "lucide-react";

import useEvents from "../hooks/useEvents";
import EventBookingTab from "../components/tabs/EventBookingTab";
import EventBookingModal from "../components/EventBookingModal";
import deliveryService from "../../deliveries/services/deliveryService";

const TABS = [
  { id: "booking", label: "Booking", icon: Package },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "invoices", label: "Invoices", icon: ReceiptText },
  { id: "details", label: "Details", icon: Info },
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

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

function StatusBadge({ value }) {
  const status = String(value || "Pending").toLowerCase();

  const color =
    status.includes("paid") || status.includes("complete")
      ? "bg-emerald-50 text-emerald-700"
      : status.includes("cancel")
        ? "bg-rose-50 text-rose-700"
        : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${color}`}
    >
      {String(value || "Pending").replace(/[_-]/g, " ")}
    </span>
  );
}

function InfoCard({ label, value, icon: Icon }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      {Icon && <Icon size={17} className="mb-2 text-cyan-600" />}

      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-slate-800">
        {value ?? "—"}
      </p>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-900">
          {title}
        </h2>
      </div>

      <div className="p-4">{children}</div>
    </section>
  );
}

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const {
    events = [],
    customers = [],
    loading,
    error,
  } = useEvents();

  const [activeTab, setActiveTab] = useState("booking");

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");
  const [savingBooking, setSavingBooking] = useState(false);

  const event = useMemo(
    () =>
      events.find(
        (item) => String(item.id) === String(eventId)
      ),
    [events, eventId]
  );

  const customer = useMemo(
    () =>
      customers.find(
        (item) =>
          String(item.id) ===
          String(event?.customerId || event?.customer_id)
      ),
    [customers, event]
  );

  const customerName =
    event?.customerName ||
    event?.customer_name ||
    customer?.name ||
    "Customer";

  const customerPhone =
    event?.customerPhone ||
    event?.customer_phone ||
    customer?.phone ||
    "";

  const address =
    event?.eventAddress ||
    event?.event_address ||
    event?.customerAddress ||
    customer?.address ||
    customer?.area ||
    "Address not added";

  const eventName =
    event?.eventName || event?.event_name || "Event";

  const startDate = event?.startOn || event?.start_on;
  const endDate = event?.endOn || event?.end_on;

  /* ---------------------------------------------
     Load event-specific bookings
  --------------------------------------------- */

  const loadBookings = useCallback(async () => {
    if (!event?.id) return;

    setRecordsLoading(true);
    setRecordsError("");

    try {
      const deliveryRows = await deliveryService.getAll({
        eventId: event.id,
      });

      setBookings(deliveryRows || []);
    } catch (err) {
      setRecordsError(
        err?.message || "Unable to load event bookings."
      );
    } finally {
      setRecordsLoading(false);
    }
  }, [event?.id]);

  /* Load employees separately */

  const loadEmployees = useCallback(async () => {
    try {
      const rows = await deliveryService.getEmployees();
      setEmployees(rows || []);
    } catch (err) {
      setRecordsError(
        err?.message || "Unable to load employees."
      );
    }
  }, []);

  useEffect(() => {
    if (!event?.id) return;

    void loadBookings();
    void loadEmployees();
  }, [event?.id, loadBookings, loadEmployees]);

  /* ---------------------------------------------
     SEO metadata
  --------------------------------------------- */

  useEffect(() => {
    const previousTitle = document.title;

    const descriptionMeta = document.querySelector(
      'meta[name="description"]'
    );

    const robotsMeta = document.querySelector(
      'meta[name="robots"]'
    );

    const previousDescription = descriptionMeta?.content;
    const previousRobots = robotsMeta?.content;

    document.title = `${eventName} | Event Details | Amrit Jal`;

    if (descriptionMeta) {
      descriptionMeta.content =
        `Manage bookings, deliveries, payments and details for ${eventName}.`;
    }

    if (robotsMeta) {
      robotsMeta.content = "noindex, nofollow, noarchive";
    }

    return () => {
      document.title = previousTitle;

      if (descriptionMeta && previousDescription !== undefined) {
        descriptionMeta.content = previousDescription;
      }

      if (robotsMeta && previousRobots !== undefined) {
        robotsMeta.content = previousRobots;
      }
    };
  }, [eventName]);

  /* ---------------------------------------------
     Booking actions
  --------------------------------------------- */

  const openCreateBooking = useCallback(() => {
    setEditingBooking(null);
    setBookingModalOpen(true);
  }, []);

  const openEditBooking = useCallback((booking) => {
    setEditingBooking(booking);
    setBookingModalOpen(true);
  }, []);

  const closeBookingModal = useCallback(() => {
    if (savingBooking) return;

    setBookingModalOpen(false);
    setEditingBooking(null);
  }, [savingBooking]);

  /* ---------------------------------------------
     Save booking
  --------------------------------------------- */

  async function handleSaveBooking(payload) {
    if (!event?.id) {
      throw new Error("Event not found.");
    }

    setSavingBooking(true);
    setRecordsError("");

    try {
      if (editingBooking?.id) {
        if (typeof deliveryService.update !== "function") {
          throw new Error(
            "Booking update is not implemented in deliveryService yet."
          );
        }

        await deliveryService.update(editingBooking.id, {
          ...payload,
          eventId: event.id,
        });
      } else {
        await deliveryService.create({
          ...payload,
          eventId: event.id,
        });
      }

      setBookingModalOpen(false);
      setEditingBooking(null);

      await loadBookings();
    } finally {
      setSavingBooking(false);
    }
  }

  /* ---------------------------------------------
     Delete booking
  --------------------------------------------- */

  async function handleDeleteBooking(booking) {
    if (!booking?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this event booking?"
    );

    if (!confirmed) return;

    try {
      setRecordsError("");

      await deliveryService.delete(booking.id);

      setBookings((previous) =>
        previous.filter(
          (item) => item.id !== booking.id
        )
      );
    } catch (err) {
      setRecordsError(
        err?.message || "Unable to delete this booking."
      );
    }
  }

  /* ---------------------------------------------
     Loading
  --------------------------------------------- */

  if (loading && !event) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-white">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <RefreshCw size={18} className="animate-spin" />
          Loading event...
        </div>
      </main>
    );
  }

  /* ---------------------------------------------
     Not found
  --------------------------------------------- */

  if (!event) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 px-5 text-center">
        <CalendarDays size={36} className="text-slate-400" />

        <h1 className="mt-3 text-lg font-bold text-slate-900">
          Event not found
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          This event may have been removed or is unavailable.
        </p>

        <button
          type="button"
          onClick={() => navigate("/events")}
          className="mt-5 min-h-11 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white"
        >
          Back to Events
        </button>
      </main>
    );
  }

  /* ---------------------------------------------
     Tab content
  --------------------------------------------- */

  const content = {
    booking: (
      <div className="space-y-3">
        {recordsError && (
          <div
            role="alert"
            className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700"
          >
            {recordsError}
          </div>
        )}

        <EventBookingTab
          event={event}
          bookings={bookings}
          loading={recordsLoading}
          onAddBooking={openCreateBooking}
          onEditBooking={openEditBooking}
          onDeleteBooking={handleDeleteBooking}
        />

        {/* Floating Add Booking Button */}
        <button
          type="button"
          onClick={openCreateBooking}
          aria-label="Add event booking"
          className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] right-5 z-30 flex size-16 items-center justify-center rounded-full bg-[#079FCB] text-white shadow-[0_8px_25px_rgba(0,150,190,0.35)] transition hover:scale-105 active:scale-95 sm:bottom-8 sm:right-8"
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>
      </div>
    ),

    delivery: (
      <div className="space-y-4">
        <SectionCard title="Delivery Summary">
          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              label="Delivered"
              value={event.delivered ?? 0}
            />

            <InfoCard
              label="Received"
              value={event.received ?? 0}
            />

            <InfoCard
              label="Unreceived"
              value={event.unreceived ?? 0}
            />

            <InfoCard
              label="Rate Per Jar"
              value={money(
                event.ratePerJar ?? event.rate_per_jar ?? 0
              )}
            />
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Event-specific delivery bookings are displayed in the Booking tab.
          </p>
        </SectionCard>
      </div>
    ),

    payment: (
      <div className="space-y-4">
        <SectionCard title="Payment Summary">
          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              label="Event Invoice"
              value={money(event.eventInvoice ?? event.event_invoice)}
            />

            <InfoCard
              label="Advance Amount"
              value={money(event.advanceAmount ?? event.advance_amount)}
            />

            <InfoCard
              label="Payment Received"
              value={money(event.eventPayment ?? event.event_payment)}
            />

            <InfoCard
              label="Outstanding Due"
              value={money(event.dueAmount ?? event.due_amount)}
            />
          </div>

          <div className="mt-4">
            <StatusBadge
              value={event.paymentStatus || event.payment_status}
            />
          </div>
        </SectionCard>
      </div>
    ),

    invoices: (
      <div className="space-y-4">
        <SectionCard title="Event Invoice Summary">
          <div className="divide-y divide-slate-100">
            {[
              [
                "Event Invoice",
                event.eventInvoice ?? event.event_invoice,
              ],
              [
                "Advance Amount",
                event.advanceAmount ?? event.advance_amount,
              ],
              [
                "Payment Received",
                event.eventPayment ?? event.event_payment,
              ],
              [
                "Outstanding Due",
                event.dueAmount ?? event.due_amount,
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 py-3"
              >
                <span className="text-xs text-slate-500">
                  {label}
                </span>

                <strong className="text-sm text-slate-900">
                  {money(value)}
                </strong>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            This is the invoice summary stored on the event. It does not
            create a separate invoice document.
          </p>
        </SectionCard>
      </div>
    ),

    details: (
      <div className="space-y-4">
        <SectionCard title="Event Information">
          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              label="Event Name"
              value={eventName}
            />

            <InfoCard
              label="Customer"
              value={customerName}
            />

            <InfoCard
              label="Start Date"
              value={formatDate(startDate)}
            />

            <InfoCard
              label="End Date"
              value={formatDate(endDate)}
            />

            <InfoCard
              label="Agent"
              value={
                event.agentEnabled ?? event.agent_enabled
                  ? "Enabled"
                  : "Disabled"
              }
            />

            <InfoCard
              label="Rate Per Jar"
              value={money(
                event.ratePerJar ?? event.rate_per_jar ?? 0
              )}
            />
          </div>

          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase text-slate-400">
              Event Address
            </p>

            <p className="mt-1 text-sm text-slate-700">
              {address}
            </p>
          </div>

          {event.notes && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-700">
                Notes
              </p>

              <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-500">
                {event.notes}
              </p>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Customer Details">
          <p className="text-sm font-bold text-slate-900">
            {customerName}
          </p>

          {customerPhone && (
            <a
              href={`tel:${customerPhone}`}
              className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-cyan-700"
            >
              <Phone size={16} />
              {customerPhone}
            </a>
          )}

          <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
            <MapPin size={15} className="mt-0.5 shrink-0" />
            {address}
          </p>
        </SectionCard>
      </div>
    ),
  };

  return (
    <main className="min-h-[100dvh] bg-[#F4F7F8] text-slate-800">
      <div className="mx-auto max-w-5xl px-3 pb-[calc(100px+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-8">
        {error && (
          <div
            role="alert"
            className="mb-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700"
          >
            {error}
          </div>
        )}

        {/* Event Header */}
        <header className="mb-4 flex items-center gap-3 rounded-2xl bg-[#079FCB] px-4 py-4 text-white shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/events")}
            aria-label="Back to events"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/70"
          >
            <ArrowLeft size={23} />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold sm:text-xl">
              {eventName}
            </h1>

            <p className="mt-1 text-xs text-cyan-50">
              Event Jar Booking
            </p>
          </div>
        </header>

        {/* Event Date and Status */}
        <section className="mb-4 rounded-2xl bg-white px-4 py-4 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            {formatDate(startDate)}
          </p>

          {endDate !== startDate && (
            <p className="mt-1 text-xs text-slate-500">
              Until {formatDate(endDate)}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge value={event.status} />

            <StatusBadge
              value={event.paymentStatus || event.payment_status}
            />
          </div>
        </section>

        {/* Desktop Navigation */}
        <nav
          className="mb-5 hidden border-b border-slate-200 sm:block"
          aria-label="Event navigation"
        >
          <div className="flex gap-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={activeTab === id ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold ${
                  activeTab === id
                    ? "border-cyan-600 text-cyan-700"
                    : "border-transparent text-slate-500"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Active Tab */}
        <section key={activeTab}>
          {content[activeTab]}
        </section>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-1 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(15,23,42,0.08)] sm:hidden"
        aria-label="Event navigation"
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
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold ${
                  active
                    ? "text-cyan-700"
                    : "text-slate-400"
                }`}
              >
                <span
                  className={`flex size-8 items-center justify-center rounded-xl ${
                    active ? "bg-cyan-50" : ""
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </span>

                {label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Event Booking Modal */}
      <EventBookingModal
        open={bookingModalOpen}
        event={event}
        customers={customers}
        employees={employees}
        onClose={closeBookingModal}
        onSubmit={handleSaveBooking}
      />
    </main>
  );
}
