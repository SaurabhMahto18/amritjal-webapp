import { useMemo, useState } from "react";
import { Search, RefreshCw, AlertCircle, CheckCircle2, Info } from "lucide-react";

export function Panel({ title, subtitle, action, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      {(title || action) && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h3 className="font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Metric({ label, value, hint, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {Icon && <Icon size={17} className="text-cyan-700" />}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search records..." }) {
  return (
    <label className="relative block w-full sm:max-w-xs">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  );
}

export function StatusPill({ value }) {
  const key = String(value || "unknown").toLowerCase();
  const styles = {
    present: "bg-emerald-50 text-emerald-700",
    approved: "bg-emerald-50 text-emerald-700",
    paid: "bg-emerald-50 text-emerald-700",
    active: "bg-emerald-50 text-emerald-700",
    absent: "bg-rose-50 text-rose-700",
    rejected: "bg-rose-50 text-rose-700",
    damaged: "bg-rose-50 text-rose-700",
    half_day: "bg-amber-50 text-amber-700",
    pending: "bg-amber-50 text-amber-700",
    leave: "bg-violet-50 text-violet-700",
    weekly_off: "bg-slate-100 text-slate-600",
    holiday: "bg-sky-50 text-sky-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[key] || "bg-slate-100 text-slate-600"}`}>
      {key.replaceAll("_", " ")}
    </span>
  );
}

export function Notice({ type = "info", children }) {
  const Icon = type === "error" ? AlertCircle : type === "success" ? CheckCircle2 : Info;
  const style = type === "error" ? "bg-rose-50 text-rose-700" : type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700";
  return <div className={`flex items-start gap-2 rounded-xl p-3 text-sm ${style}`}><Icon size={17} className="mt-0.5 shrink-0" />{children}</div>;
}

export function LoadingButton({ busy, children, ...props }) {
  return (
    <button {...props} disabled={busy || props.disabled} className={`inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60 ${props.className || ""}`}>
      {busy && <RefreshCw size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Empty({ children = "No records found." }) {
  return <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">{children}</div>;
}

export function useFilter(rows, fields) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => fields.some((field) => String(row?.[field] ?? "").toLowerCase().includes(q)));
  }, [rows, query, fields]);
  return { query, setQuery, filtered };
}

export function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
}

export function dateLabel(value) {
  if (!value) return "—";
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function ErrorText({ error }) {
  return error ? <Notice type="error">{error.message || String(error)}</Notice> : null;
}
