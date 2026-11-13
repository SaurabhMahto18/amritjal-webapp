
import { Info } from "lucide-react";

export default function CustomerDetailContent({
  activeMenuItem,
  customerName = "",
  children,
}) {
  const SectionIcon = activeMenuItem?.icon || Info;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <SectionIcon size={20} />
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              {activeMenuItem?.name || "Customer Details"}
            </h2>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              {activeMenuItem?.description ||
                "Manage customer information."}
            </p>
          </div>
        </div>

        {customerName && (
          <span className="max-w-full self-start truncate rounded-full bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 sm:self-center">
            {customerName}
          </span>
        )}
      </div>

      {/* Active Section Content */}
      <div className="min-h-[300px] p-4 sm:min-h-[420px] sm:p-6">
        {children}
      </div>
    </section>
  );
}
