
import { memo, useEffect, useState } from "react";
import {
  CalendarDays,
  Info,
  Wallet,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  IndianRupee,
  ArrowUpCircle,
  ArrowDownCircle,
  ShieldCheck,
} from "lucide-react";

const inputClass =
  "h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(value) {
  if (!value) return "Not selected";

  const [year, month] = value.split("-").map(Number);

  if (!year || !month || month < 1 || month > 12) {
    return "Invalid month";
  }

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function AmountTypeOption({
  selected,
  disabled,
  onClick,
  icon: Icon,
  title,
  description,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-[76px] min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition active:scale-[0.99] sm:p-4 ${
        selected
          ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/10"
          : "border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          selected
            ? "bg-teal-100 text-teal-700"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon size={20} aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-800">
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>

      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
          selected
            ? "border-teal-600 bg-teal-600"
            : "border-slate-300 bg-white"
        }`}
      >
        {selected && (
          <span className="size-2 rounded-full bg-white" />
        )}
      </span>
    </button>
  );
}

function OpeningAmountSection({
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

  const currentMonth = getCurrentMonth();

  useEffect(() => {
    setAmount(String(customer?.openingBalance ?? "0"));
    setError("");
    setSuccess("");
  }, [customer?.id, customer?.openingBalance]);

  function handleAmountChange(event) {
    setAmount(event.target.value);
    setError("");
    setSuccess("");
  }

  function handleMonthChange(event) {
    setMonth(event.target.value);
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

    if (month > currentMonth) {
      setError("Future months cannot be selected.");
      return;
    }

    if (typeof onSave !== "function") {
      setError(
        "Opening amount saving is not connected to the customer service yet."
      );
      return;
    }

    try {
      await onSave({
        customerId: customer.id,
        amount: Number(amount),
        amountType,
        month,
      });

      setSuccess("Opening amount saved successfully.");
    } catch (err) {
      setError(
        err?.message || "Unable to save opening amount."
      );
    }
  }

  const formattedSavedAmount = formatAmount(
    customer?.openingBalance
  );

  return (
    <section
      aria-labelledby="opening-amount-title"
      className="w-full min-w-0 space-y-4 sm:space-y-5"
    >
      {/* Header */}
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="opening-amount-title"
            className="text-base font-bold text-[#102C46] sm:text-lg"
          >
            Opening Amount
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            Manage the customer's starting balance.
          </p>
        </div>

        {isArchived && (
          <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            Archived
          </span>
        )}
      </div>

      {/* Saved Balance */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">
              Currently Saved Opening Balance
            </p>

            <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              ₹{formattedSavedAmount}
            </p>
          </div>

          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Wallet size={21} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Amount Type */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-5">
        <fieldset disabled={isArchived || saving}>
          <legend className="mb-3 text-sm font-semibold text-slate-800">
            Select Opening Amount Type
          </legend>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <AmountTypeOption
              selected={amountType === "advance"}
              disabled={isArchived || saving}
              onClick={() => {
                setAmountType("advance");
                setError("");
                setSuccess("");
              }}
              icon={ArrowUpCircle}
              title="Advance Amount"
              description="Amount already paid by the customer"
            />

            <AmountTypeOption
              selected={amountType === "due"}
              disabled={isArchived || saving}
              onClick={() => {
                setAmountType("due");
                setError("");
                setSuccess("");
              }}
              icon={ArrowDownCircle}
              title="Due Before Pure Pani"
              description="Previous outstanding customer balance"
            />
          </div>
        </fieldset>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:space-y-5 sm:p-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {/* Amount */}
          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Amount <span className="text-rose-500">*</span>
            </span>

            <div className="relative">
              <IndianRupee
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                className={`${inputClass} pl-10`}
                placeholder="Enter amount"
                disabled={isArchived || saving}
                required
              />
            </div>
          </label>

          {/* Month */}
          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Applicable Month <span className="text-rose-500">*</span>
            </span>

            <div className="relative">
              <CalendarDays
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="month"
                value={month}
                max={currentMonth}
                onChange={handleMonthChange}
                className={`${inputClass} pl-10`}
                disabled={isArchived || saving}
                required
              />
            </div>

            <p className="mt-1.5 text-xs text-slate-500">
              Selected:{" "}
              <span className="font-semibold text-slate-700">
                {formatMonth(month)}
              </span>
            </p>
          </label>
        </div>

        {/* Messages */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
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
            className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
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
          <div className="border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-52"
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
                  <CheckCircle2 size={17} aria-hidden="true" />
                  Save Opening Amount
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* Information */}
      <div className="flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50/70 p-3.5 sm:p-4">
        <Info
          size={19}
          className="mt-0.5 shrink-0 text-teal-700"
          aria-hidden="true"
        />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-teal-900">
            Important Information
          </p>

          <p className="mt-1 text-xs leading-5 text-teal-800 sm:text-sm">
            Opening Amount is separate from Security Deposit.
            Advance Amount and Due Before Pure Pani must be
            accounted for separately in the customer ledger.
            Saving and ledger posting depend on backend integration.
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
          This customer is archived. Opening amount editing is disabled.
        </div>
      )}
    </section>
  );
}

export default memo(OpeningAmountSection);
