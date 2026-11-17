
import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  FileText,
  CalendarDays,
  IndianRupee,
  ChevronRight,
  Receipt,
  Wallet,
  CircleCheck,
  Clock3,
  AlertCircle,
  X,
} from "lucide-react";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const getDateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value).slice(0, 10)
    : date.toISOString().slice(0, 10);
};

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

const getAmount = (invoice, ...keys) => {
  for (const key of keys) {
    if (invoice[key] !== undefined && invoice[key] !== null) {
      return Number(invoice[key]) || 0;
    }
  }
  return 0;
};

const getStatus = (invoice) => {
  const rawStatus = String(invoice.status || "").toLowerCase();

  const total = getAmount(
    invoice,
    "amountToPay",
    "amount_to_pay",
    "payableAmount",
    "payable_amount",
    "totalAmount",
    "total_amount",
    "amount"
  );

  const paid = getAmount(invoice, "paidAmount", "paid_amount");

  if (["paid", "completed", "settled"].includes(rawStatus)) return "Paid";
  if (["partial", "partially_paid"].includes(rawStatus)) return "Partial";
  if (["unpaid", "pending", "due"].includes(rawStatus)) return "Unpaid";

  if (total > 0 && paid >= total) return "Paid";
  if (paid > 0) return "Partial";

  return "Unpaid";
};

const getInvoiceNumber = (invoice) =>
  invoice.invoiceNumber ||
  invoice.invoice_number ||
  invoice.invoiceNo ||
  invoice.invoice_no ||
  invoice.id ||
  "—";

const getInvoiceDate = (invoice) =>
  invoice.invoiceDate || invoice.invoice_date || invoice.date;

function StatusBadge({ status }) {
  const styles = {
    Paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Partial: "bg-amber-50 text-amber-700 ring-amber-600/20",
    Unpaid: "bg-rose-50 text-rose-700 ring-rose-600/20",
  };

  const icons = {
    Paid: <CircleCheck size={13} />,
    Partial: <Clock3 size={13} />,
    Unpaid: <AlertCircle size={13} />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
        styles[status] || styles.Unpaid
      }`}
    >
      {icons[status] || icons.Unpaid}
      {status}
    </span>
  );
}

function SummaryCard({ title, value, icon, subtitle }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:rounded-2xl sm:p-5">
      <div className="flex min-w-0 items-center justify-between gap-1">
        <p className="min-w-0 truncate text-[10px] font-medium leading-4 text-slate-500 sm:text-sm">{title}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:size-10 sm:rounded-xl">
          {icon}
        </span>
      </div>
      <p className="mt-2 break-words text-xs font-bold leading-tight tracking-tight text-slate-900 sm:mt-3 sm:text-2xl">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 hidden text-xs text-slate-400 sm:block">{subtitle}</p>
      )}
    </div>
  );
}

export default function CustomerInvoicesSection({
  customer,
  invoices = [],
  loading = false,
  error = "",
  onInvoiceClick,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeInvoices.filter((invoice) => {
      const invoiceNumber = String(getInvoiceNumber(invoice)).toLowerCase();
      const date = getDateValue(getInvoiceDate(invoice));
      const status = getStatus(invoice).toLowerCase();

      const matchesSearch =
        !query ||
        invoiceNumber.includes(query) ||
        String(customer?.name || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      const matchesFrom = !fromDate || (date && date >= fromDate);
      const matchesTo = !toDate || (date && date <= toDate);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    safeInvoices,
    search,
    statusFilter,
    fromDate,
    toDate,
    customer?.name,
  ]);

  const totals = useMemo(() => {
    return filteredInvoices.reduce(
      (result, invoice) => {
        const total = getAmount(
          invoice,
          "amountToPay",
          "amount_to_pay",
          "payableAmount",
          "payable_amount",
          "totalAmount",
          "total_amount",
          "total",
          "amount"
        );

        const paid = getAmount(invoice, "paidAmount", "paid_amount");

        result.total += total;
        result.paid += paid;
        result.due += Math.max(0, total - paid);

        return result;
      },
      { total: 0, paid: 0, due: 0 }
    );
  }, [filteredInvoices]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  const hasFilters =
    search || statusFilter !== "all" || fromDate || toDate;

  const openInvoice = (invoice) => {
    if (onInvoiceClick) onInvoiceClick(invoice);
  };

  return (
    <div className="min-w-0 space-y-3 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:size-10 sm:rounded-xl">
              <Receipt size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-xl">
                Invoices & Billing
              </h2>
              <p className="text-[11px] leading-4 text-slate-500 sm:text-sm">
                Billing history for {customer?.name || "this customer"}
              </p>
            </div>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 sm:px-3 sm:text-xs">
          {filteredInvoices.length} Invoices
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <SummaryCard
          title="Total Invoice Amount"
          value={currency(totals.total)}
          icon={<FileText size={19} />}
          subtitle="Based on current results"
        />
        <SummaryCard
          title="Amount Paid"
          value={currency(totals.paid)}
          icon={<Wallet size={19} />}
          subtitle="Recorded payments"
        />
        <SummaryCard
          title="Outstanding Due"
          value={currency(totals.due)}
          icon={<IndianRupee size={19} />}
          subtitle="Calculated from invoice totals"
        />
      </div>

      {/* Search and filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5">
        <div className="flex items-center gap-2 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoice number..."
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs sm:py-3 sm:pl-11 sm:pr-4 sm:text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            aria-expanded={showFilters}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              showFilters
                ? "border-teal-200 bg-teal-50 text-teal-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal size={17} />
            Filters
            {hasFilters && (
              <span className="h-2 w-2 rounded-full bg-teal-600" />
            )}
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:mt-4 sm:gap-3 sm:pt-4 sm:grid-cols-3">
            <label className="text-xs font-semibold text-slate-500">
              Payment Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-1.5 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-xs sm:mt-2 sm:px-3 sm:py-3 sm:text-sm font-normal text-slate-800 outline-none focus:border-teal-500"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-500">
              From Date
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                className="mt-1.5 w-full min-w-0 rounded-xl border border-slate-200 px-2.5 py-2.5 text-xs sm:mt-2 sm:px-3 sm:py-3 sm:text-sm font-normal text-slate-800 outline-none focus:border-teal-500"
              />
            </label>

            <label className="text-xs font-semibold text-slate-500">
              To Date
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className="mt-1.5 w-full min-w-0 rounded-xl border border-slate-200 px-2.5 py-2.5 text-xs sm:mt-2 sm:px-3 sm:py-3 sm:text-sm font-normal text-slate-800 outline-none focus:border-teal-500"
              />
            </label>
          </div>
        )}
      </section>

      {/* Invoice list */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-3 sm:px-5 sm:py-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 sm:text-base">Invoice History</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              View customer billing records
            </p>
          </div>
          <span className="text-[10px] text-slate-400 sm:text-xs">
            Showing {filteredInvoices.length} of {safeInvoices.length}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            Loading invoices...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center p-10 text-center">
            <AlertCircle size={30} className="text-rose-500" />
            <p className="mt-3 font-semibold text-slate-800">
              Unable to load invoices
            </p>
            <p className="mt-1 text-sm text-rose-600">{error}</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText size={27} />
            </span>
            <h3 className="mt-4 font-bold text-slate-800">
              {safeInvoices.length
                ? "No matching invoices"
                : "No invoices yet"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {safeInvoices.length
                ? "Try changing your search or filters."
                : "Invoices generated for this customer will appear here."}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <X size={15} />
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Invoice</th>
                    <th className="px-5 py-4 font-semibold">Billing Period</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Charges
                    </th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Discount
                    </th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Payable
                    </th>
                    <th className="px-5 py-4 text-center font-semibold">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((invoice) => {
                    const number = getInvoiceNumber(invoice);
                    const start = invoice.startDate || invoice.start_date;
                    const end = invoice.endDate || invoice.end_date;
                    const date = getInvoiceDate(invoice);

                    const charges = getAmount(
                      invoice,
                      "additionalCharges",
                      "additional_charges",
                      "extraCharges"
                    );

                    const discount = getAmount(invoice, "discount");

                    const payable = getAmount(
                      invoice,
                      "amountToPay",
                      "amount_to_pay",
                      "payableAmount",
                      "payable_amount",
                      "totalAmount",
                      "total_amount",
                      "total",
                      "amount"
                    );

                    const status = getStatus(invoice);

                    return (
                      <tr
                        key={invoice.id || number}
                        onClick={() => openInvoice(invoice)}
                        className={`transition hover:bg-teal-50/40 ${
                          onInvoiceClick ? "cursor-pointer" : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                              <Receipt size={19} />
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">
                                {number}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-400">
                                {customer?.name || "Customer"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {start && end
                            ? `${formatDate(start)} – ${formatDate(end)}`
                            : formatDate(date)}
                        </td>

                        <td className="px-5 py-4 text-right text-slate-700">
                          {currency(charges)}
                        </td>

                        <td className="px-5 py-4 text-right text-slate-700">
                          {currency(discount)}
                        </td>

                        <td className="px-5 py-4 text-right font-bold text-slate-900">
                          {currency(payable)}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <StatusBadge status={status} />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            disabled={!onInvoiceClick}
                            onClick={(event) => {
                              event.stopPropagation();
                              openInvoice(invoice);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-40"
                          >
                            View
                            <ChevronRight size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile and tablet cards */}
            <div className="divide-y divide-slate-100 lg:hidden">
              {filteredInvoices.map((invoice) => {
                const number = getInvoiceNumber(invoice);
                const start = invoice.startDate || invoice.start_date;
                const end = invoice.endDate || invoice.end_date;
                const date = getInvoiceDate(invoice);

                const payable = getAmount(
                  invoice,
                  "amountToPay",
                  "amount_to_pay",
                  "payableAmount",
                  "payable_amount",
                  "totalAmount",
                  "total_amount",
                  "total",
                  "amount"
                );

                const paid = getAmount(invoice, "paidAmount", "paid_amount");
                const status = getStatus(invoice);

                return (
                  <button
                    key={invoice.id || number}
                    type="button"
                    onClick={() => openInvoice(invoice)}
                    disabled={!onInvoiceClick}
                    className="block w-full min-w-0 p-3 text-left transition hover:bg-slate-50 disabled:cursor-default sm:p-5"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:size-11 sm:rounded-xl">
                          <Receipt size={17} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">
                            {number}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {start && end
                              ? `${formatDate(start)} – ${formatDate(end)}`
                              : formatDate(date)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={status} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 sm:mt-4 sm:gap-3 sm:rounded-xl sm:p-3">
                      <div>
                        <p className="text-xs text-slate-500">Payable</p>
                        <p className="mt-1 break-words text-sm font-bold text-slate-900">
                          {currency(payable)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Paid</p>
                        <p className="mt-1 break-words text-sm font-semibold text-emerald-700">
                          {currency(paid)}
                        </p>
                      </div>
                    </div>

                    {onInvoiceClick && (
                      <div className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-teal-700">
                        View Invoice
                        <ChevronRight size={15} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
