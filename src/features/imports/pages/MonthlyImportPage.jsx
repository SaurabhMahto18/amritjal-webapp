
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
} from "lucide-react";

import FileUploadStep from "../components/FileUploadStep";
import ColumnMappingStep from "../components/ColumnMappingStep";
import ImportPreviewTable from "../components/ImportPreviewTable";
import ImportErrorReport from "../components/ImportErrorReport";
import ReconciliationPanel from "../components/ReconciliationPanel";

import { parseCsvFile } from "../services/csvParser";
import { parseExcelFile } from "../services/xlsxParser";
import {
  suggestMapping,
  validateImportRows,
} from "../services/importValidation";
import { importService } from "../services/importService";

const STEPS = [
  "Upload File",
  "Map Columns",
  "Preview Data",
  "Import Results",
];

export default function MonthlyImportPage() {
  const [step, setStep] = useState(0);
  const [fileData, setFileData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [mapping, setMapping] = useState({});
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validation = useMemo(() => {
    if (!fileData || step < 2) return null;

    return validateImportRows(
      fileData.rows,
      mapping,
      customers
    );
  }, [fileData, mapping, customers, step]);

  async function handleFileParsed(file) {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    setResult(null);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();

      let parsedFile;

      if (extension === "csv") {
        parsedFile = await parseCsvFile(file);
      } else if (["xlsx", "xls"].includes(extension)) {
        parsedFile = await parseExcelFile(file);
      } else {
        throw new Error(
          "Unsupported file format. Please select a CSV or Excel file."
        );
      }

      const customerList = await importService.getImportCustomers();

      if (!customerList.length) {
        throw new Error(
          "No active customers found. Add customers before importing deliveries."
        );
      }

      setFileData(parsedFile);
      setCustomers(customerList);
      setMapping(suggestMapping(parsedFile.headers));
      setStep(1);
    } catch (err) {
      setError(err?.message || "Unable to process the selected file.");
    } finally {
      setLoading(false);
    }
  }

  function handleMappingChange(field, header) {
    setMapping((previous) => ({
      ...previous,
      [field]: header || "",
    }));
  }

  async function handleImport() {
    if (!validation || validation.validCount === 0) {
      setError("There are no valid rows to import.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const validRecords = validation.rows
        .filter((row) => row.valid)
        .map((row) => {
          const customer = customers.find(
            (item) => item.id === row.record.customerId
          );

          return {
            ...row.record,
            customerJarRate: customer?.jar_rate,
          };
        });

      const importResult =
        await importService.importDeliveryRows(validRecords);

      setResult({
        importedCount: importResult.importedCount,
        failedCount: 0,
        skippedCount: validation.errorCount,
      });

      setSuccessMessage(
        `${importResult.importedCount} delivery record(s) imported successfully.`
      );

      setStep(3);
    } catch (err) {
      setError(
        err?.message ||
          "Import failed. Check your database configuration and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleImportAgain() {
    setStep(0);
    setFileData(null);
    setCustomers([]);
    setMapping({});
    setResult(null);
    setError("");
    setSuccessMessage("");
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 py-10 px-10 pb-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-100 p-3 text-cyan-800">
            <FileSpreadsheet size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Monthly Import
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Import delivery records from CSV or Excel files.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STEPS.map((label, index) => {
            const completed = index < step;
            const active = index === step;

            return (
              <div
                key={label}
                className={`rounded-xl border p-3 ${
                  active
                    ? "border-cyan-600 bg-cyan-50"
                    : completed
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  {completed ? (
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-emerald-700"
                    />
                  ) : (
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        active
                          ? "bg-cyan-700 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                  )}

                  <span
                    className={`text-sm font-semibold ${
                      active
                        ? "text-cyan-900"
                        : completed
                          ? "text-emerald-900"
                          : "text-slate-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-cyan-800">
          <LoaderCircle size={18} className="animate-spin" />
          <span>Processing. Please wait...</span>
        </div>
      )}

      {step === 0 && (
        <FileUploadStep onFileParsed={handleFileParsed} />
      )}

      {step === 1 && fileData && (
        <ColumnMappingStep
          headers={fileData.headers}
          mapping={mapping}
          onChange={handleMappingChange}
          onBack={() => setStep(0)}
          onContinue={() => {
            setError("");
            setStep(2);
          }}
        />
      )}

      {step === 2 && validation && (
        <div className="space-y-6">
          <ImportPreviewTable
            validation={validation}
            onBack={() => {
              setError("");
              setStep(1);
            }}
            onContinue={handleImport}
            isImporting={loading}
          />

          <ImportErrorReport validation={validation} />
        </div>
      )}

      {step === 3 && result && (
        <ReconciliationPanel
          result={result}
          validation={validation}
          onImportAgain={handleImportAgain}
        />
      )}
    </div>
  );
}
