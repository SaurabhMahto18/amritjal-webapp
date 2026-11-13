
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
  CheckCircle2,
  Clock3,
  Wallet,
  Package,
  MapPin,
  Phone,
  Download,
  ReceiptText,
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
// SEO CONFIGURATION
// ========================================

const SEO = {
  description:
    "View customer invoice details, billing period, delivery items, payments and outstanding balance in Amrit Jal.",
  robots: "noindex, nofollow",
};

// ========================================
// INFO ITEM
// ========================================

function InfoItem({ label, value, icon: Icon }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      {Icon && (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
          <Icon size={17} />
        </div>
      )}

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ========================================
// SUMMARY ITEM
// ========================================

function AmountRow({ label, value, valueClass = "" }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className={`text-sm font-semibold tabular-nums text-slate-800 ${valueClass}`}>
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
    <main className="flex min-h-[60vh] items-center justify-center bg-[#edf2f7]">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-10 py-9 shadow-sm">
        <LoaderCircle
          size={30}
          className="animate-spin text-[#087F8C]"
        />

        <p className="text-sm font-medium text-slate-600">
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
    <main className="min-h-[60vh] bg-[#edf2f7] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle
            className="mt-0.5 shrink-0 text-red-600"
            size={23}
          />

          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-slate-900">
              Unable to load invoice
            </h2>

            <p className="mt-2 break-words text-sm leading-6 text-red-700">
              {error}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-xl bg-[#087F8C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#066B76]"
              >
                <RefreshCw size={16} />
                Try Again
              </button>

              <Link
                to="/invoices"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
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
// PRINT OPTIONS MENU
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
      description: "Choose 58 mm or 80 mm on next screen",
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
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087F8C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#066B76] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Printer size={17} />
        Print / Download
        <ChevronDown
          size={16}
          className={`transition ${open ? "rotate-180" : ""}`}
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

          <div className="absolute right-0 top-full z-40 mt-2 w-[min(310px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E5F5F2] text-[#087F8C]">
                    <Icon size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {option.title}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}

            <p className="mt-1 border-t border-slate-100 px-3 py-3 text-[11px] leading-5 text-slate-400">
              Thermal receipt supports 58 mm and 80 mm paper widths.
            </p>
          </div>
        </>
      )}
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

      if (!user) {
        throw new Error("Please log in to view this invoice.");
      }

      const { data: business, error: businessError } =
        await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

      if (businessError) throw businessError;

      if (!business) {
        throw new Error("Your business account was not found.");
      }

      const invoiceData = await getInvoiceById(
        invoiceId,
        business.id
      );

      const { data: customerData, error: customerError } =
        await supabase
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

      setError(
        err?.message || "Unable to load invoice."
      );

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

    const descriptionMeta = document.querySelector(
      'meta[name="description"]'
    );

    const robotsMeta = document.querySelector(
      'meta[name="robots"]'
    );

    const previousDescription =
      descriptionMeta?.getAttribute("content");

    const previousRobots =
      robotsMeta?.getAttribute("content");

    const description =
      descriptionMeta || document.createElement("meta");

    const robots =
      robotsMeta || document.createElement("meta");

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

    if (!descriptionMeta) {
      document.head.appendChild(description);
    }

    if (!robotsMeta) {
      document.head.appendChild(robots);
    }

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
  // ALL FINANCIAL VALUES
  // ======================================

  const total = toNumber(invoice?.total_amount);
  const paid = toNumber(invoice?.amount_paid);
  const subtotal = toNumber(invoice?.subtotal);
  const discount = toNumber(invoice?.discount_amount);
  const tax = toNumber(invoice?.tax_amount);

  const balance = Math.max(0, total - paid);
  const items = invoice?.items ?? [];

  const paymentStatus = getPaymentStatus(
    total,
    paid,
    invoice?.status
  );

  // ======================================
  // CONDITIONAL STATES
  // All hooks are above this point.
  // ======================================

  if (loading) {
    return <LoadingState />;
  }

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

  // ======================================
  // MAIN UI
  // ======================================

  return (
    <main className="min-h-screen bg-[#edf2f7] px-3 py-5 text-slate-900 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-[1350px] space-y-5">

        {/* =================================
            TOP ACTION BAR
        ================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/invoices")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Back to Invoices
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadInvoice()}
              disabled={loading}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <PrintOptions
              invoiceId={invoiceId}
              disabled={!invoice}
            />
          </div>
        </div>

        {/* =================================
            INVOICE OVERVIEW
        ================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">

            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#E5F5F2] text-[#087F8C]">
                <FileText size={25} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Invoice Number
                </p>

                <h1 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {formatInvoiceNumber(invoice.invoice_number)}
                </h1>

                <p className="mt-1 text-xs text-slate-500">
                  Created on {formatDate(invoice.invoice_date)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center">
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>

          {/* KEY FINANCIAL FIGURES */}

          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">

            <div className="p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Invoice Total
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(total)}
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Amount Received
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {formatCurrency(paid)}
              </p>
            </div>

            <div className="bg-amber-50/50 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Remaining Balance
              </p>

              <p className="mt-2 text-2xl font-bold text-amber-800">
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </section>

        {/* =================================
            CUSTOMER + BILLING INFORMATION
        ================================== */}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* CUSTOMER INFORMATION */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#E5F5F2] text-[#087F8C]">
                <UserRound size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Customer Information
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Billed customer details
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Customer Name
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {customer?.name || "Customer"}
                </p>
              </div>

              {customer?.code && (
                <InfoItem
                  label="Customer Code"
                  value={customer.code}
                />
              )}

              {customer?.phone && (
                <InfoItem
                  label="Mobile Number"
                  value={customer.phone}
                  icon={Phone}
                />
              )}

              {customer?.area && (
                <InfoItem
                  label="Area"
                  value={customer.area}
                  icon={MapPin}
                />
              )}

              {customer?.address && (
                <InfoItem
                  label="Address"
                  value={customer.address}
                />
              )}
            </div>
          </div>

          {/* BILLING INFORMATION */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <CalendarDays size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Billing Information
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Invoice and payment period
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <InfoItem
                label="Invoice Date"
                value={formatDate(invoice.invoice_date)}
              />

              <InfoItem
                label="Billing Period"
                value={
                  invoice.period_start && invoice.period_end
                    ? `${formatDate(invoice.period_start)} – ${formatDate(invoice.period_end)}`
                    : "Not specified"
                }
              />

              <InfoItem
                label="Payment Status"
                value={paymentStatus}
                icon={CreditCard}
              />
            </div>
          </div>
        </section>

        {/* =================================
            INVOICE ITEMS
        ================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Invoice Items
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Products, delivery quantities and charges included in this invoice
              </p>
            </div>

            <span className="rounded-full bg-[#E5F5F2] px-3 py-1.5 text-xs font-semibold text-[#087F8C]">
              {items.length} item(s)
            </span>
          </div>

          {items.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Package
                className="mx-auto text-slate-300"
                size={32}
              />

              <p className="mt-3 font-semibold text-slate-700">
                No invoice items found
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-[#F4F7F9] text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Date
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Description
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Quantity
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Rate
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => (
                      <tr
                        key={item.id || index}
                        className="transition hover:bg-slate-50/70"
                      >
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

              {/* MOBILE ITEM CARDS */}

              <div className="divide-y divide-slate-100 md:hidden">
                {items.map((item, index) => (
                  <article
                    key={item.id || index}
                    className="space-y-3 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {item.description || "Water jar delivery"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(item.delivery_date)}
                        </p>
                      </div>

                      <p className="shrink-0 font-bold text-slate-900">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                      <span>
                        Quantity: <strong className="text-slate-700">{toNumber(item.quantity)}</strong>
                      </span>

                      <span>
                        Rate: <strong className="text-slate-700">{formatCurrency(item.rate)}</strong>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        {/* =================================
            NOTES + PAYMENT SUMMARY
        ================================== */}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* NOTES */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-900">
              Invoice Notes
            </h2>

            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
              {invoice.notes || "No additional notes for this invoice."}
            </p>
          </div>

          {/* AMOUNT SUMMARY */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Wallet size={19} className="text-[#087F8C]" />

              <h2 className="font-bold text-slate-900">
                Payment Summary
              </h2>
            </div>

            <div className="divide-y divide-slate-100">

              <AmountRow
                label="Subtotal"
                value={subtotal}
              />

              {discount > 0 && (
                <AmountRow
                  label="Discount"
                  value={-discount}
                  valueClass="text-emerald-700"
                />
              )}

              {tax > 0 && (
                <AmountRow
                  label="Tax"
                  value={tax}
                />
              )}

              <div className="flex items-center justify-between gap-4 py-3">
                <span className="font-bold text-slate-900">
                  Total Invoice Amount
                </span>

                <span className="text-lg font-bold text-slate-900">
                  {formatCurrency(total)}
                </span>
              </div>

              <AmountRow
                label="Amount Received"
                value={paid}
                valueClass="text-emerald-700"
              />

              <div className="mt-3 flex items-center justify-between gap-4 rounded-xl bg-amber-50 px-4 py-4">
                <div>
                  <p className="font-bold text-amber-900">
                    Remaining Balance
                  </p>

                  <p className="mt-1 text-xs text-amber-700">
                    {balance > 0
                      ? "Amount still to be collected"
                      : "Invoice fully settled"}
                  </p>
                </div>

                <p className="text-xl font-extrabold tabular-nums text-amber-900">
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =================================
            BOTTOM ACTIONS
        ================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <Link
            to="/invoices"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Invoices
          </Link>

          <PrintOptions
            invoiceId={invoiceId}
            disabled={!invoice}
          />
        </div>
      </div>
    </main>
  );
}
