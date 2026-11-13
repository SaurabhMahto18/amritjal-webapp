import { REPEAT_OPTIONS } from "../utils/smsConstants";

export default function RepeatSelector({
  value = "daily",
  onChange,
  disabled = false,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600">
        Repeat
      </label>

      <div className="grid grid-cols-3 gap-2">
        {REPEAT_OPTIONS.map((option) => {
          const active = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
                active
                  ? "border-[#3976bd] bg-blue-50 text-[#2864a8]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}