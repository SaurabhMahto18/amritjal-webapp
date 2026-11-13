import { WEEKDAYS } from "../utils/smsConstants";

export default function WeekdaySelector({
  value = [],
  onChange,
  disabled = false,
}) {
  const selected = value.map(Number);

  const toggleDay = (day) => {
    const updated = selected.includes(day)
      ? selected.filter((item) => item !== day)
      : [...selected, day].sort((a, b) => a - b);

    onChange(updated);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-slate-600">
          Select Weekdays
        </label>

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onChange(
              selected.length === 7
                ? []
                : WEEKDAYS.map((day) => day.value)
            )
          }
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {selected.length === 7 ? "Clear all" : "Select all"}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((day) => {
          const active = selected.includes(day.value);

          return (
            <button
              key={day.value}
              type="button"
              disabled={disabled}
              onClick={() => toggleDay(day.value)}
              aria-pressed={active}
              className={`flex min-h-10 items-center justify-center rounded-lg border px-1 text-[11px] font-semibold transition sm:text-xs disabled:opacity-50 ${
                active
                  ? "border-[#3976bd] bg-[#3976bd] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {day.label}
            </button>
          );
        })}
      </div>

      {!selected.length && (
        <p className="mt-2 text-xs text-rose-600">
          Select at least one weekday.
        </p>
      )}
    </div>
  );
}