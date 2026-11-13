
import { AlertCircle, CheckCircle2, CircleAlert, FileSpreadsheet } from "lucide-react";

export default function ImportPreviewTable({
  validation,
  onBack,
  onContinue,
  isImporting = false,
}) {
  const rows = validation?.rows || [];
  const validCount = validation?.validCount || 0;
  const errorCount = validation?.errorCount || 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
          <FileSpreadsheet size={23} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Preview Import Data
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review the parsed records and fix validation errors before
            importing.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Rows</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {rows.length}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">Valid Rows</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">
            {validCount}
          </p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">Rows with Errors</p>
          <p className="mt-1 text-2xl font-bold text-rose-800">
            {errorCount}
          </p>
        </div>
      </div>

      {errorCount > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>
            Some rows contain errors. Review them before importing. Only valid
            rows should be sent to the database.
          </p>
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[850px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">File Row</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Delivery Date</th>
              <th className="px-4 py-3">Jar Quantity</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  No rows available to preview.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const record = row.record || {};
                const quantity = Number(record.jarQuantity) || 0;
                const rate =
                  record.jarRate === null || record.jarRate === undefined
                    ? null
                    : Number(record.jarRate);
                const amount =
                  rate !== null && Number.isFinite(rate)
                    ? quantity * rate
                    : null;

                return (
                  <tr
                    key={row.rowNumber}
                    className={row.valid ? "bg-white" : "bg-rose-50/50"}
                  >
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {row.rowNumber}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">
                        {record.customerName || "—"}
                      </p>
                      {record.customerId && (
                        <p className="mt-1 text-xs text-slate-400">
                          Customer matched
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {record.deliveryDate || "—"}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {record.jarQuantity ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {rate !== null && Number.isFinite(rate)
                        ? `₹${rate.toFixed(2)}`
                        : "—"}
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-800">
                      {amount !== null ? `₹${amount.toFixed(2)}` : "—"}
                    </td>

                    <td className="px-4 py-3">
                      {row.valid ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 size={14} />
                          Valid
                        </span>
                      ) : (
                        <span
                          title={(row.messages || []).join("\n")}
                          className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700"
                        >
                          <CircleAlert size={14} />
                          Error
                        </span>
                      )}

                      {!row.valid && row.messages?.length > 0 && (
                        <p className="mt-2 max-w-xs whitespace-normal text-xs leading-5 text-rose-700">
                          {row.messages.join(" ")}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5">
        <button
          type="button"
          onClick={onBack}
          disabled={isImporting}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Back to Mapping
        </button>

        <button
          type="button"
          onClick={onContinue}
          disabled={validCount === 0 || isImporting}
          className="rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isImporting ? "Importing..." : `Continue with ${validCount} Valid Rows`}
        </button>
      </div>
    </section>
  );
}
