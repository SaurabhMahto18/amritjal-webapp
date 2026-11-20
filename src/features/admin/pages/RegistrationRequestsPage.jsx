
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Search,
  RefreshCw,
  Users,
  Clock3,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  CalendarDays,
  Eye,
  Check,
  X,
  AlertCircle,
  ClipboardList,
  Filter,
  Loader2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  getRegistrationRequests,
  approveBusinessRegistration,
  rejectBusinessRegistration,
} from "../services/adminService";

// ======================================
// HELPERS
// ======================================

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
};

const getInitials = (email = "") => {
  return email
    .split("@")[0]
    .split(/[._\s-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
};

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// ======================================
// STAT CARD
// ======================================

function StatCard({ title, value, icon: Icon, color, description }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

// ======================================
// CONFIRMATION / REJECTION MODAL
// ======================================

function ActionModal({
  request,
  action,
  reason,
  setReason,
  onClose,
  onConfirm,
  processing,
}) {
  if (!request || !action) return null;

  const isApprove = action === "approve";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !processing) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">

        <div className="mb-5 flex items-start justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            isApprove
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}>
            {isApprove ? (
              <CheckCircle2 size={25} />
            ) : (
              <XCircle size={25} />
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <h2 className="text-xl font-bold text-slate-900">
          {isApprove ? "Approve registration?" : "Reject registration?"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {isApprove
            ? "Approving this application will create a new business and assign the applicant as its owner."
            : "Please provide a reason so the applicant understands why the registration was rejected."}
        </p>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Business
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {request.business_name}
          </p>

          <p className="mt-1 break-all text-sm text-slate-500">
            {request.user_email}
          </p>
        </div>

        {!isApprove && (
          <div className="mt-5">
            <label
              htmlFor="rejection-reason"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Rejection reason <span className="text-red-500">*</span>
            </label>

            <textarea
              id="rejection-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain why this registration is being rejected..."
              maxLength={500}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            />

            <div className="mt-1 text-right text-xs text-slate-400">
              {reason.length}/500
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={processing}
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              processing ||
              (!isApprove && !reason.trim())
            }
            onClick={onConfirm}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isApprove
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {processing ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Check size={17} />
            )}

            {processing
              ? "Processing..."
              : isApprove
                ? "Confirm Approval"
                : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ======================================
// REQUEST DETAILS MODAL
// ======================================

function RequestDetailsModal({ request, onClose }) {
  if (!request) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-7">

        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">
              Registration details
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Application overview
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-lg font-bold text-cyan-700">
            {getInitials(request.user_email)}
          </div>

          <div className="min-w-0">
            <p className="break-all font-semibold text-slate-900">
              {request.user_email}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Applicant account
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">

          <DetailRow
            icon={Building2}
            label="Business name"
            value={request.business_name}
          />

          <DetailRow
            icon={Mail}
            label="Registered email"
            value={request.user_email}
          />

          <DetailRow
            icon={CalendarDays}
            label="Application submitted"
            value={formatDate(request.created_at)}
          />

          <DetailRow
            icon={ShieldCheck}
            label="Request ID"
            value={request.request_id}
            breakAll
          />

          <DetailRow
            icon={ClipboardList}
            label="Status"
            value={<StatusBadge status={request.request_status} />}
          />

          {request.reviewed_at && (
            <DetailRow
              icon={Clock3}
              label="Reviewed at"
              value={formatDate(request.reviewed_at)}
            />
          )}

          {request.business_id && (
            <DetailRow
              icon={Building2}
              label="Created business ID"
              value={request.business_id}
              breakAll
            />
          )}

          {request.rejection_reason && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                Rejection reason
              </p>

              <p className="mt-2 text-sm leading-6 text-red-800">
                {request.rejection_reason}
              </p>
            </div>
          )}

        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-7 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Close details
        </button>

      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, breakAll }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400">{label}</p>

        <div className={`mt-1 text-sm font-medium text-slate-800 ${
          breakAll ? "break-all" : "break-words"
        }`}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ======================================
// REQUEST CARD
// ======================================

function RequestCard({
  request,
  onView,
  onApprove,
  onReject,
  processing,
}) {
  const isPending = request.request_status === "pending";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">

      <div className="flex items-start justify-between gap-3">

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 font-bold text-cyan-700">
            {getInitials(request.user_email)}
          </div>

          <div className="min-w-0">
            <p className="break-all text-sm font-semibold text-slate-900">
              {request.user_email}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              Applicant
            </p>
          </div>
        </div>

        <StatusBadge status={request.request_status} />

      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-3.5">
        <div className="flex items-start gap-2">
          <Building2
            size={17}
            className="mt-0.5 shrink-0 text-slate-400"
          />

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Business name
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-slate-800">
              {request.business_name}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={14} />
          {formatDate(request.created_at)}
        </span>

        <button
          type="button"
          onClick={() => onView(request)}
          className="inline-flex items-center gap-1 font-semibold text-cyan-700 hover:text-cyan-800"
        >
          <Eye size={15} />
          View details
        </button>
      </div>

      {isPending && (
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">

          <button
            type="button"
            disabled={processing}
            onClick={() => onReject(request)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            <X size={16} />
            Reject
          </button>

          <button
            type="button"
            disabled={processing}
            onClick={() => onApprove(request)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <Check size={16} />
            Approve
          </button>

        </div>
      )}

      {!isPending && request.rejection_reason && (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
          <p className="text-xs font-semibold text-red-700">
            Rejection reason
          </p>

          <p className="mt-1 text-sm text-red-600">
            {request.rejection_reason}
          </p>
        </div>
      )}

    </article>
  );
}

// ======================================
// EMPTY STATE
// ======================================

function EmptyState({ status, search }) {
  const isPending = status === "pending";

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {search ? (
          <Search size={28} />
        ) : isPending ? (
          <CheckCircle2 size={30} />
        ) : (
          <ClipboardList size={30} />
        )}
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-800">
        {search
          ? "No matching applications"
          : isPending
            ? "All caught up!"
            : `No ${status} requests`}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {search
          ? "Try another search term or change the status filter."
          : isPending
            ? "There are currently no registration applications waiting for your approval."
            : `No registration requests with ${status} status were found.`}
      </p>

    </div>
  );
}

// ======================================
// MAIN PAGE
// ======================================

export default function RegistrationRequestsPage() {
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("pending");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsRequest, setDetailsRequest] = useState(null);

  const [action, setAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // ======================================
  // LOAD REGISTRATION REQUESTS
  // ======================================

  const loadRequests = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getRegistrationRequests();

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Registration requests error:", err);

      setError(
        err?.message || "Unable to load registration requests."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // ======================================
  // PAGE STATISTICS
  // ======================================

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(
        (r) => r.request_status === "pending"
      ).length,
      approved: requests.filter(
        (r) => r.request_status === "approved"
      ).length,
      rejected: requests.filter(
        (r) => r.request_status === "rejected"
      ).length,
    };
  }, [requests]);

  // ======================================
  // FILTER REQUESTS
  // ======================================

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        activeFilter === "all" ||
        request.request_status === activeFilter;

      const matchesSearch =
        !term ||
        request.business_name?.toLowerCase().includes(term) ||
        request.user_email?.toLowerCase().includes(term) ||
        request.request_id?.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [requests, activeFilter, search]);

  // ======================================
  // OPEN ACTION MODAL
  // ======================================

  function openActionModal(request, selectedAction) {
    setSelectedRequest(request);
    setAction(selectedAction);
    setRejectionReason("");
    setError("");
    setSuccess("");
  }

  function closeActionModal() {
    if (processing) return;

    setSelectedRequest(null);
    setAction(null);
    setRejectionReason("");
  }

  // ======================================
  // APPROVE / REJECT
  // ======================================

  async function handleConfirmAction() {
    if (!selectedRequest || processing) return;

    try {
      setProcessing(true);
      setError("");
      setSuccess("");

      if (action === "approve") {
        await approveBusinessRegistration(
          selectedRequest.request_id
        );

        setSuccess(
          `${selectedRequest.business_name} has been approved.`
        );
      } else {
        await rejectBusinessRegistration(
          selectedRequest.request_id,
          rejectionReason
        );

        setSuccess(
          `${selectedRequest.business_name} has been rejected.`
        );
      }

      setSelectedRequest(null);
      setAction(null);
      setRejectionReason("");

      await loadRequests(true);
    } catch (err) {
      console.error("Registration action failed:", err);

      setError(
        err?.message || "Unable to process registration request."
      );
    } finally {
      setProcessing(false);
    }
  }

  // ======================================
  // FILTER TABS
  // ======================================

  const filters = [
    {
      label: "All requests",
      value: "all",
      count: stats.total,
    },
    {
      label: "Pending",
      value: "pending",
      count: stats.pending,
    },
    {
      label: "Approved",
      value: "approved",
      count: stats.approved,
    },
    {
      label: "Rejected",
      value: "rejected",
      count: stats.rejected,
    },
  ];

  // ======================================
  // RENDER
  // ======================================

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">

      {/* PAGE TITLE */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-700">
            <ShieldCheck size={15} />
            Platform Management
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Registration Requests
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review applications and manage new business registrations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadRequests(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>

      </div>

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-800">
              Action completed successfully
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              {success}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-800">
              Something went wrong
            </p>

            <p className="mt-1 break-words text-sm text-red-700">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-600 hover:text-red-800"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* STATISTICS */}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">

        <StatCard
          title="Total requests"
          value={stats.total}
          icon={Users}
          color="blue"
          description="All applications"
        />

        <StatCard
          title="Pending review"
          value={stats.pending}
          icon={Clock3}
          color="amber"
          description="Awaiting admin action"
        />

        <StatCard
          title="Approved"
          value={stats.approved}
          icon={CheckCircle2}
          color="green"
          description="Businesses approved"
        />

        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          color="red"
          description="Applications rejected"
        />

      </div>

      {/* REQUEST MANAGEMENT */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* SECTION HEADER */}

        <div className="border-b border-slate-100 p-4 sm:p-5">

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Business applications
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Review and manage registration applications.
              </p>
            </div>

            {/* SEARCH */}

            <div className="relative w-full xl:max-w-sm">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search email, business or ID..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
              />
            </div>

          </div>

          {/* FILTER TABS */}

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">

            {filters.map((filter) => {
              const isActive = activeFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-[#0B192B] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filter.label}

                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "bg-white text-slate-500"
                  }`}>
                    {filter.count}
                  </span>
                </button>
              );
            })}

          </div>

        </div>

        {/* REQUEST CONTENT */}

        <div className="p-4 sm:p-5">

          {loading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center">
              <Loader2 size={30} className="animate-spin text-cyan-600" />

              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading registration requests...
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              status={activeFilter}
              search={search}
            />
          ) : (
            <>
              {/* RESULT COUNT */}

              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">
                  Showing {filteredRequests.length} application
                  {filteredRequests.length !== 1 ? "s" : ""}
                </p>

                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Filter size={13} />
                  {activeFilter === "all"
                    ? "All statuses"
                    : statusConfig[activeFilter]?.label}
                </div>
              </div>

              {/* MOBILE / TABLET CARDS */}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {filteredRequests.map((request) => (
                  <RequestCard
                    key={request.request_id}
                    request={request}
                    onView={setDetailsRequest}
                    onApprove={(item) =>
                      openActionModal(item, "approve")
                    }
                    onReject={(item) =>
                      openActionModal(item, "reject")
                    }
                    processing={
                      processing &&
                      selectedRequest?.request_id === request.request_id
                    }
                  />
                ))}
              </div>
            </>
          )}

        </div>

      </section>

      {/* MODALS */}

      <ActionModal
        request={selectedRequest}
        action={action}
        reason={rejectionReason}
        setReason={setRejectionReason}
        onClose={closeActionModal}
        onConfirm={handleConfirmAction}
        processing={processing}
      />

      <RequestDetailsModal
        request={detailsRequest}
        onClose={() => setDetailsRequest(null)}
      />

    </div>
  );
}
