import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package, PackagePlus, Truck, RotateCcw, AlertTriangle, Boxes, RefreshCw,
  Search, CalendarDays, FileText, LoaderCircle, AlertCircle, CheckCircle2,
  Trash2, X, SlidersHorizontal,
} from "lucide-react";
import { jarService } from "../services/jarService";
import JarTransactionForm from "../components/JarTransactionForm";

const META = {
  opening: ["Opening Stock", "bg-emerald-50 text-emerald-700"],
  loaded: ["Loaded to Employee", "bg-blue-50 text-blue-700"],
  unloaded: ["Unloaded to Warehouse", "bg-cyan-50 text-cyan-800"],
  delivered: ["Customer Delivery", "bg-indigo-50 text-indigo-700"],
  returned: ["Customer Return", "bg-teal-50 text-teal-700"],
  damaged: ["Damaged", "bg-amber-50 text-amber-700"],
  lost: ["Lost", "bg-rose-50 text-rose-700"],
  adjustment: ["Adjustment", "bg-violet-50 text-violet-700"],
};

const dateLabel = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

function Stat({ label, value, detail, icon: Icon, tone = "teal" }) {
  const tones = {
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value ?? "—"}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div>
      <span className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={19} /></span>
    </div>
  </div>;
}

function Badge({ type }) {
  const [label, classes] = META[type] || [type || "Unknown", "bg-slate-100 text-slate-600"];
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}

export default function JarManagementPage() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [physicalStock, setPhysicalStock] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tx, productRows, customerRows, employeeRows, inventory] = await Promise.all([
        jarService.getTransactions(),
        jarService.getProducts(),
        jarService.getCustomers(),
        jarService.getEmployees(),
        jarService.getInventorySummary(),
      ]);
      setTransactions(tx);
      setProducts(productRows);
      setCustomers(customerRows);
      setEmployees(employeeRows);
      setSummary(inventory);
      setSelectedProduct((current) => current !== "all" && !productRows.some((p) => p.id === current) ? "all" : current);
    } catch (err) {
      setError(err?.message || "Unable to load jar inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const onUpdate = () => void loadData();
    window.addEventListener("amrit-jal-jars-updated", onUpdate);
    return () => window.removeEventListener("amrit-jal-jars-updated", onUpdate);
  }, [loadData]);

  useEffect(() => {
    const previousTitle = document.title;
    const names = ["description", "robots", "googlebot"];
    const previous = Object.fromEntries(names.map((name) => [name, document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ?? null]));
    const setMeta = (name, content) => {
      let node = document.querySelector(`meta[name="${name}"]`);
      if (!node) {
        node = document.createElement("meta");
        node.setAttribute("name", name);
        document.head.appendChild(node);
      }
      node.setAttribute("content", content);
    };
    document.title = "Jar Management | Amrit Jal";
    setMeta("description", "Manage product-wise water jar inventory, opening stock, employee transfers, customer deliveries, returns and stock reconciliation.");
    setMeta("robots", "noindex, nofollow, noarchive");
    setMeta("googlebot", "noindex, nofollow, noarchive");
    return () => {
      document.title = previousTitle;
      names.forEach((name) => {
        const node = document.querySelector(`meta[name="${name}"]`);
        if (previous[name] === null) node?.remove();
        else if (node) node.setAttribute("content", previous[name]);
      });
    };
  }, []);

  const productSummary = summary?.products?.find((row) => row.productId === selectedProduct);
  const visibleTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (selectedProduct !== "all" && tx.productId !== selectedProduct) return false;
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      const date = String(tx.transactionDate || "").slice(0, 10);
      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;
      return [tx.customerName, tx.employeeName, tx.productName, tx.notes, tx.type, tx.id]
        .some((value) => String(value || "").toLowerCase().includes(q));
    });
  }, [transactions, selectedProduct, typeFilter, fromDate, toDate, search]);

  async function createTransaction(data) {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await jarService.createTransaction(data);
      setShowForm(false);
      setSuccess("Jar movement saved successfully.");
      await loadData();
    } catch (err) {
      setError(err?.message || "Unable to save movement.");
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteTransaction(tx) {
    if (!window.confirm("Delete this transaction? Inventory will be recalculated from the remaining history.")) return;
    setDeletingId(tx.id);
    setError("");
    setSuccess("");
    try {
      await jarService.deleteTransaction(tx.id);
      await loadData();
      setSuccess("Transaction deleted.");
    } catch (err) {
      setError(err?.message || "Unable to delete transaction.");
    } finally {
      setDeletingId("");
    }
  }

  async function reconcile(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (selectedProduct === "all") return setError("Select one product before reconciling stock.");
    const actual = Number(physicalStock);
    if (!Number.isFinite(actual) || actual < 0) return setError("Enter a valid physical stock quantity.");
    if (!Number.isInteger(actual)) return setError("Physical jar count must be a whole number.");
    const recorded = Number(productSummary?.available || 0);
    const difference = actual - recorded;
    if (!difference) {
      setSuccess("Physical stock already matches recorded stock.");
      setShowReconcile(false);
      return;
    }
    const direction = difference > 0 ? "increase" : "decrease";
    if (!window.confirm(`Product: ${productSummary.productName}\nRecorded: ${recorded}\nPhysical: ${actual}\nAdjustment: ${direction} ${Math.abs(difference)} jar(s).\n\nContinue?`)) return;
    setSubmitting(true);
    try {
      await jarService.createTransaction({
        type: "adjustment",
        productId: selectedProduct,
        quantity: Math.abs(difference),
        adjustmentDirection: direction,
        transactionDate: new Date().toISOString().slice(0, 10),
        notes: `Physical stock reconciliation. Recorded: ${recorded}; physical: ${actual}; difference: ${difference}.`,
      });
      setShowReconcile(false);
      setPhysicalStock("");
      await loadData();
      setSuccess(`Stock reconciled. ${direction === "increase" ? "+" : "−"}${Math.abs(difference)} jar(s).`);
    } catch (err) {
      setError(err?.message || "Unable to reconcile stock.");
    } finally {
      setSubmitting(false);
    }
  }

  const clearFilters = () => { setSearch(""); setTypeFilter("all"); setFromDate(""); setToDate(""); };

  return <main className="min-h-full bg-slate-50 px-3 py-5 text-slate-800 sm:px-5 lg:px-6">
    <div className="mx-auto max-w-[1500px] space-y-5">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Package size={24} /></span>
          <div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Inventory</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">Jar Management</h1><p className="mt-1 text-sm text-slate-500">Product-wise stock, employee transfers and customer jar movements.</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void loadData()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>
          <button type="button" onClick={() => { setShowReconcile((v) => !v); setShowForm(false); setPhysicalStock(productSummary ? String(Math.max(0, productSummary.available)) : ""); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold hover:bg-slate-50"><SlidersHorizontal size={16} /> Reconcile</button>
          <button type="button" onClick={() => { setShowForm((v) => !v); setShowReconcile(false); }} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">{showForm ? <X size={16} /> : <PackagePlus size={16} />}{showForm ? "Close" : "Record Movement"}</button>
        </div>
      </header>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span className="flex-1">{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button></div>}
      {success && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800"><CheckCircle2 size={18} /><span className="flex-1">{success}</span><button onClick={() => setSuccess("")} aria-label="Dismiss success"><X size={16} /></button></div>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-bold text-slate-900">Inventory Overview</h2><p className="text-sm text-slate-500">Select a product to view its stock and reconcile physical count.</p></div>
        <select value={selectedProduct} onChange={(e) => { setSelectedProduct(e.target.value); setShowReconcile(false); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm sm:max-w-xs">
          <option value="all">All products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Available in Warehouse" value={selectedProduct === "all" ? summary?.available : productSummary?.available} detail="Current warehouse stock" icon={Package} />
        <Stat label="With Customers" value={selectedProduct === "all" ? summary?.totalWithCustomers : productSummary?.totalWithCustomers} detail="Delivered minus returned" icon={Truck} tone="blue" />
        <Stat label="Total Delivered" value={selectedProduct === "all" ? summary?.totalDelivered : productSummary?.totalDelivered} detail="Cumulative customer deliveries" icon={PackagePlus} tone="green" />
        <Stat label="Total Returned" value={selectedProduct === "all" ? summary?.totalReturned : productSummary?.totalReturned} detail="Cumulative customer returns" icon={RotateCcw} tone="amber" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><h2 className="font-bold text-slate-900">Product Stock</h2></div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {(summary?.products || []).map((p) => <button type="button" key={p.productId} onClick={() => setSelectedProduct(p.productId)} className={`rounded-xl border p-4 text-left transition ${selectedProduct === p.productId ? "border-teal-600 bg-teal-50/50" : "border-slate-200 hover:border-slate-300"}`}>
            <div className="flex items-start justify-between gap-2"><p className="font-semibold text-slate-900">{p.productName}</p><Boxes size={18} className="text-teal-700" /></div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{p.available} <span className="text-sm font-medium text-slate-500">jars</span></p>
            <p className="mt-1 text-xs text-slate-500">With customers: {p.totalWithCustomers}</p>
            <p className="mt-3 text-xs text-slate-400">Opening {p.totalOpening} · Loaded {p.totalLoaded} · Unloaded {p.totalUnloaded}</p>
          </button>)}
          {!loading && !products.length && <p className="col-span-full py-6 text-center text-sm text-slate-500">No products found. Add jar products first.</p>}
        </div>
      </section>

      {showReconcile && <section className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">Physical Stock Reconciliation</h2>
        <p className="mt-1 text-sm text-slate-500">Select one product and enter the physical warehouse count.</p>
        {selectedProduct === "all" ? <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Select a product from the product filter or stock cards first.</p> : <form onSubmit={reconcile} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm font-semibold text-slate-700">{productSummary?.productName} — Physical quantity
            <input type="number" min="0" step="1" required value={physicalStock} onChange={(e) => setPhysicalStock(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" />
          </label>
          <button type="submit" disabled={submitting || loading || physicalStock === ""} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Reconciling..." : "Confirm Count"}</button>
          <button type="button" onClick={() => setShowReconcile(false)} disabled={submitting} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">Cancel</button>
        </form>}
      </section>}

      {showForm && <JarTransactionForm products={products} customers={customers} employees={employees} onSubmit={createTransaction} onCancel={() => setShowForm(false)} submitting={submitting} />}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-4 border-b border-slate-100 p-4 sm:p-5">
          <div><h2 className="font-bold text-slate-900">Transaction History</h2><p className="mt-1 text-sm text-slate-500">Search and review all product-wise jar movements.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="relative sm:col-span-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product, customer, employee..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm" /></div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="all">All movement types</option>{Object.entries(META).map(([key, value]) => <option key={key} value={key}>{value[0]}</option>)}</select>
            <label className="relative"><span className="sr-only">From date</span><CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-2 text-sm" /></label>
            <label className="relative"><span className="sr-only">To date</span><CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="date" min={fromDate || undefined} value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-2 text-sm" /></label>
          </div>
          {(search || typeFilter !== "all" || fromDate || toDate || selectedProduct !== "all") && <div className="flex items-center justify-between text-xs text-slate-500"><span>{visibleTransactions.length} of {transactions.length} movements</span><button type="button" onClick={() => { clearFilters(); setSelectedProduct("all"); }} className="font-semibold text-teal-700">Clear filters</button></div>}
        </div>

        {loading ? <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500"><LoaderCircle size={20} className="animate-spin" /> Loading inventory...</div> : !visibleTransactions.length ? <div className="px-5 py-14 text-center"><Package size={28} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-800">No transactions found</p><p className="mt-1 text-sm text-slate-500">Try changing filters or record a new movement.</p><button type="button" onClick={() => setShowForm(true)} className="mt-4 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white">Record Movement</button></div> : <>
          <div className="divide-y divide-slate-100 md:hidden">{visibleTransactions.map((tx) => <article key={tx.id} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-3"><div><Badge type={tx.type} /><p className="mt-2 font-semibold text-slate-900">{tx.productName || "Unknown product"}</p><p className="text-xs text-slate-500">{dateLabel(tx.transactionDate)}</p></div><div className="text-right"><p className="text-xl font-bold text-slate-900">{tx.quantity}</p><p className="text-xs text-slate-400">jars</p></div></div>
            {(tx.customerName || tx.employeeName) && <p className="text-sm text-slate-600">{tx.customerName ? `Customer: ${tx.customerName}` : ""}{tx.customerName && tx.employeeName ? " · " : ""}{tx.employeeName ? `Employee: ${tx.employeeName}` : ""}</p>}
            {tx.type === "adjustment" && <p className="text-xs font-medium text-violet-700">Direction: {tx.adjustmentDirection || "Not recorded"}</p>}
            {tx.notes && <p className="flex items-start gap-2 text-sm text-slate-500"><FileText size={14} className="mt-0.5 shrink-0" />{tx.notes}</p>}
            <div className="flex justify-end"><button type="button" onClick={() => void deleteTransaction(tx)} disabled={!!tx.deliveryId || deletingId === tx.id} title={tx.deliveryId ? "Manage this movement from Deliveries" : "Delete transaction"} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14} />{deletingId === tx.id ? "Deleting..." : "Delete"}</button></div>
          </article>)}</div>
          <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Movement</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Customer / Employee</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Notes</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{visibleTransactions.map((tx) => <tr key={tx.id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-3 text-slate-600">{dateLabel(tx.transactionDate)}</td><td className="px-4 py-3"><Badge type={tx.type} />{tx.type === "adjustment" && <p className="mt-1 text-xs text-violet-700">{tx.adjustmentDirection || "Direction missing"}</p>}</td><td className="px-4 py-3 font-medium text-slate-800">{tx.productName}</td><td className="px-4 py-3 text-slate-600">{tx.customerName || tx.employeeName || "Warehouse"}</td><td className="px-4 py-3 font-semibold">{tx.quantity}</td><td className="max-w-xs truncate px-4 py-3 text-slate-500">{tx.notes || "—"}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => void deleteTransaction(tx)} disabled={!!tx.deliveryId || deletingId === tx.id} title={tx.deliveryId ? "Manage from Deliveries" : "Delete transaction"} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-30"><Trash2 size={16} /></button></td></tr>)}</tbody>
          </table></div>
        </>}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">Showing {visibleTransactions.length} movement(s)</div>
      </section>
    </div>
  </main>;
}
