
import { memo, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Info,
  Truck,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Package,
  Plus,
  Minus,
  Clock3,
  ShieldCheck,
} from "lucide-react";

function getToday() {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
}

const SHIFTS = ["Morning", "Afternoon", "Evening"];

const inputClass =
  "h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 disabled:cursor-not-allowed disabled:bg-slate-50";

function QuantityControl({
  value,
  onChange,
  disabled = false,
}) {
  const quantity = Number(value) || 0;

  function decrease() {
    onChange(String(Math.max(0, quantity - 1)));
  }

  function increase() {
    onChange(String(quantity + 1));
  }

  return (
    <div className="flex h-11 w-full max-w-36 items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        disabled={disabled || quantity <= 0}
        onClick={decrease}
        className="flex h-full w-10 shrink-0 items-center justify-center bg-slate-50 text-slate-600 transition hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Decrease delivered quantity"
      >
        <Minus size={15} aria-hidden="true" />
      </button>

      <input
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-full min-w-0 flex-1 border-x border-slate-200 text-center text-sm font-semibold text-slate-800 outline-none disabled:bg-slate-50"
        aria-label="Delivered quantity"
      />

      <button
        type="button"
        disabled={disabled}
        onClick={increase}
        className="flex h-full w-10 shrink-0 items-center justify-center bg-slate-50 text-slate-600 transition hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Increase delivered quantity"
      >
        <Plus size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

function ProductCard({
  item,
  quantity,
  onQuantityChange,
  disabled,
}) {
  const price = Number(item.unitPrice || 0);
  const selectedQuantity = Number(quantity) || 0;

  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-teal-200 sm:p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <Package size={19} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="break-words text-sm font-bold text-slate-800">
            {item.productName || "Unnamed Product"}
          </h4>

          <p className="mt-1 text-xs text-slate-500">
            Price per unit: ₹{price.toFixed(2)}
          </p>
        </div>

        {selectedQuantity > 0 && (
          <span className="shrink-0 rounded-full bg-teal-50 px-2 py-1 text-[10px] font-bold text-teal-700">
            Added
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Delivered Quantity
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Enter units delivered
          </p>
        </div>

        <QuantityControl
          value={quantity}
          onChange={onQuantityChange}
          disabled={disabled}
        />
      </div>
    </article>
  );
}

function OpeningDeliverySection({
  customer,
  assignments = [],
  isArchived = false,
  onSave,
  saving = false,
}) {
  const [deliveryDate, setDeliveryDate] = useState(getToday);
  const [shift, setShift] = useState("Morning");
  const [quantities, setQuantities] = useState({});
  const [showOtherProducts, setShowOtherProducts] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentDate = getToday();

  useEffect(() => {
    setQuantities({});
    setError("");
    setSuccess("");
  }, [customer?.id]);

  const activeAssignments = useMemo(
    () =>
      assignments.filter((item) => item.isActive !== false),
    [assignments]
  );

  const totalQuantity = useMemo(
    () =>
      activeAssignments.reduce(
        (total, item) =>
          total + (Number(quantities[item.productId]) || 0),
        0
      ),
    [activeAssignments, quantities]
  );

  const selectedProductsCount = useMemo(
    () =>
      activeAssignments.filter(
        (item) => Number(quantities[item.productId] || 0) > 0
      ).length,
    [activeAssignments, quantities]
  );

  function updateQuantity(productId, value) {
    setQuantities((previous) => ({
      ...previous,
      [productId]: value,
    }));

    setError("");
    setSuccess("");
  }

  function handleDateChange(event) {
    setDeliveryDate(event.target.value);
    setError("");
    setSuccess("");
  }

  function handleShiftChange(value) {
    setShift(value);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (isArchived) {
      setError("Archived customers cannot be updated.");
      return;
    }

    if (!customer?.id) {
      setError("Customer information is unavailable.");
      return;
    }

    if (!deliveryDate || deliveryDate > currentDate) {
      setError("Please select a valid past or current delivery date.");
      return;
    }

    if (!SHIFTS.includes(shift)) {
      setError("Please select a valid delivery shift.");
      return;
    }

    for (const item of activeAssignments) {
      const value = quantities[item.productId] ?? "0";

      if (
        value === "" ||
        !Number.isInteger(Number(value)) ||
        Number(value) < 0
      ) {
        setError(
          `Please enter a valid whole quantity for ${item.productName}.`
        );
        return;
      }
    }

    if (typeof onSave !== "function") {
      setError(
        "Opening delivery saving is not connected to the delivery service yet."
      );
      return;
    }

    const products = activeAssignments
      .filter((item) => Number(quantities[item.productId] || 0) > 0)
      .map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: Number(quantities[item.productId]),
      }));

    if (products.length === 0) {
      setError("Enter a delivered quantity for at least one product.");
      return;
    }

    try {
      await onSave({
        customerId: customer.id,
        deliveryDate,
        shift,
        products,
      });

      setSuccess("Opening delivery saved successfully.");
      setQuantities({});
    } catch (err) {
      setError(
        err?.message || "Unable to save opening delivery."
      );
    }
  }

  return (
    <section className="w-full min-w-0 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Truck size={22} aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Opening Delivery
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Record previous customer deliveries.
            </p>
          </div>
        </div>

        {isArchived && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700">
            Archived
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Date and Shift */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays
              size={18}
              className="text-teal-700"
              aria-hidden="true"
            />

            <h3 className="text-sm font-bold text-slate-800">
              Delivery Schedule
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {/* Date */}
            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Select Date
              </span>

              <input
                type="date"
                value={deliveryDate}
                max={currentDate}
                onChange={handleDateChange}
                className={inputClass}
                disabled={isArchived || saving}
                required
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Future dates are not allowed.
              </p>
            </label>

            {/* Shift */}
            <fieldset
              disabled={isArchived || saving}
              className="min-w-0"
            >
              <legend className="mb-2 block text-sm font-semibold text-slate-700">
                Select Shift
                <span className="ml-1 text-rose-500">*</span>
              </legend>

              <div className="grid grid-cols-3 gap-2">
                {SHIFTS.map((item) => {
                  const selected = shift === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => handleShiftChange(item)}
                      className={`flex min-h-11 items-center justify-center rounded-xl border px-2 py-2 text-xs font-semibold transition active:scale-[0.98] sm:text-sm ${
                        selected
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </section>

        {/* Product Summary */}
        {activeAssignments.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
              <p className="text-xs text-slate-500">
                Assigned Products
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                {activeAssignments.length}
              </p>
            </div>

            <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3.5 sm:p-4">
              <p className="text-xs text-teal-700">
                Total Quantity
              </p>

              <p className="mt-1 text-xl font-bold text-teal-800 tabular-nums">
                {totalQuantity}
              </p>
            </div>
          </div>
        )}

        {/* Assigned Products */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package
                size={18}
                className="text-teal-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-bold text-slate-800">
                Assigned Products
              </h3>
            </div>

            {activeAssignments.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {selectedProductsCount} Selected
              </span>
            )}
          </div>

          {activeAssignments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
              <Truck
                size={28}
                className="mx-auto text-slate-400"
                aria-hidden="true"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No Assigned Products
              </p>

              <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">
                Assign products in Customer Products before entering
                opening delivery.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {activeAssignments.map((item) => (
                <ProductCard
                  key={item.id || item.productId}
                  item={item}
                  quantity={quantities[item.productId] ?? "0"}
                  onQuantityChange={(value) =>
                    updateQuantity(item.productId, value)
                  }
                  disabled={isArchived || saving}
                />
              ))}
            </div>
          )}
        </section>

        {/* Other Products */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() =>
              setShowOtherProducts((value) => !value)
            }
            aria-expanded={showOtherProducts}
            className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Package
                size={17}
                className="shrink-0 text-slate-500"
                aria-hidden="true"
              />
              Other Products
            </span>

            {showOtherProducts ? (
              <ChevronUp size={18} className="shrink-0" />
            ) : (
              <ChevronDown size={18} className="shrink-0" />
            )}
          </button>

          {showOtherProducts && (
            <div className="border-t border-slate-100 bg-slate-50 p-4">
              <p className="text-xs leading-5 text-slate-500">
                Only assigned products are available here. Other
                product selection will be enabled after its service
                integration.
              </p>
            </div>
          )}
        </section>

        {/* Messages */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="min-w-0 leading-5">{error}</p>
          </div>
        )}

        {success && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700"
          >
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="min-w-0 leading-5">{success}</p>
          </div>
        )}

        {/* Save */}
        {!isArchived && (
          <div className="sticky bottom-0 z-10 -mx-1 border-t border-slate-200 bg-white/95 px-1 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
            <button
              type="submit"
              disabled={saving || activeAssignments.length === 0}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-56"
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Truck size={17} aria-hidden="true" />
                  Save Opening Delivery
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* Information */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3.5 sm:p-4">
        <Info
          size={19}
          className="mt-0.5 shrink-0 text-blue-700"
          aria-hidden="true"
        />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-blue-900">
            Important Information
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-800 sm:text-sm">
            Opening delivery records represent previous deliveries.
            They should be stored separately from regular daily
            delivery entries to avoid duplicate billing.
          </p>
        </div>
      </div>

      {isArchived && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          <ShieldCheck
            size={17}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          This customer is archived. Opening delivery editing is disabled.
        </div>
      )}
    </section>
  );
}

export default memo(OpeningDeliverySection);
