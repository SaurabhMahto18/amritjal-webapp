
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileSpreadsheet,
  FileJson,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Users,
  Info,
  X,
  ShieldCheck,
  RefreshCw,
  IndianRupee,
  UserRound,
  Phone,
  MapPin,
  FileCheck2,
} from "lucide-react";
import { useCustomers } from "../hooks/useCustomers";

const HEADER_ALIASES = {
  name: ["name", "customer name", "customer_name", "customer"],
  phone: [
    "phone",
    "mobile",
    "mobile number",
    "phone number",
    "contact",
    "contact number",
  ],
  billingPhone: [
    "billing phone",
    "billing_phone",
    "billing mobile",
    "billing mobile number",
  ],
  customerGroup: [
    "customer group",
    "customer_group",
    "group",
    "group name",
    "group_name",
  ],
  email: ["email", "email address"],
  address: ["address", "full address", "customer address"],
  area: ["area", "locality", "zone"],
  shift: ["shift", "delivery shift", "delivery_shift"],
  paymentReminder: [
    "payment reminder",
    "payment_reminder",
    "reminder",
  ],
  jarRate: ["jar rate", "jar_rate", "rate", "price", "unit price"],
  openingBalance: [
    "opening balance",
    "opening_balance",
    "balance",
    "opening due",
  ],
  securityDeposit: [
    "security deposit",
    "security_deposit",
    "deposit",
    "deposit amount",
    "security amount",
  ],
  notes: ["notes", "remark", "remarks"],
};

function normalizeHeader(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function mapRow(source, rowNumber) {
  const normalized = {};

  for (const [key, value] of Object.entries(source || {})) {
    normalized[normalizeHeader(key)] = value;
  }

  const result = { _rowNumber: rowNumber };

  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const alias = aliases
      .map(normalizeHeader)
      .find((key) =>
        Object.prototype.hasOwnProperty.call(normalized, key)
      );

    if (alias) {
      result[field] = normalized[alias];
    }
  }

  return result;
}

// CSV reader supports quoted commas, escaped quotes, CRLF
// and newlines inside quoted fields.
function parseCSV(text) {
  const input = String(text ?? "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"' && cell.length === 0) {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i += 1;

      row.push(cell);

      if (row.some((value) => String(value).trim() !== "")) {
        rows.push(row);
      }

      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (quoted) {
    throw new Error("CSV contains an unclosed quoted field.");
  }

  row.push(cell);

  if (row.some((value) => String(value).trim() !== "")) {
    rows.push(row);
  }

  if (rows.length < 2) {
    throw new Error(
      "CSV must contain a header row and at least one customer row."
    );
  }

  const headers = rows[0].map(normalizeHeader);
  const nameAliases = HEADER_ALIASES.name.map(normalizeHeader);

  if (!headers.some((header) => nameAliases.includes(header))) {
    throw new Error(
      "CSV must include a Name or Customer Name column."
    );
  }

  const duplicateHeaders = headers.filter(
    (header, index) => header && headers.indexOf(header) !== index
  );

  if (duplicateHeaders.length > 0) {
    throw new Error(
      `CSV contains duplicate column headings: ${[
        ...new Set(duplicateHeaders),
      ].join(", ")}.`
    );
  }

  return rows.slice(1).map((values, index) => {
    const source = {};

    headers.forEach((header, column) => {
      if (header) {
        source[header] = values[column] ?? "";
      }
    });

    return mapRow(source, index + 2);
  });
}

function parseJSON(text) {
  let parsed;

  try {
    parsed = JSON.parse(String(text ?? "").replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("Invalid JSON file. Please check the file format.");
  }

  const list = Array.isArray(parsed) ? parsed : parsed?.customers;

  if (!Array.isArray(list)) {
    throw new Error(
      'JSON must be an array of customers or an object with a "customers" array.'
    );
  }

  if (list.length === 0) {
    throw new Error("The JSON file does not contain any customer records.");
  }

  return list.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error(
        `JSON customer at row ${index + 1} must be an object.`
      );
    }

    return mapRow(row, index + 1);
  });
}

function downloadTemplate() {
  const headers = [
    "name",
    "phone",
    "billing_phone",
    "customer_group",
    "email",
    "address",
    "area",
    "shift",
    "payment_reminder",
    "jar_rate",
    "opening_balance",
    "security_deposit",
    "notes",
  ];

  const sample = [
    "Ravi Kumar",
    "9876543210",
    "9876543210",
    "",
    "ravi@example.com",
    "House 12, Main Road",
    "Kanke",
    "Morning",
    "Monthly",
    "30",
    "0",
    "0",
    "Regular customer",
  ];

  const csv = [headers, sample]
    .map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "amrit-jal-customer-import-template.csv";
  anchor.click();

  URL.revokeObjectURL(url);
}

function formatAmount(value) {
  if (value === "" || value == null) return "0";
  return String(value);
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function StepIndicator({ number, title, active, completed }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          completed
            ? "bg-teal-700 text-white"
            : active
              ? "bg-white text-teal-800 ring-2 ring-teal-200"
              : "bg-white/15 text-white/70"
        }`}
      >
        {completed ? (
          <CheckCircle2 size={17} />
        ) : (
          number
        )}
      </div>

      <span
        className={`truncate text-xs font-semibold sm:text-sm ${
          active || completed ? "text-white" : "text-white/60"
        }`}
      >
        {title}
      </span>
    </div>
  );
}

function CustomerPreviewCard({ row }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <UserRound size={19} />
          </div>

          <div className="min-w-0">
            <h3 className="break-words text-sm font-bold text-slate-900">
              {row.name || "Unnamed customer"}
            </h3>

            <p className="mt-1 text-[11px] text-slate-400">
              File row #{row._rowNumber}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
          Preview
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="min-w-0 rounded-lg bg-slate-50 p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
            <Phone size={12} />
            Mobile
          </div>
          <p className="mt-1 break-all text-xs font-semibold text-slate-700">
            {row.phone || "—"}
          </p>
        </div>

        <div className="min-w-0 rounded-lg bg-slate-50 p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
            <MapPin size={12} />
            Area
          </div>
          <p className="mt-1 break-words text-xs font-semibold text-slate-700">
            {row.area || "—"}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-2.5">
          <p className="text-[10px] font-medium text-slate-400">
            Jar Rate
          </p>
          <p className="mt-1 text-xs font-bold text-slate-800">
            {formatMoney(row.jarRate)}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-2.5">
          <p className="text-[10px] font-medium text-slate-400">
            Opening Balance
          </p>
          <p className="mt-1 text-xs font-bold text-slate-800">
            {formatMoney(row.openingBalance)}
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
        <span className="text-[11px] text-slate-500">
          Security Deposit
        </span>
        <span className="text-xs font-bold text-slate-700">
          {formatMoney(row.securityDeposit)}
        </span>
      </div>
    </article>
  );
}

export default function BulkCustomerImportPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const { importCustomers, refresh } = useCustomers({
    includeArchived: true,
  });

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [refreshWarning, setRefreshWarning] = useState("");

  // SEO metadata
  useEffect(() => {
    const previousTitle = document.title;

    const descriptionSelector = 'meta[name="description"]';
    const robotsSelector = 'meta[name="robots"]';

    const previousDescription =
      document.head.querySelector(descriptionSelector);

    const previousRobots =
      document.head.querySelector(robotsSelector);

    const oldDescription = previousDescription?.getAttribute("content");
    const oldRobots = previousRobots?.getAttribute("content");

    const description =
      previousDescription || document.createElement("meta");

    const robots =
      previousRobots || document.createElement("meta");

    document.title = "Bulk Customer Import | Amrit Jal";

    description.name = "description";
    description.content =
      "Import customer records into Amrit Jal using CSV or JSON files. Review customer data, validate records and track imported, skipped and invalid rows.";

    robots.name = "robots";
    robots.content = "noindex, nofollow";

    if (!previousDescription) {
      document.head.appendChild(description);
    }

    if (!previousRobots) {
      document.head.appendChild(robots);
    }

    return () => {
      document.title = previousTitle;

      if (previousDescription) {
        if (oldDescription == null) {
          previousDescription.removeAttribute("content");
        } else {
          previousDescription.setAttribute("content", oldDescription);
        }
      } else {
        description.remove();
      }

      if (previousRobots) {
        if (oldRobots == null) {
          previousRobots.removeAttribute("content");
        } else {
          previousRobots.setAttribute("content", oldRobots);
        }
      } else {
        robots.remove();
      }
    };
  }, []);

  const previewRows = useMemo(
    () => rows.slice(0, 8),
    [rows]
  );

  async function handleFile(file) {
    if (!file) return;

    setParseError("");
    setRefreshWarning("");
    setResult(null);
    setRows([]);
    setFileName(file.name);

    try {
      if (file.size === 0) {
        throw new Error("Selected file is empty.");
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size must be 10 MB or less.");
      }

      const extension = file.name.split(".").pop()?.toLowerCase();

      if (!["csv", "json"].includes(extension)) {
        throw new Error("Only CSV and JSON files are supported.");
      }

      const content = await file.text();

      const parsedRows =
        extension === "csv"
          ? parseCSV(content)
          : parseJSON(content);

      if (!parsedRows.length) {
        throw new Error("No customer records found.");
      }

      setRows(parsedRows);
    } catch (error) {
      console.error("Customer file selection error:", error);
      setParseError(error?.message || "Unable to read file.");
    }
  }

  function clearFile() {
    if (busy) return;

    setFileName("");
    setRows([]);
    setParseError("");
    setResult(null);
    setRefreshWarning("");

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  async function handleImport() {
    if (!rows.length || busy) return;

    setBusy(true);
    setParseError("");
    setRefreshWarning("");

    try {
      const summary = await importCustomers(rows);

      setResult({
        inserted: Number(summary?.inserted ?? 0),
        skipped: Number(summary?.skipped ?? 0),
        invalid: Number(summary?.invalid ?? 0),
        blocked: Boolean(summary?.blocked),
        blockReason: summary?.blockReason || "",
        skippedRows: Array.isArray(summary?.skippedRows)
          ? summary.skippedRows
          : [],
        invalidRows: Array.isArray(summary?.invalidRows)
          ? summary.invalidRows
          : [],
      });

      try {
        await refresh();
      } catch {
        setRefreshWarning(
          "Import completed, but the customer list could not refresh. Reload the page to see the latest records."
        );
      }
    } catch (error) {
      setParseError(error?.message || "Customer import failed.");
    } finally {
      setBusy(false);
    }
  }

  function handleFileDrop(event) {
    event.preventDefault();

    if (busy) return;

    const file = event.dataTransfer?.files?.[0];

    if (file) {
      handleFile(file);
    }
  }

  const hasPreview = rows.length > 0 && !result;

  return (
    <main
      className={`min-h-full bg-[#F5F8F8] px-3 py-4 text-slate-800 sm:px-5 sm:py-6 lg:px-8 ${
        hasPreview ? "pb-28 sm:pb-8" : "pb-6"
      }`}
    >
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">

        {/* TOP NAVIGATION */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/customers"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-teal-700 sm:text-sm"
          >
            <ArrowLeft size={17} />
            <span>Back to Customers</span>
          </Link>

          <span className="hidden items-center gap-1.5 rounded-full border border-teal-100 bg-white px-3 py-1.5 text-[11px] font-semibold text-teal-700 sm:inline-flex">
            <ShieldCheck size={14} />
            Customer Management
          </span>
        </div>

        {/* HERO / PAGE HEADER */}
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D514B] via-teal-800 to-[#087F73] p-4 text-white shadow-lg shadow-teal-950/10 sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-6 -top-9 size-44 rounded-full border border-white/10" />

          <div className="relative">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 sm:size-14">
                <Users size={23} className="sm:hidden" />
                <Users size={27} className="hidden sm:block" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-teal-100 sm:text-xs">
                  Customer Operations
                </p>

                <h1 className="mt-1.5 text-xl font-bold tracking-tight sm:mt-2 sm:text-3xl">
                  Bulk Customer Import
                </h1>

                <p className="mt-2 max-w-2xl text-xs leading-5 text-teal-50/90 sm:text-sm sm:leading-6">
                  Add multiple customers together using a CSV or JSON file.
                  Review the records before importing them into Amrit Jal.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white sm:text-xs">
                    CSV Supported
                  </span>

                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white sm:text-xs">
                    JSON Supported
                  </span>

                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white sm:text-xs">
                    Maximum 10 MB
                  </span>
                </div>
              </div>
            </div>

            {/* STEP INDICATOR */}
            <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-black/10 p-3 sm:mt-7 sm:p-4">
              <StepIndicator
                number="1"
                title="Select File"
                active={!fileName}
                completed={Boolean(rows.length || result)}
              />

              <StepIndicator
                number="2"
                title="Review Data"
                active={rows.length > 0 && !result}
                completed={Boolean(result)}
              />

              <StepIndicator
                number="3"
                title="Import"
                active={Boolean(result)}
                completed={Boolean(result && !result.blocked)}
              />
            </div>
          </div>
        </header>

        {/* STEP 1: FILE UPLOAD */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <FileSpreadsheet size={19} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  01. Prepare your file
                </h2>
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                  Required
                </span>
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Use the template or select an existing CSV/JSON file.
                Customer name is required.
              </p>
            </div>
          </div>

          <div className="space-y-4 p-3.5 sm:p-6">

            {/* FORMAT OPTIONS */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 sm:p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                  <FileSpreadsheet size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 sm:text-sm">
                    CSV File
                  </p>
                  <p className="mt-0.5 text-[10px] leading-4 text-slate-500 sm:text-xs">
                    Spreadsheet format
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-amber-100 bg-amber-50/60 p-3 sm:p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm">
                  <FileJson size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 sm:text-sm">
                    JSON File
                  </p>
                  <p className="mt-0.5 text-[10px] leading-4 text-slate-500 sm:text-xs">
                    Structured data
                  </p>
                </div>
              </div>
            </div>

            {/* TEMPLATE DOWNLOAD */}
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="flex min-w-0 items-start gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm">
                  <Download size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 sm:text-sm">
                    Don't have a template?
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500 sm:text-xs">
                    Download the sample CSV with supported column headings.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={downloadTemplate}
                disabled={busy}
                className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-xs font-bold text-teal-800 transition hover:bg-teal-50 disabled:opacity-50 sm:w-auto sm:text-sm"
              >
                <Download size={15} />
                Download Template
              </button>
            </div>

            {/* FILE PICKER */}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={async (event) => {
                const file = event.currentTarget.files?.[0];

                if (file) {
                  await handleFile(file);
                }

                // Allows selecting the same file again.
                event.currentTarget.value = "";
              }}
            />

            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleFileDrop}
              className="rounded-2xl border-2 border-dashed border-teal-200 bg-[#F4FBF9] px-4 py-7 text-center transition hover:border-teal-400 hover:bg-teal-50/60 sm:px-8 sm:py-10"
            >
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm sm:size-16">
                <Upload size={27} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-900 sm:text-base">
                Choose your customer file
              </h3>

              <p className="mx-auto mt-1.5 max-w-xs text-[11px] leading-5 text-slate-500 sm:text-sm">
                Select a CSV or JSON file from your device.
                You can also drop a file here on desktop.
              </p>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Upload size={17} />
                Select File
              </button>

              <p className="mt-3 text-[10px] font-medium text-slate-400">
                CSV or JSON · Maximum file size 10 MB
              </p>
            </div>

            {/* SELECTED FILE */}
            {fileName && (
              <div className="flex min-w-0 items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/60 p-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
                  <FileCheck2 size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800 sm:text-sm">
                    {fileName}
                  </p>
                  <p className="mt-1 text-[10px] text-teal-700">
                    {rows.length > 0
                      ? `${rows.length} customer records detected`
                      : "File selected"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearFile}
                  disabled={busy}
                  aria-label="Remove selected file"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-rose-600 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* PARSE ERROR */}
            {parseError && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs leading-5 text-rose-700 sm:text-sm"
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />
                <p className="min-w-0">{parseError}</p>
              </div>
            )}
          </div>
        </section>

        {/* STEP 2: PREVIEW */}
        {hasPreview && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <FileText size={19} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                      02. Review customer data
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Check the records before importing them.
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-800 sm:text-xs">
                  {rows.length} Records
                </span>
              </div>

              {/* PREVIEW SUMMARY */}
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-medium text-slate-400">
                    Total detected
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                    {rows.length}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-medium text-slate-400">
                    Showing preview
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                    {previewRows.length}
                  </p>
                </div>

                <div className="col-span-2 rounded-xl bg-amber-50 p-3 sm:col-span-1">
                  <p className="text-[10px] font-medium text-amber-700">
                    Duplicate policy
                  </p>
                  <p className="mt-1 text-sm font-bold text-amber-800">
                    Skip existing
                  </p>
                </div>
              </div>
            </div>

            {/* MOBILE CARD PREVIEW */}
            <div className="space-y-2.5 p-3.5 sm:hidden">
              {previewRows.map((row) => (
                <CustomerPreviewCard
                  key={row._rowNumber}
                  row={row}
                />
              ))}

              {rows.length > previewRows.length && (
                <p className="rounded-xl bg-slate-50 px-3 py-3 text-center text-xs font-medium text-slate-500">
                  + {rows.length - previewRows.length} more records
                  will be processed during import.
                </p>
              )}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    {[
                      "Row",
                      "Customer Name",
                      "Mobile",
                      "Area",
                      "Jar Rate",
                      "Opening Balance",
                      "Security Deposit",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-4 py-3.5 font-bold"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {previewRows.map((row) => (
                    <tr
                      key={row._rowNumber}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {row._rowNumber}
                      </td>

                      <td className="max-w-52 px-4 py-3 font-semibold text-slate-800">
                        <span className="block truncate">
                          {row.name || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {row.phone || "—"}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {row.area || "—"}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {formatAmount(row.jarRate)}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {formatAmount(row.openingBalance)}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {formatAmount(row.securityDeposit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {rows.length > previewRows.length && (
                <p className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  Showing {previewRows.length} of {rows.length} records.
                  All records will be processed during import.
                </p>
              )}
            </div>

            {/* IMPORT INFORMATION + DESKTOP ACTION */}
            <div className="border-t border-slate-100 p-3.5 sm:p-5">
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                <Info
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <p className="text-[11px] leading-5 text-amber-900 sm:text-xs">
                  Existing mobile numbers are skipped. Existing customer
                  records are never overwritten. Security deposit is stored
                  separately from opening balance.
                </p>
              </div>

              <div className="mt-4 hidden justify-end sm:flex">
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={busy || !rows.length}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-800 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={17} />
                      Import {rows.length} Customers
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* MOBILE STICKY IMPORT ACTION */}
        {hasPreview && (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-8px_25px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
            <div className="mx-auto flex max-w-6xl items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium text-slate-400">
                  Ready to import
                </p>
                <p className="mt-0.5 text-sm font-bold text-slate-900">
                  {rows.length} Customers
                </p>
              </div>

              <button
                type="button"
                onClick={handleImport}
                disabled={busy || !rows.length}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-xs font-bold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Importing
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Import Customers
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: IMPORT RESULT */}
        {result && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* Result header */}
            <div
              className={`p-4 sm:p-6 ${
                result.blocked
                  ? "bg-rose-50"
                  : "bg-emerald-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${
                    result.blocked
                      ? "text-rose-600"
                      : "text-emerald-600"
                  }`}
                >
                  {result.blocked ? (
                    <AlertCircle size={23} />
                  ) : (
                    <CheckCircle2 size={23} />
                  )}
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      result.blocked
                        ? "text-rose-600"
                        : "text-emerald-700"
                    }`}
                  >
                    Import Summary
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                    {result.blocked
                      ? "Import stopped"
                      : "Import completed"}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
                    {result.blocked
                      ? "The import stopped because of a subscription restriction."
                      : "Your customer import operation has finished."}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription restriction */}
            {result.blocked && (
              <div
                role="alert"
                className="mx-3 mt-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 sm:mx-5"
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-rose-600"
                />

                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-rose-800">
                    Subscription restriction
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-rose-700">
                    {result.blockReason ||
                      "Your subscription does not allow adding more active customers."}
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-rose-600">
                    {result.inserted} customer
                    {result.inserted === 1 ? "" : "s"} imported before
                    the restriction. Remaining rows were not processed.
                  </p>
                </div>
              </div>
            )}

            {/* Refresh warning */}
            {refreshWarning && (
              <div className="mx-3 mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 sm:mx-5">
                {refreshWarning}
              </div>
            )}

            {/* Result stats */}
            <div className="grid grid-cols-1 gap-2.5 p-3.5 sm:grid-cols-3 sm:gap-3 sm:p-5">
              <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 sm:block">
                <div>
                  <p className="text-xs font-semibold text-emerald-700">
                    Added
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-600">
                    Successfully imported
                  </p>
                </div>
                <p className="text-2xl font-bold text-emerald-800 tabular-nums sm:mt-3">
                  {result.inserted}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/70 p-4 sm:block">
                <div>
                  <p className="text-xs font-semibold text-amber-700">
                    Skipped
                  </p>
                  <p className="mt-1 text-[11px] text-amber-600">
                    Duplicate records
                  </p>
                </div>
                <p className="text-2xl font-bold text-amber-800 tabular-nums sm:mt-3">
                  {result.skipped}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/70 p-4 sm:block">
                <div>
                  <p className="text-xs font-semibold text-rose-700">
                    Invalid
                  </p>
                  <p className="mt-1 text-[11px] text-rose-600">
                    Rows not imported
                  </p>
                </div>
                <p className="text-2xl font-bold text-rose-800 tabular-nums sm:mt-3">
                  {result.invalid}
                </p>
              </div>
            </div>

            {/* Rows not imported */}
            {(result.skippedRows?.length > 0 ||
              result.invalidRows?.length > 0) && (
              <div className="border-t border-slate-100 p-3.5 sm:p-5">
                <h3 className="text-sm font-bold text-slate-800">
                  Rows not imported
                </h3>

                <div className="mt-3 space-y-2">
                  {[
                    ...(result.skippedRows || []).map((row) => ({
                      ...row,
                      type: "Skipped",
                    })),
                    ...(result.invalidRows || []).map((row) => ({
                      ...row,
                      type: "Invalid",
                    })),
                  ].map((row, index) => (
                    <div
                      key={`${row.type}-${row.rowNumber}-${index}`}
                      className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">
                          Row {row.rowNumber}:{" "}
                          {row.name || "Unnamed customer"}
                        </p>

                        <p className="mt-1 break-words text-[11px] leading-5 text-slate-500">
                          {row.reason}
                        </p>
                      </div>

                      <span
                        className={`self-start rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          row.type === "Skipped"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {row.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Result actions */}
            <div className="flex flex-col gap-2 border-t border-slate-100 p-3.5 sm:flex-row sm:justify-between sm:p-5">
              <button
                type="button"
                onClick={() => navigate("/customers")}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-900 sm:w-auto"
              >
                <Users size={17} />
                Back to Customers
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={clearFile}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                <RefreshCw size={16} />
                Import Another File
              </button>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="flex flex-wrap items-center justify-center gap-2 pb-3 pt-1 text-center text-[10px] font-medium text-slate-400 sm:text-xs">
          <ShieldCheck size={14} className="text-teal-600" />
          <span>Amrit Jal</span>
          <span>·</span>
          <span>Customer Records Management</span>
        </footer>
      </div>
    </main>
  );
}
