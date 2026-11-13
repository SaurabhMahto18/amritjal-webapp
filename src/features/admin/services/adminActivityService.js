
import { supabase } from "../../../lib/supabase";

const PAGE_SIZE = 50;
const IST_OFFSET = "+05:30";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Convert an IST calendar date into an ISO timestamp with IST offset.
function istBoundary(date, time = "00:00:00") {
  if (!date) return null;

  return `${date}T${time}${IST_OFFSET}`;
}

// Return the next calendar date without relying on browser timezone.
function nextCalendarDate(date) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));

  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function sanitizeSearchTerm(value) {
  return String(value || "")
    .trim()
    .replace(/[%_,()\\"]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 100);
}

function applyFilters(
  query,
  { action, tableName, startDate, endDate }
) {
  if (action && action !== "all") {
    query = query.eq("action", action);
  }

  if (tableName && tableName !== "all") {
    query = query.eq("table_name", tableName);
  }

  if (startDate) {
    query = query.gte(
      "created_at",
      istBoundary(startDate, "00:00:00")
    );
  }

  if (endDate) {
    const exclusiveEndDate = nextCalendarDate(endDate);

    query = query.lt(
      "created_at",
      istBoundary(exclusiveEndDate, "00:00:00")
    );
  }

  return query;
}

function applySearch(query, search) {
  const term = sanitizeSearchTerm(search);

  if (!term) return query;

  const pattern = `%${term}%`;

  const conditions = [
    `record_id.ilike.${pattern}`,
    `table_name.ilike.${pattern}`,
    `action.ilike.${pattern}`,
  ];

  // UUID columns must use exact equality, not ilike.
  if (UUID_REGEX.test(term)) {
    conditions.push(`admin_id.eq.${term}`);
    conditions.push(`business_id.eq.${term}`);
  }

  return query.or(conditions.join(","));
}

function validateDateRange(startDate, endDate) {
  if (startDate && endDate && startDate > endDate) {
    throw new Error("Start date cannot be after end date.");
  }
}

function getTodayInIST() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export const adminActivityService = {
  async getLogs({
    page = 1,
    search = "",
    action = "all",
    tableName = "all",
    startDate = "",
    endDate = "",
  } = {}) {
    validateDateRange(startDate, endDate);

    const safePage = Math.max(1, Number(page) || 1);

    let query = supabase
      .from("admin_activity_logs")
      .select(
        "id, admin_id, action, table_name, record_id, business_id, old_data, new_data, created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    query = applyFilters(query, {
      action,
      tableName,
      startDate,
      endDate,
    });

    query = applySearch(query, search);

    const from = (safePage - 1) * PAGE_SIZE;

    const { data, error, count } = await query.range(
      from,
      from + PAGE_SIZE - 1
    );

    if (error) throw error;

    const total = count || 0;

    return {
      logs: data || [],
      total,
      page: safePage,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    };
  },

  async getSummary() {
    const today = getTodayInIST();
    const tomorrow = nextCalendarDate(today);

    const todayStart = istBoundary(today, "00:00:00");
    const tomorrowStart = istBoundary(tomorrow, "00:00:00");

    // Exact database counts. No 1,000-row limit.
    const countQuery = (configure = (query) => query) => {
      let query = supabase
        .from("admin_activity_logs")
        .select("id", { count: "exact", head: true });

      return configure(query);
    };

    const [
      totalResult,
      todayResult,
      insertResult,
      updateResult,
      deleteResult,
    ] = await Promise.all([
      countQuery(),

      countQuery((query) =>
        query
          .gte("created_at", todayStart)
          .lt("created_at", tomorrowStart)
      ),

      countQuery((query) => query.eq("action", "INSERT")),

      countQuery((query) => query.eq("action", "UPDATE")),

      countQuery((query) => query.eq("action", "DELETE")),
    ]);

    const results = [
      totalResult,
      todayResult,
      insertResult,
      updateResult,
      deleteResult,
    ];

    const failedResult = results.find((result) => result.error);

    if (failedResult?.error) {
      throw failedResult.error;
    }

    return {
      total: totalResult.count || 0,
      today: todayResult.count || 0,
      inserts: insertResult.count || 0,
      updates: updateResult.count || 0,
      deletes: deleteResult.count || 0,
    };
  },
};
