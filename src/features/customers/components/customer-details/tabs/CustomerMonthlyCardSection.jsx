
import { useMemo, useState } from "react";
import { CalendarDays, Search, RotateCcw } from "lucide-react";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const dateKey = (value) => String(value || "").slice(0, 10);

export default function CustomerMonthlyCardSection({
  customer,
  transactions = [],
  loading = false,
  error = "",
}) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [order, setOrder] = useState("asc");
  const [appliedMonth, setAppliedMonth] = useState(month);

  const days = useMemo(() => {
    if (!appliedMonth) return [];

    const [year, monthNumber] = appliedMonth.split("-").map(Number);
    const count = new Date(year, monthNumber, 0).getDate();

    return Array.from({ length: count }, (_, index) => {
      const date = `${year}-${String(monthNumber).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`;

      const entries = transactions.filter(
        (item) => dateKey(item.date || item.deliveryDate || item.delivery_date) === date
      );

      return {
        date,
        entries,
      };
    });
  }, [appliedMonth, transactions]);

  const orderedDays = useMemo(
    () => (order === "asc" ? days : [...days].reverse()),
    [days, order]
  );

  const getValue = (item, ...keys) => {
    for (const key of keys) {
      if (item[key] !== undefined && item[key] !== null) {
        return item[key];
      }
    }
    return 0;
  };

  const reset = () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setMonth(currentMonth);
    setAppliedMonth(currentMonth);
    setOrder("asc");
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end">
        <div className="w-full md:max-w-[220px]">
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Order
          </label>
          <select
            value={order}
            onChange={(event) => setOrder(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <div className="w-full md:max-w-[280px]">
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Month
          </label>
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
          />
        </div>

        <div className="flex gap-2 md:ml-auto">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            type="button"
            onClick={() => setAppliedMonth(month)}
            disabled={!month}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Search size={16} />
            Search
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 font-semibold text-white">
              {(customer?.name || "C").charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                {customer?.name || "Customer"}
              </h3>
              <p className="text-sm text-slate-400">
                {customer?.area || customer?.address || "Customer"}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-blue-600">
            <CalendarDays size={16} />
            {appliedMonth}
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[minmax(180px,2fr)_repeat(4,minmax(65px,0.6fr))] gap-2 bg-slate-100 px-4 py-4 text-xs font-medium text-slate-600 sm:text-sm">
            <span>Shift &amp; Product</span>
            <span className="text-center">Del.</span>
            <span className="text-center">Rec.</span>
            <span className="text-center">Bal.</span>
            <span className="text-center">Time</span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Loading monthly transactions...
            </div>
          ) : error ? (
            <div className="p-10 text-center text-sm text-red-500">{error}</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {orderedDays.map(({ date, entries }) => (
                <div key={date}>
                  <div className="bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
                    {formatDate(date)}
                  </div>

                  {entries.length === 0 ? (
                    <div className="px-4 py-7 text-center text-sm text-slate-400">
                      No transaction
                    </div>
                  ) : (
                    entries.map((item, index) => {
                      const delivered = Number(
                        getValue(item, "delivered", "deliveredQty", "delivered_qty")
                      );
                      const received = Number(
                        getValue(item, "received", "receivedQty", "received_qty")
                      );
                      const balance = getValue(
                        item,
                        "balance",
                        "balanceQty",
                        "balance_qty"
                      );

                      return (
                        <div
                          key={item.id || `${date}-${index}`}
                          className="grid grid-cols-[minmax(180px,2fr)_repeat(4,minmax(65px,0.6fr))] items-center gap-2 px-4 py-4 text-xs text-slate-700 sm:text-sm"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {item.shift || "Regular"}
                            </p>
                            <p className="mt-1 text-slate-500">
                              {item.productName || item.product_name || item.product?.name || "Product"}
                            </p>
                          </div>
                          <span className="text-center">{delivered}</span>
                          <span className="text-center">{received}</span>
                          <span className="text-center">{balance}</span>
                          <span className="text-center text-slate-500">
                            {item.time || "—"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
