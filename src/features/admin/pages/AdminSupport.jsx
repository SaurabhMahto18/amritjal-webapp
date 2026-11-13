
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  X,
  Building2,
  User,
  CalendarDays,
  Flag,
  Loader2,
  Headphones,
} from "lucide-react";

import { adminSupportService } from "../services/adminSupportService";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const CATEGORY_LABELS = {
  general: "General",
  billing: "Billing",
  subscription: "Subscription",
  technical: "Technical",
  account: "Account",
  feature_request: "Feature Request",
  other: "Other",
};

const STATUS_STYLES = {
  open: "bg-blue-50 text-blue-700 border-blue-100",
  in_progress: "bg-amber-50 text-amber-700 border-amber-100",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
};

const PRIORITY_STYLES = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-red-50 text-red-700",
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatus = (value) =>
  STATUS_OPTIONS.find((item) => item.value === value)?.label || value;

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] || STATUS_STYLES.closed
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium
      }`}
    >
      {priority?.toUpperCase() || "MEDIUM"}
    </span>
  );
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await adminSupportService.getTickets();
      setTickets(data);
    } catch (err) {
      console.error("Support tickets error:", err);
      setError(err.message || "Unable to load support tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      inProgress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: tickets.filter(
        (t) => t.status === "resolved" || t.status === "closed"
      ).length,
      urgent: tickets.filter((t) => t.priority === "urgent").length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const businessName = ticket.businesses?.name || "";

      const matchesSearch =
        !term ||
        ticket.subject?.toLowerCase().includes(term) ||
        ticket.description?.toLowerCase().includes(term) ||
        businessName.toLowerCase().includes(term) ||
        ticket.id?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const openTicket = async (ticket) => {
    try {
      setSelectedTicket(ticket);
      setMessages([]);
      setReply("");
      setSuccess("");
      setError("");
      setDetailLoading(true);

      const data = await adminSupportService.getTicketMessages(ticket.id);
      setMessages(data);
    } catch (err) {
      console.error("Ticket messages error:", err);
      setError(err.message || "Unable to load ticket conversation.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleTicketUpdate = async (field, value) => {
    if (!selectedTicket) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updated = await adminSupportService.updateTicket(
        selectedTicket.id,
        { [field]: value }
      );

      const updatedTicket = {
        ...selectedTicket,
        ...updated,
      };

      setSelectedTicket(updatedTicket);

      setTickets((previous) =>
        previous.map((ticket) =>
          ticket.id === updated.id
            ? { ...ticket, ...updated }
            : ticket
        )
      );

      setSuccess("Ticket updated successfully.");
    } catch (err) {
      console.error("Ticket update error:", err);
      setError(err.message || "Unable to update ticket.");
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async (event) => {
    event.preventDefault();

    if (!selectedTicket || !reply.trim()) return;

    try {
      setReplyLoading(true);
      setError("");
      setSuccess("");

      const newMessage = await adminSupportService.sendReply(
        selectedTicket.id,
        reply
      );

      setMessages((previous) => [...previous, newMessage]);
      setReply("");
      setSuccess("Reply sent successfully.");

      if (selectedTicket.status === "open") {
        await handleTicketUpdate("status", "in_progress");
      }
    } catch (err) {
      console.error("Reply error:", err);
      setError(err.message || "Unable to send reply.");
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-700">
              <Headphones size={23} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Support & Complaints
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Manage business support tickets and customer complaints.
          </p>
        </div>

        <button
          type="button"
          onClick={loadTickets}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Tickets"
          value={stats.total}
          icon={MessageSquare}
          color="bg-cyan-50 text-cyan-700"
        />
        <StatCard
          title="Open"
          value={stats.open}
          icon={AlertCircle}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          color="bg-amber-50 text-amber-700"
        />
        <StatCard
          title="Resolved / Closed"
          value={stats.resolved}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Urgent"
          value={stats.urgent}
          icon={Flag}
          color="bg-red-50 text-red-700"
        />
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticket, subject or business..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
          >
            <option value="all">All Priorities</option>
            {PRIORITY_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TICKET TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Support Tickets</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredTickets.length} ticket(s) found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <MessageSquare
              size={36}
              className="mx-auto text-slate-300"
            />
            <p className="mt-3 font-semibold text-slate-700">
              No support tickets found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Tickets will appear here when businesses submit requests.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Ticket</th>
                  <th className="px-5 py-3 font-semibold">Business</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Priority</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="max-w-[260px] truncate text-sm font-semibold text-slate-900">
                        {ticket.subject}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        #{ticket.id.slice(0, 8)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Building2 size={15} className="text-slate-400" />
                        {ticket.businesses?.name || "Unknown business"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {CATEGORY_LABELS[ticket.category] || "Other"}
                    </td>

                    <td className="px-5 py-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(ticket.created_at)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openTicket(ticket)}
                        className="rounded-lg bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TICKET DETAIL MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    Ticket Details
                  </h2>
                  <StatusBadge status={selectedTicket.status} />
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Ticket ID: {selectedTicket.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedTicket(null);
                  setMessages([]);
                  setError("");
                  setSuccess("");
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close ticket details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1fr_300px]">
              {/* LEFT: TICKET AND CONVERSATION */}
              <div className="min-w-0 border-b border-slate-100 p-5 sm:p-6 lg:border-b-0 lg:border-r">
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedTicket.subject}
                </h3>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {selectedTicket.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} />
                    {formatDate(selectedTicket.created_at)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={14} />
                    {selectedTicket.businesses?.name || "Unknown business"}
                  </span>
                </div>

                <div className="mt-7 border-t border-slate-100 pt-5">
                  <h3 className="flex items-center gap-2 font-bold text-slate-900">
                    <MessageSquare size={18} />
                    Conversation
                  </h3>

                  {detailLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                      <Loader2 size={18} className="animate-spin" />
                      Loading conversation...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-400">
                      No replies yet.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {messages.map((message) => {
                        const isAdmin = message.sender_role === "admin";

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isAdmin ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[88%] rounded-2xl p-3.5 ${
                                isAdmin
                                  ? "bg-cyan-700 text-white"
                                  : "border border-slate-200 bg-slate-50 text-slate-800"
                              }`}
                            >
                              <div className="mb-1 flex items-center gap-2 text-xs font-semibold">
                                <User size={13} />
                                {isAdmin ? "Admin" : "Business"}
                              </div>

                              <p className="whitespace-pre-wrap text-sm leading-6">
                                {message.message}
                              </p>

                              <p
                                className={`mt-2 text-[10px] ${
                                  isAdmin
                                    ? "text-cyan-100"
                                    : "text-slate-400"
                                }`}
                              >
                                {formatDate(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedTicket.status !== "closed" && (
                  <form onSubmit={handleReply} className="mt-5 border-t border-slate-100 pt-5">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Write a reply
                    </label>

                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={3}
                      placeholder="Type your response to the business..."
                      className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    />

                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={replyLoading || !reply.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {replyLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                        Send Reply
                      </button>
                    </div>
                  </form>
                )}

                {selectedTicket.status === "closed" && (
                  <p className="mt-5 rounded-xl bg-slate-100 p-3 text-sm text-slate-500">
                    This ticket is closed. Reopen it to continue the conversation.
                  </p>
                )}
              </div>

              {/* RIGHT: CONTROLS */}
              <aside className="space-y-5 bg-slate-50/70 p-5 sm:p-6">
                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-900">
                    Ticket Management
                  </h3>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                    Status
                  </label>
                  <select
                    value={selectedTicket.status}
                    disabled={saving}
                    onChange={(e) =>
                      handleTicketUpdate("status", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 disabled:opacity-60"
                  >
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                    Priority
                  </label>
                  <select
                    value={selectedTicket.priority}
                    disabled={saving}
                    onChange={(e) =>
                      handleTicketUpdate("priority", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 disabled:opacity-60"
                  >
                    {PRIORITY_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h3 className="mb-3 text-sm font-bold text-slate-900">
                    Ticket Information
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Business</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {selectedTicket.businesses?.name || "Unknown business"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Category</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {CATEGORY_LABELS[selectedTicket.category] || "Other"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Created At</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {formatDate(selectedTicket.created_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Last Updated</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {formatDate(selectedTicket.updated_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Resolved At</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {formatDate(selectedTicket.resolved_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {saving && (
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 size={14} className="animate-spin" />
                    Saving changes...
                  </p>
                )}
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
