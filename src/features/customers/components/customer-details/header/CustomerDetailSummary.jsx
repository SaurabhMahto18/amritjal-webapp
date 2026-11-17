import { UserRound } from "lucide-react";

const amountFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

const formatAmount = (value) =>
  amountFormatter.format(Number(value) || 0);

function SummaryMetric({ label, value, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    danger: "bg-rose-50 text-rose-600",
    info: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2 sm:justify-start sm:gap-2 sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0">
      <span className="min-w-0 truncate text-[11px] font-medium text-slate-500 sm:text-sm">
        {label}
      </span>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-center text-[11px] font-semibold tabular-nums sm:min-w-10 sm:px-3 sm:py-1.5 sm:text-xs ${tones[tone]}`}
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
      className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5"
    >
      {/* Compact customer identity */}
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-500 sm:size-14">
          {customer?.profileImage ? (
            <img
              src={customer.profileImage}
              alt={`${customerName} profile`}
              className="size-full object-cover"
            />
          ) : (
            <UserRound size={21} className="sm:hidden" />
          )}
          {!customer?.profileImage && (
            <UserRound size={27} className="hidden sm:block" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold leading-5 text-slate-900 sm:break-words sm:text-lg">
            {customerName}
          </h1>
          <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:mt-1 sm:text-sm">
            {customerGroup}
          </p>
        </div>
      </div>

      {/* Minimal 2-column metrics on phones */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-6 sm:gap-y-3">
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
