
import {
  BookOpen,
  CalendarDays,
  ArrowDownLeft,
  ArrowUpRight,
  IndianRupee,
  Search,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  ReceiptText,
  ArrowDownToLine,
} from "lucide-react";
import { useMemo, useState } from "react";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

function StatCard({ label, value, icon: Icon, color }) {
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    rose: "bg-rose-50 text-rose-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span
          className={`flex size-10 items-center justify-center rounded-xl ${styles[color]}`}
        >
          <Icon size={19} />
        </span>
      </div>

      <p className="mt-3 break-words text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ searching }) {
  return (
    <div className="flex flex-col items-center px-5 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <BookOpen size={27} />
      </div>

      <h3 className="mt-4 font-bold text-slate-900">
        {searching ? "No matching transactions" : "No ledger entries"}
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {searching
          ? "Try a different search term."
          : "Customer ledger transactions will appear here when they are available."}
      </p>
    </div>
  );
}

export default function CustomerLedgerTable({
  transactions = [],
  loading = false,
  error = "",
  onRetry,
}) {
  const [search, setSearch] = useState("");

  const records = Array.isArray(transactions) ? transactions : [];

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = records.filter((item) => {
      if (!query) return true;

      return [
        item.date,
        item.description,
        item.type,
        item.reference,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });

    return [...filtered].sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    );
  }, [records, search]);

  const totals = useMemo(
    () =>
      filteredTransactions.reduce(
        (result, item) => ({
          debit: result.debit + (Number(item.debit) || 0),
          credit: result.credit + (Number(item.credit) || 0),
        }),
        { debit: 0, credit: 0 }
      ),
    [filteredTransactions]
  );

  const exportCsv = () => {
    const headers = [
      "Date",
      "Description",
      "Type",
      "Debit",
      "Credit",
      "Running Balance",
      "Reference",
    ];

    const rows = filteredTransactions.map((item) => [
      item.date ?? "",
      item.description ?? "",
      item.type ?? "",
      item.debit ?? 0,
      item.credit ?? 0,
      item.balance ?? "",
      item.reference ?? "",
    ]);

    const escapeCsv = (value) => {
      let text = String(value ?? "");

      if (/^[\s]*[=+\-@]/.test(text)) {
        text = `'${text}`;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "customer-ledger.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <BookOpen size={22} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Customer Ledger
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review recorded debit and credit transactions.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          disabled={loading || filteredTransactions.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowDownToLine size={17} />
          Export CSV
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Debit"
          value={money(totals.debit)}
          icon={ArrowUpRight}
          color="rose"
        />

        <StatCard
          label="Total Credit"
          value={money(totals.credit)}
          icon={ArrowDownLeft}
          color="emerald"
        />

        <StatCard
          label="Transactions"
          value={filteredTransactions.length}
          icon={ReceiptText}
          color="blue"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h3 className="font-bold text-slate-900">
              Transaction Register
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {filteredTransactions.length} entries shown
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transactions..."
              aria-label="Search ledger transactions"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="m-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Unable to load ledger</p>
              <p className="mt-1">{error}</p>
            </div>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="font-semibold underline"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoaderCircle
              size={28}
              className="animate-spin text-teal-700"
            />
            <p className="mt-3 text-sm text-slate-500">
              Loading ledger entries...
            </p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState searching={Boolean(search.trim())} />
        ) : (
          <>
            {/* Mobile layout */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredTransactions.map((item, index) => (
                <article
                  key={item.id ?? `${item.date}-${index}`}
                  className="space-y-3 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-900">
                        {item.description || "Ledger transaction"}
                      </p>

                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays size={13} />
                        {formatDate(item.date)}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {item.type || "Entry"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-rose-50 p-3">
                      <p className="text-xs font-medium text-rose-600">
                        Debit
                      </p>
                      <p className="mt-1 font-bold text-rose-700">
                        {money(item.debit)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-3">
                      <p className="text-xs font-medium text-emerald-600">
                        Credit
                      </p>
                      <p className="mt-1 font-bold text-emerald-700">
                        {money(item.credit)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3 text-sm">
                    <span className="text-slate-500">Running balance</span>
                    <span className="font-bold text-slate-900">
                      {item.balance == null ? "—" : money(item.balance)}
                    </span>
                  </div>

                  {item.reference && (
                    <p className="break-words text-xs text-slate-500">
                      Reference: {item.reference}
                    </p>
                  )}
                </article>
              ))}
            </div>

            {/* Desktop layout */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Description</th>
                    <th className="px-5 py-4 font-semibold">Type</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Debit
                    </th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Credit
                    </th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Balance
                    </th>
                    <th className="px-5 py-4 font-semibold">Reference</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((item, index) => (
                    <tr
                      key={item.id ?? `${item.date}-${index}`}
                      className="transition hover:bg-teal-50/30"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDate(item.date)}
                      </td>

                      <td className="max-w-[240px] px-5 py-4 text-sm font-medium text-slate-800">
                        <span className="break-words">
                          {item.description || "Ledger transaction"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                          {item.type || "Entry"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-rose-700">
                        {money(item.debit)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-emerald-700">
                        {money(item.credit)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-slate-900">
                        {item.balance == null ? "—" : money(item.balance)}
                      </td>

                      <td className="max-w-[180px] px-5 py-4 text-sm text-slate-500">
                        <span className="break-words">
                          {item.reference || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td
                      colSpan={3}
                      className="px-5 py-4 text-sm font-bold text-slate-800"
                    >
                      Filtered totals
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-rose-700">
                      {money(totals.debit)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-emerald-700">
                      {money(totals.credit)}
                    </td>
                    <td colSpan={2} className="px-5 py-4 text-xs text-slate-500">
                      Balance shown as supplied by ledger data
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      <p className="text-xs leading-5 text-slate-500">
        Debit and credit totals are calculated from the currently displayed
        records. Running balances are displayed from the supplied data and
        are not recalculated here.
      </p>
    </section>
  );
}
