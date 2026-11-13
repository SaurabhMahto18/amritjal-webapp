
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Info,
  Megaphone,
  RefreshCw,
  Search,
  X,
  Wrench,
  CreditCard,
  CalendarDays,
  Inbox,
} from "lucide-react";

import {
  getActiveBusinessId,
  getBusinessAnnouncements,
  markBusinessAnnouncementRead,
} from "../services/businessAnnouncementService";

// ========================================
// SEO CONFIGURATION
// ========================================

function useAnnouncementSEO() {
  useEffect(() => {
    const previousTitle = document.title;

    const description =
      "View important platform announcements, billing updates, maintenance notices and business updates from Amrit Jal.";

    document.title = "Announcements | Amrit Jal Business Console";

    const updateMeta = (name, content) => {
      let element = document.querySelector(
        `meta[name="${name}"]`
      );

      const existed = Boolean(element);
      const previousContent = element?.getAttribute("content");

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("name", name);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);

      return () => {
        if (!existed) {
          element.remove();
        } else {
          element.setAttribute(
            "content",
            previousContent ?? ""
          );
        }
      };
    };

    const restoreDescription = updateMeta(
      "description",
      description
    );

    const restoreRobots = updateMeta(
      "robots",
      "noindex, nofollow"
    );

    return () => {
      document.title = previousTitle;
      restoreDescription();
      restoreRobots();
    };
  }, []);
}

// ========================================
// FILTER CONFIGURATION
// ========================================

const FILTERS = [
  { id: "all", label: "All announcements" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
];

// ========================================
// ANNOUNCEMENT TYPE CONFIGURATION
// ========================================

const TYPE_CONFIG = {
  general: {
    label: "General",
    icon: Info,
    classes: "bg-slate-100 text-slate-700",
  },
  important: {
    label: "Important",
    icon: AlertCircle,
    classes: "bg-amber-100 text-amber-800",
  },
  maintenance: {
    label: "Maintenance",
    icon: Wrench,
    classes: "bg-orange-100 text-orange-800",
  },
  billing: {
    label: "Billing",
    icon: CreditCard,
    classes: "bg-blue-100 text-blue-800",
  },
};

// ========================================
// DATE FORMATTER
// ========================================

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

// ========================================
// ANNOUNCEMENT TYPE BADGE
// ========================================

function AnnouncementTypeBadge({ type }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.general;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.classes}`}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
}

// ========================================
// ANNOUNCEMENT CARD
// ========================================

function AnnouncementCard({ announcement, onOpen }) {
  const unread = !announcement.is_read;

  return (
    <button
      type="button"
      onClick={() => onOpen(announcement)}
      aria-label={`Open announcement: ${announcement.title}`}
      className={`group w-full rounded-2xl border p-4 text-left transition sm:p-5 ${
        unread
          ? "border-cyan-200 bg-cyan-50/40 hover:border-cyan-300 hover:bg-cyan-50"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            unread
              ? "bg-cyan-100 text-cyan-800"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <Megaphone size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <AnnouncementTypeBadge
              type={announcement.announcement_type}
            />

            {unread && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-800">
                <span className="size-1.5 rounded-full bg-cyan-600" />
                Unread
              </span>
            )}
          </div>

          <h2 className="mt-3 text-base font-bold text-slate-900">
            {announcement.title}
          </h2>

          <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm leading-6 text-slate-600">
            {announcement.message}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock3 size={14} />
              {formatDate(announcement.publish_at)}
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-800 transition group-hover:gap-2">
              View announcement
              <ChevronRight size={15} />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ========================================
// ANNOUNCEMENT DETAILS MODAL
// ========================================

function AnnouncementDetails({ announcement, onClose }) {
  useEffect(() => {
    if (!announcement) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [announcement, onClose]);

  if (!announcement) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Megaphone size={18} className="text-cyan-700" />
            Announcement Details
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close announcement"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-72px)] overflow-y-auto p-5 sm:p-7">
          <AnnouncementTypeBadge
            type={announcement.announcement_type}
          />

          <h2
            id="announcement-title"
            className="mt-4 text-2xl font-extrabold leading-tight text-slate-900"
          >
            {announcement.title}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <CalendarDays size={15} />
            Published: {formatDate(announcement.publish_at)}
          </div>

          <div className="my-6 h-px bg-slate-100" />

          <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 sm:text-base">
            {announcement.message}
          </div>

          {announcement.expires_at && (
            <div className="mt-7 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
              This announcement is valid until{" "}
              <strong>
                {formatDate(announcement.expires_at)}
              </strong>.
            </div>
          )}

          <div className="mt-7 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#087F87] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#066B72]"
            >
              Done
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ========================================
// EMPTY STATE
// ========================================

function EmptyState({ search, activeFilter, onClear }) {
  let title = "No announcements yet";
  let description =
    "New updates from the platform will appear here.";

  if (search) {
    title = "No matching announcements";
    description = "Try another search term.";
  } else if (activeFilter === "unread") {
    title = "You're all caught up!";
    description = "You have read all available announcements.";
  } else if (activeFilter === "read") {
    title = "No read announcements";
    description = "Announcements you read will appear here.";
  }

  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Inbox size={29} />
      </span>

      <h2 className="mt-4 text-lg font-bold text-slate-800">
        {title}
      </h2>

      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>

      {(search || activeFilter !== "all") && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 text-sm font-bold text-cyan-800 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ========================================
// MAIN BUSINESS ANNOUNCEMENT PAGE
// ========================================

export default function BusinessAnnouncementsPage() {
  useAnnouncementSEO();

  const [businessId, setBusinessId] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [readError, setReadError] = useState("");

  // ========================================
  // LOAD ANNOUNCEMENTS
  // ========================================

  const loadAnnouncements = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const currentBusinessId = await getActiveBusinessId();

      setBusinessId(currentBusinessId);

      const result = await getBusinessAnnouncements(
        currentBusinessId
      );

      setAnnouncements(result);
    } catch (err) {
      console.error("Unable to load announcements:", err);

      setError(
        err?.message ||
          "Unable to load announcements. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements(true);
  }, [loadAnnouncements]);

  // ========================================
  // SUMMARY COUNTS
  // ========================================

  const unreadCount = useMemo(
    () => announcements.filter((item) => !item.is_read).length,
    [announcements]
  );

  const readCount = announcements.length - unreadCount;

  // ========================================
  // FILTER ANNOUNCEMENTS
  // ========================================

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return announcements.filter((item) => {
      if (activeFilter === "unread" && item.is_read) {
        return false;
      }

      if (activeFilter === "read" && !item.is_read) {
        return false;
      }

      if (!query) return true;

      return (
        String(item.title || "").toLowerCase().includes(query) ||
        String(item.message || "").toLowerCase().includes(query) ||
        String(item.announcement_type || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [announcements, activeFilter, search]);

  // ========================================
  // OPEN + MARK AS READ
  // ========================================

  const handleOpenAnnouncement = async (announcement) => {
    setReadError("");
    setSelectedAnnouncement(announcement);

    if (announcement.is_read || !businessId) {
      return;
    }

    try {
      await markBusinessAnnouncementRead(
        announcement.id,
        businessId
      );

      const readAt = new Date().toISOString();

      setAnnouncements((previous) =>
        previous.map((item) =>
          item.id === announcement.id
            ? {
                ...item,
                is_read: true,
                read_at: readAt,
              }
            : item
        )
      );

      setSelectedAnnouncement((previous) =>
        previous?.id === announcement.id
          ? {
              ...previous,
              is_read: true,
              read_at: readAt,
            }
          : previous
      );

      // Refresh Sidebar unread badge.
      window.dispatchEvent(
        new Event("amrit-jal-announcements-updated")
      );
    } catch (err) {
      console.error(
        "Unable to mark announcement as read:",
        err
      );

      setReadError(
        err?.message || "Unable to update read status."
      );
    }
  };

  // ========================================
  // CLOSE DETAILS
  // ========================================

  const closeDetails = useCallback(() => {
    setSelectedAnnouncement(null);
    setReadError("");
  }, []);

  // ========================================
  // RENDER
  // ========================================

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#F4F7FA] px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
      <div className="mx-auto max-w-6xl">

        {/* PAGE HEADER */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-800">
              <Megaphone size={17} />
              Communication Centre
            </div>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Announcements
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Important updates and notices from Amrit Jal.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadAnnouncements(false)}
            disabled={loading || refreshing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        {/* SUMMARY CARDS */}
        <section
          aria-label="Announcement summary"
          className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Total announcements
              </span>

              <span className="flex size-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
                <Bell size={19} />
              </span>
            </div>

            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {announcements.length}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-cyan-900">
                Unread
              </span>

              <span className="flex size-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">
                <Bell size={19} />
              </span>
            </div>

            <p className="mt-3 text-3xl font-extrabold text-cyan-900">
              {unreadCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Read
              </span>

              <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCheck size={19} />
              </span>
            </div>

            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {readCount}
            </p>
          </div>
        </section>

        {/* ERROR STATE */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2 text-sm text-rose-800">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />
              {error}
            </div>

            <button
              type="button"
              onClick={() => loadAnnouncements(true)}
              className="text-sm font-bold text-rose-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* FILTERS + SEARCH */}
        <section
          aria-label="Filter announcements"
          className="mt-7 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const count =
                filter.id === "all"
                  ? announcements.length
                  : filter.id === "unread"
                    ? unreadCount
                    : readCount;

              const active = activeFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    active
                      ? "bg-[#087F87] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filter.label}

                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-white text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search announcements..."
              aria-label="Search announcements"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
          </div>
        </section>

        {/* ANNOUNCEMENT LIST */}
        <section
          aria-label="Announcement list"
          className="mt-5"
        >
          {loading ? (
            <div
              className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white"
              aria-live="polite"
            >
              <RefreshCw
                size={27}
                className="animate-spin text-cyan-700"
              />

              <p className="mt-3 text-sm font-medium text-slate-500">
                Loading announcements...
              </p>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <EmptyState
              search={search}
              activeFilter={activeFilter}
              onClear={() => {
                setSearch("");
                setActiveFilter("all");
              }}
            />
          ) : (
            <div className="space-y-3">
              {filteredAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onOpen={handleOpenAnnouncement}
                />
              ))}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="mt-6 text-center text-xs text-slate-400">
          Announcements are provided by the Amrit Jal platform team.
        </footer>
      </div>

      {/* ANNOUNCEMENT DETAILS */}
      <AnnouncementDetails
        announcement={selectedAnnouncement}
        onClose={closeDetails}
      />

      {/* READ ERROR */}
      {readError && selectedAnnouncement && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-[110] flex max-w-sm items-start gap-2 rounded-xl border border-rose-200 bg-white p-4 text-sm text-rose-700 shadow-xl"
        >
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0"
          />

          <span>{readError}</span>

          <button
            type="button"
            onClick={() => setReadError("")}
            aria-label="Dismiss error"
            className="ml-2 text-rose-500"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </main>
  );
}
