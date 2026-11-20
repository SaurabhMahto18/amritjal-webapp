
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Truck,
  CreditCard,
  ReceiptText,
  Package,
  RefreshCw,
  Info,
  CalendarDays,
} from "lucide-react";

import useEvents from "../hooks/useEvents";

import EventBookingTab from "../components/tabs/EventBookingTab";
import EventDeliveryTab from "../components/tabs/EventDeliveryTab";
import EventPaymentTab from "../components/tabs/EventPaymentTab";
import EventInvoicesTab from "../components/tabs/EventInvoicesTab";
import EventInfoTab from "../components/tabs/EventInfoTab";
import EventBookingModal from "../components/EventBookingModal";

import deliveryService from "../../deliveries/services/deliveryService";

const TABS = [
  { id: "booking", label: "Booking", icon: Package },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "invoices", label: "Invoices", icon: ReceiptText },
  { id: "details", label: "Details", icon: Info },
];

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

  /* ---------------------------------------------
     Current event
  --------------------------------------------- */

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
      return deliveryRows || [];
    } catch (err) {
      setRecordsError(
        err?.message || "Unable to load event bookings."
      );

      throw err;
    } finally {
      setRecordsLoading(false);
    }
  }, [event?.id]);

  /* ---------------------------------------------
     Load employees
  --------------------------------------------- */

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

    void loadBookings().catch(() => {});
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
     Booking modal actions
  --------------------------------------------- */

  const openCreateBooking = useCallback(() => {
    setEditingBooking(null);
    setRecordsError("");
    setBookingModalOpen(true);
  }, []);

  const openEditBooking = useCallback((booking) => {
    setEditingBooking(booking);
    setRecordsError("");
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

  const handleSaveBooking = useCallback(
    async (payload) => {
      if (!event?.id) {
        throw new Error("Event not found.");
      }

      setSavingBooking(true);
      setRecordsError("");

      try {
        if (editingBooking?.id) {
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
      } catch (err) {
        setRecordsError(
          err?.message || "Unable to save event booking."
        );

        throw err;
      } finally {
        setSavingBooking(false);
      }
    },
    [event?.id, editingBooking, loadBookings]
  );

  /* ---------------------------------------------
     Confirm booking
  --------------------------------------------- */

  const handleConfirmBooking = useCallback(
    async (booking) => {
      if (!booking?.id) {
        throw new Error("Booking ID is missing.");
      }

      setRecordsError("");

      try {
        await deliveryService.confirmEventBooking(booking.id);

        // Reload the booking list after database confirmation.
        await loadBookings();

        return true;
      } catch (err) {
        setRecordsError(
          err?.message || "Unable to confirm this booking."
        );

        throw err;
      }
    },
    [loadBookings]
  );

  /* ---------------------------------------------
     Delete booking
  --------------------------------------------- */

  const handleDeleteBooking = useCallback(
    async (booking) => {
      if (!booking?.id) {
        throw new Error("Booking ID is missing.");
      }

      setRecordsError("");

      try {
        await deliveryService.delete(booking.id);

        setBookings((previous) =>
          previous.filter(
            (item) => item.id !== booking.id
          )
        );

        return true;
      } catch (err) {
        setRecordsError(
          err?.message || "Unable to delete this booking."
        );

        throw err;
      }
    },
    []
  );

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
            className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700"
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
          onConfirmBooking={handleConfirmBooking}
        />
      </div>
    ),

    delivery: (
      <EventDeliveryTab
        event={event}
        customer={customer}
        bookings={bookings}
        loading={recordsLoading}
        error={recordsError}
        onRefresh={loadBookings}
      />
    ),

    payment: (
      <EventPaymentTab
        event={event}
        customer={customer}
      />
    ),

    invoices: (
      <EventInvoicesTab
        event={event}
        customer={customer}
      />
    ),

    details: (
      <EventInfoTab
        event={event}
        customer={customer}
        customers={customers}
      />
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
                aria-current={
                  activeTab === id ? "page" : undefined
                }
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
        initialData={editingBooking}
        submitLabel={
          editingBooking ? "Update Booking" : "Create Booking"
        }
        onClose={closeBookingModal}
        onSubmit={handleSaveBooking}
      />
    </main>
  );
}
