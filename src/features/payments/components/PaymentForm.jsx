
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  Save,
  UserRound,
  Wallet,
} from "lucide-react";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

const getToday = () => {
  const now = new Date();

  return new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

/**
 * Reusable payment form.
 *
 * Props:
 * customers: [{ id, name, phone }]
 * employees: [{ id, name, phone }]
 * initialValues: optional initial payment values
 * onSubmit: async function receiving
 * {
 *   customerId,
 *   employeeId,
 *   amount,
 *   date,
 *   method,
 *   notes
 * }
 * onCancel: optional cancel callback
 */

export default function PaymentForm({
  customers = [],
  employees = [],
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = "Save Payment",
  submitting = false,
  error = "",
}) {
  const [form, setForm] = useState({
    customerId: initialValues.customerId || "",
    employeeId: initialValues.employeeId || "",
    amount:
      initialValues.amount !== undefined
        ? String(initialValues.amount)
        : "",
    date: initialValues.date || getToday(),
    method: initialValues.method || "cash",
    notes: initialValues.notes || "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setForm({
      customerId: initialValues.customerId || "",
      employeeId: initialValues.employeeId || "",
      amount:
        initialValues.amount !== undefined
          ? String(initialValues.amount)
          : "",
      date: initialValues.date || getToday(),
      method: initialValues.method || "cash",
      notes: initialValues.notes || "",
    });
  }, [
    initialValues.customerId,
    initialValues.employeeId,
    initialValues.amount,
    initialValues.date,
    initialValues.method,
    initialValues.notes,
  ]);

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) => customer.id === form.customerId
      ),
    [customers, form.customerId]
  );

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) => employee.id === form.employeeId
      ),
    [employees, form.employeeId]
  );

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [field]: "",
    }));
  };

  const validate = () => {
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
      errors.amount = "Amount must be greater than zero.";
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      errors.date = "Please select a valid payment date.";
    } else {
      const parsed = new Date(`${form.date}T00:00:00`);

      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== form.date
      ) {
        errors.date = "Please select a valid payment date.";
      } else if (form.date > getToday()) {
        errors.date = "Payment date cannot be in the future.";
      }
    }

    if (
      !PAYMENT_METHODS.some(
        (item) => item.value === form.method
      )
    ) {
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

    if (submitting || !validate()) return;

    if (typeof onSubmit !== "function") return;

    await onSubmit({
      customerId: form.customerId,
      employeeId: form.employeeId || null,
      amount: Number(form.amount),
      date: form.date,
      method: form.method,
      notes: form.notes.trim(),
    });
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50 disabled:cursor-not-allowed disabled:bg-slate-50";

  const labelClass =
    "mb-2 block text-sm font-medium text-slate-700";

  const showError = (message) =>
    message ? (
      <p className="mt-1.5 text-xs text-red-600" role="alert">
        {message}
      </p>
    ) : null;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6"
    >
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Customer */}
      <div>
        <label
          htmlFor="payment-customer"
          className={labelClass}
        >
          Customer <span className="text-red-600">*</span>
        </label>

        <div className="relative">
          <UserRound
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <select
            id="payment-customer"
            value={form.customerId}
            onChange={(event) =>
              updateField("customerId", event.target.value)
            }
            aria-invalid={Boolean(fieldErrors.customerId)}
            className={`${inputClass} pl-10`}
            disabled={submitting}
          >
            <option value="">Select a customer</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
                {customer.phone ? ` — ${customer.phone}` : ""}
              </option>
            ))}
          </select>
        </div>

        {showError(fieldErrors.customerId)}

        {customers.length === 0 && (
          <p className="mt-1.5 text-xs text-amber-700">
            No customers are available. Add an active customer first.
          </p>
        )}
      </div>

      {/* Received By */}
      <div>
        <label
          htmlFor="payment-employee"
          className={labelClass}
        >
          Received By
          <span className="ml-1 font-normal text-slate-400">
            (Optional)
          </span>
        </label>

        <div className="relative">
          <UserRound
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <select
            id="payment-employee"
            value={form.employeeId}
            onChange={(event) =>
              updateField("employeeId", event.target.value)
            }
            className={`${inputClass} pl-10`}
            disabled={submitting}
          >
            <option value="">Select employee</option>

            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
                {employee.phone ? ` — ${employee.phone}` : ""}
              </option>
            ))}
          </select>
        </div>

        {employees.length === 0 && (
          <p className="mt-1.5 text-xs text-slate-500">
            No active employees available.
          </p>
        )}

        {selectedEmployee && (
          <p className="mt-1.5 text-xs text-slate-500">
            Payment received by {selectedEmployee.name}.
          </p>
        )}
      </div>

      {/* Amount and Date */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="payment-amount"
            className={labelClass}
          >
            Amount (₹) <span className="text-red-600">*</span>
          </label>

          <input
            id="payment-amount"
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
            disabled={submitting}
          />

          {showError(fieldErrors.amount)}

          {form.amount !== "" && Number(form.amount) > 0 && (
            <p className="mt-1.5 text-xs text-slate-500">
              {formatCurrency(form.amount)}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="payment-date"
            className={labelClass}
          >
            Payment Date <span className="text-red-600">*</span>
          </label>

          <div className="relative">
            <CalendarDays
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="payment-date"
              type="date"
              max={getToday()}
              value={form.date}
              onChange={(event) =>
                updateField("date", event.target.value)
              }
              aria-invalid={Boolean(fieldErrors.date)}
              className={`${inputClass} pl-10`}
              disabled={submitting}
            />
          </div>

          {showError(fieldErrors.date)}
        </div>
      </div>

      {/* Payment Mode */}
      <fieldset>
        <legend className={labelClass}>
          Payment Mode <span className="text-red-600">*</span>
        </legend>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PAYMENT_METHODS.map((method) => {
            const selected = form.method === method.value;

            return (
              <button
                key={method.value}
                type="button"
                aria-pressed={selected}
                disabled={submitting}
                onClick={() =>
                  updateField("method", method.value)
                }
                className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm font-medium transition disabled:opacity-50 ${
                  selected
                    ? "border-cyan-600 bg-cyan-50 text-cyan-900 ring-2 ring-cyan-100"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {selected ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <CreditCard size={17} />
                )}

                {method.label}
              </button>
            );
          })}
        </div>

        {showError(fieldErrors.method)}
      </fieldset>

      {/* Notes */}
      <div>
        <label
          htmlFor="payment-notes"
          className={labelClass}
        >
          Notes{" "}
          <span className="font-normal text-slate-400">
            (Optional)
          </span>
        </label>

        <textarea
          id="payment-notes"
          rows={3}
          maxLength={500}
          value={form.notes}
          onChange={(event) =>
            updateField("notes", event.target.value)
          }
          placeholder="Transaction reference or additional details..."
          aria-invalid={Boolean(fieldErrors.notes)}
          className={`${inputClass} resize-y`}
          disabled={submitting}
        />

        <div className="mt-1 flex justify-between">
          {showError(fieldErrors.notes)}

          <span className="ml-auto text-xs text-slate-400">
            {form.notes.length}/500
          </span>
        </div>
      </div>

      {/* Payment Summary */}
      {selectedCustomer && (
        <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-900">
            Payment Summary
          </p>

          <p className="mt-2 font-semibold text-slate-900">
            {selectedCustomer.name}
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {selectedCustomer.phone || "No phone number"}
          </p>

          {selectedEmployee && (
            <p className="mt-1 text-sm text-slate-600">
              Received By: {selectedEmployee.name}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2 border-t border-cyan-100 pt-3">
            <Wallet
              size={18}
              className="text-cyan-800"
            />

            <span className="text-sm text-slate-600">
              Amount
            </span>

            <strong className="ml-auto text-lg text-emerald-700">
              {formatCurrency(form.amount)}
            </strong>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={submitting || customers.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          ) : (
            <Save size={17} />
          )}

          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
