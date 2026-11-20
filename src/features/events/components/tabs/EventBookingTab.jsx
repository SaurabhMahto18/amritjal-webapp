
import { useRef, useState } from "react";
import {
  Package,
  Clock3,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

const formatDate = (value) => {
  if (!value) return "Date not available";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getBookingTime = (booking) =>
  booking?.bookingTime ||
  booking?.booking_time ||
  booking?.time ||
  "";

const formatTime = (value) => {
  if (!value) return "Time not set";

  const [hours, minutes] = String(value).split(":");

  if (
    !Number.isInteger(Number(hours)) ||
    !Number.isInteger(Number(minutes))
  ) {
    return "Time not set";
  }

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const isConfirmed = (booking) =>
  String(booking?.status || "").toLowerCase() === "confirmed";

function BookingCard({
  booking,
  onEdit,
  onDelete,
  onConfirm,
}) {
  const [offset, setOffset] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmedLocally, setConfirmedLocally] = useState(false);
  const [error, setError] = useState("");

  const touchStart = useRef(null);

  const items = booking.items || [];

  const productCount = items.reduce(
    (sum, item) =>
      sum + Number(item.quantity ?? item.quantity_delivered ?? 0),
    0
  );

  const title =
    booking.bookingTitle ||
    booking.eventName ||
    items[0]?.productName ||
    items[0]?.product_name ||
    "Event Jar Booking";

  const bookingTime = getBookingTime(booking);
  const confirmed = isConfirmed(booking) || confirmedLocally;

  function handleTouchStart(e) {
    touchStart.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStart.current === null) return;

    const difference =
      touchStart.current - e.changedTouches[0].clientX;

    if (difference > 55) setOffset(76);
    if (difference < -40) setOffset(0);

    touchStart.current = null;
  }

  async function handleDelete() {
    const message = confirmed
      ? "This booking is confirmed. Are you sure you want to delete it?"
      : "Are you sure you want to delete this booking?";

    if (!window.confirm(message)) return;

    setDeleting(true);
    setError("");

    try {
      if (typeof onDelete !== "function") {
        throw new Error("Delete handler is not connected.");
      }

      await onDelete(booking);
      setOffset(0);
    } catch (err) {
      setError(err?.message || "Unable to delete booking.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleConfirmBooking() {
    if (confirmed || confirming || deleting) return;

    setConfirming(true);
    setError("");

    try {
      if (typeof onConfirm !== "function") {
        throw new Error(
          "Booking confirmation handler is not connected. Please check the parent component."
        );
      }

      await onConfirm(booking);

      setConfirmedLocally(true);
    } catch (err) {
      setError(err?.message || "Unable to confirm booking.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[28px]">
      {/* Swipe delete background */}
      <div className="absolute inset-y-0 right-0 flex w-[76px] items-center justify-center bg-red-500">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting || confirming}
          aria-label="Delete booking"
          className="flex h-full w-full flex-col items-center justify-center gap-1 text-white disabled:opacity-60"
        >
          {deleting ? (
            <LoaderCircle size={20} className="animate-spin" />
          ) : (
            <Trash2 size={20} />
          )}

          <span className="text-xs font-semibold">
            {deleting ? "Deleting..." : "Delete"}
          </span>
        </button>
      </div>

      {/* Booking card */}
      <article
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(-${offset}px)`,
          transition: "transform 180ms ease",
        }}
        className="relative z-10 rounded-[25px] border border-slate-100 bg-white p-3 shadow-[0_7px_18px_rgba(0,0,0,0.15)]"
      >
        <div className="flex min-h-[70px] items-center gap-3">
          <button
            type="button"
            onClick={() => onEdit?.(booking)}
            disabled={confirming || deleting}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            aria-label={`Edit ${title}`}
          >
            <div className="relative flex size-[50px] shrink-0 items-center justify-center rounded-2xl bg-[#E7F6FA] text-[#079FCB]">
              <Package size={25} strokeWidth={1.3} />

              <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-[#079FCB] text-sm font-bold text-white shadow">
                {items.length || 1}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-extrabold text-[#242424]">
                {title}
              </h3>

              <p className="mt-1 truncate text-xs text-slate-600">
                Total Required Products - {productCount}
              </p>

              <span
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  confirmed
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {confirmed && <CheckCircle2 size={12} />}

                {confirmed
                  ? "CONFIRMED"
                  : "PENDING CONFIRMATION"}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onEdit?.(booking)}
            disabled={confirming || deleting}
            className="flex shrink-0 items-center gap-1 self-start pt-1 text-slate-400"
            aria-label="Edit booking time"
          >
            <Clock3 size={18} />

            <span className="whitespace-nowrap text-xs">
              {formatTime(bookingTime)}
            </span>

            <ChevronRight size={21} />
          </button>

          <button
            type="button"
            onClick={() => onEdit?.(booking)}
            disabled={confirming || deleting}
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-400 sm:hidden"
            aria-label="Edit booking"
          >
            <Pencil size={13} />
          </button>
        </div>

        {/* Confirmation error */}
        {error && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />

            <span>{error}</span>
          </div>
        )}

        {/* Confirm button */}
        {!confirmed && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={handleConfirmBooking}
              disabled={confirming || deleting}
              className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {confirming ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <CheckCircle2 size={19} />
              )}

              {confirming
                ? "Confirming Booking..."
                : "Confirm Booking"}
            </button>
          </div>
        )}

        {/* Confirmed information */}
        {confirmed && (
          <p className="mt-3 border-t border-slate-100 pt-3 text-center text-[11px] font-medium text-emerald-700">
            Booking confirmed · Actual jar movement can be recorded in Delivery
          </p>
        )}
      </article>
    </div>
  );
}

export default function EventBookingTab({
  event,
  bookings = [],
  loading = false,
  onAddBooking,
  onEditBooking,
  onDeleteBooking,
  onConfirmBooking,
}) {
  const groupedBookings = bookings.reduce((groups, booking) => {
    const date =
      booking.date ||
      booking.delivery_date ||
      event?.startOn ||
      event?.start_on ||
      "";

    if (!groups[date]) groups[date] = [];

    groups[date].push(booking);

    return groups;
  }, {});

  const dates = Object.keys(groupedBookings).sort();

  return (
    <div className="min-h-[calc(100dvh-190px)] space-y-5 bg-white px-3 pb-8 pt-5 sm:rounded-2xl sm:bg-transparent sm:px-0">
      

      {/* Booking list */}
      {loading ? (
        <div className="flex justify-center py-12 text-sm text-slate-500">
          Loading bookings...
        </div>
      ) : dates.length ? (
        <div className="space-y-6">
          {dates.map((date) => (
            <section key={date} className="space-y-3">
              <h3 className="px-2 text-sm font-semibold text-slate-600">
                {formatDate(date)}
              </h3>

              {groupedBookings[date].map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onEdit={onEditBooking}
                  onDelete={onDeleteBooking}
                  onConfirm={onConfirmBooking}
                />
              ))}
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 px-5 py-14 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
            <Package size={32} />
          </span>

          <h3 className="mt-4 text-sm font-bold text-slate-800">
            No bookings added
          </h3>

          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
            Tap the plus button to create the first order booking for this event.
          </p>
        </div>
      )}

      {/* Add booking */}
      <button
        type="button"
        onClick={onAddBooking}
        aria-label="Add booking"
        className="fixed bottom-[calc(91px+env(safe-area-inset-bottom))] right-5 z-30 flex size-[68px] items-center justify-center rounded-full bg-[#079FCB] text-white shadow-[0_8px_22px_rgba(0,0,0,0.22)] transition active:scale-95 sm:bottom-8 sm:right-8"
      >
        <Plus size={34} strokeWidth={2.3} />
      </button>
    </div>
  );
}
