
import { useEffect, useState } from "react";
import { CalendarDays, Info, Wallet } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50";

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(value) {
  if (!value) return "Not selected";

  const [year, month] = value.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export default function OpeningAmountSection({
  customer,
  isArchived = false,
  onSave,
  saving = false,
}) {
  const [amountType, setAmountType] = useState("due");
  const [amount, setAmount] = useState(
    String(customer?.openingBalance ?? "0")
  );
  const [month, setMonth] = useState(getCurrentMonth());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setAmount(String(customer?.openingBalance ?? "0"));
  }, [customer?.id, customer?.openingBalance]);

  function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (isArchived) {
      setError("Archived customers cannot be updated.");
      return;
    }

    if (
      amount.trim() === "" ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) < 0
    ) {
      setError("Please enter a valid opening amount.");
      return;
    }

    if (!month) {
      setError("Please select a month.");
      return;
    }

    if (month > getCurrentMonth()) {
      setError("Future months cannot be selected.");
      return;
    }

    if (typeof onSave !== "function") {
      setError(
        "Opening amount saving is not connected to the customer service yet."
      );
      return;
    }

    onSave({
      customerId: customer?.id,
      amount: Number(amount),
      amountType,
      month,
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <button
          type="button"
          disabled={isArchived}
          onClick={() => setAmountType("advance")}
          aria-pressed={amountType === "advance"}
          className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
            amountType === "advance"
              ? "border-blue-500 bg-blue-50 text-slate-900"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span
            className={`flex size-5 items-center justify-center rounded-full border ${
              amountType === "advance"
                ? "border-blue-600"
                : "border-slate-300"
            }`}
          >
            {amountType === "advance" && (
              <span className="size-2.5 rounded-full bg-blue-600" />
            )}
          </span>
          Advance Amount
        </button>

        <button
          type="button"
          disabled={isArchived}
          onClick={() => setAmountType("due")}
          aria-pressed={amountType === "due"}
          className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
            amountType === "due"
              ? "border-blue-500 bg-blue-50 text-slate-900"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span
            className={`flex size-5 items-center justify-center rounded-full border ${
              amountType === "due"
                ? "border-blue-600"
                : "border-slate-300"
            }`}
          >
            {amountType === "due" && (
              <span className="size-2.5 rounded-full bg-blue-600" />
            )}
          </span>
          Due Before Pure Pani
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Amount <span className="text-rose-500">*</span>
            </span>

            <div className="relative">
              <Wallet
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className={`${inputClass} pl-10`}
                placeholder="Enter amount"
                disabled={isArchived}
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Month <span className="text-rose-500">*</span>
            </span>

            <div className="relative">
              <CalendarDays
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="month"
                value={month}
                max={getCurrentMonth()}
                onChange={(event) => setMonth(event.target.value)}
                className={`${inputClass} pl-10`}
                disabled={isArchived}
                required
              />
            </div>

            <p className="mt-1.5 text-xs text-slate-400">
              Selected: {formatMonth(month)}
            </p>
          </label>
        </div>

        {error && (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="text-sm text-emerald-600">
            {success}
          </p>
        )}

        {!isArchived && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Opening Amount"}
            </button>
          </div>
        )}
      </form>

      <div className="flex items-start gap-3 border-t border-slate-200 pt-4">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />

        <p className="text-sm leading-6 text-slate-500">
          Opening Amount is separate from Security Deposit. Advance Amount
          and Due Before Pure Pani must be accounted for separately in the
          customer ledger. Saving and ledger posting require backend
          integration.
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-medium text-slate-500">
          Currently saved Opening Balance
        </p>
        <p className="mt-1 text-xl font-bold text-slate-900">
          ₹{Number(customer?.openingBalance ?? 0).toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  );
}
