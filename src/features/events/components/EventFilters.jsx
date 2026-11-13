
import { CalendarDays, Filter, X } from "lucide-react";

const statusOptions = [
  ["approved", "Approved"],
  ["pending", "Pending"],
  ["rejected", "Rejected"],
  ["in_cart", "In Cart"],
  ["payment_pending", "Payment Pending"],
];

const paymentOptions = [
  ["paid", "Paid"],
  ["unpaid", "Unpaid"],
  ["partially_paid", "Partially Paid"],
  ["pending", "Pending"],
];

const durationOptions = [
  ["future", "Future"],
  ["today", "Today"],
  ["past", "Past"],
];

// ========================================
// CHIP GROUP
// ========================================

function ChipGroup({ title, options, value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-600">
        {title}
      </p>

      <div className="flex flex-wrap gap-2">
        {options.map(([key, label]) => {
          const active = value === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(active ? "" : key)}
              aria-pressed={active}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-[#087F8C] bg-[#087F8C] text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#087F8C] hover:bg-[#DDF4F1] hover:text-[#087F8C]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ========================================
// EVENT FILTERS
// ========================================

export default function EventFilters({
  filters,
  setFilters,
  onClear,
}) {
  const set = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const activeFilterCount = [
    filters.from,
    filters.to,
    filters.status,
    filters.duration,
    filters.paymentStatus,
  ].filter(Boolean).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      {/* FILTER HEADER */}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#DDF4F1] text-[#087F8C]">
            <Filter size={18} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-[#102D3A]">
              Event Filters
            </h2>

            <p className="text-xs text-slate-400">
              Narrow down events using the options below.
            </p>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#DDF4F1] px-3 py-1 text-xs font-semibold text-[#087F8C]">
              {activeFilterCount} active
            </span>

            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <X size={15} />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* FILTER OPTIONS */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* EVENT DATE */}

        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <CalendarDays size={16} className="text-[#087F8C]" />
            Event Date
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs text-slate-400">
                From date
              </span>

              <input
                aria-label="Event date from"
                type="date"
                value={filters.from || ""}
                max={filters.to || undefined}
                onChange={(event) =>
                  set("from", event.target.value)
                }
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-[#087F8C] focus:bg-white focus:ring-4 focus:ring-[#087F8C]/10"
              />
            </label>

            <label className="min-w-0">
              <span className="mb-1.5 block text-xs text-slate-400">
                To date
              </span>

              <input
                aria-label="Event date to"
                type="date"
                value={filters.to || ""}
                min={filters.from || undefined}
                onChange={(event) =>
                  set("to", event.target.value)
                }
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-[#087F8C] focus:bg-white focus:ring-4 focus:ring-[#087F8C]/10"
              />
            </label>
          </div>
        </div>

        {/* EVENT STATUS */}

        <ChipGroup
          title="Event Status"
          options={statusOptions}
          value={filters.status}
          onChange={(value) => set("status", value)}
        />

        {/* DURATION */}

        <ChipGroup
          title="Duration Status"
          options={durationOptions}
          value={filters.duration}
          onChange={(value) => set("duration", value)}
        />

        {/* PAYMENT STATUS */}

        <ChipGroup
          title="Payment Status"
          options={paymentOptions}
          value={filters.paymentStatus}
          onChange={(value) => set("paymentStatus", value)}
        />
      </div>
    </section>
  );
}
