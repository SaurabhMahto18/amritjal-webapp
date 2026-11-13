
import {
  Droplets,
  CalendarDays,
  IndianRupee,
  ClipboardList,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  PackageCheck,
} from "lucide-react";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function SummaryCard({ label, value, icon: Icon, tone }) {
  const styles = {
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex size-9 items-center justify-center rounded-lg ${styles[tone]}`}>
          <Icon size={18} />
        </span>
      </div>

      <p className="mt-3 break-words text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-5 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <PackageCheck size={26} />
      </div>

      <h3 className="mt-4 font-bold text-slate-900">No deliveries yet</h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        Delivery records for this customer will appear here once they are
        recorded.
      </p>
    </div>
  );
}

/**
 * Customer delivery history.
 *
 * Supported props:
 * - deliveries: array of delivery records
 * - loading: loading indicator
 * - error: optional error message
 * - onRetry: optional retry callback
 */
export default function CustomerDeliveryHistory({
  deliveries = [],
  loading = false,
  error = "",
  onRetry,
}) {
  const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];

  const totalJars = safeDeliveries.reduce(
    (total, item) => total + (Number(item.jar_quantity ?? item.jarQuantity) || 0),
    0
  );

  const totalAmount = safeDeliveries.reduce(
    (total, item) => total + (Number(item.amount) || 0),
    0
  );

  const sortedDeliveries = [...safeDeliveries].sort((a, b) => {
    const dateA = String(a.delivery_date ?? a.date ?? "");
    const dateB = String(b.delivery_date ?? b.date ?? "");
    return dateB.localeCompare(dateA);
  });

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Droplets size={21} />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Delivery History
            </h2>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Review this customer's recorded deliveries and amounts.
          </p>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
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
            <p className="font-semibold">Unable to load delivery history</p>
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
          label="Total Deliveries"
          value={safeDeliveries.length}
          icon={ClipboardList}
          tone="teal"
        />

        <SummaryCard
          label="Total Jars"
          value={totalJars}
          icon={Droplets}
          tone="blue"
        />

        <SummaryCard
          label="Delivery Amount"
          value={currency(totalAmount)}
          icon={IndianRupee}
          tone="amber"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <h3 className="font-bold text-slate-900">Delivery Register</h3>
            <p className="mt-1 text-xs text-slate-500">
              {safeDeliveries.length} recorded{" "}
              {safeDeliveries.length === 1 ? "entry" : "entries"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center px-5 py-12">
            <LoaderCircle size={28} className="animate-spin text-teal-700" />
            <p className="mt-3 text-sm font-medium text-slate-600">
              Loading delivery records...
            </p>
          </div>
        ) : error && safeDeliveries.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            Delivery records could not be displayed.
          </div>
        ) : safeDeliveries.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Mobile view */}
            <div className="divide-y divide-slate-100 md:hidden">
              {sortedDeliveries.map((delivery, index) => {
                const quantity = Number(
                  delivery.jar_quantity ?? delivery.jarQuantity
                ) || 0;

                const rate = Number(
                  delivery.jar_rate ?? delivery.jarRate
                ) || 0;

                const amount =
                  delivery.amount != null
                    ? Number(delivery.amount) || 0
                    : quantity * rate;

                return (
                  <article
                    key={delivery.id ?? `${delivery.delivery_date ?? delivery.date}-${index}`}
                    className="p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                          <Droplets size={19} />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {formatDate(delivery.delivery_date ?? delivery.date)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {quantity} {quantity === 1 ? "jar" : "jars"} delivered
                          </p>
                        </div>
                      </div>

                      <p className="shrink-0 font-bold text-slate-900">
                        {currency(amount)}
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                      <div>
                        <p className="text-xs text-slate-500">Price per jar</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {currency(rate)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Quantity</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {quantity}
                        </p>
                      </div>
                    </div>

                    {delivery.notes && (
                      <p className="mt-3 break-words text-sm leading-5 text-slate-500">
                        {delivery.notes}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>

            {/* Desktop view */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[650px] text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Jar Quantity</th>
                    <th className="px-5 py-4 font-semibold">Rate / Jar</th>
                    <th className="px-5 py-4 font-semibold">Amount</th>
                    <th className="px-5 py-4 font-semibold">Notes</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {sortedDeliveries.map((delivery, index) => {
                    const quantity = Number(
                      delivery.jar_quantity ?? delivery.jarQuantity
                    ) || 0;

                    const rate = Number(
                      delivery.jar_rate ?? delivery.jarRate
                    ) || 0;

                    const amount =
                      delivery.amount != null
                        ? Number(delivery.amount) || 0
                        : quantity * rate;

                    return (
                      <tr
                        key={delivery.id ?? `${delivery.delivery_date ?? delivery.date}-${index}`}
                        className="transition hover:bg-teal-50/30"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                            <CalendarDays size={15} className="text-slate-400" />
                            {formatDate(delivery.delivery_date ?? delivery.date)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-2.5 py-1.5 text-sm font-semibold text-teal-800">
                            <Droplets size={14} />
                            {quantity}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {currency(rate)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-900">
                          {currency(amount)}
                        </td>

                        <td className="max-w-[240px] px-5 py-4 text-sm text-slate-500">
                          <span className="break-words">
                            {delivery.notes || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td className="px-5 py-4 text-sm font-bold text-slate-800">
                      Total
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-teal-800">
                      {totalJars} jars
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">—</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-900">
                      {currency(totalAmount)}
                    </td>
                    <td className="px-5 py-4">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
