import {
  CalendarDays,
  Pencil,
  Trash2,
} from "lucide-react";

const formatDate = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-CA")
    : "—";

function Badge({ children, kind = "neutral" }) {
  const styles = {
    paid: "bg-teal-100 text-teal-700",
    unpaid: "bg-orange-100 text-orange-600",
    partially_paid: "bg-blue-100 text-blue-700",
    pending: "bg-amber-100 text-amber-700",
    completed: "bg-slate-200 text-blue-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
    in_cart: "bg-violet-100 text-violet-700",
    payment_pending: "bg-amber-100 text-amber-700",
    neutral: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
        styles[kind] || styles.neutral
      }`}
    >
      {children}
    </span>
  );
}

const paymentLabel = (value) =>
  ({
    paid: "Paid",
    unpaid: "Unpaid",
    partially_paid: "Partially Paid",
    pending: "Pending",
  }[value] || value || "Pending");

const statusLabel = (value) =>
  ({
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    in_cart: "In cart",
    payment_pending: "Payment pending",
    completed: "Completed",
  }[value] || value || "Pending");

export default function EventTable({
  events = [],
  onEdit,
  onDelete,
}) {
  if (!events.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <CalendarDays
          className="mx-auto mb-3 text-slate-400"
          size={30}
        />

        <h3 className="font-semibold text-slate-800">
          No events found
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Try changing your search or filters, or create a new event.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="bg-[#edf2f7] text-sm text-slate-600">
            <tr>
              {[
                "Customer Name",
                "Event Name",
                "Start On",
                "End On",
                "Payment Status",
                "Status",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-5 py-4 font-medium"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {events.map((event) => (
              <tr
                key={event.id}
                className="transition hover:bg-slate-50"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-sky-200 bg-sky-500 text-sm font-bold text-white">
                      {event.customerName
                        ?.slice(0, 1)
                        ?.toUpperCase() || "C"}
                    </span>

                    <div>
                      <p className="font-semibold text-slate-900">
                        {event.customerName}
                      </p>

                      {event.customerPhone && (
                        <p className="text-xs text-slate-400">
                          {event.customerPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-5 py-3.5 font-medium text-slate-800">
                  {event.eventName}
                </td>

                <td className="px-5 py-3.5 text-sm text-slate-700">
                  {formatDate(event.startOn)}
                </td>

                <td className="px-5 py-3.5 text-sm text-slate-700">
                  {formatDate(event.endOn)}
                </td>

                <td className="px-5 py-3.5">
                  <Badge kind={event.paymentStatus}>
                    {paymentLabel(event.paymentStatus)}
                  </Badge>
                </td>

                <td className="px-5 py-3.5">
                  <Badge kind={event.status}>
                    {statusLabel(event.status)}
                  </Badge>
                </td>

                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Edit event"
                      onClick={() => onEdit(event)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      title="Delete event"
                      onClick={() => onDelete(event)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
        Showing {events.length} event(s)
      </div>
    </div>
  );
}