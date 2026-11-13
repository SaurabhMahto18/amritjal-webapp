import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Currency formatter
export const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

// Date formatter
export const dateText = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// Main page layout
export function PageShell({
  eyebrow = "AMRIT JAL · SUBSCRIPTION",
  title,
  subtitle,
  children,
}) {
  return (
    <main className="min-h-screen bg-[#F7F6F0] px-4 py-8 text-[#24262B] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#8A7620]">
            {eyebrow}
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#686961] sm:text-base">
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </main>
  );
}

// White content card
export function Panel({ children, className = "" }) {
  return (
    <section
      className={`rounded-3xl border border-[#EDEAE0] bg-white p-5 shadow-sm sm:p-7 ${className}`}
    >
      {children}
    </section>
  );
}

// Success, error and information messages
export function Notice({ type = "info", children }) {
  const styles =
    type === "error"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : type === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-[#E9CA43]/50 bg-[#E9CA43]/10 text-[#665711]";

  return (
    <div
      role="status"
      className={`rounded-xl border px-4 py-3 text-sm ${styles}`}
    >
      {children}
    </div>
  );
}

// Form field wrapper
export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#41423D]">
        {label}
      </span>

      {children}

      {hint && (
        <span className="mt-1.5 block text-xs text-[#85857D]">
          {hint}
        </span>
      )}
    </label>
  );
}

// Common input styling
export const inputClass =
  "w-full rounded-xl border border-[#E5E2D8] bg-white px-4 py-3 text-sm text-[#24262B] outline-none transition placeholder:text-[#A2A197] focus:border-[#C7A92F] focus:ring-4 focus:ring-[#E9CA43]/15";

// Primary button
export function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-[#24262B] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#3B3D42] disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ""}`}
    >
      {children}
    </button>
  );
}

// Secondary link button
export function SecondaryLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center rounded-xl border border-[#E5E2D8] bg-white px-4 py-2.5 text-sm font-bold text-[#343630] transition hover:bg-[#F7F6F0]"
    >
      {children}
    </Link>
  );
}

// Payment / subscription status badge
export function StatusPill({ status }) {
  const key = String(status || "unknown").toLowerCase();

  const styles =
    key === "successful" || key === "active"
      ? "bg-emerald-100 text-emerald-800"
      : key === "pending"
        ? "bg-amber-100 text-amber-800"
        : key === "rejected" ||
            key === "failed" ||
            key === "expired"
          ? "bg-rose-100 text-rose-800"
          : "bg-stone-100 text-stone-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${styles}`}
    >
      {key.replaceAll("_", " ")}
    </span>
  );
}

// Reusable async data hook
export function useAsync(load, deps = []) {
  const [state, setState] = useState({
    loading: true,
    error: "",
    data: null,
  });

  useEffect(() => {
    let live = true;

    setState((s) => ({
      ...s,
      loading: true,
      error: "",
    }));

    Promise.resolve()
      .then(load)
      .then(
        (data) =>
          live &&
          setState({
            loading: false,
            error: "",
            data,
          }),
        (error) =>
          live &&
          setState({
            loading: false,
            error: error?.message || "Something went wrong.",
            data: null,
          })
      );

    return () => {
      live = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}