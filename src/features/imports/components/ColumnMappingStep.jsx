
import { ArrowLeft, ArrowRight, Columns3 } from "lucide-react";
import { FIELD_OPTIONS } from "../services/importValidation";

const IDENTITY_FIELDS = [
  "customer_code",
  "customer_phone",
  "customer_name",
];

export default function ColumnMappingStep({
  headers = [],
  mapping = {},
  onChange,
  onBack,
  onContinue,
}) {
  const hasCustomerIdentifier = IDENTITY_FIELDS.some(
    (field) => Boolean(mapping[field])
  );

  const canContinue =
    Boolean(mapping.delivery_date) &&
    Boolean(mapping.jar_quantity) &&
    hasCustomerIdentifier;

  // A single source column should not accidentally map to multiple fields.
  const getAvailableHeaders = (fieldValue) => {
    const usedHeaders = Object.entries(mapping)
      .filter(([field, header]) => field !== fieldValue && header)
      .map(([, header]) => header);

    return headers.filter(
      (header) =>
        !usedHeaders.includes(header) || header === mapping[fieldValue]
    );
  };

  function handleChange(field, header) {
    onChange(field, header);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
          <Columns3 size={23} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Map your file columns
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Match the columns from your file with the corresponding Amrit Jal
            fields. Check every selection before continuing.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <strong>Required:</strong> Customer Code, Phone, or Name; Delivery
        Date; and Jar Quantity.
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {FIELD_OPTIONS.map((field) => {
          const isRequired =
            field.value === "delivery_date" ||
            field.value === "jar_quantity";

          const availableHeaders = getAvailableHeaders(field.value);

          return (
            <label key={field.value} className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                {field.label}
                {isRequired ? (
                  <span className="ml-1 text-rose-600">*</span>
                ) : (
                  <span className="ml-1 font-normal text-slate-400">
                    Optional
                  </span>
                )}
              </span>

              <select
                value={mapping[field.value] || ""}
                onChange={(event) =>
                  handleChange(field.value, event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
              >
                <option value="">— Select source column —</option>

                {availableHeaders.map((header, index) => (
                  <option key={`${header}-${index}`} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>

      {!hasCustomerIdentifier && (
        <p className="mt-4 text-sm text-rose-700">
          Select at least one customer identifier to continue.
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Preview Rows
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}
