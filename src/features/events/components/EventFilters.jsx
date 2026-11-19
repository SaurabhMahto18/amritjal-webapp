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

function ChipGroup({ title, options, value, onChange }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs font-semibold text-slate-600 sm:mb-2 sm:text-sm">
        {title}
      </p>

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {options.map(([key, label]) => {
          const active = value === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(active ? "" : key)}
              aria-pressed={active}
              className={`min-h-8 rounded-full border px-3 py-1.5 text-[11px] font-medium leading-4 transition sm:min-h-9 sm:px-4 sm:py-2 sm:text-sm ${
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

export default function EventFilters({ filters, setFilters, onClear }) {
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
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5">
      {/* Compact filter header */}
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-5 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#DDF4F1] text-[#087F8C] sm:size-9 sm:rounded-xl">
            <Filter size={16} className="sm:hidden" />
            <Filter size={18} className="hidden sm:block" />
          </div>

          <div className="min-w-0">
            <h2 className="text-xs font-bold leading-4 text-[#102D3A] sm:text-sm">
              Event Filters
            </h2>
            <p className="hidden text-xs text-slate-400 sm:block">
              Narrow down events using the options below.
            </p>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <span className="rounded-full bg-[#DDF4F1] px-2 py-1 text-[10px] font-semibold text-[#087F8C] sm:px-3 sm:text-xs">
              {activeFilterCount} active
            </span>

            <button
              type="button"
              onClick={onClear}
              className="inline-flex min-h-7 items-center gap-1 rounded-lg px-1.5 text-[10px] font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 sm:min-h-9 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm"
            >
              <X size={13} className="sm:size-[15px]" />
              Clear
              <span className="hidden sm:inline">filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter options */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 sm:mb-2 sm:gap-2 sm:text-sm">
            <CalendarDays size={14} className="text-[#087F8C] sm:size-4" />
            Event Date
          </p>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <label className="min-w-0">
              <span className="mb-1 block text-[10px] text-slate-400 sm:mb-1.5 sm:text-xs">
                From date
              </span>
              <input
                aria-label="Event date from"
                type="date"
                value={filters.from || ""}
                max={filters.to || undefined}
                onChange={(event) => set("from", event.target.value)}
                className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] text-slate-700 outline-none transition focus:border-[#087F8C] focus:bg-white focus:ring-2 focus:ring-[#087F8C]/10 sm:h-auto sm:rounded-xl sm:px-3 sm:py-3 sm:text-sm sm:focus:ring-4"
              />
            </label>

            <label className="min-w-0">
              <span className="mb-1 block text-[10px] text-slate-400 sm:mb-1.5 sm:text-xs">
                To date
              </span>
              <input
                aria-label="Event date to"
                type="date"
                value={filters.to || ""}
                min={filters.from || undefined}
                onChange={(event) => set("to", event.target.value)}
                className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] text-slate-700 outline-none transition focus:border-[#087F8C] focus:bg-white focus:ring-2 focus:ring-[#087F8C]/10 sm:h-auto sm:rounded-xl sm:px-3 sm:py-3 sm:text-sm sm:focus:ring-4"
              />
            </label>
          </div>
        </div>

        <ChipGroup
          title="Event Status"
          options={statusOptions}
          value={filters.status}
          onChange={(value) => set("status", value)}
        />

        <ChipGroup
          title="Duration Status"
          options={durationOptions}
          value={filters.duration}
          onChange={(value) => set("duration", value)}
        />

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
