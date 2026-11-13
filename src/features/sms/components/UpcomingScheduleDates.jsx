import { CalendarDays, Clock3 } from "lucide-react";

import {
  formatScheduleDate,
  generateScheduleDates,
} from "../utils/scheduleGenerator";

export default function UpcomingScheduleDates({
  reminder,
  count = 4,
}) {
  const dates = generateScheduleDates(reminder, {
    count,
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays size={17} className="text-blue-600" />

        <h3 className="text-sm font-semibold text-slate-800">
          Upcoming Schedule Dates
        </h3>
      </div>

      {!reminder?.enabled ? (
        <p className="text-sm text-slate-500">
          Enable payment reminder to view upcoming dates.
        </p>
      ) : dates.length === 0 ? (
        <p className="text-sm text-slate-500">
          No upcoming dates. Please check your reminder schedule.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {dates.map((date) => (
            <div
              key={date}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
            >
              <Clock3
                size={15}
                className="shrink-0 text-blue-500"
              />

              <span className="text-xs font-semibold text-slate-700">
                {formatScheduleDate(date)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}