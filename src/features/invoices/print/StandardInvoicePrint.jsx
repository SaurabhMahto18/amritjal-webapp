
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Printer,
  ArrowLeft,
  LoaderCircle,
  AlertCircle,
  CalendarDays,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Building2,
  UserRound,
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

export default function StandardInvoicePrint() {
  const { invoiceId } = useParams();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // PRIVATE INVOICE SEO
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

    document.title = "Invoice Preview & Print | Amrit Jal";

    description.name = "description";
    description.content =
      "Preview and print customer invoices in the Amrit Jal business console.";

    robots.name = "robots";
    robots.content = "noindex, nofollow";

    if (!descriptionMeta) document.head.appendChild(description);
    if (!robotsMeta) document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;

      if (descriptionMeta) {
        description.setAttribute(
          "content",
          previousDescription || ""
        );
      } else {
        description.remove();
      }

      if (robotsMeta) {
        robots.setAttribute("content", previousRobots || "");
      } else {
        robots.remove();
      }
    };
  }, []);

  // FETCH INVOICE DATA
  useEffect(() => {
    let active = true;

    async function load() {
      if (!invoiceId) {
        setError("Invoice ID is missing.");
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
        if (!user) throw new Error("Please log in first.");

        const {
          data: business,
          error: businessError,
        } = await supabase
          .from("businesses")
          .select("id, name")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (businessError) throw businessError;
        if (!business) {
          throw new Error("Business profile not found.");
        }

        const invoice = await getInvoiceById(
          invoiceId,
          business.id
        );

        if (!invoice) {
          throw new Error("Invoice not found.");
        }

        const [customerResult, settingsResult] =
          await Promise.all([
            supabase
              .from("customers")
              .select("name, code, phone, address, area")
              .eq("id", invoice.customer_id)
              .maybeSingle(),

            supabase
              .from("business_invoice_settings")
              .select("*")
              .eq("business_id", business.id)
              .maybeSingle(),
          ]);

        if (customerResult.error) throw customerResult.error;
        if (settingsResult.error) throw settingsResult.error;

        if (active) {
          setData({
            invoice,
            customer: customerResult.data,
            settings: settingsResult.data || {},
            business,
          });
        }
      } catch (loadError) {
        console.error(
          "Standard invoice loading failed:",
          loadError
        );

        if (active) {
          setError(
            loadError?.message || "Could not load invoice."
          );
          setData(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [invoiceId]);

  const items = data?.invoice?.items || [];

  // EXCLUDE LOST ITEMS FROM DELIVERED QUANTITY
  const totalQuantity = useMemo(
    () =>
      items.reduce((sum, item) => {
        const description = String(
          item.description || ""
        ).toLowerCase().trim();

        const isLost = /\blost\b/.test(description);

        if (isLost) return sum;

        return sum + toNumber(item.quantity);
      }, 0),
    [items]
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center gap-2 bg-[#F3F6F7] text-sm text-slate-600">
        <LoaderCircle
          className="animate-spin text-[#087F8C]"
          size={20}
        />
        Preparing invoice...
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F6F7] p-4">
        <div className="flex max-w-lg items-start gap-3 rounded-lg border border-red-200 bg-white p-4">
          <AlertCircle
            className="mt-0.5 shrink-0 text-red-600"
            size={20}
          />

          <div>
            <h2 className="font-bold text-slate-900">
              Invoice unavailable
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {error || "Invoice could not be found."}
            </p>

            <Link
              to={`/invoices/${invoiceId}`}
              className="mt-2 inline-flex text-sm font-semibold text-[#087F8C] underline"
            >
              Back to invoice
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { invoice, customer, settings, business } = data;

  const subtotal = toNumber(invoice.subtotal);
  const charges = toNumber(invoice.additional_charges);
  const total = toNumber(invoice.total_amount);

  const paid = toNumber(
    invoice.paid_amount ?? invoice.amount_paid
  );

  const balance = Math.max(0, total - paid);

  const notes = String(
    settings.invoice_remark || invoice.notes || ""
  ).trim();

  const terms = String(
    settings.invoice_terms || ""
  ).trim();

  const status = String(
    invoice.status || "Unpaid"
  ).replaceAll("_", " ");

  const paymentDetails = [
    ["Account Name", settings.bank_account_name],
    ["Bank Name", settings.bank_name],
    ["Account No.", settings.bank_account_number],
    ["IFSC Code", settings.bank_ifsc],
    ["UPI ID", settings.upi_id],
    ["UPI Phone", settings.upi_phone],
  ].filter(([, value]) => value);

  const customerAddress = [
    customer?.address,
    customer?.area,
  ]
    .filter(Boolean)
    .join(", ");

  const handlePrint = () => window.print();

  return (
    <main className="min-h-screen bg-[#F3F6F7] px-2 py-2 font-sans text-[#24262B] sm:px-3 sm:py-3 print:min-h-0 print:bg-white print:p-0">

      {/* SCREEN ACTIONS */}
      <div className="print:hidden mx-auto mb-2 flex max-w-[794px] items-center justify-between gap-2">
        <Link
          to={`/invoices/${invoiceId}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#DCE6E9] bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#087F8C] hover:text-[#087F8C]"
        >
          <ArrowLeft size={14} />
          Back to invoice
        </Link>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#087F8C] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#066B76]"
        >
          <Printer size={14} />
          Print / Save PDF
        </button>
      </div>

      {/* INVOICE DOCUMENT */}
      <article className="mx-auto flex w-full max-w-[794px] flex-col overflow-visible rounded-lg border border-[#DCE6E9] bg-white shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        {/* BUSINESS HEADER */}
        <header className="flex flex-col justify-between gap-2 border-b border-[#E5ECEE] px-3 py-2 sm:flex-row sm:items-center sm:px-4 print:flex-row print:px-0 print:py-1.5">

          <div className="flex min-w-0 items-center gap-2">
            {settings.business_logo_url && (
              <div className="flex size-18 shrink-0 items-center justify-center rounded-md border border-[#DCE9EA] bg-[#F7FBFB] p-1">
                <img
                  src={settings.business_logo_url}
                  alt={`${business.name || "Business"} logo`}
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#087F8C]">
                Water Delivery Invoice
              </p>

              <h1 className="mt-0.5 break-words text-[22px] font-black leading-tight text-[#24262B]">
                {business.name || "Amrit Jal"}
              </h1>

              {settings.business_address && (
                <p className="mt-0.5 flex items-start gap-1 text-[12px] leading-3.5 text-slate-500">
                  <MapPin
                    size={10}
                    className="mt-0.5 shrink-0 text-[#087F8C]"
                  />
                  {settings.business_address}
                </p>
              )}

              {settings.business_phone && (
                <p className="mt-0.5 flex items-center gap-1 text-[12px] text-slate-500">
                  <Phone size={10} className="text-[#087F8C]" />
                  {settings.business_phone}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 sm:min-w-[170px] sm:text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Invoice
            </p>

            <h2 className="mt-0.5 break-all text-lg font-black tracking-tight text-[#111827]">
              #{formatInvoiceNumber(invoice.invoice_number)}
            </h2>

            <div className="mt-1 flex flex-wrap gap-1 sm:justify-end">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#E5ECEE] px-2 py-0.5 text-[9px] font-semibold text-slate-600">
                <CalendarDays size={10} />
                {formatDate(invoice.invoice_date)}
              </span>

              <span className="inline-flex items-center rounded-full border border-[#E9CA43] bg-[#FFFDF4] px-2 py-0.5 text-[9px] font-bold capitalize text-[#8A6A00]">
                {status}
              </span>
            </div>
          </div>
        </header>

        {/* BILLING INFORMATION - SINGLE SECTION */}
        <section className="border-b border-slate-200 bg-white px-4 py-3 print:px-0 print:py-2">
          <div className="grid grid-cols-2">

            {/* BILL TO */}
            <div className="min-w-0 pr-4">
              <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                <UserRound size={16} className="text-[#087F8C]" />
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-[#087F8C]">
                  Bill To
                </h3>
              </div>

              <h4 className="break-words text-[14px] font-extrabold text-[#24262B]">
                {customer?.name || "Customer"}
              </h4>

              <div className="mt-2 space-y-2 text-[11px] text-slate-600">
                {customer?.code && (
                  <p>
                    <span className="text-slate-400">Customer ID:</span>{" "}
                    <span className="font-semibold text-slate-800">
                      {customer.code}
                    </span>
                  </p>
                )}

                {customer?.phone && (
                  <p className="flex items-center gap-2">
                    <Phone size={12} className="text-[#087F8C]" />
                    <span className="font-medium text-slate-800">
                      {customer.phone}
                    </span>
                  </p>
                )}

                {customerAddress && (
                  <p className="flex items-start gap-2">
                    <MapPin
                      size={12}
                      className="mt-0.5 shrink-0 text-[#087F8C]"
                    />
                    <span className="break-words leading-5 text-slate-700">
                      {customerAddress}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* BILLING PERIOD */}
            <div className="min-w-0 border-l border-slate-200 pl-4">
              <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                <CalendarDays size={16} className="text-[#087F8C]" />
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-[#087F8C]">
                  Billing Period
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    From <span className="ml-1 font-bold text-black text-[12px]"> {formatDate(invoice.period_start)}</span>
                  </p>

                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    to <span className="ml-1 font-bold text-black text-[12px]"> {formatDate(invoice.period_end)}</span>
                  </p>

                </div>
              </div>

              <div className="mt-3 space-y-2 border-t border-slate-100 pt-2 text-[10px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Payment Due</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(invoice.due_date || invoice.invoice_date)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Delivery Entries</span>
                  <span className="font-semibold text-slate-800">
                    {items.length}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">
                    Delivered / Received Jars
                  </span>
                  <span className="rounded bg-[#EAF5F4] px-2 py-1 text-[11px] font-extrabold text-[#087F8C]">
                    {totalQuantity}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DELIVERY DETAILS */}
        <section className="px-3 py-2 print:px-0 print:py-1">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ReceiptText size={13} className="text-[#087F8C]" />
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-800">
                Delivery Details
              </h3>
            </div>

            <span className="text-[9px] text-slate-400">
              {items.length} items
            </span>
          </div>

          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-y border-slate-200 bg-slate-50 text-[9px] font-semibold uppercase text-slate-500">
                <th className="px-2 py-1">Description</th>
                <th className="px-2 py-1 text-right">Qty</th>
                <th className="px-2 py-1 text-right">Rate</th>
                <th className="px-2 py-1 text-right">Amount</th>
              </tr>
            </thead>

            <tbody>
              {items.length ? (
                items.map((item, index) => (
                  <tr
                    key={
                      item.id ||
                      `${item.delivery_date || "line"}-${index}`
                    }
                    className="border-b border-slate-100 text-[11px] text-slate-700"
                  >
                    <td className="break-words px-2 py-1 font-medium text-slate-800">
                      {item.description || "Water jar delivery"}
                    </td>

                    <td className="px-2 py-1 text-right tabular-nums">
                      {toNumber(item.quantity) || "—"}
                    </td>

                    <td className="px-2 py-1 text-right tabular-nums">
                      {formatCurrency(item.rate)}
                    </td>

                    <td className="px-2 py-1 text-right font-semibold tabular-nums">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="py-3 text-center text-[11px] text-slate-400"
                  >
                    No invoice line items available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* PAYMENT DETAILS + INVOICE SUMMARY */}
        <section className="grid grid-cols-[minmax(0,1fr)_270px] items-stretch gap-3 border-t border-slate-200 bg-[#FBFDFD] px-3 py-3 print:px-0 print:py-2">
          {/* QR CODE + BANK DETAILS */}

          <div className="grid min-w-0 w-full grid-cols-[150px_minmax(0,1fr)] gap-4 rounded-md border border-[#DDE8EA] bg-white p-3">
            {/* QR CODE */}
            <div className="flex flex-col items-center justify-center">
              {settings.payment_qr_url ? (
                <img
                  src={settings.payment_qr_url}
                  alt="Amrit Jal payment QR code"
                  className="h-[125px] w-[125px] shrink-0 rounded-md border border-slate-200 bg-white p-1 object-contain"
                />
              ) : (
                <div className="flex h-[125px] w-[125px] items-center justify-center rounded-md border border-slate-200 text-center text-[9px] text-slate-400">
                  QR not configured
                </div>
              )}

              <p className="mt-1.5 text-center text-[10px] font-black uppercase tracking-wider text-[#087F8C]">
                Scan & Pay
              </p>

              <p className="mt-0.5 text-center text-[8px] text-slate-500">
                Pay using UPI
              </p>
            </div>

            <div className="min-w-0 border-l border-slate-200 pl-4">
              <div className="mb-3 flex items-center gap-1">
                <Building2 size={13} className="shrink-0 text-[#087F8C]" />
                <h3 className="text-[10px] font-black uppercase tracking-wider text-[#087F8C]">
                  Bank Details
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-y-3">
                {paymentDetails.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[105px_minmax(0,1fr)] items-center gap-2 text-[10px]"
                  >
                    <span className="text-slate-500">{label}</span>
                    <span className="break-all font-semibold text-slate-800">
                      — {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* INVOICE SUMMARY - RIGHT SIDE */}

          <div className="ml-auto w-full max-w-[250px] self-start rounded-md border border-[#DDE8EA] border-t-2 border-t-[#087F8C] bg-white p-3">

            <h3 className="mb-3 text-[9px] font-black uppercase tracking-[0.12em] text-[#087F8C]">
              Invoice Summary
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between gap-2 text-[10px]">
                <span className="text-slate-500">
                  Delivery Subtotal
                </span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>

              {charges !== 0 && (
                <div className="flex justify-between gap-2 text-[10px]">
                  <span className="text-slate-500">
                    Additional / Jar Charges
                  </span>
                  <strong>{formatCurrency(charges)}</strong>
                </div>
              )}

              <div className="flex justify-between gap-2 border-t border-[#E5ECEE] pt-2 text-[10px] font-bold">
                <span>Total Invoice Amount</span>
                <strong>{formatCurrency(total)}</strong>
              </div>

              <div className="flex justify-between gap-2 text-[10px]">
                <span className="text-slate-500">Amount Paid</span>
                <strong>{formatCurrency(paid)}</strong>
              </div>

              <div className="rounded-md border border-[#CDE5E3] bg-[#F1F9F8] p-2.5">
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                  Outstanding Balance
                </p>

                <p className="mt-1 text-lg font-black tabular-nums text-[#087F8C]">
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* INVOICE REMARK + TERMS */}
        <section className="border-t border-[#E5ECEE] px-4 py-4 print:px-0 print:py-3">

          <div className="mb-2 flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#EAF5F4]">
              <FileText
                size={15}
                className="text-[#087F8C]"
              />
            </div>

            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#087F8C]">
              Invoice Remark
            </h3>
          </div>

          <div className="min-h-[48px] rounded-md border border-[#E5ECEE] bg-[#FBFDFD] px-3 py-2.5">
            <p className="whitespace-pre-wrap break-words text-[10px] leading-5 text-slate-600">
              {notes || "No invoice remark has been added."}
            </p>
          </div>


        </section>

        {/* BOTTOM SIGNATURE + FOOTER */}
        <div className="mt-3">

          {/* AUTHORIZED SIGNATURE */}
          {(settings.signature_image_url || settings.signature_name) && (
            <section className="flex justify-end px-3 py-1.5 print:px-0 print:py-1">
              <div className="w-[145px] text-center">

                {settings.signature_image_url && (
                  <img
                    src={settings.signature_image_url}
                    alt="Authorized signature"
                    className="mx-auto h-7 max-w-[110px] object-contain"
                  />
                )}

                <div className="mt-1 border-t border-[#CBD5E1] pt-1.5 text-[9px] font-bold text-[#24262B]">
                  {settings.signature_name || "Authorized Signature"}
                </div>

                <p className="mt-0.5 text-[8px] text-slate-400">
                  Authorized Signatory
                </p>
              </div>
            </section>
          )}

          {/* FOOTER */}
          <footer className="border-t border-[#E5ECEE] bg-white px-3 py-1.5 text-center print:px-0 print:py-1">
            <p className="text-[10px] font-bold text-[#087F8C]">
              Thank you for choosing Amrit Jal.
            </p>

            <p className="mt-1 text-[8px] text-slate-400">
              We appreciate your business.
            </p>
          </footer>
        </div>
      </article>
    </main>
  );
}
