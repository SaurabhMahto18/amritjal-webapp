
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Printer,
  RefreshCw,
  FileText,
  CalendarDays,
  UserRound,
  CreditCard,
  AlertCircle,
  LoaderCircle,
  ChevronDown,
  Wallet,
  Package,
  MapPin,
  Phone,
  Download,
  ReceiptText,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";
import { getInvoiceById } from "../services/invoiceService";

import {
  formatCurrency,
  formatDate,
  formatInvoiceNumber,
  toNumber,
} from "../utils/invoiceUtils";

import InvoiceStatusBadge from "../components/InvoiceStatusBadge";

// ========================================
// PAYMENT STATUS
// ========================================

function getPaymentStatus(total, paid, status) {
  if (status === "void") return "Voided";
  if (status === "draft") return "Draft";
  if (total > 0 && paid >= total) return "Fully paid";
  if (paid > 0) return "Partially paid";
  return "Payment pending";
}

// ========================================
// SEO
// ========================================

const SEO = {
  description:
    "View customer invoice details, billing period, delivery items, payments and outstanding balance in Amrit Jal.",
  robots: "noindex, nofollow",
};

// ========================================
// SHARED STYLES
// ========================================

const cardClass =
  "rounded-2xl border border-slate-200 bg-white shadow-sm";

const sectionTitleClass =
  "text-sm font-bold text-slate-900 sm:text-base";

// ========================================
// INFO ITEM
// ========================================

function InfoItem({ label, value, icon: Icon }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      {Icon && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
          <Icon size={15} />
        </div>
      )}

      <div className="min-w-0">
        <p className="text-[10px] font-medium text-slate-400 sm:text-xs">
          {label}
        </p>
        <p className="mt-0.5 break-words text-xs font-semibold text-slate-800 sm:text-sm">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ========================================
// AMOUNT ROW
// ========================================

function AmountRow({ label, value, valueClass = "" }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-xs text-slate-500 sm:text-sm">{label}</span>
      <span className={`text-xs font-semibold tabular-nums text-slate-800 sm:text-sm ${valueClass}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

// ========================================
// LOADING STATE
// ========================================

function LoadingState() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-[#F4F7F8] px-4">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <LoaderCircle size={28} className="animate-spin text-[#087F8C]" />
        <p className="text-xs font-medium text-slate-600">
          Loading invoice details...
        </p>
      </div>
    </main>
  );
}

// ========================================
// ERROR STATE
// ========================================

function ErrorState({ error, onRetry }) {
  return (
    <main className="min-h-[60vh] bg-[#F4F7F8] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 shrink-0 text-rose-600" size={22} />

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-900">
              Unable to load invoice
            </h2>
            <p className="mt-2 break-words text-xs leading-5 text-rose-700 sm:text-sm">
              {error}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#087F8C] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#066B76]"
              >
                <RefreshCw size={14} />
                Try Again
              </button>

              <Link
                to="/invoices"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={14} />
                Back to Invoices
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ========================================
// PRINT OPTIONS
// ========================================

function PrintOptions({ invoiceId, disabled }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const options = [
    {
      title: "Standard Invoice",
      description: "Full professional invoice · A4",
      icon: FileText,
      path: `/invoices/${invoiceId}/print/standard`,
    },
    {
      title: "Summary Invoice",
      description: "Compact billing summary · A4",
      icon: ReceiptText,
      path: `/invoices/${invoiceId}/print/summary`,
    },
    {
      title: "Detailed Report",
      description: "Detailed invoice report · A4",
      icon: Download,
      path: `/invoices/${invoiceId}/print/report`,
    },
    {
      title: "Thermal Receipt",
      description: "Choose 58 mm or 80 mm paper",
      icon: Printer,
      path: `/invoices/${invoiceId}/print/thermal`,
    },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#087F8C] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#066B76] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11 sm:w-auto sm:px-5 sm:text-sm"
      >
        <Printer size={16} />
        Print / Download
        <ChevronDown
          size={15}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close print options"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />

          <div className="absolute bottom-full right-0 z-40 mb-2 w-[min(310px,calc(100vw-28px))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl sm:bottom-auto sm:top-full sm:mb-0 sm:mt-2">
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Choose invoice format
            </p>

            {options.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  key={option.title}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate(option.path);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-[#EAF6F5]"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#E5F5F2] text-[#087F8C]">
                    <Icon size={17} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800">
                      {option.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}

            <p className="border-t border-slate-100 px-3 py-2.5 text-[10px] leading-4 text-slate-400">
              Thermal receipt supports 58 mm and 80 mm paper widths.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ========================================
// SECTION HEADER
// ========================================

function SectionHeader({ icon: Icon, title, subtitle, tone = "teal", right }) {
  const tones = {
    teal: "bg-[#E5F5F2] text-[#087F8C]",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={17} />
        </div>
        <div className="min-w-0">
          <h2 className={sectionTitleClass}>{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

// ========================================
// INVOICE DETAIL PAGE
// ========================================

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ======================================
  // LOAD INVOICE
  // ======================================

  const loadInvoice = useCallback(async () => {
    if (!invoiceId) {
      setError("Invoice ID is missing from the URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Please log in to view this invoice.");

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (businessError) throw businessError;
      if (!business) throw new Error("Your business account was not found.");

      const invoiceData = await getInvoiceById(invoiceId, business.id);

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id, name, code, phone, address, area, jar_rate")
        .eq("id", invoiceData.customer_id)
        .eq("business_id", business.id)
        .maybeSingle();

      if (customerError) throw customerError;

      setInvoice(invoiceData);
      setCustomer(customerData ?? null);
    } catch (err) {
      console.error("Failed to load invoice:", err);
      setError(err?.message || "Unable to load invoice.");
      setInvoice(null);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void loadInvoice();
  }, [loadInvoice]);

  // ======================================
  // SEO METADATA
  // ======================================

  useEffect(() => {
    const previousTitle = document.title;

    const descriptionMeta = document.querySelector('meta[name="description"]');
    const robotsMeta = document.querySelector('meta[name="robots"]');

    const previousDescription = descriptionMeta?.getAttribute("content");
    const previousRobots = robotsMeta?.getAttribute("content");

    const description = descriptionMeta || document.createElement("meta");
    const robots = robotsMeta || document.createElement("meta");

    const invoiceNumber = invoice?.invoice_number
      ? formatInvoiceNumber(invoice.invoice_number)
      : "Invoice Details";

    document.title = `${invoiceNumber} | Invoice | Amrit Jal`;

    description.setAttribute("name", "description");
    description.setAttribute(
      "content",
      invoice
        ? `Invoice ${invoiceNumber} for ${customer?.name || "customer"}. View invoice items, billing period, payment status and outstanding balance in Amrit Jal.`
        : SEO.description
    );

    robots.setAttribute("name", "robots");
    robots.setAttribute("content", SEO.robots);

    if (!descriptionMeta) document.head.appendChild(description);
    if (!robotsMeta) document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;

      if (descriptionMeta) {
        if (previousDescription === null) {
          description.removeAttribute("content");
        } else {
          description.setAttribute("content", previousDescription);
        }
      } else {
        description.remove();
      }

      if (robotsMeta) {
        if (previousRobots === null) {
          robots.removeAttribute("content");
        } else {
          robots.setAttribute("content", previousRobots);
        }
      } else {
        robots.remove();
      }
    };
  }, [invoice, customer]);

  // ======================================
  // FINANCIAL VALUES
  // ======================================

  const total = toNumber(invoice?.total_amount);
  const paid = toNumber(invoice?.amount_paid);
  const subtotal = toNumber(invoice?.subtotal);
  const discount = toNumber(invoice?.discount_amount);
  const tax = toNumber(invoice?.tax_amount);

  const balance = Math.max(0, total - paid);
  const items = invoice?.items ?? [];

  const paymentStatus = getPaymentStatus(total, paid, invoice?.status);

  // ======================================
  // CONDITIONAL STATES
  // ======================================

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => void loadInvoice()}
      />
    );
  }

  if (!invoice) {
    return (
      <ErrorState
        error="Invoice not found."
        onRetry={() => navigate("/invoices")}
      />
    );
  }

  const invoiceNumber = formatInvoiceNumber(invoice.invoice_number);

  // ======================================
  // MAIN UI
  // ======================================

  return (
    <main className="min-h-screen bg-[#F4F7F8] px-3 pb-6 pt-3 text-slate-900 sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[1350px] space-y-3.5 sm:space-y-5">

        {/* TOP BAR */}
        <header className=" hidden flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate("/invoices")}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 sm:min-h-11 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <ArrowLeft size={15} />
            <span>Invoices</span>
          </button>

          <div className="flex hidden items-center gap-2">
            <button
              type="button"
              onClick={() => void loadInvoice()}
              disabled={loading}
              aria-label="Refresh invoice"
              className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>

            <div className="hidden sm:block">
              <PrintOptions invoiceId={invoiceId} disabled={!invoice} />
            </div>
          </div>
        </header>

        {/* INVOICE HERO */}
        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex items-start justify-between gap-3 p-4 sm:p-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E5F5F2] text-[#087F8C] sm:size-12">
                <FileText size={22} />
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 sm:text-[11px]">
                  Invoice
                </p>
                <h1 className="mt-1 break-all text-base font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                  {invoiceNumber}
                </h1>
                <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
                  Created {formatDate(invoice.invoice_date)}
                </p>
              </div>
            </div>

            <div className="shrink-0 pt-1">
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>

          {/* MOBILE FINANCIAL SUMMARY */}
          <div className="grid grid-cols-3 border-t border-slate-100 sm:hidden">
            <div className="min-w-0 px-3 py-3">
              <p className="text-[9px] font-semibold text-slate-400">Total</p>
              <p className="mt-1 break-words text-xs font-extrabold text-slate-900">
                {formatCurrency(total)}
              </p>
            </div>

            <div className="min-w-0 border-l border-slate-100 px-3 py-3">
              <p className="text-[9px] font-semibold text-slate-400">Received</p>
              <p className="mt-1 break-words text-xs font-extrabold text-emerald-700">
                {formatCurrency(paid)}
              </p>
            </div>

            <div className="min-w-0 border-l border-slate-100 bg-amber-50/70 px-3 py-3">
              <p className="text-[9px] font-semibold text-amber-700">Due</p>
              <p className="mt-1 break-words text-xs font-extrabold text-amber-900">
                {formatCurrency(balance)}
              </p>
            </div>
          </div>

          {/* DESKTOP FINANCIAL SUMMARY */}
          <div className="hidden grid-cols-3 border-t border-slate-100 sm:grid">
            <div className="p-5 lg:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Invoice Total
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {formatCurrency(total)}
              </p>
            </div>

            <div className="border-l border-slate-100 p-5 lg:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Amount Received
              </p>
              <p className="mt-2 text-2xl font-extrabold text-emerald-700">
                {formatCurrency(paid)}
              </p>
            </div>

            <div className="border-l border-slate-100 bg-amber-50/50 p-5 lg:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Remaining Balance
              </p>
              <p className="mt-2 text-2xl font-extrabold text-amber-900">
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </section>

        {/* CUSTOMER + BILLING */}
        <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">

          {/* CUSTOMER */}
          <div className={`${cardClass} p-4 sm:p-6`}>
            <SectionHeader
              icon={UserRound}
              title="Customer"
              subtitle="Billed customer details"
            />

            <div className="flex items-center gap-3 ">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E5F5F2] text-sm font-bold text-[#087F68]">
                {String(customer?.name || "C")
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part.charAt(0))
                  .join("")
                  .toUpperCase()}
              </div>

              <div className="min-w-0 ">
                <p className="truncate text-sm font-bold text-slate-900">
                  {customer?.name || "Customer"}
                </p>
                {customer?.code && (
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    ID: {customer.code}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
              {customer?.phone && (
                <InfoItem label="Mobile" value={customer.phone} icon={Phone} />
              )}
              {customer?.area && (
                <InfoItem label="Area" value={customer.area} icon={MapPin} />
              )}
              {customer?.address && (
                <InfoItem label="Address" value={customer.address} />
              )}
              {customer?.jar_rate != null && (
                <InfoItem
                  label="Jar Rate"
                  value={formatCurrency(customer.jar_rate)}
                />
              )}
            </div>
          </div>

          {/* BILLING */}
          <div className={`${cardClass} p-4 sm:p-6`}>
            <SectionHeader
              icon={CalendarDays}
              title="Billing Details"
              subtitle="Invoice and payment period"
              tone="blue"
            />

            <div className="grid grid-cols-2 gap-4">
              <InfoItem
                label="Invoice Date"
                value={formatDate(invoice.invoice_date)}
              />
              <InfoItem
                label="Payment Status"
                value={paymentStatus}
                icon={CreditCard}
              />

              <InfoItem
                label="Billing From"
                value={formatDate(invoice.period_start)}
              />
              <InfoItem
                label="Billing To"
                value={formatDate(invoice.period_end)}
              />

              {invoice.due_date && (
                <InfoItem
                  label="Due Date"
                  value={formatDate(invoice.due_date)}
                  icon={Clock3}
                />
              )}
            </div>
          </div>
        </section>

        {/* INVOICE ITEMS */}
        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#E5F5F2] text-[#087F8C]">
                <Package size={17} />
              </div>
              <div className="min-w-0">
                <h2 className={sectionTitleClass}>Invoice Items</h2>
                <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
                  Delivery quantities and charges
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-full bg-[#E5F5F2] px-2.5 py-1 text-[10px] font-bold text-[#087F8C]">
              {items.length} items
            </span>
          </div>

          {items.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Package className="mx-auto text-slate-300" size={28} />
              <p className="mt-2 text-xs font-semibold text-slate-600">
                No invoice items found
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE ITEM LIST */}
              <div className="divide-y divide-slate-100 md:hidden grid grid-cols-2">
                {items.map((item, index) => (
                  <article
                    key={item.id || index}
                    className="px-4 py-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-xs font-bold text-slate-900">
                          {item.description || "Water jar delivery"}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {formatDate(item.delivery_date)}
                        </p>
                      </div>

                      <p className="shrink-0 text-xs font-extrabold text-slate-900">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>

                    <div className="mt-2.5 flex items-center gap-4 text-[10px] text-slate-500">
                      <span>
                        Qty: <strong className="text-slate-700">{toNumber(item.quantity)}</strong>
                      </span>
                      <span>
                        Rate: <strong className="text-slate-700">{formatCurrency(item.rate)}</strong>
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-[#F4F7F9] text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Date</th>
                      <th className="px-5 py-4 font-semibold">Description</th>
                      <th className="px-5 py-4 text-right font-semibold">Quantity</th>
                      <th className="px-5 py-4 text-right font-semibold">Rate</th>
                      <th className="px-5 py-4 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => (
                      <tr key={item.id || index} className="transition hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {formatDate(item.delivery_date)}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800">
                          {item.description || "Water jar delivery"}
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                          {toNumber(item.quantity)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums text-slate-700">
                          {formatCurrency(item.rate)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-bold tabular-nums text-slate-900">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* NOTES + PAYMENT SUMMARY */}
        <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">

          {/* NOTES */}
          <div className={`${cardClass} p-4 sm:p-6`}>
            <h2 className={sectionTitleClass}>Invoice Notes</h2>
            <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
              {invoice.notes || "No additional notes for this invoice."}
            </p>
          </div>

          {/* PAYMENT SUMMARY */}
          <div className={`${cardClass} p-4 sm:p-6`}>
            <SectionHeader
              icon={Wallet}
              title="Payment Summary"
              subtitle="Invoice amount breakdown"
            />

            <div className="divide-y divide-slate-100">
              <AmountRow label="Subtotal" value={subtotal} />

              {discount > 0 && (
                <AmountRow
                  label="Discount"
                  value={-discount}
                  valueClass="text-emerald-700"
                />
              )}

              {tax > 0 && (
                <AmountRow label="Tax" value={tax} />
              )}

              <div className="flex items-center justify-between gap-3 py-3">
                <span className="text-xs font-bold text-slate-900 sm:text-sm">
                  Total Invoice Amount
                </span>
                <span className="text-sm font-extrabold text-slate-900 sm:text-base">
                  {formatCurrency(total)}
                </span>
              </div>

              <AmountRow
                label="Amount Received"
                value={paid}
                valueClass="text-emerald-700"
              />

              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-3.5 py-3.5 sm:px-4 sm:py-4">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-amber-900">
                    Remaining Balance
                  </p>
                  <p className="mt-1 text-[10px] text-amber-700">
                    {balance > 0
                      ? "Amount still to be collected"
                      : "Invoice fully settled"}
                  </p>
                </div>

                <p className="shrink-0 text-base font-extrabold tabular-nums text-amber-900 sm:text-xl">
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PAYMENT STATUS NOTE */}
        {invoice.status !== "void" && invoice.status !== "draft" && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[10px] text-slate-500 sm:text-xs">
            {balance <= 0 ? (
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
            ) : (
              <Clock3 size={15} className="shrink-0 text-amber-600" />
            )}
            <span>
              {balance <= 0
                ? "This invoice has been fully settled."
                : `${formatCurrency(balance)} is still pending collection.`}
            </span>
          </div>
        )}

        {/* DESKTOP BOTTOM ACTIONS */}
        <div className="hidden items-center justify-between gap-3 pb-4 sm:flex">
          <Link
            to="/invoices"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Invoices
          </Link>

          <PrintOptions invoiceId={invoiceId} disabled={!invoice} />
          <Link
            to={`/invoices/${invoice.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-bold text-white"
          >
            Edit Invoice
          </Link>
        </div>

        {/* MOBILE STICKY ACTION BAR */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-[1350px] items-center gap-2">
            <Link
              to="/invoices"
              aria-label="Back to invoices"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
            >
              <ArrowLeft size={17} />
            </Link>

            <PrintOptions invoiceId={invoiceId} disabled={!invoice} />
            <Link
              to={`/invoices/${invoice.id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 font-bold text-white"
            >
              Edit Invoice
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
