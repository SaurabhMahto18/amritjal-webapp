
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
  if (["rejected"].includes(value)) return "Rejected";
  if (["pending"].includes(value)) return "Pending";

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
  const [showFilters, setShowFilters] = useState(true);
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

      const date = start ? new Date(start).toISOString().slice(0, 10) : "";
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

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Leaves</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {leaves.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Approved</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">
            {approvedCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Cancelled</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600">
            {cancelledCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          aria-expanded={showFilters}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Filter size={18} />
          Filters
          <ChevronDown
            size={16}
            className={`transition-transform ${
              showFilters ? "rotate-180" : ""
            }`}
          />
        </button>

        {showFilters && (
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm text-slate-600">
                Search Reason / Shift
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leave"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div className="flex items-end md:col-span-2 xl:col-span-4">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Leave History */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Leave History</h3>
          <p className="mt-1 text-xs text-slate-400">
            {customer?.name || "Customer"} · Leave and cancellation records
          </p>
        </div>

        <div className="overflow-x-auto">
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading leave history...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <CalendarOff
                      size={32}
                      className="mx-auto mb-3 text-slate-300"
                    />
                    <p className="font-medium text-slate-600">
                      No leave records found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Customer leave records will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave, index) => {
                  const from =
                    leave.fromDate ||
                    leave.from_date ||
                    leave.leaveDate ||
                    leave.leave_date ||
                    leave.date;

                  const to =
                    leave.toDate ||
                    leave.to_date ||
                    from;

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
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                            status
                          )}`}
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
                            {cancellingId === leave.id
                              ? "Cancelling..."
                              : "Cancel"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          Showing {filteredLeaves.length} of {leaves.length} leave records
        </div>
      </section>
    </div>
  );
}
