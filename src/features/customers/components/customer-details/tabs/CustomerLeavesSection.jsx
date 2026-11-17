import { useMemo, useState } from "react";
import {
  Filter,
  ChevronDown,
  RotateCcw,
  CalendarOff,
  Search,
} from "lucide-react";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatus = (leave) => {
  const value = String(
    leave.status || leave.leaveStatus || leave.leave_status || ""
  ).toLowerCase();

  if (["cancelled", "canceled"].includes(value)) return "Cancelled";
  if (["approved", "active"].includes(value)) return "Approved";
  if (value === "rejected") return "Rejected";
  if (value === "pending") return "Pending";

  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "—";
};

export default function CustomerLeavesSection({
  customer,
  leaves = [],
  loading = false,
  error = "",
  onCancelLeave,
  cancellingId = null,
  isArchived = false,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const start =
        leave.fromDate ||
        leave.from_date ||
        leave.leaveDate ||
        leave.leave_date ||
        leave.date;

      const parsedDate = start ? new Date(start) : null;
      const date =
        parsedDate && !Number.isNaN(parsedDate.getTime())
          ? parsedDate.toISOString().slice(0, 10)
          : "";
      const status = getStatus(leave).toLowerCase();
      const reason = String(leave.reason || leave.description || "");
      const shift = String(leave.shift || "");

      const matchesSearch =
        !search ||
        reason.toLowerCase().includes(search.toLowerCase()) ||
        shift.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;
      const matchesFrom = !fromDate || (date && date >= fromDate);
      const matchesTo = !toDate || (date && date <= toDate);

      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }, [leaves, search, statusFilter, fromDate, toDate]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  const statusClass = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-emerald-50 text-emerald-700";
      case "cancelled":
        return "bg-rose-50 text-rose-700";
      case "rejected":
        return "bg-red-50 text-red-700";
      case "pending":
        return "bg-amber-50 text-amber-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const approvedCount = leaves.filter(
    (item) => getStatus(item) === "Approved"
  ).length;

  const cancelledCount = leaves.filter(
    (item) => getStatus(item) === "Cancelled"
  ).length;

  const renderEmpty = () => (
    <div className="px-4 py-10 text-center">
      <CalendarOff size={30} className="mx-auto mb-3 text-slate-300" />
      <p className="text-sm font-medium text-slate-600">
        No leave records found
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Customer leave records will appear here.
      </p>
    </div>
  );

  return (
    <div className="min-w-0 space-y-3 sm:space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <p className="text-[11px] leading-tight text-slate-500 sm:text-sm">
            Total Leaves
          </p>
          <p className="mt-1.5 text-xl font-semibold leading-none text-slate-900 sm:mt-2 sm:text-2xl">
            {leaves.length}
          </p>
        </div>
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <p className="text-[11px] leading-tight text-slate-500 sm:text-sm">
            Approved
          </p>
          <p className="mt-1.5 text-xl font-semibold leading-none text-emerald-600 sm:mt-2 sm:text-2xl">
            {approvedCount}
          </p>
        </div>
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <p className="text-[11px] leading-tight text-slate-500 sm:text-sm">
            Cancelled
          </p>
          <p className="mt-1.5 text-xl font-semibold leading-none text-rose-600 sm:mt-2 sm:text-2xl">
            {cancelledCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Filter size={17} className="shrink-0 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">
              Filters
            </span>
            {(search || statusFilter !== "all" || fromDate || toDate) && (
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                Active
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {(search || statusFilter !== "all" || fromDate || toDate) && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              {showFilters ? "Hide" : "Show"}
              <ChevronDown
                size={15}
                className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:mt-5 sm:grid-cols-2 sm:gap-4 sm:pt-5 xl:grid-cols-4">
            <div className="col-span-2 min-w-0 xl:col-span-1">
              <label className="mb-1.5 block text-xs font-medium text-slate-600 sm:text-sm">
                Search Reason / Shift
              </label>
              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search leave"
                  className="w-full min-w-0 rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-400"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="mb-1.5 block text-xs font-medium text-slate-600 sm:text-sm">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-sm outline-none focus:border-teal-400"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="min-w-0">
              <label className="mb-1.5 block text-xs font-medium text-slate-600 sm:text-sm">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-2.5 text-xs outline-none focus:border-teal-400 sm:px-3 sm:text-sm"
              />
            </div>

            <div className="min-w-0">
              <label className="mb-1.5 block text-xs font-medium text-slate-600 sm:text-sm">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-2.5 text-xs outline-none focus:border-teal-400 sm:px-3 sm:text-sm"
              />
            </div>
          </div>
        )}
      </section>

      {/* Leave History */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-3 py-3 sm:px-5 sm:py-4">
          <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
            Leave History
          </h3>
          <p className="mt-1 truncate text-[11px] text-slate-400 sm:text-xs">
            {customer?.name || "Customer"} · Leave and cancellation records
          </p>
        </div>

        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-slate-400">
            Loading leave history...
          </div>
        ) : error ? (
          <div className="px-4 py-10 text-center text-sm text-red-500">
            {error}
          </div>
        ) : filteredLeaves.length === 0 ? (
          renderEmpty()
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {filteredLeaves.map((leave, index) => {
                const from =
                  leave.fromDate ||
                  leave.from_date ||
                  leave.leaveDate ||
                  leave.leave_date ||
                  leave.date;
                const to = leave.toDate || leave.to_date || from;
                const status = getStatus(leave);
                const canCancel =
                  onCancelLeave &&
                  !isArchived &&
                  !["Cancelled", "Rejected"].includes(status);
                const reason = leave.reason || leave.description || "—";

                return (
                  <article
                    key={leave.id || `${from}-${index}`}
                    className="space-y-2.5 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          {formatDate(from)}
                          {to && to !== from ? (
                            <span className="font-normal text-slate-500">
                              {" "}– {formatDate(to)}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Shift: {leave.shift || "All"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass(status)}`}
                      >
                        {status}
                      </span>
                    </div>

                    <p className="break-words text-xs leading-relaxed text-slate-600">
                      {reason}
                    </p>

                    {canCancel && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={cancellingId === leave.id}
                          onClick={() => onCancelLeave(leave)}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          {cancellingId === leave.id ? "Cancelling..." : "Cancel Leave"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-5 py-4 font-medium">From Date</th>
                    <th className="px-5 py-4 font-medium">To Date</th>
                    <th className="px-5 py-4 font-medium">Shift</th>
                    <th className="px-5 py-4 font-medium">Reason</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLeaves.map((leave, index) => {
                    const from =
                      leave.fromDate ||
                      leave.from_date ||
                      leave.leaveDate ||
                      leave.leave_date ||
                      leave.date;
                    const to = leave.toDate || leave.to_date || from;
                    const status = getStatus(leave);
                    const canCancel =
                      onCancelLeave &&
                      !isArchived &&
                      !["Cancelled", "Rejected"].includes(status);

                    return (
                      <tr
                        key={leave.id || `${from}-${index}`}
                        className="hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                          {formatDate(from)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                          {formatDate(to)}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {leave.shift || "All"}
                        </td>
                        <td className="max-w-[240px] px-5 py-4 text-slate-600">
                          {leave.reason || leave.description || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClass(status)}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {canCancel ? (
                            <button
                              type="button"
                              disabled={cancellingId === leave.id}
                              onClick={() => onCancelLeave(leave)}
                              className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                            >
                              {cancellingId === leave.id ? "Cancelling..." : "Cancel"}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="border-t border-slate-100 px-3 py-2.5 text-[11px] text-slate-400 sm:px-5 sm:py-3 sm:text-xs">
          Showing {filteredLeaves.length} of {leaves.length} leave records
        </div>
      </section>
    </div>
  );
}
