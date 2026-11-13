
import {
  LayoutDashboard,
  CalendarDays,
  ChartNoAxesCombined,
  Users,
  Wallet,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Droplets,
  ChevronDown,
  IndianRupee,
  CalendarCheck,
  Truck,
  Package,
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
  teal: "bg-teal-50 text-teal-700",
  rose: "bg-rose-50 text-rose-600",
  blue: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-700",
};

function DashboardStatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="min-w-0 rounded-xl border border-[#E1E8F0] bg-white p-3 shadow-[0_2px_5px_rgba(15,23,42,0.035)] sm:rounded-2xl sm:p-4 lg:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[10px] font-semibold leading-4 text-[#64748B] sm:text-xs">
          {item.title}
        </p>

        <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl sm:size-10 ${colorStyles[item.color]}`}>
          <Icon size={17} />
        </span>
      </div>

      <p className="mt-3 break-words text-lg font-black tracking-tight text-[#101F35] sm:mt-5 sm:text-2xl">
        {item.value}
      </p>

      <p className="mt-1 text-[9px] leading-4 text-[#94A3B8] sm:text-[11px]">
        {item.note}
      </p>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[700px]">

      {/* FLOATING TOP LABEL */}
      <div className="absolute -top-4 left-5 z-20 inline-flex items-center gap-2 rounded-full border border-[#294057] bg-[#132B42] px-3 py-2 shadow-xl sm:left-8 sm:px-4">
        <span className="size-2 rounded-full bg-[#63D6D2]" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#D9E9ED] sm:text-[10px]">
          Product dashboard preview
        </span>
      </div>

      {/* MAIN DASHBOARD FRAME */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE5ED] bg-[#EDF3F8] shadow-[0_25px_80px_rgba(0,0,0,0.3)] sm:rounded-[22px]">

        {/* DASHBOARD HEADER */}
        <div className="flex min-h-[68px] items-center justify-between gap-3 border-b border-[#DCE5ED] bg-white px-4 py-3 sm:min-h-[82px] sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <LayoutDashboard size={17} className="shrink-0 text-[#087E85] sm:size-5" />
              <h3 className="text-sm font-extrabold text-[#101F35] sm:text-lg">
                Dashboard
              </h3>
            </div>
            <p className="mt-1 truncate text-[9px] text-[#8A9BB4] sm:text-xs">
              Amrit Jal · Water Business Management
            </p>
          </div>

          {/* AGENCY PROFILE */}
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#F1F5F9] p-1.5 sm:gap-3 sm:px-3 sm:py-2">
            <span className="flex size-8 items-center justify-center rounded-full border border-[#D7E3E8] bg-white text-[#087E85] sm:size-10">
              <Droplets size={18} />
            </span>

            <div className="hidden min-w-0 sm:block">
              <p className="text-xs font-bold text-[#172B40]">
                Agency Owner
              </p>
              <p className="text-[10px] text-[#8493A2]">
                Business account
              </p>
            </div>

            <ChevronDown size={15} className="text-[#8A9BB4]" />
          </div>
        </div>

        {/* DASHBOARD BODY */}
        <div className="space-y-4 p-3 sm:space-y-5 sm:p-5 lg:p-7">

          {/* TABS */}
          <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-[#DCE5ED] bg-white p-1.5 shadow-sm">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#101F35] px-3 py-2 text-[10px] font-bold text-white sm:px-4 sm:text-xs">
              <CalendarDays size={14} />
              Today
            </span>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-medium text-[#526579] sm:px-4 sm:text-xs">
              <ChartNoAxesCombined size={14} />
              Finance
            </span>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-medium text-[#526579] sm:px-4 sm:text-xs">
              <Users size={14} />
              Account
            </span>
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
            {summaryCards.map((item) => (
              <DashboardStatCard key={item.title} item={item} />
            ))}
          </div>

          {/* LOWER DASHBOARD PANELS */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[0.85fr_1.65fr]">

            {/* TODAY'S EVENTS */}
            <div className="flex min-w-0 flex-col rounded-xl border border-[#DCE5ED] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.035)] sm:rounded-2xl sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-extrabold text-[#172B40]">
                    Today's Events
                  </h4>
                  <p className="mt-1 text-[10px] text-[#8493A2] sm:text-xs">
                    Daily activity overview
                  </p>
                </div>

                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 sm:size-10">
                  <CalendarCheck size={19} />
                </span>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center py-7 text-center sm:py-9">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-[#F1F5F9] text-[#647B96]">
                  <CalendarDays size={23} />
                </span>

                <p className="mt-3 text-xs font-bold text-[#172B40] sm:text-sm">
                  Your daily schedule
                </p>

                <p className="mt-1 max-w-[190px] text-[10px] leading-5 text-[#8493A2]">
                  Scheduled business activities will appear here.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 rounded-xl border border-[#DCE5ED] bg-[#F8FAFC] px-3 py-3 text-[10px] font-bold text-[#526579]">
                <CalendarDays size={14} />
                Manage Events
                <ArrowUpRight size={13} />
              </div>
            </div>

            {/* INVOICE OVERVIEW */}
            <div className="min-w-0 rounded-xl border border-[#DCE5ED] bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,0.035)] sm:rounded-2xl sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-extrabold text-[#172B40]">
                    Invoices
                  </h4>
                  <p className="mt-1 text-[10px] text-[#8493A2] sm:text-xs">
                    Billing overview
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5ED] px-3 py-2 text-[10px] font-bold text-[#344B5C]">
                  All Invoices
                  <ArrowUpRight size={13} />
                </span>
              </div>

              <div className="mt-5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#8493A2]">
                  Outstanding invoices
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[#101F35] sm:text-3xl">
                  ₹ — 
                </p>
                <p className="mt-1 text-[10px] text-[#8493A2]">
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
                <div className="mb-2 flex justify-between gap-2 text-[9px] text-[#8493A2]">
                  <span>Paid amount</span>
                  <span>Invoice balance</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#EDF2F7]">
                  <div className="h-full w-[38%] rounded-full bg-[#087E85]/70" />
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM WORKFLOW STRIP */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#DCE5ED] bg-white p-3 sm:gap-4 sm:p-4">
            {[
              { icon: Truck, label: "Deliveries" },
              { icon: Package, label: "Jar inventory" },
              { icon: Users, label: "Customers" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex min-w-0 items-center justify-center gap-1.5 text-[#647B96] sm:gap-2">
                <Icon size={14} className="shrink-0 text-[#087E85]" />
                <span className="truncate text-[9px] font-semibold sm:text-[11px]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FLOATING STATUS LABEL */}
      <div className="absolute -bottom-4 right-3 z-10 hidden items-center gap-2 rounded-xl border border-[#294057] bg-[#132B42] px-4 py-3 shadow-xl sm:flex lg:-right-5">
        <CheckCircle2 size={17} className="text-[#63D6D2]" />
        <div>
          <p className="text-[10px] font-bold text-white">
            Connected business workspace
          </p>
          <p className="mt-0.5 text-[9px] text-[#9BB0C1]">
            Customers · Deliveries · Billing
          </p>
        </div>
      </div>
    </div>
  );
}


export default function DashboardPreview() {
  return (
    <section
      id="dashboard-preview"
      className="relative isolate overflow-hidden bg-[#0B192B] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:px-16"
    >
      {/* BACKGROUND ACCENTS */}
      <div className="pointer-events-none absolute -left-40 top-20 -z-10 size-[400px] rounded-full bg-[#087E85]/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 -z-10 size-[400px] rounded-full bg-[#F2A93B]/[0.06] blur-[120px]" />

      <div className="mx-auto max-w-[1600px]">

        {/* TWO COLUMN LAYOUT */}
        <div className="grid items-center gap-12 lg:grid-cols-[0.75fr_1.45fr] lg:gap-8 xl:grid-cols-[0.72fr_1.5fr] xl:gap-12">

          {/* LEFT CONTENT */}
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#294057] bg-[#13263B] px-3.5 py-2">
              <span className="size-1.5 rounded-full bg-[#63D6D2]" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#63D6D2]">
                Your business at a glance
              </span>
            </div>

            <h2 className="text-balance text-[34px] font-black leading-[1.1] tracking-[-0.04em] text-white sm:text-[44px] lg:text-[42px] xl:text-[52px]">
              Your entire water business.
              <span className="mt-1 block text-[#63D6D2]">
                One clear dashboard.
              </span>
            </h2>

            <p className="mt-5 text-sm leading-7 text-[#A8B8C7] sm:text-base sm:leading-8">
              Get a consolidated view of daily payments, expenses,
              delivery activity, customer accounts and invoices.
              Keep your business operations easier to review and manage.
            </p>

            {/* KEY BENEFITS */}
            <div className="mt-8 space-y-5">
              {[
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
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#294057] bg-[#13263B] text-[#63D6D2]">
                    <Icon size={19} />
                  </span>

                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {title}
                    </h3>
                    <p className="mt-1 text-xs leading-6 text-[#91A5B8]">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE DASHBOARD */}
          <div className="min-w-0 lg:py-5">
            <DashboardMockup />
          </div>

        </div>
      </div>
    </section>
  );
}

