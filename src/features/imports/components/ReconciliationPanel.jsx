
import {
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RotateCcw,
} from "lucide-react";

export default function ReconciliationPanel({
  result,
  validation,
  onImportAgain,
}) {
  const importedCount = Number(result?.importedCount) || 0;
  const failedCount = Number(result?.failedCount) || 0;
  const skippedCount = Number(result?.skippedCount) || 0;
  const validCount = Number(validation?.validCount) || 0;

  const totalProcessed = importedCount + failedCount + skippedCount;
  const reconciliationMatches = totalProcessed === validCount;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
          <CheckCircle2 size={24} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Import Reconciliation
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review the final import counts and verify the processed records.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Valid Rows</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {validCount}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">Imported</p>
          <p className="mt-2 text-2xl font-bold text-emerald-800">
            {importedCount}
          </p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">Failed</p>
          <p className="mt-2 text-2xl font-bold text-rose-800">
            {failedCount}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">Skipped</p>
          <p className="mt-2 text-2xl font-bold text-amber-800">
            {skippedCount}
          </p>
        </div>
      </div>

      <div
        className={`mt-5 rounded-xl border p-4 ${
          reconciliationMatches
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex items-start gap-3">
          {reconciliationMatches ? (
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0 text-emerald-700"
            />
          ) : (
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-amber-700"
            />
          )}

          <div>
            <p
              className={`font-semibold ${
                reconciliationMatches
                  ? "text-emerald-900"
                  : "text-amber-900"
              }`}
            >
              {reconciliationMatches
                ? "Reconciliation counts match"
                : "Reconciliation needs review"}
            </p>

            <p
              className={`mt-1 text-sm ${
                reconciliationMatches
                  ? "text-emerald-800"
                  : "text-amber-800"
              }`}
            >
              {reconciliationMatches
                ? "Imported, failed, and skipped rows add up to the valid rows submitted for processing."
                : `Expected ${validCount} valid rows, but the result accounts for ${totalProcessed}. Review the import result before proceeding.`}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onImportAgain}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800"
      >
        <RotateCcw size={16} />
        Start Another Import
      </button>
    </section>
  );
}
