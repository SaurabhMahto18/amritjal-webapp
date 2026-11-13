
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  Search,
  RefreshCw,
  PlusCircle,
  Pencil,
  Trash2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Loader2,
  ShieldCheck,
  Building2,
  CreditCard,
  Settings,
  AlertCircle,
} from "lucide-react";

import { adminActivityService } from "../services/adminActivityService";

const TABLE_LABELS = {
  businesses: "Businesses",
  business_subscriptions: "Subscriptions",
  platform_subscription_payments: "Subscription Payments",
  business_subscription_renewals: "Renewals",
  business_access_controls: "Business Access",
  subscription_plans: "Subscription Plans",
};

const TABLE_ICONS = {
  businesses: Building2,
  business_subscriptions: CreditCard,
  platform_subscription_payments: CreditCard,
  business_subscription_renewals: RefreshCw,
  business_access_controls: ShieldCheck,
  subscription_plans: Settings,
};

const ACTION_STYLES = {
  INSERT: "bg-emerald-50 text-emerald-700",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-red-50 text-red-700",
};

const ACTION_ICONS = {
  INSERT: PlusCircle,
  UPDATE: Pencil,
  DELETE: Trash2,
};

const SECRET_KEY_PATTERN =
  /password|secret|token|authorization|api[_-]?key|access[_-]?key|private[_-]?key|refresh[_-]?token/i;

function redactSensitiveData(value) {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveData);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SECRET_KEY_PATTERN.test(key)
        ? "[REDACTED]"
        : redactSensitiveData(item),
    ])
  );
}

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const prettyJson = (value) => {
  if (!value) return "No data available";

  return JSON.stringify(redactSensitiveData(value), null, 2);
};

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-4 text-3xl font-bold text-slate-900">
        {Number(value || 0).toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function ActionBadge({ action }) {
  const Icon = ACTION_ICONS[action] || Activity;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        ACTION_STYLES[action] || "bg-slate-100 text-slate-600"
      }`}
    >
      <Icon size={13} />
      {action}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-1 break-all text-sm font-medium text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);

  const [summary, setSummary] = useState({
    total: 0,
    today: 0,
    inserts: 0,
    updates: 0,
    deletes: 0,
  });

  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const requestIdRef = useRef(0);

  const tableOptions = useMemo(
    () => Object.entries(TABLE_LABELS),
    []
  );

  // Debounce search to reduce database requests.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  // Reset pagination whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [actionFilter, tableFilter, startDate, endDate]);

  const loadLogs = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError("");

      const result = await adminActivityService.getLogs({
        page,
        search: debouncedSearch,
        action: actionFilter,
        tableName: tableFilter,
        startDate,
        endDate,
      });

      // Ignore stale responses from previous filters/pages.
      if (requestId !== requestIdRef.current) return;

      setLogs(result.logs);
      setTotal(result.total);
      setTotalPages(result.totalPages);

      // If records were removed and current page no longer exists,
      // return to the last valid page.
      if (result.totalPages > 0 && page > result.totalPages) {
        setPage(result.totalPages);
      }

      if (result.totalPages === 0 && page !== 1) {
        setPage(1);
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      console.error("Activity logs error:", err);
      setError(err.message || "Unable to load activity logs.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    page,
    debouncedSearch,
    actionFilter,
    tableFilter,
    startDate,
    endDate,
  ]);

  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      setSummaryError("");

      const result = await adminActivityService.getSummary();
      setSummary(result);
    } catch (err) {
      console.error("Activity summary error:", err);
      setSummaryError(
        err.message || "Unable to load activity summary."
      );
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Summary is independent of page and filters.
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  async function handleRefresh() {
    await Promise.all([loadLogs(), loadSummary()]);
  }

  // Close detail modal with Escape.
  useEffect(() => {
    if (!selectedLog) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedLog(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedLog]);

  const isSummaryZero =
    summary.total === 0 &&
    summary.today === 0 &&
    summary.inserts === 0 &&
    summary.updates === 0 &&
    summary.deletes === 0;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
              <Activity size={23} />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Activity Logs
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Monitor platform administrator actions and database changes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || summaryLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={
              loading || summaryLoading ? "animate-spin" : ""
            }
          />
          Refresh
        </button>
      </div>

      {/* ERRORS */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {summaryError && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{summaryError}</span>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Logs"
          value={summaryLoading ? "—" : summary.total}
          icon={Activity}
          color="bg-violet-50 text-violet-700"
        />

        <StatCard
          title="Today's Activities"
          value={summaryLoading ? "—" : summary.today}
          icon={CalendarDays}
          color="bg-blue-50 text-blue-700"
        />

        <StatCard
          title="Created"
          value={summaryLoading ? "—" : summary.inserts}
          icon={PlusCircle}
          color="bg-emerald-50 text-emerald-700"
        />

        <StatCard
          title="Updated"
          value={summaryLoading ? "—" : summary.updates}
          icon={Pencil}
          color="bg-cyan-50 text-cyan-700"
        />

        <StatCard
          title="Deleted"
          value={summaryLoading ? "—" : summary.deletes}
          icon={Trash2}
          color="bg-red-50 text-red-700"
        />
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search admin, business, record ID..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
          >
            <option value="all">All Actions</option>
            <option value="INSERT">Created</option>
            <option value="UPDATE">Updated</option>
            <option value="DELETE">Deleted</option>
          </select>

          <select
            value={tableFilter}
            onChange={(event) => setTableFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
          >
            <option value="all">All Modules</option>

            {tableOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              aria-label="Start date"
              className="min-w-0 w-1/2 rounded-xl border border-slate-200 px-2 py-2.5 text-xs outline-none focus:border-violet-500"
            />

            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              aria-label="End date"
              className="min-w-0 w-1/2 rounded-xl border border-slate-200 px-2 py-2.5 text-xs outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {(search || actionFilter !== "all" ||
          tableFilter !== "all" || startDate || endDate) && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                setActionFilter("all");
                setTableFilter("all");
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
              className="text-xs font-semibold text-violet-700 hover:text-violet-900"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* LOG TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">
              Audit History
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {total.toLocaleString("en-IN")} matching record(s)
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading activity logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Activity
              size={36}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-semibold text-slate-700">
              No activity found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Admin actions on monitored tables will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">Module</th>
                  <th className="px-5 py-3 font-semibold">Admin ID</th>
                  <th className="px-5 py-3 font-semibold">Record ID</th>
                  <th className="px-5 py-3 font-semibold">Date & Time (IST)</th>
                  <th className="px-5 py-3 text-right font-semibold">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const Icon =
                    TABLE_ICONS[log.table_name] || Settings;

                  return (
                    <tr
                      key={log.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <ActionBadge action={log.action} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Icon size={16} className="text-slate-400" />
                          {TABLE_LABELS[log.table_name] || log.table_name}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="text-xs text-slate-500"
                          title={log.admin_id || ""}
                        >
                          {log.admin_id
                            ? `${log.admin_id.slice(0, 8)}...`
                            : "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="text-xs text-slate-500"
                          title={log.record_id || ""}
                        >
                          {log.record_id
                            ? `${log.record_id.slice(0, 12)}...`
                            : "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(log.created_at)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && totalPages > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing{" "}
              {total === 0 ? 0 : (page - 1) * 50 + 1}
              {"–"}
              {Math.min(page * 50, total)} of{" "}
              {total.toLocaleString("en-IN")} records
              {" · "}Page {page} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(totalPages, current + 1)
                  )
                }
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedLog(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-detail-title"
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2
                  id="activity-detail-title"
                  className="font-bold text-slate-900"
                >
                  Activity Details
                </h2>

                <p className="mt-1 break-all text-xs text-slate-500">
                  Audit record: {selectedLog.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-400">Action</p>

                  <div className="mt-2">
                    <ActionBadge action={selectedLog.action} />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-400">Module</p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {TABLE_LABELS[selectedLog.table_name] ||
                      selectedLog.table_name}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 px-4">
                <DetailRow
                  label="Admin ID"
                  value={selectedLog.admin_id}
                />

                <DetailRow
                  label="Business ID"
                  value={selectedLog.business_id}
                />

                <DetailRow
                  label="Record ID"
                  value={selectedLog.record_id}
                />

                <DetailRow
                  label="Timestamp (IST)"
                  value={formatDate(selectedLog.created_at)}
                />
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div className="min-w-0">
                  <h3 className="mb-2 text-sm font-bold text-slate-800">
                    Previous Data
                  </h3>

                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-slate-950 p-4 text-xs leading-5 text-emerald-300">
                    {prettyJson(selectedLog.old_data)}
                  </pre>
                </div>

                <div className="min-w-0">
                  <h3 className="mb-2 text-sm font-bold text-slate-800">
                    New Data
                  </h3>

                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-slate-950 p-4 text-xs leading-5 text-cyan-300">
                    {prettyJson(selectedLog.new_data)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
