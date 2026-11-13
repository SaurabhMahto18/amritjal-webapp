
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Activity,
  Download,
  Search,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  User,
  CheckCircle2,
} from "lucide-react";

import { employeeService } from "../services/employeeService";

import {
  Empty,
  ErrorText,
  Metric,
  Panel,
  SearchBox,
  dateLabel,
  useFilter,
} from "./shared";

// CSV export
function downloadCSV(rows) {
  const columns = [
    "created_at",
    "action",
    "description",
    "actor_user_id",
  ];

  const escapeCSV = (value) => {
    let text = String(value ?? "");

    // Protect spreadsheet users from CSV formula injection
    if (/^[=+\-@\t\r]/.test(text)) {
      text = `'${text}`;
    }

    return `"${text.replaceAll('"', '""')}"`;
  };

  const csv = [
    columns.join(","),
    ...rows.map((row) =>
      columns.map((key) => escapeCSV(row[key])).join(",")
    ),
  ].join("\r\n");

  // UTF-8 BOM for Excel compatibility
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "employee-activity.csv";

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getActionLabel(action) {
  return String(action || "activity")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getActionColor(action) {
  const value = String(action || "").toLowerCase();

  if (
    value.includes("created") ||
    value.includes("credit") ||
    value.includes("uploaded")
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    value.includes("deleted") ||
    value.includes("debit") ||
    value.includes("removed")
  ) {
    return "bg-rose-50 text-rose-700";
  }

  if (
    value.includes("updated") ||
    value.includes("attendance")
  ) {
    return "bg-cyan-50 text-cyan-700";
  }

  if (value.includes("leave")) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EmployeeActivityTab({ employee }) {
  const [rows, setRows] = useState([]);

  const [error, setError] = useState("");
  const [period, setPeriod] = useState("all");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setError("");

      const result = await employeeService.activity(employee.id);

      setRows(result || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [employee.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Activity period filtering
  const periodRows = useMemo(() => {
    if (period === "all") return rows;

    const cutoff = new Date();

    cutoff.setDate(
      cutoff.getDate() - Number(period)
    );

    return rows.filter((row) => {
      const date = new Date(row.created_at);

      return (
        !Number.isNaN(date.getTime()) &&
        date >= cutoff
      );
    });
  }, [rows, period]);

  // Search only actual database columns
  const { query, setQuery, filtered } = useFilter(
    periodRows,
    [
      "action",
      "description",
      "actor_user_id",
      "created_at",
    ]
  );

  // Summary metrics
  const last7Days = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;

    return rows.filter(
      (row) =>
        row.created_at &&
        new Date(row.created_at).getTime() >= cutoff
    ).length;
  }, [rows]);

  const last30Days = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;

    return rows.filter(
      (row) =>
        row.created_at &&
        new Date(row.created_at).getTime() >= cutoff
    ).length;
  }, [rows]);

  return (
    <div className="space-y-5">

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

        <Metric
          label="Total activities"
          value={rows.length}
          icon={Activity}
        />

        <Metric
          label="Last 7 days"
          value={last7Days}
          icon={Clock}
        />

        <Metric
          label="Last 30 days"
          value={last30Days}
          icon={CalendarDays}
        />

      </div>

      <ErrorText error={error} />

      {/* ACTIVITY HISTORY */}
      <Panel
        title="Activity History"
        subtitle="Complete audit timeline of employee-related actions."
        action={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            title="Refresh activity"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      >

        {/* FILTER TOOLBAR */}
        <div className="mb-5 space-y-3">

          <div className="flex flex-col gap-3 sm:flex-row">

            <div className="min-w-0 flex-1">
              <SearchBox
                value={query}
                onChange={setQuery}
                placeholder="Search activities..."
              />
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen((old) => !old)}
              aria-expanded={filtersOpen}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <CalendarDays size={16} />
              Date filter

              {filtersOpen ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            <button
              type="button"
              onClick={() => downloadCSV(filtered)}
              disabled={!filtered.length}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>

          </div>

          {/* DATE FILTER DROPDOWN */}
          {filtersOpen && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">

              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                Activity period
              </p>

              <div className="flex flex-wrap gap-2">

                {[
                  ["all", "All time"],
                  ["7", "Last 7 days"],
                  ["30", "Last 30 days"],
                  ["90", "Last 90 days"],
                ].map(([value, label]) => (

                  <button
                    key={value}
                    type="button"
                    onClick={() => setPeriod(value)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      period === value
                        ? "border-cyan-700 bg-cyan-700 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {label}
                  </button>

                ))}

              </div>

            </div>
          )}

        </div>

        {/* RESULT COUNT */}
        <div className="mb-4 flex items-center justify-between gap-2 text-xs text-slate-500">

          <span>
            Showing {filtered.length} of {rows.length} activities
          </span>

          {period !== "all" && (
            <span className="rounded-lg bg-cyan-50 px-2.5 py-1 font-medium text-cyan-700">
              Last {period} days
            </span>
          )}

        </div>

        {/* TIMELINE */}
        {loading && !rows.length ? (

          <div className="py-10 text-center text-sm text-slate-500">
            Loading activity history...
          </div>

        ) : filtered.length ? (

          <div className="relative ml-2 space-y-0 border-l-2 border-slate-200 pl-5">

            {filtered.map((row, index) => (

              <article
                key={row.id || index}
                className="relative pb-5 last:pb-0"
              >

                {/* TIMELINE MARKER */}
                <span className="absolute -left-[27px] top-4 flex h-3 w-3 rounded-full border-2 border-white bg-cyan-700 ring-2 ring-cyan-100" />

                <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">

                  {/* ACTION AND DATE */}
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                    <div className="flex flex-wrap items-center gap-2">

                      <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${getActionColor(row.action)}`}>
                        {getActionLabel(row.action)}
                      </span>

                      {row.id && (
                        <span className="text-xs text-slate-400">
                          Activity #{String(row.id).slice(0, 8)}
                        </span>
                      )}

                    </div>

                    <time className="text-xs text-slate-500">
                      {formatDateTime(row.created_at)}
                    </time>

                  </div>

                  {/* DESCRIPTION */}
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {row.description || "Employee record updated."}
                  </p>

                  {/* ACTOR */}
                  {row.actor_user_id && (
                    <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">

                      <User
                        size={14}
                        className="text-slate-400"
                      />

                      <span className="text-xs text-slate-500">
                        Actor ID:
                      </span>

                      <span className="break-all text-xs font-medium text-slate-600">
                        {row.actor_user_id}
                      </span>

                    </div>
                  )}

                </div>

              </article>

            ))}

          </div>

        ) : (

          <Empty>
            No activity found for the selected filter.
          </Empty>

        )}

      </Panel>

    </div>
  );
}
