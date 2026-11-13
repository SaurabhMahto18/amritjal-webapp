import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock3,
  CalendarOff,
  ChevronDown,
  Plus,
} from "lucide-react";

import { employeeService } from "../services/employeeService";
import { ErrorText, LoadingButton, Metric, Panel } from "./shared";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function localToday() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getCalendarDays(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1);
  const totalDays = new Date(year, monthNumber, 0).getDate();
  const mondayOffset = (firstDay.getDay() + 6) % 7;

  return [
    ...Array(mondayOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, index) =>
      `${year}-${String(monthNumber).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`
    ),
  ];
}

function getMonthName(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getApprovedLeaveDates(leaves) {
  const dates = new Set();

  leaves.forEach((leave) => {
    // Existing service saves leave as approved. Pending/rejected leaves
    // are intentionally not painted on the attendance calendar.
    if (leave.status && leave.status !== "approved") return;
    if (!leave.start_date) return;

    const start = new Date(`${leave.start_date}T00:00:00`);
    const end = new Date(
      `${leave.end_date || leave.start_date}T00:00:00`
    );

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

    for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.add(
        [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, "0"),
          String(date.getDate()).padStart(2, "0"),
        ].join("-")
      );
    }
  });

  return dates;
}

const DAY_STYLES = {
  present:
    "border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
  absent: "border-red-200 bg-red-100 text-red-800 hover:bg-red-200",
  leave: "border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-200",
  half_day:
    "border-orange-200 bg-orange-100 text-orange-800 hover:bg-orange-200",
  weekly_off:
    "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200",
  holiday: "border-sky-200 bg-sky-100 text-sky-800 hover:bg-sky-200",
  not_marked:
    "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50",
};

const LEGEND = [
  ["Present", "bg-emerald-500"],
  ["Absent", "bg-red-500"],
  ["Leave", "bg-amber-400"],
  ["Half Day", "bg-orange-400"],
  ["Weekly Off", "bg-slate-400"],
  ["Holiday", "bg-sky-500"],
  ["Not Marked", "bg-slate-300"],
];

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100";

function AccordionHeader({ title, subtitle, open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-slate-50"
    >
      <span>
        <span className="block font-semibold text-slate-900">{title}</span>
        <span className="mt-1 block text-xs text-slate-500">{subtitle}</span>
      </span>

      <ChevronDown
        size={20}
        className={`shrink-0 text-slate-500 transition-transform ${
          open ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

export default function AttendanceLeaveTab({ employee, month }) {
  const initialDate = localToday();
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);

  // Both forms are collapsed by default and can be opened independently.
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState(
    initialDate.startsWith(month) ? initialDate : `${month}-01`
  );
  const [status, setStatus] = useState("present");
  const [notes, setNotes] = useState("");

  const [leaveType, setLeaveType] = useState("casual");
  const [leaveStart, setLeaveStart] = useState(initialDate);
  const [leaveEnd, setLeaveEnd] = useState(initialDate);
  const [reason, setReason] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setError("");

    try {
      const [attendanceRows, leaveRows] = await Promise.all([
        employeeService.attendance(employee.id, month),
        employeeService.leaves(employee.id),
      ]);

      setAttendance(attendanceRows || []);
      setLeaves(leaveRows || []);
    } catch (err) {
      setError(err?.message || "Unable to load attendance and leave records.");
    }
  }, [employee.id, month]);

  useEffect(() => {
    load();
  }, [load]);

  // When the month changes, keep the selected date inside that month.
  useEffect(() => {
    if (!selectedDate.startsWith(month)) {
      setSelectedDate(`${month}-01`);
    }
  }, [month, selectedDate]);

  const calendarDays = useMemo(() => getCalendarDays(month), [month]);

  const attendanceMap = useMemo(() => {
    const map = {};
    attendance.forEach((row) => {
      map[row.attendance_date] = row;
    });
    return map;
  }, [attendance]);

  const approvedLeaveDates = useMemo(
    () => getApprovedLeaveDates(leaves),
    [leaves]
  );

  const getDayStatus = useCallback(
    (date) => {
      const record = attendanceMap[date];

      // A manually saved attendance entry takes priority over a leave entry.
      if (record) return record.status;
      if (approvedLeaveDates.has(date)) return "leave";
      return "not_marked";
    },
    [attendanceMap, approvedLeaveDates]
  );

  const counts = useMemo(() => {
    const result = {
      present: 0,
      absent: 0,
      half_day: 0,
      leave: 0,
      weekly_off: 0,
      holiday: 0,
    };

    calendarDays.forEach((date) => {
      if (!date) return;
      const dayStatus = getDayStatus(date);
      if (Object.prototype.hasOwnProperty.call(result, dayStatus)) {
        result[dayStatus] += 1;
      }
    });

    return result;
  }, [calendarDays, getDayStatus]);

  const notMarked = calendarDays.filter(
    (date) => date && getDayStatus(date) === "not_marked"
  ).length;

  const selectedRecord = attendanceMap[selectedDate];

  useEffect(() => {
    setStatus(selectedRecord?.status || "present");
    setNotes(selectedRecord?.notes || "");
  }, [selectedDate, selectedRecord]);

  async function saveAttendance(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await employeeService.saveAttendance({
        employee_id: employee.id,
        attendance_date: selectedDate,
        status,
        notes: notes.trim() || null,
      });

      await load();
      setSuccess("Attendance saved successfully.");
      setAttendanceOpen(false);
    } catch (err) {
      setError(err?.message || "Unable to save attendance.");
    } finally {
      setBusy(false);
    }
  }

  async function saveLeave(event) {
    event.preventDefault();

    if (leaveEnd < leaveStart) {
      setError("Leave end date cannot be before start date.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const start = new Date(`${leaveStart}T00:00:00`);
      const end = new Date(`${leaveEnd}T00:00:00`);
      const days = Math.round((end - start) / 86400000) + 1;

      await employeeService.saveLeave({
        employee_id: employee.id,
        leave_type: leaveType,
        start_date: leaveStart,
        end_date: leaveEnd,
        days,
        reason: reason.trim(),
        status: "approved",
      });

      setReason("");
      await load();
      setSuccess("Leave saved successfully.");
      setLeaveOpen(false);
    } catch (err) {
      setError(err?.message || "Unable to save leave.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* MONTH SUMMARY */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="Present" value={counts.present} icon={CheckCircle2} />
        <Metric label="Absent" value={counts.absent} icon={XCircle} />
        <Metric label="Half Days" value={counts.half_day} icon={Clock3} />
        <Metric label="Leave" value={counts.leave} icon={CalendarOff} />
        <Metric label="Not Marked" value={notMarked} icon={CalendarDays} />
      </div>

      {/* FEEDBACK */}
      <ErrorText error={error} />

      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          {success}
        </div>
      )}

      {/* COLLAPSIBLE FORMS */}
      <div className="space-y-3 flex flex-col sm:space-y-0 sm:space-x-3 sm:flex-row">
        {/* ATTENDANCE ACCORDION */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <AccordionHeader
            title="Mark Attendance"
            subtitle="Add or update daily attendance"
            open={attendanceOpen}
            onClick={() => setAttendanceOpen((value) => !value)}
          />

          {attendanceOpen && (
            <div className="border-t border-slate-100 p-4">
              <form
                onSubmit={saveAttendance}
                className="grid gap-3 sm:grid-cols-2"
              >
                <label className="text-sm font-medium text-slate-700">
                  Selected Date
                  <input
                    required
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Attendance Status
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className={inputClass}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half_day">Half Day</option>
                    <option value="weekly_off">Weekly Off</option>
                    <option value="holiday">Holiday</option>
                  </select>
                </label>

                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Notes (Optional)
                  <input
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Late arrival, shift note..."
                    className={inputClass}
                  />
                </label>

                <div className="sm:col-span-2">
                  <LoadingButton busy={busy}>
                    {selectedRecord ? "Update Attendance" : "Save Attendance"}
                  </LoadingButton>
                </div>
              </form>
            </div>
          )}
        </section>

        {/* LEAVE ACCORDION */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <AccordionHeader
            title="Add Employee Leave"
            subtitle="Record leave type, reason and date range"
            open={leaveOpen}
            onClick={() => setLeaveOpen((value) => !value)}
          />

          {leaveOpen && (
            <div className="border-t border-slate-100 p-4">
              <form
                onSubmit={saveLeave}
                className="grid gap-3 sm:grid-cols-2"
              >
                <label className="text-sm font-medium text-slate-700">
                  Leave Type
                  <select
                    value={leaveType}
                    onChange={(event) => setLeaveType(event.target.value)}
                    className={inputClass}
                  >
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Reason
                  <input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Leave reason"
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  From
                  <input
                    required
                    type="date"
                    value={leaveStart}
                    onChange={(event) => setLeaveStart(event.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  To
                  <input
                    required
                    type="date"
                    min={leaveStart}
                    value={leaveEnd}
                    onChange={(event) => setLeaveEnd(event.target.value)}
                    className={inputClass}
                  />
                </label>

                <div className="sm:col-span-2">
                  <LoadingButton busy={busy}>
                    <Plus size={16} />
                    Save Leave
                  </LoadingButton>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>

      {/* MONTHLY CALENDAR */}
      <Panel
        title="Monthly Attendance Calendar"
        subtitle="Select any date to view or update attendance."
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {getMonthName(month)}
            </h3>
            <p className="text-xs text-slate-500">
              Employee attendance overview
            </p>
          </div>

          <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-700">
            <CalendarDays size={21} />
          </div>
        </div>

        {/* COLOUR LEGEND */}
        <div className="mb-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
          {LEGEND.map(([label, color]) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              {label}
            </span>
          ))}
        </div>

        {/* CALENDAR GRID */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-slate-500"
            >
              {day}
            </div>
          ))}

          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} />;
            }

            const dayNumber = Number(date.slice(-2));
            const selected = selectedDate === date;
            const isToday = date === localToday();
            const dayStatus = getDayStatus(date);

            return (
              <button
                key={date}
                type="button"
                onClick={() => {
                  setSelectedDate(date);
                  setAttendanceOpen(true);
                }}
                aria-label={`${date}, ${dayStatus.replaceAll("_", " ")}`}
                aria-pressed={selected}
                className={`relative flex min-h-[58px] flex-col items-center justify-center rounded-xl border text-sm transition sm:min-h-[72px] ${
                  DAY_STYLES[dayStatus] || DAY_STYLES.not_marked
                } ${
                  selected ? "z-10 ring-2 ring-cyan-700 ring-offset-2" : ""
                }`}
              >
                <span className="font-bold">{dayNumber}</span>

                <span className="mt-1 hidden text-[10px] font-semibold capitalize sm:block">
                  {dayStatus.replaceAll("_", " ")}
                </span>

                {isToday && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cyan-700" />
                )}
              </button>
            );
          })}
        </div>

        {/* SELECTED DATE SUMMARY */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
          <div>
            <p className="text-xs text-slate-500">Selected Date</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatDate(selectedDate)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">Attendance Status</p>
            <p className="mt-1 text-sm font-semibold capitalize text-slate-900">
              {getDayStatus(selectedDate).replaceAll("_", " ")}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Select a calendar date to open the attendance form for that day.
        </p>
      </Panel>
    </div>
  );
}
