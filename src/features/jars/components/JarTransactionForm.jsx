import { useEffect, useState } from "react";
import {
  PackagePlus, Truck, RotateCcw, AlertTriangle, Package,
  SlidersHorizontal, CalendarDays, FileText, UserRound, X, Save, LoaderCircle,
} from "lucide-react";

const OPTIONS = [
  { value: "opening", label: "Opening Stock", description: "Set initial warehouse stock", icon: PackagePlus },
  { value: "loaded", label: "Load to Employee", description: "Transfer jars to a driver", icon: Truck },
  { value: "unloaded", label: "Unload from Employee", description: "Return jars to warehouse", icon: RotateCcw },
  { value: "delivered", label: "Customer Delivery", description: "Record jars given to a customer", icon: Truck },
  { value: "returned", label: "Customer Return", description: "Record jars returned by a customer", icon: RotateCcw },
  { value: "damaged", label: "Damaged", description: "Remove damaged jars from stock", icon: AlertTriangle },
  { value: "lost", label: "Lost", description: "Record missing jars", icon: Package },
  { value: "adjustment", label: "Stock Adjustment", description: "Correct physical stock difference", icon: SlidersHorizontal },
];

const today = () => new Date().toISOString().slice(0, 10);
const INITIAL = {
  type: "opening", productId: "", customerId: "", employeeId: "",
  quantity: "1", adjustmentDirection: "increase", transactionDate: today(), notes: "",
};

export default function JarTransactionForm({
  products = [], customers = [], employees = [], onSubmit, onCancel, submitting = false,
}) {
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm((current) => ({ ...INITIAL, productId: products[0]?.id || current.productId || "" }));
    setError("");
  }, [products]);

  const needsCustomer = ["delivered", "returned", "damaged", "lost"].includes(form.type);
  const needsEmployee = ["loaded", "unloaded"].includes(form.type);
  const selected = OPTIONS.find((option) => option.value === form.type);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    setError("");
    const quantity = Number(form.quantity);
    if (!form.productId) return setError("Select a jar product.");
    if (!Number.isFinite(quantity) || quantity <= 0) return setError("Enter a quantity greater than zero.");
    if (needsCustomer && !form.customerId) return setError("Select a customer.");
    if (needsEmployee && !form.employeeId) return setError("Select an employee.");
    if (typeof onSubmit !== "function") return setError("Transaction submission is not configured.");
    try {
      await onSubmit({
        ...form,
        quantity,
        customerId: form.customerId || null,
        employeeId: form.employeeId || null,
        adjustmentDirection: form.type === "adjustment" ? form.adjustmentDirection : null,
        notes: form.notes.trim(),
      });
      setForm({ ...INITIAL, productId: products[0]?.id || "" });
    } catch (err) {
      setError(err?.message || "Unable to save transaction.");
    }
  }

  return (
    <form onSubmit={submit} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Record Jar Movement</h2>
          <p className="mt-1 text-sm text-slate-500">Select product and enter the inventory movement.</p>
        </div>
        {onCancel && <button type="button" onClick={onCancel} disabled={submitting} aria-label="Close form" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>}
      </div>

      <div className="space-y-5 p-5">
        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <fieldset disabled={submitting} className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <legend className="mb-3 text-sm font-semibold text-slate-700">Movement Type</legend>
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = form.type === option.value;
            return (
              <button key={option.value} type="button" onClick={() => update("type", option.value)} aria-pressed={active}
                className={`rounded-xl border p-3 text-left transition ${active ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600" : "border-slate-200 hover:bg-slate-50"}`}>
                <Icon size={18} className={active ? "text-teal-700" : "text-slate-500"} />
                <span className="mt-2 block text-sm font-semibold text-slate-800">{option.label}</span>
                <span className="mt-1 hidden text-xs text-slate-500 sm:block">{option.description}</span>
              </button>
            );
          })}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Jar Product *
            <select required value={form.productId} onChange={(e) => update("productId", e.target.value)} disabled={submitting}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-teal-600">
              <option value="">Select product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Quantity *
            <input type="number" min="0.001" step="0.001" required value={form.quantity}
              onChange={(e) => update("quantity", e.target.value)} disabled={submitting}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-teal-600" />
          </label>

          {needsCustomer && <label className="block text-sm font-semibold text-slate-700">
            Customer *
            <select required value={form.customerId} onChange={(e) => update("customerId", e.target.value)} disabled={submitting}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-teal-600">
              <option value="">Select customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.phone ? ` · ${customer.phone}` : ""}</option>)}
            </select>
          </label>}

          {needsEmployee && <label className="block text-sm font-semibold text-slate-700">
            Employee / Driver *
            <select required value={form.employeeId} onChange={(e) => update("employeeId", e.target.value)} disabled={submitting}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-teal-600">
              <option value="">Select employee</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
            </select>
          </label>}

          {form.type === "adjustment" && <label className="block text-sm font-semibold text-slate-700">
            Adjustment Direction *
            <select value={form.adjustmentDirection} onChange={(e) => update("adjustmentDirection", e.target.value)} disabled={submitting}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-teal-600">
              <option value="increase">Increase available stock</option>
              <option value="decrease">Decrease available stock</option>
            </select>
          </label>}

          <label className="block text-sm font-semibold text-slate-700">
            Transaction Date *
            <span className="relative mt-2 block">
              <CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="date" required value={form.transactionDate} onChange={(e) => update("transactionDate", e.target.value)} disabled={submitting}
                className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-3 font-normal outline-none focus:border-teal-600" />
            </span>
          </label>
        </div>

        <label className="block text-sm font-semibold text-slate-700">
          <span className="inline-flex items-center gap-2"><FileText size={15} /> Notes <span className="font-normal text-slate-400">Optional</span></span>
          <textarea rows={2} maxLength={1000} value={form.notes} onChange={(e) => update("notes", e.target.value)} disabled={submitting}
            placeholder="Add transaction details..." className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-teal-600" />
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
        {onCancel && <button type="button" onClick={onCancel} disabled={submitting} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>}
        <button type="submit" disabled={submitting || !products.length || (needsCustomer && !customers.length) || (needsEmployee && !employees.length)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">
          {submitting ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}
          {submitting ? "Saving..." : "Save Movement"}
        </button>
      </div>
    </form>
  );
}
