
import { useMemo, useState } from "react";
import {
  Filter,
  ChevronDown,
  RotateCcw,
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
} from "lucide-react";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getType = (entry) =>
  String(entry.type || entry.transactionType || entry.transaction_type || "")
    .toLowerCase()
    .replaceAll("_", " ");

export default function CustomerLedgerSection({
  customer,
  ledgerEntries = [],
  summary,
  loading = false,
  error = "",
}) {
  const [showFilters, setShowFilters] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter((entry) => {
      const rawDate =
        entry.date ||
        entry.transactionDate ||
        entry.transaction_date ||
        entry.createdAt;

      const date = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : "";
      const type = getType(entry);

      const matchesFrom = !fromDate || (date && date >= fromDate);
      const matchesTo = !toDate || (date && date <= toDate);
      const matchesType =
        typeFilter === "all" || type.includes(typeFilter);

      return matchesFrom && matchesTo && matchesType;
    });
  }, [ledgerEntries, fromDate, toDate, typeFilter]);

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setTypeFilter("all");
  };

  const totalInvoice = Number(
    summary?.totalInvoice ?? summary?.total_invoice ?? 0
  );
  const totalPaid = Number(
    summary?.totalPaid ?? summary?.total_paid ?? 0
  );
  const totalDue = Number(
    summary?.totalDue ?? summary?.total_due ?? 0
  );

  const summaryCards = [
    {
      label: "Total Invoice",
      value: totalInvoice,
      icon: TrendingUp,
      color: "text-blue-600",
      background: "bg-blue-50",
    },
    {
      label: "Total Paid",
      value: totalPaid,
      icon: TrendingDown,
      color: "text-emerald-600",
      background: "bg-emerald-50",
    },
    {
      label: "Total Due",
      value: totalDue,
      icon: Wallet,
      color: "text-rose-600",
      background: "bg-rose-50",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Ledger Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{card.label}</p>
                <span className={`rounded-lg p-2 ${card.background}`}>
                  <Icon size={19} className={card.color} />
                </span>
              </div>
              <p className={`mt-3 text-2xl font-semibold ${card.color}`}>
                {currency(card.value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          aria-expanded={showFilters}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
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

            <div>
              <label className="mb-2 block text-sm text-slate-600">
                Transaction Type
              </label>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              >
                <option value="all">All Transactions</option>
                <option value="invoice">Invoice</option>
                <option value="payment">Payment</option>
                <option value="opening">Opening Balance</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>

            <div className="flex items-end">
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

      {/* Ledger Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Customer Ledger</h3>
          <p className="mt-1 text-xs text-slate-400">
            {customer?.name || "Customer"} · Transaction history
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-5 py-4 font-medium">Date</th>
                <th className="px-5 py-4 font-medium">Particulars</th>
                <th className="px-5 py-4 font-medium">Type</th>
                <th className="px-5 py-4 text-right font-medium">Debit</th>
                <th className="px-5 py-4 text-right font-medium">Credit</th>
                <th className="px-5 py-4 text-right font-medium">Balance</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading ledger...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Scale size={30} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-600">
                      No ledger entries found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Customer transactions will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, index) => {
                  const debit = Number(
                    entry.debit ?? entry.debitAmount ?? entry.debit_amount ?? 0
                  );
                  const credit = Number(
                    entry.credit ?? entry.creditAmount ?? entry.credit_amount ?? 0
                  );
                  const balance =
                    entry.balance ??
                    entry.runningBalance ??
                    entry.running_balance;

                  const rawDate =
                    entry.date ||
                    entry.transactionDate ||
                    entry.transaction_date ||
                    entry.createdAt;

                  return (
                    <tr
                      key={entry.id || `${rawDate}-${index}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(rawDate)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {entry.description ||
                            entry.particulars ||
                            entry.reference ||
                            "Transaction"}
                        </p>
                        {entry.referenceNumber || entry.reference_number ? (
                          <p className="mt-1 text-xs text-slate-400">
                            Ref: {entry.referenceNumber || entry.reference_number}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 capitalize text-slate-600">
                        {getType(entry) || "—"}
                      </td>
                      <td className="px-5 py-4 text-right text-rose-600">
                        {debit ? currency(debit) : "—"}
                      </td>
                      <td className="px-5 py-4 text-right text-emerald-600">
                        {credit ? currency(credit) : "—"}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-800">
                        {balance !== undefined && balance !== null
                          ? currency(balance)
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          Showing {filteredEntries.length} of {ledgerEntries.length} entries
        </div>
      </section>
    </div>
  );
}
