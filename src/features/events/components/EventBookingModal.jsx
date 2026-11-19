
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ArrowLeft, Package } from "lucide-react";

import EventBookingForm from "./EventBookingForm";

export default function EventBookingModal({
  open,
  event,
  customers = [],
  employees = [],
  onClose,
  onSubmit,
}) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open || !event) return null;

  const customerId =
    event.customerId || event.customer_id || "";

  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === String(customerId)
  );

  const customerName =
    selectedCustomer?.name ||
    event.customerName ||
    event.customer_name ||
    "Event Customer";

  const customerPhone =
    selectedCustomer?.phone ||
    event.customerPhone ||
    event.customer_phone ||
    "";

  const handleSubmit = async (payload) => {
    await onSubmit({
      ...payload,
      customerId,
      eventId: event.id,
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 sm:items-center sm:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-booking-title"
        className="flex h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl"
      >
        {/* Header */}
        <header className="flex shrink-0 items-center gap-3 bg-[#079FCB] px-4 py-3 text-white sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking form"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/70 transition hover:bg-white/10"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="min-w-0 flex-1">
            <h2
              id="event-booking-title"
              className="text-lg font-bold sm:text-xl"
            >
              Create Order Booking
            </h2>

            <p className="truncate text-xs text-white/85">
              {event.eventName || event.event_name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hidden rounded-full p-2 transition hover:bg-white/10 sm:block"
          >
            <X size={20} />
          </button>
        </header>

        {/* Customer Information */}
        <div className="shrink-0 border-b border-slate-100 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Customer
              </p>

              <p className="mt-1 truncate text-sm font-bold text-slate-800">
                {customerName}
              </p>

              {customerPhone && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {customerPhone}
                </p>
              )}
            </div>

            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#079FCB]">
              <Package size={22} />
            </div>
          </div>
        </div>

        {/* Dedicated Event Booking Form */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5">
          <EventBookingForm
            key={event.id}
            event={event}
            customers={customers}
            employees={employees}
            onCancel={onClose}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Safe Area */}
        <div className="shrink-0 bg-white pb-[env(safe-area-inset-bottom)]" />
      </section>
    </div>,
    document.body
  );
}
