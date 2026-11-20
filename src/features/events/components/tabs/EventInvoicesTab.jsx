
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Printer,
  ReceiptText,
  RefreshCw,
  Wallet,
  Droplets,
  IndianRupee,
  ClipboardList,
} from "lucide-react";

import { supabase } from "../../../../lib/supabase/client";
import { getCurrentBusinessId } from "../../../auth/services/businessAccessService";
import deliveryService from "../../../deliveries/services/deliveryService";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInvoiceStatus(invoice) {
  const total = Number(invoice.total_amount || 0);
  const paid = Number(invoice.amount_paid || 0);
  const status = String(invoice.status || "").toLowerCase();

  if (status.includes("void") || status.includes("cancel")) {
    return "Voided";
  }

  if (total > 0 && paid >= total) {
    return "Paid";
  }

  if (paid > 0) {
    return "Partially Paid";
  }

  return invoice.status || "Unpaid";
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();

  const styles =
    normalized === "paid"
      ? "bg-emerald-50 text-emerald-700"
      : normalized.includes("void") || normalized.includes("cancel")
        ? "bg-rose-50 text-rose-700"
        : normalized.includes("partial")
          ? "bg-blue-50 text-blue-700"
          : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${styles}`}
    >
      {status || "Unpaid"}
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value, accent = "cyan" }) {
  const accentStyles = {
    cyan: "bg-cyan-50 text-cyan-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-white p-2.5 sm:rounded-2xl sm:p-4">
      <div
        className={`mb-2 flex size-9 items-center justify-center rounded-xl ${
          accentStyles[accent]
        }`}
      >
        <Icon size={18} />
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
        {label}
      </p>

      <p className="mt-1 break-words text-base font-extrabold text-slate-900 sm:text-lg">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center px-4 py-6 text-center sm:px-5 sm:py-16">
      <div className="relative mb-3 flex size-16 items-center justify-center rounded-full bg-cyan-50 sm:mb-5 sm:size-24">
        <div className="flex size-12 items-center justify-center rounded-xl bg-white shadow-sm sm:size-16 sm:rounded-2xl">
          <ReceiptText size={34} className="text-cyan-600" />
        </div>

        <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-4 border-white bg-cyan-500 text-white">
          <FileText size={14} />
        </span>
      </div>

      <h3 className="text-base font-bold text-slate-800">{title}</h3>

      <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500 sm:text-sm">
        {description}
      </p>
    </div>
  );
}

function InvoiceLine({ item }) {
  const quantity = Number(item.quantity || 0);
  const rate = Number(item.unit_price || 0);
  const total = Number(item.line_total || quantity * rate);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-dashed border-slate-100 py-3 last:border-0">
      <div className="min-w-0">
        <p className="break-words text-xs font-semibold text-slate-800 sm:text-sm">
          {item.description || "Invoice item"}
        </p>

        <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
          {quantity} × {money(rate)}
        </p>
      </div>

      <p className="self-center text-xs font-bold text-slate-800 sm:text-sm">
        {money(total)}
      </p>
    </div>
  );
}

function InvoiceCard({ invoice, expanded, onToggle, onPrint }) {
  const paid = Number(invoice.amount_paid || 0);
  const total = Number(invoice.total_amount || 0);
  const balance = Math.max(0, total - paid);
  const status = getInvoiceStatus(invoice);

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white sm:rounded-2xl sm:shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start gap-2.5 p-3 text-left transition hover:bg-slate-50 sm:gap-3 sm:p-4"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 sm:size-11 sm:rounded-xl">
          <ReceiptText size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-all text-sm font-extrabold text-slate-900">
              {invoice.invoice_number || "Invoice"}
            </p>

            <StatusBadge status={status} />
          </div>

          <p className="mt-1 text-[11px] text-slate-500">
            Invoice date: {formatDate(invoice.invoice_date)}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-3">
            <div>
              <p className="text-[10px] font-medium text-slate-400">
                Invoice Amount
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-800">
                {money(total)}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-medium text-slate-400">
                Balance Due
              </p>
              <p className="mt-0.5 text-sm font-bold text-rose-600">
                {money(balance)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-1 shrink-0 text-slate-400">
          {expanded ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-slate-800">
              Invoice Items
            </h4>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPrint("pdf")}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 sm:px-3 sm:text-xs"
                title="Print or save as PDF"
              >
                <FileText size={14} />
                PDF
              </button>
              <button
                type="button"
                onClick={() => onPrint("thermal")}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 text-[11px] font-semibold text-cyan-800 hover:bg-cyan-100 sm:px-3 sm:text-xs"
                title="Print on 80mm thermal printer"
              >
                <Printer size={14} />
                80mm
              </button>
            </div>
          </div>

          {invoice.items?.length ? (
            <div className="rounded-xl border border-slate-100 bg-white px-3">
              {invoice.items.map((item) => (
                <InvoiceLine key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-white p-3 text-xs text-slate-500">
              No invoice line items found.
            </p>
          )}

          <div className="mt-3 space-y-2 rounded-xl bg-white p-3">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span>{money(invoice.subtotal)}</span>
            </div>

            <div className="flex justify-between text-xs text-slate-500">
              <span>Discount</span>
              <span>{money(invoice.discount_amount)}</span>
            </div>

            <div className="flex justify-between text-xs text-slate-500">
              <span>Paid Amount</span>
              <span className="font-semibold text-emerald-700">
                {money(paid)}
              </span>
            </div>

            <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-sm font-extrabold text-slate-900">
              <span>Remaining</span>
              <span>{money(balance)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-3 rounded-xl bg-white p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function PrintHeader({ event, customerName }) {
  return (
    <div className="mb-6 border-b-2 border-slate-800 pb-4">
      <h1 className="text-2xl font-extrabold text-slate-900">
        AMRIT JAL
      </h1>

      <p className="mt-1 text-sm font-semibold text-slate-600">
        Event Invoice Statement
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">Event</p>
          <p className="font-bold">{event?.eventName || "Event"}</p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Customer</p>
          <p className="font-bold">{customerName || "Customer"}</p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Start Date</p>
          <p className="font-semibold">{formatDate(event?.startOn)}</p>
        </div>

        <div>
          <p className="text-xs text-slate-500">End Date</p>
          <p className="font-semibold">{formatDate(event?.endOn)}</p>
        </div>
      </div>
    </div>
  );
}

export default function EventInvoiceTab({ event, customer }) {
  const [activeView, setActiveView] = useState("invoices");
  const [deliveries, setDeliveries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expandedInvoice, setExpandedInvoice] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const eventId = event?.id;

  const customerName =
    event?.customerName ||
    customer?.name ||
    customer?.customerName ||
    "Customer";

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (!eventId) {
        setLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const businessId = await getCurrentBusinessId();

        if (!businessId) {
          throw new Error("Business account not found.");
        }

        // Fetch only deliveries linked to this event.
        const eventDeliveries = await deliveryService.getAll({
          eventId,
        });

        setDeliveries(eventDeliveries || []);

        // Invoice lines are linked to delivery_items.
        // Use that relation to find invoices belonging to this event.
        const deliveryItemIds = [
          ...new Set(
            (eventDeliveries || [])
              .flatMap((delivery) => delivery.items || [])
              .map((item) => item.id)
              .filter(Boolean)
          ),
        ];

        if (!deliveryItemIds.length) {
          setInvoices([]);
          return;
        }

        const { data: invoiceLines, error: linesError } =
          await supabase
            .from("invoice_lines")
            .select(
              `
                id,
                business_id,
                invoice_id,
                product_id,
                description,
                quantity,
                unit_price,
                line_total,
                source_delivery_item_id,
                created_at
              `
            )
            .eq("business_id", businessId)
            .in("source_delivery_item_id", deliveryItemIds);

        if (linesError) throw linesError;

        const invoiceIds = [
          ...new Set(
            (invoiceLines || [])
              .map((line) => line.invoice_id)
              .filter(Boolean)
          ),
        ];

        if (!invoiceIds.length) {
          setInvoices([]);
          return;
        }

        const { data: invoiceRows, error: invoiceError } =
          await supabase
            .from("invoices")
            .select("*")
            .eq("business_id", businessId)
            .in("id", invoiceIds)
            .order("invoice_date", { ascending: false });

        if (invoiceError) throw invoiceError;

        const linesByInvoice = (invoiceLines || []).reduce(
          (result, line) => {
            if (!result[line.invoice_id]) {
              result[line.invoice_id] = [];
            }

            result[line.invoice_id].push(line);
            return result;
          },
          {}
        );

        const normalizedInvoices = (invoiceRows || []).map(
          (invoice) => ({
            ...invoice,
            items: linesByInvoice[invoice.id] || [],
          })
        );

        setInvoices(normalizedInvoices);
      } catch (err) {
        console.error("Event invoice load failed:", err);
        setError(
          err?.message || "Unable to load event invoices."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventId]
  );

  useEffect(() => {
    void loadData();

    const handleUpdate = () => {
      void loadData({ silent: true });
    };

    window.addEventListener(
      "amrit-jal-deliveries-updated",
      handleUpdate
    );

    window.addEventListener(
      "amrit-jal-invoices-updated",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "amrit-jal-deliveries-updated",
        handleUpdate
      );

      window.removeEventListener(
        "amrit-jal-invoices-updated",
        handleUpdate
      );
    };
  }, [loadData]);

  const totals = useMemo(() => {
    const deliveryAmount = deliveries.reduce(
      (sum, delivery) => sum + Number(delivery.amount || 0),
      0
    );

    const deliveredJars = deliveries.reduce(
      (sum, delivery) => sum + Number(delivery.quantity || 0),
      0
    );

    const invoiceTotal = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.total_amount || 0),
      0
    );

    const paidAmount = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.amount_paid || 0),
      0
    );

    return {
      deliveryAmount,
      deliveredJars,
      invoiceTotal,
      paidAmount,
      balance: Math.max(0, invoiceTotal - paidAmount),
    };
  }, [deliveries, invoices]);

  const handlePrintInvoice = (invoice, printMode = "pdf") => {
    setExpandedInvoice(invoice.id);

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      window.alert("Please allow pop-ups to print the invoice.");
      return;
    }

    const isThermal = printMode === "thermal";
    const paid = Number(invoice.amount_paid || 0);
    const total = Number(invoice.total_amount || 0);
    const balance = Math.max(0, total - paid);

    const rows = (invoice.items || [])
      .map((item) => {
        const description = escapeHtml(item.description || "Item");
        const quantity = Number(item.quantity || 0);
        const rate = Number(item.unit_price || 0);
        const lineTotal = Number(
          item.line_total ?? quantity * rate
        );

        if (isThermal) {
          return `
            <div class="thermal-item">
              <div class="item-name">${description}</div>
              <div class="item-meta">
                <span>${quantity} × ${money(rate)}</span>
                <strong>${money(lineTotal)}</strong>
              </div>
            </div>
          `;
        }

        return `
          <tr>
            <td>${description}</td>
            <td class="center">${quantity}</td>
            <td class="right">${money(rate)}</td>
            <td class="right">${money(lineTotal)}</td>
          </tr>
        `;
      })
      .join("");

    const taxAmount = Number(invoice.tax_amount || 0);
    const discountAmount = Number(invoice.discount_amount || 0);
    const customerPhone =
      customer?.phone || event?.customerPhone || "";

    const invoiceBody = isThermal
      ? `
        <main class="thermal">
          <header class="thermal-header">
            <h1>AMRIT JAL</h1>
            <p class="muted">INVOICE</p>
            <p class="strong">${escapeHtml(invoice.invoice_number || "—")}</p>
          </header>

          <section class="meta">
            <div><span>Invoice Date</span><strong>${formatDate(invoice.invoice_date)}</strong></div>
            <div><span>Customer</span><strong>${escapeHtml(customerName)}</strong></div>
            ${customerPhone ? `<div><span>Phone</span><strong>${escapeHtml(customerPhone)}</strong></div>` : ""}
            <div><span>Event</span><strong>${escapeHtml(event?.eventName || "Event")}</strong></div>
          </section>

          <div class="divider"></div>
          <h2>ITEMS</h2>
          ${rows || '<p class="muted">No invoice items</p>'}
          <div class="divider"></div>

          <section class="totals">
            <div><span>Subtotal</span><strong>${money(invoice.subtotal)}</strong></div>
            ${discountAmount ? `<div><span>Discount</span><strong>-${money(discountAmount)}</strong></div>` : ""}
            ${taxAmount ? `<div><span>Tax</span><strong>${money(taxAmount)}</strong></div>` : ""}
            <div class="grand"><span>TOTAL</span><strong>${money(total)}</strong></div>
            <div><span>Paid</span><strong>${money(paid)}</strong></div>
            <div class="balance"><span>Balance Due</span><strong>${money(balance)}</strong></div>
          </section>

          ${invoice.notes ? `<p class="notes"><strong>Note:</strong> ${escapeHtml(invoice.notes)}</p>` : ""}
          <footer>
            <p>Thank you for your business!</p>
            <p class="muted">AMRIT JAL</p>
          </footer>
        </main>
      `
      : `
        <main class="a4">
          <header class="brand-header">
            <div>
              <p class="eyebrow">CUSTOMER BILLING</p>
              <h1>AMRIT JAL</h1>
              <p class="muted">Event & Delivery Billing</p>
            </div>
            <div class="invoice-label">
              <span>INVOICE</span>
              <strong>${escapeHtml(invoice.invoice_number || "—")}</strong>
              <small>${getInvoiceStatus(invoice)}</small>
            </div>
          </header>

          <section class="meta-grid">
            <div class="meta-card">
              <span class="eyebrow">BILLED TO</span>
              <strong>${escapeHtml(customerName)}</strong>
              ${customerPhone ? `<span>${escapeHtml(customerPhone)}</span>` : ""}
            </div>
            <div class="meta-card">
              <span class="eyebrow">INVOICE DETAILS</span>
              <span>Invoice No: <strong>${escapeHtml(invoice.invoice_number || "—")}</strong></span>
              <span>Invoice Date: <strong>${formatDate(invoice.invoice_date)}</strong></span>
              ${invoice.due_date ? `<span>Due Date: <strong>${formatDate(invoice.due_date)}</strong></span>` : ""}
            </div>
            <div class="meta-card event-card">
              <span class="eyebrow">EVENT</span>
              <strong>${escapeHtml(event?.eventName || "Event")}</strong>
              <span>${formatDate(event?.startOn)}${event?.endOn ? ` – ${formatDate(event.endOn)}` : ""}</span>
            </div>
          </section>

          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="center">Qty</th>
                <th class="right">Rate</th>
                <th class="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="4">No invoice items found.</td></tr>'}
            </tbody>
          </table>

          <section class="bottom-grid">
            <div class="notes-box">
              <span class="eyebrow">NOTES</span>
              <p>${invoice.notes ? escapeHtml(invoice.notes) : "Thank you for choosing Amrit Jal."}</p>
            </div>
            <div class="totals">
              <div><span>Subtotal</span><strong>${money(invoice.subtotal)}</strong></div>
              <div><span>Discount</span><strong>${money(discountAmount)}</strong></div>
              <div><span>Tax</span><strong>${money(taxAmount)}</strong></div>
              <div class="grand"><span>Invoice Total</span><strong>${money(total)}</strong></div>
              <div><span>Amount Paid</span><strong>${money(paid)}</strong></div>
              <div class="balance"><span>Balance Due</span><strong>${money(balance)}</strong></div>
            </div>
          </section>

          <footer class="a4-footer">
            <strong>AMRIT JAL</strong>
            <span>This is a computer-generated invoice.</span>
          </footer>
        </main>
      `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(invoice.invoice_number || "Invoice")}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              color: #172033;
              font-family: Arial, Helvetica, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .muted { color: #64748b; }
            .eyebrow {
              display: block;
              margin-bottom: 7px;
              color: #64748b;
              font-size: 9px;
              font-weight: 700;
              letter-spacing: 1.2px;
            }
            .a4 {
              width: 100%;
              max-width: 790px;
              margin: 0 auto;
              padding: 38px;
            }
            .brand-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 24px;
              padding-bottom: 22px;
              border-bottom: 3px solid #079fcB;
            }
            .brand-header h1 {
              margin: 0;
              color: #087fa5;
              font-size: 29px;
              letter-spacing: 1px;
            }
            .brand-header p { margin: 5px 0 0; font-size: 11px; }
            .invoice-label { min-width: 145px; text-align: right; }
            .invoice-label span {
              display: block;
              color: #079fcB;
              font-size: 19px;
              font-weight: 800;
              letter-spacing: 2px;
            }
            .invoice-label strong {
              display: block;
              margin-top: 7px;
              font-size: 13px;
            }
            .invoice-label small {
              display: inline-block;
              margin-top: 8px;
              padding: 5px 9px;
              border-radius: 20px;
              background: #eff6ff;
              color: #1d4ed8;
              font-size: 10px;
              font-weight: 700;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin: 24px 0;
            }
            .meta-card {
              display: flex;
              flex-direction: column;
              gap: 6px;
              min-height: 86px;
              padding: 14px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              font-size: 11px;
            }
            .meta-card strong { font-size: 13px; }
            .event-card { grid-column: 1 / -1; min-height: auto; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 22px;
            }
            th {
              padding: 12px 10px;
              background: #eaf7fa;
              color: #087fa5;
              font-size: 10px;
              text-align: left;
              text-transform: uppercase;
              letter-spacing: .5px;
            }
            td {
              padding: 12px 10px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 11px;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bottom-grid {
              display: grid;
              grid-template-columns: 1fr 270px;
              gap: 25px;
              align-items: start;
              margin-top: 25px;
            }
            .notes-box {
              min-height: 90px;
              padding: 14px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              font-size: 11px;
              line-height: 1.6;
            }
            .notes-box p { margin: 8px 0 0; }
            .totals { width: 100%; }
            .totals div {
              display: flex;
              justify-content: space-between;
              gap: 15px;
              padding: 7px 0;
              color: #475569;
              font-size: 11px;
            }
            .totals .grand {
              margin: 5px 0;
              padding: 12px 10px;
              border-radius: 6px;
              background: #eaf7fa;
              color: #075985;
              font-size: 14px;
              font-weight: 800;
            }
            .totals .balance {
              border-top: 1px solid #cbd5e1;
              color: #be123c;
              font-size: 13px;
              font-weight: 800;
            }
            .a4-footer {
              display: flex;
              justify-content: space-between;
              margin-top: 55px;
              padding-top: 14px;
              border-top: 1px solid #cbd5e1;
              color: #64748b;
              font-size: 10px;
            }
            .a4-footer strong { color: #087fa5; letter-spacing: 1px; }

            .thermal {
              width: 100%;
              max-width: 80mm;
              margin: 0 auto;
              padding: 4mm;
              color: #000;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 10px;
            }
            .thermal-header {
              padding-bottom: 10px;
              text-align: center;
              border-bottom: 1px dashed #000;
            }
            .thermal-header h1 {
              margin: 0 0 4px;
              font-size: 20px;
              letter-spacing: 1px;
            }
            .thermal-header p { margin: 3px 0; }
            .thermal-header .muted { color: #333; }
            .thermal-header .strong { font-weight: 700; font-size: 12px; }
            .meta { padding: 9px 0; }
            .meta div {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              padding: 3px 0;
            }
            .meta span { color: #333; }
            .meta strong { text-align: right; }
            .divider { border-top: 1px dashed #000; margin: 7px 0; }
            .thermal h2 {
              margin: 8px 0;
              font-size: 10px;
              letter-spacing: 1px;
            }
            .thermal-item {
              padding: 7px 0;
              border-bottom: 1px dotted #777;
            }
            .item-name { font-weight: 700; overflow-wrap: anywhere; }
            .item-meta {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              margin-top: 4px;
            }
            .thermal .totals { margin-top: 8px; }
            .thermal .totals div {
              padding: 4px 0;
              color: #000;
              font-size: 10px;
            }
            .thermal .totals .grand {
              margin: 5px 0;
              padding: 7px 0;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              border-radius: 0;
              background: transparent;
              color: #000;
              font-size: 14px;
            }
            .thermal .totals .balance {
              border-top: 1px solid #000;
              color: #000;
              font-size: 12px;
            }
            .thermal .notes { margin: 10px 0; overflow-wrap: anywhere; }
            .thermal footer {
              padding: 12px 0 4px;
              border-top: 1px dashed #000;
              text-align: center;
              font-weight: 700;
            }
            .thermal footer p { margin: 4px 0; }
            .thermal footer .muted { font-weight: 400; }

            @page { size: A4; margin: 12mm; }
            @media print {
              body { margin: 0; }
              .a4 { max-width: none; padding: 0; }
              ${isThermal ? `
                @page { size: 80mm auto; margin: 2mm; }
                .a4 { display: none !important; }
                .thermal { max-width: none; width: 100%; padding: 0; }
              ` : `
                .thermal { display: none !important; }
              `}
            }
          </style>
        </head>
        <body>
          ${invoiceBody}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.focus();
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintStatement = (printMode = "pdf") => {
    // Open synchronously from the click handler so popup blockers allow it.
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      window.alert("Please allow pop-ups to print the event statement.");
      return;
    }

    const isThermal = printMode === "thermal";

    const statementRows = deliveries
      .map((delivery) => {
        const date = formatDate(delivery.date);
        const delivered = Number(delivery.quantity || 0);
        const received = Number(delivery.jarsReceived || 0);
        const rate = Number(delivery.rate || 0);
        const amount = Number(delivery.amount || 0);

        if (isThermal) {
          return `
            <div class="thermal-row">
              <div class="row-date">${date}${delivery.shift ? ` · ${escapeHtml(delivery.shift)}` : ""}</div>
              <div class="row-values">
                <span>Delivered: <strong>${delivered}</strong></span>
                <span>Received: <strong>${received}</strong></span>
              </div>
              <div class="row-values">
                <span>Rate: ${money(rate)}</span>
                <strong>${money(amount)}</strong>
              </div>
            </div>
          `;
        }

        return `
          <tr>
            <td>${date}</td>
            <td>${escapeHtml(delivery.shift || "—")}</td>
            <td class="center">${delivered}</td>
            <td class="center">${received}</td>
            <td class="right">${money(rate)}</td>
            <td class="right">${money(amount)}</td>
          </tr>
        `;
      })
      .join("");

    const period = `${formatDate(event?.startOn)} – ${formatDate(event?.endOn)}`;
    const customerPhone = customer?.phone || event?.customerPhone || "";

    const content = isThermal
      ? `
        <main class="thermal">
          <header class="thermal-header">
            <h1>AMRIT JAL</h1>
            <p>EVENT DELIVERY STATEMENT</p>
            <strong>SUMMARY ONLY</strong>
          </header>

          <section class="meta">
            <div><span>Event</span><strong>${escapeHtml(event?.eventName || "Event")}</strong></div>
            <div><span>Customer</span><strong>${escapeHtml(customerName)}</strong></div>
            ${customerPhone ? `<div><span>Phone</span><strong>${escapeHtml(customerPhone)}</strong></div>` : ""}
            <div><span>Period</span><strong>${period}</strong></div>
            <div><span>Deliveries</span><strong>${deliveries.length}</strong></div>
            <div><span>Total Jars</span><strong>${totals.deliveredJars}</strong></div>
          </section>

          <div class="divider"></div>
          <h2>DELIVERY DETAILS</h2>
          ${statementRows || '<p>No delivery records.</p>'}
          <div class="divider"></div>

          <section class="total-box">
            <span>TOTAL DELIVERY AMOUNT</span>
            <strong>${money(totals.deliveryAmount)}</strong>
          </section>

          <footer>
            <p>This is a delivery statement only.</p>
            <p>No additional invoice or receivable is created.</p>
            <strong>AMRIT JAL</strong>
          </footer>
        </main>
      `
      : `
        <main class="a4">
          <header class="brand-header">
            <div>
              <p class="eyebrow">CUSTOMER ACCOUNT</p>
              <h1>AMRIT JAL</h1>
              <p class="muted">Event Delivery Statement</p>
            </div>
            <div class="document-label">
              <span>STATEMENT</span>
              <strong>${new Date().toLocaleDateString("en-IN")}</strong>
            </div>
          </header>

          <section class="meta-grid">
            <div class="meta-card">
              <span class="eyebrow">EVENT DETAILS</span>
              <strong>${escapeHtml(event?.eventName || "Event")}</strong>
              <span>Period: ${period}</span>
            </div>
            <div class="meta-card">
              <span class="eyebrow">CUSTOMER</span>
              <strong>${escapeHtml(customerName)}</strong>
              ${customerPhone ? `<span>${escapeHtml(customerPhone)}</span>` : ""}
            </div>
          </section>

          <section class="summary-grid">
            <div><span>Total Deliveries</span><strong>${deliveries.length}</strong></div>
            <div><span>Total Jars Delivered</span><strong>${totals.deliveredJars}</strong></div>
            <div><span>Total Delivery Amount</span><strong>${money(totals.deliveryAmount)}</strong></div>
          </section>

          <h2 class="section-title">DELIVERY DETAILS</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Shift</th>
                <th class="center">Delivered</th>
                <th class="center">Received</th>
                <th class="right">Rate</th>
                <th class="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${statementRows || '<tr><td colspan="6">No delivery records.</td></tr>'}
            </tbody>
          </table>

          <div class="grand-total">
            <span>Total Delivery Amount</span>
            <strong>${money(totals.deliveryAmount)}</strong>
          </div>

          <div class="notice">
            This is a consolidated delivery statement only. It does not create
            a second invoice or add another customer receivable. Existing
            invoice balances remain separate.
          </div>

          <footer>
            <strong>AMRIT JAL</strong>
            <span>Computer-generated event delivery statement</span>
          </footer>
        </main>
      `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Event Statement - ${escapeHtml(event?.eventName || "Event")}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              color: #172033;
              font-family: Arial, Helvetica, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .muted { color: #64748b; }
            .eyebrow {
              display: block;
              margin-bottom: 7px;
              color: #64748b;
              font-size: 9px;
              font-weight: 700;
              letter-spacing: 1.2px;
            }
            .a4 {
              width: 100%;
              max-width: 820px;
              margin: 0 auto;
              padding: 36px;
            }
            .brand-header {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              padding-bottom: 20px;
              border-bottom: 3px solid #079fcb;
            }
            .brand-header h1 {
              margin: 0;
              color: #087fa5;
              font-size: 28px;
              letter-spacing: 1px;
            }
            .brand-header p { margin: 5px 0 0; font-size: 11px; }
            .document-label { text-align: right; }
            .document-label span {
              display: block;
              color: #079fcb;
              font-size: 17px;
              font-weight: 800;
              letter-spacing: 1.5px;
            }
            .document-label strong {
              display: block;
              margin-top: 8px;
              font-size: 11px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin: 22px 0 16px;
            }
            .meta-card {
              display: flex;
              flex-direction: column;
              gap: 6px;
              min-height: 82px;
              padding: 13px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              font-size: 11px;
            }
            .meta-card strong { font-size: 13px; }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              margin: 16px 0 24px;
            }
            .summary-grid div {
              display: flex;
              flex-direction: column;
              gap: 7px;
              padding: 13px;
              border-radius: 8px;
              background: #eaf7fa;
            }
            .summary-grid span { color: #527184; font-size: 10px; }
            .summary-grid strong { color: #075985; font-size: 15px; }
            .section-title {
              margin: 22px 0 8px;
              color: #087fa5;
              font-size: 11px;
              letter-spacing: .8px;
            }
            table { width: 100%; border-collapse: collapse; }
            th {
              padding: 11px 8px;
              background: #eaf7fa;
              color: #087fa5;
              font-size: 9px;
              text-align: left;
            }
            td {
              padding: 11px 8px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 10px;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .grand-total {
              display: flex;
              justify-content: space-between;
              gap: 15px;
              margin-top: 18px;
              padding: 15px;
              border-radius: 8px;
              background: #eaf7fa;
              color: #075985;
              font-size: 14px;
              font-weight: 800;
            }
            .notice {
              margin-top: 18px;
              padding: 12px;
              border: 1px solid #fde68a;
              border-radius: 7px;
              background: #fffbeb;
              color: #92400e;
              font-size: 10px;
              line-height: 1.6;
            }
            footer {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              margin-top: 48px;
              padding-top: 12px;
              border-top: 1px solid #cbd5e1;
              color: #64748b;
              font-size: 9px;
            }
            footer strong { color: #087fa5; letter-spacing: 1px; }

            .thermal {
              width: 100%;
              max-width: 80mm;
              margin: 0 auto;
              padding: 3mm;
              color: #000;
              font-size: 10px;
            }
            .thermal-header {
              padding-bottom: 9px;
              border-bottom: 1px dashed #000;
              text-align: center;
            }
            .thermal-header h1 {
              margin: 0 0 4px;
              font-size: 19px;
              letter-spacing: 1px;
            }
            .thermal-header p { margin: 3px 0; font-size: 10px; }
            .thermal-header strong { font-size: 11px; }
            .meta { padding: 8px 0; }
            .meta div, .row-values {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              padding: 3px 0;
            }
            .meta span { color: #333; }
            .meta strong { text-align: right; }
            .divider { margin: 7px 0; border-top: 1px dashed #000; }
            .thermal h2 {
              margin: 8px 0;
              font-size: 10px;
              letter-spacing: .7px;
            }
            .thermal-row {
              padding: 7px 0;
              border-bottom: 1px dotted #777;
            }
            .row-date { margin-bottom: 3px; font-weight: 700; }
            .row-values { font-size: 9px; }
            .total-box {
              display: flex;
              flex-direction: column;
              gap: 5px;
              padding: 8px 0;
              font-weight: 700;
            }
            .total-box strong { font-size: 15px; }
            .thermal footer {
              display: block;
              margin-top: 10px;
              text-align: center;
              line-height: 1.5;
            }
            .thermal footer p { margin: 3px 0; font-size: 9px; }
            .thermal footer strong { display: block; margin-top: 8px; }

            @page { size: A4; margin: 12mm; }
            @media print {
              body { margin: 0; }
              ${isThermal ? `
                @page { size: 80mm auto; margin: 2mm; }
                .a4 { display: none !important; }
                .thermal { display: block !important; width: 100%; max-width: none; padding: 0; }
              ` : `
                .thermal { display: none !important; }
                .a4 { display: block !important; max-width: none; padding: 0; }
              `}
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.focus();
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const activeInvoices = invoices.filter(
    (invoice) => !getInvoiceStatus(invoice).toLowerCase().includes("void")
  );

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <RefreshCw size={18} className="animate-spin text-cyan-600" />
          Loading event invoices...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4 sm:space-y-4 sm:pb-5">
      {/* Top header */}
      <header className="flex items-center justify-between gap-2 rounded-xl bg-[#079FCB] px-3 py-3 text-white sm:rounded-2xl sm:px-4 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 sm:size-11 sm:rounded-xl">
            <ReceiptText size={23} />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-extrabold sm:text-lg">
              Event Invoice
            </h2>
            <p className="mt-0.5 text-[11px] text-cyan-50">
              {event?.eventName || "Event billing"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadData({ silent: true })}
          disabled={refreshing}
          aria-label="Refresh invoices"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/10 transition hover:bg-white/20 disabled:opacity-60"
        >
          <RefreshCw
            size={18}
            className={refreshing ? "animate-spin" : ""}
          />
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs leading-5 text-rose-700"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <SummaryCard
          icon={IndianRupee}
          label="Delivery Total"
          value={money(totals.deliveryAmount)}
        />

        <SummaryCard
          icon={ReceiptText}
          label="Invoices"
          value={activeInvoices.length}
        />

        <SummaryCard
          icon={Wallet}
          label="Paid"
          value={money(totals.paidAmount)}
          accent="green"
        />

        <SummaryCard
          icon={AlertCircle}
          label="Invoice Balance"
          value={money(totals.balance)}
          accent="amber"
        />
      </div>

      {/* View selector */}
      <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setActiveView("invoices")}
          className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-[11px] font-bold transition sm:min-h-11 sm:gap-2 sm:px-3 sm:text-xs ${
            activeView === "invoices"
              ? "bg-white text-cyan-700 shadow-sm"
              : "text-slate-500"
          }`}
        >
          <ReceiptText size={16} />
          Individual Invoices
        </button>

        <button
          type="button"
          onClick={() => setActiveView("statement")}
          className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-[11px] font-bold transition sm:min-h-11 sm:gap-2 sm:px-3 sm:text-xs ${
            activeView === "statement"
              ? "bg-white text-cyan-700 shadow-sm"
              : "text-slate-500"
          }`}
        >
          <ClipboardList size={16} />
          Event Statement
        </button>
      </div>

      {activeView === "invoices" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Invoice Records
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Invoices linked to this event's delivery items
              </p>
            </div>

            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
              {activeInvoices.length} Records
            </span>
          </div>

          {activeInvoices.length ? (
            <div className="space-y-3">
              {activeInvoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  expanded={expandedInvoice === invoice.id}
                  onToggle={() =>
                    setExpandedInvoice((current) =>
                      current === invoice.id ? null : invoice.id
                    )
                  }
                  onPrint={(mode) => handlePrintInvoice(invoice, mode)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <EmptyState
                title="No invoices found"
                description={
                  deliveries.length
                    ? "Event deliveries are available, but no invoice is linked to their delivery items yet."
                    : "Invoices linked to this event will appear here when available."
                }
              />
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Complete Event Statement
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Delivery-wise consolidated summary
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePrintStatement("pdf")}
                disabled={!deliveries.length}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-cyan-600 px-2.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10 sm:rounded-xl sm:px-3 sm:text-xs"
                title="Print or save statement as PDF"
              >
                <FileText size={14} />
                PDF
              </button>
              <button
                type="button"
                onClick={() => handlePrintStatement("thermal")}
                disabled={!deliveries.length}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 text-[11px] font-bold text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10 sm:rounded-xl sm:px-3 sm:text-xs"
                title="Print statement on 80mm thermal printer"
              >
                <Printer size={14} />
                80mm
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:rounded-2xl sm:p-4 sm:shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarDays size={17} className="text-cyan-600" />
              <p className="text-xs font-bold text-slate-800">
                {formatDate(event?.startOn)} – {formatDate(event?.endOn)}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold text-slate-400">
                  Total Deliveries
                </p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">
                  {deliveries.length}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold text-slate-400">
                  Total Jars
                </p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">
                  {totals.deliveredJars}
                </p>
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-lg border border-slate-100 sm:mt-4 sm:rounded-xl">
              <div className="grid grid-cols-[1fr_0.65fr_0.75fr] gap-1.5 bg-slate-50 px-2.5 py-2.5 text-[9px] font-bold uppercase tracking-wide text-slate-500 sm:grid-cols-[1fr_0.7fr_0.7fr] sm:gap-2 sm:px-3 sm:py-3 sm:text-[10px]">
                <span>Date</span>
                <span className="text-center">Jars</span>
                <span className="text-right">Amount</span>
              </div>

              {deliveries.length ? (
                deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="grid grid-cols-[1fr_0.65fr_0.75fr] items-center gap-1.5 border-t border-slate-100 px-2.5 py-2.5 sm:grid-cols-[1fr_0.7fr_0.7fr] sm:gap-2 sm:px-3 sm:py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">
                        {formatDate(delivery.date)}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {delivery.shift || "Delivery"}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-700">
                        {Number(delivery.quantity || 0)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Received: {Number(delivery.jarsReceived || 0)}
                      </p>
                    </div>

                    <p className="text-right text-xs font-bold text-slate-800">
                      {money(delivery.amount)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-3">
                  <EmptyState
                    title="No delivery records"
                    description="Event deliveries will appear in this statement."
                  />
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-cyan-50 p-3 sm:mt-4 sm:rounded-xl sm:p-4">
              <div>
                <p className="text-xs font-semibold text-cyan-800">
                  Total Delivery Amount
                </p>
                <p className="mt-1 text-[10px] text-cyan-700">
                  Based on event delivery records
                </p>
              </div>

              <p className="text-lg font-extrabold text-cyan-800">
                {money(totals.deliveryAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-2.5 sm:rounded-xl sm:p-3">
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0 text-amber-600"
            />
            <p className="text-[10px] leading-4 text-amber-800 sm:text-[11px] sm:leading-5">
              Statement only — no additional invoice or receivable is created.
            </p>
          </div>
        </section>
      )}

      {/* Footer note */}
      <div className="flex items-center justify-center gap-2 py-2 text-[10px] text-slate-400">
        <CheckCircle2 size={13} />
        Event records are scoped to this event
      </div>
    </div>
  );
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}
