import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function NotificationAccordion({
  title,
  children,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50"
      >
        <span className="text-sm font-semibold text-slate-800">
          {title}
        </span>

        {open ? (
          <ChevronDown
            size={18}
            className="shrink-0 text-slate-500"
          />
        ) : (
          <ChevronRight
            size={18}
            className="shrink-0 text-slate-500"
          />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4">
          {children}
        </div>
      )}
    </section>
  );
}