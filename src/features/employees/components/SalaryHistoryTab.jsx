
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Banknote,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
  Plus,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Wallet,
  ClipboardList,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

import { employeeService } from "../services/employeeService";
import { calculatePayroll, formatINR } from "../utils/payroll";

import {
  Empty,
  ErrorText,
  LoadingButton,
  Metric,
  Panel,
  StatusPill,
  dateLabel,
} from "./shared";

// Local date helper
function todayLocal() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const blank = () => ({
  transaction_date: todayLocal(),
  transaction_type: "salary_payment",
  amount: "",
  notes: "",
});

const transactionTypes = [
  {
    value: "salary_payment",
    label: "Salary Payment",
    description: "Regular monthly salary payment",
  },
  {
    value: "salary_advance",
    label: "Salary Advance",
    description: "Advance paid before salary settlement",
  },
  {
    value: "bonus",
    label: "Bonus",
    description: "Extra incentive or bonus",
  },
  {
    value: "personal_expense",
    label: "Personal Expense",
    description: "Employee expense paid by business",
  },
  {
    value: "adjustment",
    label: "Adjustment",
    description: "Salary correction or adjustment",
  },
];

function InputField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  step,
  placeholder,
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}

      <input
        type={type}
        value={value}
        required={required}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  );
}

function SummaryItem({ label, value, emphasis = false }) {
  return (
    <div
      className={`rounded-xl p-3 ${
        emphasis ? "border border-cyan-100 bg-cyan-50" : "bg-slate-50"
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-1 font-semibold tabular-nums text-slate-900">
        {formatINR(value)}
      </p>
    </div>
  );
}

export default function SalaryHistoryTab({ employee, month }) {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(blank);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Single dropdown for both payroll summary and transaction form
  const [payrollOpen, setPayrollOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");

      const result = await employeeService.transactions(employee.id);

      setTransactions(result || []);
    } catch (e) {
      setError(e);
    }
  }, [employee.id]);

  useEffect(() => {
    load();
  }, [load]);

  const payroll = useMemo(
    () => calculatePayroll(employee, transactions, month),
    [employee, transactions, month]
  );

  const selectedType = transactionTypes.find(
    (item) => item.value === form.transaction_type
  );

  function change(key, value) {
    setForm((old) => ({
      ...old,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(blank());
  }

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const amount = Number(form.amount);

      if (!form.transaction_date) {
        throw new Error("Select a transaction date.");
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a valid amount greater than zero.");
      }

      if (!form.transaction_type) {
        throw new Error("Select a transaction category.");
      }

      await employeeService.addTransaction({
        employee_id: employee.id,
        transaction_date: form.transaction_date,
        transaction_type: form.transaction_type,
        amount,
        notes: form.notes.trim() || null,
      });

      resetForm();

      setSuccess("Salary transaction saved successfully.");

      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">

      {/* PAYROLL TOP METRICS */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        <Metric
          label="Fixed salary"
          value={formatINR(payroll.fixedSalary)}
          icon={Banknote}
        />

        <Metric
          label="Additions"
          value={formatINR(payroll.additions)}
          icon={TrendingUp}
        />

        <Metric
          label="Deductions"
          value={formatINR(payroll.deductions)}
          icon={TrendingDown}
        />

        <Metric
          label="Balance payable"
          value={formatINR(payroll.remainingPayable)}
          icon={CircleDollarSign}
          hint={
            payroll.overpaid
              ? `Overpaid by ${formatINR(payroll.overpaid)}`
              : `Paid ${formatINR(payroll.paid)}`
          }
        />

      </div>

      <ErrorText error={error} />

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* SINGLE PAYROLL ACCORDION */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* DROPDOWN HEADER */}
        <button
          type="button"
          onClick={() => {
            setPayrollOpen((old) => !old);
            setError("");
            setSuccess("");
          }}
          aria-expanded={payrollOpen}
          className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-slate-50 sm:p-5"
        >

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <Wallet size={21} />
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900">
                Payroll Summary & Salary Transactions
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {month} · View salary breakdown and record payments
              </p>
            </div>

          </div>

          <div className="flex shrink-0 items-center gap-2">

            <span className="hidden rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 sm:inline">
              {payrollOpen ? "Close" : "View details"}
            </span>

            {payrollOpen ? (
              <ChevronUp size={20} className="text-slate-500" />
            ) : (
              <ChevronDown size={20} className="text-slate-500" />
            )}

          </div>

        </button>

        {/* DROPDOWN CONTENT */}
        {payrollOpen && (
          <div className="space-y-6 border-t border-slate-100 p-4 sm:p-5">

            {/* SECTION 1: PAYROLL SUMMARY */}
            <section>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900">
                  Payroll Breakdown
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Calculated from fixed salary and recorded financial transactions.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">

                <SummaryItem
                  label="Bonus"
                  value={payroll.bonus}
                />

                <SummaryItem
                  label="Positive adjustments"
                  value={payroll.posAdj}
                />

                <SummaryItem
                  label="Personal expenses"
                  value={payroll.personalExpenses}
                />

                <SummaryItem
                  label="Salary advances"
                  value={payroll.salaryAdvances}
                />

                <SummaryItem
                  label="Negative adjustments"
                  value={payroll.negAdj}
                />

                <SummaryItem
                  label="Net payable"
                  value={payroll.netPayable}
                  emphasis
                />

                <SummaryItem
                  label="Paid"
                  value={payroll.paid}
                />

                <SummaryItem
                  label="Remaining"
                  value={payroll.remainingPayable}
                  emphasis
                />

              </div>

            </section>

            <div className="border-t border-slate-100" />

            {/* SECTION 2: ADD TRANSACTION */}
            <section>

              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Plus size={19} className="text-cyan-700" />

                  <h4 className="font-semibold text-slate-900">
                    Add Salary Transaction
                  </h4>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Record salary payment, advance, bonus or employee expenses.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  <InputField
                    label="Transaction Date"
                    type="date"
                    value={form.transaction_date}
                    onChange={(v) => change("transaction_date", v)}
                    required
                  />

                  <label className="block text-sm font-medium text-slate-700">
                    Transaction Type

                    <select
                      required
                      value={form.transaction_type}
                      onChange={(e) =>
                        change("transaction_type", e.target.value)
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    >

                      {transactionTypes.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}

                    </select>
                  </label>

                  <InputField
                    label="Amount (₹)"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(v) => change("amount", v)}
                    placeholder="Enter amount"
                  />

                  <InputField
                    label="Payment Reference (Optional)"
                    value={form.notes}
                    onChange={(v) => change("notes", v)}
                    placeholder="Cash / UPI / reason"
                  />

                </div>

                {selectedType && (
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {selectedType.label}:
                    </span>{" "}
                    {selectedType.description}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    disabled={busy}
                    onClick={resetForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RotateCcw size={16} />
                    Reset
                  </button>

                  <LoadingButton busy={busy}>
                    <Plus size={16} />
                    Save Transaction
                  </LoadingButton>

                </div>

              </form>

            </section>

          </div>
        )}

      </div>

      {/* TRANSACTION HISTORY */}
      <Panel
        title="Salary Transaction History"
        subtitle={`${month} · All recorded employee transactions`}
      >

        {payroll.transactions.length ? (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px] text-left text-sm">

              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-3">Date</th>
                  <th className="pr-3">Transaction Type</th>
                  <th className="pr-3">Reference / Notes</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {payroll.transactions.map((t) => (

                  <tr key={t.id} className="transition hover:bg-slate-50">

                    <td className="py-3 pr-3 whitespace-nowrap">
                      {dateLabel(t.transaction_date)}
                    </td>

                    <td className="pr-3">
                      <StatusPill value={t.transaction_type} />
                    </td>

                    <td className="pr-3 text-slate-500">
                      {t.notes || t.reference || "—"}
                    </td>

                    <td className="text-right font-semibold tabular-nums text-slate-900">
                      {formatINR(t.amount)}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        ) : (

          <Empty>
            No salary transactions recorded for this month.
          </Empty>

        )}

      </Panel>

    </div>
  );
}
