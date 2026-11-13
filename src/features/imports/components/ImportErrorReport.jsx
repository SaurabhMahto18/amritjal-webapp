
import { AlertTriangle, Download, FileWarning } from "lucide-react";

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function ImportErrorReport({ validation }) {
  const errorRows = (validation?.rows || []).filter(
    (row) => !row.valid
  );

  function downloadReport() {
    if (errorRows.length === 0) return;

    const csvRows = [
      ["File Row", "Customer", "Delivery Date", "Jar Quantity", "Errors"],
      ...errorRows.map((row) => {
        const record = row.record || {};

        return [
          row.rowNumber,
          record.customerName || "",
          record.deliveryDate || "",
          record.jarQuantity ?? "",
          (row.messages || []).join("; "),
        ];
      }),
    ];

    const csvContent = csvRows
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `import-errors-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-rose-50 p-3 text-rose-700">
            <FileWarning size={23} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Import Error Report
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review the rows that failed validation before importing.
            </p>
          </div>
        </div>

        {errorRows.length > 0 && (
          <button
            type="button"
            onClick={downloadReport}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download size={16} />
            Download CSV
          </button>
        )}
      </div>

      {errorRows.length === 0 ? (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
          No validation errors found. All available rows are valid.
        </div>
      ) : (
        <>
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle size={18} className="shrink-0" />
            <span>
              {errorRows.length} row(s) need correction. These rows should not
              be included in the import.
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {errorRows.map((row) => (
              <article
                key={row.rowNumber}
                className="rounded-xl border border-rose-200 bg-rose-50/50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">
                    File Row {row.rowNumber}
                  </h3>

                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    Needs correction
                  </span>
                </div>

                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-rose-800">
                  {(row.messages || ["Unknown validation error"]).map(
                    (message, index) => (
                      <li key={`${row.rowNumber}-${index}`}>{message}</li>
                    )
                  )}
                </ul>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
