
import { Droplets, PackageCheck, IndianRupee } from "lucide-react";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export default function TodayDeliverySummary({
  totalDeliveries = 0,
  totalJars = 0,
  totalAmount = 0,
}) {
  const summaries = [
    {
      title: "Today's Deliveries",
      value: Number(totalDeliveries) || 0,
      description: "Delivery entries recorded today",
      icon: PackageCheck,
      iconClass: "bg-blue-100 text-blue-700",
    },
    {
      title: "Jars Delivered",
      value: Number(totalJars) || 0,
      description: "Total jars delivered today",
      icon: Droplets,
      iconClass: "bg-cyan-100 text-cyan-700",
    },
    {
      title: "Today's Delivery Value",
      value: formatCurrency(totalAmount),
      description: "Value of today's deliveries",
      icon: IndianRupee,
      iconClass: "bg-green-100 text-green-700",
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
                  {summary.value}
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
