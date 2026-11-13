import { generateScheduleDates } from "../utils/scheduleGenerator";
import { validatePaymentReminder } from "../utils/smsValidators";

export const smsScheduleService = {
  getUpcomingDates(reminder, options = {}) {
    if (!reminder?.enabled) return [];

    const error = validatePaymentReminder(reminder);

    if (error) {
      throw new Error(error);
    }

    return generateScheduleDates(reminder, {
      count: options.count || 5,
      fromDate: options.fromDate,
    });
  },

  validate(reminder) {
    if (!reminder?.enabled) return null;
    return validatePaymentReminder(reminder);
  },
};