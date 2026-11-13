import {
  END_OF_MONTH,
  MONTH_DATES,
} from "../utils/smsConstants";

export default function MonthlyDateSelector({
  value = [],
  endOfMonth = false,
  onChange,
  onEndOfMonthChange,
  disabled = false,
}) {
  const selected = value.map(Number);

  const toggleDate = (day) => {
    const updated = selected.includes(day)
      ? selected.filter((item) => item !== day)
      : [...selected, day].sort((a, b) => a - b);

    onChange(updated);
  };

  const toggleAll = () => {
    onChange(
      selected.length === 31
        ? []
        : [...MONTH_DATES]
    );
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-slate-600">
          Select Monthly Dates
        </label>

        <button
          type="button"
          disabled={disabled}
          onClick={toggleAll}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {selected.length === 31 ? "Clear all" : "Select all"}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-8 lg:grid-cols-11">
        {MONTH_DATES.map((day) => {
          const active = selected.includes(day);

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => toggleDate(day)}
              aria-pressed={active}
              className={`flex aspect-square items-center justify-center rounded-lg border text-xs font-medium transition disabled:opacity-50 ${
                active
                  ? "border-[#3976bd] bg-[#3976bd] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5">
        <input
          type="checkbox"
          checked={endOfMonth}
          disabled={disabled}
          onChange={(e) =>
            onEndOfMonthChange(e.target.checked)
          }
          className="size-4 accent-[#3976bd]"
        />

        <span className="text-sm font-medium text-slate-700">
          {END_OF_MONTH === "end_of_month"
            ? "End of month"
            : END_OF_MONTH}
        </span>
      </label>

      {!selected.length && !endOfMonth && (
        <p className="mt-2 text-xs text-rose-600">
          Select at least one date or End of month.
        </p>
      )}
    </div>
  );
}