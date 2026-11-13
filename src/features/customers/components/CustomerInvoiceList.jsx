
import {
  ReceiptText,
  CalendarDays,
  IndianRupee,
  Search,
  Download,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  FileText,
} from "lucide-react";
import { useMemo, useState } from "react";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInvoiceNumber(invoice) {
  return (
    invoice.invoice_number ??
    invoice.invoiceNumber ??
    invoice.number ??
    invoice.id ??
    "Invoice"
  );
}

function getInvoiceDate(invoice) {
  return (
    invoice.invoice_date ??
    invoice.invoiceDate ??
    invoice.date ??
    invoice.created_at ??
    invoice.createdAt ??
    ""
  );
}

function getInvoiceAmount(invoice) {
  return Number(
    invoice.total_amount ??
    invoice.totalAmount ??
    invoice.amount ??
    invoice.total ??
    0
  ) || 0;
}

function getStatus(invoice) {
  const raw =
    invoice.status ??
    invoice.payment_status ??
    invoice.paymentStatus ??
    "";

  return String(raw).trim().toLowerCase();
}

function StatusBadge({ status }) {
  const styles = {
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    unpaid: "bg-rose-50 text-rose-700 ring-rose-600/20",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    overdue: "bg-rose-50 text-rose-700 ring-rose-600/20",
    partial: "bg-blue-50 text-blue-700 ring-blue-600/20",
    draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };

  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : "Not specified";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[status] || styles.draft
      }`}
    >
      {label}
    </span>
  );
}

function EmptyState({ searching }) {
  return (
    <div className="flex flex-col items-center px-5 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <ReceiptText size={27} />
      </div>

      <h3 className="mt-4 font-bold text-slate-900">
        {searching ? "No matching invoices" : "No invoices available"}
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {searching
          ? "Try another invoice number or search term."
          : "Invoices associated with this customer will appear here when available."}
      </p>
    </div>
  );
}

export default function CustomerInvoiceList({
  invoices = [],
  loading = false,
  error = "",
  onRetry,
  onViewInvoice,
}) {
  const [search, setSearch] = useState("");
  const records = Array.isArray(invoices) ? invoices : [];

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...records]
      .filter((invoice) => {
        if (!query) return true;

        return [
          getInvoiceNumber(invoice),
          getInvoiceDate(invoice),
          getStatus(invoice),
          invoice.notes,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          );
      })
      .sort(
        (a, b) =>
          new Date(getInvoiceDate(b) || 0) -
          new Date(getInvoiceDate(a) || 0)
      );
  }, [records, search]);

  const totalAmount = filteredInvoices.reduce(
    (sum, invoice) => sum + getInvoiceAmount(invoice),
    0
  );

  const downloadCsv = () => {
    const headers = [
      "Invoice Number",
      "Invoice Date",
      "Amount",
      "Status",
    ];

    const rows = filteredInvoices.map((invoice) => [
      getInvoiceNumber(invoice),
      getInvoiceDate(invoice),
      getInvoiceAmount(invoice),
      getStatus(invoice) || "Not specified",
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
    link.download = "customer-invoices.csv";
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
            <ReceiptText size={22} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Customer Invoices
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review invoice records and amounts.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={downloadCsv}
          disabled={loading || filteredInvoices.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={17} />
          Export CSV
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">
              Invoice Records
            </p>
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FileText size={19} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {filteredInvoices.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">
              Displayed Invoice Total
            </p>
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <IndianRupee size={19} />
            </span>
          </div>
          <p className="mt-3 break-words text-2xl font-bold text-slate-900">
            {money(totalAmount)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h3 className="font-bold text-slate-900">Invoice Register</h3>
            <p className="mt-1 text-xs text-slate-500">
              {filteredInvoices.length} records shown
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1 sm:w-64">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search invoices..."
                aria-label="Search invoices"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={loading}
                aria-label="Refresh invoices"
                className="flex shrink-0 items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="m-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Unable to load invoices</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoaderCircle
              size={28}
              className="animate-spin text-teal-700"
            />
            <p className="mt-3 text-sm text-slate-500">
              Loading invoices...
            </p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <EmptyState searching={Boolean(search.trim())} />
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredInvoices.map((invoice, index) => (
                <article
                  key={invoice.id ?? `${getInvoiceNumber(invoice)}-${index}`}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-bold text-slate-900">
                        {getInvoiceNumber(invoice)}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays size={13} />
                        {formatDate(getInvoiceDate(invoice))}
                      </p>
                    </div>
                    <StatusBadge status={getStatus(invoice)} />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <span className="text-sm text-slate-500">Invoice amount</span>
                    <span className="font-bold text-slate-900">
                      {money(getInvoiceAmount(invoice))}
                    </span>
                  </div>

                  {onViewInvoice && (
                    <button
                      type="button"
                      onClick={() => onViewInvoice(invoice)}
                      className="mt-3 w-full rounded-xl border border-teal-200 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
                    >
                      View invoice
                    </button>
                  )}
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[650px] text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-semibold">Invoice</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 text-right font-semibold">Amount</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    {onViewInvoice && (
                      <th className="px-5 py-4 text-right font-semibold">Action</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((invoice, index) => (
                    <tr
                      key={invoice.id ?? `${getInvoiceNumber(invoice)}-${index}`}
                      className="transition hover:bg-teal-50/30"
                    >
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800">
                          {getInvoiceNumber(invoice)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDate(getInvoiceDate(invoice))}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-slate-900">
                        {money(getInvoiceAmount(invoice))}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={getStatus(invoice)} />
                      </td>
                      {onViewInvoice && (
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => onViewInvoice(invoice)}
                            className="text-sm font-semibold text-teal-700 hover:text-teal-900"
                          >
                            View
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <p className="text-xs leading-5 text-slate-500">
        The displayed total is the sum of the invoice amounts supplied to this
        component. It is not an outstanding-balance calculation.
      </p>
    </section>
  );
}
