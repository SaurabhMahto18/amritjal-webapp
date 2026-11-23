
import {
  Users,
  Truck,
  Package,
  Wallet,
  Receipt,
  ChartNoAxesCombined,
  UserRoundCog,
  MessageCircle,
  ArrowUpRight,
  Check,
  Clock3,
  FileText,
  CalendarDays,
  ClipboardList,
  Boxes,
} from "lucide-react";

/* =========================================
   FEATURE DATA
========================================= */

const features = [
  {
    number: "01",
    title: "Daily Delivery Tracking",
    description:
      "Record daily deliveries, track quantities and maintain customer-wise delivery history.",
    icon: Truck,
    type: "delivery",
    span: "lg:col-span-7 lg:row-span-2",
  },
  {
    number: "02",
    title: "Invoices & Billing",
    description:
      "Create customer invoices and keep billing records organised.",
    icon: Receipt,
    type: "billing",
    span: "lg:col-span-5",
  },
  {
    number: "03",
    title: "Customer Management",
    description:
      "Keep customer profiles, contact details and account information together.",
    icon: Users,
    type: "customers",
    span: "lg:col-span-5",
  },
  {
    number: "04",
    title: "Jar Management",
    description:
      "Monitor jar operations and maintain visibility into your inventory.",
    icon: Package,
    type: "inventory",
    span: "lg:col-span-4",
  },
  {
    number: "05",
    title: "Payments & Ledger",
    description:
      "Track customer payments, outstanding balances and ledger transactions.",
    icon: Wallet,
    type: "payments",
    span: "lg:col-span-4",
  },
  {
    number: "06",
    title: "Reports & Analytics",
    description:
      "Review business activity and understand operations through reports.",
    icon: ChartNoAxesCombined,
    type: "reports",
    span: "lg:col-span-4",
  },
  {
    number: "07",
    title: "Employee Management",
    description:
      "Manage employee information and keep team operations organised.",
    icon: UserRoundCog,
    type: "employees",
    span: "lg:col-span-6",
  },
  {
    number: "08",
    title: "Customer Communication",
    description:
      "Access communication tools for customer updates and follow-ups.",
    icon: MessageCircle,
    type: "communication",
    span: "lg:col-span-6",
  },
];

const additionalCapabilities = [
  "Customer records",
  "Daily delivery records",
  "Jar inventory visibility",
  "Payment transactions",
  "Customer invoices",
  "Business reports",
  "Employee information",
  "Customer follow-ups",
];

/* =========================================
   SHARED COMPONENTS
========================================= */

function FeatureIcon({ icon: Icon }) {
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#DDECE5] bg-[#EAF5F0] text-[#087E80]">
      <Icon size={21} strokeWidth={1.9} />
    </span>
  );
}

function PreviewPanel({ children }) {
  return (
    <div className="mt-6 rounded-2xl border border-[#E9ECE5] bg-[#F8FAF6] p-4 sm:p-5">
      {children}
    </div>
  );
}

function PreviewHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#087E80] shadow-sm">
            <Icon size={17} />
          </span>
        )}

        <div className="min-w-0">
          <p className="text-[11px] font-extrabold text-[#34413D]">
            {title}
          </p>

          {subtitle && (
            <p className="mt-1 text-[9px] text-[#87928A]">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <span className="shrink-0 rounded-full border border-[#DCEBE3] bg-white px-2.5 py-1 text-[9px] font-bold text-[#087E80]">
        Preview
      </span>
    </div>
  );
}

/* =========================================
   01. DELIVERY PREVIEW
========================================= */

function DeliveryPreview() {
  return (
    <PreviewPanel>
      <PreviewHeading
        icon={Truck}
        title="Daily delivery overview"
        subtitle="Organise your daily delivery operations"
      />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          {
            label: "Delivery records",
            icon: ClipboardList,
          },
          {
            label: "Customer history",
            icon: Users,
          },
          {
            label: "Pending deliveries",
            icon: Clock3,
          },
        ].map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className={`rounded-xl border border-[#E8ECE5] bg-white p-3 ${
                index === 2 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <Icon size={17} className="text-[#087E80]" />

              <p className="mt-3 text-[10px] font-bold leading-5 text-[#45534D]">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#E7ECE5] bg-white p-3">
        <CalendarDays size={17} className="shrink-0 text-[#087E80]" />

        <span className="text-[10px] font-semibold text-[#68766D]">
          Maintain customer-wise delivery records
        </span>
      </div>
    </PreviewPanel>
  );
}

/* =========================================
   02. BILLING PREVIEW
========================================= */

function BillingPreview() {
  return (
    <PreviewPanel>
      <PreviewHeading
        icon={FileText}
        title="Invoice management"
        subtitle="Organised billing records"
      />

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[#87928A]">Customer</span>
          <span className="font-semibold text-[#34413D]">
            Customer account
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[#87928A]">Billing period</span>
          <span className="font-semibold text-[#34413D]">
            Monthly
          </span>
        </div>

        <div className="border-t border-dashed border-[#DCE4DC] pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#53615A]">
              Invoice total
            </span>

            <span className="text-sm font-black text-[#087E80]">
              ₹ —
            </span>
          </div>
        </div>
      </div>
    </PreviewPanel>
  );
}

/* =========================================
   03. CUSTOMER PREVIEW
========================================= */

function CustomerPreview() {
  const customerItems = [
    {
      icon: Users,
      title: "Customer profile",
      subtitle: "Contact and account details",
    },
    {
      icon: Truck,
      title: "Delivery history",
      subtitle: "Customer-wise records",
    },
  ];

  return (
    <PreviewPanel>
      <div className="space-y-2.5">
        {customerItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex items-center gap-3 rounded-xl border border-[#E8ECE5] bg-white p-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF5F0] text-[#087E80]">
                <Icon size={17} />
              </span>

              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[#34413D]">
                  {item.title}
                </p>

                <p className="mt-1 text-[9px] text-[#87928A]">
                  {item.subtitle}
                </p>
              </div>

              <ArrowUpRight
                size={14}
                className="ml-auto shrink-0 text-[#9AA69E]"
              />
            </div>
          );
        })}
      </div>
    </PreviewPanel>
  );
}

/* =========================================
   04. INVENTORY PREVIEW
========================================= */

function InventoryPreview() {
  return (
    <PreviewPanel>
      <PreviewHeading
        icon={Package}
        title="Jar inventory"
        subtitle="Inventory management overview"
      />

      <div className="mt-5 flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF5F0] text-[#087E80]">
          <Boxes size={22} />
        </span>

        <div>
          <p className="text-[11px] font-bold text-[#34413D]">
            Jar operations
          </p>

          <p className="mt-1 text-[9px] text-[#87928A]">
            Monitor inventory records and stock movement
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {["Stock records", "Jar tracking", "Inventory view"].map((label) => (
          <div
            key={label}
            className="rounded-lg border border-[#E8ECE5] bg-white px-2 py-3 text-center"
          >
            <Check size={14} className="mx-auto text-[#087E80]" />

            <p className="mt-2 text-[9px] font-semibold leading-4 text-[#68766D]">
              {label}
            </p>
          </div>
        ))}
      </div>
    </PreviewPanel>
  );
}

/* =========================================
   05. PAYMENTS PREVIEW
========================================= */

function PaymentsPreview() {
  return (
    <PreviewPanel>
      <PreviewHeading
        icon={Wallet}
        title="Payment records"
        subtitle="Organised transaction tracking"
      />

      <div className="mt-5 space-y-3">
        {[
          "Cash",
          "UPI",
          "Bank transfer",
        ].map((method) => (
          <div
            key={method}
            className="flex items-center gap-3 rounded-lg border border-[#E8ECE5] bg-white px-3 py-2.5"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#EAF5F0] text-[#087E80]">
              <Wallet size={14} />
            </span>

            <span className="text-[10px] font-semibold text-[#53615A]">
              {method}
            </span>

            <Check
              size={14}
              className="ml-auto text-[#087E80]"
            />
          </div>
        ))}
      </div>
    </PreviewPanel>
  );
}

/* =========================================
   06. REPORTS PREVIEW
========================================= */

function ReportsPreview() {
  return (
    <PreviewPanel>
      <PreviewHeading
        icon={ChartNoAxesCombined}
        title="Reports & Analytics"
        subtitle="Review your business activity"
      />

      <div className="mt-5 rounded-xl border border-[#E8ECE5] bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-[#53615A]">
            Business insights
          </p>

          <ChartNoAxesCombined
            size={18}
            className="text-[#087E80]"
          />
        </div>

        <div className="mt-5 flex h-16 items-end gap-2">
          {[35, 55, 42, 72, 58, 88, 68, 95, 74, 82, 60, 90].map(
            (height, index) => (
              <span
                key={index}
                className="flex-1 rounded-t-sm bg-[#87CFC2]"
                style={{ height: `${height}%` }}
              />
            )
          )}
        </div>

        <p className="mt-3 text-[9px] text-[#87928A]">
          Illustrative report visual
        </p>
      </div>
    </PreviewPanel>
  );
}

/* =========================================
   07. EMPLOYEE PREVIEW
========================================= */

function EmployeePreview() {
  return (
    <PreviewPanel>
      <PreviewHeading
        icon={UserRoundCog}
        title="Team management"
        subtitle="Organise employee information"
      />

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {[
          "Employee records",
          "Team information",
          "Work organisation",
        ].map((label) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-xl border border-[#E8ECE5] bg-white p-3"
          >
            <Check size={14} className="shrink-0 text-[#087E80]" />

            <span className="text-[9px] font-semibold leading-4 text-[#53615A]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </PreviewPanel>
  );
}

/* =========================================
   08. COMMUNICATION PREVIEW
========================================= */

function CommunicationPreview() {
  return (
    <PreviewPanel>
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF5F0] text-[#087E80]">
          <MessageCircle size={20} />
        </span>

        <div className="min-w-0">
          <p className="text-[11px] font-bold text-[#34413D]">
            Customer communication
          </p>

          <p className="mt-1 text-[9px] leading-5 text-[#87928A]">
            Tools for customer updates and follow-ups.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          "Customer updates",
          "Follow-ups",
          "Communication",
        ].map((label) => (
          <span
            key={label}
            className="rounded-lg border border-[#DCEBE3] bg-white px-3 py-2 text-[9px] font-semibold text-[#53615A]"
          >
            {label}
          </span>
        ))}
      </div>
    </PreviewPanel>
  );
}

/* =========================================
   PREVIEW MAPPING
========================================= */

const previews = {
  delivery: DeliveryPreview,
  billing: BillingPreview,
  customers: CustomerPreview,
  inventory: InventoryPreview,
  payments: PaymentsPreview,
  reports: ReportsPreview,
  employees: EmployeePreview,
  communication: CommunicationPreview,
};

/* =========================================
   FEATURE CARD
========================================= */

function FeatureBentoCard({ feature }) {
  const Icon = feature.icon;
  const Preview = previews[feature.type];

  return (
    <article
      className={`
        group relative flex min-w-0 flex-col overflow-hidden
        rounded-[22px] border border-[#E7E9E1]
        bg-white p-5
        shadow-[0_4px_18px_rgba(36,38,43,0.035)]
        transition-all duration-300
        hover:-translate-y-1
        hover:border-[#B9DAD0]
        hover:shadow-[0_16px_36px_rgba(36,38,43,0.08)]
        sm:p-6
        ${feature.span}
      `}
    >
      {/* CARD HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <FeatureIcon icon={Icon} />

          <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#087E80] sm:text-[10px]">
            {feature.number} · {feature.title}
          </span>
        </div>

        <span className="shrink-0 text-xl font-black text-[#E8ECE5]">
          {feature.number}
        </span>
      </div>

      {/* CARD CONTENT */}
      <h3 className="mt-5 max-w-lg text-[19px] font-extrabold leading-tight tracking-tight text-[#24262B] sm:text-[21px]">
        {feature.title}
      </h3>

      <p className="mt-2 max-w-lg text-[12px] leading-6 text-[#737E78] sm:text-[13px]">
        {feature.description}
      </p>

      {/* FEATURE PREVIEW */}
      {Preview && <Preview />}
    </article>
  );
}

/* =========================================
   MAIN FEATURES SECTION
========================================= */

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative isolate scroll-mt-24 overflow-hidden bg-[#F7F6F0] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:px-16"
    >
      {/* BACKGROUND ACCENTS */}
      <div className="pointer-events-none absolute -left-40 top-10 -z-10 size-[420px] rounded-full bg-[#CDEBE3]/35 blur-[120px]" />

      <div className="pointer-events-none absolute -right-40 bottom-10 -z-10 size-[420px] rounded-full bg-[#E9CA43]/10 blur-[120px]" />

      <div className="mx-auto max-w-[1440px]">

        {/* SECTION INTRO */}
        <div className="mb-9 flex flex-col justify-between gap-5 sm:mb-12 lg:flex-row lg:items-end">

          <div className="max-w-2xl">

            {/* EYEBROW */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#DDE8DD] bg-white px-3.5 py-2">
              <span className="size-1.5 rounded-full bg-[#087E80]" />

              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#087E80]">
                Everything your business needs
              </span>
            </div>

            {/* HEADING */}
            <h2 className="text-balance text-[34px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#24262B] sm:text-[44px] lg:text-[52px]">
              One app.
              <br />

              A whole water business{" "}
              <span className="text-[#087E80]">
                organised.
              </span>
            </h2>

            {/* DESCRIPTION */}
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#737E78] sm:text-base sm:leading-8">
              Everything you need to manage customers, deliveries,
              inventory, billing and everyday operations — in one
              connected workspace.
            </p>
          </div>

          {/* SECTION CTA */}
          <a
            href="#contact"
            className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-[#DDE5DA] bg-white px-5 text-xs font-bold text-[#34413D] transition hover:border-[#087E80] hover:text-[#087E80] lg:self-end"
          >
            Book a Free Demo

            <ArrowUpRight
              size={15}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
        </div>

        {/* FEATURES BENTO GRID */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:auto-rows-auto">

          {features.map((feature) => (
            <FeatureBentoCard
              key={feature.number}
              feature={feature}
            />
          ))}

        </div>

        {/* ADDITIONAL CAPABILITIES */}
        <div className="mt-8 border-t border-[#E1E5DC] pt-7 sm:mt-10 sm:pt-8">

          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#EAF5F0] text-[#087E80]">
              <Check size={15} />
            </span>

            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#53615A]">
              Also included in your workspace
            </h3>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">

            {additionalCapabilities.map((item) => (
              <div
                key={item}
                className="flex min-w-0 items-start gap-2 text-[11px] font-medium leading-5 text-[#737E78] sm:text-xs"
              >
                <Check
                  size={14}
                  className="mt-0.5 shrink-0 text-[#087E80]"
                />

                <span>{item}</span>
              </div>
            ))}

          </div>
        </div>

      </div>
    </section>
  );
}
