import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  LoaderCircle,
} from "lucide-react";

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function LedgerTransactionsTable({
  transactions = [],
  loading = false,
  error = "",
  onRetry,
  showCustomer = true,
}) {
  const totalDebit = transactions.reduce(
    (sum, transaction) => sum + Number(transaction.debit || 0),
    0
  );

  const totalCredit = transactions.reduce(
    (sum, transaction) => sum + Number(transaction.credit || 0),
    0
  );

  const lastTransaction = transactions[transactions.length - 1];

  const emptyColSpan = showCustomer ? 7 : 6;

  return (
    <div className="w-full">
      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 border-b border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>

          {typeof onRetry === "function" && (
            <button
              type="button"
              onClick={onRetry}
              className="self-start rounded-lg border border-red-200 px-3 py-2 font-semibold hover:bg-red-100 sm:self-auto"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div
          className="flex items-center justify-center gap-3 py-12 text-sm text-gray-500"
          role="status"
        >
          <LoaderCircle size={22} className="animate-spin" />
          Loading transactions...
        </div>
      ) : transactions.length === 0 ? (
        /* Empty state */
        <div className="px-5 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
            <FileText size={24} />
          </div>

          <h3 className="font-semibold text-gray-900">
            {error ? "Ledger could not be loaded" : "No transactions found"}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {error
              ? "Please try loading the ledger again."
              : "Transactions will appear here when matching records are available."}
          </p>
        </div>
      ) : (
        <>
          {/* Transaction table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">
                    Date
                  </th>

                  {showCustomer && (
                    <th className="px-4 py-3 text-left font-semibold">
                      Customer
                    </th>
                  )}

                  <th className="px-4 py-3 text-left font-semibold">
                    Description
                  </th>

                  <th className="px-4 py-3 text-left font-semibold">
                    Type
                  </th>

                  <th className="px-4 py-3 text-right font-semibold">
                    Debit
                  </th>

                  <th className="px-4 py-3 text-right font-semibold">
                    Credit
                  </th>

                  <th className="px-4 py-3 text-right font-semibold">
                    Running Balance
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {transactions.map((transaction, index) => {
                  const debit = Number(transaction.debit || 0);
                  const credit = Number(transaction.credit || 0);

                  return (
                    <tr
                      key={
                        transaction.id ||
                        transaction.reference ||
                        `${transaction.date}-${index}`
                      }
                      className="transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {formatDate(transaction.date)}
                      </td>

                      {showCustomer && (
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {transaction.customerName || "—"}
                          </p>

                          {transaction.customerPhone && (
                            <p className="mt-1 text-xs text-gray-500">
                              {transaction.customerPhone}
                            </p>
                          )}
                        </td>
                      )}

                      <td className="max-w-[260px] px-4 py-3">
                        <p className="break-words text-gray-800">
                          {transaction.description || "Transaction"}
                        </p>

                        {transaction.reference && (
                          <p className="mt-1 break-all text-xs text-gray-400">
                            Ref: {transaction.reference}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {debit > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            <ArrowUpRight size={13} />
                            {transaction.type || "Debit"}
                          </span>
                        ) : credit > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <ArrowDownLeft size={13} />
                            {transaction.type || "Credit"}
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            {transaction.type || "Entry"}
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-red-700">
                        {debit > 0 ? currency(debit) : "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-emerald-700">
                        {credit > 0 ? currency(credit) : "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-gray-900">
                        {currency(transaction.balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                <tr>
                  <td
                    colSpan={emptyColSpan - 3}
                    className="px-4 py-4 text-right font-bold text-gray-900"
                  >
                    Displayed Totals
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-red-700">
                    {currency(totalDebit)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-emerald-700">
                    {currency(totalCredit)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-gray-900">
                    {currency(lastTransaction?.balance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Compact footer */}
          <div className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">
            Showing {transactions.length} transaction(s).
          </div>
        </>
      )}
    </div>
  );
}
