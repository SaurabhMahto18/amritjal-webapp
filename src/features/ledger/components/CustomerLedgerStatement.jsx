import { useMemo } from "react";
import { Printer, FileText, UserRound, Wallet } from "lucide-react";

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function CustomerLedgerStatement({
  customer,
  transactions = [],
  fromDate = "",
  toDate = "",
  onClose,
}) {
  const statement = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const dateDifference = String(a.date || "").localeCompare(
        String(b.date || "")
      );

      if (dateDifference !== 0) return dateDifference;

      return String(a.createdAt || "").localeCompare(
        String(b.createdAt || "")
      );
    });

    const totalDebit = sorted.reduce(
      (sum, item) => sum + Number(item.debit || 0),
      0
    );

    const totalCredit = sorted.reduce(
      (sum, item) => sum + Number(item.credit || 0),
      0
    );

    const openingBalance = Number(customer?.openingBalance || 0);

    return {
      transactions: sorted,
      totalDebit,
      totalCredit,
      openingBalance,
      closingBalance: openingBalance + totalDebit - totalCredit,
    };
  }, [transactions, customer]);

  if (!customer) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <UserRound className="mx-auto mb-3 text-gray-400" size={32} />
        <h2 className="font-semibold text-gray-900">
          Select a customer
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          A customer is required to generate a ledger statement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          #customer-ledger-statement,
          #customer-ledger-statement * {
            visibility: visible !important;
          }

          #customer-ledger-statement {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }

          #customer-ledger-statement .no-print {
            display: none !important;
          }

          #customer-ledger-statement table {
            width: 100% !important;
            font-size: 10px !important;
          }

          #customer-ledger-statement th,
          #customer-ledger-statement td {
            padding: 6px !important;
            border: 1px solid #ddd !important;
          }

          #customer-ledger-statement tr {
            break-inside: avoid;
          }

          @page {
            size: A4 landscape;
            margin: 12mm;
          }
        }
      `}</style>

      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Customer Statement
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Detailed account activity for the selected customer.
          </p>
        </div>

        <div className="flex gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            <Printer size={17} />
            Print Statement
          </button>
        </div>
      </div>

      <div
        id="customer-ledger-statement"
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-teal-700">
              <FileText size={23} />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Amrit Jal
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold text-gray-900">
              Ledger Statement
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Account transaction summary
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Statement Period
            </p>
            <p className="mt-1 font-semibold text-gray-900">
              {fromDate ? formatDate(fromDate) : "Beginning"} –{" "}
              {toDate ? formatDate(toDate) : "Present"}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Generated: {formatDate(new Date().toISOString())}
            </p>
          </div>
        </header>

        <section className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <UserRound size={23} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Customer
              </p>
              <h2 className="mt-1 break-words text-lg font-bold text-gray-900">
                {customer.name}
              </h2>

              {customer.phone && (
                <p className="mt-1 text-sm text-gray-600">
                  Phone: {customer.phone}
                </p>
              )}

              {customer.address && (
                <p className="mt-1 text-sm text-gray-600">
                  Address: {customer.address}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Summary
            label="Opening Balance"
            value={currency(statement.openingBalance)}
          />
          <Summary
            label="Total Debit"
            value={currency(statement.totalDebit)}
          />
          <Summary
            label="Total Credit"
            value={currency(statement.totalCredit)}
          />
          <Summary
            label="Closing Balance"
            value={currency(statement.closingBalance)}
            highlighted
          />
        </section>

        <section>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <Wallet size={18} className="text-teal-700" />
            Transaction Details
          </h3>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold">
                    Date
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">
                    Description
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">
                    Reference
                  </th>
                  <th className="px-3 py-3 text-right font-semibold">
                    Debit
                  </th>
                  <th className="px-3 py-3 text-right font-semibold">
                    Credit
                  </th>
                  <th className="px-3 py-3 text-right font-semibold">
                    Balance
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {statement.transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      No transactions available for this statement.
                    </td>
                  </tr>
                ) : (
                  statement.transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                        {formatDate(transaction.date)}
                      </td>

                      <td className="px-3 py-3 text-gray-800">
                        {transaction.description || transaction.type}
                      </td>

                      <td className="break-all px-3 py-3 text-xs text-gray-500">
                        {transaction.reference || "—"}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-right text-red-700">
                        {transaction.debit
                          ? currency(transaction.debit)
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-right text-emerald-700">
                        {transaction.credit
                          ? currency(transaction.credit)
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-gray-900">
                        {currency(transaction.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-3 text-right font-bold text-gray-900"
                  >
                    Total
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-bold text-red-700">
                    {currency(statement.totalDebit)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-bold text-emerald-700">
                    {currency(statement.totalCredit)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-bold text-gray-900">
                    {currency(statement.closingBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <footer className="border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
          This statement reflects the transactions supplied to the ledger.
          Please contact Amrit Jal if any entry requires clarification.
        </footer>
      </div>
    </div>
  );
}

function Summary({ label, value, highlighted = false }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlighted
          ? "border-teal-200 bg-teal-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`mt-2 break-words text-lg font-bold ${
          highlighted ? "text-teal-800" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
