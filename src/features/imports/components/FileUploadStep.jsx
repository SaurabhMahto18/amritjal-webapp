
import { useRef, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  UploadCloud,
  AlertCircle,
} from "lucide-react";

export default function FileUploadStep({
  onFileParsed,
  busy = false,
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  async function handleFile(file) {
    setError("");

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["csv", "xlsx", "xls"].includes(extension)) {
      setError("Please select a CSV or Excel file (.csv, .xlsx, .xls).");
      return;
    }

    if (file.size === 0) {
      setError("The selected file is empty.");
      return;
    }

    // Prevent accidental browser memory exhaustion.
    if (file.size > 15 * 1024 * 1024) {
      setError("File size must be 15 MB or less.");
      return;
    }

    try {
      await onFileParsed(file);
    } catch (err) {
      setError(err?.message || "Unable to read this file.");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
          <UploadCloud size={32} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-900">
          Import delivery records
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Upload a CSV or Excel file containing customer details, delivery
          dates, and jar quantities. You will review the data before importing.
        </p>

        <div className="mt-5 grid w-full max-w-md grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Excel</p>
              <p className="text-xs text-slate-500">.xlsx, .xls</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <FileText size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">CSV</p>
              <p className="text-xs text-slate-500">.csv</p>
            </div>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            void handleFile(file);

            // Allow selecting the same file again.
            event.target.value = "";
          }}
        />

        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UploadCloud size={18} />
          {busy ? "Reading file..." : "Choose CSV / Excel File"}
        </button>

        <p className="mt-3 text-xs text-slate-400">
          Maximum file size: 15 MB
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 flex w-full items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-left text-sm text-rose-800"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </section>
  );
}
