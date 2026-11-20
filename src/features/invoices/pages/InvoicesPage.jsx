
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Plus,
  RefreshCw,
  Search,
  X,
  RotateCcw,
  ArrowUpRight,
  ReceiptText,
  Pencil,
  Trash2,
  Save,
  XCircle,
  Wallet,
  SlidersHorizontal,
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

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

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
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "previousMonth":
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    default:
      return { startDate: "", endDate: "" };
  }

  return {
    startDate: toISODate(start),
    endDate: toISODate(end),
  };
};

// ========================================
// STATUS
// ========================================

const getStatus = (invoice) => {
  const rawStatus = String(invoice.status || "").toLowerCase();

  if (rawStatus === "void") return "Void";
  if (rawStatus === "draft") return "Draft";

  const total = Number(invoice.totalAmount ?? invoice.total_amount ?? 0);
  const paid = Number(invoice.paidAmount ?? invoice.amount_paid ?? 0);

  if (rawStatus === "paid" || (total > 0 && paid >= total)) return "Paid";
  if (rawStatus === "partially_paid" || paid > 0) return "Partially Paid";

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
// STATUS BADGE
// ========================================

function StatusBadge({ status }) {
  const dotClass = {
    Paid: "bg-emerald-600",
    "Partially Paid": "bg-amber-500",
    Unpaid: "bg-rose-500",
    Draft: "bg-slate-500",
    Void: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset sm:text-xs ${getStatusClass(status)}`}
    >
      <span className={`mr-1.5 size-1.5 rounded-full ${dotClass[status] || "bg-rose-500"}`} />
      {status}
    </span>
  );
}

// ========================================
// CUSTOMER AVATAR
// ========================================

function CustomerAvatar({ name, size = "normal" }) {
  const initials = String(name || "C")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-[#E5F5F2] font-bold text-[#087F68] ${
        size === "small" ? "size-9 text-xs" : "size-10 text-sm"
      }`}
    >
      {initials || "C"}
    </div>
  );
}

// ========================================
// MOBILE SUMMARY
// ========================================

function MobileSummary({ summary, loading }) {
  return (
    <section className="grid grid-cols-4 gap-2.5 sm:hidden">
      <article className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <FileText size={15} />
          <span className="text-[10px] font-semibold">Invoiced</span>
        </div>
        <p className="mt-2 text-base font-extrabold tracking-tight text-slate-900">
          {loading ? "—" : currency(summary.total)}
        </p>
      </article>

      <article className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 shadow-sm">
        <div className="flex items-center gap-2 text-amber-700">
          <Wallet size={15} />
          <span className="text-[10px] font-semibold">Outstanding</span>
        </div>
        <p className="mt-2 text-base font-extrabold tracking-tight text-amber-900">
          {loading ? "—" : currency(summary.due)}
        </p>
        
      </article>

      <article className="rounded-2xl border border-emerald-100 bg-white p-3.5 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 size={15} />
          <span className="text-[10px] font-semibold">Collected</span>
        </div>
        <p className="mt-2 text-base font-extrabold tracking-tight text-emerald-700">
          {loading ? "—" : currency(summary.paid)}
        </p>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <ReceiptText size={15} />
          <span className="text-[10px] font-semibold">Invoices</span>
        </div>
        <p className="mt-2 text-base font-extrabold tracking-tight text-slate-900">
          {loading ? "—" : summary.count.toLocaleString("en-IN")}
        </p>
      </article>
    </section>
  );
}

// ========================================
// DESKTOP SUMMARY CARD
// ========================================

function SummaryCard({ title, value, icon: Icon, tone, description }) {
  const tones = {
    navy: "bg-[#EAF0F7] text-[#244566]",
    teal: "bg-[#E5F5F2] text-[#087F68]",
    amber: "bg-[#FFF5E5] text-[#B7791F]",
    rose: "bg-[#FFF0F0] text-[#C34F55]",
  };

  return (
    <article className="hidden min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:block lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">{title}</p>
          <p className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 lg:text-2xl">
            {value}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{description}</p>
        </div>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
    </article>
  );
}

// ========================================
// MOBILE INVOICE CARD
// ========================================

function InvoiceMobileCard({ invoice, onEdit, onDelete, deleting }) {
  const status = getStatus(invoice);
  const canDelete =
    Number(invoice.paidAmount || 0) <= 0 && status !== "Paid";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-start gap-3">
        <CustomerAvatar name={invoice.customerName} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="max-w-full truncate text-sm font-bold text-slate-900">
              {invoice.customerName || "Customer"}
            </p>
            <StatusBadge status={status} />
          </div>

          <p className="mt-1 truncate text-[11px] text-slate-500">
            {invoice.invoiceNumber || "Invoice number unavailable"}
            {invoice.customerCode ? ` · ${invoice.customerCode}` : ""}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {formatDate(invoice.invoiceDate)}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium text-slate-500">Invoice total</p>
            <p className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">
              {currency(invoice.totalAmount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium text-slate-500">Balance due</p>
            <p className={`mt-1 text-lg font-extrabold tracking-tight ${
              invoice.balanceAmount > 0 ? "text-rose-700" : "text-emerald-700"
            }`}>
              {currency(invoice.balanceAmount)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2.5">
          <span className="text-[11px] text-slate-500">Received</span>
          <span className="text-xs font-bold text-emerald-700">
            {currency(invoice.paidAmount)}
          </span>
        </div>
      </div>

      {invoice.periodStart && invoice.periodEnd && (
        <p className="mt-2 text-[10px] text-slate-400">
          Billing: {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Link
          to={`/invoices/${invoice.id}`}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#087F8C] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#066B76]"
        >
          View invoice <ArrowUpRight size={14} />
        </Link>

        <button
          type="button"
          onClick={() => onEdit(invoice)}
          disabled={status === "Void"}
          aria-label={`Edit invoice ${invoice.invoiceNumber || ""}`}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
        >
          <Pencil size={15} />
        </button>

        <button
          type="button"
          onClick={() => onDelete(invoice)}
          disabled={!canDelete || deleting}
          title={!canDelete ? "Invoices with recorded payments cannot be deleted" : "Delete invoice"}
          aria-label={`Delete invoice ${invoice.invoiceNumber || ""}`}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
        >
          {deleting ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
        </button>
      </div>
    </article>
  );
}

// ========================================
// EDIT INVOICE MODAL
// ========================================

function EditInvoiceModal({
  editingInvoice,
  editForm,
  setEditForm,
  savingEdit,
  actionError,
  onClose,
  onSubmit,
}) {
  useEffect(() => {
    if (!editingInvoice) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editingInvoice]);

  if (!editingInvoice) return null;

  const updateField = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const fieldClass =
    "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !savingEdit) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-invoice-title"
        className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-4 py-4 sm:px-5">
          <div>
            <div className="mb-1 h-1 w-9 rounded-full bg-slate-200 sm:hidden" />
            <h2 id="edit-invoice-title" className="text-base font-bold text-slate-900 sm:text-lg">
              Edit Invoice
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {editingInvoice.invoice_number || editingInvoice.invoiceNumber || "Invoice"} · {editingInvoice.customerName || "Customer"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={savingEdit}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-40"
            aria-label="Close edit invoice dialog"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">
              Invoice Date *
              <input
                type="date"
                required
                value={editForm.invoice_date}
                onChange={(event) => updateField("invoice_date", event.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Due Date
              <input
                type="date"
                min={editForm.invoice_date || undefined}
                value={editForm.due_date}
                onChange={(event) => updateField("due_date", event.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Billing Period – From
              <input
                type="date"
                value={editForm.period_start}
                max={editForm.period_end || undefined}
                onChange={(event) => updateField("period_start", event.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Billing Period – To
              <input
                type="date"
                value={editForm.period_end}
                min={editForm.period_start || undefined}
                onChange={(event) => updateField("period_end", event.target.value)}
                className={fieldClass}
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-slate-600">
            Invoice Notes
            <textarea
              rows={3}
              value={editForm.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Add invoice notes..."
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal outline-none focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10"
            />
          </label>

          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-800">
            Only invoice dates, billing period and notes will change. Delivery lines, totals and recorded payments remain unchanged.
          </p>

          {actionError && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
              {actionError}
            </p>
          )}

          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white pt-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={savingEdit}
              className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={savingEdit}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087F8C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#066B76] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingEdit ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {savingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
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
  // SEO
  // ======================================

  useEffect(() => {
    const previousTitle = document.title;
    const metaNames = ["description", "robots"];

    const savedMeta = metaNames.map((name) => {
      const existing = document.head.querySelector(`meta[name="${name}"]`);
      return {
        name,
        element: existing,
        content: existing?.getAttribute("content"),
      };
    });

    document.title = SEO.title;

    const description = savedMeta[0].element || document.createElement("meta");
    description.setAttribute("name", "description");
    description.setAttribute("content", SEO.description);

    const robots = savedMeta[1].element || document.createElement("meta");
    robots.setAttribute("name", "robots");
    robots.setAttribute("content", SEO.robots);

    if (!savedMeta[0].element) document.head.appendChild(description);
    if (!savedMeta[1].element) document.head.appendChild(robots);

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
      if (!user) throw new Error("Please log in to view invoices.");

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (businessError) throw businessError;
      if (!business) throw new Error("Business not found.");

      setBusinessId(business.id);

      const invoiceData = await getInvoices(business.id);

      const customerIds = [
        ...new Set(invoiceData.map((invoice) => invoice.customer_id).filter(Boolean)),
      ];

      let customers = [];

      if (customerIds.length > 0) {
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("id, name, code, phone")
          .eq("business_id", business.id)
          .in("id", customerIds);

        if (customerError) throw customerError;
        customers = customerData ?? [];
      }

      const customerMap = new Map(
        customers.map((customer) => [customer.id, customer])
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
      setError(err?.message || "Unable to load invoices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  // ======================================
  // EDIT INVOICE
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

      const invoiceLabel =
        editingInvoice.invoice_number || editingInvoice.invoiceNumber || "";

      setEditingInvoice(null);
      setActionMessage(`Invoice ${invoiceLabel} updated successfully.`);
      await loadInvoices();
    } catch (err) {
      console.error("Failed to update invoice:", err);
      setActionError(err?.message || "Unable to update invoice.");
    } finally {
      setSavingEdit(false);
    }
  }

  // ======================================
  // DELETE INVOICE
  // ======================================

  async function deleteInvoice(invoice) {
    if (!businessId) {
      setActionError("Business information is not available. Refresh and try again.");
      return;
    }

    if (Number(invoice.amount_paid ?? invoice.paidAmount ?? 0) > 0) {
      setActionError("This invoice has recorded payments and cannot be deleted.");
      return;
    }

    const invoiceLabel =
      invoice.invoice_number || invoice.invoiceNumber || "this invoice";

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
        throw new Error(
          "This invoice has payment allocations and cannot be deleted. Keep it for the accounting record."
        );
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
    if (dateFilter === "custom") return { startDate, endDate };
    if (dateFilter === "all") return { startDate: "", endDate: "" };
    return getDateRange(dateFilter);
  }, [dateFilter, startDate, endDate]);

  // ======================================
  // FILTERED INVOICES
  // ======================================

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const customer = String(invoice.customerName || "").toLowerCase();
      const number = String(invoice.invoiceNumber || "").toLowerCase();
      const date = String(invoice.invoiceDate || "").slice(0, 10);
      const status = getStatus(invoice);

      const matchesSearch =
        !term ||
        customer.includes(term) ||
        number.includes(term) ||
        String(invoice.customerCode || "").toLowerCase().includes(term) ||
        String(invoice.customerPhone || "").includes(term);

      const matchesStatus =
        statusFilter === "all" || getStatusKey(status) === statusFilter;

      const matchesStartDate =
        !effectiveDateRange.startDate || date >= effectiveDateRange.startDate;

      const matchesEndDate =
        !effectiveDateRange.endDate || date <= effectiveDateRange.endDate;

      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [invoices, search, statusFilter, effectiveDateRange]);

  // ======================================
  // SUMMARY
  // ======================================

  const summary = useMemo(() => {
    return filteredInvoices.reduce(
      (acc, invoice) => {
        const status = getStatus(invoice);
        if (status === "Void") return acc;

        const total = Number(invoice.totalAmount || 0);
        const paid = Number(invoice.paidAmount || 0);

        acc.total += total;
        acc.paid += paid;
        acc.due += Math.max(total - paid, 0);
        acc.count += 1;

        if (status === "Unpaid" || status === "Partially Paid") {
          acc.unpaid += 1;
        }

        return acc;
      },
      { total: 0, paid: 0, due: 0, count: 0, unpaid: 0 }
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

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "paid", label: "Paid" },
    { value: "partially_paid", label: "Partial" },
    { value: "unpaid", label: "Unpaid" },
    { value: "draft", label: "Draft" },
    { value: "void", label: "Void" },
  ];

  const dateOptions = [
    { value: "all", label: "All dates" },
    { value: "last7", label: "7 days" },
    { value: "last15", label: "15 days" },
    { value: "last30", label: "30 days" },
    { value: "thisMonth", label: "This month" },
    { value: "previousMonth", label: "Previous month" },
    { value: "custom", label: "Custom" },
  ];

  // ======================================
  // RENDER
  // ======================================

  return (
    <main className="min-h-screen bg-[#F4F7F8] px-3 pb-24 pt-4 text-slate-900 sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 sm:p-4 sm:text-sm"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadInvoices()}
              className="inline-flex shrink-0 items-center gap-1 font-semibold"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* MOBILE SUMMARY */}
        <MobileSummary summary={summary} loading={loading} />

        {/* DESKTOP SUMMARY */}
        <section className="hidden grid-cols-2 gap-3 sm:grid xl:grid-cols-4">
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

        {/* SEARCH + FILTERS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer or invoice..."
                aria-label="Search invoices"
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-xs outline-none transition placeholder:text-slate-400 focus:border-[#087F8C] focus:bg-white focus:ring-4 focus:ring-[#087F8C]/10 sm:text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                filtersOpen || hasActiveFilters
                  ? "border-[#087F8C] bg-[#E5F5F2] text-[#087F8C]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && <span className="size-1.5 rounded-full bg-[#087F8C]" />}
              <ChevronDown
                size={14}
                className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* QUICK STATUS FILTER */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                aria-pressed={statusFilter === option.value}
                className={`min-h-8 shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                  statusFilter === option.value
                    ? "border-[#087F8C] bg-[#087F8C] text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:border-[#087F8C]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* EXPANDED FILTERS */}
          {filtersOpen && (
            <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Invoice date
                </p>
                <div className="flex flex-wrap gap-2">
                  {dateOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => applyDateFilter(option.value)}
                      aria-pressed={dateFilter === option.value}
                      className={`rounded-full border px-3 py-2 text-[11px] font-semibold transition ${
                        dateFilter === option.value
                          ? "border-[#087F8C] bg-[#087F8C] text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#087F8C]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {dateFilter === "custom" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-600">
                    From date
                    <input
                      type="date"
                      value={startDate}
                      max={endDate || undefined}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    To date
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10"
                    />
                  </label>
                </div>
              )}

              {hasActiveFilters && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#087F8C] hover:bg-[#E5F5F2]"
                  >
                    <RotateCcw size={14} /> Reset filters
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ACTION FEEDBACK */}
        {(actionMessage || actionError) && (
          <div
            role={actionError ? "alert" : "status"}
            className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-3 text-xs sm:px-4 sm:text-sm ${
              actionError
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            <span>{actionError || actionMessage}</span>
            <button
              type="button"
              onClick={() => {
                setActionError("");
                setActionMessage("");
              }}
              className="shrink-0 rounded-md p-0.5 opacity-70 hover:opacity-100"
              aria-label="Dismiss message"
            >
              <XCircle size={16} />
            </button>
          </div>
        )}

        {/* INVOICE RECORDS */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-3.5 sm:px-5 sm:py-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#E5F5F2] text-[#087F8C]">
                <ReceiptText size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  Invoice Records
                </h2>
                <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">
                  {filteredInvoices.length} of {invoices.length} invoices
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadInvoices()}
              disabled={loading}
              aria-label="Refresh invoices"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw size={25} className="animate-spin text-[#087F8C]" />
              <p className="text-xs">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#E5F5F2] text-[#087F8C]">
                <FileText size={25} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">
                {invoices.length === 0
                  ? "No invoices created yet"
                  : "No matching invoices"}
              </h3>
              <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                {invoices.length === 0
                  ? "Create your first invoice to start managing customer billing."
                  : "Try another search or change the selected filters."}
              </p>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw size={14} /> Clear filters
                </button>
              ) : (
                <Link
                  to="/invoices/new"
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#087F8C] px-4 text-xs font-semibold text-white hover:bg-[#066B76]"
                >
                  <Plus size={15} /> Create invoice
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* MOBILE CARDS */}
              <div className="space-y-2.5 bg-[#F7F9FA] p-2.5 md:hidden">
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
                      <th className="px-5 py-4 font-semibold">Customer / Invoice</th>
                      <th className="px-5 py-4 font-semibold">Invoice Date</th>
                      <th className="px-5 py-4 text-right font-semibold">Total Amount</th>
                      <th className="px-5 py-4 text-right font-semibold">Amount Paid</th>
                      <th className="px-5 py-4 text-right font-semibold">Balance Due</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map((invoice) => {
                      const status = getStatus(invoice);

                      return (
                        <tr key={invoice.id} className="transition hover:bg-slate-50/70">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <CustomerAvatar name={invoice.customerName} />
                              <div className="min-w-0">
                                <Link
                                  to={`/invoices/${invoice.id}`}
                                  className="inline-flex max-w-56 truncate font-semibold text-slate-900 hover:text-[#087F8C] hover:underline"
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

                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            <p>{formatDate(invoice.invoiceDate)}</p>
                            {invoice.periodStart && invoice.periodEnd && (
                              <p className="mt-1 text-[11px] text-slate-400">
                                {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
                              </p>
                            )}
                          </td>

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

                          <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-emerald-700">
                            {currency(invoice.paidAmount)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right font-bold tabular-nums">
                            <span className={invoice.balanceAmount > 0 ? "text-rose-700" : "text-slate-700"}>
                              {currency(invoice.balanceAmount)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={status} />
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/invoices/${invoice.id}`}
                                aria-label={`View invoice ${invoice.invoiceNumber || ""}`}
                                className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#087F8C] hover:bg-[#E5F5F2]"
                              >
                                <ArrowUpRight size={14} />
                              </Link>

                              <button
                                type="button"
                                onClick={() => openEditInvoice(invoice)}
                                disabled={status === "Void"}
                                aria-label={`Edit invoice ${invoice.invoiceNumber || ""}`}
                                className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                              >
                                <Pencil size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => void deleteInvoice(invoice)}
                                disabled={Number(invoice.paidAmount || 0) > 0 || deletingInvoiceId === invoice.id}
                                title={Number(invoice.paidAmount || 0) > 0 ? "Invoices with recorded payments cannot be deleted" : "Delete invoice"}
                                aria-label={`Delete invoice ${invoice.invoiceNumber || ""}`}
                                className="inline-flex size-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                              >
                                {deletingInvoiceId === invoice.id ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-white px-3.5 py-3 sm:px-5">
                <p className="text-[10px] text-slate-500 sm:text-xs">
                  {filteredInvoices.length} invoice record(s)
                </p>
                <p className="text-[10px] font-medium text-slate-400 sm:text-xs">
                  Amounts in INR
                </p>
              </div>
            </>
          )}
        </section>

        {/* MOBILE STICKY CREATE ACTION */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
          <Link
            to="/invoices/new"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#087F8C] text-sm font-bold text-white shadow-sm transition active:scale-[0.99]"
          >
            <Plus size={17} /> Create Invoice
          </Link>
        </div>

        {/* EDIT MODAL */}
        <EditInvoiceModal
          editingInvoice={editingInvoice}
          editForm={editForm}
          setEditForm={setEditForm}
          savingEdit={savingEdit}
          actionError={actionError}
          onClose={() => {
            setEditingInvoice(null);
            setActionError("");
          }}
          onSubmit={saveInvoiceEdits}
        />
      </div>
    </main>
  );
}
