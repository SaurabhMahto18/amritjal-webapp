
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useParams } from "react-router-dom";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

import { supabase } from "../../../lib/supabase";

import {
  AlertCircle,
  ArrowLeft,
  Download,
  LoaderCircle,
  Printer,
} from "lucide-react";

import {
  formatCurrency,
  formatDate,
  formatInvoiceNumber,
  toNumber,
} from "../utils/invoiceUtils";

import { getInvoiceReportData } from "../services/invoiceReportService";

// =====================================================
// HELPERS
// =====================================================

const datePart = (value) =>
  value ? String(value).slice(0, 10) : "";

const getMonthInfo = (value) => {
  const part = datePart(value);

  if (!part) {
    const now = new Date();

    return {
      year: now.getFullYear(),
      monthIndex: now.getMonth(),
    };
  }

  const [year, month] = part.split("-").map(Number);

  return { year, monthIndex: month - 1 };
};

const monthLabel = (value) => {
  const { year, monthIndex } = getMonthInfo(value);

  return new Date(year, monthIndex, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const statusLabel = (invoice) => {
  const raw = String(invoice?.status || "").toLowerCase();
  const total = toNumber(invoice?.total_amount);
  const paid = toNumber(invoice?.amount_paid);

  if (raw === "void") return "VOID";
  if (raw === "draft") return "DRAFT";
  if (raw === "paid" || (total > 0 && paid >= total)) return "PAID";
  if (paid > 0) return "PARTIALLY PAID";

  return "UNPAID";
};

const safeText = (value) =>
  value === null || value === undefined || value === "" ? "—" : value;

const safeMoney = (value) =>
  value === null || value === undefined || value === ""
    ? "—"
    : formatCurrency(value);

const getTodayLabel = () =>
  new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function ReportStyleInvoicePrint() {
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

  const [generatedAt] = useState(getTodayLabel);

  // Hide the shared application chrome while this dedicated invoice report is open.

  useEffect(() => {
    const appHeader = document.querySelector("header.sticky");
    const appSidebar = document.querySelector("aside.fixed");
    const appContent = appHeader?.parentElement || null;
    const appShell = appContent?.parentElement || null;
    const appOutletMain = appContent?.querySelector(":scope > main") || null;

    const previousStyles = [
      appHeader,
      appSidebar,
      appContent,
      appShell,
      appOutletMain,
    ]
      .filter(Boolean)
      .map((element) => ({
        element,
        style: element.getAttribute("style"),
      }));

    if (appHeader) appHeader.style.display = "none";
    if (appSidebar) appSidebar.style.display = "none";

    if (appContent) {
      appContent.style.width = "100%";
      appContent.style.marginLeft = "0";
      appContent.style.minWidth = "0";
    }

    if (appShell) {
      appShell.style.display = "block";
      appShell.style.width = "100%";
      appShell.style.minHeight = "0";
    }

    if (appOutletMain) {
      appOutletMain.style.width = "100%";
      appOutletMain.style.minHeight = "0";
      appOutletMain.style.margin = "0";
    }

    return () => {
      previousStyles.forEach(({ element, style }) => {
        if (style === null) element.removeAttribute("style");
        else element.setAttribute("style", style);
      });
    };
  }, []);

  // ===================================================
  // SEO
  // ===================================================

  useEffect(() => {
    const oldTitle = document.title;

    const description = document.querySelector('meta[name="description"]');
    const robots = document.querySelector('meta[name="robots"]');

    const oldDescription = description?.getAttribute("content");
    const oldRobots = robots?.getAttribute("content");

    const descriptionMeta = description || document.createElement("meta");
    const robotsMeta = robots || document.createElement("meta");

    document.title = "Invoice Report | Amrit Jal";

    descriptionMeta.name = "description";
    descriptionMeta.content =
      "Detailed monthly customer invoice and delivery report.";

    robotsMeta.name = "robots";
    robotsMeta.content = "noindex, nofollow";

    if (!description) document.head.appendChild(descriptionMeta);
    if (!robots) document.head.appendChild(robotsMeta);

    return () => {
      document.title = oldTitle;

      if (description) {
        description.setAttribute("content", oldDescription || "");
      } else {
        descriptionMeta.remove();
      }

      if (robots) {
        robots.setAttribute("content", oldRobots || "");
      } else {
        robotsMeta.remove();
      }
    };
  }, []);

  // ===================================================
  // LOAD REPORT
  // ===================================================

  useEffect(() => {
    let active = true;

    async function loadReport() {
      if (!invoiceId) {
        setError("Invoice ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result = await getInvoiceReportData(invoiceId);

        const businessId =
          result?.business?.id || result?.invoice?.business_id;

        let invoiceSettings = result?.settings || {};

        if (businessId) {
          // Fetch the complete saved settings row so payment and remark
          // fields do not depend on which columns the report service returns.

          const { data: savedSettings, error: settingsError } =
            await supabase
              .from("business_invoice_settings")
              .select("*")
              .eq("business_id", businessId)
              .maybeSingle();

          if (settingsError) throw settingsError;

          invoiceSettings = {
            ...invoiceSettings,
            ...(savedSettings || {}),
          };

          // Delivery return/delivered quantities are stored on delivery_items,
          // not on invoice_lines. Join them through source_delivery_item_id.

          const { data: invoiceLineSources, error: sourceError } =
            await supabase
              .from("invoice_lines")
              .select("id, source_delivery_item_id")
              .eq("invoice_id", result?.invoice?.id || invoiceId)
              .eq("business_id", businessId);

          if (sourceError) throw sourceError;

          const sourceIds = [
            ...new Set(
              (invoiceLineSources || [])
                .map((line) => line.source_delivery_item_id)
                .filter(Boolean)
            ),
          ];

          if (sourceIds.length) {
            const { data: deliveryRows, error: deliveryItemsError } =
              await supabase
                .from("delivery_items")
                .select("id, quantity_delivered, quantity_returned")
                .eq("business_id", businessId)
                .in("id", sourceIds);

            if (deliveryItemsError) throw deliveryItemsError;

            const deliveryItemMap = new Map(
              (deliveryRows || []).map((row) => [row.id, row])
            );

            const sourceMap = new Map(
              (invoiceLineSources || []).map((line) => [
                line.id,
                line.source_delivery_item_id
                  ? deliveryItemMap.get(line.source_delivery_item_id)
                  : null,
              ])
            );

            result.items = (result.items || []).map((line) => {
              const source = sourceMap.get(line.id);

              return {
                ...line,

                delivered_quantity: source
                  ? toNumber(source.quantity_delivered)
                  : toNumber(
                      line.delivered_quantity ??
                        line.quantity_delivered ??
                        line.quantity
                    ),

                returned_quantity: source
                  ? toNumber(source.quantity_returned)
                  : toNumber(
                      line.returned_quantity ??
                        line.quantity_returned ??
                        line.return_quantity
                    ),
              };
            });
          } else {
            result.items = (result.items || []).map((line) => ({
              ...line,

              delivered_quantity: toNumber(
                line.delivered_quantity ??
                  line.quantity_delivered ??
                  (line.is_delivery_line ? line.quantity : 0)
              ),

              returned_quantity: toNumber(
                line.returned_quantity ??
                  line.quantity_returned ??
                  line.return_quantity
              ),
            }));
          }
        }

        if (active) {
          setData({
            ...result,
            settings: invoiceSettings,
          });
        }
      } catch (err) {
        console.error("Invoice report loading failed:", err);

        if (active) {
          setError(err?.message || "Unable to load invoice report.");
          setData(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadReport();

    return () => {
      active = false;
    };
  }, [invoiceId]);

  // ===================================================
  // AUTOMATIC ONE-PAGE FIT
  // ===================================================

  useLayoutEffect(() => {
    if (!data || !paperRef.current || !contentRef.current) return;

    const calculateFit = () => {
      const paper = paperRef.current;
      const content = contentRef.current;

      if (!paper || !content) return;

      const paperStyle = window.getComputedStyle(paper);

      const paddingTop = parseFloat(paperStyle.paddingTop || "0");
      const paddingBottom = parseFloat(paperStyle.paddingBottom || "0");

      const availableHeight =
        paper.clientHeight - paddingTop - paddingBottom;

      const contentHeight = content.scrollHeight;

      if (!availableHeight || !contentHeight) return;

      const nextScale = Math.min(1, availableHeight / contentHeight);

      setFitScale(Number(Math.max(0.35, nextScale).toFixed(3)));
    };

    calculateFit();

    const observer = new ResizeObserver(calculateFit);

    observer.observe(contentRef.current);
    observer.observe(paperRef.current);

    return () => observer.disconnect();
  }, [data]);

  // ===================================================
  // GENERATE A4 PDF
  // ===================================================

  useEffect(() => {
    if (!data || !paperRef.current || !contentRef.current) {
      return undefined;
    }

    let cancelled = false;
    let nextObjectUrl = "";

    setPdfGenerating(true);
    setPdfError("");
    setPdfUrl("");

    const generatePdf = async () => {
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
          windowWidth: 1200,
        });

        if (cancelled) return;

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });

        const imageData = canvas.toDataURL("image/jpeg", 0.96);

        pdf.addImage(
          imageData,
          "JPEG",
          0,
          0,
          210,
          297,
          undefined,
          "FAST"
        );

        const blob = pdf.output("blob");

        if (cancelled) return;

        nextObjectUrl = URL.createObjectURL(blob);

        setPdfUrl(nextObjectUrl);
      } catch (generationError) {
        console.error("Invoice PDF generation failed:", generationError);

        if (!cancelled) {
          setPdfError(
            generationError?.message ||
              "Unable to generate invoice PDF."
          );
        }
      } finally {
        if (!cancelled) setPdfGenerating(false);
      }
    };

    void generatePdf();

    return () => {
      cancelled = true;

      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [data, fitScale]);

  // Clean up the currently generated PDF URL on unmount.

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // ===================================================
  // DATA
  // ===================================================

  const invoice = data?.invoice;
  const business = data?.business;
  const customer = data?.customer;
  const settings = data?.settings;
  const items = data?.items || [];

  const billingDate = invoice?.period_start || invoice?.invoice_date;

  // ===================================================
  // MONTHLY PRODUCT SUMMARY
  // ===================================================

  const dailyReport = useMemo(() => {
    if (!data || !invoice) {
      return {
        months: [],
        products: [],
        totalDelivered: 0,
        totalReturned: 0,
      };
    }

    const start = datePart(invoice.period_start);
    const end = datePart(invoice.period_end);

    const monthMap = new Map();

    items
      .filter((line) => line.is_delivery_line && line.delivery_date)
      .forEach((line) => {
        const deliveryDate = datePart(line.delivery_date);

        if (
          !deliveryDate ||
          (start && deliveryDate < start) ||
          (end && deliveryDate > end)
        ) {
          return;
        }

        const [year, month, day] = deliveryDate.split("-").map(Number);

        if (!year || !month || !day) return;

        const monthKey =
          `${year}-${String(month).padStart(2, "0")}`;

        const monthEntry = monthMap.get(monthKey) || {
          key: monthKey,
          year,
          monthIndex: month - 1,

          label: new Date(
            year,
            month - 1,
            1
          ).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          }),

          products: new Map(),
          totalDelivered: 0,
          totalReturned: 0,
        };

        const productKey =
          line.product_id ||
          line.product_name ||
          line.description ||
          "product";

        const product = monthEntry.products.get(productKey) || {
          key: productKey,
          name: line.product_name || line.description || "Product",
          days: {},
          totalDelivered: 0,
          totalReturned: 0,
        };

        const delivered = toNumber(
          line.delivered_quantity ?? line.quantity
        );

        const returned = toNumber(line.returned_quantity);

        const dayEntry = product.days[day] || {
          delivered: 0,
          returned: 0,
        };

        dayEntry.delivered += delivered;
        dayEntry.returned += returned;

        product.days[day] = dayEntry;

        product.totalDelivered += delivered;
        product.totalReturned += returned;

        monthEntry.totalDelivered += delivered;
        monthEntry.totalReturned += returned;

        monthEntry.products.set(productKey, product);
        monthMap.set(monthKey, monthEntry);
      });

    const months = [...monthMap.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((month) => {
        const daysInMonth = new Date(
          month.year,
          month.monthIndex + 1,
          0
        ).getDate();

        const firstHalf = Array.from(
          { length: 16 },
          (_, index) => index + 1
        );

        const secondHalf = Array.from(
          { length: Math.max(0, daysInMonth - 16) },
          (_, index) => index + 17
        );

        return {
          ...month,
          firstHalf,
          secondHalf,

          products: [...month.products.values()].sort(
            (a, b) => a.name.localeCompare(b.name)
          ),
        };
      });

    return {
      months,

      products: months.flatMap((month) => month.products),

      totalDelivered: months.reduce(
        (sum, month) => sum + month.totalDelivered,
        0
      ),

      totalReturned: months.reduce(
        (sum, month) => sum + month.totalReturned,
        0
      ),
    };
  }, [data, invoice, items]);

  // ===================================================
  // CHARGE GROUPING
  // ===================================================

  // Normal product charges and lost-jar charges are intentionally separated.
  // Lost detection supports explicit flags/type fields and the existing "Lost ..." labels.

  const groupedItems = useMemo(() => {
    const regularGroups = new Map();
    const lostGroups = new Map();

    const isLostLine = (line) => {
      const description = String(
        line?.product_name ||
          line?.description ||
          line?.name ||
          ""
      ).trim();

      const type = String(
        line?.charge_type ||
          line?.item_type ||
          line?.line_type ||
          ""
      ).toLowerCase();

      return Boolean(
        line?.is_lost_jar ||
          line?.is_lost_item ||
          type.includes("lost") ||
          /^lost\b/i.test(description)
      );
    };

    items
      .filter((line) => !line.is_previous_outstanding)
      .forEach((line) => {
        const isLost = isLostLine(line);

        const description = String(
          line.product_name ||
            line.description ||
            line.name ||
            (isLost ? "Lost Jar" : "Additional charge")
        ).trim();

        const rate = toNumber(line.unit_price ?? line.rate);

        const key = `${description.toLowerCase()}__${rate}`;

        const target = isLost ? lostGroups : regularGroups;

        const current = target.get(key) || {
          description,
          returnedQuantity: 0,
          deliveredQuantity: 0,
          lostQuantity: 0,
          rate,
          amount: 0,
        };

        if (isLost) {
          current.lostQuantity += toNumber(
            line.quantity ??
              line.lost_quantity ??
              line.delivered_quantity
          );
        } else if (line.is_delivery_line) {
          current.returnedQuantity += toNumber(
            line.returned_quantity ??
              line.quantity_returned ??
              line.return_quantity
          );

          current.deliveredQuantity += toNumber(
            line.delivered_quantity ??
              line.quantity_delivered ??
              line.quantity
          );
        }

        current.amount += toNumber(line.line_total ?? line.amount);

        target.set(key, current);
      });

    const sortByName = (a, b) =>
      a.description.localeCompare(b.description, undefined, {
        sensitivity: "base",
      });

    return {
      regularItems: [...regularGroups.values()].sort(sortByName),
      lostItems: [...lostGroups.values()].sort(sortByName),
    };
  }, [items]);

  // ===================================================
  // AMOUNT CALCULATIONS
  // ===================================================

  const subtotal = toNumber(invoice?.subtotal);
  const discount = toNumber(invoice?.discount_amount);
  const tax = toNumber(invoice?.tax_amount);

  const totalAmount = toNumber(invoice?.total_amount);
  const amountPaid = toNumber(invoice?.amount_paid);

  const balanceDue = Math.max(0, totalAmount - amountPaid);

  const previousOutstanding = toNumber(data?.previousOutstanding);

  const totalDeliveryQty = dailyReport.totalDelivered;

  const status = statusLabel(invoice || {});

  // ===================================================
  // DAILY SUMMARY TABLE
  // ===================================================

  const renderDailyTable = (month, days, title) => {
    if (!days.length) return null;

    const start = datePart(invoice.period_start);
    const end = datePart(invoice.period_end);

    const getDayValue = (product, day) => {
      const iso =
        `${month.year}-${String(month.monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      if ((start && iso < start) || (end && iso > end)) {
        return null;
      }

      return product.days[day] || {
        delivered: 0,
        returned: 0,
      };
    };

    return (
      <div className="mt-1" key={`${month.key}-${title}`}>
        <div className="mb-0.5 text-[7px] font-extrabold uppercase tracking-wide text-slate-500">
          {title}
        </div>

        <table className="w-full table-fixed border-collapse text-center text-[6.5px] leading-tight">
          <thead>
            <tr className="bg-[#eff7f8] text-[#38596a]">
              <th className="w-[27mm] border-b border-slate-200 px-0.5 py-[3px] text-left font-black">
                Product
              </th>

              {days.map((day) => (
                <th
                  key={day}
                  className="border-b border-slate-200 px-0 py-[3px] font-black"
                >
                  {String(day).padStart(2, "0")}
                </th>
              ))}

              <th className="w-[12mm] border-b border-slate-200 px-0.5 py-[3px] font-black">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {month.products.map((product) => (
              <tr key={`${month.key}-${title}-${product.key}`}>
                <th className="border-b border-slate-100 px-0.5 py-[3px] text-left font-bold text-slate-700 [overflow-wrap:anywhere]">
                  {product.name}
                </th>

                {days.map((day) => {
                  const value = getDayValue(product, day);

                  return (
                    <td
                      key={day}
                      className="border-b border-slate-100 px-0 py-[3px] text-slate-600"
                    >
                      {value === null
                        ? "—"
                        : value.delivered > 0 || value.returned > 0
                          ? (
                            <span>
                              {value.delivered}

                              {value.returned > 0 ? (
                                <span className="block text-[5.5px] text-rose-600">
                                  R:{value.returned}
                                </span>
                              ) : null}
                            </span>
                          )
                          : "—"}
                    </td>
                  );
                })}

                <td className="border-b border-slate-100 px-0.5 py-[3px] font-black text-[#164e63]">
                  {days.reduce(
                    (sum, day) =>
                      sum +
                      (getDayValue(product, day)?.delivered || 0),
                    0
                  )}
                </td>
              </tr>
            ))}

            <tr className="bg-slate-50 font-black text-[#164e63]">
              <th className="border-b border-slate-200 px-0.5 py-[3px] text-left">
                Daily Total
              </th>

              {days.map((day) => {
                const total = month.products.reduce(
                  (sum, product) =>
                    sum +
                    (getDayValue(product, day)?.delivered || 0),
                  0
                );

                return (
                  <td
                    key={day}
                    className="border-b border-slate-200 px-0 py-[3px]"
                  >
                    {total || "—"}
                  </td>
                );
              })}

              <td className="border-b border-slate-200 px-0.5 py-[3px]">
                {days.reduce(
                  (sum, day) =>
                    sum +
                    month.products.reduce(
                      (inner, product) =>
                        inner +
                        (getDayValue(product, day)?.delivered || 0),
                      0
                    ),
                  0
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center gap-3 text-slate-600">
        <LoaderCircle
          size={25}
          className="animate-spin text-cyan-700"
        />

        Preparing invoice...
      </main>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
        <div className="flex max-w-lg items-start gap-3 border-l-4 border-rose-500 bg-white p-5 shadow-sm">
          <AlertCircle
            size={21}
            className="mt-0.5 shrink-0 text-rose-600"
          />

          <div>
            <h2 className="font-bold text-slate-900">
              Invoice report unavailable
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              {error || "Invoice could not be found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ===================================================
  // FINAL REPORT
  // ===================================================

  // Print directly from the embedded PDF viewer.
  // No window.open() and no popup permission required.

  const handlePrint = () => {
    if (!pdfUrl) return;

    const frameWindow = pdfFrameRef.current?.contentWindow;

    if (!frameWindow) {
      setPdfError(
        "The PDF viewer is not ready. Please wait for the preview to load, or download the PDF."
      );

      return;
    }

    try {
      frameWindow.focus();
      frameWindow.print();

      setPdfError("");
    } catch (printError) {
      console.error("Invoice print failed:", printError);

      handleDownload();

      setPdfError(
        "Direct printing is not supported by this browser. The PDF download has been started; open it in your device's PDF viewer to print."
      );
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;

    const link = document.createElement("a");

    link.href = pdfUrl;

    link.download =
      `${formatInvoiceNumber(invoice?.invoice_number || "invoice")}.pdf`;

    document.body.appendChild(link);

    link.click();
    link.remove();
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <main className="min-h-screen w-full bg-slate-100 px-3 py-4 font-sans text-slate-800 print:min-h-0 print:w-full print:bg-white print:p-0">
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 0;
          }

          @media print {
            html, body, #root {
              width: 210mm !important;
              min-width: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }

            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>

      {/* REPORT TOOLBAR: HIDDEN WHEN PRINTING */}

      <div className="sticky top-0 z-20 mx-auto mb-3 flex w-full max-w-[1100px] items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur print:hidden sm:mb-4 sm:gap-3 sm:p-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#087f8c] hover:text-[#087f8c] focus:outline-none focus:ring-2 focus:ring-[#087f8c]/30"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <h1 className="truncate text-base font-bold text-slate-800 sm:text-lg">
            Invoice Report
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!pdfUrl || pdfGenerating}
            className="inline-flex items-center gap-2 rounded-lg bg-[#087f8c] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#066b76] focus:outline-none focus:ring-2 focus:ring-[#087f8c]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer size={16} />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!pdfUrl || pdfGenerating}
            title="Download the generated A4 PDF"
            className="inline-flex items-center gap-2 rounded-lg border border-[#087f8c] bg-white px-3 py-2 text-sm font-semibold text-[#087f8c] shadow-sm transition hover:bg-[#e5f5f2] focus:outline-none focus:ring-2 focus:ring-[#087f8c]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {pdfGenerating && (
        <div className="mx-auto mb-3 flex max-w-[1100px] items-center gap-2 rounded-lg bg-white p-3 text-sm text-slate-600 shadow-sm">
          <LoaderCircle
            size={18}
            className="animate-spin text-[#087f8c]"
          />

          Generating your A4 invoice PDF...
        </div>
      )}

      {pdfError && (
        <div
          role="alert"
          className="mx-auto mb-3 max-w-[1100px] rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {pdfError}
        </div>
      )}

      {/* RESPONSIVE PDF VIEWER */}

      {pdfUrl ? (
        <section className="mx-auto h-[calc(100dvh-76px)] min-h-[420px] w-full max-w-[1100px] overflow-hidden rounded-xl border border-slate-300 bg-slate-200 shadow-lg sm:h-[calc(100dvh-125px)] sm:min-h-[520px] sm:rounded-xl">
          <iframe
            ref={pdfFrameRef}
            title="A4 invoice PDF preview"
            src={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
            className="block h-full min-h-0 w-full bg-slate-200"
            style={{ border: 0 }}
          />
        </section>
      ) : !pdfGenerating && !pdfError ? (
        <div className="mx-auto flex min-h-[300px] max-w-[1100px] items-center justify-center text-sm text-slate-500">
          Preparing PDF preview...
        </div>
      ) : null}

      {/* Off-screen A4 source used only to render the PDF. */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-100000px] top-0 z-[-1]"
      >
        <article
          ref={paperRef}
          className="h-[297mm] w-[210mm] overflow-hidden bg-white p-[10mm]"
          style={{
            "--content-scale": fitScale,
            "--content-width": `${100 / fitScale}%`,
          }}
        >
          <div
            ref={contentRef}
            className="origin-top-left"
            style={{
              width: `${100 / fitScale}%`,
              transform: `scale(${fitScale})`,
            }}
          >
            {/* 1. INVOICE IDENTITY */}

            <header>
              <div className="flex items-center justify-between gap-3 border-b-2 border-[#087f8c] pb-2">
                <div className="min-w-0">
                  <div className="text-[8px] font-black uppercase tracking-[1.6px] text-[#087f8c]">
                    Customer Billing Statement
                  </div>

                  <div className="mt-0.5 text-[17px] font-black leading-tight tracking-tight text-[#17212f]">
                    {formatInvoiceNumber(invoice.invoice_number)}
                  </div>
                </div>

                <div className="text-right text-[8px] leading-relaxed text-slate-500">
                  <strong className="block text-[9px] text-[#17212f]">
                    {monthLabel(billingDate)}
                  </strong>

                  <div>
                    Invoice Date: {formatDate(invoice.invoice_date)}
                  </div>

                  <div className="mt-0.5">
                    Generated: {generatedAt}
                  </div>
                </div>
              </div>

              {/* AGENCY + CUSTOMER DETAILS */}

              <div className="mt-3 grid grid-cols-2 gap-5 border-b border-slate-200 pb-3">
                {/* AGENCY */}

                <div className="min-w-0">
                  <div className="mb-2 text-[9px] font-black uppercase tracking-[1px] text-[#087f8c]">
                    Agency Details
                  </div>

                  <div className="flex min-w-0 items-start gap-3">
                    {settings?.business_logo_url && (
                      <img
                        src={settings.business_logo_url}
                        alt={`${business.name || "Amrit Jal"} logo`}
                        className="h-[82px] w-[82px] shrink-0 object-contain"
                      />
                    )}

                    <div className="min-w-0 pt-1">
                      <div className="text-[16px] font-black leading-snug text-[#17212f]">
                        {business.name || "Amrit Jal"}
                      </div>

                      <div className="mt-1.5 whitespace-pre-wrap text-[10px] leading-snug text-slate-600 [overflow-wrap:anywhere]">
                        {settings?.business_address || ""}
                      </div>

                      {settings?.business_phone && (
                        <div className="mt-1.5 text-[10px] font-bold text-slate-700">
                          Phone: {settings.business_phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CUSTOMER */}

                <div className="min-w-0 border-l border-slate-200 pl-4">
                  <div className="mb-2 text-[9px] font-black uppercase tracking-[1px] text-[#087f8c]">
                    Customer Details
                  </div>

                  <div className="break-words text-[14px] font-black leading-snug text-[#17212f]">
                    {customer?.name || "Customer"}
                  </div>

                  <div className="mt-1.5 text-[9px] leading-snug text-slate-600 [overflow-wrap:anywhere]">
                    Mobile: {safeText(customer?.phone)}
                  </div>

                  <div className="mt-1.5 text-[9px] leading-snug text-slate-600 [overflow-wrap:anywhere]">
                    Address: {safeText(customer?.address || customer?.area)}
                  </div>

                  <div className="mt-1.5 text-[9px] leading-snug text-slate-600">
                    Billing Period:{" "}
                    <strong className="text-slate-800">
                      {formatDate(invoice.period_start)} –{" "}
                      {formatDate(invoice.period_end)}
                    </strong>
                  </div>

                  {customer?.code && (
                    <div className="mt-1.5 inline-block text-[9px] font-extrabold text-[#087f8c]">
                      Customer Code: {customer.code}
                    </div>
                  )}

                  <div>
                    <span className="mt-1.5 inline-block rounded-full bg-[#e9f5f5] px-2.5 py-1 text-[8px] font-black tracking-wide text-[#087f8c]">
                      {status}
                    </span>
                  </div>
                </div>
              </div>

              {/* EXTRA ACCOUNT INFO */}

              {(customer?.security_deposit != null ||
                customer?.balance_product != null ||
                invoice?.balance_product != null ||
                invoice?.closing_jar_balance != null) && (
                <div className="mt-2 flex items-center justify-between gap-3 border-b border-slate-200 px-0.5 py-1.5 text-[8px] text-slate-600">
                  <div>
                    <strong className="text-slate-800">
                      Security Deposit:
                    </strong>{" "}
                    {safeMoney(customer?.security_deposit)}
                  </div>

                  <div>
                    <strong className="text-slate-800">
                      Balance Product Qty:
                    </strong>{" "}
                    {safeText(
                      invoice?.balance_product ??
                        invoice?.closing_jar_balance ??
                        customer?.balance_product
                    )}
                  </div>
                </div>
              )}
            </header>

            {/* 2. MONTHLY PRODUCT SUMMARY */}

            <section className="mt-3">
              <div className="mb-1 flex items-baseline justify-between gap-3 border-b border-[#b8d9df] pb-1">
                <h2 className="text-[9px] font-black uppercase tracking-[0.65px] text-[#164e63]">
                  Monthly Product Delivery Summary
                </h2>

                <span className="text-[7px] text-slate-400">
                  {formatDate(invoice.period_start)} –{" "}
                  {formatDate(invoice.period_end)}
                </span>
              </div>

              {dailyReport.months.length ? (
                <>
                  {dailyReport.months.map((month) => (
                    <div key={month.key} className="mt-2">
                      <div className="border-b border-slate-200 pb-0.5 text-[8px] font-black text-[#087f8c]">
                        {month.label}
                      </div>

                      {renderDailyTable(
                        month,
                        month.firstHalf,
                        "01 – 16"
                      )}

                      {renderDailyTable(
                        month,
                        month.secondHalf,
                        `17 – ${month.secondHalf.at(-1) || 31}`
                      )}
                    </div>
                  ))}

                  <div className="mt-1 flex flex-wrap justify-end gap-x-3 text-[8px] font-black text-[#164e63]">
                    <span>
                      Delivered: {dailyReport.totalDelivered}
                    </span>

                    <span className="text-rose-700">
                      Returned: {dailyReport.totalReturned}
                    </span>
                  </div>
                </>
              ) : (
                <p className="py-3 text-center text-[8px] text-slate-500">
                  No delivery-linked product records found for this billing period.
                </p>
              )}
            </section>

            {/* 3. PRODUCT & CHARGES DETAILS */}

            <section className="mt-3">
              <div className="mb-1 flex items-baseline justify-between gap-3 border-b border-[#b8d9df] pb-1">
                <h2 className="text-[9px] font-black uppercase tracking-[0.65px] text-[#164e63]">
                  Product & Charges Details
                </h2>

                <span className="text-[7px] text-slate-400">
                  {groupedItems.regularItems.length} item type(s)
                </span>
              </div>

              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-[7px] font-bold uppercase tracking-wide text-slate-500">
                    <th className="w-[40%] px-1 py-1.5 text-left">
                      Product Name
                    </th>

                    <th className="w-[20%] px-1 py-1.5 text-right">
                      Quantity
                    </th>

                    <th className="w-[20%] px-1 py-1.5 text-right">
                      Rate / Jar
                    </th>

                    <th className="w-[20%] px-1 py-1.5 text-right">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {groupedItems.regularItems.length ? (
                    groupedItems.regularItems.map((item, index) => (
                      <tr
                        key={`regular-${item.description}-${item.rate}-${index}`}
                        className="border-b border-slate-100 text-[8px] text-slate-700"
                      >
                        <td className="px-1 py-1.5">
                          {item.description}
                        </td>

                        <td className="px-1 py-1.5 text-right tabular-nums">
                          <div className="font-semibold">
                            {item.deliveredQuantity}
                          </div>

                          {item.returnedQuantity > 0 && (
                            <div className="text-[7px] text-slate-500">
                              Return: {item.returnedQuantity}
                            </div>
                          )}
                        </td>

                        <td className="px-1 py-1.5 text-right tabular-nums">
                          {formatCurrency(item.rate)}
                        </td>

                        <td className="px-1 py-1.5 text-right font-extrabold tabular-nums text-[#17212f]">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="border-b border-slate-100 px-1 py-3 text-center text-[8px] text-slate-500"
                      >
                        No product or charge line items available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* 3A. LOST JAR DETAILS */}

            {groupedItems.lostItems.length > 0 && (
              <section className="mt-3">
                <div className="mb-1 flex items-baseline justify-between gap-3 border-b border-rose-200 pb-1">
                  <h2 className="text-[9px] font-black uppercase tracking-[0.65px] text-rose-700">
                    Lost Jar Details
                  </h2>

                  <span className="text-[7px] text-rose-500">
                    {groupedItems.lostItems.length} item type(s)
                  </span>
                </div>

                <table className="w-full table-fixed border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-[7px] font-bold uppercase tracking-wide text-slate-500">
                      <th className="w-[46%] px-1 py-1.5 text-left">
                        Product Name
                      </th>

                      <th className="w-[18%] px-1 py-1.5 text-right">
                        Lost Qty
                      </th>

                      <th className="w-[17%] px-1 py-1.5 text-right">
                        Rate / Jar
                      </th>

                      <th className="w-[19%] px-1 py-1.5 text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {groupedItems.lostItems.map((item, index) => (
                      <tr
                        key={`lost-${item.description}-${item.rate}-${index}`}
                        className="border-b border-slate-100 text-[8px] text-slate-700"
                      >
                        <td className="px-1 py-1.5">
                          {item.description}
                        </td>

                        <td className="px-1 py-1.5 text-right tabular-nums">
                          {item.lostQuantity > 0
                            ? item.lostQuantity
                            : "—"}
                        </td>

                        <td className="px-1 py-1.5 text-right tabular-nums">
                          {formatCurrency(item.rate)}
                        </td>

                        <td className="px-1 py-1.5 text-right font-extrabold tabular-nums text-[#17212f]">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/* 4. AMOUNT SUMMARY */}

            <section className="mt-3 flex justify-end border-t border-slate-200 pt-2">
              <div className="w-full max-w-[245px] min-w-0">
                <div className="flex justify-between gap-2 py-1 text-[8px] text-slate-500">
                  <span>Subtotal</span>

                  <strong className="shrink-0 text-right text-slate-700">
                    {formatCurrency(subtotal)}
                  </strong>
                </div>

                {previousOutstanding > 0 && (
                  <div className="flex justify-between gap-2 py-1 text-[8px] text-slate-500">
                    <span>Previous Outstanding</span>

                    <strong className="shrink-0 text-right text-slate-700">
                      {formatCurrency(previousOutstanding)}
                    </strong>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between gap-2 py-1 text-[8px] text-slate-500">
                    <span>Discount</span>

                    <strong className="shrink-0 text-right text-emerald-700">
                      − {formatCurrency(discount)}
                    </strong>
                  </div>
                )}

                {tax > 0 && (
                  <div className="flex justify-between gap-2 py-1 text-[8px] text-slate-500">
                    <span>Tax</span>

                    <strong className="shrink-0 text-right text-slate-700">
                      {formatCurrency(tax)}
                    </strong>
                  </div>
                )}

                <div className="flex justify-between gap-2 py-1 text-[8px] text-slate-500">
                  <span>Total Invoice Amount</span>

                  <strong className="shrink-0 text-right text-slate-700">
                    {formatCurrency(totalAmount)}
                  </strong>
                </div>

                <div className="flex justify-between gap-2 py-1 text-[8px] text-slate-500">
                  <span>Paid</span>

                  <strong className="shrink-0 text-right text-slate-700">
                    {formatCurrency(amountPaid)}
                  </strong>
                </div>

                <div className="mt-1 flex justify-between gap-2 border-t-2 border-[#087f8c] pt-1.5 text-[10px] font-black text-[#164e63]">
                  <span>Amount To Pay</span>

                  <strong className="shrink-0 text-right text-[12px] text-[#087f8c]">
                    {formatCurrency(balanceDue)}
                  </strong>
                </div>
              </div>
            </section>

            {/* 5. PAYMENT OPTIONS + INVOICE REMARK */}

            <section className="mt-3 grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-stretch gap-3 border-t border-slate-200 pt-2">
              {/* PAYMENT OPTIONS */}

              <div className="min-w-0">
                <h2 className="mb-1.5 text-[8px] font-black uppercase tracking-[0.7px] text-[#164e63]">
                  Payment Options
                </h2>

                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-2">
                  <div className="flex min-w-0 flex-col items-center justify-center">
                    {settings?.payment_qr_url ? (
                      <img
                        src={settings.payment_qr_url}
                        alt="Amrit Jal payment QR code"
                        className="h-[128px] w-[128px] max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-[128px] w-[128px] max-w-full items-center justify-center border border-dashed border-slate-300 text-center text-[8px] text-slate-400">
                        QR not configured
                      </div>
                    )}

                    <div className="mt-0.5 text-[8px] font-black tracking-wide text-[#087f8c]">
                      SCAN TO PAY
                    </div>
                  </div>

                  <div className="min-w-0 border-l border-slate-100 pl-2">
                    <div className="mb-1 text-[8px] font-black uppercase tracking-wide text-slate-600">
                      Bank & UPI Details
                    </div>

                    {[
                      ["A/C Name", settings?.bank_account_name],
                      ["Bank Name", settings?.bank_name],
                      ["Account No.", settings?.bank_account_number],
                      ["IFSC", settings?.bank_ifsc],
                      ["UPI ID", settings?.upi_id],
                      ["PhonePe", settings?.upi_phone],
                    ]
                      .filter(
                        ([, value]) =>
                          value !== null &&
                          value !== undefined &&
                          String(value).trim() !== ""
                      )
                      .map(([label, value]) => (
                        <div
                          className="grid grid-cols-[42px_minmax(0,1fr)] gap-1 py-[2px] text-[9px] leading-tight"
                          key={label}
                        >
                          <span className="text-slate-500">
                            {label}
                          </span>

                          <strong className="break-all text-right font-bold text-slate-700">
                            {value}
                          </strong>
                        </div>
                      ))}

                    {!settings?.bank_account_name &&
                      !settings?.bank_name &&
                      !settings?.bank_account_number &&
                      !settings?.bank_ifsc &&
                      !settings?.upi_id &&
                      !settings?.upi_phone && (
                        <p className="text-[7px] text-slate-400">
                          Bank/UPI details not configured.
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {/* INVOICE REMARK */}

              <div className="min-w-0 border-l border-slate-200 pl-3">
                <h2 className="mb-1.5 text-[8px] font-black uppercase tracking-[0.7px] text-[#164e63]">
                  Invoice Remark
                </h2>

                {settings?.invoice_remark?.trim() ? (
                  <div className="whitespace-pre-wrap break-words text-[10px] leading-relaxed text-slate-600">
                    {settings.invoice_remark.trim()}
                  </div>
                ) : (
                  <p className="text-[7px] text-slate-400">
                    No invoice remark added.
                  </p>
                )}
              </div>
            </section>

            {/* 6. AUTHORIZED SIGNATURE */}

            <section className="mt-3 flex justify-end border-t border-slate-200 pt-2">
              <div className="flex w-[150px] flex-col items-center text-center">
                <div className="text-[7px] font-bold uppercase tracking-wide text-slate-600">
                  Authorized Signature
                </div>

                {settings?.signature_image_url ? (
                  <img
                    src={settings.signature_image_url}
                    alt="Authorized signature"
                    className="my-1 h-[42px] max-w-[125px] object-contain"
                  />
                ) : (
                  <div className="mb-1 mt-7 w-full max-w-[110px] border-b border-slate-400" />
                )}

                {settings?.signature_name && (
                  <div className="break-words text-[7px] font-semibold text-slate-700">
                    {settings.signature_name}
                  </div>
                )}
              </div>
            </section>

            {/* 7. FINAL FOOTER */}

            <footer className="mt-4 flex items-center gap-3 border-t-2 border-[#087f8c] pt-2">
              <div className="h-px flex-1 bg-[#087f8c]" />

              <p className="shrink-0 text-center text-[9px] font-black italic text-[#164e63]">
                Thank you for choosing Amrit Jal.
              </p>

              <div className="h-px flex-1 bg-[#087f8c]" />
            </footer>
          </div>
        </article>
      </div>
    </main>
  );
}
