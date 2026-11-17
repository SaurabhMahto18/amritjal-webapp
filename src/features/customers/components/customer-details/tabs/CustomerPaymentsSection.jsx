import { useMemo, useState } from "react";
import {
  Filter,
  ChevronDown,
  RotateCcw,
  CreditCard,
} from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toISOString().slice(0, 10);
};

export default function CustomerPaymentsSection({
  customer,
  payments = [],
  loading = false,
  error = "",
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [paymentMode, setPaymentMode] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const receiver = payment.receiver || payment.receivedBy || "";
      const mode = payment.paymentMode || payment.payment_mode || "";
      const date = formatDate(
        payment.paymentDate || payment.payment_date || payment.date
      );

      const matchesSearch =
        !search ||
        String(receiver).toLowerCase().includes(search.toLowerCase()) ||
        String(mode).toLowerCase().includes(search.toLowerCase());

      const matchesMode =
        paymentMode === "all" || String(mode).toLowerCase() === paymentMode;

      const matchesFrom = !fromDate || date >= fromDate;
      const matchesTo = !toDate || date <= toDate;

      return matchesSearch && matchesMode && matchesFrom && matchesTo;
    });
  }, [payments, search, paymentMode, fromDate, toDate]);

  const resetFilters = () => {
    setSearch("");
    setPaymentMode("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="min-w-0 space-y-3 sm:space-y-5">
      {/* Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:px-4 sm:py-3 sm:text-sm"
          aria-expanded={showFilters}
        >
          <Filter size={16} />
          Filters
          <ChevronDown
            size={15}
            className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </button>

        {showFilters && (
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:mt-5 sm:gap-4 sm:pt-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="col-span-2 block text-xs text-slate-600 sm:text-sm">
              Search receiver or mode
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search receiver or mode"
                className="mt-1.5 w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500 sm:mt-2"
              />
            </label>

            <label className="block text-xs text-slate-600 sm:text-sm">
              Payment Mode
              <select
                value={paymentMode}
                onChange={(event) => setPaymentMode(event.target.value)}
                className="mt-1.5 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-sm outline-none focus:border-teal-500 sm:mt-2 sm:px-3"
              >
                <option value="all">All Modes</option>
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </label>

            <label className="block text-xs text-slate-600 sm:text-sm">
              From Date
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="mt-1.5 w-full min-w-0 rounded-lg border border-slate-200 px-2 py-2.5 text-xs outline-none focus:border-teal-500 sm:mt-2 sm:px-3 sm:text-sm"
              />
            </label>

            <label className="block text-xs text-slate-600 sm:text-sm">
              To Date
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="mt-1.5 w-full min-w-0 rounded-lg border border-slate-200 px-2 py-2.5 text-xs outline-none focus:border-teal-500 sm:mt-2 sm:px-3 sm:text-sm"
              />
            </label>

            <div className="col-span-2 flex items-end xl:col-span-1">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 sm:px-4 sm:text-sm"
              >
                <RotateCcw size={15} />
                Reset filters
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Payment History */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Mobile: concise payment cards */}
        <div className="divide-y divide-slate-100 md:hidden">
          <div className="px-3 py-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Payment History
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {customer?.name || "Customer"} · {filteredPayments.length} of {payments.length} payments
            </p>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-slate-400">
              Loading payments...
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center text-sm text-red-500">
              {error}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <CreditCard size={26} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">
                No payments found
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Payments for this customer will appear here.
              </p>
            </div>
          ) : (
            filteredPayments.map((payment) => {
              const receiver = payment.receiver || payment.receivedBy || "—";
              const mode = payment.paymentMode || payment.payment_mode || "—";
              const amount = payment.amount || 0;
              const date = formatDate(
                payment.paymentDate || payment.payment_date || payment.date
              );

              return (
                <article
                  key={payment.id}
                  className="flex min-w-0 items-center justify-between gap-3 px-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
                      {(customer?.name || "C").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {formatCurrency(amount)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-600">
                        {receiver}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {date}
                      </p>
                    </div>
                  </div>

                  <span className="max-w-[38%] shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium capitalize text-slate-600">
                    {mode}
                  </span>
                </article>
              );
            })
          )}
        </div>

        {/* Desktop: original table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-5 py-4 font-medium">Customer Name</th>
                <th className="px-5 py-4 font-medium">Receiver</th>
                <th className="px-5 py-4 text-right font-medium">Amount</th>
                <th className="px-5 py-4 font-medium">Payment Mode</th>
                <th className="px-5 py-4 font-medium">Payment Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    Loading payments...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <CreditCard className="mx-auto mb-3 text-slate-300" size={30} />
                    <p className="font-medium text-slate-600">No payments found</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Payments for this customer will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const receiver = payment.receiver || payment.receivedBy || "—";
                  const mode = payment.paymentMode || payment.payment_mode || "—";
                  const amount = payment.amount || 0;
                  const date = formatDate(
                    payment.paymentDate || payment.payment_date || payment.date
                  );

                  return (
                    <tr
                      key={payment.id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white">
                            <span className="text-sm font-semibold">
                              {(customer?.name || "C").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-slate-900">
                            {customer?.name || "Customer"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{receiver}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">
                        {formatCurrency(amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium capitalize text-blue-600">
                          {mode}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{date}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="hidden border-t border-slate-100 px-5 py-3 text-xs text-slate-400 md:block">
          Showing {filteredPayments.length} of {payments.length} payments
        </div>
      </section>
    </div>
  );
}
