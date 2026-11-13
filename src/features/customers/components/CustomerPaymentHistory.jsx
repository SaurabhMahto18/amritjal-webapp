
import {
  Wallet,
  CalendarDays,
  IndianRupee,
  CreditCard,
  ReceiptText,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getAmount(payment) {
  return Number(
    payment.amount ??
    payment.payment_amount ??
    payment.paymentAmount ??
    0
  ) || 0;
}

function getPaymentDate(payment) {
  return (
    payment.payment_date ??
    payment.paymentDate ??
    payment.date ??
    payment.created_at ??
    payment.createdAt ??
    ""
  );
}

function getMethod(payment) {
  return (
    payment.payment_method ??
    payment.paymentMethod ??
    payment.method ??
    "Not specified"
  );
}

function SummaryCard({ title, value, icon: Icon, tone }) {
  const tones = {
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className={`flex size-9 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon size={18} />
        </span>
      </div>

      <p className="mt-3 break-words text-xl font-bold text-slate-900">
        {value}
      </p>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-5 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <Wallet size={27} />
      </div>

      <h3 className="mt-4 font-bold text-slate-900">
        No payment records
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        Payments recorded for this customer will appear here.
      </p>
    </div>
  );
}

export default function CustomerPaymentHistory({
  payments = [],
  loading = false,
  error = "",
  onRetry,
}) {
  const records = Array.isArray(payments) ? payments : [];

  const sortedPayments = [...records].sort((a, b) =>
    String(getPaymentDate(b)).localeCompare(String(getPaymentDate(a)))
  );

  const totalReceived = records.reduce(
    (sum, payment) => sum + getAmount(payment),
    0
  );

  const paymentMethods = new Set(
    records.map(getMethod).filter((method) => method !== "Not specified")
  );

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Wallet size={21} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Payment History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review recorded payments for this customer.
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        )}
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">
              Unable to load payment history
            </p>
            <p className="mt-1 leading-5">{error}</p>
          </div>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="shrink-0 font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          title="Payment Entries"
          value={records.length}
          icon={ReceiptText}
          tone="teal"
        />

        <SummaryCard
          title="Total Received"
          value={currency(totalReceived)}
          icon={IndianRupee}
          tone="emerald"
        />

        <SummaryCard
          title="Payment Methods"
          value={paymentMethods.size}
          icon={CreditCard}
          tone="blue"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <h3 className="font-bold text-slate-900">
            Payment Register
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {records.length} recorded{" "}
            {records.length === 1 ? "payment" : "payments"}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center px-5 py-12">
            <LoaderCircle
              size={28}
              className="animate-spin text-teal-700"
            />
            <p className="mt-3 text-sm font-medium text-slate-600">
              Loading payment records...
            </p>
          </div>
        ) : error && records.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            Payment records could not be displayed.
          </div>
        ) : records.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {sortedPayments.map((payment, index) => (
                <article
                  key={payment.id ?? `${getPaymentDate(payment)}-${index}`}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <Wallet size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {formatDate(getPaymentDate(payment))}
                        </p>
                        <p className="mt-1 break-words text-sm text-slate-500">
                          {getMethod(payment)}
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 font-bold text-emerald-700">
                      {currency(getAmount(payment))}
                    </p>
                  </div>

                  {(payment.reference_number ||
                    payment.referenceNumber ||
                    payment.transaction_id ||
                    payment.transactionId ||
                    payment.notes) && (
                    <div className="mt-3 rounded-xl bg-slate-50 p-3">
                      <p className="break-words text-xs leading-5 text-slate-500">
                        {payment.reference_number ??
                          payment.referenceNumber ??
                          payment.transaction_id ??
                          payment.transactionId ??
                          payment.notes}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[650px] text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-semibold">Payment Date</th>
                    <th className="px-5 py-4 font-semibold">Method</th>
                    <th className="px-5 py-4 font-semibold">Reference / Notes</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {sortedPayments.map((payment, index) => {
                    const reference =
                      payment.reference_number ??
                      payment.referenceNumber ??
                      payment.transaction_id ??
                      payment.transactionId ??
                      payment.notes ??
                      "—";

                    return (
                      <tr
                        key={payment.id ?? `${getPaymentDate(payment)}-${index}`}
                        className="transition hover:bg-emerald-50/30"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                            <CalendarDays
                              size={15}
                              className="text-slate-400"
                            />
                            {formatDate(getPaymentDate(payment))}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-medium text-slate-700">
                            <CreditCard size={14} />
                            {getMethod(payment)}
                          </span>
                        </td>

                        <td className="max-w-[260px] px-5 py-4 text-sm text-slate-500">
                          <span className="break-words">{reference}</span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-emerald-700">
                          {currency(getAmount(payment))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td
                      colSpan={3}
                      className="px-5 py-4 text-sm font-bold text-slate-800"
                    >
                      Total recorded payments
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-emerald-700">
                      {currency(totalReceived)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
        <p>
          Totals represent the payment records supplied to this component.
          Confirm the payment service's actual fields before using these
          figures for accounting.
        </p>
      </div>
    </section>
  );
}
