
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

import {
  ArrowLeft,
  Printer,
  LoaderCircle,
  Bluetooth,
  Monitor,
  Unplug,
  Search,
  CheckCircle2,
  X,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Wifi,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";
import { getInvoiceById } from "../services/invoiceService";

import {
  formatCurrency,
  formatDate,
  formatInvoiceNumber,
  toNumber,
} from "../utils/invoiceUtils";

import {
  getPrinterSettings,
  savePrinterSettings,
  subscribePrinterSettings,
} from "../services/printer/printerSettingsStore.js";

import {
  getAvailablePrinters,
  scanAvailablePrinters,
  getAvailableBlePrinters,
  selectAvailableBlePrinter,
  connectPrinter,
  disconnectPrinter,
  getPrinterStatus,
  printReceipt,
} from "../services/printer/printerService.js";

import { createEscPosBuilder } from "../services/printer/escPosService.js";

// ==================================================
// CONSTANTS
// ==================================================

const DEFAULT_PAPER_WIDTH = "80";

const isAndroidNative = () => {
  try {
    return (
      window.Capacitor?.isNativePlatform?.() &&
      window.Capacitor?.getPlatform?.() === "android"
    );
  } catch {
    return false;
  }
};

const getPrinterKey = (printer) =>
  String(
    printer?.id ||
      printer?.address ||
      printer?.deviceId ||
      printer?.name ||
      ""
  );

const normalizePrinter = (printer, connectionType) => {
  if (!printer) return null;

  const id = getPrinterKey(printer);

  return {
    ...printer,
    id,
    connectionType:
      printer.connectionType || connectionType || "classic",
    name:
      printer.name ||
      printer.deviceName ||
      printer.id ||
      "Bluetooth Printer",
  };
};

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

  if (Number.isNaN(parsed.getTime())) return null;

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

const formatReceiptDate = (value) =>
  value ? formatDate(value) : "";

const getInitialPrinterSettings = () => {
  try {
    return getPrinterSettings();
  } catch (error) {
    console.error("Printer settings load failed:", error);

    return {
      connectionType: "classic",
      protocol: "escpos",
      paperWidth: DEFAULT_PAPER_WIDTH,
      ble: {
        deviceId: "",
        name: "",
        serviceUUID: "",
        characteristicUUID: "",
        chunkSize: 20,
        delayMs: 20,
        writeWithoutResponse: false,
      },
      wifi: {
        host: "",
        port: 9100,
      },
      classic: {
        address: "",
        name: "",
      },
    };
  }
};

// ==================================================
// ESC/POS RECEIPT BUILDER
// ==================================================

function buildInvoiceEscPos({
  invoice,
  customer,
  business,
  settings,
  items,
  paperWidth,
  summaryDays,
  summaryProducts,
  dailyProductQty,
}) {
  const builder = createEscPosBuilder(paperWidth);

  const separator = () => builder.separator();

  const center = (value) => {
    if (!value) return;

    builder.align("center");
    builder.text(String(value));
    builder.align("left");
  };

  const line = (label, value) => {
    builder.columns(
      String(label || ""),
      String(value ?? "")
    );
  };

  const subtotal = toNumber(invoice.subtotal);
  const charges = toNumber(invoice.additional_charges);
  const outstanding = toNumber(invoice.previous_outstanding);
  const discount = toNumber(invoice.discount);
  const total = toNumber(invoice.total_amount);
  const paid = toNumber(invoice.paid_amount);
  const balance = Math.max(0, total - paid);

  const quantity = items.reduce(
    (sum, item) => sum + toNumber(item.quantity),
    0
  );

  // Business header
  builder.init();

  center(business.name || "Business");
  center(settings?.business_address);

  if (settings?.business_phone) {
    center(`Phone: ${settings.business_phone}`);
  }

  separator();

  center("INVOICE / RECEIPT");

  builder.bold(true);
  center(formatInvoiceNumber(invoice.invoice_number));
  builder.bold(false);

  separator();

  // Customer details
  builder.bold(true);
  builder.text("CUSTOMER DETAILS");
  builder.bold(false);

  builder.wrappedText(
    `Customer: ${customer?.name || "Customer"}`
  );

  if (customer?.code) {
    builder.text(`Code: ${customer.code}`);
  }

  if (customer?.phone) {
    builder.text(`Phone: ${customer.phone}`);
  }

  builder.text(
    `Invoice Date: ${formatReceiptDate(invoice.invoice_date)}`
  );

  builder.wrappedText(
    `Period: ${formatReceiptDate(invoice.period_start)} - ${formatReceiptDate(invoice.period_end)}`
  );

  separator();

  // Bill summary
  center("BILL SUMMARY");

  line("Total Quantity", quantity);
  line("Subtotal", formatCurrency(subtotal));

  if (charges !== 0) {
    line("Additional / Jar Charges", formatCurrency(charges));
  }

  if (outstanding !== 0) {
    line("Previous Outstanding", formatCurrency(outstanding));
  }

  if (discount !== 0) {
    line("Discount", `-${formatCurrency(discount)}`);
  }

  separator();

  builder.bold(true);
  line("TOTAL", formatCurrency(total));
  builder.bold(false);

  line("Paid", formatCurrency(paid));

  builder.bold(true);
  line("BALANCE DUE", formatCurrency(balance));
  builder.bold(false);

  separator();

  // Date-wise delivery summary
  if (summaryDays.length && summaryProducts.length) {
    center("DELIVERED PRODUCT SUMMARY");

    for (
      let start = 0;
      start < summaryDays.length;
      start += 7
    ) {
      const weekDays = summaryDays.slice(start, start + 7);

      builder.text(
        `Dates: ${weekDays
          .map((day) => day.getDate())
          .join("  ")}`
      );

      summaryProducts.forEach((product) => {
        const values = weekDays.map((day) => {
          const value =
            dailyProductQty[dateKey(day)]?.[product];

          return value === undefined ? "-" : value;
        });

        if (values.every((value) => value === "-")) {
          return;
        }

        builder.wrappedText(
          `${product}: ${values.join(" | ")}`
        );
      });

      separator();
    }
  }

  // Lost jars
  const thermalLost = toNumber(invoice.thermal_jar_lost_qty);
  const capsuleLost = toNumber(invoice.capsule_jar_lost_qty);
  const dispenserLost = toNumber(invoice.dispenser_jar_lost_qty);

  if (
    thermalLost > 0 ||
    capsuleLost > 0 ||
    dispenserLost > 0
  ) {
    center("LOST JARS");

    if (thermalLost > 0) line("Thermal", thermalLost);
    if (capsuleLost > 0) line("Capsule", capsuleLost);
    if (dispenserLost > 0) line("Dispenser", dispenserLost);

    separator();
  }

  // Bank details
  if (settings?.bank_name) {
    center("BANK DETAILS");
    builder.text(settings.bank_name);

    if (settings.bank_account_number) {
      builder.wrappedText(
        `A/C: ${settings.bank_account_number}`
      );
    }

    if (settings.bank_ifsc) {
      builder.text(`IFSC: ${settings.bank_ifsc}`);
    }

    separator();
  }

  // UPI details
  if (settings?.upi_id) {
    center("PAYMENT DETAILS");
    builder.wrappedText(`UPI: ${settings.upi_id}`);
    separator();
  }

  // Invoice remark
  if (settings?.invoice_remark?.trim()) {
    builder.bold(true);
    builder.text("INVOICE REMARK");
    builder.bold(false);

    builder.wrappedText(settings.invoice_remark.trim());
    separator();
  }

  // Footer
  builder.feed(1);

  center("Thank you!");
  center("Please keep this receipt for your records.");
  center(business.name || "Amrit Jal");

  builder.feed(4);

  return builder.build();
}

// ==================================================
// MAIN COMPONENT
// ==================================================

export default function ThermalInvoicePrint() {
  const { invoiceId } = useParams();

  // Invoice state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Printer settings
  const [printerConfig, setPrinterConfig] = useState(
    getInitialPrinterSettings
  );

  const paperWidth = String(
    printerConfig?.paperWidth || DEFAULT_PAPER_WIDTH
  );

  // Modal state
  const [printerModalOpen, setPrinterModalOpen] = useState(false);
  const [printerStep, setPrinterStep] = useState("select");
  const [connectionMode, setConnectionMode] = useState(null);

  // Printer state
  const [printerList, setPrinterList] = useState([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState("");

  const [printerStatus, setPrinterStatus] = useState({
    connected: false,
    platform: null,
    printer: null,
  });

  const [printerBusy, setPrinterBusy] = useState(false);
  const [printerMessage, setPrinterMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const android = isAndroidNative();

  // Keep settings synchronized with Printer Settings page
  useEffect(() => {
    const unsubscribe = subscribePrinterSettings((next) => {
      if (next) setPrinterConfig(next);
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // Save paper width to shared printer settings
  const handlePaperWidthChange = useCallback((width) => {
    const nextWidth = String(width);

    try {
      const updated = savePrinterSettings({
        paperWidth: nextWidth,
      });

      setPrinterConfig(updated);
    } catch (error) {
      console.error("Paper width save failed:", error);

      setPrinterMessage(
        "Could not save paper width. Please check Printer Settings."
      );
      setMessageType("error");
    }
  }, []);

  // ==================================================
  // SEO: PRIVATE PRINT PAGE
  // ==================================================

  useEffect(() => {
    const previousTitle = document.title;

    const descriptionSelector = 'meta[name="description"]';
    const robotsSelector = 'meta[name="robots"]';

    const previousDescription = document.querySelector(
      descriptionSelector
    );

    const previousRobots = document.querySelector(
      robotsSelector
    );

    const oldDescription =
      previousDescription?.getAttribute("content");

    const oldRobots =
      previousRobots?.getAttribute("content");

    const description =
      previousDescription || document.createElement("meta");

    const robots =
      previousRobots || document.createElement("meta");

    document.title = "Thermal Invoice Print | Amrit Jal";

    description.setAttribute("name", "description");
    description.setAttribute(
      "content",
      "Private thermal invoice printing page for Amrit Jal."
    );

    robots.setAttribute("name", "robots");
    robots.setAttribute(
      "content",
      "noindex, nofollow, noarchive"
    );

    if (!previousDescription) {
      document.head.appendChild(description);
    }

    if (!previousRobots) {
      document.head.appendChild(robots);
    }

    return () => {
      document.title = previousTitle;

      if (previousDescription) {
        previousDescription.setAttribute(
          "content",
          oldDescription ?? ""
        );
      } else {
        description.remove();
      }

      if (previousRobots) {
        previousRobots.setAttribute(
          "content",
          oldRobots ?? ""
        );
      } else {
        robots.remove();
      }
    };
  }, []);

  // ==================================================
  // LOAD INVOICE
  // ==================================================

  useEffect(() => {
    let active = true;

    async function loadInvoice() {
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

        const [customerResult, settingsResult] =
          await Promise.all([
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

        if (!active) return;

        setData({
          invoice,
          customer: customerResult.data,
          settings: settingsResult.data,
          business,
        });
      } catch (error) {
        if (active) {
          setError(
            error?.message || "Could not load receipt."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInvoice();

    return () => {
      active = false;
    };
  }, [invoiceId]);

  // ==================================================
  // INVOICE DATA
  // ==================================================

  const invoice = data?.invoice;
  const customer = data?.customer;
  const settings = data?.settings;
  const business = data?.business;

  const items = invoice?.items || [];

  const subtotal = toNumber(invoice?.subtotal);
  const charges = toNumber(invoice?.additional_charges);
  const previousOutstanding = toNumber(
    invoice?.previous_outstanding
  );
  const discount = toNumber(invoice?.discount);
  const total = toNumber(invoice?.total_amount);
  const paid = toNumber(invoice?.paid_amount);
  const balance = Math.max(0, total - paid);

  const quantity = items.reduce(
    (sum, item) => sum + toNumber(item.quantity),
    0
  );

  const summaryProducts = useMemo(
    () => [
      ...new Set(
        items.map((item) =>
          String(
            item.description || "Water jar delivery"
          ).trim()
        )
      ),
    ],
    [items]
  );

  const dailyProductQty = useMemo(() => {
    const result = {};

    items.forEach((item) => {
      const date = parseDateOnly(item.delivery_date);

      if (!date) return;

      const key = dateKey(date);

      const product = String(
        item.description || "Water jar delivery"
      ).trim();

      if (!result[key]) result[key] = {};

      result[key][product] =
        (result[key][product] || 0) +
        toNumber(item.quantity);
    });

    return result;
  }, [items]);

  const summaryDays = useMemo(() => {
    const start = parseDateOnly(invoice?.period_start);
    const end = parseDateOnly(invoice?.period_end);

    const days = [];

    if (!start || !end || end < start) return days;

    const cursor = new Date(start);

    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }, [invoice?.period_start, invoice?.period_end]);

  const summaryWeeks = useMemo(() => {
    const weeks = [];

    for (let i = 0; i < summaryDays.length; i += 7) {
      weeks.push(summaryDays.slice(i, i + 7));
    }

    return weeks;
  }, [summaryDays]);

  const thermalLost = toNumber(invoice?.thermal_jar_lost_qty);
  const capsuleLost = toNumber(invoice?.capsule_jar_lost_qty);
  const dispenserLost = toNumber(invoice?.dispenser_jar_lost_qty);

  const hasLostJars =
    thermalLost > 0 ||
    capsuleLost > 0 ||
    dispenserLost > 0;

  // ==================================================
  // PRINTER STATUS
  // ==================================================

  const refreshPrinterStatus = useCallback(async () => {
    try {
      const status = await getPrinterStatus();

      const nextStatus = {
        connected: Boolean(status?.connected),
        platform: status?.platform || null,
        printer:
          status?.printer?.name ||
          status?.printer ||
          status?.name ||
          null,
      };

      setPrinterStatus(nextStatus);

      return status;
    } catch (error) {
      console.error("Printer status check failed:", error);

      setPrinterStatus({
        connected: false,
        platform: null,
        printer: null,
      });

      return null;
    }
  }, []);

  // ==================================================
  // PRINTER MODAL
  // ==================================================

  const openPrinterModal = async () => {
    setPrinterModalOpen(true);
    setPrinterStep("select");
    setConnectionMode(null);

    setPrinterList([]);
    setSelectedPrinterId("");

    setPrinterMessage("Choose your printer connection.");
    setMessageType("info");

    await refreshPrinterStatus();
  };

  const closePrinterModal = () => {
    if (printerBusy) return;

    setPrinterModalOpen(false);
  };

  const chooseConnection = (mode) => {
    setConnectionMode(mode);
    setPrinterStep("discover");

    setPrinterList([]);
    setSelectedPrinterId("");

    setPrinterMessage(
      mode === "windows"
        ? "Find printers installed on Windows."
        : mode === "ble"
          ? "Select a Bluetooth LE printer."
          : "Search paired Bluetooth Classic printers."
    );

    setMessageType("info");
  };

  // ==================================================
  // PRINTER DISCOVERY
  // ==================================================

  const loadPrinters = async (mode = "normal") => {
    try {
      setPrinterBusy(true);
      setPrinterMessage("Searching for printers...");
      setMessageType("info");

      let printers = [];

      if (mode === "ble") {
        printers = await getAvailableBlePrinters();
      } else if (mode === "scan") {
        printers = await scanAvailablePrinters();
      } else {
        printers = await getAvailablePrinters();
      }

      const normalized = (printers || [])
        .map((printer) =>
          normalizePrinter(printer, connectionMode)
        )
        .filter(Boolean);

      setPrinterList(normalized);

      if (normalized.length > 0) {
        setSelectedPrinterId(getPrinterKey(normalized[0]));

        setPrinterStep("connect");

        setPrinterMessage(
          `${normalized.length} printer(s) found. Select one to continue.`
        );

        setMessageType("success");
      } else {
        setPrinterMessage(
          "No printers found. Check the printer and try again."
        );

        setMessageType("warning");
      }

      return normalized;
    } catch (error) {
      console.error("Printer discovery failed:", error);

      setPrinterMessage(
        error?.message || "Could not find printers."
      );

      setMessageType("error");

      return [];
    } finally {
      setPrinterBusy(false);
    }
  };

  // ==================================================
  // BLUETOOTH LE DEVICE SELECTION
  // ==================================================

  const handleSelectBlePrinter = async () => {
    try {
      setPrinterBusy(true);

      setPrinterMessage(
        "Opening Bluetooth LE device selection..."
      );

      setMessageType("info");

      const printer = await selectAvailableBlePrinter();

      if (!printer) {
        throw new Error("No Bluetooth printer selected.");
      }

      const normalized = normalizePrinter(
        {
          ...printer,
          connectionType: "ble",
        },
        "ble"
      );

      if (!normalized?.id) {
        throw new Error(
          "Selected BLE printer does not have a valid device ID."
        );
      }

      setPrinterList((current) => {
        const exists = current.some(
          (item) =>
            getPrinterKey(item) ===
            getPrinterKey(normalized)
        );

        return exists
          ? current.map((item) =>
              getPrinterKey(item) ===
              getPrinterKey(normalized)
                ? normalized
                : item
            )
          : [...current, normalized];
      });

      setSelectedPrinterId(getPrinterKey(normalized));

      setPrinterStep("connect");

      setPrinterMessage(
        `${normalized.name} selected. Configure and connect the printer.`
      );

      setMessageType("success");
    } catch (error) {
      console.error("BLE selection failed:", error);

      setPrinterMessage(
        error?.message ||
          "Bluetooth LE selection failed."
      );

      setMessageType("error");
    } finally {
      setPrinterBusy(false);
    }
  };

  // ==================================================
  // CONNECT PRINTER
  // ==================================================

  const handleConnectPrinter = async () => {
    const printer = printerList.find(
      (item) =>
        getPrinterKey(item) === selectedPrinterId
    );

    if (!printer) {
      setPrinterMessage(
        "Please select a printer first."
      );

      setMessageType("warning");
      return;
    }

    try {
      setPrinterBusy(true);

      setPrinterMessage(
        `Connecting to ${printer.name}...`
      );

      setMessageType("info");

      const config = getPrinterSettings();

      if (!config) {
        throw new Error(
          "Printer settings could not be loaded."
        );
      }

      const connectionType =
        connectionMode || printer.connectionType;

      let connectionConfig = {
        paperWidth: String(
          config.paperWidth || DEFAULT_PAPER_WIDTH
        ),
      };

      // ----------------------------------------------
      // Bluetooth LE configuration
      // ----------------------------------------------

      if (connectionType === "ble") {
        const bleConfig = config.ble || {};

        if (
          !bleConfig.serviceUUID ||
          !bleConfig.characteristicUUID
        ) {
          throw new Error(
            "BLE Service UUID and Characteristic UUID are missing. Configure them in Printer Settings."
          );
        }

        connectionConfig = {
          ...connectionConfig,
          ...bleConfig,
        };
      }

      // ----------------------------------------------
      // Bluetooth Classic configuration
      // ----------------------------------------------

      if (connectionType === "classic") {
        connectionConfig = {
          ...connectionConfig,
          ...(config.classic || {}),
        };
      }

      // ----------------------------------------------
      // Windows printer configuration
      // ----------------------------------------------

      if (connectionType === "windows") {
        connectionConfig = {
          ...connectionConfig,
          ...(config.windows || {}),
        };
      }

      const printerToConnect = {
        ...printer,
        connectionType,
      };

      await connectPrinter(
        printerToConnect,
        connectionConfig
      );

      setPrinterStatus({
        connected: true,
        platform: android ? "android" : "windows",
        printer: printer.name,
      });

      setPrinterMessage(
        `Connected to ${printer.name}.`
      );

      setMessageType("success");

      setPrinterStep("print");

      await refreshPrinterStatus();
    } catch (error) {
      console.error(
        "Printer connection failed:",
        error
      );

      setPrinterMessage(
        error?.message ||
          "Could not connect to printer."
      );

      setMessageType("error");

      await refreshPrinterStatus();
    } finally {
      setPrinterBusy(false);
    }
  };

  // ==================================================
  // DISCONNECT PRINTER
  // ==================================================

  const handleDisconnectPrinter = async () => {
    try {
      setPrinterBusy(true);

      setPrinterMessage("Disconnecting printer...");
      setMessageType("info");

      await disconnectPrinter();

      setPrinterStatus({
        connected: false,
        platform: null,
        printer: null,
      });

      setPrinterStep("select");
      setConnectionMode(null);

      setPrinterList([]);
      setSelectedPrinterId("");

      setPrinterMessage("Printer disconnected.");
      setMessageType("success");
    } catch (error) {
      console.error(
        "Printer disconnect failed:",
        error
      );

      setPrinterMessage(
        error?.message ||
          "Could not disconnect printer."
      );

      setMessageType("error");
    } finally {
      setPrinterBusy(false);
    }
  };

  // ==================================================
  // PRINT INVOICE
  // ==================================================

  const handlePrint = async () => {
    if (!printerStatus.connected) {
      setPrinterMessage(
        "Connect a printer before printing."
      );

      setMessageType("warning");
      return;
    }

    const printer = printerList.find(
      (item) =>
        getPrinterKey(item) === selectedPrinterId
    );

    if (!printer) {
      setPrinterMessage(
        "Selected printer not found. Please reconnect your printer."
      );

      setMessageType("error");
      return;
    }

    try {
      setPrinterBusy(true);

      setPrinterMessage(
        "Preparing invoice for printing..."
      );

      setMessageType("info");

      if (!invoice || !business) {
        throw new Error(
          "Invoice data is incomplete. Reload the invoice and try again."
        );
      }

      const bytes = buildInvoiceEscPos({
        invoice,
        customer,
        business,
        settings,
        items,
        paperWidth,
        summaryDays,
        summaryProducts,
        dailyProductQty,
      });

      if (!bytes || !bytes.length) {
        throw new Error(
          "Could not generate receipt data."
        );
      }

      setPrinterMessage(
        `Sending invoice to ${printer.name}...`
      );

      const result = await printReceipt({
        data: bytes,
        printer,
        paperWidth,
      });

      if (result?.success === false) {
        throw new Error(
          result?.message ||
            "Printer rejected the print job."
        );
      }

      setPrinterMessage(
        result?.message ||
          "Print data sent successfully. Check your printer."
      );

      setMessageType("success");
    } catch (error) {
      console.error(
        "Thermal printing failed:",
        error
      );

      setPrinterMessage(
        error?.message ||
          "Thermal printing failed."
      );

      setMessageType("error");
    } finally {
      setPrinterBusy(false);

      await refreshPrinterStatus();
    }
  };

  // ==================================================
  // LOADING STATE
  // ==================================================

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-slate-600">
        <LoaderCircle
          className="animate-spin"
          size={22}
        />

        Loading invoice...
      </main>
    );
  }

  // ==================================================
  // ERROR STATE
  // ==================================================

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 p-5">
        <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />

            <h1 className="text-lg font-bold">
              Unable to load invoice
            </h1>
          </div>

          <p className="mt-2 text-sm text-red-700">
            {error || "Invoice not found."}
          </p>

          <Link
            to={`/invoices/${invoiceId}`}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <ArrowLeft size={16} />
            Back to invoice
          </Link>
        </div>
      </main>
    );
  }


  // ==================================================
  // MAIN RENDER
  // ==================================================

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 sm:p-5">

      {/* PAGE ACTION BAR */}

      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3">
        <Link
          to={`/invoices/${invoiceId}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft size={17} />
          Back
        </Link>

        <button
          type="button"
          onClick={openPrinterModal}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-800 active:scale-[0.98]"
        >
          <Printer size={17} />
          Print Receipt
        </button>
      </div>

      {/* RECEIPT PREVIEW */}

      <article
        className="thermal-paper mx-auto border border-slate-200 bg-white p-4 shadow-sm"
        aria-label={`Invoice ${formatInvoiceNumber(invoice.invoice_number)}`}
        style={{
          width: paperWidth === "58" ? "48mm" : "72mm",
          maxWidth: "100%",
          color: "#000",
          fontSize: paperWidth === "58" ? "9px" : "10px",
          lineHeight: 1.35,
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
            <p className="mt-1 whitespace-pre-wrap text-xs">
              {settings.business_address}
            </p>
          )}

          {settings?.business_phone && (
            <p className="mt-1 text-xs">
              Phone: {settings.business_phone}
            </p>
          )}

          <div className="my-3 border-t border-dashed border-black" />

          <h2 className="text-sm font-extrabold">
            INVOICE / RECEIPT
          </h2>

          <p className="mt-1 text-xs font-semibold">
            {formatInvoiceNumber(invoice.invoice_number)}
          </p>
        </header>

        <div className="my-3 border-t border-dashed border-black" />

        {/* CUSTOMER DETAILS */}

        <section className="space-y-1 text-xs">
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

        {/* BILL SUMMARY */}

        <section className="space-y-2 text-xs">
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
              <span>
                {formatCurrency(previousOutstanding)}
              </span>
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

        {/* DELIVERY SUMMARY */}

        {summaryWeeks.length > 0 &&
          summaryProducts.length > 0 && (
            <>
              <div className="my-3 border-t border-dashed border-black" />

              <section className="text-[9px]">
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
                            <th key={`empty-date-${i}`} />
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
                                <td key={`empty-qty-${i}`} />
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

            <section className="text-xs">
              <h2 className="mb-2 font-bold">Lost Jars</h2>

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

        {/* INVOICE REMARK */}

        {settings?.invoice_remark?.trim() && (
          <section className="mt-2 border-t border-dashed border-black pt-2">
            <h2 className="mb-1 text-[10px] font-bold uppercase">
              Invoice Remark
            </h2>

            <p className="whitespace-pre-wrap break-words text-[9px] leading-tight">
              {settings.invoice_remark.trim()}
            </p>
          </section>
        )}

        {/* FOOTER */}

        <footer className="mt-4 border-t border-dashed border-black pt-3 text-center text-xs">
          <p className="font-bold">Thank you!</p>

          <p className="mt-1">
            Please keep this receipt for your records.
          </p>

          <p className="mt-2 text-[10px] font-semibold">
            {business.name || "Amrit Jal"}
          </p>
        </footer>
      </article>

      {/* ==================================================
          PRINTER MODAL
      ================================================== */}

      {printerModalOpen && (
        <div
          className="no-print fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePrinterModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="printer-modal-title"
            className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[85vh] sm:rounded-2xl"
          >

            {/* MODAL HEADER */}

            <div className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-3 sm:px-6 sm:pt-5">
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">
                    AMRIT JAL
                  </p>

                  <h2
                    id="printer-modal-title"
                    className="mt-1 text-lg font-bold text-slate-900"
                  >
                    Thermal Printer
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Connect and print your invoice
                  </p>
                </div>

                <button
                  type="button"
                  disabled={printerBusy}
                  onClick={closePrinterModal}
                  aria-label="Close printer settings"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-40"
                >
                  <X size={19} />
                </button>
              </div>

              {/* STEP INDICATOR */}

              <div className="mt-5 flex items-center gap-2">
                {[
                  ["select", "Connection"],
                  ["discover", "Find"],
                  ["connect", "Connect"],
                  ["print", "Print"],
                ].map(([step, label], index) => {
                  const steps = [
                    "select",
                    "discover",
                    "connect",
                    "print",
                  ];

                  const currentIndex =
                    steps.indexOf(printerStep);

                  const completed = index < currentIndex;
                  const active = step === printerStep;

                  return (
                    <div
                      key={step}
                      className="flex min-w-0 flex-1 items-center gap-1.5"
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          completed || active
                            ? "bg-cyan-700 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {completed ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          index + 1
                        )}
                      </div>

                      <span
                        className={`truncate text-[10px] font-semibold sm:text-xs ${
                          active
                            ? "text-cyan-800"
                            : "text-slate-400"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MODAL CONTENT */}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">

              {/* STEP 1: CONNECTION TYPE */}

              {printerStep === "select" && (
                <div>
                  <h3 className="mb-1 text-sm font-bold text-slate-900">
                    Choose connection
                  </h3>

                  <p className="mb-4 text-xs leading-relaxed text-slate-500">
                    Select how your thermal printer is connected.
                  </p>

                  {android ? (
                    <div className="space-y-3">

                      <button
                        type="button"
                        onClick={() =>
                          chooseConnection("classic")
                        }
                        className="flex min-h-[76px] w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-cyan-500 hover:bg-cyan-50/50 active:scale-[0.99]"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                          <Bluetooth size={25} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-slate-900">
                            Bluetooth Classic
                          </span>

                          <span className="mt-1 block text-xs text-slate-500">
                            Paired thermal printers
                          </span>
                        </span>

                        <ChevronRight
                          size={19}
                          className="text-slate-400"
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          chooseConnection("ble")
                        }
                        className="flex min-h-[76px] w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-cyan-500 hover:bg-cyan-50/50 active:scale-[0.99]"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                          <Bluetooth size={25} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-slate-900">
                            Bluetooth LE
                          </span>

                          <span className="mt-1 block text-xs text-slate-500">
                            BLE-compatible printers
                          </span>
                        </span>

                        <ChevronRight
                          size={19}
                          className="text-slate-400"
                        />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        chooseConnection("windows")
                      }
                      className="flex min-h-[84px] w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-cyan-500 hover:bg-cyan-50/50 active:scale-[0.99]"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                        <Monitor size={25} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-slate-900">
                          Windows Printer
                        </span>

                        <span className="mt-1 block text-xs text-slate-500">
                          QZ Tray · Installed printers
                        </span>
                      </span>

                      <ChevronRight
                        size={19}
                        className="text-slate-400"
                      />
                    </button>
                  )}

                  <div className="mt-5 rounded-xl bg-slate-50 p-3">
                    <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
                      <AlertCircle
                        size={15}
                        className="mt-0.5 shrink-0"
                      />

                      Make sure your printer is powered on and Bluetooth is enabled, or QZ Tray is running on Windows.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: DISCOVERY */}

              {printerStep === "discover" && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setPrinterStep("select")
                    }
                    className="mb-4 text-xs font-semibold text-cyan-700"
                  >
                    ← Change connection type
                  </button>

                  <h3 className="text-sm font-bold text-slate-900">
                    Find your printer
                  </h3>

                  <p className="mb-4 mt-1 text-xs text-slate-500">
                    {connectionMode === "windows"
                      ? "Search for printers installed in Windows."
                      : connectionMode === "ble"
                        ? "Select a compatible Bluetooth LE printer."
                        : "Search paired Bluetooth Classic printers."}
                  </p>

                  {connectionMode === "ble" ? (
                    <button
                      type="button"
                      disabled={printerBusy}
                      onClick={handleSelectBlePrinter}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {printerBusy ? (
                        <LoaderCircle
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <Bluetooth size={18} />
                      )}

                      Select BLE Printer
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={printerBusy}
                      onClick={() =>
                        loadPrinters(
                          connectionMode === "classic"
                            ? "scan"
                            : "normal"
                        )
                      }
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {printerBusy ? (
                        <LoaderCircle
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <Search size={18} />
                      )}

                      {printerBusy
                        ? "Searching..."
                        : "Find Printers"}
                    </button>
                  )}

                  {connectionMode === "classic" && (
                    <button
                      type="button"
                      disabled={printerBusy}
                      onClick={() =>
                        loadPrinters("normal")
                      }
                      className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
                    >
                      <Bluetooth size={16} />
                      Show Paired Printers
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={printerBusy}
                    onClick={() =>
                      connectionMode === "ble"
                        ? handleSelectBlePrinter()
                        : loadPrinters(
                            connectionMode === "classic"
                              ? "scan"
                              : "normal"
                          )
                    }
                    className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={16}
                      className={
                        printerBusy ? "animate-spin" : ""
                      }
                    />
                    Refresh Search
                  </button>

                  {printerList.length > 0 && (
                    <p className="mt-3 text-xs text-slate-500">
                      {printerList.length} printer(s) available.
                    </p>
                  )}

                  <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
                    {printerMessage || "Ready to search."}
                  </div>
                </div>
              )}

              {/* STEP 3: SELECT AND CONNECT */}

              {printerStep === "connect" && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setPrinterStep("discover")
                    }
                    className="mb-4 text-xs font-semibold text-cyan-700"
                  >
                    ← Back to discovery
                  </button>

                  <h3 className="text-sm font-bold text-slate-900">
                    Select your printer
                  </h3>

                  <p className="mb-4 mt-1 text-xs text-slate-500">
                    Choose the printer you want to use.
                  </p>

                  <div className="space-y-2">
                    {printerList.map((printer) => {
                      const key = getPrinterKey(printer);
                      const selected =
                        selectedPrinterId === key;

                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() =>
                            setSelectedPrinterId(key)
                          }
                          className={`flex min-h-[64px] w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                            selected
                              ? "border-cyan-600 bg-cyan-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            {connectionMode === "windows" ? (
                              <Printer size={19} />
                            ) : (
                              <Bluetooth size={19} />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-slate-900">
                              {printer.name}
                            </span>

                            <span className="block truncate text-[11px] text-slate-500">
                              {printer.address ||
                                printer.deviceId ||
                                printer.id ||
                                connectionMode}
                            </span>
                          </span>

                          {selected && (
                            <CheckCircle2
                              size={20}
                              className="shrink-0 text-cyan-700"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {printerList.length === 0 && (
                    <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                      No printer is available. Go back and search again.
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={
                      printerBusy || !selectedPrinterId
                    }
                    onClick={handleConnectPrinter}
                    className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {printerBusy ? (
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}

                    {printerBusy
                      ? "Connecting..."
                      : "Connect Printer"}
                  </button>
                </div>
              )}

              {/* STEP 4: PRINT */}

              {printerStep === "print" && (
                <div>
                  <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle2 size={24} />
                      </span>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-emerald-900">
                          Printer connected
                        </p>

                        <p className="mt-0.5 truncate text-xs text-emerald-700">
                          {printerStatus.printer ||
                            printerList.find(
                              (item) =>
                                getPrinterKey(item) ===
                                selectedPrinterId
                            )?.name ||
                            "Selected printer"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    Print invoice
                  </h3>

                  <p className="mb-4 mt-1 text-xs text-slate-500">
                    Choose your thermal paper width.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {["58", "80"].map((width) => (
                      <button
                        type="button"
                        key={width}
                        onClick={() =>
                          handlePaperWidthChange(width)
                        }
                        className={`rounded-xl border p-4 text-center transition ${
                          paperWidth === width
                            ? "border-cyan-600 bg-cyan-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <span className="block text-xl font-extrabold text-slate-900">
                          {width} mm
                        </span>

                        <span className="mt-1 block text-[11px] text-slate-500">
                          {width === "58"
                            ? "Compact receipt"
                            : "Standard receipt"}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={printerBusy}
                    onClick={handlePrint}
                    className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.99] disabled:opacity-50"
                  >
                    {printerBusy ? (
                      <LoaderCircle
                        size={19}
                        className="animate-spin"
                      />
                    ) : (
                      <Printer size={19} />
                    )}

                    {printerBusy
                      ? "Sending Invoice..."
                      : "Print Invoice"}
                  </button>

                  <button
                    type="button"
                    disabled={printerBusy}
                    onClick={handleDisconnectPrinter}
                    className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"
                  >
                    <Unplug size={16} />
                    Disconnect Printer
                  </button>
                </div>
              )}
            </div>

            {/* MODAL FOOTER / STATUS */}

            <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6">
              <div
                className={`flex items-start gap-2 rounded-xl p-3 text-xs leading-relaxed ${
                  messageType === "success"
                    ? "bg-emerald-50 text-emerald-800"
                    : messageType === "error"
                      ? "bg-red-50 text-red-700"
                      : messageType === "warning"
                        ? "bg-amber-50 text-amber-800"
                        : "bg-slate-50 text-slate-600"
                }`}
                role="status"
                aria-live="polite"
              >
                {messageType === "success" ? (
                  <CheckCircle2
                    size={15}
                    className="mt-0.5 shrink-0"
                  />
                ) : messageType === "error" ? (
                  <AlertCircle
                    size={15}
                    className="mt-0.5 shrink-0"
                  />
                ) : (
                  <Printer
                    size={15}
                    className="mt-0.5 shrink-0"
                  />
                )}

                <span className="min-w-0 break-words">
                  {printerMessage || "Ready to print."}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  {android
                    ? "Android Bluetooth"
                    : "Windows QZ Tray"}
                </span>

                <span>58mm / 80mm</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
