
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PackageCheck,
  PackageX,
  Truck,
  Plus,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  MapPin,
  ClipboardList,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

import { employeeService } from "../services/employeeService";

import {
  Empty,
  ErrorText,
  LoadingButton,
  Metric,
  Panel,
  SearchBox,
  dateLabel,
  useFilter,
} from "./shared";

// Local date helper: avoids UTC date mismatch
function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const initial = () => ({
  dispatch_date: todayLocal(),
  trip_label: "",
  area: "",
  vehicle_number: "",
  jars_taken: "",
  jars_delivered: "",
  jars_returned: "0",
  jars_damaged: "0",
  jars_missing: "0",
  notes: "",
});

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  step,
  placeholder,
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}

      <input
        type={type}
        value={value}
        required={required}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  );
}

export default function DeliveryPerformanceTab({ employee, month }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initial);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dropdown closed by default
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");

      const result = await employeeService.dispatches(
        employee.id,
        month
      );

      setRows(result || []);
    } catch (e) {
      setError(e);
    }
  }, [employee.id, month]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (a, r) => ({
          trips: a.trips + 1,
          taken: a.taken + Number(r.jars_taken || 0),
          delivered: a.delivered + Number(r.jars_delivered || 0),
          returned: a.returned + Number(r.jars_returned || 0),
          damaged: a.damaged + Number(r.jars_damaged || 0),
          missing: a.missing + Number(r.jars_missing || 0),
          pending: a.pending + Number(r.pending_jars || 0),
        }),
        {
          trips: 0,
          taken: 0,
          delivered: 0,
          returned: 0,
          damaged: 0,
          missing: 0,
          pending: 0,
        }
      ),
    [rows]
  );

  const { query, setQuery, filtered } = useFilter(rows, [
    "trip_label",
    "area",
    "vehicle_number",
    "notes",
    "dispatch_date",
  ]);

  const jarsTaken = Number(form.jars_taken || 0);
  const jarsDelivered = Number(form.jars_delivered || 0);
  const jarsReturned = Number(form.jars_returned || 0);
  const jarsDamaged = Number(form.jars_damaged || 0);
  const jarsMissing = Number(form.jars_missing || 0);

  const pendingPreview =
    jarsTaken -
    jarsDelivered -
    jarsReturned -
    jarsDamaged -
    jarsMissing;

  function change(key, value) {
    setForm((old) => ({
      ...old,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(initial());
  }

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const numericFields = [
        ["Jars taken", jarsTaken],
        ["Jars delivered", jarsDelivered],
        ["Jars returned", jarsReturned],
        ["Damaged jars", jarsDamaged],
        ["Missing jars", jarsMissing],
      ];

      for (const [label, value] of numericFields) {
        if (!Number.isInteger(value) || value < 0) {
          throw new Error(
            `${label} must be a valid non-negative whole number.`
          );
        }
      }

      if (jarsTaken <= 0) {
        throw new Error("Enter at least one jar taken.");
      }

      if (pendingPreview < 0) {
        throw new Error(
          "Delivered, returned, damaged and missing jars cannot exceed jars taken."
        );
      }

      if (!form.dispatch_date) {
        throw new Error("Select a trip date.");
      }

      await employeeService.saveDispatch({
        ...form,
        employee_id: employee.id,
        jars_taken: jarsTaken,
        jars_delivered: jarsDelivered,
        jars_returned: jarsReturned,
        jars_damaged: jarsDamaged,
        jars_missing: jarsMissing,
      });

      resetForm();
      setSuccess("Delivery trip recorded successfully.");
      setFormOpen(false);

      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">

      {/* PERFORMANCE SUMMARY */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Metric
          label="Total trips"
          value={totals.trips}
          icon={Truck}
        />

        <Metric
          label="Jars taken"
          value={totals.taken}
        />

        <Metric
          label="Delivered"
          value={totals.delivered}
          icon={PackageCheck}
        />

        <Metric
          label="Returned"
          value={totals.returned}
        />

        <Metric
          label="Damaged / missing"
          value={totals.damaged + totals.missing}
          icon={PackageX}
        />

        <Metric
          label="Pending jars"
          value={totals.pending}
        />
      </div>

      <ErrorText error={error} />

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* ADD TRIP ACCORDION */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <button
          type="button"
          onClick={() => {
            setFormOpen((old) => !old);
            setError("");
            setSuccess("");
          }}
          aria-expanded={formOpen}
          className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-slate-50 sm:p-5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <Truck size={21} />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                Add Delivery Trip
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                Record trip details and jar movement
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 sm:inline">
              {formOpen ? "Close form" : "Add new trip"}
            </span>

            {formOpen ? (
              <ChevronUp size={20} className="text-slate-500" />
            ) : (
              <ChevronDown size={20} className="text-slate-500" />
            )}
          </div>
        </button>

        {formOpen && (
          <div className="border-t border-slate-100 p-4 sm:p-5">

            <form onSubmit={submit} className="space-y-6">

              {/* SECTION 1: TRIP INFORMATION */}
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays size={18} className="text-cyan-700" />

                  <h4 className="font-semibold text-slate-800">
                    Trip Information
                  </h4>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  <FormField
                    label="Trip Date"
                    type="date"
                    value={form.dispatch_date}
                    onChange={(v) => change("dispatch_date", v)}
                    required
                  />

                  <FormField
                    label="Trip / Shift"
                    value={form.trip_label}
                    onChange={(v) => change("trip_label", v)}
                    placeholder="Morning / Evening / Trip 1"
                  />

                  <FormField
                    label="Delivery Area"
                    value={form.area}
                    onChange={(v) => change("area", v)}
                    placeholder="Area / Locality"
                  />

                  <FormField
                    label="Vehicle Number"
                    value={form.vehicle_number}
                    onChange={(v) => change("vehicle_number", v)}
                    placeholder="JH-01-AB-1234"
                  />

                </div>
              </section>

              <div className="border-t border-slate-100" />

              {/* SECTION 2: JAR MOVEMENT */}
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <PackageCheck size={18} className="text-cyan-700" />

                  <h4 className="font-semibold text-slate-800">
                    Jar Movement Details
                  </h4>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

                  <FormField
                    label="Jars Taken *"
                    type="number"
                    min="1"
                    step="1"
                    value={form.jars_taken}
                    onChange={(v) => change("jars_taken", v)}
                    placeholder="0"
                    required
                  />

                  <FormField
                    label="Jars Delivered"
                    type="number"
                    min="0"
                    step="1"
                    value={form.jars_delivered}
                    onChange={(v) => change("jars_delivered", v)}
                    placeholder="0"
                  />

                  <FormField
                    label="Jars Returned"
                    type="number"
                    min="0"
                    step="1"
                    value={form.jars_returned}
                    onChange={(v) => change("jars_returned", v)}
                    placeholder="0"
                  />

                  <FormField
                    label="Damaged Jars"
                    type="number"
                    min="0"
                    step="1"
                    value={form.jars_damaged}
                    onChange={(v) => change("jars_damaged", v)}
                    placeholder="0"
                  />

                  <FormField
                    label="Missing Jars"
                    type="number"
                    min="0"
                    step="1"
                    value={form.jars_missing}
                    onChange={(v) => change("jars_missing", v)}
                    placeholder="0"
                  />

                </div>

                {/* PENDING CALCULATION */}
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">

                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Pending Jars
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Taken − Delivered − Returned − Damaged − Missing
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold tabular-nums ${
                          pendingPreview < 0
                            ? "text-red-600"
                            : "text-slate-900"
                        }`}
                      >
                        {pendingPreview}
                      </p>

                      <p className="text-xs text-slate-500">
                        Remaining jars
                      </p>
                    </div>
                  </div>

                  {pendingPreview < 0 && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      Jar quantities exceed the total jars taken.
                    </p>
                  )}
                </div>
              </section>

              <div className="border-t border-slate-100" />

              {/* SECTION 3: NOTES */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardList size={18} className="text-cyan-700" />

                  <h4 className="font-semibold text-slate-800">
                    Additional Details
                  </h4>
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Trip Notes

                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => change("notes", e.target.value)}
                    placeholder="Add any trip remarks, collection issues or other details..."
                    className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
              </section>

              {/* ACTIONS */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>

                <LoadingButton busy={busy}>
                  <Plus size={17} />
                  Save Delivery Trip
                </LoadingButton>

              </div>

            </form>
          </div>
        )}
      </div>

      {/* TRIP HISTORY */}
      <Panel
        title="Trip History"
        subtitle={`${month} · Employee dispatch records`}
        action={
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search trip, area, vehicle..."
          />
        }
      >

        {filtered.length ? (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-left text-sm">

              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  {[
                    "Date",
                    "Trip / Area",
                    "Vehicle",
                    "Taken",
                    "Delivered",
                    "Returned",
                    "Damaged",
                    "Missing",
                    "Pending",
                  ].map((heading) => (
                    <th key={heading} className="py-3 pr-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filtered.map((r) => (
                  <tr key={r.id} className="transition hover:bg-slate-50">

                    <td className="py-3 pr-3 whitespace-nowrap text-slate-600">
                      {dateLabel(r.dispatch_date)}
                    </td>

                    <td className="py-3 pr-3">
                      <p className="font-medium text-slate-800">
                        {r.trip_label || "Trip"}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={12} />
                        {r.area || "Area not specified"}
                      </p>
                    </td>

                    <td className="pr-3 text-slate-600">
                      {r.vehicle_number || "—"}
                    </td>

                    {[
                      "jars_taken",
                      "jars_delivered",
                      "jars_returned",
                      "jars_damaged",
                      "jars_missing",
                      "pending_jars",
                    ].map((key) => (
                      <td
                        key={key}
                        className="pr-3 tabular-nums text-slate-700"
                      >
                        {Number(r[key] || 0)}
                      </td>
                    ))}

                  </tr>
                ))}

              </tbody>
            </table>

          </div>
        ) : (
          <Empty>
            No trip records found for this month.
          </Empty>
        )}

      </Panel>

    </div>
  );
}
