
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Wallet,
  BadgePercent,
  X,
  RotateCcw,
  ArrowUpRight,
  ReceiptText,
  Pencil,
  Trash2,
  Save,
  XCircle,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";
import { getInvoices } from "../services/invoiceService";

// ========================================
// FORMATTERS
// ========================================

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(
    `${String(value).slice(0, 10)}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const toISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ========================================
// DATE RANGE
// ========================================

const getDateRange = (filter) => {
  const today = new Date();

  let start;
  let end = new Date(today);

  switch (filter) {
    case "last7":
      start = new Date(today);
      start.setDate(today.getDate() - 6);
      break;

    case "last15":
      start = new Date(today);
      start.setDate(today.getDate() - 14);
      break;

    case "last30":
      start = new Date(today);
      start.setDate(today.getDate() - 29);
      break;

    case "thisMonth":
      start = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      break;

    case "previousMonth":
      start = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
      );

      end = new Date(
        today.getFullYear(),
        today.getMonth(),
        0
      );
      break;

    default:
      return {
        startDate: "",
        endDate: "",
      };
  }

  return {
    startDate: toISODate(start),
    endDate: toISODate(end),
  };
};

// ========================================
// INVOICE STATUS
// ========================================

const getStatus = (invoice) => {
  const rawStatus = String(
    invoice.status || ""
  ).toLowerCase();

  if (rawStatus === "void") return "Void";
  if (rawStatus === "draft") return "Draft";

  const total = Number(
    invoice.totalAmount ??
    invoice.total_amount ??
    0
  );

  const paid = Number(
    invoice.paidAmount ??
    invoice.amount_paid ??
    0
  );

  if (rawStatus === "paid" || (total > 0 && paid >= total)) {
    return "Paid";
  }

  if (rawStatus === "partially_paid" || paid > 0) {
    return "Partially Paid";
  }

  return "Unpaid";
};

const getStatusKey = (status) =>
  status.toLowerCase().replace(/\s+/g, "_");

const getStatusClass = (status) => {
  const styles = {
    Paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Partially Paid": "bg-amber-50 text-amber-700 ring-amber-200",
    Unpaid: "bg-rose-50 text-rose-700 ring-rose-200",
    Draft: "bg-slate-100 text-slate-600 ring-slate-200",
    Void: "bg-slate-100 text-slate-400 ring-slate-200",
  };

  return styles[status] || styles.Unpaid;
};

// ========================================
// SEO
// ========================================

const SEO = {
  title: "Invoices | Amrit Jal",
  description:
    "Manage customer invoices, payments, outstanding balances, billing records and invoice history with Amrit Jal.",
  robots: "noindex, nofollow",
};

// ========================================
// SUMMARY CARD
// ========================================

function SummaryCard({
  title,
  value,
  icon: Icon,
  tone = "slate",
  description,
}) {
  const tones = {
    navy: "bg-[#EAF0F7] text-[#244566]",
    teal: "bg-[#E5F5F2] text-[#087F68]",
    amber: "bg-[#FFF5E5] text-[#B7791F]",
    rose: "bg-[#FFF0F0] text-[#C34F55]",
    blue: "bg-[#EDF3FF] text-[#4267AC]",
  };

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 sm:text-sm">
            {title}
          </p>

          <p className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon size={20} />
        </div>
      </div>
    </article>
  );
}

// ========================================
// STATUS BADGE
// ========================================

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getStatusClass(status)}`}
    >
      <span
        className={`mr-1.5 size-1.5 rounded-full ${
          status === "Paid"
            ? "bg-emerald-600"
            : status === "Partially Paid"
              ? "bg-amber-500"
              : status === "Void"
                ? "bg-slate-400"
                : status === "Draft"
                  ? "bg-slate-500"
                  : "bg-rose-500"
        }`}
      />
      {status}
    </span>
  );
}

// ========================================
// CUSTOMER AVATAR
// ========================================

function CustomerAvatar({ name }) {
  const initials = String(name || "C")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E5F5F2] text-sm font-bold text-[#087F68]">
      {initials || "C"}
    </div>
  );
}

// ========================================
// INVOICE MOBILE CARD
// ========================================

function InvoiceMobileCard({ invoice, onEdit, onDelete, deleting }) {
  const status = getStatus(invoice);
  const canDelete = Number(invoice.paidAmount || 0) <= 0 && status !== "Paid";

  return (
    <article className="space-y-4 p-4 transition hover:bg-slate-50/70">

      <div className="flex items-start gap-3">
        <CustomerAvatar name={invoice.customerName} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">
            {invoice.customerName || "Customer"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {invoice.invoiceNumber || "Invoice number unavailable"}
          </p>

          {invoice.customerCode && (
            <p className="mt-1 text-xs text-slate-400">
              Customer Code: {invoice.customerCode}
            </p>
          )}
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-4">
        <div>
          <p className="text-[11px] text-slate-500">
            Invoice Date
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {formatDate(invoice.invoiceDate)}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-slate-500">
            Total Amount
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900">
            {currency(invoice.totalAmount)}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Subtotal {currency(invoice.subtotal)}
            {invoice.discountAmount > 0
              ? ` · Discount ${currency(invoice.discountAmount)}`
              : ""}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-slate-500">
            Amount Paid
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-700">
            {currency(invoice.paidAmount)}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-slate-500">
            Balance Due
          </p>
          <p className={`mt-1 text-sm font-bold ${
            invoice.balanceAmount > 0
              ? "text-rose-700"
              : "text-slate-800"
          }`}>
            {currency(invoice.balanceAmount)}
          </p>
        </div>
      </div>

      {invoice.periodStart && invoice.periodEnd && (
        <p className="text-xs text-slate-400">
          Billing period: {formatDate(invoice.periodStart)}
          {" – "}
          {formatDate(invoice.periodEnd)}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          to={`/invoices/${invoice.id}`}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#087F8C] transition hover:border-[#087F8C] hover:bg-[#E5F5F2]"
        >
          View <ArrowUpRight size={15} />
        </Link>
        <button
          type="button"
          onClick={() => onEdit(invoice)}
          disabled={status === "Void"}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#087F8C] hover:bg-[#E5F5F2] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Edit invoice ${invoice.invoiceNumber || ""}`}
        >
          <Pencil size={14} /> Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(invoice)}
          disabled={!canDelete || deleting}
          title={!canDelete ? "Invoices with recorded payments cannot be deleted" : "Delete invoice"}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Delete invoice ${invoice.invoiceNumber || ""}`}
        >
          <Trash2 size={14} /> {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </article>
  );
}

// ========================================
// INVOICES PAGE
// ========================================

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [businessId, setBusinessId] = useState("");
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editForm, setEditForm] = useState({
    invoice_date: "",
    period_start: "",
    period_end: "",
    due_date: "",
    notes: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  // ======================================
  // SEO METADATA
  // ======================================

  useEffect(() => {
    const previousTitle = document.title;

    const metaNames = ["description", "robots"];
    const savedMeta = metaNames.map((name) => {
      const existing = document.head.querySelector(
        `meta[name="${name}"]`
      );

      return {
        name,
        element: existing,
        content: existing?.getAttribute("content"),
      };
    });

    document.title = SEO.title;

    const description = savedMeta[0].element ||
      document.createElement("meta");

    description.setAttribute("name", "description");
    description.setAttribute("content", SEO.description);

    const robots = savedMeta[1].element ||
      document.createElement("meta");

    robots.setAttribute("name", "robots");
    robots.setAttribute("content", SEO.robots);

    if (!savedMeta[0].element) {
      document.head.appendChild(description);
    }

    if (!savedMeta[1].element) {
      document.head.appendChild(robots);
    }

    return () => {
      document.title = previousTitle;

      savedMeta.forEach(({ element, content }, index) => {
        const target = index === 0 ? description : robots;

        if (!element) {
          target.remove();
        } else if (content === null) {
          target.removeAttribute("content");
        } else {
          target.setAttribute("content", content);
        }
      });
    };
  }, []);

  // ======================================
  // LOAD INVOICES
  // ======================================

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Please log in to view invoices.");
      }

      const { data: business, error: businessError } =
        await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

      if (businessError) throw businessError;

      if (!business) {
        throw new Error("Business not found.");
      }

      setBusinessId(business.id);
      const invoiceData = await getInvoices(business.id);

      const customerIds = [
        ...new Set(
          invoiceData
            .map((invoice) => invoice.customer_id)
            .filter(Boolean)
        ),
      ];

      let customers = [];

      if (customerIds.length > 0) {
        const { data: customerData, error: customerError } =
          await supabase
            .from("customers")
            .select("id, name, code, phone")
            .eq("business_id", business.id)
            .in("id", customerIds);

        if (customerError) throw customerError;

        customers = customerData ?? [];
      }

      const customerMap = new Map(
        customers.map((customer) => [
          customer.id,
          customer,
        ])
      );

      const normalizedInvoices = invoiceData.map((invoice) => {
        const customer = customerMap.get(invoice.customer_id);

        const subtotal = Number(invoice.subtotal || 0);
        const discount = Number(invoice.discount_amount || 0);
        const total = Number(invoice.total_amount || 0);
        const paid = Number(invoice.amount_paid || 0);

        return {
          ...invoice,

          customerName: customer?.name || "Customer",
          customerCode: customer?.code || "",
          customerPhone: customer?.phone || "",

          invoiceNumber: invoice.invoice_number,
          invoiceDate: invoice.invoice_date,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end,

          subtotal,
          discountAmount: discount,
          totalAmount: total,
          paidAmount: paid,
          balanceAmount: Math.max(0, total - paid),
        };
      });

      setInvoices(normalizedInvoices);
    } catch (err) {
      console.error("Failed to load invoices:", err);

      setError(
        err?.message || "Unable to load invoices."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  // ======================================
  // INVOICE ACTIONS
  // ======================================

  function openEditInvoice(invoice) {
    setActionMessage("");
    setActionError("");
    setEditingInvoice(invoice);
    setEditForm({
      invoice_date: String(invoice.invoice_date || invoice.invoiceDate || "").slice(0, 10),
      period_start: String(invoice.period_start || invoice.periodStart || "").slice(0, 10),
      period_end: String(invoice.period_end || invoice.periodEnd || "").slice(0, 10),
      due_date: String(invoice.due_date || "").slice(0, 10),
      notes: invoice.notes || "",
    });
  }

  async function saveInvoiceEdits(event) {
    event.preventDefault();
    if (!editingInvoice || !businessId) return;

    if (!editForm.invoice_date) {
      setActionError("Invoice date is required.");
      return;
    }

    if (
      editForm.period_start &&
      editForm.period_end &&
      editForm.period_start > editForm.period_end
    ) {
      setActionError("Billing period start date cannot be after the end date.");
      return;
    }

    setSavingEdit(true);
    setActionError("");
    setActionMessage("");

    try {
      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          invoice_date: editForm.invoice_date,
          period_start: editForm.period_start || null,
          period_end: editForm.period_end || null,
          due_date: editForm.due_date || null,
          notes: editForm.notes.trim() || null,
        })
        .eq("id", editingInvoice.id)
        .eq("business_id", businessId);

      if (updateError) throw updateError;

      setEditingInvoice(null);
      setActionMessage(`Invoice ${editingInvoice.invoice_number || editingInvoice.invoiceNumber || ""} updated successfully.`);
      await loadInvoices();
    } catch (err) {
      console.error("Failed to update invoice:", err);
      setActionError(err?.message || "Unable to update invoice.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteInvoice(invoice) {
    if (!businessId) {
      setActionError("Business information is not available. Refresh and try again.");
      return;
    }

    if (Number(invoice.amount_paid ?? invoice.paidAmount ?? 0) > 0) {
      setActionError("This invoice has recorded payments and cannot be deleted.");
      return;
    }

    const invoiceLabel = invoice.invoice_number || invoice.invoiceNumber || "this invoice";
    const confirmed = window.confirm(
      `Delete ${invoiceLabel}? This permanently removes the invoice and its invoice lines. This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingInvoiceId(invoice.id);
    setActionError("");
    setActionMessage("");

    try {
      const { data: allocations, error: allocationError } = await supabase
        .from("payment_allocations")
        .select("id")
        .eq("business_id", businessId)
        .eq("invoice_id", invoice.id)
        .limit(1);

      if (allocationError) throw allocationError;

      if (allocations?.length) {
        throw new Error("This invoice has payment allocations and cannot be deleted. Keep it for the accounting record.");
      }

      const { data: deletedRows, error: deleteError } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoice.id)
        .eq("business_id", businessId)
        .select("id");

      if (deleteError) throw deleteError;
      if (!deletedRows?.length) {
        throw new Error("Invoice was not deleted. Check your permissions and try again.");
      }

      setActionMessage(`Invoice ${invoiceLabel} deleted successfully.`);
      await loadInvoices();
    } catch (err) {
      console.error("Failed to delete invoice:", err);
      setActionError(err?.message || "Unable to delete invoice.");
    } finally {
      setDeletingInvoiceId("");
    }
  }

  // ======================================
  // DATE FILTER RANGE
  // ======================================

  const effectiveDateRange = useMemo(() => {
    if (dateFilter === "custom") {
      return { startDate, endDate };
    }

    if (dateFilter === "all") {
      return { startDate: "", endDate: "" };
    }

    return getDateRange(dateFilter);
  }, [dateFilter, startDate, endDate]);

  // ======================================
  // FILTERED INVOICES
  // ======================================

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const customer = String(
        invoice.customerName || ""
      ).toLowerCase();

      const number = String(
        invoice.invoiceNumber || ""
      ).toLowerCase();

      const date = String(
        invoice.invoiceDate || ""
      ).slice(0, 10);

      const status = getStatus(invoice);

      const matchesSearch =
        !term ||
        customer.includes(term) ||
        number.includes(term) ||
        String(invoice.customerCode || "")
          .toLowerCase()
          .includes(term) ||
        String(invoice.customerPhone || "").includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        getStatusKey(status) === statusFilter;

      const matchesStartDate =
        !effectiveDateRange.startDate ||
        date >= effectiveDateRange.startDate;

      const matchesEndDate =
        !effectiveDateRange.endDate ||
        date <= effectiveDateRange.endDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    invoices,
    search,
    statusFilter,
    effectiveDateRange,
  ]);

  // ======================================
  // INVOICE SUMMARY
  // ======================================

  const summary = useMemo(() => {
    return filteredInvoices.reduce(
      (acc, invoice) => {
        const status = getStatus(invoice);

        // Void invoices are excluded from financial totals.
        if (status === "Void") return acc;

        const total = Number(invoice.totalAmount || 0);
        const paid = Number(invoice.paidAmount || 0);
        const due = Math.max(total - paid, 0);

        acc.total += total;
        acc.paid += paid;
        acc.due += due;
        acc.count += 1;

        if (
          status === "Unpaid" ||
          status === "Partially Paid"
        ) {
          acc.unpaid += 1;
        }

        return acc;
      },
      {
        total: 0,
        paid: 0,
        due: 0,
        count: 0,
        unpaid: 0,
      }
    );
  }, [filteredInvoices]);

  // ======================================
  // FILTER ACTIONS
  // ======================================

  function applyDateFilter(value) {
    setDateFilter(value);

    if (value !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("all");
    setStartDate("");
    setEndDate("");
  }

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    dateFilter !== "all" ||
    Boolean(startDate) ||
    Boolean(endDate);

  // ======================================
  // RENDER
  // ======================================

  return (
    <main className="min-h-screen bg-[#edf2f7] px-3 py-5 text-slate-900 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">

        {/* =================================
            ERROR MESSAGE
        ================================== */}

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={loadInvoices}
              className="inline-flex shrink-0 items-center gap-2 font-semibold underline"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* =================================
            SUMMARY CARDS
        ================================== */}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            title="Total Invoiced"
            value={loading ? "—" : currency(summary.total)}
            description={`${summary.count} active invoice records`}
            icon={FileText}
            tone="navy"
          />

          <SummaryCard
            title="Amount Collected"
            value={loading ? "—" : currency(summary.paid)}
            description="Payments recorded against invoices"
            icon={CheckCircle2}
            tone="teal"
          />

          <SummaryCard
            title="Outstanding Amount"
            value={loading ? "—" : currency(summary.due)}
            description="Remaining invoice balance"
            icon={Clock3}
            tone="amber"
          />

          <SummaryCard
            title="Unpaid / Partial"
            value={loading ? "—" : summary.unpaid.toLocaleString("en-IN")}
            description="Invoices requiring collection"
            icon={BadgePercent}
            tone="rose"
          />
        </section>

        {/* =================================
            SEARCH & FILTERS
        ================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            {/* SEARCH */}

            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search customer, invoice number, code or mobile..."
                aria-label="Search invoices"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
                
              )}
            </div>

            {/* FILTER TOGGLE */}

            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                filtersOpen || hasActiveFilters
                  ? "border-[#087F8C] bg-[#E5F5F2] text-[#087F8C]"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <CalendarDays size={17} />
              Filters

              {filtersOpen ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
             <Link
            to="/invoices/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087F8C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#066B76] focus:outline-none focus:ring-4 focus:ring-[#087F8C]/15"
          >
            <Plus size={17} />
            Create Invoice
          </Link>
          </div>

          {/* FILTER PANEL */}

          {filtersOpen && (
            <div className="mt-5 space-y-5 border-t border-slate-100 pt-5">

              {/* STATUS */}

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Invoice Status
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "All Statuses" },
                    { value: "paid", label: "Paid" },
                    { value: "partially_paid", label: "Partially Paid" },
                    { value: "unpaid", label: "Unpaid" },
                    { value: "draft", label: "Draft" },
                    { value: "void", label: "Void" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setStatusFilter(option.value)
                      }
                      aria-pressed={statusFilter === option.value}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        statusFilter === option.value
                          ? "border-[#087F8C] bg-[#087F8C] text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#087F8C] hover:bg-[#E5F5F2]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* DATE RANGE */}

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Invoice Date
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "All Dates" },
                    { value: "last7", label: "Last 7 Days" },
                    { value: "last15", label: "Last 15 Days" },
                    { value: "last30", label: "Last 30 Days" },
                    { value: "thisMonth", label: "This Month" },
                    { value: "previousMonth", label: "Previous Month" },
                    { value: "custom", label: "Custom Range" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => applyDateFilter(option.value)}
                      aria-pressed={dateFilter === option.value}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        dateFilter === option.value
                          ? "border-[#087F8C] bg-[#087F8C] text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#087F8C] hover:bg-[#E5F5F2]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CUSTOM DATE RANGE */}

              {dateFilter === "custom" && (
                <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
                  <label className="text-sm font-medium text-slate-600">
                    From date
                    <input
                      type="date"
                      value={startDate}
                      max={endDate || undefined}
                      onChange={(event) =>
                        setStartDate(event.target.value)
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-600">
                    To date
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(event) =>
                        setEndDate(event.target.value)
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10"
                    />
                  </label>
                </div>
              )}

              {/* RESET */}

              {hasActiveFilters && (
                <div className="flex justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#087F8C] transition hover:bg-[#E5F5F2]"
                  >
                    <RotateCcw size={15} />
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {(actionMessage || actionError) && (
          <div
            role={actionError ? "alert" : "status"}
            className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              actionError
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            <span>{actionError || actionMessage}</span>
            <button
              type="button"
              onClick={() => { setActionError(""); setActionMessage(""); }}
              className="shrink-0 rounded-md p-0.5 opacity-70 hover:opacity-100"
              aria-label="Dismiss message"
            >
              <XCircle size={16} />
            </button>
          </div>
        )}

        {/* =================================
            RECORDS HEADER
        ================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#E5F5F2] text-[#087F8C]">
                <ReceiptText size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Invoice Records
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Showing {filteredInvoices.length} of {invoices.length} invoices
                </p>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-400">
              {hasActiveFilters ? "Filtered results" : "All invoice records"}
            </p>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw
                size={27}
                className="animate-spin text-[#087F8C]"
              />
              <p className="text-sm">Loading invoices...</p>
            </div>

          ) : filteredInvoices.length === 0 ? (

            /* EMPTY STATE */

            <div className="flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">

              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#E5F5F2] text-[#087F8C]">
                <FileText size={28} />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                {invoices.length === 0
                  ? "No invoices created yet"
                  : "No matching invoices found"}
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {invoices.length === 0
                  ? "Create your first invoice to start managing customer billing and collections."
                  : "Try changing your search or filters to find the invoice."}
              </p>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw size={16} />
                  Clear Filters
                </button>
              ) : (
                <Link
                  to="/invoices/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#087F8C] px-5 py-3 text-sm font-semibold text-white hover:bg-[#066B76]"
                >
                  <Plus size={17} />
                  Create First Invoice
                </Link>
              )}
            </div>

          ) : (
            <>
              {/* MOBILE INVOICE CARDS */}

              <div className="divide-y divide-slate-100 md:hidden">
                {filteredInvoices.map((invoice) => (
                  <InvoiceMobileCard
                    key={invoice.id}
                    invoice={invoice}
                    onEdit={openEditInvoice}
                    onDelete={deleteInvoice}
                    deleting={deletingInvoiceId === invoice.id}
                  />
                ))}
              </div>

              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1000px] text-left text-sm">

                  <thead className="bg-[#F4F7F9] text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Customer / Invoice
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Invoice Date
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Total Amount
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Amount Paid
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Balance Due
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map((invoice) => {
                      const status = getStatus(invoice);

                      return (
                        <tr
                          key={invoice.id}
                          className="transition hover:bg-slate-50/70"
                        >
                          {/* CUSTOMER */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <CustomerAvatar
                                name={invoice.customerName}
                              />

                              <div className="min-w-0">
                                <Link
                                  to={`/invoices/${invoice.id}`}
                                  aria-label={`View invoice for ${invoice.customerName}`}
                                  className="inline-flex max-w-56 truncate font-semibold text-slate-900 transition hover:text-[#087F8C] hover:underline"
                                >
                                  {invoice.customerName || "Customer"}
                                </Link>

                                <p className="mt-1 text-xs text-slate-500">
                                  {invoice.invoiceNumber || "Invoice number unavailable"}
                                </p>

                                {invoice.customerCode && (
                                  <p className="mt-1 text-[11px] text-slate-400">
                                    Code: {invoice.customerCode}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* DATE */}

                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            <p>
                              {formatDate(invoice.invoiceDate)}
                            </p>

                            {invoice.periodStart && invoice.periodEnd && (
                              <p className="mt-1 text-[11px] text-slate-400">
                                {formatDate(invoice.periodStart)}
                                {" – "}
                                {formatDate(invoice.periodEnd)}
                              </p>
                            )}
                          </td>

                          {/* TOTAL */}

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <p className="font-bold tabular-nums text-slate-900">
                              {currency(invoice.totalAmount)}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                              Subtotal {currency(invoice.subtotal)}
                            </p>

                            {invoice.discountAmount > 0 && (
                              <p className="text-[10px] text-emerald-600">
                                Discount {currency(invoice.discountAmount)}
                              </p>
                            )}
                          </td>

                          {/* PAID */}

                          <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-emerald-700">
                            {currency(invoice.paidAmount)}
                          </td>

                          {/* DUE */}

                          <td className="whitespace-nowrap px-5 py-4 text-right font-bold tabular-nums">
                            <span
                              className={
                                invoice.balanceAmount > 0
                                  ? "text-rose-700"
                                  : "text-slate-700"
                              }
                            >
                              {currency(invoice.balanceAmount)}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">
                            <StatusBadge status={status} />
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                          
                              <button
                                type="button"
                                onClick={() => openEditInvoice(invoice)}
                                disabled={status === "Void"}
                                aria-label={`Edit invoice ${invoice.invoiceNumber || ""}`}
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#087F8C] hover:bg-[#E5F5F2] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteInvoice(invoice)}
                                disabled={Number(invoice.paidAmount || 0) > 0 || deletingInvoiceId === invoice.id}
                                title={Number(invoice.paidAmount || 0) > 0 ? "Invoices with recorded payments cannot be deleted" : "Delete invoice"}
                                aria-label={`Delete invoice ${invoice.invoiceNumber || ""}`}
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Trash2 size={13} /> 
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* RECORD COUNT FOOTER */}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
                <p className="text-xs text-slate-500">
                  {filteredInvoices.length} invoice record(s) displayed
                </p>

                <p className="text-xs font-medium text-slate-400">
                  Amounts shown in INR
                </p>
              </div>
            </>
          )}
        </section>

        {editingInvoice && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-5"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !savingEdit) {
                setEditingInvoice(null);
                setActionError("");
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-invoice-title"
              className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 id="edit-invoice-title" className="text-lg font-bold text-slate-900">
                    Edit Invoice
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {editingInvoice.invoice_number || editingInvoice.invoiceNumber || "Invoice"} · {editingInvoice.customerName || "Customer"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setEditingInvoice(null); setActionError(""); }}
                  disabled={savingEdit}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                  aria-label="Close edit invoice dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={saveInvoiceEdits} className="space-y-4 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Invoice Date <span className="text-rose-500">*</span>
                    <input
                      type="date"
                      required
                      value={editForm.invoice_date}
                      onChange={(event) => setEditForm((current) => ({ ...current, invoice_date: event.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Due Date
                    <input
                      type="date"
                      min={editForm.invoice_date || undefined}
                      value={editForm.due_date}
                      onChange={(event) => setEditForm((current) => ({ ...current, due_date: event.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Billing Period – From
                    <input
                      type="date"
                      value={editForm.period_start}
                      max={editForm.period_end || undefined}
                      onChange={(event) => setEditForm((current) => ({ ...current, period_start: event.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Billing Period – To
                    <input
                      type="date"
                      value={editForm.period_end}
                      min={editForm.period_start || undefined}
                      onChange={(event) => setEditForm((current) => ({ ...current, period_end: event.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10"
                    />
                  </label>
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Invoice Notes
                  <textarea
                    rows={3}
                    value={editForm.notes}
                    onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Add invoice notes..."
                    className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10"
                  />
                </label>

                <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
                  This editor changes invoice dates, billing period and notes only. Delivery lines, additional charges, totals and recorded payments remain unchanged.
                </p>

                {actionError && (
                  <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {actionError}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => { setEditingInvoice(null); setActionError(""); }}
                    disabled={savingEdit}
                    className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087F8C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#066B76] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={16} /> {savingEdit ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
