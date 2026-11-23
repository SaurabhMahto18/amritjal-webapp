
import {
  LayoutDashboard,
  CalendarDays,
  ChartNoAxesCombined,
  Users,
  Wallet,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  Droplets,
  ChevronDown,
  IndianRupee,
  CalendarCheck,
  Truck,
  Package,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
} from "lucide-react";

const summaryCards = [
  {
    title: "Today's Payments",
    value: "₹0.00",
    note: "Payment records",
    icon: Wallet,
    color: "teal",
  },
  {
    title: "Today's Expenses",
    value: "₹0.00",
    note: "Expense records",
    icon: Receipt,
    color: "rose",
  },
  {
    title: "Today's Earnings",
    value: "₹0.00",
    note: "Recorded delivery value",
    icon: TrendingUp,
    color: "blue",
  },
  {
    title: "Security Deposit",
    value: "Account",
    note: "Deposit summary",
    icon: IndianRupee,
    color: "amber",
  },
];

const colorStyles = {
  teal: "bg-[#E8F4F0] text-[#087E80]",
  rose: "bg-rose-50 text-rose-600",
  blue: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-700",
};

function DashboardStatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="min-w-0 rounded-xl border border-[#E9EEE9] bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:rounded-2xl sm:p-4 lg:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[10px] font-semibold leading-4 text-[#777F79] sm:text-xs">
          {item.title}
        </p>

        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-xl sm:size-10 ${colorStyles[item.color]}`}
        >
          <Icon size={17} />
        </span>
      </div>

      <p className="mt-3 break-words text-lg font-black tracking-tight text-[#24262B] sm:mt-5 sm:text-2xl">
        {item.value}
      </p>

      <p className="mt-1 text-[9px] leading-4 text-[#9A9E98] sm:text-[11px]">
        {item.note}
      </p>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[780px]">
      {/* Floating label */}
      <div className="absolute -top-4 left-5 z-20 inline-flex items-center gap-2 rounded-full border border-[#E5EBE5] bg-white px-3 py-2 shadow-[0_5px_20px_rgba(36,38,43,0.08)] sm:left-8 sm:px-4">
        <span className="size-2 rounded-full bg-[#087E80]" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#52635F] sm:text-[10px]">
          Product dashboard preview
        </span>
      </div>

      {/* Dashboard frame */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE6DF] bg-[#F7F9F6] shadow-[0_28px_75px_rgba(37,70,54,0.13)] sm:rounded-[24px]">
        {/* Header */}
        <div className="flex min-h-[68px] items-center justify-between gap-3 border-b border-[#E9EEE9] bg-white px-4 py-3 sm:min-h-[82px] sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#E8F4F0] text-[#087E80]">
                <LayoutDashboard size={17} />
              </span>

              <h3 className="text-sm font-extrabold text-[#24262B] sm:text-lg">
                Dashboard
              </h3>
            </div>

            <p className="mt-1 truncate text-[9px] text-[#969D96] sm:text-xs">
              Amrit Jal · Water Business Management
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#F4F7F3] p-1.5 sm:gap-3 sm:px-3 sm:py-2">
            <span className="flex size-8 items-center justify-center rounded-full border border-[#E4EAE4] bg-white text-[#087E80] sm:size-10">
              <Droplets size={18} />
            </span>

            <div className="hidden min-w-0 sm:block">
              <p className="text-xs font-bold text-[#24262B]">
                Agency Owner
              </p>
              <p className="text-[10px] text-[#969D96]">
                Business account
              </p>
            </div>

            <ChevronDown size={15} className="text-[#969D96]" />
          </div>
        </div>

        {/* Dashboard body */}
        <div className="space-y-4 p-3 sm:space-y-5 sm:p-5 lg:p-7">
          {/* Navigation tabs */}
          <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-[#E8EDE7] bg-white p-1.5">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#087E80] px-3 py-2 text-[10px] font-bold text-white sm:px-4 sm:text-xs">
              <CalendarDays size={14} />
              Today
            </span>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-medium text-[#777F79] sm:px-4 sm:text-xs">
              <ChartNoAxesCombined size={14} />
              Finance
            </span>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-medium text-[#777F79] sm:px-4 sm:text-xs">
              <Users size={14} />
              Account
            </span>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
            {summaryCards.map((item) => (
              <DashboardStatCard key={item.title} item={item} />
            ))}
          </div>

          {/* Lower dashboard panels */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[0.85fr_1.65fr]">
            {/* Events */}
            <div className="flex min-w-0 flex-col rounded-xl border border-[#E9EEE9] bg-white p-4 sm:rounded-2xl sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-extrabold text-[#24262B]">
                    Today's Events
                  </h4>
                  <p className="mt-1 text-[10px] text-[#969D96] sm:text-xs">
                    Daily activity overview
                  </p>
                </div>

                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 sm:size-10">
                  <CalendarCheck size={19} />
                </span>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center py-7 text-center sm:py-9">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-[#F1F6F1] text-[#087E80]">
                  <CalendarDays size={23} />
                </span>

                <p className="mt-3 text-xs font-bold text-[#24262B] sm:text-sm">
                  Your daily schedule
                </p>

                <p className="mt-1 max-w-[190px] text-[10px] leading-5 text-[#969D96]">
                  Scheduled business activities will appear here.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 rounded-xl border border-[#E9EEE9] bg-[#F6F8F5] px-3 py-3 text-[10px] font-bold text-[#52635F]">
                <CalendarDays size={14} />
                Manage Events
                <ArrowUpRight size={13} />
              </div>
            </div>

            {/* Invoice overview */}
            <div className="min-w-0 rounded-xl border border-[#E9EEE9] bg-white p-4 sm:rounded-2xl sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-extrabold text-[#24262B]">
                    Invoices
                  </h4>
                  <p className="mt-1 text-[10px] text-[#969D96] sm:text-xs">
                    Billing overview
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E9EEE9] px-3 py-2 text-[10px] font-bold text-[#52635F]">
                  All Invoices
                  <ArrowUpRight size={13} />
                </span>
              </div>

              <div className="mt-5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#969D96]">
                  Outstanding invoices
                </p>

                <p className="mt-2 text-2xl font-black tracking-tight text-[#24262B] sm:text-3xl">
                  ₹ —
                </p>

                <p className="mt-1 text-[10px] text-[#969D96]">
                  Customer invoice summary
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="rounded-xl border border-rose-100 bg-rose-50/80 p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-semibold text-rose-700">
                      Overdue
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-black text-rose-700 sm:text-xl">
                    ₹ —
                  </p>

                  <p className="mt-1 text-[9px] text-rose-500">
                    Past due invoices
                  </p>
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-semibold text-amber-700">
                      Not Due Yet
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-black text-amber-700 sm:text-xl">
                    ₹ —
                  </p>

                  <p className="mt-1 text-[9px] text-amber-600">
                    Upcoming payments
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex justify-between gap-2 text-[9px] text-[#969D96]">
                  <span>Paid amount</span>
                  <span>Invoice balance</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[#E9EEE9]">
                  <div className="h-full w-[38%] rounded-full bg-[#087E80]/70" />
                </div>
              </div>
            </div>
          </div>

          {/* Workflow shortcuts */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#E9EEE9] bg-white p-3 sm:gap-4 sm:p-4">
            {[
              { icon: Truck, label: "Deliveries" },
              { icon: Package, label: "Jar inventory" },
              { icon: Users, label: "Customers" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex min-w-0 items-center justify-center gap-1.5 text-[#777F79] sm:gap-2"
              >
                <Icon
                  size={14}
                  className="shrink-0 text-[#087E80]"
                />
                <span className="truncate text-[9px] font-semibold sm:text-[11px]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating status card */}
      <div className="absolute -bottom-5 right-3 z-10 hidden items-center gap-2.5 rounded-xl border border-[#E5EBE5] bg-white px-4 py-3 shadow-[0_8px_25px_rgba(36,38,43,0.08)] sm:flex lg:-right-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[#E8F4F0] text-[#087E80]">
          <CheckCircle2 size={17} />
        </span>

        <div>
          <p className="text-[10px] font-bold text-[#24262B]">
            Business workspace preview
          </p>
          <p className="mt-0.5 text-[9px] text-[#898F88]">
            Customers · Deliveries · Billing
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPreview() {
  const benefits = [
    {
      icon: Users,
      title: "Customer visibility",
      text: "Customer records and account information together.",
    },
    {
      icon: Wallet,
      title: "Financial overview",
      text: "Review payment, expense and invoice summaries.",
    },
    {
      icon: Truck,
      title: "Daily operations",
      text: "Keep delivery and inventory activity in view.",
    },
  ];

  return (
    <section
      id="dashboard-preview"
      aria-labelledby="dashboard-preview-heading"
      className="relative isolate overflow-hidden bg-[#EDF3EF] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:px-16"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 top-10 -z-10 size-[400px] rounded-full bg-[#B9D9CA]/35 blur-[120px]" />

      <div className="pointer-events-none absolute -right-40 bottom-0 -z-10 size-[400px] rounded-full bg-[#E9CA43]/15 blur-[120px]" />

      <div className="mx-auto max-w-[1500px]">
        <div className="grid items-center gap-12 lg:grid-cols-[0.75fr_1.45fr] lg:gap-8 xl:grid-cols-[0.72fr_1.5fr] xl:gap-14">
          {/* Left content */}
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D9E6DD] bg-white/80 px-3.5 py-2 shadow-sm">
              <span className="size-1.5 rounded-full bg-[#087E80]" />

              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#087E80]">
                Your business at a glance
              </span>
            </div>

            <h2
              id="dashboard-preview-heading"
              className="text-balance text-[35px] font-black leading-[1.1] tracking-[-0.045em] text-[#24262B] sm:text-[46px] lg:text-[44px] xl:text-[54px]"
            >
              Clarity for your
              <span className="block text-[#087E80]">
                everyday operations.
              </span>
            </h2>

            <p className="mt-5 text-sm leading-7 text-[#68756C] sm:text-base sm:leading-8">
              Get a consolidated view of daily payments, expenses,
              delivery activity, customer accounts and invoices.
              Keep your business operations easier to review and manage.
            </p>

            {/* Benefits */}
            <div className="mt-8 space-y-5">
              {benefits.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#DDE8DF] bg-white text-[#087E80] shadow-sm">
                    <Icon size={19} />
                  </span>

                  <div>
                    <h3 className="text-sm font-bold text-[#24262B]">
                      {title}
                    </h3>

                    <p className="mt-1 text-xs leading-6 text-[#758078]">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Supporting note */}
            <div className="mt-8 flex items-center gap-3 border-t border-[#D6E2D9] pt-6">
              <span className="flex size-9 items-center justify-center rounded-full bg-white text-[#087E80]">
                <ShieldCheck size={17} />
              </span>

              <p className="text-[11px] font-medium leading-5 text-[#68756C]">
                A more organised way to manage your water business.
              </p>
            </div>
          </div>

          {/* Right dashboard */}
          <div className="min-w-0 lg:py-5">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
