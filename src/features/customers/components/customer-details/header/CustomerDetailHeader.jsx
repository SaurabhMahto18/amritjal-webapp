import {
  CalendarDays,
  CreditCard,
  Droplets,
  LayoutList,
  Pencil,
  ReceiptText,
  Sun,
  Truck,
  UserRound,
  Wallet,
  Clock3,
} from "lucide-react";
import { Link } from "react-router-dom";

const TABS = [
  { id: "overview", label: "Details", icon: UserRound },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "invoices", label: "Invoices", icon: ReceiptText },
  { id: "monthly-card", label: "Monthly Card", icon: CalendarDays },
  { id: "deliveries", label: "Delivery", icon: Truck },
  { id: "ledger", label: "Ledger", icon: LayoutList },
  { id: "leaves", label: "Leaves", icon: Sun },
];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const formatCurrency = (value) =>
  currencyFormatter.format(Number(value) || 0);

function Metric({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    blue: {
      icon: "bg-blue-100 text-blue-700",
      value: "text-blue-800",
      card: "border-blue-100 bg-blue-50/60",
    },
    red: {
      icon: "bg-rose-100 text-rose-700",
      value: "text-rose-700",
      card: "border-rose-100 bg-rose-50/60",
    },
    amber: {
      icon: "bg-amber-100 text-amber-700",
      value: "text-amber-800",
      card: "border-amber-100 bg-amber-50/60",
    },
    teal: {
      icon: "bg-teal-100 text-teal-700",
      value: "text-teal-800",
      card: "border-teal-100 bg-teal-50/60",
    },
    slate: {
      icon: "bg-slate-200 text-slate-600",
      value: "text-slate-800",
      card: "border-slate-100 bg-slate-50",
    },
  };
  const palette = tones[tone] || tones.slate;

  return (
    <div className={`min-w-0 rounded-md border p-1.5 sm:rounded-xl sm:p-3 ${palette.card}`}>
      <div className="flex min-w-0 items-center justify-between gap-0.5">
        <span className="min-w-0 truncate text-[8px] font-semibold leading-3 text-slate-500 sm:text-xs">
          {label}
        </span>
        <span className={`flex size-4 shrink-0 items-center justify-center rounded sm:size-7 sm:rounded-lg ${palette.icon}`}>
          <Icon size={9} strokeWidth={2} className="sm:size-[14px]" />
        </span>
      </div>
      <p className={`mt-1 truncate text-[12px] font-bold leading-tight tabular-nums sm:mt-1.5 sm:text-xl ${palette.value}`}>
        {value}
      </p>
    </div>
  );
}

export default function CustomerDetailHeader({
  customer,
  activeTab = "overview",
  onTabChange,
  balanceJars = 0,
  dueAmount = 0,
  pastDue = 0,
  currentDue = 0,
}) {
  if (!customer) return null;

  const editPath = `/customers/${customer.id}/edit`;

  return (
    <div className="w-full min-w-0 space-y-2.5 sm:space-y-4">
      {/* Account summary belongs to the Details tab only. */}
      {activeTab === "overview" && (
        <section
          aria-label="Customer account summary"
          className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:rounded-2xl sm:p-4"
        >
          <div className="mb-2 flex items-center justify-between gap-2.5 sm:mb-3 sm:gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:size-9 sm:rounded-xl">
                <Wallet size={15} className="sm:size-[17px]" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[13px] font-bold leading-4 text-slate-900 sm:text-base sm:leading-normal">
                  Account Summary
                </h2>
                <p className="mt-0.5 truncate text-[10px] leading-3 text-slate-500 sm:text-xs sm:leading-normal">
                  {customer.name ? `Financial overview · ${customer.name}` : "Customer financial overview"}
                </p>
              </div>
            </div>

            <Link
              to={editPath}
              title="Edit customer"
              aria-label="Edit customer"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-200 sm:size-9 sm:rounded-xl"
            >
              <Pencil size={14} className="sm:size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-1 sm:gap-2.5">
            <Metric
              label="Balance Jar"
              value={Number(balanceJars) || 0}
              icon={Droplets}
              tone="blue"
            />
            <Metric
              label="Due Amount"
              value={formatCurrency(dueAmount)}
              icon={Wallet}
              tone="red"
            />
            <Metric
              label="Past Due"
              value={formatCurrency(pastDue)}
              icon={Clock3}
              tone="amber"
            />
            <Metric
              label="Current Due"
              value={formatCurrency(currentDue)}
              icon={CalendarDays}
              tone="teal"
            />
          </div>
        </section>
      )}

      {/* Mobile: fixed icon-only primary navigation. Desktop: inline icon + label tabs. */}
      <nav
        aria-label="Customer sections"
        className="fixed inset-x-0 bottom-0 z-[100] w-full border-t border-slate-200 bg-white/95 px-1.5 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+0.375rem)] shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur-md sm:static sm:rounded-xl sm:border sm:p-1.5 sm:shadow-sm sm:backdrop-blur-none"
      >
        <div className="grid grid-cols-7 items-center gap-0.5 sm:flex sm:min-w-max sm:gap-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const selected = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange?.(id)}
                aria-label={label}
                aria-current={selected ? "page" : undefined}
                title={label}
                className={`flex min-h-11 min-w-0 flex-col items-center justify-center rounded-xl px-0.5 py-1.5 transition-colors sm:min-h-11 sm:min-w-0 sm:flex-row sm:gap-2 sm:px-4 sm:py-2 ${
                  selected
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <Icon size={20} strokeWidth={1.9} className="shrink-0 sm:size-[17px]" />
                <span className="hidden max-w-none truncate text-sm font-semibold sm:inline">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
