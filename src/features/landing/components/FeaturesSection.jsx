
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
  Droplets,
  Clock3,
  FileText,
  Bell,
} from "lucide-react";

const features = [
  {
    number: "01",
    title: "Daily Delivery Tracking",
    description:
      "Record daily deliveries, track quantities and maintain customer-wise delivery history.",
    icon: Truck,
    type: "delivery",
    span: "lg:col-span-7 lg:row-span-2",
    accent: "#63D6D2",
  },
  {
    number: "02",
    title: "Invoices & Billing",
    description:
      "Create customer invoices and keep billing records organised.",
    icon: Receipt,
    type: "billing",
    span: "lg:col-span-5",
    accent: "#F2A93B",
  },
  {
    number: "03",
    title: "Customer Management",
    description:
      "Keep customer profiles, contact details and account information together.",
    icon: Users,
    type: "customers",
    span: "lg:col-span-5",
    accent: "#8CBCE5",
  },
  {
    number: "04",
    title: "Jar Management",
    description:
      "Monitor jar operations and inventory visibility.",
    icon: Package,
    type: "inventory",
    span: "lg:col-span-4",
    accent: "#63D6D2",
  },
  {
    number: "05",
    title: "Payments & Ledger",
    description:
      "Track customer payments, outstanding balances and ledger transactions.",
    icon: Wallet,
    type: "payments",
    span: "lg:col-span-4",
    accent: "#F2A93B",
  },
  {
    number: "06",
    title: "Reports & Analytics",
    description:
      "Review business activity and understand operations through reports.",
    icon: ChartNoAxesCombined,
    type: "reports",
    span: "lg:col-span-4",
    accent: "#8CBCE5",
  },
  {
    number: "07",
    title: "Employee Management",
    description:
      "Manage employee information and team operations.",
    icon: UserRoundCog,
    type: "employees",
    span: "lg:col-span-6",
    accent: "#B6A1E5",
  },
  {
    number: "08",
    title: "Customer Communication",
    description:
      "Access communication tools for customer updates and follow-ups.",
    icon: MessageCircle,
    type: "communication",
    span: "lg:col-span-6",
    accent: "#63D6D2",
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

function FeatureIcon({ icon: Icon, accent }) {
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07]"
      style={{ color: accent }}
    >
      <Icon size={20} strokeWidth={1.9} />
    </span>
  );
}

function PreviewPanel({ children }) {
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-[#0D1D30] p-4 sm:p-5">
      {children}
    </div>
  );
}

function DeliveryPreview() {
  return (
    <PreviewPanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#8BA0B4]">
            Delivery overview
          </p>
          <p className="mt-1 text-sm font-extrabold text-white">
            Daily operations
          </p>
        </div>
        <span className="rounded-full border border-[#63D6D2]/20 bg-[#63D6D2]/10 px-3 py-1.5 text-[9px] font-bold text-[#63D6D2]">
          Sample preview
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { value: "142", label: "Jars to deliver", icon: Truck, color: "#63D6D2" },
          { value: "88", label: "Delivered", icon: Package, color: "#F2A93B" },
          { value: "54", label: "Remaining", icon: Clock3, color: "#8CBCE5" },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`rounded-xl border border-white/[0.07] bg-white/[0.035] p-3 ${
                index === 2 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <Icon size={16} style={{ color: item.color }} />
              <p className="mt-3 text-2xl font-black text-white">
                {item.value}
              </p>
              <p className="mt-1 text-[9px] text-[#91A5B8]">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex justify-between text-[9px] font-semibold text-[#91A5B8]">
          <span>Delivery progress</span>
          <span>62%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[62%] rounded-full bg-[#63D6D2]" />
        </div>
      </div>
    </PreviewPanel>
  );
}

function BillingPreview() {
  return (
    <PreviewPanel>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[#F2A93B]" />
          <span className="text-[10px] font-bold text-white">
            Invoice preview
          </span>
        </div>
        <span className="text-[9px] font-bold text-[#F2A93B]">SAMPLE</span>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex justify-between text-[10px] text-[#91A5B8]">
          <span>Customer</span>
          <span className="text-white">Customer account</span>
        </div>
        <div className="flex justify-between text-[10px] text-[#91A5B8]">
          <span>Billing period</span>
          <span className="text-white">Monthly</span>
        </div>
        <div className="border-t border-dashed border-white/15 pt-3">
          <div className="flex justify-between text-[11px] font-extrabold text-white">
            <span>Invoice total</span>
            <span>₹ —</span>
          </div>
        </div>
      </div>
    </PreviewPanel>
  );
}

function CustomerPreview() {
  return (
    <PreviewPanel>
      <div className="space-y-2">
        {[
          ["A", "Customer profile", "Contact and account details"],
          ["B", "Delivery history", "Customer-wise records"],
        ].map(([initial, title, subtitle]) => (
          <div
            key={title}
            className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] p-3"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#8CBCE5]/10 text-xs font-black text-[#8CBCE5]">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-white">{title}</p>
              <p className="mt-1 text-[9px] text-[#91A5B8]">{subtitle}</p>
            </div>
            <ArrowUpRight size={14} className="ml-auto text-[#91A5B8]" />
          </div>
        ))}
      </div>
    </PreviewPanel>
  );
}

function InventoryPreview() {
  return (
    <PreviewPanel>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-white">Jar operations</span>
        <Package size={16} className="text-[#63D6D2]" />
      </div>
      <div className="mt-5 flex h-14 items-end gap-1.5">
        {Array.from({ length: 14 }).map((_, index) => (
          <span
            key={index}
            className={`flex-1 rounded-t-sm ${
              index % 4 === 0 ? "bg-[#F2A93B]" : "bg-[#63D6D2]/60"
            }`}
            style={{ height: `${20 + (index % 5) * 8}px` }}
          />
        ))}
      </div>
      <p className="mt-2 text-[9px] text-[#91A5B8]">
        Illustrative inventory visual
      </p>
    </PreviewPanel>
  );
}

function PaymentsPreview() {
  return (
    <PreviewPanel>
      <div className="flex items-center gap-2">
        <Wallet size={16} className="text-[#F2A93B]" />
        <span className="text-[10px] font-bold text-white">Payment records</span>
      </div>
      <div className="mt-4 space-y-3">
        {["Cash", "UPI", "Bank transfer"].map((method, index) => (
          <div key={method} className="flex items-center gap-3">
            <span className="w-20 text-[9px] font-semibold text-[#91A5B8]">
              {method}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#63D6D2]"
                style={{ width: `${85 - index * 22}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </PreviewPanel>
  );
}

function ReportsPreview() {
  return (
    <PreviewPanel>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold text-[#91A5B8]">
            Business insights
          </p>
          <p className="mt-2 text-sm font-extrabold text-white">
            Reports & Analytics
          </p>
          <p className="mt-1 text-[9px] text-[#91A5B8]">
            Review business activity
          </p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#8CBCE5]/10 text-[#8CBCE5]">
          <ChartNoAxesCombined size={20} />
        </span>
      </div>
    </PreviewPanel>
  );
}

function EmployeePreview() {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {["Employee records", "Team operations", "Salary tracking"].map((label) => (
        <span
          key={label}
          className="rounded-lg border border-white/10 bg-[#0D1D30] px-3 py-2 text-[9px] font-semibold text-[#C3D0DA]"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function CommunicationPreview() {
  return (
    <PreviewPanel>
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#63D6D2]/10 text-[#63D6D2]">
          <MessageCircle size={19} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-white">
            Customer communication
          </p>
          <p className="mt-1 text-[9px] leading-5 text-[#91A5B8]">
            Tools for customer updates and follow-ups.
          </p>
        </div>
      </div>
    </PreviewPanel>
  );
}

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

function FeatureBentoCard({ feature }) {
  const Icon = feature.icon;
  const Preview = previews[feature.type];

  return (
    <article
      className={`
        group relative flex min-w-0 flex-col overflow-hidden
        rounded-[22px] border border-[#294057]
        bg-[#13263B] p-5
        shadow-[0_5px_20px_rgba(0,0,0,0.12)]
        transition-all duration-300
        hover:-translate-y-1 hover:border-[#63D6D2]/50
        hover:shadow-[0_18px_38px_rgba(0,0,0,0.20)]
        sm:p-6
        ${feature.span}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <FeatureIcon icon={Icon} accent={feature.accent} />
          <span
            className="text-[9px] font-extrabold uppercase tracking-[0.14em]"
            style={{ color: feature.accent }}
          >
            {feature.number} · {feature.title}
          </span>
        </div>
        <span className="shrink-0 text-xl font-black text-white/15">
          {feature.number}
        </span>
      </div>

      <h3 className="mt-5 max-w-lg text-[19px] font-black leading-tight tracking-tight text-white sm:text-[21px]">
        {feature.title}
      </h3>
      <p className="mt-2 max-w-lg text-[12px] leading-6 text-[#A8B8C7] sm:text-[13px]">
        {feature.description}
      </p>

      {Preview && <Preview />}
    </article>
  );
}

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative isolate scroll-mt-24 overflow-hidden bg-[#0B192B] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:px-16"
    >
      {/* BACKGROUND ACCENTS */}
      <div className="pointer-events-none absolute -left-40 top-10 -z-10 size-[420px] rounded-full bg-[#087E85]/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-10 -z-10 size-[420px] rounded-full bg-[#F2A93B]/[0.07] blur-[120px]" />

      <div className="mx-auto max-w-[1440px]">

        {/* INTRO */}
        <div className="mb-9 flex flex-col justify-between gap-5 sm:mb-12 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#294057] bg-[#13263B] px-3.5 py-2">
              <span className="size-1.5 rounded-full bg-[#63D6D2]" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#63D6D2]">
                Everything your business needs
              </span>
            </div>

            <h2 className="text-balance text-[34px] font-black leading-[1.1] tracking-[-0.04em] text-white sm:text-[44px] lg:text-[52px]">
              One app.
              <br />
              A whole water business{" "}
              <span className="text-[#F2A93B]">organised.</span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#A8B8C7] sm:text-base sm:leading-8">
              Everything you need to manage customers, deliveries,
              inventory, billing and everyday operations — in one
              connected workspace.
            </p>
          </div>

          <a
            href="#contact"
            className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-[#3B5269] bg-[#13263B] px-5 text-xs font-bold text-white transition hover:border-[#63D6D2] hover:text-[#63D6D2] lg:self-end"
          >
            Book a Free Demo
            <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:auto-rows-auto">
          {features.map((feature) => (
            <FeatureBentoCard key={feature.number} feature={feature} />
          ))}
        </div>

        {/* ADDITIONAL CAPABILITIES */}
        <div className="mt-8 border-t border-[#294057] pt-7 sm:mt-10 sm:pt-8">
          <div className="flex items-center gap-2">
            <Check size={15} className="text-[#63D6D2]" />
            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#A8B8C7]">
              Also included in your workspace
            </h3>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              "Customer records",
              "Daily delivery records",
              "Jar inventory visibility",
              "Payment transactions",
              "Customer invoices",
              "Business reports",
              "Employee information",
              "Customer follow-ups",
            ].map((item) => (
              <div
                key={item}
                className="flex min-w-0 items-start gap-2 text-[11px] font-medium leading-5 text-[#A8B8C7] sm:text-xs"
              >
                <Check size={14} className="mt-0.5 shrink-0 text-[#63D6D2]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
