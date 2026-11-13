
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  CalendarClock,
  Users,
  Eye,
  Pencil,
  Send,
  Archive,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

import {
  getAdminAnnouncements,
  getAnnouncementBusinesses,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
} from "../services/adminAnnouncementService";

const TYPES = [
  { value: "general", label: "General" },
  { value: "important", label: "Important" },
  { value: "maintenance", label: "Maintenance" },
  { value: "billing", label: "Billing" },
];

const STATUSES = [
  { value: "all", label: "All announcements" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const EMPTY_FORM = {
  title: "",
  message: "",
  announcement_type: "general",
  audience_type: "all",
  status: "draft",
  publish_at: "",
  expires_at: "",
  businessIds: [],
};

function toLocalDateTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const styles = {
    draft: "bg-slate-100 text-slate-700",
    scheduled: "bg-blue-50 text-blue-700",
    published: "bg-emerald-50 text-emerald-700",
    archived: "bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || styles.draft
      }`}
    >
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

function TypeBadge({ type }) {
  const styles = {
    general: "bg-slate-100 text-slate-700",
    important: "bg-amber-50 text-amber-700",
    maintenance: "bg-orange-50 text-orange-700",
    billing: "bg-cyan-50 text-cyan-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[type] || styles.general
      }`}
    >
      {type?.charAt(0).toUpperCase() + type?.slice(1)}
    </span>
  );
}

function SummaryCard({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <Icon size={20} className="text-cyan-700" />
      </div>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function AnnouncementForm({
  initialData,
  businesses,
  saving,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...initialData,
    publish_at:
      toLocalDateTime(initialData?.publish_at) ||
      toLocalDateTime(new Date().toISOString()),
    expires_at: toLocalDateTime(initialData?.expires_at),
    businessIds: initialData?.businessIds || [],
  }));

  const [businessSearch, setBusinessSearch] = useState("");
  const [formError, setFormError] = useState("");

  const selectedCount = form.businessIds.length;

  const filteredBusinesses = useMemo(() => {
    const search = businessSearch.trim().toLowerCase();

    if (!search) return businesses;

    return businesses.filter((business) =>
      [
        business.name,
        business.legal_name,
        business.email,
        business.district,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(search)
        )
    );
  }, [businesses, businessSearch]);

  function updateField(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function toggleBusiness(id) {
    setForm((previous) => {
      const exists = previous.businessIds.includes(id);

      return {
        ...previous,
        businessIds: exists
          ? previous.businessIds.filter((item) => item !== id)
          : [...previous.businessIds, id],
      };
    });
  }

  function handleAudienceChange(value) {
    setForm((previous) => ({
      ...previous,
      audience_type: value,
      businessIds: value === "all" ? [] : previous.businessIds,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim() || !form.message.trim()) {
      setFormError("Title aur message dono required hain.");
      return;
    }

    if (
      form.audience_type === "selected" &&
      form.businessIds.length === 0
    ) {
      setFormError("Kam se kam ek business select karo.");
      return;
    }

    if (
      form.expires_at &&
      new Date(form.expires_at) <= new Date(form.publish_at)
    ) {
      setFormError("Expiry date publish date ke baad honi chahiye.");
      return;
    }

    if (
      form.status === "scheduled" &&
      new Date(form.publish_at) <= new Date()
    ) {
      setFormError("Scheduled announcement ke liye future date select karo.");
      return;
    }

    const payload = {
      title: form.title,
      message: form.message,
      announcement_type: form.announcement_type,
      audience_type: form.audience_type,
      status: form.status,
      publish_at: new Date(form.publish_at).toISOString(),
      expires_at: form.expires_at
        ? new Date(form.expires_at).toISOString()
        : null,
      businessIds: form.businessIds,
    };

    await onSubmit(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-6">
      <div className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {initialData?.id ? "Edit Announcement" : "Create Announcement"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Platform businesses ke liye announcement publish karo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Announcement Title *
            </label>

            <input
              value={form.title}
              onChange={(event) =>
                updateField("title", event.target.value)
              }
              maxLength={180}
              required
              placeholder="Enter announcement title"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Message *
            </label>

            <textarea
              value={form.message}
              onChange={(event) =>
                updateField("message", event.target.value)
              }
              rows={5}
              required
              placeholder="Write your announcement..."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50"
            />

            <p className="mt-1 text-xs text-slate-400">
              Plain text message. HTML is not rendered.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Announcement Type
              </label>

              <select
                value={form.announcement_type}
                onChange={(event) =>
                  updateField("announcement_type", event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                {TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                value={form.status}
                onChange={(event) =>
                  updateField("status", event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <option value="draft">Save as Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Audience
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleAudienceChange("all")}
                className={`rounded-xl border p-4 text-left transition ${
                  form.audience_type === "all"
                    ? "border-cyan-600 bg-cyan-50 ring-2 ring-cyan-100"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Users size={20} className="text-cyan-700" />
                <p className="mt-2 text-sm font-bold text-slate-900">
                  All Businesses
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Announcement sabhi eligible businesses ko dikhega.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleAudienceChange("selected")}
                className={`rounded-xl border p-4 text-left transition ${
                  form.audience_type === "selected"
                    ? "border-cyan-600 bg-cyan-50 ring-2 ring-cyan-100"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <CheckCircle2 size={20} className="text-cyan-700" />
                <p className="mt-2 text-sm font-bold text-slate-900">
                  Selected Businesses
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Sirf selected businesses ko dikhega.
                </p>
              </button>
            </div>
          </div>

          {form.audience_type === "selected" && (
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Select Businesses
                  </p>

                  <p className="text-xs text-slate-500">
                    {selectedCount} business selected
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      "businessIds",
                      filteredBusinesses.map((business) => business.id)
                    )
                  }
                  className="text-xs font-semibold text-cyan-700 hover:underline"
                >
                  Select filtered
                </button>
              </div>

              <div className="relative mt-3">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={businessSearch}
                  onChange={(event) =>
                    setBusinessSearch(event.target.value)
                  }
                  placeholder="Search business..."
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-cyan-600"
                />
              </div>

              <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
                {filteredBusinesses.map((business) => (
                  <label
                    key={business.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.businessIds.includes(business.id)}
                      onChange={() => toggleBusiness(business.id)}
                      className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600"
                    />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {business.name || business.legal_name || "Unnamed business"}
                      </span>

                      <span className="block truncate text-xs text-slate-500">
                        {[business.email, business.district, business.state]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>

                    <span className="text-xs text-slate-400">
                      {business.status || ""}
                    </span>
                  </label>
                ))}

                {filteredBusinesses.length === 0 && (
                  <p className="p-5 text-center text-sm text-slate-500">
                    No businesses found.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => updateField("businessIds", [])}
                className="mt-3 text-xs font-semibold text-red-600 hover:underline"
              >
                Clear selection
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Publish Date & Time
              </label>

              <input
                type="datetime-local"
                value={form.publish_at}
                onChange={(event) =>
                  updateField("publish_at", event.target.value)
                }
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Expiry Date & Time
              </label>

              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(event) =>
                  updateField("expires_at", event.target.value)
                }
                min={form.publish_at || undefined}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-cyan-700 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : initialData?.id
                  ? "Update Announcement"
                  : "Create Announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [businesses, setBusinesses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [actionId, setActionId] = useState(null);

  const loadData = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const [announcementData, businessData] = await Promise.all([
        getAdminAnnouncements(),
        getAnnouncementBusinesses(),
      ]);

      setAnnouncements(announcementData);
      setBusinesses(businessData);
    } catch (err) {
      console.error("Announcement loading failed:", err);
      setError(err.message || "Unable to load announcements.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAnnouncements = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return announcements.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        [item.title, item.message, item.announcement_type]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch)
          );

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      const matchesType =
        typeFilter === "all" || item.announcement_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [announcements, search, statusFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: announcements.length,
    published: announcements.filter((item) => item.status === "published").length,
    scheduled: announcements.filter((item) => item.status === "scheduled").length,
    reads: announcements.reduce((sum, item) => sum + item.read_count, 0),
  }), [announcements]);

  function showMessage(message) {
    setSuccess(message);
    setError("");

    window.setTimeout(() => {
      setSuccess("");
    }, 3500);
  }

  async function handleFormSubmit(payload) {
    try {
      setSaving(true);
      setError("");

      if (editingAnnouncement?.id) {
        await updateAnnouncement(editingAnnouncement.id, payload);
        showMessage("Announcement updated successfully.");
      } else {
        await createAnnouncement(payload);
        showMessage("Announcement created successfully.");
      }

      setShowForm(false);
      setEditingAnnouncement(null);
      await loadData(true);
    } catch (err) {
      console.error("Announcement save failed:", err);
      setError(err.message || "Unable to save announcement.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(item) {
    try {
      setError("");

      const data = await getAnnouncementById(item.id);

      setEditingAnnouncement(data);
      setShowForm(true);
    } catch (err) {
      setError(err.message || "Unable to open announcement.");
    }
  }

  async function handlePublish(item) {
    const confirmed = window.confirm(
      `Publish "${item.title}" now?`
    );

    if (!confirmed) return;

    try {
      setActionId(item.id);
      setError("");

      await publishAnnouncement(item.id);
      showMessage("Announcement published successfully.");

      await loadData(true);
    } catch (err) {
      setError(err.message || "Unable to publish announcement.");
    } finally {
      setActionId(null);
    }
  }

  async function handleArchive(item) {
    const confirmed = window.confirm(
      `Archive "${item.title}"?`
    );

    if (!confirmed) return;

    try {
      setActionId(item.id);
      setError("");

      await archiveAnnouncement(item.id);
      showMessage("Announcement archived successfully.");

      await loadData(true);
    } catch (err) {
      setError(err.message || "Unable to archive announcement.");
    } finally {
      setActionId(null);
    }
  }

  function openCreateForm() {
    setEditingAnnouncement(null);
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingAnnouncement(null);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
            Platform Communication
          </p>

          <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            <Megaphone className="text-cyan-700" size={30} />
            Announcement Centre
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create and manage platform-wide business announcements.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-800"
          >
            <Plus size={17} />
            New Announcement
          </button>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Announcements"
          value={loading ? "—" : stats.total}
          description="All announcement records"
          icon={FileText}
        />

        <SummaryCard
          title="Published"
          value={loading ? "—" : stats.published}
          description="Published announcements"
          icon={Megaphone}
        />

        <SummaryCard
          title="Scheduled"
          value={loading ? "—" : stats.scheduled}
          description="Waiting for publish time"
          icon={CalendarClock}
        />

        <SummaryCard
          title="Read Receipts"
          value={loading ? "—" : stats.reads}
          description="Recorded user-business reads"
          icon={Eye}
        />
      </div>

      {/* List */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              All Announcements
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Search, filter and manage your announcements.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search announcements..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-cyan-600 sm:w-60"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="all">All types</option>
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading announcements...
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone size={34} className="mx-auto text-slate-300" />

            <p className="mt-3 font-semibold text-slate-700">
              No announcements found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Create an announcement or change your filters.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="mt-4 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800"
            >
              Create Announcement
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Announcement</th>
                  <th className="px-5 py-4 font-semibold">Type</th>
                  <th className="px-5 py-4 font-semibold">Audience</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Publish Date</th>
                  <th className="px-5 py-4 font-semibold">Reads</th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredAnnouncements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="max-w-[300px] px-5 py-4">
                      <p className="truncate font-semibold text-slate-900">
                        {item.title}
                      </p>

                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {item.message}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <TypeBadge type={item.announcement_type} />
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700">
                        {item.audience_type === "all"
                          ? "All Businesses"
                          : "Selected Businesses"}
                      </p>

                      {item.audience_type === "selected" && (
                        <p className="mt-1 text-xs text-slate-500">
                          {item.target_count} selected
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-600">
                      {formatDate(item.publish_at)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800">
                        {item.read_count}
                      </span>
                      <span className="ml-1 text-xs text-slate-400">
                        receipts
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => handleEdit(item)}
                          disabled={actionId === item.id}
                          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-cyan-700 disabled:opacity-50"
                        >
                          <Pencil size={16} />
                        </button>

                        {item.status !== "published" &&
                          item.status !== "archived" && (
                            <button
                              type="button"
                              title="Publish now"
                              onClick={() => handlePublish(item)}
                              disabled={actionId === item.id}
                              className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                            >
                              <Send size={16} />
                            </button>
                          )}

                        {item.status !== "archived" && (
                          <button
                            type="button"
                            title="Archive"
                            onClick={() => handleArchive(item)}
                            disabled={actionId === item.id}
                            className="rounded-lg p-2 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                          >
                            <Archive size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
          Showing {filteredAnnouncements.length} of {announcements.length} announcements.
        </div>
      </section>

      {showForm && (
        <AnnouncementForm
          initialData={editingAnnouncement}
          businesses={businesses}
          saving={saving}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}
