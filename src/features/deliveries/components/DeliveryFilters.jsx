
import { Search, RotateCcw } from "lucide-react";

export default function DeliveryFilters({
  search = "",
  onSearchChange,
  date = "",
  onDateChange,
  onReset,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 md:flex-row">
      <div className="relative flex-1">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Search customer or notes..."
          aria-label="Search deliveries"
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <input
        type="date"
        value={date}
        onChange={(event) => onDateChange?.(event.target.value)}
        aria-label="Filter by delivery date"
        className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
      />

      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
      >
        <RotateCcw size={16} />
        Reset
      </button>
    </div>
  );
}
