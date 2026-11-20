
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Eye,
  LoaderCircle,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

import paymentService from "../../../payments/services/paymentService";

/* ---------------------------------------------
   Helpers
--------------------------------------------- */

const today = () => {
  const date = new Date();

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const displayDate = (value) => {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
};

const displayDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character];
  });

const getPaymentMethodLabel = (method) => {
  const labels = {
    cash: "Cash",
    cheque: "Cheque",
    upi: "UPI",
    bank_transfer: "Bank Transfer",
    wallet: "Wallet",
    card: "Card",
  };

  return labels[method] || String(method || "Other").replaceAll("_", " ");
};

const methods = [
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "upi", label: "Online" },
  { value: "wallet", label: "Wallet" },
];

const inputClass =
  "w-full min-h-12 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50";

/* ---------------------------------------------
   Empty Illustration
--------------------------------------------- */

function EmptyPaymentIllustration() {
  return (
    <div className="mx-auto flex w-full max-w-[330px] items-center justify-center py-5">
      <div className="relative flex aspect-[1.4/1] w-full items-center justify-center overflow-hidden rounded-[42%] bg-[#E7F6F9]">
        <svg
          viewBox="0 0 340 240"
          className="h-full w-full"
          role="img"
          aria-label="Payment illustration"
        >
          <ellipse cx="170" cy="216" rx="100" ry="10" fill="#D4EDF1" />

          <path
            d="M85 85 Q85 20 165 42 Q245 65 274 48 Q320 85 270 165 Q240 205 170 190 Q85 220 55 155 Q35 110 85 85Z"
            fill="#DDF2F6"
          />

          <path
            d="M108 83 Q106 46 135 45 Q161 46 162 76 L146 94 L116 91Z"
            fill="#36354A"
          />

          <circle cx="135" cy="84" r="20" fill="#F1B9B9" />

          <path
            d="M111 99 Q90 107 91 150 L103 178 L150 179 L166 129 L148 100Z"
            fill="#D4E0E6"
          />

          <path
            d="M111 169 L149 173 L145 210 L120 215 L105 204Z"
            fill="#353447"
          />

          <path
            d="M105 203 L130 208 L128 228 L99 228Z"
            fill="#353447"
          />

          <path
            d="M97 224 L128 224 Q139 231 126 235 L88 235 Q81 232 97 224Z"
            fill="#9B6465"
          />

          <path
            d="M148 108 L190 106 L212 126 L190 158 L148 154 L136 130Z"
            fill="#079FCB"
          />

          <path
            d="M148 108 L169 95 L211 104 L190 119Z"
            fill="#20B9DC"
          />

          <path
            d="M190 119 L212 126 L190 158 L190 119Z"
            fill="#087DA8"
          />

          <path
            d="M169 95 L190 82 L230 91 L211 104Z"
            fill="#0C91BB"
          />
        </svg>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   Common Field
--------------------------------------------- */

function Field({ label, required, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-[#299BB4]">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>

      {children}
    </label>
  );
}

/* ---------------------------------------------
   Payment Form Modal
--------------------------------------------- */

function PaymentModal({
  event,
  customers,
  employees,
  onClose,
  onSaved,
}) {
  const initialCustomerId = String(
    event?.customerId || event?.customer_id || ""
  );

  const [form, setForm] = useState({
    method: "cash",
    customerId: initialCustomerId,
    employeeId: "",
    date: today(),
    amount: "",
    notes: "",
    onlineMethod: "upi",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === String(form.customerId)
  );

  const selectedEmployee = employees.find(
    (employee) => String(employee.id) === String(form.employeeId)
  );

  function update(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm({
      method: "cash",
      customerId: initialCustomerId,
      employeeId: "",
      date: today(),
      amount: "",
      notes: "",
      onlineMethod: "upi",
    });

    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.customerId) {
      setError("Please select a customer.");
      return;
    }

    if (!form.employeeId) {
      setError("Please select the receiver name.");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    if (!form.date) {
      setError("Please select a payment date.");
      return;
    }

    if (form.date > today()) {
      setError("Payment date cannot be in the future.");
      return;
    }

    setSaving(true);

    try {
      const method =
        form.method === "upi"
          ? form.onlineMethod
          : form.method;

      await paymentService.createPayment({
        eventId: event.id,
        customerId: form.customerId,
        employeeId: form.employeeId,
        amount,
        date: form.date,
        method,
        purpose: "customer_payment",
        notes: form.notes.trim(),
      });

      await onSaved();
    } catch (err) {
      setError(
        err?.message || "Unable to record payment. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-payment-title"
        className="flex max-h-[95dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[26px] bg-white shadow-2xl sm:rounded-2xl"
      >
        <header className="relative shrink-0 bg-[#079FCB] px-5 pb-5 pt-5 text-white">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close payment form"
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-white/50 hover:bg-white/10"
          >
            <X size={20} />
          </button>

          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-[#079FCB]">
            <CreditCard size={29} />
          </div>

          <h2
            id="event-payment-title"
            className="mt-3 text-center text-xl font-semibold"
          >
            Payment Entry
          </h2>

          <p className="mt-1 text-center text-xs text-cyan-50">
            {event?.eventName || event?.event_name || "Event payment"}
          </p>
        </header>

        <form
          id="event-payment-form"
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5 sm:py-6"
        >
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700"
            >
              {error}
            </div>
          )}

          <Field label="Payment Mode" required>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {methods.map((method) => {
                const active = form.method === method.value;

                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => update("method", method.value)}
                    className={`min-h-12 rounded-xl border px-2 text-xs font-semibold transition ${
                      active
                        ? "border-[#079FCB] bg-cyan-50 text-[#078DB5]"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1">
                      {active && <CheckCircle2 size={14} />}
                      {method.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          {form.method === "upi" && (
            <Field label="Online Payment Type" required>
              <select
                value={form.onlineMethod}
                onChange={(e) => update("onlineMethod", e.target.value)}
                className={inputClass}
              >
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </Field>
          )}

          <Field label="Customer Name" required>
            <div className="relative">
              <select
                value={form.customerId}
                onChange={(e) => update("customerId", e.target.value)}
                className={`${inputClass} appearance-none pr-10`}
              >
                <option value="">Select customer</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {selectedCustomer?.phone && (
              <p className="mt-1.5 text-xs text-slate-500">
                Contact: {selectedCustomer.phone}
              </p>
            )}
          </Field>

          <Field label="Receiver Name" required>
            <div className="relative">
              <select
                value={form.employeeId}
                onChange={(e) => update("employeeId", e.target.value)}
                className={`${inputClass} appearance-none pr-10`}
              >
                <option value="">Select receiver</option>

                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {selectedEmployee?.phone && (
              <p className="mt-1.5 text-xs text-slate-500">
                {selectedEmployee.phone}
              </p>
            )}
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Amount" required>
              <input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                placeholder="₹ 0.00"
                className={inputClass}
              />
            </Field>

            <Field label="Select Date" required>
              <input
                type="date"
                max={today()}
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Remark">
            <textarea
              rows={3}
              maxLength={500}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Enter payment remark..."
              className={`${inputClass} resize-none`}
            />
          </Field>
        </form>

        <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-100 bg-white px-4 py-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:px-5">
          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
            className="min-h-12 rounded-xl border-2 border-[#079FCB] font-semibold text-[#079FCB] disabled:opacity-50"
          >
            Reset
          </button>

          <button
            type="submit"
            form="event-payment-form"
            disabled={saving}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#079FCB] font-semibold text-white shadow-md disabled:opacity-60"
          >
            {saving && (
              <LoaderCircle size={18} className="animate-spin" />
            )}

            {saving ? "Saving..." : "Add Payment"}
          </button>
        </footer>
      </section>
    </div>
  );
}

/* ---------------------------------------------
   Payment Details Modal
--------------------------------------------- */

function PaymentDetailsModal({
  payment,
  receiver,
  event,
  onClose,
  onPrint,
}) {
  if (!payment) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-details-title"
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[26px] bg-white shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between bg-[#079FCB] px-5 py-4 text-white">
          <div>
            <h2 id="payment-details-title" className="text-lg font-bold">
              Payment Details
            </h2>
            <p className="mt-1 text-xs text-cyan-50">
              {event?.eventName || event?.event_name || "Event"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="flex size-9 items-center justify-center rounded-full border border-white/50"
          >
            <X size={19} />
          </button>
        </header>

        <div className="p-5">
          <div className="rounded-2xl bg-cyan-50 px-4 py-5 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-white text-[#079FCB]">
              <Wallet size={25} />
            </div>

            <p className="mt-3 text-xs font-medium text-slate-500">
              Payment Received
            </p>

            <p className="mt-1 text-3xl font-extrabold text-slate-800">
              {currency(payment.amount)}
            </p>

            <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-cyan-700">
              {getPaymentMethodLabel(payment.method)}
            </span>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {[
              ["Customer", payment.customerName || "—"],
              ["Receiver", receiver?.name || "—"],
              ["Payment Date", displayDate(payment.date)],
              ["Payment Mode", getPaymentMethodLabel(payment.method)],
              ["Remark", payment.notes || "No remark"],
              ["Payment ID", payment.id || "—"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 py-3"
              >
                <span className="text-xs font-medium text-slate-400">
                  {label}
                </span>

                <span className="max-w-[65%] break-words text-right text-sm font-semibold text-slate-700">
                  {value}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onPrint(payment, receiver)}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#079FCB] text-sm font-bold text-white"
          >
            <Printer size={18} />
            Print Payment Receipt
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------
   Main Event Payment Tab
--------------------------------------------- */

export default function EventPaymentTab({ event }) {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  /* ---------------------------------------------
     Load data
  --------------------------------------------- */

  const loadData = useCallback(async () => {
    if (!event?.id) return;

    setLoading(true);
    setError("");

    try {
      const [paymentRows, customerRows, employeeRows] =
        await Promise.all([
          paymentService.getPayments({
            eventId: event.id,
          }),
          paymentService.getCustomers(),
          paymentService.getEmployees(),
        ]);

      setPayments(paymentRows || []);
      setCustomers(customerRows || []);
      setEmployees(employeeRows || []);
    } catch (err) {
      setError(err?.message || "Unable to load event payments.");
    } finally {
      setLoading(false);
    }
  }, [event?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* ---------------------------------------------
     Totals
  --------------------------------------------- */

  const totalCollected = useMemo(
    () =>
      payments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      ),
    [payments]
  );

  const cashCollected = useMemo(
    () =>
      payments
        .filter((payment) => payment.method === "cash")
        .reduce(
          (sum, payment) => sum + Number(payment.amount || 0),
          0
        ),
    [payments]
  );

  const digitalCollected = useMemo(
    () =>
      payments
        .filter((payment) =>
          ["upi", "bank_transfer", "wallet", "card"].includes(
            payment.method
          )
        )
        .reduce(
          (sum, payment) => sum + Number(payment.amount || 0),
          0
        ),
    [payments]
  );

  /* ---------------------------------------------
     Maps
  --------------------------------------------- */

  const employeeMap = useMemo(
    () =>
      new Map(
        employees.map((employee) => [
          String(employee.id),
          employee,
        ])
      ),
    [employees]
  );

  /* ---------------------------------------------
     Save callback
  --------------------------------------------- */

  async function handleSaved() {
    setModalOpen(false);
    setSuccess("Payment recorded successfully.");
    await loadData();
  }

  /* ---------------------------------------------
     Delete payment
  --------------------------------------------- */

  async function handleDelete(payment) {
    if (!payment?.id) return;

    const confirmed = window.confirm(
      `Delete this payment of ${currency(payment.amount)}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(payment.id);
    setError("");
    setSuccess("");

    try {
      if (typeof paymentService.deletePayment !== "function") {
        throw new Error(
          "deletePayment() is not available in paymentService. Add the delete method before using this action."
        );
      }

      await paymentService.deletePayment(payment.id);

      setPayments((previous) =>
        previous.filter(
          (item) => String(item.id) !== String(payment.id)
        )
      );

      if (
        selectedPayment &&
        String(selectedPayment.id) === String(payment.id)
      ) {
        setSelectedPayment(null);
      }

      setSuccess("Payment deleted successfully.");
    } catch (err) {
      setError(err?.message || "Unable to delete payment.");
    } finally {
      setDeletingId(null);
    }
  }

  /* ---------------------------------------------
     Print payment receipt
  --------------------------------------------- */

  function handlePrint(payment, receiver) {
    const printWindow = window.open(
      "",
      "_blank",
      "width=750,height=850"
    );

    if (!printWindow) {
      setError("Please allow pop-ups to print the payment receipt.");
      return;
    }

    const eventTitle =
      event?.eventName || event?.event_name || "Event";

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 32px;
              font-family: Arial, sans-serif;
              color: #242424;
              background: #fff;
            }
            .receipt {
              max-width: 650px;
              margin: 0 auto;
              border: 1px solid #dbe4e8;
              border-radius: 16px;
              overflow: hidden;
            }
            .header {
              background: #079FCB;
              color: #fff;
              padding: 28px;
              text-align: center;
            }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 8px 0 0; font-size: 13px; }
            .content { padding: 28px; }
            .amount {
              text-align: center;
              background: #e8f7fa;
              border-radius: 12px;
              padding: 22px;
              margin-bottom: 24px;
            }
            .amount small { color: #64748b; }
            .amount strong {
              display: block;
              font-size: 30px;
              margin-top: 8px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              padding: 13px 0;
              border-bottom: 1px solid #edf0f2;
              font-size: 14px;
            }
            .row span:first-child { color: #64748b; }
            .row span:last-child {
              font-weight: 600;
              text-align: right;
              overflow-wrap: anywhere;
            }
            .footer {
              margin-top: 28px;
              text-align: center;
              color: #94a3b8;
              font-size: 11px;
            }
            @media print {
              body { padding: 0; }
              .receipt { border: 0; }
            }
          </style>
        </head>
        <body>
          <main class="receipt">
            <header class="header">
              <h1>AMRIT JAL</h1>
              <p>Payment Receipt</p>
            </header>
            <section class="content">
              <div class="amount">
                <small>Amount Received</small>
                <strong>${escapeHtml(currency(payment.amount))}</strong>
              </div>

              <div class="row">
                <span>Event</span>
                <span>${escapeHtml(eventTitle)}</span>
              </div>
              <div class="row">
                <span>Customer</span>
                <span>${escapeHtml(payment.customerName || "—")}</span>
              </div>
              <div class="row">
                <span>Receiver</span>
                <span>${escapeHtml(receiver?.name || "—")}</span>
              </div>
              <div class="row">
                <span>Payment Date</span>
                <span>${escapeHtml(displayDate(payment.date))}</span>
              </div>
              <div class="row">
                <span>Payment Mode</span>
                <span>${escapeHtml(getPaymentMethodLabel(payment.method))}</span>
              </div>
              <div class="row">
                <span>Remark</span>
                <span>${escapeHtml(payment.notes || "—")}</span>
              </div>
              <div class="row">
                <span>Payment ID</span>
                <span>${escapeHtml(payment.id || "—")}</span>
              </div>

              <div class="footer">
                This is a computer-generated payment receipt.
              </div>
            </section>
          </main>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  }

  /* ---------------------------------------------
     Render
  --------------------------------------------- */

  return (
    <div className="relative min-h-[68dvh] overflow-hidden rounded-t-[24px] bg-white pb-28 shadow-sm">
      {/* Header */}
      <header className="flex items-center gap-3 bg-[#079FCB] px-4 py-5 text-white sm:px-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/70">
          <Wallet size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold sm:text-xl">
            Event Payment
          </h2>

          <p className="mt-0.5 truncate text-xs text-cyan-50">
            {event?.eventName || event?.event_name || "Payment history"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          aria-label="Refresh payments"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/50 transition hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw
            size={18}
            className={loading ? "animate-spin" : ""}
          />
        </button>
      </header>

      <div className="space-y-5 px-3 pt-4 sm:px-4 sm:pt-5">
        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Collection Summary */}
        <section className="space-y-3">
          <div className="rounded-2xl bg-[#E8F7FA] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-500">
                  Total Collection
                </span>

                <p className="mt-2 text-2xl font-extrabold text-slate-800 sm:text-3xl">
                  {currency(totalCollected)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {payments.length} payment record
                  {payments.length === 1 ? "" : "s"}
                </p>
              </div>

              <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#079FCB]">
                <Wallet size={24} />
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-white p-3 sm:p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CreditCard size={16} />
                </span>

                <span className="text-xs font-medium">
                  Cash Collection
                </span>
              </div>

              <p className="mt-3 break-words text-base font-bold text-slate-800 sm:text-lg">
                {currency(cashCollected)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-3 sm:p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="flex size-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                  <ArrowDownLeft size={16} />
                </span>

                <span className="text-xs font-medium">
                  Digital Collection
                </span>
              </div>

              <p className="mt-3 break-words text-base font-bold text-slate-800 sm:text-lg">
                {currency(digitalCollected)}
              </p>
            </div>
          </div>
        </section>

        {/* History Heading */}
        <section>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Payment History
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                View, print or delete payment records
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {payments.length} Records
            </span>
          </div>
        </section>

        {/* Payment Records */}
        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500">
            <LoaderCircle size={19} className="animate-spin" />
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center">
            <EmptyPaymentIllustration />

            <p className="mt-2 text-sm font-semibold text-slate-700">
              No Payments Found
            </p>

            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-400">
              Tap the plus button to add the first payment for this event.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => {
              const receiver = employeeMap.get(
                String(payment.employeeId || payment.employee_id || "")
              );

              const deleting =
                String(deletingId) === String(payment.id);

              return (
                <article
                  key={payment.id}
                  className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#079FCB]">
                      <ArrowDownLeft size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">
                            {payment.customerName ||
                              payment.customer_name ||
                              "Customer"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Receiver: {receiver?.name || "—"}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-extrabold text-emerald-600">
                            +{currency(payment.amount)}
                          </p>

                          <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold capitalize text-slate-600">
                            {getPaymentMethodLabel(payment.method)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} />
                          {displayDate(payment.date)}
                        </span>

                        {payment.createdAt || payment.created_at ? (
                          <span className="flex items-center gap-1">
                            <Clock3 size={12} />
                            {displayDateTime(
                              payment.createdAt || payment.created_at
                            )}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPayment(payment)}
                      className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-cyan-50 px-2 text-xs font-semibold text-cyan-700 transition active:scale-95"
                    >
                      <Eye size={15} />
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrint(payment, receiver)}
                      className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-2 text-xs font-semibold text-slate-700 transition active:scale-95"
                    >
                      <Printer size={15} />
                      Print
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(payment)}
                      disabled={deleting || Boolean(deletingId)}
                      className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-2 text-xs font-semibold text-rose-600 transition active:scale-95 disabled:opacity-50"
                    >
                      {deleting ? (
                        <LoaderCircle size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}

                      {deleting ? "Deleting" : "Delete"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Payment Button */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label="Add payment"
        className="fixed bottom-[calc(105px+env(safe-area-inset-bottom))] right-5 z-30 flex size-[62px] items-center justify-center rounded-full bg-[#079FCB] text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition hover:bg-[#078DB5] active:scale-95 sm:absolute sm:bottom-8 sm:right-7 sm:size-[68px]"
      >
        <Plus size={34} strokeWidth={2.2} />
      </button>

      {/* Add Payment Modal */}
      {modalOpen && (
        <PaymentModal
          event={event}
          customers={customers}
          employees={employees}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Payment Details Modal */}
      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          receiver={employeeMap.get(
            String(
              selectedPayment.employeeId ||
              selectedPayment.employee_id ||
              ""
            )
          )}
          event={event}
          onClose={() => setSelectedPayment(null)}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
}
