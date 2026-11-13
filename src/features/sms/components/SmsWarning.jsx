import { AlertTriangle } from "lucide-react";

export default function SmsWarning({
  message = "Ensure you have an active SMS plan to send automated messages.",
  type = "warning",
}) {
  const styles =
    type === "error"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : "border-orange-200 bg-orange-50 text-slate-800";

  const iconStyles =
    type === "error"
      ? "text-rose-600"
      : "text-orange-500";

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${styles}`}
    >
      <AlertTriangle
        size={20}
        className={`mt-0.5 shrink-0 ${iconStyles}`}
      />

      <p className="text-sm leading-6">
        {message}
      </p>
    </div>
  );
}