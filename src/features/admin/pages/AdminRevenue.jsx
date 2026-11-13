
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { adminRevenueService } from "../services/adminRevenueService";

// =====================================================
// HELPERS
// =====================================================

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const todayString = () => toLocalDateString(new Date());

const getDateBefore = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toLocalDateString(date);
};

const toDateTimeLocal = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

const statusStyles = {
  successful: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-purple-50 text-purple-700",
};

const paymentMethodLabel = (method) => {
  const labels = {
    upi: "UPI",
    cash: "Cash",
    bank_transfer: "Bank Transfer",
    other: "Other",
  };

  return labels[method] || method || "—";
};

const getPaymentReference = (payment) =>
  payment.reference_no ||
  payment.provider_payment_id ||
  payment.transaction_id ||
  "—";

// =====================================================
// COMMON COMPONENTS
// =====================================================

function MetricCard({ title, value, subtitle, icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <span className="text-xl">{icon}</span>
      </div>

      <h3 className="mt-3 text-2xl font-bold text-slate-900">
        {value}
      </h3>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function RevenueChart({ data = [] }) {
  const maxValue = Math.max(
    ...data.map((item) => Number(item.revenue) || 0),
    1
  );

  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-500">
        No revenue chart data available.
      </div>
    );
  }

  return (
    <div className="flex h-64 items-end gap-3 overflow-x-auto border-b border-slate-200 px-2 pt-5">
      {data.map((item) => {
        const revenue = Number(item.revenue) || 0;

        const height =
          revenue > 0
            ? Math.max((revenue / maxValue) * 85, 3)
            : 0;

        return (
          <div
            key={item.key}
            className="flex h-full min-w-9 flex-1 flex-col items-center justify-end gap-2"
          >
            <div className="flex h-full w-full items-end justify-center">
              <div
                className="w-full max-w-12 rounded-t-md bg-emerald-500 transition-all"
                style={{ height: `${height}%` }}
                title={`${item.label}: ${formatCurrency(revenue)}`}
              />
            </div>

            <span className="whitespace-nowrap text-[10px] text-slate-500">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }) {
  const style =
    statusStyles[status] || "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${style}`}
    >
      {status || "Unknown"}
    </span>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-all text-sm font-semibold text-slate-800">
        {value === null || value === undefined || value === ""
          ? "—"
          : String(value).replaceAll("_", " ")}
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100";

// =====================================================
// CSV EXPORT
// =====================================================

function downloadCSV(transactions) {
  if (!transactions?.length) return;

  const headers = [
    "Business",
    "Plan",
    "Amount",
    "Currency",
    "Payment Method",
    "Payment Provider",
    "Status",
    "Payment Date",
    "Reference",
    "Provider Payment ID",
  ];

  const rows = transactions.map((payment) => [
    payment.businesses?.name || "",
    payment.subscription_plans?.name || "",
    payment.amount,
    payment.currency || "INR",
    paymentMethodLabel(payment.payment_method),
    payment.payment_provider || "",
    payment.payment_status || "",
    payment.paid_at || payment.created_at || "",
    payment.reference_no || "",
    payment.provider_payment_id || "",
  ]);

  const escapeCSV = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `platform-payments-${todayString()}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

// =====================================================
// EDIT PAYMENT MODAL
// =====================================================

function EditPaymentModal({
  payment,
  onClose,
  onSave,
  saving,
}) {
  const [form, setForm] = useState({
    amount: String(payment.amount ?? ""),
    currency: payment.currency || "INR",
    payment_status: payment.payment_status || "pending",
    payment_method: payment.payment_method || "upi",
    payment_provider: payment.payment_provider || "",
    provider_payment_id: payment.provider_payment_id || "",
    reference_no: payment.reference_no || "",
    paid_at: toDateTimeLocal(payment.paid_at),
    billing_cycle: payment.billing_cycle || "",
    notes: payment.notes || "",
  });

  const [confirmSuccessful, setConfirmSuccessful] = useState(false);

  const updateField = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();

    if (
      Number(form.amount) < 0 ||
      !Number.isFinite(Number(form.amount))
    ) {
      return;
    }

    if (
      form.payment_status === "successful" &&
      payment.payment_status !== "successful" &&
      !confirmSuccessful
    ) {
      alert(
        "Please confirm that this payment has actually been received and verified."
      );
      return;
    }

    onSave({
      amount: Number(form.amount),
      currency: form.currency,
      payment_status: form.payment_status,
      payment_method: form.payment_method,
      payment_provider: form.payment_provider || null,
      provider_payment_id: form.provider_payment_id || null,
      reference_no: form.reference_no || null,
      paid_at: form.paid_at
        ? new Date(form.paid_at).toISOString()
        : null,
      billing_cycle: form.billing_cycle || null,
      notes: form.notes || null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Payment management
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Edit Payment
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              ID: {payment.id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            ✕
          </button>
        </header>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <Field label="Amount (INR)">
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) =>
                updateField("amount", e.target.value)
              }
              className={inputClass}
            />
          </Field>

          <Field label="Currency">
            <select
              value={form.currency}
              onChange={(e) =>
                updateField("currency", e.target.value)
              }
              className={inputClass}
            >
              <option value="INR">INR</option>
            </select>
          </Field>

          <Field label="Payment Status">
            <select
              value={form.payment_status}
              onChange={(e) =>
                updateField("payment_status", e.target.value)
              }
              className={inputClass}
            >
              <option value="pending">Pending</option>
              <option value="successful">Successful</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="rejected">Rejected</option>
            </select>
          </Field>

          <Field label="Payment Method">
            <select
              value={form.payment_method}
              onChange={(e) =>
                updateField("payment_method", e.target.value)
              }
              className={inputClass}
            >
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </Field>

          <Field label="Payment Provider">
            <input
              value={form.payment_provider}
              onChange={(e) =>
                updateField("payment_provider", e.target.value)
              }
              placeholder="e.g. UPI / Bank"
              className={inputClass}
            />
          </Field>

          <Field label="Provider Payment ID">
            <input
              value={form.provider_payment_id}
              onChange={(e) =>
                updateField("provider_payment_id", e.target.value)
              }
              className={inputClass}
            />
          </Field>

          <Field label="Reference / UTR Number">
            <input
              value={form.reference_no}
              onChange={(e) =>
                updateField("reference_no", e.target.value)
              }
              className={inputClass}
            />
          </Field>

          <Field label="Paid At">
            <input
              type="datetime-local"
              value={form.paid_at}
              onChange={(e) =>
                updateField("paid_at", e.target.value)
              }
              className={inputClass}
            />
          </Field>

          <Field label="Billing Cycle">
            <select
              value={form.billing_cycle}
              onChange={(e) =>
                updateField("billing_cycle", e.target.value)
              }
              className={inputClass}
            >
              <option value="">Not specified</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Admin Notes">
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  updateField("notes", e.target.value)
                }
                placeholder="Add payment notes..."
                className={inputClass}
              />
            </Field>
          </div>

          {form.payment_status === "successful" &&
            payment.payment_status !== "successful" && (
              <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={confirmSuccessful}
                  onChange={(e) =>
                    setConfirmSuccessful(e.target.checked)
                  }
                  className="mt-1"
                />

                <span className="text-amber-900">
                  I confirm that the payment has been received and
                  independently verified. I understand that changing
                  this status affects revenue reporting.
                </span>
              </label>
            )}
        </div>

        <footer className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </footer>
      </form>
    </div>
  );
}

// =====================================================
// DELETE CONFIRMATION MODAL
// =====================================================

function DeletePaymentModal({
  payment,
  onClose,
  onConfirm,
  deleting,
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  const isSuccessful =
    payment.payment_status === "successful";

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-payment-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl text-red-600">
          !
        </div>

        <h2
          id="delete-payment-title"
          className="mt-4 text-xl font-bold text-slate-900"
        >
          Delete Payment?
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          You are about to delete the payment record for{" "}
          <strong className="text-slate-800">
            {payment.businesses?.name || "this business"}
          </strong>
          .
        </p>

        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Amount</span>
            <strong>{formatCurrency(payment.amount)}</strong>
          </div>

          <div className="mt-2 flex justify-between text-sm">
            <span className="text-slate-500">Status</span>
            <StatusBadge status={payment.payment_status} />
          </div>

          <div className="mt-2 flex justify-between gap-3 text-sm">
            <span className="text-slate-500">Reference</span>
            <strong className="break-all text-right">
              {getPaymentReference(payment)}
            </strong>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800">
          Deleting this record is permanent. It does not issue a
          refund, reverse a bank transfer, or cancel a subscription.
          Preserve your accounting records before proceeding.
        </div>

        {isSuccessful && (
          <label className="mt-4 flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) =>
                setAcknowledged(e.target.checked)
              }
              className="mt-1"
            />

            <span>
              I understand this is a successful payment and confirm
              that I am authorised to remove this financial record.
            </span>
          </label>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={
              deleting || (isSuccessful && !acknowledged)
            }
            className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? "Deleting..." : "Delete Payment"}
          </button>
        </div>
      </section>
    </div>
  );
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function AdminRevenue() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [startDate, setStartDate] = useState(
    getDateBefore(365)
  );

  const [endDate, setEndDate] = useState(todayString());

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const [page, setPage] = useState(1);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(null);

  const [savingPayment, setSavingPayment] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const pageSize = 10;

  // ===================================================
  // LOAD ANALYTICS
  // ===================================================

  const loadAnalytics = useCallback(async () => {
    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result =
        await adminRevenueService.getRevenueAnalytics({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });

      setAnalytics(result);
      setPage(1);
    } catch (err) {
      setError(
        err.message || "Unable to load revenue analytics."
      );
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // ===================================================
  // FILTER TRANSACTIONS
  // ===================================================

  const filteredTransactions = useMemo(() => {
    if (!analytics) return [];

    const searchValue = search.trim().toLowerCase();

    return analytics.recentTransactions.filter((payment) => {
      const matchesStatus =
        statusFilter === "all" ||
        payment.payment_status === statusFilter;

      const matchesMethod =
        methodFilter === "all" ||
        payment.payment_method === methodFilter;

      const searchableText = [
        payment.businesses?.name,
        payment.subscription_plans?.name,
        payment.reference_no,
        payment.provider_payment_id,
        payment.payment_method,
        payment.payment_provider,
        payment.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue || searchableText.includes(searchValue);

      return matchesStatus && matchesMethod && matchesSearch;
    });
  }, [analytics, search, statusFilter, methodFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / pageSize)
  );

  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // ===================================================
  // REVENUE COMPARISON
  // ===================================================

  const change =
    analytics?.lastMonthRevenue > 0
      ? ((analytics.thisMonthRevenue -
          analytics.lastMonthRevenue) /
          analytics.lastMonthRevenue) *
        100
      : null;

  const maxPlanRevenue = Math.max(
    ...(analytics?.planRevenue || []).map(
      (plan) => Number(plan.revenue) || 0
    ),
    1
  );

  // ===================================================
  // FILTER ACTIONS
  // ===================================================

  const setQuickRange = (days) => {
    setStartDate(getDateBefore(days));
    setEndDate(todayString());
  };

  const resetFilters = () => {
    setStartDate(getDateBefore(365));
    setEndDate(todayString());
    setSearch("");
    setStatusFilter("all");
    setMethodFilter("all");
    setPage(1);
  };

  // ===================================================
  // EDIT PAYMENT
  // ===================================================

  const handleUpdatePayment = async (payload) => {
    if (!editingPayment) return;

    try {
      setSavingPayment(true);
      setError("");
      setSuccessMessage("");

      await adminRevenueService.updatePayment(
        editingPayment.id,
        payload
      );

      setEditingPayment(null);
      setSelectedPayment(null);

      setSuccessMessage("Payment updated successfully.");

      await loadAnalytics();
    } catch (err) {
      console.error("Update payment error:", err);
      setError(
        err.message || "Unable to update payment."
      );
    } finally {
      setSavingPayment(false);
    }
  };

  // ===================================================
  // DELETE PAYMENT
  // ===================================================

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;

    try {
      setDeleting(true);
      setError("");
      setSuccessMessage("");

      await adminRevenueService.deletePayment(
        deletingPayment.id
      );

      setDeletingPayment(null);
      setSelectedPayment(null);

      setSuccessMessage("Payment record deleted successfully.");

      await loadAnalytics();
    } catch (err) {
      console.error("Delete payment error:", err);
      setError(
        err.message || "Unable to delete payment."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-7">

      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Revenue & Payments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Platform subscription revenue and payment performance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadAnalytics}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/revenue/new")}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Record Payment
          </button>
        </div>
      </div>

      {/* FEEDBACK */}

      {successMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadAnalytics}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* DATE FILTERS */}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Start Date
            </label>

            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              max={todayString()}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            disabled={loading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Apply Filter
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={() => downloadCSV(filteredTransactions)}
            disabled={!filteredTransactions.length}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            ↓ Export CSV
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: "7 Days", days: 7 },
            { label: "30 Days", days: 30 },
            { label: "90 Days", days: 90 },
            { label: "12 Months", days: 365 },
          ].map((range) => (
            <button
              type="button"
              key={range.days}
              onClick={() => setQuickRange(range.days)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
            >
              {range.label}
            </button>
          ))}
        </div>
      </section>

      {/* INITIAL LOADING */}

      {loading && !analytics && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Loading revenue analytics...
        </div>
      )}

      {/* ANALYTICS */}

      {analytics && (
        <>
          {/* REVENUE METRICS */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(analytics.totalRevenue)}
              subtitle="Successful payments in selected period"
              icon="₹"
            />

            <MetricCard
              title="This Month"
              value={formatCurrency(analytics.thisMonthRevenue)}
              subtitle="Current calendar month"
              icon="📈"
            />

            <MetricCard
              title="Last Month"
              value={formatCurrency(analytics.lastMonthRevenue)}
              subtitle="Previous calendar month"
              icon="📅"
            />

            <MetricCard
              title="Pending Amount"
              value={formatCurrency(analytics.pendingAmount)}
              subtitle={`${analytics.statusCounts.pending} pending transactions`}
              icon="⏳"
            />
          </div>

          {/* SECONDARY METRICS */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              title="Refunded Amount"
              value={formatCurrency(analytics.refundedAmount)}
              subtitle={`${analytics.statusCounts.refunded} refunded transactions`}
              icon="↩"
            />

            <MetricCard
              title="Failed Payments"
              value={formatCurrency(analytics.failedAmount)}
              subtitle={`${analytics.statusCounts.failed} failed transactions`}
              icon="!"
            />

            <MetricCard
              title="Revenue Growth"
              value={
                change === null
                  ? "—"
                  : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`
              }
              subtitle="Current month vs previous month"
              icon="％"
            />
          </div>

          {/* MONTHLY REVENUE */}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Monthly Revenue
              </h2>

              <p className="text-sm text-slate-500">
                Successful subscription collections
              </p>
            </div>

            <RevenueChart data={analytics.monthlyRevenue} />
          </section>

          {/* PLAN REVENUE AND PAYMENT STATUS */}

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold text-slate-900">
                Plan-wise Revenue
              </h2>

              {analytics.planRevenue.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No successful subscription payments found.
                </p>
              ) : (
                <div className="space-y-5">
                  {analytics.planRevenue.map((plan) => (
                    <div key={plan.id}>
                      <div className="mb-2 flex justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {plan.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {plan.transactions} transactions
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(plan.revenue)}
                        </p>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{
                            width: `${(plan.revenue / maxPlanRevenue) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold text-slate-900">
                Payment Status
              </h2>

              <div className="space-y-4">
                {Object.entries(analytics.statusCounts).map(
                  ([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between border-b border-slate-100 pb-3"
                    >
                      <StatusBadge status={status} />

                      <span className="font-semibold text-slate-900">
                        {count}
                      </span>
                    </div>
                  )
                )}
              </div>
            </section>
          </div>

          {/* TRANSACTIONS */}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Payment Transactions
                </h2>

                <p className="text-sm text-slate-500">
                  {filteredTransactions.length} matching transactions
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/revenue/new")}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                + Add Transaction
              </button>
            </div>

            {/* SEARCH AND FILTERS */}

            <div className="grid grid-cols-1 gap-3 border-b border-slate-100 p-4 md:grid-cols-3">
              <input
                type="search"
                placeholder="Search business, plan, reference..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="successful">Successful</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">All Payment Methods</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* TABLE */}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Business</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedTransactions.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {payment.businesses?.name || "Unknown Business"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {payment.subscription_plans?.name || "—"}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {formatCurrency(payment.amount)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(
                          payment.paid_at || payment.created_at
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {paymentMethodLabel(payment.payment_method)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {getPaymentReference(payment)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={payment.payment_status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPayment(payment)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingPayment(payment)}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingPayment(payment)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {paginatedTransactions.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No transactions match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4">
              <p className="text-xs text-slate-500">
                Showing{" "}
                {filteredTransactions.length === 0
                  ? 0
                  : (page - 1) * pageSize + 1}
                {" "}to{" "}
                {Math.min(
                  page * pageSize,
                  filteredTransactions.length
                )}
                {" "}of {filteredTransactions.length}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  disabled={page === 1}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1)
                    )
                  }
                  disabled={page >= totalPages}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          {analytics.recordLimitReached && (
            <p className="text-xs text-amber-700">
              The query reached its 10,000-record limit.
              Older transactions may not be included.
            </p>
          )}
        </>
      )}

      {/* PAYMENT DETAILS MODAL */}

      {selectedPayment && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedPayment(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-detail-title"
            className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Payment Information
                </p>

                <h2
                  id="payment-detail-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Payment Details
                </h2>

                <p className="mt-1 max-w-[250px] truncate text-xs text-slate-400">
                  Payment ID: {selectedPayment.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                aria-label="Close payment details"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                ✕
              </button>
            </header>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Payment Amount
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {formatCurrency(selectedPayment.amount)}
                </p>

                <div className="mt-3">
                  <StatusBadge status={selectedPayment.payment_status} />
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-bold text-slate-900">
                  Transaction Information
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Business"
                    value={selectedPayment.businesses?.name}
                  />

                  <DetailItem
                    label="Plan"
                    value={selectedPayment.subscription_plans?.name}
                  />

                  <DetailItem
                    label="Payment Method"
                    value={paymentMethodLabel(selectedPayment.payment_method)}
                  />

                  <DetailItem
                    label="Payment Provider"
                    value={selectedPayment.payment_provider}
                  />

                  <DetailItem
                    label="Currency"
                    value={selectedPayment.currency || "INR"}
                  />

                  <DetailItem
                    label="Payment Date"
                    value={formatDateTime(
                      selectedPayment.paid_at ||
                      selectedPayment.created_at
                    )}
                  />

                  <DetailItem
                    label="Created At"
                    value={formatDateTime(selectedPayment.created_at)}
                  />

                  <DetailItem
                    label="Reference Number"
                    value={selectedPayment.reference_no}
                  />

                  <DetailItem
                    label="Provider Payment ID"
                    value={selectedPayment.provider_payment_id}
                  />

                  <DetailItem
                    label="Business ID"
                    value={selectedPayment.business_id}
                  />

                  <DetailItem
                    label="Plan ID"
                    value={selectedPayment.plan_id}
                  />

                  <DetailItem
                    label="Subscription ID"
                    value={selectedPayment.subscription_id}
                  />

                  <DetailItem
                    label="Billing Cycle"
                    value={selectedPayment.billing_cycle}
                  />
                </div>
              </div>

              {selectedPayment.notes && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Notes
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {selectedPayment.notes}
                  </p>
                </div>
              )}
            </div>

            <footer className="flex flex-wrap gap-3 border-t border-slate-200 p-5 sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setEditingPayment(selectedPayment);
                  setSelectedPayment(null);
                }}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Edit Payment
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeletingPayment(selectedPayment);
                  setSelectedPayment(null);
                }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete Payment
              </button>

              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold"
              >
                Close Details
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* EDIT MODAL */}

      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSave={handleUpdatePayment}
          saving={savingPayment}
        />
      )}

      {/* DELETE MODAL */}

      {deletingPayment && (
        <DeletePaymentModal
          payment={deletingPayment}
          onClose={() => setDeletingPayment(null)}
          onConfirm={handleDeletePayment}
          deleting={deleting}
        />
      )}
    </div>
  );
}
