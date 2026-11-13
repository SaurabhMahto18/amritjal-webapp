import {
  REPEAT_TYPES,
  END_OF_MONTH,
} from "./smsConstants";

function parseLocalDate(value) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addDays(date, amount) {
  const result = new Date(date);

  result.setDate(result.getDate() + amount);

  return result;
}

function getMonthlyDates(reminder, year, monthIndex) {
  const lastDay = daysInMonth(year, monthIndex);

  const selectedDates = (reminder.month_dates || [])
    .map(Number)
    .filter(
      (day) =>
        Number.isInteger(day) &&
        day >= 1 &&
        day <= 31
    );

  const dates = selectedDates.map(
    (day) => Math.min(day, lastDay)
  );

  if (reminder.end_of_month) {
    dates.push(lastDay);
  }

  return [...new Set(dates)].sort((a, b) => a - b);
}

/**
 * Generate upcoming payment reminder dates.
 *
 * @param {Object} reminder Reminder configuration
 * @param {Object} options Optional generation settings
 * @param {number} options.count Number of dates to return
 * @param {string} options.fromDate Local YYYY-MM-DD starting date
 *
 * @returns {string[]} Array of local YYYY-MM-DD dates
 */
export function generateScheduleDates(
  reminder,
  {
    count = 4,
    fromDate,
  } = {}
) {
  if (!reminder?.enabled || !reminder.start_date) {
    return [];
  }

  const startDate = parseLocalDate(reminder.start_date);

  if (!startDate || count <= 0) {
    return [];
  }

  const minimumDate = fromDate
    ? parseLocalDate(fromDate)
    : new Date();

  if (!minimumDate) return [];

  minimumDate.setHours(0, 0, 0, 0);

  const results = [];
  let cursor = new Date(startDate);

  cursor.setHours(0, 0, 0, 0);

  // Do not return dates before the configured start date.
  if (cursor < minimumDate) {
    cursor = new Date(minimumDate);
  }

  const repeatType = reminder.repeat_type;

  // DAILY
  if (repeatType === REPEAT_TYPES.DAILY) {
    while (results.length < count) {
      results.push(formatLocalDate(cursor));
      cursor = addDays(cursor, 1);
    }

    return results;
  }

  // WEEKDAYS
  if (repeatType === REPEAT_TYPES.WEEKDAYS) {
    const weekdays = (reminder.weekdays || [])
      .map(Number)
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);

    if (!weekdays.length) return [];

    let safety = 0;

    while (results.length < count && safety < 3700) {
      if (weekdays.includes(cursor.getDay())) {
        results.push(formatLocalDate(cursor));
      }

      cursor = addDays(cursor, 1);
      safety += 1;
    }

    return results;
  }

  // MONTHLY
  if (repeatType === REPEAT_TYPES.MONTHLY) {
    let safety = 0;

    while (results.length < count && safety < 240) {
      const year = cursor.getFullYear();
      const monthIndex = cursor.getMonth();

      const dates = getMonthlyDates(
        reminder,
        year,
        monthIndex
      );

      for (const day of dates) {
        const candidate = new Date(year, monthIndex, day);

        candidate.setHours(0, 0, 0, 0);

        if (
          candidate >= startDate &&
          candidate >= minimumDate &&
          results.length < count
        ) {
          results.push(formatLocalDate(candidate));
        }
      }

      cursor = new Date(year, monthIndex + 1, 1);
      safety += 1;
    }

    return results;
  }

  return [];
}

export function formatScheduleDate(value, options = {}) {
  const date = parseLocalDate(value);

  if (!date) return "";

  return date.toLocaleDateString(
    options.locale || "en-IN",
    {
      day: "2-digit",
      month: "short",
      ...(options.year ? { year: "numeric" } : {}),
    }
  );
}

export function getEndOfMonthDate(year, monthIndex) {
  return daysInMonth(year, monthIndex);
}

export function getTodayLocalDate() {
  return formatLocalDate(new Date());
}