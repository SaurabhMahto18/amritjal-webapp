export function isValidDate(value) {
  if (!value || typeof value !== "string") {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export function isValidMobile(value) {
  if (!value) return false;

  const digits = String(value).replace(/\D/g, "");

  return digits.length >= 10 && digits.length <= 15;
}

export function validatePaymentReminder(reminder = {}) {
  const errors = {};

  if (!isValidDate(reminder.start_date)) {
    errors.start_date = "Please select a valid reminder date.";
  }

  if (
    !["daily", "weekdays", "monthly"].includes(
      reminder.repeat_type
    )
  ) {
    errors.repeat_type = "Please select a valid repeat option.";
  }

  if (
    reminder.repeat_type === "weekdays" &&
    (!Array.isArray(reminder.weekdays) ||
      reminder.weekdays.length === 0)
  ) {
    errors.weekdays = "Select at least one weekday.";
  }

  if (reminder.repeat_type === "monthly") {
    const dates = reminder.month_dates || [];

    if (
      !Array.isArray(dates) ||
      (dates.length === 0 && !reminder.end_of_month)
    ) {
      errors.month_dates =
        "Select at least one monthly date.";
    }

    if (
      dates.some(
        (day) =>
          !Number.isInteger(Number(day)) ||
          Number(day) < 1 ||
          Number(day) > 31
      )
    ) {
      errors.month_dates = "Monthly dates must be between 1 and 31.";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateSmsSettings(settings = {}) {
  const errors = {};

  if (
    settings.channel &&
    !["message", "whatsapp"].includes(settings.channel)
  ) {
    errors.channel = "Invalid message channel.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function normalizeMobile(value) {
  return String(value || "").replace(/\D/g, "");
}