
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Plus,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  RotateCcw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { employeeService } from "../services/employeeService";

import {
  Empty,
  ErrorText,
  LoadingButton,
  Metric,
  Panel,
  SearchBox,
  dateLabel,
  money,
  useFilter,
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
  direction: "credit",
  amount: "",
  payment_method: "cash",
  description: "",
});

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

export default function EmployeeWalletTab({ employee, month }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add entry accordion
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");

      const result = await employeeService.walletTransactions(
        employee.id
      );

      setRows(result || []);
    } catch (e) {
      setError(e);
    }
  }, [employee.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Monthly entries
  const monthRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          String(r.transaction_date || "").slice(0, 7) === month
      ),
    [rows, month]
  );

  // Current balance from all wallet transactions
  const balance = useMemo(
    () =>
      rows.reduce((sum, r) => {
        const amount = Number(r.amount || 0);

        return sum + (r.direction === "credit" ? amount : -amount);
      }, 0),
    [rows]
  );

  const monthCredit = useMemo(
    () =>
      monthRows
        .filter((r) => r.direction === "credit")
        .reduce((sum, r) => sum + Number(r.amount || 0), 0),
    [monthRows]
  );

  const monthDebit = useMemo(
    () =>
      monthRows
        .filter((r) => r.direction === "debit")
        .reduce((sum, r) => sum + Number(r.amount || 0), 0),
    [monthRows]
  );

  // Sort ALL transactions chronologically before calculating running balance.
  // This keeps balances correct even when the user searches the ledger.
  const ledgerRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const dateCompare = String(a.transaction_date || "").localeCompare(
        String(b.transaction_date || "")
      );

      if (dateCompare !== 0) return dateCompare;

      return String(a.created_at || "").localeCompare(
        String(b.created_at || "")
      );
    });

    let runningBalance = 0;

    return sorted.map((r) => {
      const amount = Number(r.amount || 0);

      runningBalance +=
        r.direction === "credit" ? amount : -amount;

      return {
        ...r,
        running_balance: runningBalance,
      };
    });
  }, [rows]);

  const { query, setQuery, filtered } = useFilter(
    ledgerRows,
    ["direction", "description", "transaction_date", "payment_method"]
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
        throw new Error("Select a wallet transaction date.");
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter an amount greater than zero.");
      }

      if (!["credit", "debit"].includes(form.direction)) {
        throw new Error("Select a valid wallet entry type.");
      }

      if (!form.payment_method) {
        throw new Error("Select a payment method.");
      }

      await employeeService.addWalletTransaction({
        employee_id: employee.id,
        transaction_date: form.transaction_date,
        direction: form.direction,
        amount,
        payment_method: form.payment_method,
        description: form.description.trim() || null,
      });

      resetForm();

      setSuccess("Wallet entry saved successfully.");

      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const isCredit = form.direction === "credit";

  return (
    <div className="space-y-5">

      {/* WALLET SUMMARY */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">

        <Metric
          label="Current wallet balance"
          value={money(balance)}
          icon={Wallet}
          hint="All-time balance"
        />

        <Metric
          label="Month credit"
          value={money(monthCredit)}
          icon={ArrowDownLeft}
          hint="Money added"
        />

        <Metric
          label="Month debit"
          value={money(monthDebit)}
          icon={ArrowUpRight}
          hint="Money deducted"
        />

      </div>

      <ErrorText error={error} />

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* ADD WALLET ENTRY ACCORDION */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <button
          type="button"
          onClick={() => {
            setFormOpen((old) => !old);
            setError("");
            setSuccess("");
          }}
          aria-expanded={formOpen}
          className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-slate-50 sm:p-5"
        >

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <Wallet size={21} />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                Add Wallet Entry
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Record money added to or deducted from employee wallet
              </p>
            </div>

          </div>

          <div className="flex shrink-0 items-center gap-2">

            <span className="hidden rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 sm:inline">
              {formOpen ? "Close form" : "Add entry"}
            </span>

            {formOpen ? (
              <ChevronUp size={20} className="text-slate-500" />
            ) : (
              <ChevronDown size={20} className="text-slate-500" />
            )}

          </div>

        </button>

        {formOpen && (
          <div className="border-t border-slate-100 p-4 sm:p-5">

            <form onSubmit={submit} className="space-y-6">

              {/* ENTRY TYPE */}
              <section>

                <div className="mb-3 flex items-center gap-2">
                  <ClipboardList size={18} className="text-cyan-700" />

                  <h4 className="font-semibold text-slate-800">
                    Wallet Transaction Details
                  </h4>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">

                  <button
                    type="button"
                    onClick={() => change("direction", "credit")}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                      isCredit
                        ? "border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <ArrowDownLeft size={21} />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">
                        Credit
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Add money to employee wallet
                      </p>
                    </div>

                  </button>

                  <button
                    type="button"
                    onClick={() => change("direction", "debit")}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                      !isCredit
                        ? "border-rose-300 bg-rose-50 ring-1 ring-rose-200"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                      <ArrowUpRight size={21} />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">
                        Debit
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Deduct money from employee wallet
                      </p>
                    </div>

                  </button>

                </div>

              </section>

              <div className="border-t border-slate-100" />

              {/* TRANSACTION FIELDS */}
              <section>

                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays size={18} className="text-cyan-700" />

                  <h4 className="font-semibold text-slate-800">
                    Entry Information
                  </h4>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  <InputField
                    label="Transaction Date"
                    type="date"
                    value={form.transaction_date}
                    onChange={(v) => change("transaction_date", v)}
                    required
                  />

                  <InputField
                    label="Amount (₹)"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(v) => change("amount", v)}
                    placeholder="Enter amount"
                    required
                  />

                  <label className="block text-sm font-medium text-slate-700">
                    Payment Method

                    <select
                      required
                      value={form.payment_method}
                      onChange={(e) =>
                        change("payment_method", e.target.value)
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <InputField
                    label="Description"
                    value={form.description}
                    onChange={(v) => change("description", v)}
                    placeholder="Cash given, fuel, etc."
                  />

                </div>

                <div
                  className={`mt-4 rounded-xl border p-3 text-sm ${
                    isCredit
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  {isCredit
                    ? "Credit will increase the employee wallet balance."
                    : "Debit will decrease the employee wallet balance."}
                </div>

              </section>

              {/* ACTIONS */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>

                <LoadingButton busy={busy}>
                  <Plus size={16} />
                  Save Wallet Entry
                </LoadingButton>

              </div>

            </form>

          </div>
        )}

      </div>

      {/* WALLET LEDGER */}
      <Panel
        title="Wallet Ledger"
        subtitle="Chronological transaction history with running balance."
        action={
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search wallet entries..."
          />
        }
      >

        {filtered.length ? (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[750px] text-left text-sm">

              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-3">Date</th>
                  <th className="pr-3">Type</th>
                  <th className="pr-3">Description</th>
                  <th className="pr-3">Payment</th>
                  <th className="pr-3 text-right">Amount</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filtered.map((r) => {
                  const credit = r.direction === "credit";

                  return (
                    <tr
                      key={r.id}
                      className="transition hover:bg-slate-50"
                    >

                      <td className="py-3 pr-3 whitespace-nowrap text-slate-600">
                        {dateLabel(r.transaction_date)}
                      </td>

                      <td className="pr-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            credit
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {credit ? (
                            <ArrowDownLeft size={13} />
                          ) : (
                            <ArrowUpRight size={13} />
                          )}

                          {credit ? "Credit" : "Debit"}
                        </span>
                      </td>

                      <td className="pr-3 text-slate-500">
                        {r.description || "—"}
                      </td>

                      <td className="pr-3 capitalize text-slate-500">
                        {(r.payment_method || "cash").replaceAll("_", " ")}
                      </td>

                      <td
                        className={`pr-3 text-right font-semibold tabular-nums ${
                          credit
                            ? "text-emerald-700"
                            : "text-rose-700"
                        }`}
                      >
                        {credit ? "+" : "−"}
                        {money(r.amount)}
                      </td>

                      <td className="text-right font-medium tabular-nums text-slate-800">
                        {money(r.running_balance)}
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        ) : (

          <Empty>
            No wallet entries found.
          </Empty>

        )}

      </Panel>

    </div>
  );
}
