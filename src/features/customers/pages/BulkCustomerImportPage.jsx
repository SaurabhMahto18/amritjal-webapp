import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  FileJson,
  Download,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Users,
  Info,
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

// CSV reader supporting quoted commas, escaped quotes, CRLF and newlines inside quotes.
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
    throw new Error("CSV must include a Name or Customer Name column.");
  }

  const duplicateHeaders = headers.filter(
    (header, index) => header && headers.indexOf(header) !== index
  );

  if (duplicateHeaders.length > 0) {
    throw new Error(
      `CSV contains duplicate column headings: ${[...new Set(duplicateHeaders)].join(", ")}.`
    );
  }

  return rows.slice(1).map((values, index) => {
    const source = {};

    headers.forEach((header, column) => {
      if (header) source[header] = values[column] ?? "";
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
      throw new Error(`JSON customer at row ${index + 1} must be an object.`);
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
        .map(
          (value) =>
            `"${String(value).replace(/"/g, '""')}"`
        )
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

  // SEO metadata for this authenticated management page.
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

  return (
    <main className="min-h-full bg-slate-50 px-3 py-5 text-slate-800 sm:px-5 lg:px-7">
      <div className="mx-auto max-w-6xl space-y-6">

        <Link
          to="/customers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-700"
        >
          <ArrowLeft size={16} />
          Back to Customers
        </Link>

        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
            Customer Management
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Bulk Customer Import
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Import multiple customer records from a CSV or JSON file.
          </p>
        </header>

        {/* STEP 1: FILE PREPARATION */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-slate-900">
                1. Prepare your file
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                CSV and JSON formats are supported. Customer name is
                required. Customer group must match an existing group
                name or ID.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download size={16} />
              Download CSV template
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <FileSpreadsheet
                  size={18}
                  className="text-emerald-700"
                />
                CSV
              </div>

              <p className="mt-1 text-xs text-slate-500">
                First row must contain column headings.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <FileJson
                  size={18}
                  className="text-amber-700"
                />
                JSON
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Use an array of customer objects or a customers array.
              </p>
            </div>

          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={(event) => {
              event.preventDefault();
              event.stopPropagation();

              const file = event.currentTarget.files?.[0];

              console.log("FILE SELECTED:", file?.name);
              console.log("CURRENT URL:", window.location.href);

              if (file) {
                handleFile(file);
              }
            }}
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-5 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/50 px-5 py-9 text-center transition hover:border-teal-400 hover:bg-teal-50"
          >
            <Upload size={25} className="text-teal-700" />

            <span className="mt-3 text-sm font-bold text-slate-800">
              Choose CSV or JSON file
            </span>

            <span className="mt-1 text-xs text-slate-500">
              Select a file from your device
            </span>
          </button>

          {fileName && (
            <p className="mt-3 text-sm font-medium text-slate-600">
              Selected file: {fileName}
            </p>
          )}

          {parseError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
            >
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0"
              />
              {parseError}
            </div>
          )}
        </section>

        {/* STEP 2: IMPORT PREVIEW */}

        {rows.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-slate-900">
                  2. Review import preview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {rows.length} rows detected. Previewing first{" "}
                  {previewRows.length}.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                Duplicate policy: Skip
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {[
                      "Row",
                      "Customer name",
                      "Mobile",
                      "Area",
                      "Jar rate",
                      "Opening balance",
                      "Security deposit",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 font-semibold"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {previewRows.map((row) => (
                    <tr key={row._rowNumber}>
                      <td className="px-4 py-3 text-slate-400">
                        {row._rowNumber}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {row.name || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {row.phone || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {row.area || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {formatAmount(row.jarRate)}
                      </td>

                      <td className="px-4 py-3">
                        {formatAmount(row.openingBalance)}
                      </td>

                      <td className="px-4 py-3">
                        {formatAmount(row.securityDeposit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center">
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <Info size={15} />
                Existing mobile numbers are skipped; existing customer
                records are never overwritten. Security deposit is
                stored separately from opening balance.
              </p>

              <button
                type="button"
                onClick={handleImport}
                disabled={busy || !rows.length}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Upload size={17} />
                )}

                {busy
                  ? "Importing..."
                  : `Import ${rows.length} rows`}
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: IMPORT RESULT */}

        {result && (
          <section
            className={`rounded-2xl border bg-white p-5 shadow-sm ${result.blocked
              ? "border-rose-200"
              : "border-emerald-200"
              }`}
          >

            <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
              {result.blocked ? (
                <AlertCircle
                  size={21}
                  className="text-rose-600"
                />
              ) : (
                <CheckCircle2
                  size={21}
                  className="text-emerald-600"
                />
              )}

              {result.blocked ? "Import stopped" : "Import completed"}
            </div>

            {result.blocked && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-rose-600"
                  />
                  <div>
                    <h3 className="font-semibold text-rose-800">
                      Import stopped due to subscription restriction
                    </h3>

                    <p className="mt-1 text-sm text-rose-700">
                      {result.blockReason ||
                        "Your subscription does not allow adding more active customers."}
                    </p>

                    <p className="mt-2 text-xs text-rose-600">
                      {result.inserted} customer
                      {result.inserted === 1 ? "" : "s"} imported before the
                      restriction. Remaining rows were not processed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {refreshWarning && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {refreshWarning}
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-3">

              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs text-emerald-700">
                  Added
                </p>

                <p className="mt-1 text-2xl font-bold text-emerald-800">
                  {result.inserted}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-xs text-amber-700">
                  Skipped duplicates
                </p>

                <p className="mt-1 text-2xl font-bold text-amber-800">
                  {result.skipped}
                </p>
              </div>

              <div className="rounded-xl bg-rose-50 p-4">
                <p className="text-xs text-rose-700">
                  Invalid rows
                </p>

                <p className="mt-1 text-2xl font-bold text-rose-800">
                  {result.invalid}
                </p>
              </div>

            </div>

            {(result.skippedRows?.length > 0 ||
              result.invalidRows?.length > 0) && (
                <div className="mt-5 space-y-3">
                  <h3 className="font-semibold text-slate-800">
                    Rows not imported
                  </h3>

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
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-700">
                        Row {row.rowNumber}:{" "}
                        {row.name || "Unnamed customer"}
                      </span>

                      <span className="text-slate-500">
                        {row.type} — {row.reason}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            <button
              type="button"
              onClick={() => navigate("/customers")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Users size={16} />
              Back to Customers
            </button>
          </section>
        )}

      </div>
    </main>
  );
}