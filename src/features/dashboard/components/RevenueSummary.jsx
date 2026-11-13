
import { IndianRupee, TrendingUp, Wallet } from "lucide-react";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export default function RevenueSummary({
  totalRevenue = 0,
  totalCollected = 0,
  outstandingAmount = 0,
}) {
  const summaries = [
    {
      title: "Total Revenue",
      amount: totalRevenue,
      description: "Value of recorded deliveries",
      icon: TrendingUp,
      iconClass: "bg-blue-100 text-blue-700",
    },
    {
      title: "Total Collected",
      amount: totalCollected,
      description: "Payments received",
      icon: IndianRupee,
      iconClass: "bg-green-100 text-green-700",
    },
    {
      title: "Outstanding Amount",
      amount: outstandingAmount,
      description: "Amount pending collection",
      icon: Wallet,
      iconClass: "bg-orange-100 text-orange-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {summaries.map((summary) => {
        const Icon = summary.icon;

        return (
          <div
            key={summary.title}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {summary.title}
                </p>

                <p className="mt-3 text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.amount)}
                </p>
              </div>

              <div className={`rounded-lg p-3 ${summary.iconClass}`}>
                <Icon size={22} />
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              {summary.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
