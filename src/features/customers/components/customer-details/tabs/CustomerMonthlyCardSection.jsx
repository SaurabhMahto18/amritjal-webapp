import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Check,
  RotateCcw,
} from "lucide-react";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
};

const dateKey = (value) => String(value || "").slice(0, 10);

const shiftMonth = (value, amount) => {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonth = (value) => {
  if (!value) return "Select month";
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

export default function CustomerMonthlyCardSection({
  customer,
  transactions = [],
  loading = false,
  error = "",
  onAddDelivery,
  onEditDelivery,
  isArchived = false,
}) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [appliedMonth, setAppliedMonth] = useState(month);
  const [expandedDates, setExpandedDates] = useState(() => new Set());

  const normalizedTransactions = useMemo(() => {
    const rows = [];
    (Array.isArray(transactions) ? transactions : []).forEach((record) => {
      const recordDate = record.date || record.deliveryDate || record.delivery_date;
      if (Array.isArray(record.items) && record.items.length) {
        record.items.forEach((item, index) => {
          const delivered = Number(item.quantity ?? item.delivered ?? item.deliveredQty ?? 0);
          const received = Number(item.returned ?? item.received ?? item.receivedQty ?? 0);
          rows.push({
            ...item,
            id: item.id || `${record.id || recordDate}-${item.productId || index}`,
            deliveryId: record.id,
            date: recordDate,
            shift: record.shift || item.shift || "Regular",
            time: record.time || item.time || record.shift || "—",
            delivered,
            received,
            balance: item.balance ?? delivered - received,
            productName: item.productName || item.product_name || item.product?.name || "Product",
          });
        });
      } else {
        rows.push(record);
      }
    });
    return rows;
  }, [transactions]);

  const days = useMemo(() => {
    if (!appliedMonth) return [];
    const [year, monthNumber] = appliedMonth.split("-").map(Number);
    const count = new Date(year, monthNumber, 0).getDate();

    return Array.from({ length: count }, (_, index) => {
      const date = `${year}-${String(monthNumber).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`;
      const entries = normalizedTransactions.filter(
        (item) => dateKey(item.date || item.deliveryDate || item.delivery_date) === date
      );
      return { date, entries };
    });
  }, [appliedMonth, normalizedTransactions]);

  const productSummary = useMemo(() => {
    const grouped = new Map();
    normalizedTransactions
      .filter((item) => dateKey(item.date || item.deliveryDate || item.delivery_date).startsWith(appliedMonth))
      .forEach((item) => {
        const name = item.productName || item.product_name || item.product?.name || "Product";
        const current = grouped.get(name) || { name, delivered: 0, received: 0 };
        current.delivered += Number(item.delivered ?? item.deliveredQty ?? item.quantity ?? 0);
        current.received += Number(item.received ?? item.receivedQty ?? item.returned ?? 0);
        grouped.set(name, current);
      });
    return Array.from(grouped.values());
  }, [normalizedTransactions, appliedMonth]);

  const toggleDate = (date) => {
    setExpandedDates((current) => {
      const next = new Set(current);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const changeMonth = (nextMonth) => {
    setMonth(nextMonth);
    setAppliedMonth(nextMonth);
    setExpandedDates(new Set());
  };

  const reset = () => {
    const now = new Date();
    changeMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  };

  const [year, monthNumber] = appliedMonth.split("-").map(Number);
  const firstDay = `${appliedMonth}-01`;
  const lastDay = `${appliedMonth}-${String(new Date(year, monthNumber, 0).getDate()).padStart(2, "0")}`;
  const monthRange = `${new Date(year, monthNumber - 1, 1).toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" })} - ${new Date(year, monthNumber - 1, Number(lastDay.slice(-2))).toLocaleDateString("en-IN", { month: "short", day: "2-digit", year: "numeric" })}`;

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* Month controls */}
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => changeMonth(shiftMonth(appliedMonth, -1))} aria-label="Previous month"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
            <ChevronLeft size={19} />
          </button>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Select month</span>
            <input type="month" value={month} onChange={(event) => event.target.value && changeMonth(event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-center text-sm font-semibold text-cyan-700 outline-none focus:border-cyan-500" />
          </label>
          <button type="button" onClick={() => changeMonth(shiftMonth(appliedMonth, 1))} aria-label="Next month"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
            <ChevronRight size={19} />
          </button>
          <button type="button" onClick={reset} aria-label="Reset to current month"
            className="hidden h-9 shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs text-slate-600 hover:bg-slate-50 sm:inline-flex">
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </section>

      {/* Customer and month summary */}
      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="break-words text-base font-semibold leading-6 text-slate-900 sm:text-xl">
              {customer?.name || "Customer"}
            </h3>
            {customer?.phone && <p className="mt-1 text-sm text-slate-700">{customer.phone}</p>}
            <p className="mt-1 text-sm text-slate-600">{customer?.area || customer?.address || "Customer"}</p>
            <p className="mt-1 text-sm font-bold text-cyan-700">{monthRange}</p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-white sm:h-20 sm:w-20">
            <span className="text-2xl font-semibold sm:text-3xl">{(customer?.name || "C").charAt(0).toUpperCase()}</span>
          </div>
        </div>

        {/* Product totals, matching the reference report */}
        <div className="mt-5 overflow-hidden rounded-lg">
          <div className="grid grid-cols-[minmax(0,1fr)_0.8fr_0.8fr] bg-cyan-600 px-2 py-2.5 text-[11px] font-semibold text-white sm:px-4 sm:text-sm">
            <span>Product</span>
            <span className="text-center">Total Delivered</span>
            <span className="text-center">Total Received</span>
          </div>
          {productSummary.length ? productSummary.map((product) => (
            <div key={product.name} className="grid grid-cols-[minmax(0,1fr)_0.8fr_0.8fr] items-center border-b border-slate-100 px-2 py-3 text-xs text-slate-800 sm:px-4 sm:text-sm">
              <span className="truncate">{product.name}</span>
              <span className="text-center font-medium">{product.delivered}</span>
              <span className="text-center font-medium">{product.received}</span>
            </div>
          )) : (
            <div className="px-3 py-4 text-center text-xs text-slate-500">No product transactions for this month.</div>
          )}
        </div>
      </section>

      {/* Daily delivery report */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,0.55fr))] items-center gap-1 bg-cyan-600 px-2 py-2.5 text-[10px] font-semibold text-white sm:px-4 sm:text-sm">
          <span>Date / Shift</span>
          <span className="text-center">DLVD</span>
          <span className="text-center">RCVD</span>
          <span className="text-center">Bal</span>
          <span className="text-center">Time</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading monthly transactions...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-600">{error}</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {days.map(({ date, entries }) => {
              const isExpanded = expandedDates.has(date);
              const deliveredTotal = entries.reduce((sum, item) => sum + Number(item.delivered ?? item.deliveredQty ?? item.delivered_qty ?? 0), 0);
              const receivedTotal = entries.reduce((sum, item) => sum + Number(item.received ?? item.receivedQty ?? item.received_qty ?? 0), 0);
              const balanceTotal = entries.reduce((sum, item) => sum + Number(item.balance ?? item.balanceQty ?? item.balance_qty ?? (Number(item.delivered || 0) - Number(item.received || 0))), 0);
              const shifts = [...new Set(entries.map((item) => String(item.shift || "Morning").toLowerCase()))];
              const timeLabel = entries[0]?.time || entries[0]?.shift || "—";

              return (
                <div key={date} className="bg-white">
                  <div className="grid grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,0.55fr))] items-center gap-1 px-2 py-2.5 sm:px-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${entries.length ? "bg-emerald-500" : "bg-rose-500"}`}>
                        <Check size={14} strokeWidth={3} />
                      </span>
                      <button type="button" onClick={() => toggleDate(date)} aria-expanded={isExpanded}
                        className="min-w-0 truncate text-left text-[11px] font-medium text-slate-900 sm:text-sm">
                        {formatDate(date)}
                      </button>
                    </div>
                    <span className="text-center text-[11px] text-slate-800 sm:text-sm">{entries.length ? deliveredTotal : "—"}</span>
                    <span className="text-center text-[11px] text-slate-800 sm:text-sm">{entries.length ? receivedTotal : "—"}</span>
                    <span className="text-center text-[11px] text-slate-800 sm:text-sm">{entries.length ? balanceTotal : "—"}</span>
                    <div className="flex items-center justify-center gap-0.5">
                      {entries.length > 0 ? (
                        <button type="button" onClick={() => onEditDelivery?.(date)} disabled={!onEditDelivery || isArchived}
                          aria-label={`Edit delivery for ${formatDate(date)}`} title="Edit delivery"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-cyan-700 hover:bg-cyan-50 disabled:opacity-40">
                          <Pencil size={16} />
                        </button>
                      ) : (
                        <button type="button" onClick={() => onAddDelivery?.(date)} disabled={!onAddDelivery || isArchived}
                          aria-label={`Add delivery for ${formatDate(date)}`} title="Add delivery"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-cyan-700 hover:bg-cyan-50 disabled:opacity-40">
                          <Plus size={18} />
                        </button>
                      )}
                      <button type="button" onClick={() => toggleDate(date)} aria-label={isExpanded ? "Collapse day" : "Expand day"} aria-expanded={isExpanded}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100">
                        <ChevronDown size={18} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-2 py-2 sm:px-4">
                      {entries.length === 0 ? (
                        <p className="py-2 text-center text-xs text-slate-500">No Transaction</p>
                      ) : (
                        <div className="space-y-1.5">
                          {entries.map((item, index) => {
                            const delivered = Number(item.delivered ?? item.deliveredQty ?? item.delivered_qty ?? item.quantity ?? 0);
                            const received = Number(item.received ?? item.receivedQty ?? item.received_qty ?? item.returned ?? 0);
                            const balance = Number(item.balance ?? item.balanceQty ?? item.balance_qty ?? delivered - received);
                            return (
                              <div key={item.id || `${date}-${index}`} className="grid grid-cols-[minmax(0,1.15fr)_repeat(4,minmax(0,0.6fr))] items-center gap-1 border-b border-slate-200 bg-white px-1 py-3 last:border-0 sm:px-2">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <span className="text-cyan-600">☀</span>
                                  <div className="min-w-0">
                                    <p className="truncate text-[10px] font-semibold text-slate-900 sm:text-xs">{item.productName || item.product_name || item.product?.name || "Product"}</p>
                                    <p className="truncate text-[9px] text-slate-500">
                                      {item.updated_at
                                        ? new Date(item.updated_at).toLocaleTimeString("en-IN", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        })
                                        : item.time || "—"}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-center text-[11px] text-slate-800 sm:text-sm">{delivered}</span>
                                <span className="text-center text-[11px] text-slate-800 sm:text-sm">{received}</span>
                                <span className="text-center text-[11px] text-slate-800 sm:text-sm">{balance}</span>
                                <span className="text-center text-[10px] text-slate-700 sm:text-xs">{item.time || item.shift || "—"}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
