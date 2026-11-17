
import { memo, useEffect, useState } from "react";
import {
  CalendarDays,
  Info,
  ShieldCheck,
  Wallet,
  IndianRupee,
  FileText,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  LockKeyhole,
  Save,
} from "lucide-react";

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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

const inputClass =
  "h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

function SecurityDepositSection({
  customer,
  isArchived = false,
  onSave,
  saving = false,
}) {
  const [amount, setAmount] = useState(
    String(customer?.securityDeposit ?? 0)
  );

  const [receivedDate, setReceivedDate] = useState(getToday);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentDeposit = Number(customer?.securityDeposit) || 0;

  useEffect(() => {
    setAmount(String(customer?.securityDeposit ?? 0));
    setError("");
    setSuccess("");
  }, [customer?.id, customer?.securityDeposit]);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function handleAmountChange(event) {
    setAmount(event.target.value);
    clearMessages();
  }

  function handleDateChange(event) {
    setReceivedDate(event.target.value);
    clearMessages();
  }

  function handleDescriptionChange(event) {
    setDescription(event.target.value);
    clearMessages();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessages();

    if (isArchived) {
      setError("Archived customers cannot be updated.");
      return;
    }

    if (!customer?.id) {
      setError("Customer information is unavailable.");
      return;
    }

    const depositAmount = Number(amount);

    if (
      amount.trim() === "" ||
      !Number.isFinite(depositAmount) ||
      depositAmount < 0
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

    try {
      await onSave({
        customerId: customer.id,
        securityDeposit: depositAmount,
        receivedDate,
        description: description.trim(),
      });

      setSuccess("Security deposit saved successfully.");
    } catch (err) {
      setError(
        err?.message || "Unable to save security deposit."
      );
    }
  }

  return (
    <section
      aria-labelledby="security-deposit-title"
      className="w-full min-w-0 space-y-4 sm:space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <ShieldCheck size={22} aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h2
              id="security-deposit-title"
              className="text-base font-bold text-slate-900 sm:text-lg"
            >
              Security Deposit
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Manage customer deposit records.
            </p>
          </div>
        </div>

        {isArchived && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700">
            Archived
          </span>
        )}
      </div>

      {/* Current Deposit Summary */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-100 bg-teal-50/70 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                Current Security Deposit
              </p>

              <LockKeyhole
                size={13}
                className="text-teal-600"
                aria-hidden="true"
              />
            </div>

            <p className="mt-2 break-all text-2xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-3xl">
              {formatMoney(currentDeposit)}
            </p>

            <p className="mt-1 text-xs text-teal-800">
              Recorded customer deposit
            </p>
          </div>

          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm sm:size-14">
            <Wallet size={24} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Deposit Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:space-y-5 sm:p-5"
      >
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Deposit Entry
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Enter the security deposit amount and receipt details.
          </p>
        </div>

        {/* Amount */}
        <label className="block min-w-0">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Security Deposit Amount
            <span className="ml-1 text-rose-500">*</span>
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
              placeholder="Enter deposit amount"
              disabled={isArchived || saving}
              required
            />
          </div>

          <p className="mt-1.5 text-xs text-slate-500">
            Enter the applicable security deposit amount.
          </p>
        </label>

        {/* Date */}
        <label className="block min-w-0">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Deposit Received Date
            <span className="ml-1 text-rose-500">*</span>
          </span>

          <div className="relative">
            <CalendarDays
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="date"
              value={receivedDate}
              max={getToday()}
              onChange={handleDateChange}
              className={`${inputClass} pl-10`}
              disabled={isArchived || saving}
              required
            />
          </div>
        </label>

        {/* Description */}
        <label className="block min-w-0">
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileText
              size={16}
              className="text-slate-400"
              aria-hidden="true"
            />
            Description / Remarks
            <span className="text-xs font-normal text-slate-400">
              (Optional)
            </span>
          </span>

          <textarea
            rows={4}
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Enter deposit details, receipt number or remarks..."
            className="min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 disabled:cursor-not-allowed disabled:bg-slate-50"
            disabled={isArchived || saving}
          />
        </label>

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

        {/* Save Button */}
        {!isArchived && (
          <div className="sticky bottom-0 z-10 -mx-3.5 border-t border-slate-200 bg-white/95 px-3.5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-56"
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
                  <Save size={17} aria-hidden="true" />
                  Save Security Deposit
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* Accounting Information */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3.5 sm:p-4">
        <Info
          size={19}
          className="mt-0.5 shrink-0 text-amber-700"
          aria-hidden="true"
        />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Separate Accounting Treatment
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-800 sm:text-sm">
            Security Deposit is a separate customer liability. It
            must not automatically reduce Opening Balance, outstanding
            dues, delivery revenue or invoice totals.
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
          This customer is archived. Security deposit editing is disabled.
        </div>
      )}
    </section>
  );
}

export default memo(SecurityDepositSection);
