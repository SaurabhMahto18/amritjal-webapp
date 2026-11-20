
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Clock3,
  Droplets,
  History,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Truck,
} from "lucide-react";

import { supabase } from "../../../../lib/supabase/client";
import deliveryService from "../../../deliveries/services/deliveryService";

/* ---------------------------------------------
   Helpers
--------------------------------------------- */

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

function formatDateTime(value) {
  if (!value) return "Time unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Time unavailable";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function today() {
  const date = new Date();

  return new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);
}

function getBookingDate(booking) {
  return booking?.date || booking?.delivery_date || "";
}

function getItemProductId(item) {
  return String(item?.productId || item?.product_id || "");
}

function isConfirmed(booking) {
  return String(booking?.status || "").toLowerCase() === "confirmed";
}

function isLegacyAutomaticTransaction(transaction) {
  return [
    "Delivery recorded",
    "Jar return recorded with delivery",
  ].includes(String(transaction?.notes || "").trim());
}

/* ---------------------------------------------
   UI Components
--------------------------------------------- */

function EmptyIllustration() {
  return (
    <div className="flex w-full items-center justify-center py-8">
      <div className="flex size-28 items-center justify-center rounded-full bg-[#E8F7FA] text-cyan-500">
        <Droplets size={54} strokeWidth={1.2} />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-bold text-slate-600">
        {label}
      </span>

      {children}
    </label>
  );
}

const inputClass =
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";

function ActionButton({ type, onClick, disabled = false }) {
  const delivered = type === "delivered";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={
        delivered ? "Add delivered jar" : "Add received jar"
      }
      className="flex items-center gap-3 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="hidden rounded-xl bg-[#222222] px-4 py-3 text-sm font-semibold text-white shadow-sm sm:block">
        {delivered ? "Add Delivered Jar" : "Add Received Jar"}
      </span>

      <span
        className={`flex size-[58px] shrink-0 items-center justify-center rounded-full text-white shadow-[0_7px_18px_rgba(0,0,0,0.18)] transition active:scale-95 ${
          delivered ? "bg-[#079FCB]" : "bg-[#36B486]"
        }`}
      >
        <Plus size={32} strokeWidth={2.2} />
      </span>
    </button>
  );
}

/* ---------------------------------------------
   Main Component
--------------------------------------------- */

export default function EventDeliveryTab({
  event,
  bookings = [],
  loading: bookingsLoading = false,
  error: parentError = "",
  onRefresh,
}) {
  const [screen, setScreen] = useState("transactions");

  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedDate, setSelectedDate] = useState(today());
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ---------------------------------------------
     Confirmed bookings only
  --------------------------------------------- */

  const confirmedBookings = useMemo(
    () => (bookings || []).filter(isConfirmed),
    [bookings]
  );

  const confirmedBookingIds = useMemo(
    () =>
      confirmedBookings
        .map((booking) => booking.id)
        .filter(Boolean),
    [confirmedBookings]
  );

  /* ---------------------------------------------
     Load actual transactions
  --------------------------------------------- */

  const loadData = useCallback(async () => {
    if (!event?.id) return;

    setLoading(true);
    setError("");

    try {
      const [eventResult, productRows] = await Promise.all([
        supabase
          .from("events")
          .select("id, business_id, customer_id")
          .eq("id", event.id)
          .single(),

        deliveryService.getProducts(),
      ]);

      if (eventResult.error) {
        throw eventResult.error;
      }

      const currentBusinessId = eventResult.data?.business_id;

      if (!currentBusinessId) {
        throw new Error("Business information not found for this event.");
      }

      setProducts(productRows || []);

      if (!confirmedBookingIds.length) {
        setTransactions([]);
        return;
      }

      const { data, error: transactionError } = await supabase
        .from("jar_transactions")
        .select(`
          id,
          business_id,
          customer_id,
          product_id,
          delivery_id,
          movement_type,
          quantity,
          transaction_date,
          created_at,
          notes
        `)
        .eq("business_id", currentBusinessId)
        .in("delivery_id", confirmedBookingIds)
        .order("created_at", { ascending: false });

      if (transactionError) {
        throw transactionError;
      }

      // Exclude legacy automatic entries created from planned
      // booking quantities instead of actual physical movement.
      const actualTransactions = (data || []).filter(
        (transaction) =>
          !isLegacyAutomaticTransaction(transaction)
      );

      setTransactions(actualTransactions);
    } catch (err) {
      setError(
        err?.message || "Unable to load event jar transactions."
      );
    } finally {
      setLoading(false);
    }
  }, [event?.id, confirmedBookingIds]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setSelectedBookingId("");
    setSelectedProductId("");
    setQuantity("");
    setSelectedDate(today());
    setScreen("transactions");
    setError("");
    setSuccess("");
  }, [event?.id]);

  /* ---------------------------------------------
     Maps
  --------------------------------------------- */

  const bookingMap = useMemo(
    () =>
      new Map(
        confirmedBookings.map((booking) => [
          String(booking.id),
          booking,
        ])
      ),
    [confirmedBookings]
  );

  const productMap = useMemo(
    () =>
      new Map(
        products.map((product) => [
          String(product.id),
          product,
        ])
      ),
    [products]
  );

  /* ---------------------------------------------
     Actual transaction totals
  --------------------------------------------- */

  const deliveredTotal = useMemo(
    () =>
      transactions
        .filter((tx) => tx.movement_type === "delivered")
        .reduce(
          (sum, tx) => sum + Number(tx.quantity || 0),
          0
        ),
    [transactions]
  );

  const receivedTotal = useMemo(
    () =>
      transactions
        .filter((tx) => tx.movement_type === "returned")
        .reduce(
          (sum, tx) => sum + Number(tx.quantity || 0),
          0
        ),
    [transactions]
  );

  const unreceivedTotal = Math.max(
    0,
    deliveredTotal - receivedTotal
  );

  /* ---------------------------------------------
     Selected booking
  --------------------------------------------- */

  const selectedBooking = confirmedBookings.find(
    (booking) =>
      String(booking.id) === String(selectedBookingId)
  );

  /* ---------------------------------------------
     Planned returnable products
     Used only for product selection.
     Never counted as actual delivered jars.
  --------------------------------------------- */

  const selectedBookingItems = useMemo(() => {
    if (!selectedBooking) return [];

    return (selectedBooking.items || [])
      .map((item) => {
        const productId = getItemProductId(item);
        const product = productMap.get(productId);

        return {
          ...item,
          productId,
          product,
        };
      })
      .filter((item) => item.product?.is_returnable_jar);
  }, [selectedBooking, productMap]);

  /* ---------------------------------------------
     Confirmed bookings for selected date
  --------------------------------------------- */

  const selectedDatesBookings = useMemo(
    () =>
      confirmedBookings.filter(
        (booking) =>
          getBookingDate(booking) === selectedDate
      ),
    [confirmedBookings, selectedDate]
  );

  /* ---------------------------------------------
     Actual outstanding quantity per product
  --------------------------------------------- */

  const receivedEligibleItems = useMemo(() => {
    if (!selectedBooking) return [];

    return selectedBookingItems
      .map((item) => {
        const delivered = transactions
          .filter(
            (tx) =>
              String(tx.delivery_id) === String(selectedBooking.id) &&
              String(tx.product_id) === String(item.productId) &&
              tx.movement_type === "delivered"
          )
          .reduce(
            (sum, tx) => sum + Number(tx.quantity || 0),
            0
          );

        const received = transactions
          .filter(
            (tx) =>
              String(tx.delivery_id) === String(selectedBooking.id) &&
              String(tx.product_id) === String(item.productId) &&
              tx.movement_type === "returned"
          )
          .reduce(
            (sum, tx) => sum + Number(tx.quantity || 0),
            0
          );

        return {
          ...item,
          outstanding: Math.max(0, delivered - received),
        };
      })
      .filter((item) => item.outstanding > 0);
  }, [selectedBooking, selectedBookingItems, transactions]);

  /* ---------------------------------------------
     Transaction history
  --------------------------------------------- */

  const history = useMemo(
    () =>
      [...transactions].sort((a, b) => {
        const first = new Date(
          a.created_at || a.transaction_date
        ).getTime();

        const second = new Date(
          b.created_at || b.transaction_date
        ).getTime();

        return second - first;
      }),
    [transactions]
  );

  /* ---------------------------------------------
     Form actions
  --------------------------------------------- */

  function resetForm() {
    setSelectedBookingId("");
    setSelectedProductId("");
    setQuantity("");
    setError("");
    setSuccess("");
  }

  function openForm(type) {
    resetForm();
    setSelectedDate(today());
    setScreen(type);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedBooking) {
      setError("Please select a confirmed booking slot.");
      return;
    }

    if (!isConfirmed(selectedBooking)) {
      setError("Only confirmed bookings can have jar movements.");
      return;
    }

    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }

    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Please enter a valid whole jar quantity.");
      return;
    }

    const product = productMap.get(String(selectedProductId));

    if (!product?.is_returnable_jar) {
      setError("Please select a valid returnable jar product.");
      return;
    }

    const movementType =
      screen === "delivered" ? "delivered" : "returned";

    if (movementType === "returned") {
      const eligible = receivedEligibleItems.find(
        (item) =>
          String(item.productId) === String(selectedProductId)
      );

      if (!eligible || qty > eligible.outstanding) {
        setError(
          `Received quantity cannot exceed the outstanding ${
            eligible?.outstanding || 0
          } jars.`
        );
        return;
      }
    }

    setSaving(true);

    try {
      await deliveryService.addEventJarTransaction({
        deliveryId: selectedBooking.id,
        productId: selectedProductId,
        movementType,
        quantity: qty,

        // Delivered date follows the booking date.
        // Received date follows the selected transaction date.
        transactionDate:
          movementType === "delivered"
            ? getBookingDate(selectedBooking) || selectedDate
            : selectedDate,

        notes:
          movementType === "delivered"
            ? "Actual delivered jars recorded from event delivery section"
            : "Actual received jars recorded from event delivery section",
      });

      setSuccess(
        movementType === "delivered"
          ? "Actual delivered jar transaction saved successfully."
          : "Actual received jar transaction saved successfully."
      );

      window.dispatchEvent(
        new Event("amrit-jal-jars-updated")
      );

      await loadData();

      if (typeof onRefresh === "function") {
        await onRefresh();
      }

      resetForm();
      setScreen("transactions");
    } catch (err) {
      setError(
        err?.message || "Unable to save jar transaction."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------
     Header
  --------------------------------------------- */

  function renderHeader(title, subtitle) {
    return (
      <header className="flex items-center gap-4 bg-[#079FCB] px-4 py-5 text-white">
        <button
          type="button"
          onClick={() => {
            setScreen("transactions");
            resetForm();
          }}
          aria-label="Go back"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/80 transition hover:bg-white/10"
        >
          <ArrowLeft size={25} />
        </button>

        <div className="min-w-0">
          <h2 className="text-xl font-bold sm:text-2xl">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 truncate text-xs text-cyan-50">
              {subtitle}
            </p>
          )}
        </div>
      </header>
    );
  }

  /* ---------------------------------------------
     Booking selector
  --------------------------------------------- */

  function renderBookingSelect() {
    return (
      <Field label="Select a Confirmed Booking">
        <div className="relative">
          <select
            value={selectedBookingId}
            onChange={(e) => {
              const bookingId = e.target.value;
              const booking = confirmedBookings.find(
                (item) => String(item.id) === String(bookingId)
              );

              setSelectedBookingId(bookingId);
              setSelectedProductId("");
              setQuantity("");

              if (booking && getBookingDate(booking)) {
                setSelectedDate(getBookingDate(booking));
              }
            }}
            className={`${inputClass} appearance-none pr-10 font-semibold text-cyan-700`}
          >
            <option value="">Select booking slot</option>

            {confirmedBookings.map((booking) => (
              <option key={booking.id} value={booking.id}>
                {formatDate(getBookingDate(booking))} ·{" "}
                {booking.shift || "Booking"} ·{" "}
                {booking.customerName || "Customer"}
              </option>
            ))}
          </select>

          <ChevronDown
            size={20}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-700"
          />
        </div>
      </Field>
    );
  }

  /* ---------------------------------------------
     Product selector
  --------------------------------------------- */

  function renderProductSelect(items) {
    return (
      <Field label="Select Product">
        <div className="relative">
          <select
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              setQuantity("");
            }}
            className={`${inputClass} appearance-none pr-10`}
          >
            <option value="">Select product</option>

            {items.map((item) => (
              <option key={item.productId} value={item.productId}>
                {item.product?.name || "Jar product"}
              </option>
            ))}
          </select>

          <ChevronDown
            size={20}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-700"
          />
        </div>
      </Field>
    );
  }

  /* ---------------------------------------------
     Form footer
  --------------------------------------------- */

  function renderFormFooter() {
    return (
      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-white px-4 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={resetForm}
          disabled={saving}
          className="min-h-12 rounded-lg border-[3px] border-[#079FCB] bg-white text-sm font-bold text-[#079FCB] transition active:scale-[0.98] disabled:opacity-50"
        >
          Reset
        </button>

        <button
          type="submit"
          form="event-jar-transaction-form"
          disabled={saving}
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#079FCB] text-sm font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving && (
            <LoaderCircle size={18} className="animate-spin" />
          )}

          {saving ? "Saving..." : "Submit"}
        </button>
      </div>
    );
  }

  /* ---------------------------------------------
     Delivered / Received form
  --------------------------------------------- */

  if (screen === "delivered" || screen === "received") {
    const deliveredScreen = screen === "delivered";

    const availableProducts = deliveredScreen
      ? selectedBookingItems
      : receivedEligibleItems;

    return (
      <div className="min-h-[65dvh] overflow-hidden rounded-t-[24px] bg-white shadow-sm">
        {renderHeader(
          deliveredScreen ? "Add Delivered Jar" : "Add Received Jar",
          event?.eventName || event?.event_name || "Event jar transaction"
        )}

        <div className="bg-[#079FCB] px-4 pb-6">
          {deliveredScreen ? (
            renderBookingSelect()
          ) : (
            <Field label="Select Date">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedBookingId("");
                  setSelectedProductId("");
                  setQuantity("");
                }}
                className={`${inputClass} font-semibold text-cyan-700`}
              />
            </Field>
          )}
        </div>

        <form
          id="event-jar-transaction-form"
          onSubmit={handleSubmit}
          className="min-h-[55dvh] bg-white px-4 pb-5 pt-6"
        >
          {(error || parentError) && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700"
            >
              {error || parentError}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {!deliveredScreen && !selectedBookingId && (
            <div className="mb-5 space-y-3">
              {selectedDatesBookings.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl bg-rose-50 p-4 text-sm text-slate-700">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-600">
                    <Droplets size={25} />
                  </span>

                  No confirmed delivery found for this date.
                </div>
              ) : (
                <Field label="Select Confirmed Delivery Booking">
                  <div className="relative">
                    <select
                      value={selectedBookingId}
                      onChange={(e) => {
                        setSelectedBookingId(e.target.value);
                        setSelectedProductId("");
                        setQuantity("");
                      }}
                      className={`${inputClass} appearance-none pr-10`}
                    >
                      <option value="">Select delivery</option>

                      {selectedDatesBookings.map((booking) => (
                        <option key={booking.id} value={booking.id}>
                          {booking.customerName || "Customer"} ·{" "}
                          {booking.shift || "Booking"}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={20}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                    />
                  </div>
                </Field>
              )}
            </div>
          )}

          {selectedBookingId && selectedBooking && (
            <div className="space-y-5">
              <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">
                  Confirmed Booking
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  {selectedBooking.customerName || "Customer"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(getBookingDate(selectedBooking))} ·{" "}
                  {selectedBooking.shift || "Booking"}
                </p>
              </div>

              {availableProducts.length > 0 ? (
                renderProductSelect(availableProducts)
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                  {deliveredScreen
                    ? "No returnable jar products found in this booking."
                    : "No outstanding delivered jars are available to receive for this booking."}
                </div>
              )}

              {screen === "received" && selectedProductId && (
                <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                  Outstanding jars:{" "}
                  <strong>
                    {receivedEligibleItems.find(
                      (item) =>
                        String(item.productId) === String(selectedProductId)
                    )?.outstanding || 0}
                  </strong>
                </div>
              )}

              <Field label="Jar Quantity">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter jar quantity"
                  className={inputClass}
                  disabled={!selectedProductId}
                />
              </Field>

              <Field label="Transaction Date">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <EmptyIllustration />
          </div>
        </form>

        {renderFormFooter()}
      </div>
    );
  }

  /* ---------------------------------------------
     Main transaction screen
  --------------------------------------------- */

  return (
    <div className="relative min-h-[68dvh] overflow-hidden rounded-t-[24px] bg-white pb-28 shadow-sm">
      {renderHeader(
        "Event Jar Transactions",
        event?.eventName || event?.event_name || "Event delivery records"
      )}

      <div className="space-y-4 px-4 pt-5">
        {(error || parentError) && (
          <div
            role="alert"
            className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700"
          >
            {error || parentError}
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Actual transaction totals */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-cyan-50 p-3">
            <Truck size={18} className="text-cyan-600" />

            <p className="mt-2 text-[10px] font-semibold text-slate-500">
              Delivered
            </p>

            <p className="mt-1 text-lg font-bold text-slate-800">
              {deliveredTotal}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-3">
            <RotateCcw size={18} className="text-emerald-600" />

            <p className="mt-2 text-[10px] font-semibold text-slate-500">
              Received
            </p>

            <p className="mt-1 text-lg font-bold text-slate-800">
              {receivedTotal}
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 p-3">
            <Package size={18} className="text-amber-600" />

            <p className="mt-2 text-[10px] font-semibold text-slate-500">
              Unreceived
            </p>

            <p className="mt-1 text-lg font-bold text-slate-800">
              {unreceivedTotal}
            </p>
          </div>
        </div>

        {/* History heading */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <h3 className="text-sm font-bold text-slate-800">
            Transaction History
          </h3>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 disabled:opacity-50"
            aria-label="Refresh transactions"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>

        {/* History list */}
        {loading || bookingsLoading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500">
            <LoaderCircle size={19} className="animate-spin" />
            Loading transactions...
          </div>
        ) : history.length === 0 ? (
          <div className="py-5 text-center">
            <EmptyIllustration />

            <p className="mt-2 text-sm font-semibold text-slate-700">
              No Jar Transactions Found
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Booking confirmation does not record jar movement.
              Actual delivered and received jars will appear here
              after you record them.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((transaction) => {
              const delivered =
                transaction.movement_type === "delivered";

              const booking = bookingMap.get(
                String(transaction.delivery_id)
              );

              const product = productMap.get(
                String(transaction.product_id)
              );

              return (
                <article
                  key={transaction.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                >
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                      delivered
                        ? "bg-cyan-50 text-cyan-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {delivered ? (
                      <Truck size={21} />
                    ) : (
                      <RotateCcw size={21} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {product?.name || "Jar Product"}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {booking?.customerName || "Event Customer"}
                    </p>

                    <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                      <CalendarDays size={12} />
                      {formatDate(transaction.transaction_date)}
                    </p>

                    <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-slate-500">
                      <Clock3 size={12} />
                      Recorded: {formatDateTime(transaction.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        delivered
                          ? "text-cyan-700"
                          : "text-emerald-700"
                      }`}
                    >
                      {delivered ? "+" : "-"}
                      {Number(transaction.quantity || 0)}
                    </p>

                    <p className="mt-1 text-[10px] font-semibold text-slate-400">
                      {delivered ? "Delivered" : "Received"}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* No confirmed booking information */}
        {confirmedBookings.length === 0 && !bookingsLoading && (
          <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
            No confirmed bookings yet. Confirm a booking in the
            Booking tab before recording actual jar movements.
          </p>
        )}
      </div>

      {/* Actual movement actions */}
      <div className="fixed bottom-[calc(105px+env(safe-area-inset-bottom))] right-5 z-30 flex flex-col items-end gap-5 sm:absolute sm:bottom-8 sm:right-6">
        <ActionButton
          type="delivered"
          onClick={() => openForm("delivered")}
          disabled={confirmedBookings.length === 0}
        />

        <ActionButton
          type="received"
          onClick={() => openForm("received")}
          disabled={confirmedBookings.length === 0}
        />
      </div>

      <div className="pointer-events-none absolute bottom-5 left-5 hidden items-center gap-2 text-xs text-slate-400 sm:flex">
        <History size={15} />
        Event jar ledger
      </div>
    </div>
  );
}
