import { useEffect, useState } from "react";
import { X } from "lucide-react";

const EMPTY = {
  customerId: "",
  eventName: "",
  startOn: "",
  endOn: "",
  status: "pending",
  paymentStatus: "pending",
  eventInvoice: "",
  dueAmount: "",
  advanceAmount: "",
  eventPayment: "",
  delivered: "",
  received: "",
  notes: "",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function EventFormModal({
  open,
  event,
  customers = [],
  onClose,
  onSave,
  saving,
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setError("");

    setForm(
      event
        ? {
            customerId: event.customerId || "",
            eventName: event.eventName || "",
            startOn: event.startOn || "",
            endOn: event.endOn || "",
            status: event.status || "pending",
            paymentStatus: event.paymentStatus || "pending",
            eventInvoice: event.eventInvoice ?? "",
            dueAmount: event.dueAmount ?? "",
            advanceAmount: event.advanceAmount ?? "",
            eventPayment: event.eventPayment ?? "",
            delivered: event.delivered ?? "",
            received: event.received ?? "",
            notes: event.notes || "",
          }
        : EMPTY
    );
  }, [open, event]);

  if (!open) return null;

  const set = (key, value) => {
    setForm((old) => ({
      ...old,
      [key]: value,
    }));
  };

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (
      !form.customerId ||
      !form.eventName.trim() ||
      !form.startOn ||
      !form.endOn
    ) {
      setError(
        "Customer, event name, start date and end date are required."
      );
      return;
    }

    if (form.endOn < form.startOn) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    if (
      Number(form.received || 0) >
      Number(form.delivered || 0)
    ) {
      setError(
        "Received quantity cannot exceed delivered quantity."
      );
      return;
    }

    try {
      await onSave(form);
    } catch (err) {
      setError(err.message || "Unable to save event.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {event ? "Edit Event" : "Create Event"}
            </h2>

            <p className="text-xs text-slate-500">
              Event details, payment and delivery information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </header>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-600">
              Customer *
            </span>

            <select
              className={inputClass}
              value={form.customerId}
              onChange={(e) =>
                set("customerId", e.target.value)
              }
              required
            >
              <option value="">Select customer</option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.phone ? ` · ${customer.phone}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-600">
              Event Name *
            </span>

            <input
              className={inputClass}
              value={form.eventName}
              onChange={(e) =>
                set("eventName", e.target.value)
              }
              placeholder="e.g. Marriage, Barkhi, Birthday"
              required
            />
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-600">
              Start On *
            </span>

            <input
              type="date"
              className={inputClass}
              value={form.startOn}
              onChange={(e) => set("startOn", e.target.value)}
              required
            />
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-600">
              End On *
            </span>

            <input
              type="date"
              className={inputClass}
              value={form.endOn}
              onChange={(e) => set("endOn", e.target.value)}
              required
            />
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-600">
              Event Status
            </span>

            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {[
                "approved",
                "pending",
                "rejected",
                "in_cart",
                "payment_pending",
                "completed",
              ].map((status) => (
                <option key={status} value={status}>
                  {status
                    .replaceAll("_", " ")
                    .replace(/\b\w/g, (m) => m.toUpperCase())}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-slate-600">
              Payment Status
            </span>

            <select
              className={inputClass}
              value={form.paymentStatus}
              onChange={(e) =>
                set("paymentStatus", e.target.value)
              }
            >
              {[
                "paid",
                "unpaid",
                "partially_paid",
                "pending",
              ].map((status) => (
                <option key={status} value={status}>
                  {status
                    .replaceAll("_", " ")
                    .replace(/\b\w/g, (m) => m.toUpperCase())}
                </option>
              ))}
            </select>
          </label>

          {[
            ["eventInvoice", "Event Invoice"],
            ["dueAmount", "Due Amount"],
            ["advanceAmount", "Advance Amount"],
            ["eventPayment", "Event Payment"],
            ["delivered", "Delivered Quantity"],
            ["received", "Received Quantity"],
          ].map(([key, label]) => (
            <label key={key}>
              <span className="mb-1.5 block text-sm font-medium text-slate-600">
                {label}
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </label>
          ))}

          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-600">
              Notes
            </span>

            <textarea
              rows="3"
              className={inputClass}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Optional notes..."
            />
          </label>

          {error && (
            <p className="sm:col-span-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}
        </div>

        <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
          >
            Cancel
          </button>

          <button
            disabled={saving}
            className="rounded-lg bg-[#263b5b] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : event
                ? "Update Event"
                : "Create Event"}
          </button>
        </footer>
      </form>
    </div>
  );
}