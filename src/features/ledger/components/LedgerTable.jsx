
import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Download,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";

const PAGE_SIZE = 10;

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTransactionType(transaction) {
  return String(transaction.type || transaction.transaction_type || "")
    .trim()
    .toLowerCase();
}

function getDescription(transaction) {
  return (
    transaction.description ||
    transaction.notes ||
    transaction.reference ||
    transaction.reference_number ||
    "Ledger transaction"
  );
}

function getDebit(transaction) {
  return Number(transaction.debit ?? 0) || 0;
}

function getCredit(transaction) {
  return Number(transaction.credit ?? 0) || 0;
}

function getBalance(transaction) {
  const value = transaction.balance ?? transaction.running_balance;
  return value === undefined || value === null ? null : Number(value);
}

function escapeCsv(value) {
  const text = String(value ?? "");

  // Reduce the risk of spreadsheet formula injection.
  const safeText = /^[\s]*[=+\-@]/.test(text)
    ? `'${text}`
    : text;

  return `"${safeText.replace(/"/g, '""')}"`;
}

function exportTransactions(transactions) {
  const headers = [
    "Date",
    "Description",
    "Type",
    "Debit (INR)",
    "Credit (INR)",
    "Balance (INR)",
    "Reference",
  ];

  const rows = transactions.map((transaction) => [
    transaction.date || transaction.transaction_date || "",
    getDescription(transaction),
    getTransactionType(transaction),
    getDebit(transaction),
    getCredit(transaction),
    getBalance(transaction) ?? "",
    transaction.reference || transaction.reference_number || "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "amrit-jal-ledger.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function TypeBadge({ type }) {
  const normalizedType = type || "transaction";

  const isCredit =
    normalizedType === "credit" ||
    normalizedType === "payment" ||
    normalizedType === "received";

  const styles = isCredit
    ? "bg-emerald-50 text-emerald-700"
    : normalizedType === "debit" ||
        normalizedType === "delivery"
      ? "bg-rose-50 text-rose-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles}`}
    >
      {normalizedType.replaceAll("_", " ")}
    </span>
  );
}

function EmptyState({ search }) {
  return (
    <div className="flex flex-col items-center px-5 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <BookOpen size={25} />
      </div>

      <h3 className="mt-4 font-semibold text-slate-900">
        {search ? "No matching transactions" : "No transactions available"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {search
          ? "Try another search term or clear your search."
          : "Ledger transactions will appear here when transaction data is connected."}
      </p>
    </div>
  );
}

export default function LedgerTable({
  transactions = [],
  loading = false,
  error = "",
  onRetry,
  onViewTransaction,
  pageSize = PAGE_SIZE,
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const safeTransactions = Array.isArray(transactions)
    ? transactions
    : [];

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return safeTransactions;

    return safeTransactions.filter((transaction) => {
      const searchableValues = [
        getDescription(transaction),
        getTransactionType(transaction),
        transaction.reference,
        transaction.reference_number,
        transaction.customer_name,
      ];

      return searchableValues.some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );
    });
  }, [safeTransactions, search]);

  const safePageSize =
    Number.isFinite(Number(pageSize)) && Number(pageSize) > 0
      ? Math.floor(Number(pageSize))
      : PAGE_SIZE;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / safePageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleTransactions = filteredTransactions.slice(
    (currentPage - 1) * safePageSize,
    currentPage * safePageSize
  );

  const totals = useMemo(
    () =>
      filteredTransactions.reduce(
        (result, transaction) => ({
          debit: result.debit + getDebit(transaction),
          credit: result.credit + getCredit(transaction),
        }),
        { debit: 0, credit: 0 }
      ),
    [filteredTransactions]
  );

  function updateSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function downloadCsv() {
    exportTransactions(filteredTransactions);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Ledger Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review transaction entries and their recorded balances.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 sm:w-72">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search transactions..."
                aria-label="Search ledger transactions"
                className="min-h-11 w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              />
            </div>

            <button
              type="button"
              onClick={downloadCsv}
              disabled={filteredTransactions.length === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-rose-700">
              <ArrowUpRight size={17} />
              Total Debit
            </div>

            <p className="mt-2 break-words text-xl font-bold text-rose-800">
              {formatMoney(totals.debit)}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <ArrowDownLeft size={17} />
              Total Credit
            </div>

            <p className="mt-2 break-words text-xl font-bold text-emerald-800">
              {formatMoney(totals.credit)}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-6">
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4"
          >
            <p className="text-sm font-semibold text-rose-800">
              Unable to load ledger transactions
            </p>

            <p className="mt-1 text-sm leading-6 text-rose-700">
              {error}
            </p>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      ) : loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <>
          {/* Mobile transaction cards */}
          <div className="divide-y divide-slate-100 md:hidden">
            {visibleTransactions.map((transaction, index) => {
              const transactionId =
                transaction.id ?? `${currentPage}-${index}`;

              const date =
                transaction.date || transaction.transaction_date;

              const balance = getBalance(transaction);

              return (
                <article key={transactionId} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-slate-900">
                        {getDescription(transaction)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(date)}
                      </p>

                      <div className="mt-2">
                        <TypeBadge type={getTransactionType(transaction)} />
                      </div>
                    </div>

                    {onViewTransaction && (
                      <button
                        type="button"
                        onClick={() => onViewTransaction(transaction)}
                        aria-label="View transaction"
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Debit</p>
                      <p className="mt-1 text-sm font-semibold text-rose-700">
                        {getDebit(transaction) > 0
                          ? formatMoney(getDebit(transaction))
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Credit</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        {getCredit(transaction) > 0
                          ? formatMoney(getCredit(transaction))
                          : "—"}
                      </p>
                    </div>

                    <div className="col-span-2 border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-500">
                        Recorded Balance
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {balance === null
                          ? "Not recorded"
                          : formatMoney(balance)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Desktop transaction table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Date",
                    "Description",
                    "Type",
                    "Debit",
                    "Credit",
                    "Balance",
                    "",
                  ].map((heading, index) => (
                    <th
                      key={`${heading}-${index}`}
                      className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {visibleTransactions.map((transaction, index) => {
                  const transactionId =
                    transaction.id ?? `${currentPage}-${index}`;

                  const balance = getBalance(transaction);

                  return (
                    <tr
                      key={transactionId}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDate(
                          transaction.date || transaction.transaction_date
                        )}
                      </td>

                      <td className="max-w-xs px-5 py-4">
                        <p className="break-words text-sm font-semibold text-slate-800">
                          {getDescription(transaction)}
                        </p>

                        {(transaction.reference ||
                          transaction.reference_number) && (
                          <p className="mt-1 text-xs text-slate-400">
                            Ref:{" "}
                            {transaction.reference ||
                              transaction.reference_number}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <TypeBadge type={getTransactionType(transaction)} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-rose-700">
                        {getDebit(transaction) > 0
                          ? formatMoney(getDebit(transaction))
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-emerald-700">
                        {getCredit(transaction) > 0
                          ? formatMoney(getCredit(transaction))
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">
                        {balance === null
                          ? "—"
                          : formatMoney(balance)}
                      </td>

                      <td className="px-5 py-4">
                        {onViewTransaction && (
                          <button
                            type="button"
                            onClick={() => onViewTransaction(transaction)}
                            aria-label="View transaction details"
                            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-slate-500 sm:text-sm">
              Showing{" "}
              {(currentPage - 1) * safePageSize + 1}–{" "}
              {Math.min(
                currentPage * safePageSize,
                filteredTransactions.length
              )}{" "}
              of {filteredTransactions.length} transactions
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
                disabled={currentPage === 1}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="px-2 text-sm font-semibold text-slate-700">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(totalPages, current + 1)
                  )
                }
                disabled={currentPage === totalPages}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      <div className="flex items-start gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
        <FileSpreadsheet
          size={15}
          className="mt-0.5 shrink-0 text-slate-400"
        />

        <p className="text-xs leading-5 text-slate-500">
          Export includes the currently filtered transactions. Balances are
          displayed as supplied by the ledger service; this table does not
          calculate accounting balances.
        </p>
      </div>
    </section>
  );
}
