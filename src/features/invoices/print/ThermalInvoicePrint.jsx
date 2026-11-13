
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  LoaderCircle,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";
import { getInvoiceById } from "../services/invoiceService";

import {
  formatCurrency,
  formatDate,
  formatInvoiceNumber,
  toNumber,
} from "../utils/invoiceUtils";

export default function ThermalInvoicePrint() {
  const { invoiceId } = useParams();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paperWidth, setPaperWidth] = useState("80");

  // --------------------------------------------------
  // SEO: Private invoice print page
  // --------------------------------------------------

  useEffect(() => {
    const previousTitle = document.title;

    const previousMeta = {
      description: document.querySelector('meta[name="description"]'),
      robots: document.querySelector('meta[name="robots"]'),
    };

    const previousDescription =
      previousMeta.description?.getAttribute("content");

    const previousRobots =
      previousMeta.robots?.getAttribute("content");

    document.title = "Thermal Invoice Print | Amrit Jal";

    let descriptionMeta = previousMeta.description;
    if (!descriptionMeta) {
      descriptionMeta = document.createElement("meta");
      descriptionMeta.name = "description";
      document.head.appendChild(descriptionMeta);
    }

    descriptionMeta.content =
      "Private thermal invoice printing page for Amrit Jal.";

    let robotsMeta = previousMeta.robots;
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.name = "robots";
      document.head.appendChild(robotsMeta);
    }

    robotsMeta.content = "noindex, nofollow, noarchive";

    return () => {
      document.title = previousTitle;

      if (previousMeta.description) {
        descriptionMeta.setAttribute(
          "content",
          previousDescription ?? ""
        );
      } else {
        descriptionMeta.remove();
      }

      if (previousMeta.robots) {
        robotsMeta.setAttribute(
          "content",
          previousRobots ?? ""
        );
      } else {
        robotsMeta.remove();
      }
    };
  }, []);

  // --------------------------------------------------
  // Load invoice data
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const {
          data: auth,
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!auth.user) {
          throw new Error("Please log in first.");
        }

        const {
          data: business,
          error: businessError,
        } = await supabase
          .from("businesses")
          .select("id, name")
          .eq("owner_id", auth.user.id)
          .single();

        if (businessError) throw businessError;

        const invoice = await getInvoiceById(
          invoiceId,
          business.id
        );

        const [
          customerResult,
          settingsResult,
        ] = await Promise.all([
          supabase
            .from("customers")
            .select("name, code, phone, address")
            .eq("id", invoice.customer_id)
            .maybeSingle(),

          supabase
            .from("business_invoice_settings")
            .select("*")
            .eq("business_id", business.id)
            .maybeSingle(),
        ]);

        if (customerResult.error) {
          throw customerResult.error;
        }

        if (settingsResult.error) {
          throw settingsResult.error;
        }

        if (active) {
          setData({
            invoice,
            customer: customerResult.data,
            settings: settingsResult.data,
            business,
          });
        }
      } catch (e) {
        if (active) {
          setError(
            e.message || "Could not load receipt."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [invoiceId]);

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (loading) {
    return (
      <main
        className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-600"
        aria-live="polite"
      >
        <LoaderCircle
          className="animate-spin"
          size={20}
          aria-hidden="true"
        />
        Loading receipt...
      </main>
    );
  }

  // --------------------------------------------------
  // Error state
  // --------------------------------------------------

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-6">
          <h1 className="text-lg font-bold text-slate-900">
            Unable to load invoice
          </h1>

          <p className="mt-2 text-sm text-red-700" role="alert">
            {error || "Invoice not found."}
          </p>

          <Link
            className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold"
            to={`/invoices/${invoiceId}`}
          >
            <ArrowLeft size={16} />
            Back to invoice
          </Link>
        </div>
      </main>
    );
  }

  const {
    invoice,
    customer,
    settings,
    business,
  } = data;

  // --------------------------------------------------
  // Invoice calculations
  // --------------------------------------------------

  const items = invoice.items || [];

  const subtotal = toNumber(invoice.subtotal);
  const charges = toNumber(invoice.additional_charges);
  const previousOutstanding = toNumber(invoice.previous_outstanding);
  const discount = toNumber(invoice.discount);
  const total = toNumber(invoice.total_amount);
  const paid = toNumber(invoice.paid_amount);

  const balance = Math.max(0, total - paid);

  const quantity = items.reduce(
    (sum, item) => sum + toNumber(item.quantity),
    0
  );


  // --------------------------------------------------
  // Date helpers
  // --------------------------------------------------

  const parseDateOnly = (value) => {
    if (!value) return null;

    const match = String(value).match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

    if (match) {
      return new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      );
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate()
    );
  };

  const dateKey = (date) =>
    `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;

  const periodStart = parseDateOnly(invoice.period_start);
  const periodEnd = parseDateOnly(invoice.period_end);

  // --------------------------------------------------
  // Product summary
  // --------------------------------------------------

  const summaryProducts = [
    ...new Set(
      items.map((item) =>
        String(
          item.description || "Water jar delivery"
        ).trim()
      )
    ),
  ];

  const dailyProductQty = {};

  items.forEach((item) => {
    const date = parseDateOnly(item.delivery_date);

    if (!date) return;

    const key = dateKey(date);

    const product = String(
      item.description || "Water jar delivery"
    ).trim();

    if (!dailyProductQty[key]) {
      dailyProductQty[key] = {};
    }

    dailyProductQty[key][product] =
      (dailyProductQty[key][product] || 0) +
      toNumber(item.quantity);
  });

  const summaryDays = [];

  if (
    periodStart &&
    periodEnd &&
    periodEnd >= periodStart
  ) {
    const cursor = new Date(periodStart);

    while (cursor <= periodEnd) {
      summaryDays.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const summaryWeeks = [];

  for (
    let i = 0;
    i < summaryDays.length;
    i += 7
  ) {
    summaryWeeks.push(
      summaryDays.slice(i, i + 7)
    );
  }

  // --------------------------------------------------
  // Lost jar calculations
  // --------------------------------------------------

  const thermalLost = toNumber(
    invoice.thermal_jar_lost_qty
  );

  const capsuleLost = toNumber(
    invoice.capsule_jar_lost_qty
  );

  const dispenserLost = toNumber(
    invoice.dispenser_jar_lost_qty
  );

  const hasLostJars =
    thermalLost > 0 ||
    capsuleLost > 0 ||
    dispenserLost > 0;

  // --------------------------------------------------
  // Invoice remark
  // --------------------------------------------------

  const invoiceRemark =
    invoice.remark || invoice.notes || "";



const handlePrint = async () => {
  try {
    const images = Array.from(
      document.querySelectorAll(".thermal-paper img")
    );

    await Promise.all(
      images.map(async (img) => {
        if (img.complete && img.naturalWidth > 0) return;

        if (typeof img.decode === "function") {
          try {
            await img.decode();
          } catch {
            // Continue if an optional image cannot decode.
          }
          return;
        }

        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    window.print();
  } catch (error) {
    console.error("Thermal print error:", error);
    window.print();
  }
};


  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-slate-100 p-4">

      {/* PRINT STYLES */}


      <style>{`
  @page {
    size: ${paperWidth}mm auto;
    margin: 3mm;
  }

  @media print {
    html,
    body,
    #root {
      width: 100% !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }

    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .no-print {
      display: none !important;
    }

    .thermal-paper {
      width: ${paperWidth === "58" ? "48mm" : "72mm"} !important;
      max-width: none !important;
      min-width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-size: ${paperWidth === "58" ? "9px" : "10px"} !important;
      line-height: 1.35 !important;
      overflow: visible !important;
    }

    .thermal-paper * {
      box-shadow: none !important;
    }

    .thermal-paper h1 {
      font-size: ${paperWidth === "58" ? "15px" : "18px"} !important;
    }

    .thermal-paper h2 {
      font-size: ${paperWidth === "58" ? "10px" : "12px"} !important;
    }

    .thermal-paper table {
      width: 100% !important;
      font-size: ${paperWidth === "58" ? "7px" : "9px"} !important;
      table-layout: fixed !important;
    }

    .thermal-paper th,
    .thermal-paper td {
      padding: 2px 1px !important;
      overflow-wrap: anywhere !important;
      word-break: break-word !important;
    }

    .thermal-paper img {
      max-width: 100% !important;
      height: auto;
      object-fit: contain;
    }

    .thermal-paper p,
    .thermal-paper span {
      overflow-wrap: anywhere;
    }

    .thermal-paper tr,
    .thermal-paper section,
    .thermal-paper header,
    .thermal-paper footer,
    .invoice-remark {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .thermal-paper {
      break-after: auto;
      page-break-after: auto;
    }
  }
`}</style>


      {/* ACTION BAR */}

      <div className="no-print mx-auto mb-5 flex max-w-3xl flex-wrap items-center justify-between gap-3">

        <Link
          to={`/invoices/${invoiceId}`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <div className="flex flex-wrap items-center gap-2">

          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            Paper size

            <select
              value={paperWidth}
              onChange={(event) =>
                setPaperWidth(event.target.value)
              }
              aria-label="Select thermal paper width"
              className="bg-transparent font-semibold outline-none"
            >
              <option value="58">58 mm</option>
              <option value="80">80 mm</option>
            </select>
          </label>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
          >
            <Printer size={16} />
            Print receipt
          </button>

        </div>
      </div>

      {/* THERMAL RECEIPT */}

      <article
        className="thermal-paper mx-auto border border-slate-200 bg-white p-4 shadow-sm"
        aria-label={`Invoice ${formatInvoiceNumber(
          invoice.invoice_number
        )}`}
        style={{
          width: paperWidth === "58" ? "48mm" : "72mm",
        }}
      >

        {/* BUSINESS HEADER */}

        <header className="text-center">

          {settings?.business_logo_url && (
            <img
              src={settings.business_logo_url}
              alt={`${business.name || "Business"} logo`}
              className="mx-auto mb-2 max-h-16 max-w-28 object-contain"
            />
          )}

          <h1 className="text-lg font-black uppercase tracking-wide">
            {business.name || "Business"}
          </h1>

          {settings?.business_address && (
            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed">
              {settings.business_address}
            </p>
          )}

          {settings?.business_phone && (
            <p className="mt-1 text-xs">
              Phone: {settings.business_phone}
            </p>
          )}

          <div className="my-3 border-t border-dashed border-black" />

          <h2 className="text-sm font-extrabold tracking-wide">
            INVOICE / RECEIPT
          </h2>

          <p className="mt-1 text-xs font-semibold">
            {formatInvoiceNumber(invoice.invoice_number)}
          </p>

        </header>

        <div className="my-3 border-t border-dashed border-black" />

        {/* CUSTOMER DETAILS */}

        <section
          aria-label="Customer and invoice details"
          className="space-y-1 text-xs"
        >
          <p>
            <strong>Customer:</strong>{" "}
            {customer?.name || "Customer"}
          </p>

          {customer?.code && (
            <p>
              <strong>Code:</strong> {customer.code}
            </p>
          )}

          {customer?.phone && (
            <p>
              <strong>Phone:</strong> {customer.phone}
            </p>
          )}

          <p>
            <strong>Invoice date:</strong>{" "}
            {formatDate(invoice.invoice_date)}
          </p>

          <p>
            <strong>Period:</strong>{" "}
            {formatDate(invoice.period_start)} –{" "}
            {formatDate(invoice.period_end)}
          </p>

        </section>

        <div className="my-3 border-t border-dashed border-black" />

        {/* ITEM DETAILS */}

        <section aria-label="Invoice items" className="text-[10px]">

          <h2 className="mb-1 text-center font-extrabold">
            DELIVERY DETAILS
          </h2>

          {items.length > 0 ? (
            <div className="space-y-2">

              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="border-b border-dashed border-slate-300 pb-1"
                >
                  <p className="font-semibold">
                    {item.description || "Water jar delivery"}
                  </p>

                  <div className="mt-1 flex justify-between gap-1">
                    <span>
                      Qty: {toNumber(item.quantity)}
                    </span>

                    <span>
                      {formatCurrency(
                        toNumber(
                          item.amount ??
                          toNumber(item.quantity) *
                          toNumber(item.rate)
                        )
                      )}
                    </span>
                  </div>

                  {item.rate !== undefined && (
                    <p className="mt-1 text-[8px] text-slate-600">
                      Rate: {formatCurrency(toNumber(item.rate))}
                    </p>
                  )}
                </div>
              ))}

            </div>
          ) : (
            <p className="text-center">
              No invoice items found.
            </p>
          )}

        </section>

        <div className="my-3 border-t border-dashed border-black" />


        {/* BILL SUMMARY */}

        <section
          aria-label="Invoice amount summary"
          className="space-y-2 text-xs"
        >
          <h2 className="text-center font-extrabold">
            BILL SUMMARY
          </h2>

          <div className="flex justify-between gap-2">
            <span>Total Quantity</span>
            <span className="font-semibold">{quantity}</span>
          </div>

          <div className="flex justify-between gap-2">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {charges !== 0 && (
            <div className="flex justify-between gap-2">
              <span>Additional / Jar Charges</span>
              <span>{formatCurrency(charges)}</span>
            </div>
          )}

          {previousOutstanding !== 0 && (
            <div className="flex justify-between gap-2">
              <span>Previous Outstanding</span>
              <span>{formatCurrency(previousOutstanding)}</span>
            </div>
          )}

          {discount !== 0 && (
            <div className="flex justify-between gap-2">
              <span>Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}

          <div className="flex justify-between gap-2 border-y border-black py-2 text-sm font-black">
            <span>TOTAL</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <div className="flex justify-between gap-2">
            <span>Paid</span>
            <span>{formatCurrency(paid)}</span>
          </div>

          <div className="flex justify-between gap-2 text-sm font-extrabold">
            <span>BALANCE DUE</span>
            <span>{formatCurrency(balance)}</span>
          </div>
        </section>


        {/* DATE-WISE DELIVERY SUMMARY */}

        {summaryWeeks.length > 0 &&
          summaryProducts.length > 0 && (
            <>
              <div className="my-3 border-t border-dashed border-black" />

              <section
                aria-label="Delivered product summary"
                className="text-[9px]"
              >

                <h2 className="mb-2 text-center font-extrabold">
                  Delivered Product Summary
                </h2>

                {summaryWeeks.map((weekDays, weekIndex) => (
                  <div
                    key={`week-${weekIndex}`}
                    className="mb-2"
                  >

                    <table className="w-full table-fixed border-collapse text-[8px]">

                      <thead>
                        <tr className="border-y border-dashed border-black">

                          <th className="w-[25%] py-1 text-left font-normal">
                            Date
                          </th>

                          {weekDays.map((day) => (
                            <th
                              key={dateKey(day)}
                              className="py-1 text-center font-normal"
                            >
                              {day.getDate()}
                            </th>
                          ))}

                          {Array.from({
                            length: 7 - weekDays.length,
                          }).map((_, i) => (
                            <th
                              key={`empty-date-${i}`}
                              className="py-1"
                            />
                          ))}

                        </tr>
                      </thead>

                      <tbody>

                        {summaryProducts.map((product) => {

                          const hasQty = weekDays.some(
                            (day) =>
                              dailyProductQty[
                              dateKey(day)
                              ]?.[product] !== undefined
                          );

                          if (!hasQty) return null;

                          return (
                            <tr
                              key={product}
                              className="border-b border-dashed border-black"
                            >

                              <td className="break-words py-1 pr-1 text-left align-top">
                                {product}
                              </td>

                              {weekDays.map((day) => {
                                const value =
                                  dailyProductQty[
                                  dateKey(day)
                                  ]?.[product];

                                return (
                                  <td
                                    key={dateKey(day)}
                                    className="py-1 text-center align-top"
                                  >
                                    {value === undefined
                                      ? "–"
                                      : value}
                                  </td>
                                );
                              })}

                              {Array.from({
                                length: 7 - weekDays.length,
                              }).map((_, i) => (
                                <td
                                  key={`empty-qty-${i}`}
                                  className="py-1"
                                />
                              ))}

                            </tr>
                          );
                        })}

                      </tbody>

                    </table>

                  </div>
                ))}

              </section>
            </>
          )}

        {/* LOST JARS */}

        {hasLostJars && (
          <>
            <div className="my-3 border-t border-dashed border-black" />

            <section
              aria-label="Lost jars"
              className="text-xs"
            >

              <h2 className="mb-2 font-bold">
                Lost Jars
              </h2>

              {thermalLost > 0 && (
                <p className="flex justify-between">
                  <span>Thermal</span>
                  <strong>{thermalLost}</strong>
                </p>
              )}

              {capsuleLost > 0 && (
                <p className="flex justify-between">
                  <span>Capsule</span>
                  <strong>{capsuleLost}</strong>
                </p>
              )}

              {dispenserLost > 0 && (
                <p className="flex justify-between">
                  <span>Dispenser</span>
                  <strong>{dispenserLost}</strong>
                </p>
              )}

            </section>
          </>
        )}

        {/* PAYMENT QR */}

        {settings?.payment_qr_url && (
          <section className="mt-4 border-t border-dashed border-black pt-3 text-center">

            <h2 className="mb-2 text-xs font-bold">
              SCAN TO PAY
            </h2>

            <img
              src={settings.payment_qr_url}
              alt="Payment QR code"
              className="mx-auto h-40 w-40 object-contain"
            />

            {settings?.upi_id && (
              <p className="mt-2 break-all text-xs">
                UPI: {settings.upi_id}
              </p>
            )}

          </section>
        )}

        {/* BANK DETAILS */}

        {settings?.bank_name && (
          <section className="mt-3 border-t border-dashed border-black pt-3 text-xs">

            <h2 className="mb-2 font-bold">
              Bank Details
            </h2>

            <p>{settings.bank_name}</p>

            {settings.bank_account_number && (
              <p className="mt-1 break-all">
                A/C: {settings.bank_account_number}
              </p>
            )}

            {settings.bank_ifsc && (
              <p className="mt-1">
                IFSC: {settings.bank_ifsc}
              </p>
            )}

          </section>
        )}

        {/* INVOICE REMARK - LAST CONTENT SECTION */}

        {/* INVOICE REMARK */}
        {settings?.invoice_remark?.trim() && (
          <section className="mt-2 border-t border-dashed border-black pt-2 invoice-remark">
            <h2 className="mb-1 text-[10px] font-bold uppercase">
              Invoice Remark
            </h2>

            <p className="whitespace-pre-wrap break-words text-[9px] leading-tight text-slate-700">
              {settings.invoice_remark.trim()}
            </p>
          </section>
        )}

        {/* FOOTER */}

        <footer className="mt-4 border-t border-dashed border-black pt-3 text-center text-xs">

          <p className="font-bold">
            Thank you!
          </p>

          <p className="mt-1">
            Please keep this receipt for your records.
          </p>

          <p className="mt-2 text-[10px] font-semibold">
            {business.name || "Amrit Jal"}
          </p>

        </footer>

      </article>

    </main>
  );
}
