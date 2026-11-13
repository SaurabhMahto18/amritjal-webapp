
import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Info,
  Truck,
} from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
};

function QuantityControl({ value, onChange }) {
  const quantity = Number(value) || 0;

  return (
    <div className="inline-flex h-10 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        disabled={quantity <= 0}
        onClick={() => onChange(String(Math.max(0, quantity - 1)))}
        className="h-full w-9 bg-slate-50 text-slate-600 hover:bg-blue-50 disabled:opacity-40"
        aria-label="Decrease delivered quantity"
      >
        −
      </button>

      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full w-16 border-x border-slate-200 text-center text-sm outline-none"
        aria-label="Delivered quantity"
      />

      <button
        type="button"
        onClick={() => onChange(String(quantity + 1))}
        className="h-full w-9 bg-slate-50 text-slate-600 hover:bg-blue-50"
        aria-label="Increase delivered quantity"
      >
        +
      </button>
    </div>
  );
}

export default function OpeningDeliverySection({
  customer,
  assignments = [],
  isArchived = false,
  onSave,
  saving = false,
}) {
  const [deliveryDate, setDeliveryDate] = useState(today());
  const [shift, setShift] = useState("Morning");
  const [quantities, setQuantities] = useState({});
  const [showOtherProducts, setShowOtherProducts] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setQuantities({});
  }, [customer?.id]);

  const activeAssignments = assignments.filter(
    (item) => item.isActive !== false
  );

  function updateQuantity(productId, value) {
    setQuantities((previous) => ({
      ...previous,
      [productId]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (isArchived) {
      setError("Archived customers cannot be updated.");
      return;
    }

    if (!deliveryDate || deliveryDate > today()) {
      setError("Please select a valid past or current delivery date.");
      return;
    }

    for (const value of Object.values(quantities)) {
      if (
        value === "" ||
        !Number.isInteger(Number(value)) ||
        Number(value) < 0
      ) {
        setError("Please enter valid non-negative whole quantities.");
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

    onSave({
      customerId: customer?.id,
      deliveryDate,
      shift,
      products,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date */}
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-600">
          Select Date
        </span>

        <div className="relative">
          <CalendarDays
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="date"
            value={deliveryDate}
            max={today()}
            onChange={(event) => setDeliveryDate(event.target.value)}
            className={`${inputClass} pl-10`}
            disabled={isArchived}
            required
          />
        </div>
      </label>

      {/* Shift */}
      <div>
        <p className="mb-3 text-sm font-medium text-slate-600">
          Select Shift <span className="text-rose-500">*</span>
        </p>

        <div className="flex flex-wrap gap-2">
          {["Morning", "Afternoon", "Evening"].map((item) => (
            <button
              key={item}
              type="button"
              disabled={isArchived}
              onClick={() => setShift(item)}
              aria-pressed={shift === item}
              className={`min-h-10 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                shift === item
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-blue-300"
              } disabled:opacity-60`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200" />

      {/* Assigned Products */}
      {activeAssignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <Truck size={25} className="mx-auto text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            No assigned products found
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Assign products in Customer Products before entering opening
            delivery.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeAssignments.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 py-3"
            >
              <div>
                <p className="font-semibold text-slate-800">
                  {item.productName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Price Per Unit: ₹{Number(item.unitPrice || 0).toFixed(2)}
                </p>
              </div>

              <label className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Delivered</span>
                <QuantityControl
                  value={quantities[item.productId] ?? "0"}
                  onChange={(value) =>
                    updateQuantity(item.productId, value)
                  }
                />
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Other Products */}
      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => setShowOtherProducts((value) => !value)}
          aria-expanded={showOtherProducts}
          className="flex w-full items-center justify-between rounded-lg py-2 text-sm font-medium text-slate-600 hover:text-blue-700"
        >
          Other Products
          {showOtherProducts ? (
            <ChevronUp size={19} />
          ) : (
            <ChevronDown size={19} />
          )}
        </button>

        {showOtherProducts && (
          <p className="mt-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            Only assigned products are available here. Other product
            selection will be enabled after its service integration.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}

      {!isArchived && (
        <div className="flex justify-end border-t border-slate-200 pt-4">
          <button
            type="submit"
            disabled={saving || activeAssignments.length === 0}
            className="min-h-11 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Opening Delivery"}
          </button>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3">
        <Info size={17} className="mt-0.5 shrink-0 text-blue-600" />
        <p className="text-xs leading-5 text-blue-700">
          Opening delivery records represent previous deliveries. They
          should be stored separately from regular daily delivery entries
          to avoid duplicate billing.
        </p>
      </div>
    </form>
  );
}
