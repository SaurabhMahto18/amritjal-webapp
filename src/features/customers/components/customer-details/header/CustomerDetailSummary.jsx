
import { UserRound } from "lucide-react";

const formatAmount = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function SummaryMetric({ label, value, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    danger: "bg-rose-50 text-rose-600",
    info: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="whitespace-nowrap text-sm text-slate-600">
        {label}
      </span>

      <span
        className={`min-w-10 rounded-full px-3 py-1.5 text-center text-xs font-semibold tabular-nums ${tones[tone]}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function CustomerDetailSummary({
  customer,
  balanceJars = 0,
  dueAmount = 0,
  pastDue = 0,
  currentDue = 0,
}) {
  const customerName = customer?.name || "Unnamed Customer";
  const customerGroup = customer?.groupName || customer?.group || "Customer";

  return (
    <section
      aria-label="Customer account summary"
      className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      {/* Customer Identity */}
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-500">
          {customer?.profileImage ? (
            <img
              src={customer.profileImage}
              alt={`${customerName} profile`}
              className="size-full object-cover"
            />
          ) : (
            <UserRound size={27} />
          )}
        </div>

        <div className="min-w-0">
          <h1 className="break-words text-base font-bold text-slate-900 sm:text-lg">
            {customerName}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            · {customerGroup}
          </p>
        </div>
      </div>

      {/* Account Metrics */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:justify-end">
        <SummaryMetric
          label="Balance Jar"
          value={formatAmount(balanceJars)}
          tone="info"
        />

        <SummaryMetric
          label="Due Amount"
          value={formatAmount(dueAmount)}
          tone="danger"
        />

        <SummaryMetric
          label="Past Due"
          value={formatAmount(pastDue)}
        />

        <SummaryMetric
          label="Current Due"
          value={formatAmount(currentDue)}
        />
      </div>
    </section>
  );
}
