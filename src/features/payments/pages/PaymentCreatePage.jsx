
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  LoaderCircle,
  Save,
  UserRound,
  Wallet,
} from "lucide-react";

import paymentService from "../services/paymentService";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const today = () => {
  const now = new Date();
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );
  return localDate.toISOString().slice(0, 10);
};

const paymentMethods = [
  { value: "cash", label: "Cash", description: "Cash received" },
  { value: "upi", label: "UPI", description: "QR or UPI app" },
  {
    value: "bank_transfer",
    label: "Bank Transfer",
    description: "Bank account",
  },
  { value: "other", label: "Other", description: "Other method" },
];

export default function PaymentCreatePage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [customerSearch, setCustomerSearch] = useState("");

  const [form, setForm] = useState({
    customerId: "",
    amount: "",
    date: today(),
    method: "cash",
    notes: "",
  });

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    setError("");

    try {
      const result = await paymentService.getCustomers();
      setCustomers(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message || "Unable to load customers.");
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = customers.filter((customer) => {
    const term = customerSearch.trim().toLowerCase();

    return (
      !term ||
      (customer.name || "").toLowerCase().includes(term) ||
      (customer.phone || "").toLowerCase().includes(term)
    );
  });

  const selectedCustomer = customers.find(
    (customer) => customer.id === form.customerId
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));

    setFieldErrors((current) => ({
      ...current,
      [field]: "",
    }));

    setError("");
  };

  const validateForm = () => {
    const errors = {};
    const amount = Number(form.amount);

    if (!form.customerId) {
      errors.customerId = "Please select a customer.";
    }

    if (
      form.amount.trim() === "" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      errors.amount = "Enter an amount greater than zero.";
    }

    if (
      !form.date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(form.date)
    ) {
      errors.date = "Please select a valid payment date.";
    } else {
      // Validate using local date parts. Comparing toISOString() can
      // incorrectly reject valid dates in timezones ahead of UTC (e.g. India).
      const [year, month, day] = form.date.split("-").map(Number);
      const parsedDate = new Date(year, month - 1, day);
      const isRealDate =
        Number.isInteger(year) &&
        Number.isInteger(month) &&
        Number.isInteger(day) &&
        parsedDate.getFullYear() === year &&
        parsedDate.getMonth() === month - 1 &&
        parsedDate.getDate() === day;

      if (!isRealDate) {
        errors.date = "Please select a valid payment date.";
      }
    }

    if (form.date && form.date > today()) {
      errors.date = "Payment date cannot be in the future.";
    }

    if (!paymentMethods.some((method) => method.value === form.method)) {
      errors.method = "Please select a valid payment method.";
    }

    if (form.notes.length > 500) {
      errors.notes = "Notes cannot exceed 500 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const payment = await paymentService.createPayment({
        customerId: form.customerId,
        amount: Number(form.amount),
        date: form.date,
        method: form.method,
        notes: form.notes.trim(),
      });

      navigate("/payments", {
        replace: true,
        state: {
          success: `Payment of ${currency(
            payment.amount
          )} recorded successfully.`,
          newPaymentId: payment.id,
        },
      });
    } catch (err) {
      setError(
        err.message || "Unable to record payment. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50";

  const fieldLabel =
    "mb-2 block text-sm font-medium text-slate-700";

  const fieldError = (message) =>
    message ? (
      <p className="mt-1.5 text-xs text-red-600" role="alert">
        {message}
      </p>
    ) : null;

  return (
    <main className="min-h-screen bg-[#edf2f7] px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="flex items-center gap-3">
          <Link
            to="/payments"
            aria-label="Back to payments"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Record Payment
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Amrit Jal · Record a customer collection
            </p>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <CircleAlert size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
                <Wallet size={22} />
              </span>

              <div>
                <h2 className="font-semibold">Payment Details</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Enter the details of the payment received.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-7">
            <div className="sm:col-span-2">
              <label htmlFor="customerSearch" className={fieldLabel}>
                Find Customer
              </label>

              <input
                id="customerSearch"
                type="search"
                value={customerSearch}
                onChange={(event) =>
                  setCustomerSearch(event.target.value)
                }
                placeholder="Search by customer name or phone..."
                className={`${inputClass} mb-3`}
              />

              <label htmlFor="customerId" className={fieldLabel}>
                Customer <span className="text-red-600">*</span>
              </label>

              <div className="relative">
                <UserRound
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  id="customerId"
                  value={form.customerId}
                  onChange={(event) =>
                    updateField("customerId", event.target.value)
                  }
                  disabled={loadingCustomers}
                  aria-invalid={Boolean(fieldErrors.customerId)}
                  className={`${inputClass} appearance-none pl-10 disabled:bg-slate-50`}
                >
                  <option value="">
                    {loadingCustomers
                      ? "Loading customers..."
                      : "Select a customer"}
                  </option>

                  {filteredCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.phone ? ` — ${customer.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {fieldError(fieldErrors.customerId)}

              {!loadingCustomers && customers.length === 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  No active customers found. Add or activate a customer first.
                </p>
              )}

              {!loadingCustomers &&
                customerSearch.trim() !== "" &&
                filteredCustomers.length === 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    No customers match your search.
                  </p>
                )}
            </div>

            <div>
              <label htmlFor="amount" className={fieldLabel}>
                Amount (₹) <span className="text-red-600">*</span>
              </label>

              <input
                id="amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  updateField("amount", event.target.value)
                }
                placeholder="Enter amount"
                aria-invalid={Boolean(fieldErrors.amount)}
                className={inputClass}
              />

              {fieldError(fieldErrors.amount)}

              {form.amount !== "" &&
                Number.isFinite(Number(form.amount)) &&
                Number(form.amount) > 0 && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Amount received: {currency(form.amount)}
                  </p>
                )}
            </div>

            <div>
              <label htmlFor="date" className={fieldLabel}>
                Payment Date <span className="text-red-600">*</span>
              </label>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="date"
                  type="date"
                  value={form.date}
                  max={today()}
                  onChange={(event) =>
                    updateField("date", event.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.date)}
                  className={`${inputClass} pl-10`}
                />
              </div>

              {fieldError(fieldErrors.date)}
            </div>

            <div className="sm:col-span-2">
              <label className={fieldLabel}>
                Payment Mode <span className="text-red-600">*</span>
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {paymentMethods.map((method) => {
                  const selected = form.method === method.value;

                  return (
                    <button
                      key={method.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => updateField("method", method.value)}
                      className={`rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-cyan-600 bg-cyan-50 ring-2 ring-cyan-100"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <CreditCard
                          size={17}
                          className={
                            selected
                              ? "text-cyan-700"
                              : "text-slate-400"
                          }
                        />
                        {method.label}
                        {selected && (
                          <CheckCircle2
                            size={15}
                            className="ml-auto text-cyan-700"
                          />
                        )}
                      </span>

                      <span className="mt-1 block text-xs text-slate-500">
                        {method.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              {fieldError(fieldErrors.method)}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="notes" className={fieldLabel}>
                Notes{" "}
                <span className="font-normal text-slate-400">
                  (Optional)
                </span>
              </label>

              <textarea
                id="notes"
                rows={3}
                maxLength={500}
                value={form.notes}
                onChange={(event) =>
                  updateField("notes", event.target.value)
                }
                placeholder="Transaction reference or additional details..."
                aria-invalid={Boolean(fieldErrors.notes)}
                className={`${inputClass} resize-y`}
              />

              <div className="mt-1 flex items-center justify-between">
                {fieldError(fieldErrors.notes)}
                <p className="ml-auto text-xs text-slate-400">
                  {form.notes.length}/500
                </p>
              </div>
            </div>

            {selectedCustomer && (
              <div className="sm:col-span-2 rounded-xl border border-cyan-100 bg-cyan-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-900">
                  Selected Customer
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {selectedCustomer.name}
                </p>

                <p className="mt-0.5 text-sm text-slate-600">
                  {selectedCustomer.phone || "No phone number"}
                </p>

                {Number(form.amount) > 0 && (
                  <div className="mt-3 border-t border-cyan-100 pt-3">
                    <p className="text-sm text-slate-600">
                      Payment to record
                    </p>
                    <p className="mt-1 text-xl font-bold text-emerald-700">
                      {currency(form.amount)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={() => navigate("/payments")}
              disabled={saving}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || loadingCustomers || customers.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving ? "Saving Payment..." : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
