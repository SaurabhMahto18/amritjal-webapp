
import { useEffect, useState } from "react";
import {
  Search,
  CalendarDays,
  SlidersHorizontal,
  RotateCcw,
  X,
} from "lucide-react";

const DEFAULT_FILTERS = {
  search: "",
  type: "all",
  fromDate: "",
  toDate: "",
};

const TRANSACTION_TYPES = [
  { value: "all", label: "All Transactions" },
  { value: "debit", label: "Debit" },
  { value: "credit", label: "Credit" },
  { value: "delivery", label: "Delivery" },
  { value: "payment", label: "Payment" },
  { value: "adjustment", label: "Adjustment" },
];

export default function LedgerFilters({
  filters = DEFAULT_FILTERS,
  onChange,
  onReset,
  resultCount,
  loading = false,
}) {
  const [localFilters, setLocalFilters] = useState({
    ...DEFAULT_FILTERS,
    ...filters,
  });

  useEffect(() => {
    setLocalFilters({
      ...DEFAULT_FILTERS,
      ...filters,
    });
  }, [
    filters.search,
    filters.type,
    filters.fromDate,
    filters.toDate,
  ]);

  const hasActiveFilters =
    Boolean(localFilters.search.trim()) ||
    localFilters.type !== "all" ||
    Boolean(localFilters.fromDate) ||
    Boolean(localFilters.toDate);

  const invalidDateRange =
    localFilters.fromDate &&
    localFilters.toDate &&
    localFilters.fromDate > localFilters.toDate;

  function updateFilter(name, value) {
    const nextFilters = {
      ...localFilters,
      [name]: value,
    };

    setLocalFilters(nextFilters);
    onChange?.(nextFilters);
  }

  function resetFilters() {
    const reset = { ...DEFAULT_FILTERS };

    setLocalFilters(reset);

    if (onReset) {
      onReset();
    } else {
      onChange?.(reset);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <SlidersHorizontal size={19} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Filter Transactions
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Search by keyword, transaction type or date.
            </p>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-teal-50 hover:text-teal-800 sm:self-auto"
          >
            <RotateCcw size={15} />
            Reset Filters
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label
            htmlFor="ledger-search"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Search
          </label>

          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="ledger-search"
              type="search"
              value={localFilters.search}
              onChange={(event) =>
                updateFilter("search", event.target.value)
              }
              placeholder="Description or reference..."
              disabled={loading}
              className="min-h-11 w-full rounded-xl border border-slate-200 py-2 pl-10 pr-9 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:bg-slate-50"
            />

            {localFilters.search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => updateFilter("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="ledger-type"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Transaction Type
          </label>

          <select
            id="ledger-type"
            value={localFilters.type}
            onChange={(event) =>
              updateFilter("type", event.target.value)
            }
            disabled={loading}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:bg-slate-50"
          >
            {TRANSACTION_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="ledger-from-date"
            className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"
          >
            <CalendarDays size={15} className="text-slate-400" />
            From Date
          </label>

          <input
            id="ledger-from-date"
            type="date"
            value={localFilters.fromDate}
            max={localFilters.toDate || undefined}
            onChange={(event) =>
              updateFilter("fromDate", event.target.value)
            }
            disabled={loading}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:bg-slate-50"
          />
        </div>

        <div>
          <label
            htmlFor="ledger-to-date"
            className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"
          >
            <CalendarDays size={15} className="text-slate-400" />
            To Date
          </label>

          <input
            id="ledger-to-date"
            type="date"
            value={localFilters.toDate}
            min={localFilters.fromDate || undefined}
            onChange={(event) =>
              updateFilter("toDate", event.target.value)
            }
            disabled={loading}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:bg-slate-50"
          />
        </div>
      </div>

      {invalidDateRange && (
        <p role="alert" className="mt-3 text-sm font-medium text-rose-600">
          The end date must be on or after the start date.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          {loading
            ? "Updating transactions..."
            : typeof resultCount === "number"
              ? `${resultCount} transaction${resultCount === 1 ? "" : "s"} found`
              : "Filters are ready"}
        </p>

        {hasActiveFilters && (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            Filters applied
          </span>
        )}
      </div>
    </section>
  );
}
