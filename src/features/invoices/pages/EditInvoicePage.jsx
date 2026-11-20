
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  FileText,
  LoaderCircle,
  Minus,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  Droplets,
  Package,
  Wallet,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";
import {
  getInvoiceById,
  updateInvoice,
} from "../services/invoiceService";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const today = () => new Date().toISOString().slice(0, 10);

const dateValue = (value) =>
  value ? String(value).slice(0, 10) : "";

const specialItems = {
  thermal: "Lost 20L Thermal Jar",
  capsule: "Lost 20L Capsule Jar",
  dispenser: "Lost Dispenser Jar",
};

const defaultRates = {
  thermal: 600,
  capsule: 200,
  dispenser: 150,
};

function getSpecialType(description = "") {
  const value = description.toLowerCase();

  if (value.includes("thermal")) return "thermal";
  if (value.includes("capsule")) return "capsule";
  if (value.includes("dispenser")) return "dispenser";

  return null;
}

function getInvoiceStatus(invoice) {
  const status = String(invoice?.status || "").toLowerCase();

  if (["void", "voided", "cancelled", "canceled"].includes(status)) {
    return "Void";
  }

  const total = Number(invoice?.total_amount || 0);
  const paid = Number(invoice?.amount_paid || 0);

  if (total > 0 && paid >= total) return "Paid";
  if (paid > 0) return "Partially Paid";

  return invoice?.status || "Unpaid";
}

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[11px] font-bold text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumberControl({ value, onChange, min = 0, step = 1 }) {
  const update = (next) => {
    const parsed = Number(next);
    onChange(Number.isFinite(parsed) ? Math.max(min, parsed) : min);
  };

  return (
    <div className="flex h-9 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => update(Number(value || 0) - step)}
        disabled={Number(value || 0) <= min}
        className="flex h-full w-9 shrink-0 items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>

      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) => update(event.target.value)}
        className="h-full w-full min-w-0 border-x border-slate-100 text-center text-sm font-bold outline-none"
      />

      <button
        type="button"
        onClick={() => update(Number(value || 0) + step)}
        className="flex h-full w-9 shrink-0 items-center justify-center text-cyan-700 hover:bg-cyan-50"
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function LostJarCard({ title, subtitle, quantity, rate, onChange }) {
  const amount = Number(quantity || 0) * Number(rate || 0);

  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
        <Package size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-extrabold text-slate-800">
          {title}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-slate-500">
          {subtitle} · {money(rate)}/jar
        </p>
        <p className="mt-1 text-[11px] font-bold text-cyan-700">
          {money(amount)}
        </p>
      </div>

      <div className="w-[104px] shrink-0">
        <NumberControl value={quantity} onChange={onChange} />
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children, action }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
            <Icon size={17} />
          </div>
          <h2 className="truncate text-sm font-extrabold text-slate-800">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="p-3 sm:p-5">{children}</div>
    </section>
  );
}

const inputClass =
  "min-h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";

export default function EditInvoicePage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [businessId, setBusinessId] = useState("");

  const [form, setForm] = useState({
    invoice_date: "",
    period_start: "",
    period_end: "",
    due_date: "",
    notes: "",
    discount_amount: 0,
  });

  const [items, setItems] = useState([]);
  const [jarQty, setJarQty] = useState({
    thermal: 0,
    capsule: 0,
    dispenser: 0,
  });

  const [rates, setRates] = useState(defaultRates);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadInvoice = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData?.user) throw new Error("Please sign in first.");

      // Read the invoice's business ID. The database RPC independently
      // verifies the user's role before allowing an update.
      const { data: invoiceHeader, error: headerError } = await supabase
        .from("invoices")
        .select("business_id")
        .eq("id", invoiceId)
        .single();

      if (headerError) throw headerError;

      const currentBusinessId = invoiceHeader.business_id;
      setBusinessId(currentBusinessId);

      const [fullInvoice, settingsResult] = await Promise.all([
        getInvoiceById(invoiceId, currentBusinessId),
        supabase
          .from("business_invoice_settings")
          .select("*")
          .eq("business_id", currentBusinessId)
          .maybeSingle(),
      ]);

      if (settingsResult.error) throw settingsResult.error;

      const status = getInvoiceStatus(fullInvoice);
      if (status === "Void" || status === "Paid" || status === "Partially Paid") {
        throw new Error(
          `${status} invoices are protected from editing.`
        );
      }

      if (Number(fullInvoice.amount_paid || 0) > 0) {
        throw new Error("An invoice with payments cannot be edited.");
      }

      setInvoice(fullInvoice);

      setForm({
        invoice_date: dateValue(fullInvoice.invoice_date),
        period_start: dateValue(fullInvoice.period_start),
        period_end: dateValue(fullInvoice.period_end),
        due_date: dateValue(fullInvoice.due_date),
        notes: fullInvoice.notes || "",
        discount_amount: Number(fullInvoice.discount_amount || 0),
      });

      const loadedRates = {
        thermal: Number(
          settingsResult.data?.thermal_jar_charge ?? defaultRates.thermal
        ),
        capsule: Number(
          settingsResult.data?.capsule_jar_charge ?? defaultRates.capsule
        ),
        dispenser: Number(
          settingsResult.data?.dispenser_jar_charge ?? defaultRates.dispenser
        ),
      };

      setRates(loadedRates);

      const loadedItems = (fullInvoice.items || []).map((item) => ({
        id: item.id,
        description: item.description || "",
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price ?? item.rate ?? 0),
        product_id: item.product_id || null,
        source_delivery_item_id: item.source_delivery_item_id || null,
      }));

      const nextJarQty = {
        thermal: 0,
        capsule: 0,
        dispenser: 0,
      };

      const normalItems = [];

      loadedItems.forEach((item) => {
        const type = getSpecialType(item.description);

        if (type && !item.source_delivery_item_id) {
          nextJarQty[type] += item.quantity;
          return;
        }

        normalItems.push(item);
      });

      setJarQty(nextJarQty);
      setItems(normalItems);
    } catch (err) {
      console.error("Edit invoice load failed:", err);
      setError(err?.message || "Unable to load invoice.");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void loadInvoice();
  }, [loadInvoice]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateItem = (index, key, value) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    );
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        id: `new-${Date.now()}`,
        description: "",
        quantity: 1,
        unit_price: 0,
        product_id: null,
        source_delivery_item_id: null,
      },
    ]);
  };

  const removeItem = (index) => {
    setItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const jarLines = useMemo(
    () =>
      Object.entries(specialItems)
        .filter(([type]) => Number(jarQty[type]) > 0)
        .map(([type, description]) => ({
          description,
          quantity: Number(jarQty[type]),
          unit_price: Number(rates[type]),
          product_id: null,
          source_delivery_item_id: null,
        })),
    [jarQty, rates]
  );

  const lineSubtotal = useMemo(
    () =>
      [...items, ...jarLines].reduce(
        (sum, item) =>
          sum +
          Math.max(0, Number(item.quantity || 0)) *
            Math.max(0, Number(item.unit_price || 0)),
        0
      ),
    [items, jarLines]
  );

  const discount = Number(form.discount_amount || 0);
  const total = Math.max(0, lineSubtotal - discount);
  const paid = Number(invoice?.amount_paid || 0);
  const balance = Math.max(0, total - paid);

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.invoice_date || !form.period_start || !form.period_end) {
      setError("Invoice date and billing period are required.");
      return;
    }

    if (form.period_start > form.period_end) {
      setError("Billing period start cannot be after end date.");
      return;
    }

    if (discount < 0 || discount > lineSubtotal) {
      setError("Discount must be between zero and the invoice subtotal.");
      return;
    }

    const allItems = [...items, ...jarLines];

    if (!allItems.length) {
      setError("Add at least one invoice line.");
      return;
    }

    for (const item of allItems) {
      if (!String(item.description || "").trim()) {
        setError("Every invoice item needs a description.");
        return;
      }

      if (Number(item.quantity) <= 0 || Number(item.unit_price) < 0) {
        setError("Check item quantity and rate.");
        return;
      }
    }

    setSaving(true);

    try {
      await updateInvoice({
        invoiceId,
        businessId,
        invoiceData: {
          ...form,
          discount_amount: discount,
        },
        items: allItems,
      });

      setSuccess("Invoice updated successfully.");

      window.dispatchEvent(
        new Event("amrit-jal-invoices-updated")
      );

      navigate(`/invoices/${invoiceId}`, {
        state: { message: "Invoice updated successfully." },
      });
    } catch (err) {
      console.error("Invoice update failed:", err);
      setError(err?.message || "Unable to update invoice.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center gap-3 text-sm font-semibold text-slate-500">
        <LoaderCircle className="animate-spin text-cyan-600" size={20} />
        Loading invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <main className="mx-auto max-w-2xl px-3 py-8">
        <div className="rounded-2xl border border-rose-200 bg-white p-5">
          <CircleAlert className="mb-2 text-rose-600" size={24} />
          <h1 className="font-bold text-slate-900">
            Invoice cannot be edited
          </h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Link
            to="/invoices"
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-700 px-4 text-sm font-bold text-white"
          >
            <ArrowLeft size={16} /> Back to invoices
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F7F8] px-3 pb-28 pt-3 text-slate-900 sm:px-5 sm:pb-8 sm:pt-6 lg:px-8">
      <form
        onSubmit={handleSave}
        className="mx-auto w-full max-w-5xl space-y-3.5 sm:space-y-5"
      >
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              to={`/invoices/${invoiceId}`}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
              aria-label="Back to invoice"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold text-slate-900 sm:text-2xl">
                Edit Invoice
              </h1>
              <p className="truncate text-[11px] text-slate-500 sm:text-sm">
                {invoice.invoice_number || "Invoice"} · Update billing details
              </p>
            </div>
          </div>

          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
            {getInvoiceStatus(invoice)}
          </span>
        </header>

        {(error || success) && (
          <div
            role="alert"
            className={`flex items-start gap-2 rounded-xl border p-3 text-xs leading-5 ${
              error
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error ? <CircleAlert size={16} /> : <CheckCircle2 size={16} />}
            <span>{error || success}</span>
          </div>
        )}

        <Section title="Invoice information" icon={FileText}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Invoice number">
              <input
                value={invoice.invoice_number || ""}
                readOnly
                className={`${inputClass} bg-slate-50 font-bold`}
              />
            </Field>

            <Field label="Invoice date">
              <input
                type="date"
                value={form.invoice_date}
                onChange={(e) => updateForm("invoice_date", e.target.value)}
                className={inputClass}
                required
              />
            </Field>

            <Field label="Billing from">
              <input
                type="date"
                value={form.period_start}
                onChange={(e) => updateForm("period_start", e.target.value)}
                className={inputClass}
                required
              />
            </Field>

            <Field label="Billing to">
              <input
                type="date"
                value={form.period_end}
                onChange={(e) => updateForm("period_end", e.target.value)}
                className={inputClass}
                required
              />
            </Field>

            <Field label="Due date">
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => updateForm("due_date", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        <Section title="Customer" icon={Wallet}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Customer name">
              <input
                value={invoice.customer?.name || invoice.customerName || "Customer"}
                readOnly
                className={`${inputClass} bg-slate-50`}
              />
            </Field>
            <Field label="Customer ID">
              <input
                value={invoice.customer_id || ""}
                readOnly
                className={`${inputClass} bg-slate-50`}
              />
            </Field>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-slate-500">
            Customer identity is locked to protect existing delivery and payment history.
          </p>
        </Section>

        <Section
          title="Invoice items"
          icon={ReceiptText}
          action={
            <button
              type="button"
              onClick={addItem}
              className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-cyan-50 px-2.5 text-[11px] font-bold text-cyan-700"
            >
              <Plus size={14} /> Add item
            </button>
          }
        >
          <div className="space-y-2.5">
            {items.map((item, index) => (
              <div
                key={item.id || index}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                    Item {index + 1}
                    {item.source_delivery_item_id ? " · Delivery linked" : " · Manual"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="flex size-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
                    aria-label={`Remove item ${index + 1}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <Field label="Description">
                  <input
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, "description", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Item description"
                  />
                </Field>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Field label="Quantity">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", e.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Rate">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(index, "unit_price", e.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Amount">
                    <div className="flex min-h-10 items-center rounded-xl bg-white px-2 text-xs font-extrabold text-slate-800">
                      {money(
                        Number(item.quantity || 0) *
                          Number(item.unit_price || 0)
                      )}
                    </div>
                  </Field>
                </div>
              </div>
            ))}

            {!items.length && (
              <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
                No regular invoice items. Add an item or update lost-jar quantities below.
              </p>
            )}
          </div>
        </Section>

        <Section title="Lost jar charges" icon={Droplets}>
          <div className="space-y-2.5">
            <LostJarCard
              title="Thermal jar"
              subtitle="Lost 20L thermal"
              quantity={jarQty.thermal}
              rate={rates.thermal}
              onChange={(value) =>
                setJarQty((current) => ({ ...current, thermal: value }))
              }
            />

            <LostJarCard
              title="Capsule jar"
              subtitle="Lost 20L capsule"
              quantity={jarQty.capsule}
              rate={rates.capsule}
              onChange={(value) =>
                setJarQty((current) => ({ ...current, capsule: value }))
              }
            />

            <LostJarCard
              title="Dispenser jar"
              subtitle="Lost dispenser"
              quantity={jarQty.dispenser}
              rate={rates.dispenser}
              onChange={(value) =>
                setJarQty((current) => ({ ...current, dispenser: value }))
              }
            />
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Rates are loaded from business invoice settings.
          </p>
        </Section>

        <Section title="Discount and notes" icon={CalendarDays}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Discount amount (₹)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discount_amount}
                onChange={(e) =>
                  updateForm("discount_amount", e.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Invoice notes">
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => updateForm("notes", e.target.value)}
                className={`${inputClass} py-2`}
                placeholder="Optional notes..."
              />
            </Field>
          </div>
        </Section>

        <Section title="Updated invoice summary" icon={ReceiptText}>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800">{money(lineSubtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Discount</span>
              <span className="font-bold text-rose-600">− {money(discount)}</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-slate-200 pt-3 text-sm font-extrabold text-slate-900">
              <span>Invoice total</span>
              <span>{money(total)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Amount paid</span>
              <span>{money(paid)}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-cyan-50 px-3 py-3 text-sm font-extrabold text-cyan-800">
              <span>Balance due</span>
              <span>{money(balance)}</span>
            </div>
          </div>
        </Section>

        <div className="hidden items-center justify-end gap-2 sm:flex">
          <Link
            to={`/invoices/${invoiceId}`}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-700 px-6 text-sm font-extrabold text-white shadow-sm hover:bg-cyan-800 disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>

        <div className="h-2 sm:hidden" />
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-slate-500">
              Updated total
            </p>
            <p className="truncate text-base font-extrabold text-slate-900">
              {money(total)}
            </p>
          </div>

          <Link
            to={`/invoices/${invoiceId}`}
            className="flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={() => document.querySelector("form")?.requestSubmit()}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-cyan-700 px-4 text-xs font-extrabold text-white disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            Save
          </button>
        </div>
      </div>
    </main>
  );
}
