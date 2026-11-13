import {
  DEFAULT_PAYMENT_REMINDER,
} from "../utils/smsConstants";

import {
  validatePaymentReminder,
} from "../utils/smsValidators";

import NotificationToggle from "./NotificationToggle";
import MessageChannelSelector from "./MessageChannelSelector";
import RepeatSelector from "./RepeatSelector";
import WeekdaySelector from "./WeekdaySelector";
import MonthlyDateSelector from "./MonthlyDateSelector";
import UpcomingScheduleDates from "./UpcomingScheduleDates";

export default function PaymentReminder({
  value = {},
  onChange,
  disabled = false,
}) {
  const reminder = {
    ...DEFAULT_PAYMENT_REMINDER,
    ...value,
  };

  const update = (key, nextValue) => {
    onChange?.({
      ...reminder,
      [key]: nextValue,
    });
  };

  const validation = validatePaymentReminder(reminder);

  return (
    <div className="space-y-4">
      {/* ENABLE REMINDER */}

      <NotificationToggle
        title="Enable Auto Notification"
        description="Automatically remind this customer about outstanding payments according to the selected schedule."
        checked={Boolean(reminder.enabled)}
        onChange={(checked) => update("enabled", checked)}
        disabled={disabled}
      />

      {reminder.enabled && (
        <div className="space-y-4 rounded-xl border border-slate-200 p-4">
          {/* START DATE */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Reminder Start Date
            </label>

            <input
              type="date"
              value={reminder.start_date || ""}
              onChange={(e) =>
                update("start_date", e.target.value)
              }
              disabled={disabled}
              className="h-11 w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
            />

            {validation.errors.start_date && (
              <p className="mt-1 text-xs text-rose-600">
                {validation.errors.start_date}
              </p>
            )}
          </div>

          {/* CHANNEL */}

          <MessageChannelSelector
            value={reminder.channel}
            onChange={(channel) => update("channel", channel)}
            disabled={disabled}
          />

          {/* REPEAT */}

          <RepeatSelector
            value={reminder.repeat_type}
            onChange={(repeatType) =>
              update("repeat_type", repeatType)
            }
            disabled={disabled}
          />

          {/* WEEKDAYS */}

          {reminder.repeat_type === "weekdays" && (
            <WeekdaySelector
              value={reminder.weekdays}
              onChange={(weekdays) =>
                update("weekdays", weekdays)
              }
              disabled={disabled}
            />
          )}

          {/* MONTHLY DATES */}

          {reminder.repeat_type === "monthly" && (
            <MonthlyDateSelector
              value={reminder.month_dates}
              endOfMonth={reminder.end_of_month}
              onChange={(dates) =>
                update("month_dates", dates)
              }
              onEndOfMonthChange={(checked) =>
                update("end_of_month", checked)
              }
              disabled={disabled}
            />
          )}

          {/* UPCOMING DATES */}

          <UpcomingScheduleDates
            reminder={reminder}
            count={4}
          />

          {/* VALIDATION */}

          {!validation.valid && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-xs font-medium text-amber-800">
                Complete the reminder schedule before saving.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}