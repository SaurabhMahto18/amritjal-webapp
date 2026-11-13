
import { useEffect, useMemo, useState } from "react";

import {
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import useEvents from "../hooks/useEvents";

import EventFilters from "../components/EventFilters";
import EventSummary from "../components/EventSummary";
import EventTable from "../components/EventTable";
import EventFormModal from "../components/EventFormModal";

// ========================================
// SEO CONFIGURATION
// ========================================

const SEO = {
  title: "Events Management | Amrit Jal",
  description:
    "Manage customer events, event bookings, delivery quantities, payments and outstanding balances in Amrit Jal.",
  robots: "noindex, nofollow, noarchive",
};

// ========================================
// INITIAL FILTERS
// ========================================

const INITIAL_FILTERS = {
  from: "",
  to: "",
  status: "",
  duration: "",
  paymentStatus: "",
};

// ========================================
// SEO HELPER
// ========================================

function updateMetaTag(name, content) {
  const existingTag = document.querySelector(
    `meta[name="${name}"]`
  );

  const tag =
    existingTag || document.createElement("meta");

  const previousContent =
    existingTag?.getAttribute("content");

  tag.setAttribute("name", name);
  tag.setAttribute("content", content);

  if (!existingTag) {
    document.head.appendChild(tag);
  }

  return {
    tag,
    existed: Boolean(existingTag),
    previousContent,
  };
}

// ========================================
// DURATION FILTER
// ========================================

function isDuration(event, duration) {
  if (!duration) return true;

  if (!event.startOn || !event.endOn) return false;

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const start = new Date(
    `${event.startOn}T00:00:00`
  );

  const end = new Date(
    `${event.endOn}T23:59:59`
  );

  if (duration === "future") {
    return start > today;
  }

  if (duration === "today") {
    return start <= today && end >= today;
  }

  if (duration === "past") {
    return end < today;
  }

  return true;
}

// ========================================
// EVENTS PAGE
// ========================================

export default function EventsPage() {
  const {
    events,
    customers,
    loading,
    error,
    refresh,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useEvents();

  // ======================================
  // SEO METADATA
  // ======================================

  useEffect(() => {
    const previousTitle = document.title;

    document.title = SEO.title;

    const description = updateMetaTag(
      "description",
      SEO.description
    );

    const robots = updateMetaTag(
      "robots",
      SEO.robots
    );

    return () => {
      document.title = previousTitle;

      if (description.existed) {
        if (description.previousContent === null) {
          description.tag.removeAttribute("content");
        } else {
          description.tag.setAttribute(
            "content",
            description.previousContent
          );
        }
      } else {
        description.tag.remove();
      }

      if (robots.existed) {
        if (robots.previousContent === null) {
          robots.tag.removeAttribute("content");
        } else {
          robots.tag.setAttribute(
            "content",
            robots.previousContent
          );
        }
      } else {
        robots.tag.remove();
      }
    };
  }, []);

  // ======================================
  // STATES
  // ======================================

  const [search, setSearch] = useState("");

  const [filtersOpen, setFiltersOpen] =
    useState(false);

  const [summaryOpen, setSummaryOpen] =
    useState(false);

  const [filters, setFilters] =
    useState(INITIAL_FILTERS);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  // ======================================
  // FILTER EVENTS
  // ======================================

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
          String(value || "")
            .toLowerCase()
            .includes(query)
        );

      const matchesFrom =
        !filters.from ||
        event.startOn >= filters.from;

      const matchesTo =
        !filters.to ||
        event.startOn <= filters.to;

      const matchesStatus =
        !filters.status ||
        event.status === filters.status;

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

  // ======================================
  // CREATE / UPDATE EVENT
  // ======================================

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
        err.message || "Unable to save event."
      );

      throw err;
    } finally {
      setSaving(false);
    }
  }

  // ======================================
  // DELETE EVENT
  // ======================================

  async function remove(event) {
    const confirmed = window.confirm(
      `Delete event "${event.eventName}" for ${event.customerName}?`
    );

    if (!confirmed) return;

    setActionError("");

    try {
      await deleteEvent(event.id);
    } catch (err) {
      setActionError(
        err.message || "Unable to delete event."
      );
    }
  }

  // ======================================
  // CLEAR FILTERS
  // ======================================

  const clearFilters = () => {
    setFilters({ ...INITIAL_FILTERS });
  };

  // ======================================
  // RENDER
  // ======================================

  return (
    <main className="min-h-screen bg-[#edf2f7] px-3 py-5 text-slate-900 sm:px-5 lg:px-8">

      <div className="mx-auto max-w-[1600px] space-y-5">




        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">

            {/* SEARCH */}
            <div className="relative min-w-[180px] flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer..."
                aria-label="Search events"
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* FILTERS */}
            <button
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              aria-expanded={filtersOpen}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition ${filtersOpen
                  ? "border-[#087F8C] bg-[#DDF4F1] text-[#087F8C]"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
            >
              <Filter size={18} />
              Filters
            </button>

            {/* ADD EVENT - CENTER */}
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
                setActionError("");
              }}
              className="mx-auto inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#087F8C] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#066B76]"
            >
              <Plus size={18} />
              Add Event
            </button>

            {/* SUMMARY TOGGLE */}
            <button
              type="button"
              onClick={() => setSummaryOpen((value) => !value)}
              aria-label={summaryOpen ? "Hide event summary" : "Show event summary"}
              aria-expanded={summaryOpen}
              className="ml-auto flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            >
              {summaryOpen ? (
                <ChevronUp size={22} />
              ) : (
                <ChevronDown size={22} />
              )}
            </button>

          </div>
        </section>


        {/* =================================
            FILTER PANEL
        ================================== */}

        {filtersOpen && (
          <EventFilters
            filters={filters}
            setFilters={setFilters}
            onClear={clearFilters}
          />
        )}

        {/* =================================
            EVENT SUMMARY
        ================================== */}

        {summaryOpen && (
          <EventSummary
            events={filteredEvents}
          />
        )}

        {/* =================================
            ERROR MESSAGE
        ================================== */}

        {(error || actionError) && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            {actionError || error}
          </div>
        )}


        {/* =================================
            EVENT TABLE
        ================================== */}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center text-sm text-slate-500">

            <RefreshCw className="mx-auto mb-3 animate-spin" />

            Loading events...

          </div>
        ) : (
          <EventTable
            events={filteredEvents}
            onEdit={(event) => {
              setEditing(event);
              setModalOpen(true);
              setActionError("");
            }}
            onDelete={remove}
          />
        )}

      </div>

      {/* ===================================
          CREATE / EDIT EVENT MODAL
      ==================================== */}

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
