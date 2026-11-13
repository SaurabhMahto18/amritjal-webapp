
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Info,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50";

function getToday() {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export default function SecurityDepositSection({
  customer,
  isArchived = false,
  onSave,
  saving = false,
}) {
  const [amount, setAmount] = useState(
    String(customer?.securityDeposit ?? 0)
  );
  const [receivedDate, setReceivedDate] = useState(getToday());
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setAmount(String(customer?.securityDeposit ?? 0));
  }, [customer?.id, customer?.securityDeposit]);

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
      setError("Please enter a valid non-negative deposit amount.");
      return;
    }

    if (!receivedDate || receivedDate > getToday()) {
      setError("Please select a valid deposit received date.");
      return;
    }

    if (typeof onSave !== "function") {
      setError(
        "Security deposit update is not connected to the customer service yet."
      );
      return;
    }

    onSave({
      customerId: customer?.id,
      securityDeposit: Number(amount),
      receivedDate,
      description: description.trim(),
    });
  }

  return (
    <div className="space-y-5">
      {/* Current Deposit */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white text-blue-600">
            <ShieldCheck size={21} />
          </div>

          <div>
            <p className="text-sm font-medium text-blue-800">
              Current Security Deposit
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatMoney(customer?.securityDeposit)}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Received Date */}
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Deposit Received Date
            </span>

            <div className="relative">
              <CalendarDays
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="date"
                value={receivedDate}
                max={getToday()}
                onChange={(event) =>
                  setReceivedDate(event.target.value)
                }
                className={`${inputClass} pl-10`}
                disabled={isArchived}
                required
              />
            </div>
          </label>

          {/* Deposit Amount */}
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Security Deposit Amount (₹)
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
                placeholder="Enter deposit amount"
                disabled={isArchived}
                required
              />
            </div>
          </label>
        </div>

        {/* Description */}
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">
            Description / Remarks
          </span>

          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Enter deposit details or remarks..."
            className={inputClass}
            disabled={isArchived}
          />
        </label>

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
          <div className="flex justify-end border-t border-slate-200 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Security Deposit"}
            </button>
          </div>
        )}
      </form>

      {/* Accounting Note */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-amber-700" />

        <p className="text-xs leading-5 text-amber-800">
          Security Deposit is a separate customer liability. It must not
          automatically reduce Opening Balance, outstanding dues, delivery
          revenue or invoice totals.
        </p>
      </div>
    </div>
  );
}
