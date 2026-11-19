
import { useRef, useState } from "react";
import {
  Package,
  Clock3,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Truck,
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

const formatTime = (value) => {
  if (!value) return "Time not set";

  const [hours, minutes] = String(value).split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

function BookingCard({ booking, onEdit, onDelete }) {
  const [offset, setOffset] = useState(0);
  const [deleting, setDeleting] = useState(false);
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

  function handleTouchStart(e) {
    touchStart.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStart.current === null) return;

    const difference = touchStart.current - e.changedTouches[0].clientX;

    if (difference > 55) setOffset(76);
    if (difference < -40) setOffset(0);

    touchStart.current = null;
  }

  async function confirmDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this booking?"
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      await onDelete?.(booking);
      setOffset(0);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[28px]">
      {/* Swipe action */}
      <div className="absolute inset-y-0 right-0 flex w-[76px] items-center justify-center bg-red-500">
        <button
          type="button"
          onClick={confirmDelete}
          disabled={deleting}
          aria-label="Delete booking"
          className="flex h-full w-full flex-col items-center justify-center gap-1 text-white"
        >
          <Trash2 size={21} />
          <span className="text-xs font-semibold">
            {deleting ? "..." : "Delete"}
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
        className="relative z-10 flex min-h-[112px] items-center gap-3 rounded-[28px] border border-slate-100 bg-white p-3 shadow-[0_7px_18px_rgba(0,0,0,0.15)]"
      >
        <button
          type="button"
          onClick={() => onEdit?.(booking)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label={`Edit ${title}`}
        >
          <div className="relative flex size-[68px] shrink-0 items-center justify-center rounded-2xl bg-[#E7F6FA] text-[#079FCB]">
            <Package size={39} strokeWidth={2.3} />
            <span className="absolute -right-2 -top-2 flex size-9 items-center justify-center rounded-full bg-[#079FCB] text-sm font-bold text-white shadow">
              {items.length || 1}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-extrabold text-[#242424] sm:text-lg">
              {title}
            </h3>

            <p className="mt-1 truncate text-sm text-slate-600 sm:text-base">
              Total Required Products - {productCount}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onEdit?.(booking)}
          className="flex shrink-0 items-center gap-1 text-slate-400"
          aria-label="Open booking"
        >
          <Clock3 size={18} />
          <span className="whitespace-nowrap text-xs sm:text-sm">
            {formatTime(booking.time)}
          </span>
          <ChevronRight size={21} />
        </button>

        <button
          type="button"
          onClick={() => onEdit?.(booking)}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-400 sm:hidden"
          aria-label="Edit booking"
        >
          <Pencil size={13} />
        </button>
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
}) {
  const groupedBookings = bookings.reduce((groups, booking) => {
    const date = booking.date || booking.delivery_date || event?.startOn || "";

    if (!groups[date]) groups[date] = [];
    groups[date].push(booking);

    return groups;
  }, {});

  const dates = Object.keys(groupedBookings).sort();

  return (
    <div className="min-h-[calc(100dvh-190px)] space-y-5 bg-white px-3 pb-8 pt-5 sm:rounded-2xl sm:bg-transparent sm:px-0">
      <div className="px-2">
        <h2 className="text-lg font-semibold text-[#242424]">
          {formatDate(event?.startOn)}
        </h2>
        {event?.endOn && event.endOn !== event.startOn && (
          <p className="mt-1 text-xs text-slate-500">
            Until {formatDate(event.endOn)}
          </p>
        )}
      </div>

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

      {/* Floating Add Booking */}
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
