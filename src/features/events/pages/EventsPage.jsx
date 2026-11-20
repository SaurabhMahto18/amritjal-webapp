
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  Filter,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import useEvents from "../hooks/useEvents";
import EventFilters from "../components/EventFilters";
import EventSummary from "../components/EventSummary";
import EventTable from "../components/EventTable";
import EventFormModal from "../components/EventFormModal";

const SEO = {
  title: "Events Management | Amrit Jal",
  description:
    "Manage customer events, event bookings, delivery quantities, payments and outstanding balances in Amrit Jal.",
  robots: "noindex, nofollow, noarchive",
};

const INITIAL_FILTERS = {
  from: "",
  to: "",
  status: "",
  duration: "",
  paymentStatus: "",
};

const QUICK_FILTERS = [
  { id: "", label: "All" },
  { id: "today", label: "Today" },
  { id: "future", label: "Upcoming" },
  { id: "past", label: "Past" },
];

function updateMetaTag(name, content) {
  const existingTag = document.querySelector(`meta[name="${name}"]`);
  const tag = existingTag || document.createElement("meta");
  const previousContent = existingTag?.getAttribute("content");

  tag.setAttribute("name", name);
  tag.setAttribute("content", content);

  if (!existingTag) document.head.appendChild(tag);

  return {
    tag,
    existed: Boolean(existingTag),
    previousContent,
  };
}

function parseLocalDate(value, endOfDay = false) {
  if (!value) return null;

  const date = new Date(
    `${value}T${endOfDay ? "23:59:59" : "00:00:00"}`
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatEventDate(value) {
  const date = parseLocalDate(value);

  if (!date) return "Not set";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isDuration(event, duration) {
  if (!duration) return true;

  if (!event.startOn || !event.endOn) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = parseLocalDate(event.startOn);
  const end = parseLocalDate(event.endOn, true);

  if (!start || !end) return false;

  if (duration === "future") return start > today;
  if (duration === "today") return start <= today && end >= today;
  if (duration === "past") return end < today;

  return true;
}

function getEventTiming(event) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = parseLocalDate(event.startOn);
  const end = parseLocalDate(event.endOn, true);

  if (!start || !end) return "Date not set";

  if (start <= today && end >= today) return "Happening today";

  if (start > today) {
    const days = Math.ceil(
      (start.getTime() - today.getTime()) / 86400000
    );

    return days === 1 ? "Starts tomorrow" : `In ${days} days`;
  }

  const days = Math.ceil(
    (today.getTime() - end.getTime()) / 86400000
  );

  return days === 1 ? "Ended yesterday" : `Ended ${days} days ago`;
}

function getStatusTone(value, kind = "status") {
  const normalized = String(value || "").toLowerCase();

  if (!normalized) {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }

  if (
    normalized.includes("paid") ||
    normalized.includes("complete") ||
    normalized.includes("confirmed") ||
    normalized.includes("done")
  ) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("reject") ||
    normalized.includes("overdue")
  ) {
    return "border-rose-100 bg-rose-50 text-rose-700";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("partial") ||
    normalized.includes("progress")
  ) {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  return kind === "payment"
    ? "border-violet-100 bg-violet-50 text-violet-700"
    : "border-sky-100 bg-sky-50 text-sky-700";
}

function StatusPill({ value, kind }) {
  const label = value
    ? String(value)
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : kind === "payment"
      ? "Payment not set"
      : "Status not set";

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-4 ${getStatusTone(
        value,
        kind
      )}`}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

/* ---------------------------------------------
   MOBILE EVENT CARD
--------------------------------------------- */

function EventMobileCard({ event, onEdit, onDelete }) {
  const phone = String(event.customerPhone || "").trim();

  const phoneHref = phone
    ? `tel:${phone.replace(/[^\d+]/g, "")}`
    : null;

  const sameDay = event.startOn && event.startOn === event.endOn;

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E2E9ED] bg-white shadow-[0_3px_12px_rgba(15,42,55,0.05)] transition hover:border-[#C9DDE3]">

      {/* CARD CONTENT */}
      <div className="p-3.5">
        <div className="flex items-start gap-3">

          {/* EVENT ICON */}
          <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[#E8F4F8] text-[#287DA3]">
            <CalendarDays size={17} />

            <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide">
              Event
            </span>
          </div>

          {/* EVENT INFORMATION */}
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-[14px] font-bold leading-5 text-[#183746]">
              {event.eventName || "Customer Event"}
            </h3>

            <p className="mt-1 truncate text-xs font-medium text-[#6D8591]">
              {event.customerName || "Customer not set"}
            </p>

            {phone ? (
              <a
                href={phoneHref}
                onClick={(clickEvent) => clickEvent.stopPropagation()}
                className="mt-1.5 inline-flex min-h-7 items-center gap-1.5 rounded-lg bg-[#EAF7F0] px-2.5 text-[11px] font-semibold text-[#16845B] transition hover:bg-[#DDF2E6] active:scale-[0.98]"
                aria-label={`Call ${event.customerName || "customer"}`}
              >
                <Phone size={12} />
                {phone}
              </a>
            ) : (
              <p className="mt-1.5 text-[10px] text-slate-400">
                No phone number
              </p>
            )}
          </div>

          {/* STATUS */}
          <div className="flex max-w-[112px] shrink-0 flex-col items-end gap-1.5">
            <StatusPill value={event.status} />
            <StatusPill
              value={event.paymentStatus}
              kind="payment"
            />
          </div>
        </div>

        {/* DATE INFORMATION */}
        <div className="mt-3 rounded-xl bg-[#F5F8FA] px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#91A3AC]">
                Event date{!sameDay && event.endOn ? "s" : ""}
              </p>

              <p className="mt-1 text-xs font-bold text-[#294553]">
                {formatEventDate(event.startOn)}
                {!sameDay && event.endOn
                  ? ` – ${formatEventDate(event.endOn)}`
                  : ""}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 text-[10px] font-semibold text-[#66818E]">
              <Clock3 size={12} />
              {getEventTiming(event)}
            </div>
          </div>
        </div>
      </div>

      {/* CARD FOOTER + ACTIONS */}
      <div className="flex items-center justify-between gap-2 border-t border-[#EDF1F3] px-3.5 py-2.5">
        <span className="min-w-0 truncate text-[10px] font-medium text-[#9AAAB2]">
          Event #{String(event.id || "").slice(-6) || "—"}
        </span>

        <div className="flex shrink-0 items-center gap-2">

          {/* EDIT BUTTON */}
          <button
            type="button"
            onClick={() => onEdit(event)}
            aria-label={`Edit ${event.eventName || "event"}`}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#DCE7EB] bg-white px-3 text-[11px] font-semibold text-[#45616E] transition hover:border-[#B9D2DA] hover:bg-[#F5FAFB] active:scale-95"
          >
            <Pencil size={12} />
            Edit
          </button>

          {/* DELETE BUTTON */}
          <button
            type="button"
            onClick={() => onDelete(event)}
            aria-label={`Delete ${event.eventName || "event"}`}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[11px] font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 active:scale-95"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

/* ---------------------------------------------
   EVENTS PAGE
--------------------------------------------- */

export default function EventsPage() {
  const {
    events = [],
    customers = [],
    loading,
    error,
    refresh,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useEvents();

  /* SEO */
  useEffect(() => {
    const previousTitle = document.title;

    document.title = SEO.title;

    const description = updateMetaTag(
      "description",
      SEO.description
    );

    const robots = updateMetaTag("robots", SEO.robots);

    return () => {
      document.title = previousTitle;

      for (const item of [description, robots]) {
        if (item.existed) {
          if (item.previousContent === null) {
            item.tag.removeAttribute("content");
          } else {
            item.tag.setAttribute(
              "content",
              item.previousContent
            );
          }
        } else {
          item.tag.remove();
        }
      }
    };
  }, []);

  /* STATE */
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [actionError, setActionError] = useState("");

  /* FILTER EVENTS */
  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !query ||
        [
          event.customerName,
          event.customerPhone,
          event.eventName,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      const matchesFrom =
        !filters.from || event.startOn >= filters.from;

      const matchesTo =
        !filters.to || event.startOn <= filters.to;

      const matchesStatus =
        !filters.status || event.status === filters.status;

      const matchesPayment =
        !filters.paymentStatus ||
        event.paymentStatus === filters.paymentStatus;

      const matchesDuration = isDuration(
        event,
        filters.duration
      );

      return (
        matchesSearch &&
        matchesFrom &&
        matchesTo &&
        matchesStatus &&
        matchesPayment &&
        matchesDuration
      );
    });
  }, [events, search, filters]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const hasActiveFilters =
    Boolean(search.trim()) || activeFilterCount > 0;

  /* CREATE EVENT */
  function openCreate() {
    setEditing(null);
    setModalOpen(true);
    setActionError("");
  }

  /* EDIT EVENT */
  function openEdit(event) {
    setEditing(event);
    setModalOpen(true);
    setActionError("");
  }

  /* SAVE EVENT */
  async function save(input) {
    setSaving(true);
    setActionError("");

    try {
      if (editing) {
        await updateEvent(editing.id, input);
      } else {
        await createEvent(input);
      }

      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      setActionError(
        err?.message || "Unable to save event."
      );

      throw err;
    } finally {
      setSaving(false);
    }
  }

  /* DELETE EVENT */
  async function remove(event) {
    const confirmed = window.confirm(
      `Delete event "${event.eventName || "Customer Event"}" for ${
        event.customerName || "this customer"
      }?`
    );

    if (!confirmed) return;

    setActionError("");

    try {
      await deleteEvent(event.id);
    } catch (err) {
      setActionError(
        err?.message || "Unable to delete event."
      );
    }
  }

  /* REFRESH */
  async function handleRefresh() {
    setRefreshing(true);
    setActionError("");

    try {
      await refresh();
    } catch (err) {
      setActionError(
        err?.message || "Unable to refresh events."
      );
    } finally {
      setRefreshing(false);
    }
  }

  /* CLEAR FILTERS */
  function clearFilters() {
    setSearch("");
    setFilters({ ...INITIAL_FILTERS });
  }

  function setQuickDuration(duration) {
    setFilters((current) => ({
      ...current,
      duration,
    }));
  }

  return (
    <main className="min-h-screen bg-[#F3F7F8] px-3 pb-24 pt-3 text-[#183746] sm:px-6 sm:py-6 sm:pb-8 lg:px-8">
      <div className="mx-auto w-full max-w-[1500px] space-y-3.5 sm:space-y-5">

        {/* SEARCH + FILTER CONTROLS */}
        <section className="rounded-xl border border-[#E0E9EC] bg-white p-2.5 shadow-sm sm:rounded-2xl sm:p-4">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#91A3AC]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search event or customer..."
                aria-label="Search events"
                className="h-9 w-full rounded-lg border border-[#E1E9EC] bg-[#F8FAFB] pl-9 pr-9 text-[11px] outline-none transition placeholder:text-[#9AAAB2] focus:border-[#087F8C] focus:bg-white focus:ring-2 focus:ring-[#087F8C]/10 sm:h-11 sm:rounded-xl sm:text-sm"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#91A3AC] hover:bg-slate-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setFiltersOpen((value) => !value)
              }
              aria-expanded={filtersOpen}
              className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border px-2.5 text-[11px] font-semibold transition sm:h-11 sm:gap-1.5 sm:rounded-xl sm:px-4 sm:text-sm ${
                filtersOpen
                  ? "border-[#087F8C] bg-[#DDF4F1] text-[#087F8C]"
                  : "border-[#E1E9EC] bg-white text-[#607987] hover:bg-slate-50"
              }`}
            >
              <Filter size={14} className="sm:size-[15px]" />

              Filters

              {activeFilterCount > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-[#087F8C] text-[9px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* QUICK DURATION FILTERS */}
          <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-3 sm:gap-1.5 sm:pb-0.5">
            {QUICK_FILTERS.map((item) => {
              const selected = filters.duration === item.id;

              return (
                <button
                  key={item.id || "all"}
                  type="button"
                  onClick={() => setQuickDuration(item.id)}
                  aria-pressed={selected}
                  className={`min-h-7 shrink-0 rounded-full border px-2.5 text-[10px] font-semibold transition sm:min-h-8 sm:px-3 sm:text-[11px] ${
                    selected
                      ? "border-[#087F8C] bg-[#087F8C] text-white"
                      : "border-[#E1E9EC] bg-white text-[#6D8591] hover:bg-[#F5FAFB]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto min-h-7 shrink-0 px-2 text-[10px] font-semibold text-[#087F8C] sm:min-h-8 sm:text-[11px]"
              >
                Reset
              </button>
            )}
          </div>
        </section>

        {/* ADVANCED FILTERS */}
        {filtersOpen && (
          <EventFilters
            filters={filters}
            setFilters={setFilters}
            onClear={() =>
              setFilters({ ...INITIAL_FILTERS })
            }
          />
        )}

        {/* EVENT SUMMARY */}
        <section className="overflow-hidden rounded-2xl border border-[#E0E9EC] bg-white shadow-sm">
          <button
            type="button"
            onClick={() =>
              setSummaryOpen((value) => !value)
            }
            aria-expanded={summaryOpen}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left sm:gap-3 sm:px-5 sm:py-3"
          >
            <span>
              <span className="block text-sm font-bold text-[#294553]">
                Event overview
              </span>

              <span className="mt-0.5 block text-[9px] leading-3 text-[#91A3AC] sm:text-xs">
                Quick summary of the current event results
              </span>
            </span>

            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#F2F7F8] text-[#607987] sm:size-8">
              {summaryOpen ? (
                <ChevronUp size={17} />
              ) : (
                <ChevronDown size={17} />
              )}
            </span>
          </button>

          {summaryOpen && (
            <div className="event-summary-compact border-t border-[#EDF1F3] p-2 sm:p-4">
              <EventSummary events={filteredEvents} />

              <style>{`
                @media (max-width: 639px) {
                  .event-summary-compact [class*="rounded-2xl"],
                  .event-summary-compact [class*="rounded-xl"] {
                    border-radius: 0.75rem !important;
                  }

                  .event-summary-compact [class*="p-5"],
                  .event-summary-compact [class*="p-4"] {
                    padding: 0.65rem !important;
                  }

                  .event-summary-compact [class*="p-3"] {
                    padding: 0.6rem !important;
                  }

                  .event-summary-compact [class*="gap-4"],
                  .event-summary-compact [class*="gap-3"] {
                    gap: 0.5rem !important;
                  }

                  .event-summary-compact [class*="size-12"],
                  .event-summary-compact [class*="h-12"],
                  .event-summary-compact [class*="w-12"] {
                    width: 2.25rem !important;
                    height: 2.25rem !important;
                  }

                  .event-summary-compact [class*="text-2xl"] {
                    font-size: 1.125rem !important;
                    line-height: 1.4rem !important;
                  }

                  .event-summary-compact [class*="text-xl"] {
                    font-size: 1rem !important;
                    line-height: 1.25rem !important;
                  }

                  .event-summary-compact [class*="mt-3"] {
                    margin-top: 0.4rem !important;
                  }
                }
              `}</style>
            </div>
          )}
        </section>

        {/* ERROR MESSAGE */}
        {(error || actionError) && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 sm:p-4 sm:text-sm"
          >
            <X size={15} className="mt-0.5 shrink-0" />
            <span>{actionError || error}</span>
          </div>
        )}

        {/* EVENT RESULTS */}
        <section className="overflow-hidden rounded-2xl border border-[#E0E9EC] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-[#EDF1F3] px-3.5 py-3 sm:px-5 sm:py-4">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#102D3A] sm:text-base">
                Your Events
              </h2>

              <p className="mt-0.5 text-[10px] text-[#91A3AC] sm:text-xs">
                {filteredEvents.length} matching{" "}
                {filteredEvents.length === 1 ? "event" : "events"}
              </p>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[#087F8C] hover:bg-[#EFF9F7]"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center text-[#8299A5] sm:py-16">
              <RefreshCw
                size={24}
                className="animate-spin text-[#087F8C]"
              />

              <p className="mt-3 text-xs font-semibold sm:text-sm">
                Loading events...
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            /* EMPTY STATE */
            <div className="px-5 py-12 text-center sm:py-16">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#EAF7F5] text-[#087F8C]">
                <CalendarDays size={23} />
              </span>

              <h3 className="mt-3 text-sm font-bold text-[#294553] sm:text-base">
                {hasActiveFilters
                  ? "No matching events"
                  : "No events yet"}
              </h3>

              <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#91A3AC] sm:text-sm">
                {hasActiveFilters
                  ? "Try changing your search or filters."
                  : "Create your first event to start managing customer bookings."}
              </p>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-xl border border-[#DCE8EA] px-4 py-2 text-xs font-semibold text-[#607987]"
                >
                  Reset filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-4 hidden h-10 items-center gap-2 rounded-xl bg-[#087F8C] px-4 text-xs font-semibold text-white sm:inline-flex"
                >
                  <Plus size={15} />
                  Add Event
                </button>
              )}
            </div>
          ) : (
            <>
              {/* MOBILE EVENT CARDS */}
              <div className="space-y-2.5 bg-[#F4F7F8] p-2.5 md:hidden">
                {filteredEvents.map((event) => (
                  <EventMobileCard
                    key={event.id}
                    event={event}
                    onEdit={openEdit}
                    onDelete={remove}
                  />
                ))}
              </div>

              {/* DESKTOP TABLE */}
              <div className="hidden md:block">
                <EventTable
                  events={filteredEvents}
                  onEdit={openEdit}
                  onDelete={remove}
                />
              </div>
            </>
          )}
        </section>
      </div>

      {/* MOBILE ADD EVENT BUTTON */}
      <button
        type="button"
        onClick={openCreate}
        aria-label="Add event"
        className="fixed bottom-5 right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[#087F8C] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(8,127,140,0.32)] transition hover:bg-[#066B76] active:scale-95 sm:hidden"
      >
        <Plus size={19} />
        Add Event
      </button>

      {/* CREATE / EDIT MODAL */}
      <EventFormModal
        open={modalOpen}
        event={editing}
        customers={customers}
        saving={saving}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setEditing(null);
          }
        }}
        onSave={save}
      />
    </main>
  );
}
