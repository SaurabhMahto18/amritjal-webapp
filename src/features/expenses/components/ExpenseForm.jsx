
import { useState } from "react";

import {
  Save,
  X,
  CalendarDays,
  Receipt,
  IndianRupee,
  Wallet,
  FileText,
  CheckCircle2,
} from "lucide-react";

const categories = [
  { value: "fuel", label: "Fuel" },
  { value: "salary", label: "Salary" },
  { value: "rent", label: "Rent" },
  { value: "maintenance", label: "Maintenance" },
  { value: "supplies", label: "Supplies" },
  { value: "utilities", label: "Utilities" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
];

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const initialValues = {
  title: "",
  category: "fuel",
  amount: "",
  expense_date: getToday(),
  payment_method: "cash",
  notes: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100";

const labelClass =
  "mb-1.5 block text-sm font-medium text-slate-700";

export default function ExpenseForm({
  onSubmit,
  onCancel,
  initialData = {},
  submitLabel = "Save Expense",
}) {
  const [form, setForm] = useState(() => ({
    ...initialValues,
    ...initialData,
    amount: initialData.amount ?? "",
  }));

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) setError("");
  }

  function validate() {
    const title = form.title.trim();
    const amount = Number(form.amount);

    if (!title) {
      return "Please enter an expense title.";
    }

    if (title.length > 150) {
      return "Expense title cannot exceed 150 characters.";
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return "Enter a valid amount greater than zero.";
    }

    if (!form.expense_date) {
      return "Please select an expense date.";
    }

    if (
      !categories.some(
        (item) => item.value === form.category
      )
    ) {
      return "Please select a valid expense category.";
    }

    if (
      !paymentMethods.some(
        (item) => item.value === form.payment_method
      )
    ) {
      return "Please select a valid payment method.";
    }

    if (form.notes.length > 1000) {
      return "Notes cannot exceed 1000 characters.";
    }

    if (typeof onSubmit !== "function") {
      return "Expense submission is not configured.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setError("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      await onSubmit({
        ...form,
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category,
        expense_date: form.expense_date,
        payment_method: form.payment_method,
        notes: form.notes.trim(),
      });

    } catch (err) {
      setError(
        err?.message || "Unable to save the expense."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >

      {/* FORM HEADER */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">

        <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-700">
          <Receipt size={21} />
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">
            Expense Information
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Enter the details of your business expense.
          </p>
        </div>

      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* FORM FIELDS */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

        {/* TITLE */}
        <div className="md:col-span-2">

          <label
            htmlFor="expense-title"
            className={labelClass}
          >
            Expense Title *
          </label>

          <div className="relative">

            <Receipt
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="expense-title"
              name="title"
              type="text"
              required
              maxLength={150}
              disabled={saving}
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Vehicle fuel, Electricity bill"
              className={`${inputClass} pl-10`}
            />

          </div>

          <p className="mt-1 text-right text-xs text-slate-400">
            {form.title.length}/150
          </p>

        </div>

        {/* CATEGORY */}
        <div>

          <label
            htmlFor="expense-category"
            className={labelClass}
          >
            Expense Category *
          </label>

          <select
            id="expense-category"
            name="category"
            required
            disabled={saving}
            value={form.category}
            onChange={handleChange}
            className={inputClass}
          >

            {categories.map((category) => (
              <option
                key={category.value}
                value={category.value}
              >
                {category.label}
              </option>
            ))}

          </select>

        </div>

        {/* AMOUNT */}
        <div>

          <label
            htmlFor="expense-amount"
            className={labelClass}
          >
            Amount (₹) *
          </label>

          <div className="relative">

            <IndianRupee
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="expense-amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              disabled={saving}
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className={`${inputClass} pl-10`}
            />

          </div>

        </div>

        {/* DATE */}
        <div>

          <label
            htmlFor="expense-date"
            className={labelClass}
          >
            Expense Date *
          </label>

          <div className="relative">

            <CalendarDays
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="expense-date"
              name="expense_date"
              type="date"
              required
              disabled={saving}
              value={form.expense_date}
              onChange={handleChange}
              className={`${inputClass} pl-10`}
            />

          </div>

        </div>

        {/* PAYMENT METHOD */}
        <div>

          <label
            htmlFor="expense-payment-method"
            className={labelClass}
          >
            Payment Method *
          </label>

          <div className="relative">

            <Wallet
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              id="expense-payment-method"
              name="payment_method"
              required
              disabled={saving}
              value={form.payment_method}
              onChange={handleChange}
              className={`${inputClass} pl-10`}
            >

              {paymentMethods.map((method) => (
                <option
                  key={method.value}
                  value={method.value}
                >
                  {method.label}
                </option>
              ))}

            </select>

          </div>

        </div>

        {/* NOTES */}
        <div className="md:col-span-2">

          <label
            htmlFor="expense-notes"
            className={labelClass}
          >
            Additional Notes
            <span className="ml-1 font-normal text-slate-400">
              (Optional)
            </span>
          </label>

          <div className="relative">

            <FileText
              size={17}
              className="absolute left-3 top-3 text-slate-400"
            />

            <textarea
              id="expense-notes"
              name="notes"
              rows={4}
              maxLength={1000}
              disabled={saving}
              value={form.notes}
              onChange={handleChange}
              placeholder="Add payment reference, bill details or other remarks..."
              className={`${inputClass} resize-y pl-10`}
            />

          </div>

          <p className="mt-1 text-right text-xs text-slate-400">
            {form.notes.length}/1000
          </p>

        </div>

      </div>

      {/* FORM ACTIONS */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <X size={17} />
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
        >

          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save size={17} />
              {submitLabel}
            </>
          )}

        </button>

      </div>

    </form>
  );
}
