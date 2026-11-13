import { useCallback, useMemo, useState } from "react";
import { DEFAULT_PAYMENT_REMINDER } from "../utils/smsConstants";
import {
  generateScheduleDates,
  getTodayLocalDate,
} from "../utils/scheduleGenerator";
import { validatePaymentReminder } from "../utils/smsValidators";

export function usePaymentReminder(initialValue = {}) {
  const [reminder, setReminder] = useState(() => ({
    ...DEFAULT_PAYMENT_REMINDER,
    ...initialValue,
    weekdays: initialValue.weekdays || [0, 1, 2, 3, 4, 5, 6],
    month_dates: initialValue.month_dates || [1],
  }));

  const updateReminder = useCallback((updates) => {
    setReminder((current) => ({
      ...current,
      ...updates,
    }));
  }, []);

  const resetReminder = useCallback(() => {
    setReminder({ ...DEFAULT_PAYMENT_REMINDER });
  }, []);

  const validationError = useMemo(
    () => validatePaymentReminder(reminder),
    [reminder]
  );

  const upcomingDates = useMemo(
    () =>
      generateScheduleDates(reminder, {
        count: 5,
        fromDate: getTodayLocalDate(),
      }),
    [reminder]
  );

  return {
    reminder,
    updateReminder,
    resetReminder,
    validationError,
    upcomingDates,
    isValid: !reminder.enabled || !validationError,
  };
}