import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Filter,
  LoaderCircle,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import paymentService from "../services/paymentService";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const methodLabels = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  card: "Card",
  cheque: "Cheque",
  wallet: "Wallet",
  other: "Other",
};

const purposeLabels = {
  customer_payment: "Customer Payment",
  employee_payment: "Employee Payment",
  refund: "Refund",
  advance: "Advance",
  other: "Other",
};

const displayDate = (value) => {
  if (!value) return "—";
  const parts = String(value).split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const SEO = {
  title: "Payments | Amrit Jal",
  description:
    "Manage customer payments, cash collections, UPI transfers, bank payments, payment records and printable receipts in Amrit Jal.",
  robots: "noindex, nofollow, noarchive",
};

function CustomerAvatar({ name }) {
  const initials = String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-800 ring-1 ring-cyan-200 sm:h-10 sm:w-10">
      {initials || "?"}
    </span>
  );
}

function ModalShell({ title, subtitle, onClose, children, footer }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="ml-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X size={19} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
        {footer && <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 p-3 sm:flex-row sm:justify-end sm:p-4">{footer}</footer>}
      </section>
    </div>
  );
}

function PaymentReceipt({ payment, onClose }) {
  if (!payment) return null;

  return (
    <ModalShell
      title="Payment Receipt"
      subtitle="Amrit Jal — R.O. Mineral Water Supplier"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">Close</button>
          <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">
            <Printer size={16} /> Print Receipt
          </button>
        </>
      }
    >
      <div id="payment-receipt-print" className="space-y-5">
        <div className="border-b border-dashed border-slate-300 pb-5 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={27} /></div>
          <p className="text-xs text-slate-500">Payment Recorded</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">{currency(payment.amount)}</p>
          <p className="mt-2 text-xs text-slate-500">Payment Date: {displayDate(payment.date)}</p>
        </div>
        <dl className="space-y-3 text-sm">
          <DetailRow label="Customer" value={payment.customerName || "Unknown Customer"} />
          <DetailRow label="Mobile" value={payment.customerPhone || "—"} />
          <DetailRow label="Payment Mode" value={methodLabels[payment.method] || payment.method || "—"} />
          <DetailRow label="Purpose" value={purposeLabels[payment.purpose] || payment.purpose || "—"} />
          <DetailRow label="Reference No." value={payment.referenceNo || "—"} />
          <DetailRow label="Payment ID" value={payment.id} mono />
          {payment.notes && <DetailRow label="Notes" value={payment.notes} />}
        </dl>
        <div className="border-t border-dashed border-slate-300 pt-4 text-center">
          <p className="text-sm font-medium text-slate-700">Thank you!</p>
          <p className="mt-1 text-xs text-slate-500">Amrit Jal — R.O. Mineral Water Supplier</p>
        </div>
      </div>
    </ModalShell>
  );
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className={`max-w-[68%] break-words text-right font-medium text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function PaymentDetails({ payment, onClose, onEdit, onDelete, onPrint }) {
  if (!payment) return null;

  return (
    <ModalShell
      title="Payment Details"
      subtitle={`Payment recorded on ${displayDate(payment.date)}`}
      onClose={onClose}
      footer={
        <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:justify-end">
          <button type="button" onClick={onEdit} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800 sm:text-sm">
            <Pencil size={15} /> Edit
          </button>
          <button type="button" onClick={onDelete} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 sm:text-sm">
            <Trash2 size={15} /> Delete
          </button>
          <button type="button" onClick={onPrint} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white sm:text-sm">
            <Printer size={15} /> Print
          </button>
        </div>
      }
    >
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-600"><Wallet size={20} /></div>
        <div>
          <p className="text-[11px] font-medium text-emerald-700">Amount collected</p>
          <p className="text-xl font-bold text-emerald-700">{currency(payment.amount)}</p>
        </div>
      </div>
      <dl className="space-y-3 rounded-xl border border-slate-200 p-3 text-sm">
        <DetailRow label="Customer" value={payment.customerName || "Unknown Customer"} />
        <DetailRow label="Mobile" value={payment.customerPhone || "—"} />
        <DetailRow label="Payment Date" value={displayDate(payment.date)} />
        <DetailRow label="Payment Mode" value={methodLabels[payment.method] || payment.method || "—"} />
        <DetailRow label="Purpose" value={purposeLabels[payment.purpose] || payment.purpose || "—"} />
        <DetailRow label="Reference No." value={payment.referenceNo || "—"} />
        <DetailRow label="Payment ID" value={payment.id} mono />
        {payment.notes && <DetailRow label="Notes" value={payment.notes} />}
      </dl>
    </ModalShell>
  );
}

function AddPaymentModal({ customers, employees, onClose, onSave, saving }) {
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  const [form, setForm] = useState({
    customerId: "",
    employeeId: "",
    amount: "",
    date: today,
    method: "cash",
    purpose: "customer_payment",
    referenceNo: "",
    notes: "",
    eventId: null,
  });
  const [formError, setFormError] = useState("");
  const updateField = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.customerId) {
      setFormError("Please select a customer.");
      return;
    }
    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }
    if (!form.date || form.date > today) {
      setFormError("Please select a valid payment date.");
      return;
    }
    if (form.notes.length > 500 || form.referenceNo.length > 120) {
      setFormError("Notes or reference number exceeds the allowed length.");
      return;
    }
    try {
      await onSave({ ...form, amount: Number(form.amount), employeeId: form.employeeId || null });
    } catch (error) {
      setFormError(error.message || "Unable to record payment.");
    }
  };

  const inputClass = "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-50 disabled:bg-slate-50";
  const labelClass = "mb-1 block text-[11px] font-semibold text-slate-700";
  const selectedCustomer = customers.find((customer) => customer.id === form.customerId);
  const selectedEmployee = employees.find((employee) => employee.id === form.employeeId);

  return (
    <ModalShell
      title="Record Payment"
      subtitle="Add a customer payment to your collection"
      onClose={onClose}
      footer={
        <div className="flex w-full flex-row gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="min-h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">Cancel</button>
          <button form="add-payment-form" type="submit" disabled={saving || customers.length === 0} className="inline-flex min-h-9 flex-[1.4] items-center justify-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving && <LoaderCircle size={15} className="animate-spin" />} {saving ? "Saving..." : "Save Payment"}
          </button>
        </div>
      }
    >
      <form id="add-payment-form" onSubmit={submit} className="space-y-3" noValidate>
        {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">{formError}</p>}

        {/* Section 1: Collection details */}
        <section className="rounded-xl border border-slate-200 p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">1. Collection Details</h3>
            <span className="text-[10px] text-slate-400">Customer & amount</span>
          </div>
          <div className="space-y-2.5">
            <div>
              <label htmlFor="add-payment-customer" className={labelClass}>Customer <span className="text-red-600">*</span></label>
              <select id="add-payment-customer" required value={form.customerId} disabled={saving} onChange={(e) => updateField("customerId", e.target.value)} className={inputClass}>
                <option value="">Select customer</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.phone ? ` — ${customer.phone}` : ""}</option>)}
              </select>
              {customers.length === 0 && <p className="mt-1 text-[10px] text-amber-700">No active customers available. Add a customer first.</p>}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="add-payment-employee" className={labelClass}>Received By</label>
                <select id="add-payment-employee" value={form.employeeId} disabled={saving} onChange={(e) => updateField("employeeId", e.target.value)} className={inputClass}>
                  <option value="">Select employee</option>
                  {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="add-payment-amount" className={labelClass}>Amount (₹) <span className="text-red-600">*</span></label>
                <input id="add-payment-amount" required min="0.01" step="0.01" type="number" inputMode="decimal" value={form.amount} disabled={saving} onChange={(e) => updateField("amount", e.target.value)} className={inputClass} placeholder="0.00" />
              </div>
            </div>
            <div>
              <label htmlFor="add-payment-date" className={labelClass}>Payment Date <span className="text-red-600">*</span></label>
              <input id="add-payment-date" required max={today} type="date" value={form.date} disabled={saving} onChange={(e) => updateField("date", e.target.value)} className={inputClass} />
            </div>
          </div>
        </section>

        {/* Section 2: Payment information */}
        <section className="rounded-xl border border-slate-200 p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">2. Payment Information</h3>
            <span className="text-[10px] text-slate-400">Mode & reference</span>
          </div>
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="add-payment-method" className={labelClass}>Payment Mode <span className="text-red-600">*</span></label>
                <select id="add-payment-method" value={form.method} disabled={saving} onChange={(e) => updateField("method", e.target.value)} className={inputClass}>
                  {Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="add-payment-reference" className={labelClass}>Reference No.</label>
                <input id="add-payment-reference" maxLength={120} value={form.referenceNo} disabled={saving} onChange={(e) => updateField("referenceNo", e.target.value)} className={inputClass} placeholder="Transaction ID" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="add-payment-notes" className={labelClass + " mb-0"}>Notes <span className="font-normal text-slate-400">(Optional)</span></label>
                <span className="text-[10px] text-slate-400">{form.notes.length}/500</span>
              </div>
              <textarea id="add-payment-notes" maxLength={500} rows={2} value={form.notes} disabled={saving} onChange={(e) => updateField("notes", e.target.value)} className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-50 disabled:bg-slate-50" placeholder="Additional details..." />
            </div>
          </div>
        </section>

        {selectedCustomer && (
          <div className="flex items-center justify-between rounded-lg bg-cyan-50 px-3 py-2 text-xs">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-800">{selectedCustomer.name}</p>
              <p className="truncate text-[10px] text-slate-500">{selectedEmployee ? `Received by ${selectedEmployee.name}` : "Received by —"}</p>
            </div>
            <strong className="ml-3 shrink-0 text-sm text-emerald-700">{currency(form.amount)}</strong>
          </div>
        )}
      </form>
    </ModalShell>
  );
}

function PaymentEditModal({ payment, customers, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    customerId: payment.customerId || "",
    amount: String(payment.amount ?? ""),
    date: payment.date || "",
    method: payment.method || "cash",
    purpose: payment.purpose || "customer_payment",
    referenceNo: payment.referenceNo || "",
    notes: payment.notes || "",
    eventId: payment.eventId || null,
  });
  const [formError, setFormError] = useState("");

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");
    try {
      await onSave(form);
    } catch (error) {
      setFormError(error.message || "Unable to update payment.");
    }
  };

  const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50";

  return (
    <ModalShell
      title="Edit Payment"
      subtitle="Update the payment information"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">Cancel</button>
          <button form="payment-edit-form" type="submit" disabled={saving} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving && <LoaderCircle size={15} className="animate-spin" />}
            Save Changes
          </button>
        </>
      }
    >
      <form id="payment-edit-form" onSubmit={submit} className="space-y-3">
        {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{formError}</p>}
        <div>
          <label htmlFor="edit-payment-customer" className="mb-1 block text-xs font-semibold text-slate-700">Customer</label>
          <select id="edit-payment-customer" required value={form.customerId} onChange={(e) => updateField("customerId", e.target.value)} className={inputClass}>
            <option value="">Select customer</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.phone ? ` — ${customer.phone}` : ""}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="edit-payment-amount" className="mb-1 block text-xs font-semibold text-slate-700">Amount (₹)</label>
            <input id="edit-payment-amount" required min="0.01" step="0.01" type="number" value={form.amount} onChange={(e) => updateField("amount", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="edit-payment-date" className="mb-1 block text-xs font-semibold text-slate-700">Payment Date</label>
            <input id="edit-payment-date" required type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="edit-payment-method" className="mb-1 block text-xs font-semibold text-slate-700">Payment Mode</label>
          <select id="edit-payment-method" value={form.method} onChange={(e) => updateField("method", e.target.value)} className={inputClass}>
            {Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="edit-payment-reference" className="mb-1 block text-xs font-semibold text-slate-700">Reference Number</label>
          <input id="edit-payment-reference" maxLength={120} value={form.referenceNo} onChange={(e) => updateField("referenceNo", e.target.value)} className={inputClass} placeholder="Transaction / cheque reference" />
        </div>
        <div>
          <label htmlFor="edit-payment-notes" className="mb-1 block text-xs font-semibold text-slate-700">Notes</label>
          <textarea id="edit-payment-notes" maxLength={500} rows={3} value={form.notes} onChange={(e) => updateField("notes", e.target.value)} className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50" placeholder="Optional notes" />
          <p className="mt-1 text-right text-[10px] text-slate-400">{form.notes.length}/500</p>
        </div>
      </form>
    </ModalShell>
  );
}

function PaymentTotal({ label, value, emphasis = false }) {
  return (
    <div className={`min-w-0 rounded-lg border p-2 sm:rounded-xl sm:p-3 ${emphasis ? "border-cyan-100 bg-cyan-50/70" : "border-slate-200 bg-white"}`}>
      <p className="truncate text-[9px] font-medium text-slate-500 sm:text-xs">{label}</p>
      <p className="mt-1 truncate text-[11px] font-bold tabular-nums text-slate-900 sm:text-sm">{currency(value)}</p>
    </div>
  );
}

export default function PaymentsPage() {
  const location = useLocation();

  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(location.state?.success || "");
  const [filterDate, setFilterDate] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [savingNewPayment, setSavingNewPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const robotsMeta = document.querySelector('meta[name="robots"]');
    const previousDescription = descriptionMeta?.getAttribute("content");
    const previousRobots = robotsMeta?.getAttribute("content");
    const description = descriptionMeta || document.createElement("meta");
    const robots = robotsMeta || document.createElement("meta");

    document.title = SEO.title;
    description.setAttribute("name", "description");
    description.setAttribute("content", SEO.description);
    robots.setAttribute("name", "robots");
    robots.setAttribute("content", SEO.robots);
    if (!descriptionMeta) document.head.appendChild(description);
    if (!robotsMeta) document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;
      if (descriptionMeta) {
        if (previousDescription === null) description.removeAttribute("content");
        else description.setAttribute("content", previousDescription);
      } else description.remove();
      if (robotsMeta) {
        if (previousRobots === null) robots.removeAttribute("content");
        else robots.setAttribute("content", previousRobots);
      } else robots.remove();
    };
  }, []);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await paymentService.getPayments();
      setPayments(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message || "Unable to load payment records.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const result = await paymentService.getCustomers();
      setCustomers(Array.isArray(result) ? result : []);
    } catch (err) {
      setError((current) => current || err.message || "Unable to load customers.");
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const result = await paymentService.getEmployees();
      setEmployees(Array.isArray(result) ? result : []);
    } catch (err) {
      setError((current) => current || err.message || "Unable to load employees.");
    }
  }, []);

  useEffect(() => {
    loadPayments();
    loadCustomers();
    loadEmployees();
  }, [loadPayments, loadCustomers, loadEmployees]);

  useEffect(() => {
    const handleUpdated = () => loadPayments();
    window.addEventListener("amrit-jal-payments-updated", handleUpdated);
    return () => window.removeEventListener("amrit-jal-payments-updated", handleUpdated);
  }, [loadPayments]);

  useEffect(() => {
    if (!selectedPayment && !receiptPayment && !editingPayment && !showDeleteConfirm && !showAddPayment) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedPayment(null);
        setReceiptPayment(null);
        setEditingPayment(null);
        setShowDeleteConfirm(false);
        setShowAddPayment(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPayment, receiptPayment, editingPayment, showDeleteConfirm, showAddPayment]);

  const activeFilterCount = Number(Boolean(filterDate)) + Number(filterMethod !== "all");
  const hasFilters = Boolean(search || filterDate || filterMethod !== "all");

  const visiblePayments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesDate = !filterDate || payment.date === filterDate;
      const matchesMethod = filterMethod === "all" || payment.method === filterMethod;
      const searchable = [
        payment.customerName,
        payment.customerPhone,
        payment.notes,
        payment.referenceNo,
        payment.id,
        methodLabels[payment.method] || payment.method,
      ];
      const matchesSearch = !term || searchable.some((value) => String(value || "").toLowerCase().includes(term));
      return matchesDate && matchesMethod && matchesSearch;
    });
  }, [payments, filterDate, filterMethod, search]);

  const totalCollected = visiblePayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const cashTotal = visiblePayments.filter((payment) => payment.method === "cash").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const digitalTotal = visiblePayments.filter((payment) => ["upi", "bank_transfer", "card", "wallet"].includes(payment.method)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const otherTotal = visiblePayments.filter((payment) => ["other", "cheque"].includes(payment.method)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const clearFilters = () => {
    setFilterDate("");
    setFilterMethod("all");
    setSearch("");
  };

  const openReceipt = (payment) => {
    setSelectedPayment(null);
    setReceiptPayment(payment);
  };

  const beginEdit = () => {
    setEditingPayment(selectedPayment);
    setSelectedPayment(null);
  };

  const saveEdit = async (form) => {
    if (!editingPayment) return;
    setSavingEdit(true);
    try {
      const updated = await paymentService.updatePayment(editingPayment.id, form);
      setPayments((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditingPayment(null);
      setSuccess("Payment updated successfully.");
    } catch (err) {
      throw err;
    } finally {
      setSavingEdit(false);
    }
  };

  const saveNewPayment = async (form) => {
    setSavingNewPayment(true);
    try {
      const created = await paymentService.createPayment(form);
      setPayments((current) => [created, ...current]);
      setShowAddPayment(false);
      setSuccess("Payment recorded successfully.");
    } catch (err) {
      throw err;
    } finally {
      setSavingNewPayment(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedPayment) return;
    setDeletingPayment(true);
    setError("");
    try {
      await paymentService.deletePayment(selectedPayment.id);
      setPayments((current) => current.filter((item) => item.id !== selectedPayment.id));
      setSelectedPayment(null);
      setShowDeleteConfirm(false);
      setSuccess("Payment deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete payment.");
      setShowDeleteConfirm(false);
    } finally {
      setDeletingPayment(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#edf2f7] text-slate-900">
      <div className="mx-auto w-full max-w-[1600px] space-y-3 px-3 py-3 sm:space-y-5 sm:px-6 sm:py-5 lg:px-8">


        {success && (
          <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 sm:p-4 sm:text-sm">
            <div className="flex items-start gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0" /><span>{success}</span></div>
            <button type="button" aria-label="Dismiss success message" onClick={() => setSuccess("")}><XCircle size={18} /></button>
          </div>
        )}
        {error && (
          <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 sm:p-4 sm:text-sm">
            <span>{error}</span>
            <button type="button" aria-label="Dismiss error" onClick={() => setError("")}><XCircle size={18} /></button>
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative min-w-0 flex justify-between gap-4">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, mobile, reference..." aria-label="Search payments" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50 sm:h-11 sm:text-sm" />


              <div className="">
                <button type="button" aria-expanded={showFilters} onClick={() => setShowFilters((value) => !value)} className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold sm:h-11 sm:px-4 sm:text-sm ${showFilters || activeFilterCount ? "border-cyan-200 bg-cyan-50 text-cyan-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  <Filter size={15} /> Filters
                  {activeFilterCount > 0 && <span className="rounded-full bg-cyan-700 px-1.5 py-0.5 text-[10px] text-white">{activeFilterCount}</span>}
                  <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>

          </div>

          {showFilters && (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-[minmax(180px,240px)_minmax(180px,240px)_auto] sm:items-end sm:gap-3">
              <div>
                <label htmlFor="paymentFilterDate" className="mb-1 block text-[11px] font-semibold text-slate-700 sm:text-xs">Payment Date</label>
                <div className="relative">
                  <CalendarDays size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="paymentFilterDate" type="date" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-1 text-[11px] outline-none focus:border-cyan-600 sm:text-xs" />
                </div>
              </div>
              <div>
                <label htmlFor="paymentFilterMethod" className="mb-1 block text-[11px] font-semibold text-slate-700 sm:text-xs">Payment Mode</label>
                <select id="paymentFilterMethod" value={filterMethod} onChange={(event) => setFilterMethod(event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-[11px] outline-none focus:border-cyan-600 sm:text-xs">
                  <option value="all">All Modes</option>
                  {Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              {hasFilters && <button type="button" onClick={clearFilters} className="col-span-2 justify-self-start rounded-lg px-2 py-2 text-[11px] font-semibold text-cyan-800 hover:bg-cyan-50 sm:col-span-1 sm:text-xs">Clear filters</button>}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-slate-500">
              <LoaderCircle size={26} className="animate-spin text-cyan-700" />
              <p className="text-xs">Loading payments...</p>
            </div>
          ) : visiblePayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-3 rounded-xl bg-cyan-50 p-3 text-cyan-700"><Wallet size={27} /></div>
              <h2 className="text-sm font-semibold text-slate-800">No payments found</h2>
              <p className="mt-1 max-w-sm text-xs text-slate-500">No payments match your search or filters.</p>
              {hasFilters && <button type="button" onClick={clearFilters} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">Clear filters</button>}
              <button type="button" onClick={() => setShowAddPayment(true)} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-xs font-semibold text-white"><Plus size={15} /> Record Payment</button>
            </div>
          ) : (
            <>
              {/* Small, tappable mobile cards. Tap anywhere on card for details. */}
              <div className="divide-y divide-slate-100 md:hidden">
                {visiblePayments.map((payment) => (
                  <button key={payment.id} type="button" onClick={() => setSelectedPayment(payment)} className="block w-full p-3 text-left transition hover:bg-slate-50 active:bg-cyan-50/60 sm:p-3.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <CustomerAvatar name={payment.customerName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-900">{payment.customerName || "Unknown Customer"}</p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-500">{payment.customerPhone || "No phone"} <span className="px-1 text-slate-300">•</span> {displayDate(payment.date)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums text-emerald-600">{currency(payment.amount)}</p>
                        <span className="mt-0.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600">{methodLabels[payment.method] || payment.method || "—"}</span>
                      </div>
                      <ChevronLeft size={15} className="rotate-180 shrink-0 text-slate-300" />
                    </div>
                    {payment.notes && <p className="mt-1.5 truncate pl-12 text-[10px] text-slate-400">{payment.notes}</p>}
                  </button>
                ))}
              </div>

              {/* Desktop / tablet table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] table-auto text-left text-sm">
                  <thead className="bg-[#edf2f7] text-xs text-slate-600 lg:text-sm">
                    <tr>
                      <th className="px-4 py-3.5 font-semibold lg:px-5">Customer</th>
                      <th className="px-4 py-3.5 font-semibold lg:px-5">Receiver</th>
                      <th className="px-4 py-3.5 text-right font-semibold lg:px-5">Amount</th>
                      <th className="px-4 py-3.5 font-semibold lg:px-5">Mode</th>
                      <th className="px-4 py-3.5 font-semibold lg:px-5">Date</th>
                      <th className="px-4 py-3.5 text-right font-semibold lg:px-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {visiblePayments.map((payment) => (
                      <tr key={payment.id} className="transition hover:bg-slate-50/70">
                        <td className="px-4 py-3 lg:px-5">
                          <div className="flex items-center gap-3">
                            <CustomerAvatar name={payment.customerName} />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">{payment.customerName || "Unknown Customer"}</p>
                              {payment.customerPhone && <p className="mt-0.5 text-xs text-slate-400">{payment.customerPhone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 lg:px-5">—</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-600 lg:px-5">{currency(payment.amount)}</td>
                        <td className="px-4 py-3 lg:px-5"><span className="rounded-md bg-slate-100 px-2 py-1.5 text-xs font-medium text-blue-700">{methodLabels[payment.method] || payment.method || "—"}</span></td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700 lg:px-5">{displayDate(payment.date)}</td>
                        <td className="px-4 py-3 text-right lg:px-5">
                          <div className="inline-flex items-center gap-1">
                            <button type="button" onClick={() => setSelectedPayment(payment)} aria-label="View payment" title="View details" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><Search size={15} /></button>
                            <button type="button" onClick={() => { setSelectedPayment(payment); setEditingPayment(payment); }} aria-label="Edit payment" title="Edit" className="rounded-lg p-2 text-cyan-700 hover:bg-cyan-50"><Pencil size={15} /></button>
                            <button type="button" onClick={() => { setSelectedPayment(payment); setShowDeleteConfirm(true); }} aria-label="Delete payment" title="Delete" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                            <button type="button" onClick={() => openReceipt(payment)} aria-label="Print receipt" title="Print receipt" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><Printer size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 bg-slate-50/70 px-2.5 py-3 sm:px-5 sm:py-4">
                <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                  <p className="text-[10px] text-slate-500 sm:text-sm">Showing <span className="font-semibold text-slate-700">{visiblePayments.length}</span> record{visiblePayments.length === 1 ? "" : "s"}</p>
                  {hasFilters && <button type="button" onClick={clearFilters} className="text-[10px] font-semibold text-cyan-800 sm:text-xs">Clear search</button>}
                </div>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                  <PaymentTotal label="Collected" value={totalCollected} emphasis />
                  <PaymentTotal label="Cash" value={cashTotal} />
                  <PaymentTotal label="Digital" value={digitalTotal} />
                  <PaymentTotal label="Other" value={otherTotal} />
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Floating mobile action + Event Payment style bottom-sheet modal */}
      <button type="button" onClick={() => setShowAddPayment(true)} className="fixed bottom-5 right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-cyan-700 px-5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:bg-cyan-800 active:scale-95 md:hidden">
        <Plus size={18} /> Add Payment
      </button>

      {showAddPayment && (
        <AddPaymentModal
          customers={customers}
          employees={employees}
          saving={savingNewPayment}
          onClose={() => !savingNewPayment && setShowAddPayment(false)}
          onSave={saveNewPayment}
        />
      )}

      {selectedPayment && !editingPayment && !showDeleteConfirm && (
        <PaymentDetails
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onEdit={beginEdit}
          onDelete={() => setShowDeleteConfirm(true)}
          onPrint={() => openReceipt(selectedPayment)}
        />
      )}

      {editingPayment && (
        <PaymentEditModal
          payment={editingPayment}
          customers={customers}
          saving={savingEdit}
          onClose={() => setEditingPayment(null)}
          onSave={saveEdit}
        />
      )}

      {showDeleteConfirm && selectedPayment && (
        <ModalShell
          title="Delete Payment?"
          subtitle="This action cannot be undone."
          onClose={() => !deletingPayment && setShowDeleteConfirm(false)}
          footer={
            <>
              <button type="button" disabled={deletingPayment} onClick={() => setShowDeleteConfirm(false)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
              <button type="button" disabled={deletingPayment} onClick={confirmDelete} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {deletingPayment && <LoaderCircle size={15} className="animate-spin" />}
                Delete Payment
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-600">Delete the payment of <strong>{currency(selectedPayment.amount)}</strong> received from <strong>{selectedPayment.customerName}</strong>?</p>
          <p className="mt-2 text-xs text-slate-500">The record will be permanently removed from this business account.</p>
        </ModalShell>
      )}

      {receiptPayment && (
        <>
          <style>
            {`
              @media print {
                body * { visibility: hidden !important; }
                #payment-receipt-print, #payment-receipt-print * { visibility: visible !important; }
                #payment-receipt-print {
                  position: absolute !important;
                  inset: 0 auto auto 0 !important;
                  width: 100% !important;
                  max-height: none !important;
                  overflow: visible !important;
                  padding: 24px !important;
                  background: white !important;
                }
                @page { size: auto; margin: 12mm; }
              }
            `}
          </style>
          <PaymentReceipt payment={receiptPayment} onClose={() => setReceiptPayment(null)} />
        </>
      )}
    </main>
  );
}
