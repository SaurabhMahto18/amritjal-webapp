
import { useMemo, useState } from "react";
import {
  Filter,
  ChevronDown,
  Search,
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
  if (Number.isNaN(date.getTime())) return value;

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
      const date = formatDate(payment.paymentDate || payment.payment_date || payment.date);

      const matchesSearch =
        !search ||
        String(receiver).toLowerCase().includes(search.toLowerCase()) ||
        String(mode).toLowerCase().includes(search.toLowerCase());

      const matchesMode =
        paymentMode === "all" ||
        String(mode).toLowerCase() === paymentMode;

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
    <div className="space-y-5">
      {/* Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          aria-expanded={showFilters}
        >
          <Filter size={18} />
          Filters
          <ChevronDown
            size={16}
            className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </button>

        {showFilters && (
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm text-slate-600">
                Search
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search receiver or mode"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(event) => setPaymentMode(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              >
                <option value="all">All Modes</option>
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div className="flex items-end gap-2 md:col-span-2 xl:col-span-4">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Payment History */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
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
                    <p className="font-medium text-slate-600">
                      No payments found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Payments for this customer will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const receiver =
                    payment.receiver || payment.receivedBy || "—";
                  const mode =
                    payment.paymentMode || payment.payment_mode || "—";
                  const amount = payment.amount || 0;
                  const date = formatDate(
                    payment.paymentDate ||
                      payment.payment_date ||
                      payment.date
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

                      <td className="px-5 py-3.5 text-slate-700">
                        {receiver}
                      </td>

                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">
                        {formatCurrency(amount)}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium capitalize text-blue-600">
                          {mode}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-700">
                        {date}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          Showing {filteredPayments.length} of {payments.length} payments
        </div>
      </section>
    </div>
  );
}
