import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  Download,
  LoaderCircle,
  Printer,
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

import { supabase } from "../../../lib/supabase";
import { getInvoiceById } from "../services/invoiceService";
import {
  formatCurrency,
  formatDate,
  formatInvoiceNumber,
  toNumber,
} from "../utils/invoiceUtils";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

const money = (value) => formatCurrency(toNumber(value));
const textOrDash = (value) =>
  value === null || value === undefined || String(value).trim() === ""
    ? "—"
    : value;

export default function SummaryInvoicePrint() {
  const { invoiceId } = useParams();

  const paperRef = useRef(null);
  const contentRef = useRef(null);
  const pdfFrameRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fitScale, setFitScale] = useState(1);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState("");

  // Private invoice page: prevent search indexing.
  useEffect(() => {
    const oldTitle = document.title;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const robotsMeta = document.querySelector('meta[name="robots"]');
    const oldDescription = descriptionMeta?.content;
    const oldRobots = robotsMeta?.content;

    const description = descriptionMeta || document.createElement("meta");
    const robots = robotsMeta || document.createElement("meta");

    document.title = "Invoice Summary | Amrit Jal";
    description.name = "description";
    description.content = "Customer invoice summary.";
    robots.name = "robots";
    robots.content = "noindex, nofollow";

    if (!descriptionMeta) document.head.appendChild(description);
    if (!robotsMeta) document.head.appendChild(robots);

    return () => {
      document.title = oldTitle;
      if (descriptionMeta) description.content = oldDescription || "";
      else description.remove();
      if (robotsMeta) robots.content = oldRobots || "";
      else robots.remove();
    };
  }, []);

  // Load invoice, customer, settings and source delivery quantities.
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

        // Preserve the existing owner-based business lookup.
        const { data: business, error: businessError } = await supabase
          .from("businesses")
          .select("id, name")
          .eq("owner_id", user.id)
          .single();

        if (businessError) throw businessError;

        const invoice = await getInvoiceById(invoiceId, business.id);
        if (!invoice) throw new Error("Invoice not found.");

        const [customerResult, settingsResult, invoiceLinesResult] =
          await Promise.all([
            supabase
              .from("customers")
              .select("name, code, phone, address, area")
              .eq("id", invoice.customer_id)
              .eq("business_id", business.id)
              .maybeSingle(),

            supabase
              .from("business_invoice_settings")
              .select("*")
              .eq("business_id", business.id)
              .maybeSingle(),

            supabase
              .from("invoice_lines")
              .select(
                "id, source_delivery_item_id, product_id, description, quantity, unit_price, line_total"
              )
              .eq("invoice_id", invoice.id)
              .eq("business_id", business.id)
              .order("created_at", { ascending: true }),
          ]);

        if (customerResult.error) throw customerResult.error;
        if (settingsResult.error) throw settingsResult.error;
        if (invoiceLinesResult.error) throw invoiceLinesResult.error;

        const invoiceLines = invoiceLinesResult.data || [];
        const sourceIds = [
          ...new Set(
            invoiceLines
              .map((line) => line.source_delivery_item_id)
              .filter(Boolean)
          ),
        ];

        let deliveryItemById = new Map();

        if (sourceIds.length) {
          const { data: sourceRows, error: sourceError } = await supabase
            .from("delivery_items")
            .select(
              "id, delivery_id, product_id, quantity_delivered, quantity_returned"
            )
            .eq("business_id", business.id)
            .in("id", sourceIds);

          if (sourceError) throw sourceError;

          deliveryItemById = new Map(
            (sourceRows || []).map((row) => [row.id, row])
          );
        }

        const lineById = new Map(
          invoiceLines.map((line) => {
            const source = line.source_delivery_item_id
              ? deliveryItemById.get(line.source_delivery_item_id)
              : null;

            return [
              line.id,
              {
                ...line,
                delivered_quantity: source
                  ? toNumber(source.quantity_delivered)
                  : 0,
                returned_quantity: source
                  ? toNumber(source.quantity_returned)
                  : 0,
              },
            ];
          })
        );

        // invoice.items is supplied by getInvoiceById. Match its rows to
        // invoice_lines by id where possible; fall back to its own quantities.
        const invoiceItems = (invoice.items || []).map((item, index) => {
          const linkedLine =
            lineById.get(item.id) ||
            invoiceLines[index] &&
              lineById.get(invoiceLines[index].id);

          return {
            ...item,
            delivered_quantity: linkedLine
              ? linkedLine.delivered_quantity
              : toNumber(
                  item.delivered_quantity ??
                    item.quantity_delivered ??
                    item.quantity
                ),
            returned_quantity: linkedLine
              ? linkedLine.returned_quantity
              : toNumber(
                  item.returned_quantity ??
                    item.quantity_returned ??
                    item.return_quantity
                ),
            description:
              item.description ||
              linkedLine?.description ||
              item.product_name ||
              item.name ||
              "Delivery",
          };
        });

        if (active) {
          setData({
            invoice: { ...invoice, items: invoiceItems },
            invoiceLines,
            customer: customerResult.data,
            settings: settingsResult.data || {},
            business,
          });
        }
      } catch (loadError) {
        console.error("Summary invoice loading failed:", loadError);
        if (active) {
          setError(loadError.message || "Could not load summary.");
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

  const invoice = data?.invoice;
  const customer = data?.customer;
  const settings = data?.settings || {};
  const business = data?.business;
  const items = invoice?.items || [];

  const totals = useMemo(() => {
    const delivered = items.reduce(
      (sum, item) =>
        sum +
        toNumber(
          item.delivered_quantity ??
            item.quantity_delivered ??
            item.quantity
        ),
      0
    );

    const returned = items.reduce(
      (sum, item) =>
        sum +
        toNumber(
          item.returned_quantity ??
            item.quantity_returned ??
            item.return_quantity
        ),
      0
    );

    const subtotal = toNumber(invoice?.subtotal);
    const additionalCharges = toNumber(invoice?.additional_charges);
    const total = toNumber(invoice?.total_amount);
    const paid = toNumber(
      invoice?.paid_amount ?? invoice?.amount_paid
    );

    return {
      delivered,
      returned,
      subtotal,
      additionalCharges,
      total,
      paid,
      balance: Math.max(0, total - paid),
      quantity: items.reduce(
        (sum, item) => sum + toNumber(item.quantity),
        0
      ),
    };
  }, [invoice, items]);

  const customerAddress = [customer?.address, customer?.area]
    .filter(Boolean)
    .join(", ");

  // Product-wise summary: combine repeated delivery rows so the invoice
  // shows totals per product/rate, not individual date-wise transactions.
  const summaryItems = useMemo(() => {
    const groups = new Map();

    items.forEach((item) => {
      const description =
        item.description ||
        item.product_name ||
        item.name ||
        "Delivery";

      const delivered = toNumber(
        item.delivered_quantity ??
          item.quantity_delivered ??
          item.quantity
      );

      const returned = toNumber(
        item.returned_quantity ??
          item.quantity_returned ??
          item.return_quantity
      );

      const rate = toNumber(item.unit_price ?? item.rate);
      const amount = toNumber(
        item.line_total ?? item.amount ?? delivered * rate
      );

      const key = `${String(description).trim().toLowerCase()}__${rate}`;
      const current = groups.get(key) || {
        key,
        description,
        delivered: 0,
        returned: 0,
        rate,
        amount: 0,
      };

      current.delivered += delivered;
      current.returned += returned;
      current.amount += amount;
      groups.set(key, current);
    });

    return [...groups.values()].sort((a, b) =>
      a.description.localeCompare(b.description)
    );
  }, [items]);


  const invoiceRemark =
    settings.invoice_remark ||
    invoice?.invoice_remark ||
    invoice?.notes ||
    settings.invoice_terms ||
    "";

  const lostJarItems = [
    ["Thermal", toNumber(invoice?.thermal_jar_lost_qty)],
    ["Capsule", toNumber(invoice?.capsule_jar_lost_qty)],
    ["Dispenser", toNumber(invoice?.dispenser_jar_lost_qty)],
  ].filter(([, quantity]) => quantity > 0);


  // Scale the complete compact invoice to fit exactly inside one A4 page.
  useLayoutEffect(() => {
    if (!data || !paperRef.current || !contentRef.current) return;

    const measure = () => {
      const content = contentRef.current;
      const paper = paperRef.current;
      if (!content || !paper) return;

      const availableHeight = A4_HEIGHT_PX - 64;
      const naturalHeight = content.scrollHeight;
      if (!naturalHeight) return;

      setFitScale(
        Math.min(1, Number((availableHeight / naturalHeight).toFixed(4)))
      );
    };

    const observer = new ResizeObserver(measure);
    observer.observe(contentRef.current);
    observer.observe(paperRef.current);
    measure();

    return () => observer.disconnect();
  }, [data]);

  // Render the fitted A4 sheet into a single-page PDF without distorting it.
  useEffect(() => {
    if (!data || !paperRef.current) return undefined;

    let cancelled = false;
    let generatedUrl = "";

    async function generatePdf() {
      setPdfGenerating(true);
      setPdfError("");
      setPdfUrl("");

      try {
        await new Promise((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(resolve)
          )
        );

        if (cancelled || !paperRef.current) return;

        const canvas = await html2canvas(paperRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          width: A4_WIDTH_PX,
          windowWidth: A4_WIDTH_PX,
          scrollX: 0,
          scrollY: 0,
        });

        if (cancelled) return;

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });

        const imageData = canvas.toDataURL("image/jpeg", 0.97);
        pdf.addImage(
          imageData,
          "JPEG",
          0,
          0,
          A4_WIDTH_MM,
          A4_HEIGHT_MM,
          undefined,
          "FAST"
        );

        generatedUrl = URL.createObjectURL(pdf.output("blob"));
        if (!cancelled) setPdfUrl(generatedUrl);
      } catch (generationError) {
        console.error("Summary PDF generation failed:", generationError);
        if (!cancelled) {
          setPdfError(
            generationError?.message || "Unable to generate the PDF."
          );
        }
      } finally {
        if (!cancelled) setPdfGenerating(false);
      }
    }

    void generatePdf();

    return () => {
      cancelled = true;
      if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    };
  }, [data, fitScale]);

  useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl]
  );

  const handleDownload = () => {
    if (!pdfUrl) return;

    const anchor = document.createElement("a");
    anchor.href = pdfUrl;
    anchor.download = `${formatInvoiceNumber(
      invoice?.invoice_number || "invoice-summary"
    )}-summary.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handlePrint = () => {
    if (!pdfUrl) return;

    const frameWindow = pdfFrameRef.current?.contentWindow;
    if (!frameWindow) {
      setPdfError("PDF preview is not ready. Please wait or download it.");
      return;
    }

    try {
      frameWindow.focus();
      frameWindow.print();
      setPdfError("");
    } catch (printError) {
      console.error("Summary PDF print failed:", printError);
      handleDownload();
      setPdfError(
        "Direct printing is not supported here. The PDF download has started; print it from your device's PDF viewer."
      );
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center gap-2 bg-slate-100 text-sm text-slate-600">
        <LoaderCircle size={20} className="animate-spin text-cyan-700" />
        Loading summary...
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-lg rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-2 text-rose-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p className="font-semibold">{error || "Invoice not found."}</p>
          </div>
          <Link
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 underline"
            to={`/invoices/${invoiceId}`}
          >
            <ArrowLeft size={15} />
            Back to invoice
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-slate-100 font-sans text-slate-800">
      {/* Responsive app-like toolbar */}
      <div className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-2 py-2 shadow-sm backdrop-blur sm:px-3">
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-2">
          <Link
            to={`/invoices/${invoiceId}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to invoice</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="truncate text-sm font-bold">Invoice Summary</p>
            <p className="hidden text-[11px] text-slate-500 sm:block">
              {formatInvoiceNumber(invoice.invoice_number)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!pdfUrl || pdfGenerating}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-700 px-3 text-sm font-bold text-white disabled:opacity-50"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!pdfUrl || pdfGenerating}
              aria-label="Download PDF"
              className="inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-lg border border-cyan-700 bg-white px-3 text-sm font-bold text-cyan-800 disabled:opacity-50"
            >
              <Download size={17} />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
      </div>

      {pdfGenerating && (
        <div className="no-print mx-auto mt-3 flex max-w-[1100px] items-center gap-2 px-3 text-sm text-slate-600">
          <LoaderCircle size={17} className="animate-spin text-cyan-700" />
          Preparing one-page A4 invoice...
        </div>
      )}

      {pdfError && (
        <div
          role="alert"
          className="no-print mx-3 mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 sm:mx-auto sm:max-w-[1100px]"
        >
          {pdfError}
        </div>
      )}

      {pdfUrl ? (
        <section className="no-print mx-auto h-[calc(100dvh-60px)] min-h-[360px] w-full max-w-[1100px] overflow-hidden bg-slate-200 sm:h-[calc(100dvh-66px)] sm:min-h-[420px] sm:p-3">
          <div className="h-full overflow-hidden bg-slate-300 shadow-sm sm:rounded-lg sm:border sm:border-slate-300">
            <iframe
              ref={pdfFrameRef}
              title="Invoice summary PDF preview"
              src={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
              className="block h-full w-full border-0 bg-slate-200"
            />
          </div>
        </section>
      ) : null}

      {/* A4 PDF source — compact redesigned one-page layout */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-100000px] top-0 z-[-1]"
      >
        <article
          ref={paperRef}
          className="box-border h-[1123px] w-[794px] overflow-hidden bg-white px-[34px] py-[28px] text-slate-800"
          style={{ width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px` }}
        >
          <div
            ref={contentRef}
            className="origin-top-left"
            style={{
              width: `${100 / fitScale}%`,
              transform: `scale(${fitScale})`,
            }}
          >
            {/* Header */}
            <header className="flex items-start justify-between gap-5 border-b-[3px] border-cyan-800 pb-4">
              <div className="flex min-w-0 items-center gap-3">
                {settings.business_logo_url && (
                  <img
                    src={settings.business_logo_url}
                    alt="Business logo"
                    crossOrigin="anonymous"
                    className="h-[58px] w-[58px] shrink-0 rounded-lg border border-slate-200 object-contain p-1"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[2px] text-cyan-700">
                    Water Delivery Invoice
                  </p>
                  <h1 className="mt-0.5 text-[20px] font-black leading-tight text-slate-900">
                    {business.name || "Business"}
                  </h1>
                  {settings.business_address && (
                    <p className="mt-1 max-w-[410px] text-[10px] leading-snug text-slate-500">
                      {settings.business_address}
                    </p>
                  )}
                  {settings.business_phone && (
                    <p className="mt-1 text-[10px] font-semibold text-slate-600">
                      Phone: {settings.business_phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[9px] font-bold uppercase tracking-[2px] text-slate-400">
                  Invoice Summary
                </p>
                <p className="mt-1 text-[17px] font-black text-slate-900">
                  {formatInvoiceNumber(invoice.invoice_number)}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {formatDate(invoice.invoice_date)}
                </p>
                <span className="mt-2 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-[9px] font-bold text-cyan-800">
                  {String(invoice.status || "Issued").toUpperCase()}
                </span>
              </div>
            </header>

            {/* Customer and billing period */}
            <section className="mt-3 grid grid-cols-2 gap-4 border-b border-slate-200 pb-3">
              <div className="pr-4">
                <p className="text-[9px] font-black uppercase tracking-[1.3px] text-cyan-800">
                  Bill To
                </p>
                <p className="mt-2 text-[16px] font-extrabold text-slate-900">
                  {customer?.name || "Customer"}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Customer ID: {textOrDash(customer?.code)}
                </p>
                {customer?.phone && (
                  <p className="mt-1 text-[10px] text-slate-600">
                    Phone: {customer.phone}
                  </p>
                )}
                {customerAddress && (
                  <p className="mt-1 max-w-[330px] text-[10px] leading-snug text-slate-600">
                    {customerAddress}
                  </p>
                )}
              </div>

              <div className="border-l border-slate-200 pl-5">
                <p className="text-[9px] font-black uppercase tracking-[1.3px] text-cyan-800">
                  Billing Period
                </p>
                <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-slate-400">From</span>
                  <strong>{formatDate(invoice.period_start)}</strong>
                  <span className="text-slate-400">To</span>
                  <strong>{formatDate(invoice.period_end)}</strong>
                </div>

              </div>
            </section>

            {/* Product-wise delivered and returned summary */}
            <section className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[11px] font-black uppercase tracking-[1px] text-slate-800">
                  Product-wise Delivery Summary
                </h2>
                <span className="text-[9px] text-slate-400">
                  {summaryItems.length} product types
                </span>
              </div>

              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    <th className="w-[36%] px-3 py-2 text-left">Product</th>
                    <th className="w-[16%] px-2 py-2 text-right">Delivered</th>
                    <th className="w-[16%] px-2 py-2 text-right">Returned</th>
                    <th className="w-[15%] px-2 py-2 text-right">Rate</th>
                    <th className="w-[17%] px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryItems.length ? (
                    summaryItems.map((item) => (
                      <tr
                        key={item.key}
                        className="border-b border-slate-100 text-[10px]"
                      >
                        <td className="px-3 py-[6px] font-semibold text-slate-700">
                          {item.description}
                        </td>
                        <td className="px-2 py-[6px] text-right font-bold tabular-nums text-cyan-800">
                          {item.delivered}
                        </td>
                        <td className="px-2 py-[6px] text-right font-bold tabular-nums text-rose-700">
                          {item.returned > 0 ? item.returned : "—"}
                        </td>
                        <td className="px-2 py-[6px] text-right tabular-nums text-slate-600">
                          {money(item.rate)}
                        </td>
                        <td className="px-3 py-[6px] text-right font-bold tabular-nums text-slate-800">
                          {money(item.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-5 text-center text-[10px] text-slate-400"
                      >
                        No delivery entries found.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 text-[10px] font-black">
                    <td className="px-3 py-2 text-left">Total</td>
                    <td className="px-2 py-2 text-right text-cyan-800">
                      {totals.delivered}
                    </td>
                    <td className="px-2 py-2 text-right text-rose-700">
                      {totals.returned}
                    </td>
                    <td />
                    <td className="px-3 py-2 text-right">
                      {money(totals.subtotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>

            {/* Optional lost-jar strip */}
            {lostJarItems.length > 0 && (
              <section className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[9px] font-black uppercase tracking-[1px] text-amber-900">
                    Lost Jar Summary
                  </h2>
                  <span className="text-[8px] font-bold text-amber-800">
                    Total: {lostJarItems.reduce((sum, [, qty]) => sum + qty, 0)}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {lostJarItems.map(([label, quantity]) => (
                    <div
                      key={label}
                      className="flex min-w-[90px] flex-1 items-center justify-between rounded-md border border-amber-100 bg-white/80 px-2.5 py-1.5"
                    >
                      <span className="text-[8px] text-slate-600">{label}</span>
                      <strong className="text-[11px] text-amber-900">
                        {quantity}
                      </strong>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Payment and invoice totals */}
            <section className="mt-3 grid grid-cols-[1.18fr_0.82fr] items-stretch gap-3">
              {/* Payment information: QR/UPI left, bank right */}
              <div className="min-w-0 rounded-lg border border-slate-200 p-3">
                <h2 className="text-[9px] font-black uppercase tracking-[1px] text-slate-800">
                  Payment Information
                </h2>

                <div className="mt-2 grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-2.5">
                  <div className="flex min-w-0 flex-col items-center border-r border-slate-200 pr-2.5">
                     <p className="mb-1 text-[7px] font-black uppercase tracking-wide text-cyan-800">
                      Scan & Pay
                    </p>
                    {settings.payment_qr_url ? (
                      <img
                        src={settings.payment_qr_url}
                        alt="Payment QR code"
                        crossOrigin="anonymous"
                        className="h-[94px] w-[94px] object-contain"
                      />
                    ) : (
                      <div className="flex h-[94px] w-[94px] items-center justify-center rounded-md border border-dashed border-slate-300 text-center text-[8px] text-slate-400">
                        QR not added
                      </div>
                    )}

                   

                    {settings.upi_id && (
                      <p className="mt-1.5 w-full break-all text-center text-[7px] font-semibold leading-snug text-slate-700">
                        {settings.upi_id}
                      </p>
                    )}

                  </div>

                  <div className="min-w-0">
                    <h3 className="mb-2 text-[8px] font-black uppercase tracking-wide text-cyan-800">
                      Bank Details
                    </h3>

                    <div className="space-y-2">
                      {[
                        ["Account Name", settings.bank_account_name],
                        ["Bank Name", settings.bank_name],
                        ["Account No.", settings.bank_account_number],
                        ["IFSC Code", settings.bank_ifsc],
                        ["UPI No.", settings.upi_phone],
                      ]
                        .filter(([, value]) => value)
                        .map(([label, value]) => (
                          <div
                            key={label}
                            className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] items-start gap-1 text-[7px] leading-snug"
                          >
                            <span className="text-slate-500">{label}</span>
                            <strong className="break-all text-slate-700">
                              — {value}
                            </strong>
                          </div>
                        ))}

                      {!settings.bank_account_name &&
                        !settings.bank_name &&
                        !settings.bank_account_number &&
                        !settings.bank_ifsc && (
                          <p className="text-[8px] text-slate-400">
                            Bank details not configured.
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice totals */}
              <div className="min-w-0 rounded-lg border border-slate-200 p-3">
                <h2 className="mb-2 text-[9px] font-black uppercase tracking-[1px] text-slate-800">
                  Invoice Summary
                </h2>

                <div className="space-y-2">
                  <div className="flex justify-between gap-2 text-[8px]">
                    <span className="text-slate-500">Delivery Subtotal</span>
                    <strong className="text-slate-700">
                      {money(totals.subtotal)}
                    </strong>
                  </div>

                  {totals.additionalCharges !== 0 && (
                    <div className="flex justify-between gap-2 text-[8px]">
                      <span className="text-slate-500">Additional Charges</span>
                      <strong className="text-slate-700">
                        {money(totals.additionalCharges)}
                      </strong>
                    </div>
                  )}

                  <div className="rounded-md bg-cyan-50 px-2.5 py-2">
                    <div className="flex justify-between gap-2 text-[9px] font-black text-cyan-900">
                      <span>Total Invoice</span>
                      <span>{money(totals.total)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between gap-2 text-[8px]">
                    <span className="text-slate-500">Amount Paid</span>
                    <strong className="text-slate-700">
                      {money(totals.paid)}
                    </strong>
                  </div>

                  <div className="border-t border-slate-100 pt-2">
                    <div className="flex justify-between gap-2 text-[8px] font-bold text-slate-600">
                      <span>Outstanding Balance</span>
                      <strong className="text-[12px] text-rose-700">
                        {money(totals.balance)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <footer className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-[8px] text-slate-400">
              <span>Generated from the saved invoice record.</span>
              <span className="font-semibold text-slate-600">
                Thank you for your business.
              </span>
            </footer>

            {/* Invoice remark is intentionally the final section */}
            <section className="mt-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <h2 className="text-[8px] font-black uppercase tracking-[1.2px] text-amber-900">
                  Invoice Remark
                </h2>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-[7.5px] leading-relaxed text-slate-700">
                {invoiceRemark || "No invoice remark added."}
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
