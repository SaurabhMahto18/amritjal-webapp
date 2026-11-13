
import {
  Users,
  UserCheck,
  UserRoundX,
  Wallet,
  TrendingUp,
  TrendingDown,
  Droplets,
  IndianRupee,
} from "lucide-react";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "teal",
}) {
  const tones = {
    teal: {
      icon: "bg-teal-50 text-teal-700",
      accent: "bg-teal-500",
    },
    blue: {
      icon: "bg-blue-50 text-blue-700",
      accent: "bg-blue-500",
    },
    amber: {
      icon: "bg-amber-50 text-amber-700",
      accent: "bg-amber-500",
    },
    violet: {
      icon: "bg-violet-50 text-violet-700",
      accent: "bg-violet-500",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-700",
      accent: "bg-emerald-500",
    },
    rose: {
      icon: "bg-rose-50 text-rose-700",
      accent: "bg-rose-500",
    },
  };

  const style = tones[tone] || tones.teal;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div
        className={`absolute inset-x-0 top-0 h-1 ${style.accent}`}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-5 text-slate-500">
            {title}
          </p>

          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>

          {subtitle && (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
        >
          <Icon size={21} strokeWidth={2} />
        </div>
      </div>
    </article>
  );
}

/**
 * Reusable customer summary cards.
 *
 * Pass only values calculated by the parent page or service.
 * This component does not fetch data or assume database fields.
 */
export default function CustomerSummaryCards({
  totalCustomers = 0,
  activeCustomers = 0,
  archivedCustomers = 0,
  outstandingBalance = 0,
  totalDeliveries = 0,
  totalCollected = 0,
  totalOutstanding = 0,
}) {
  const cards = [
    {
      title: "Total Customers",
      value: Number(totalCustomers) || 0,
      subtitle: "All customer records",
      icon: Users,
      tone: "teal",
    },
    {
      title: "Active Customers",
      value: Number(activeCustomers) || 0,
      subtitle: "Currently active accounts",
      icon: UserCheck,
      tone: "blue",
    },
    {
      title: "Archived Customers",
      value: Number(archivedCustomers) || 0,
      subtitle: "Inactive customer records",
      icon: UserRoundX,
      tone: "amber",
    },
    {
      title: "Total Deliveries",
      value: Number(totalDeliveries) || 0,
      subtitle: "Deliveries in the supplied period",
      icon: Droplets,
      tone: "violet",
    },
    {
      title: "Total Collected",
      value: currency(totalCollected),
      subtitle: "Recorded payments",
      icon: TrendingUp,
      tone: "emerald",
    },
    {
      title: "Outstanding Balance",
      value: currency(
        totalOutstanding || outstandingBalance
      ),
      subtitle: "Pending amount from supplied data",
      icon: Wallet,
      tone: "rose",
    },
  ];

  return (
    <section
      aria-label="Customer summary"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
    >
      {cards.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </section>
  );
}
