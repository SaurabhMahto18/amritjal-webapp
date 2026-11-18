import { UserRound } from "lucide-react";

const amountFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

const formatAmount = (value) =>
  amountFormatter.format(Number(value) || 0);

function SummaryMetric({ label, value, tone = "neutral" }) {
  const tones = {
    neutral: "text-slate-800",
    danger: "text-rose-600",
    info: "text-blue-700",
  };

  return (
    <div className="flex min-w-0 items-center justify-between gap-1.5 rounded-md bg-slate-50 px-2 py-1.5 sm:rounded-lg sm:px-2.5 sm:py-2">
      <span className="truncate text-[10px] font-medium text-slate-500 sm:text-xs">
        {label}
      </span>

      <span className={`shrink-0 text-[11px] font-bold tabular-nums sm:text-sm ${tones[tone]}`}>
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
      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm sm:rounded-xl sm:p-3"
    >
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
          {customer?.profileImage ? (
            <img
              src={customer.profileImage}
              alt={`${customerName} profile`}
              className="size-full object-cover"
            />
          ) : (
            <UserRound size={19} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold text-slate-900">
            {customerName}
          </h1>
          <p className="truncate text-[10px] text-slate-500">
            {customerGroup}
          </p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <SummaryMetric
          label="Balance Jar"
          value={formatAmount(balanceJars)}
          tone="info"
        />
        <SummaryMetric
          label="Due Amount"
          value={`₹${formatAmount(dueAmount)}`}
          tone="danger"
        />
        <SummaryMetric
          label="Past Due"
          value={`₹${formatAmount(pastDue)}`}
        />
        <SummaryMetric
          label="Current Due"
          value={`₹${formatAmount(currentDue)}`}
        />
      </div>
    </section>
  );
}