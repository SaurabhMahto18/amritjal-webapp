import { ChevronRight, UserRound } from "lucide-react";

export default function CustomerListItem({
  customer,
  selected = false,
  onClick,
}) {
  const name =
    customer.name ||
    customer.customer_name ||
    "Unnamed Customer";

  const mobile =
    customer.phone ||
    customer.mobile ||
    customer.mobile_number ||
    "";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
        selected
          ? "border-blue-300 bg-blue-50"
          : "border-transparent bg-white hover:bg-slate-50"
      }`}
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
          selected
            ? "bg-white text-blue-600"
            : "bg-slate-100 text-blue-600"
        }`}
      >
        <UserRound size={21} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-800">
          {name}
        </span>

        {mobile && (
          <span className="mt-0.5 block truncate text-xs text-slate-400">
            {mobile}
          </span>
        )}
      </span>

      <ChevronRight
        size={20}
        className={`shrink-0 ${
          selected ? "text-blue-600" : "text-slate-400"
        }`}
      />
    </button>
  );
}