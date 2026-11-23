
import { useState } from "react";
import {
  Droplet,
  Store,
  Truck,
  Building2,
  ArrowUpRight,
  Check,
  Users,
  Package,
  Receipt,
  Sparkles,
} from "lucide-react";

const audiences = [
  {
    number: "01",
    icon: Droplet,
    title: "Water Jar Suppliers",
    subtitle: "Home & office water delivery",
    description:
      "Manage recurring jar deliveries, customer accounts and daily supply operations.",
    accent: "#087E80",
    background: "#EAF5F2",
    capabilities: [
      "Recurring customer deliveries",
      "Customer account records",
      "Daily supply management",
    ],
  },
  {
    number: "02",
    icon: Store,
    title: "Local Water Distributors",
    subtitle: "Local supply businesses",
    description:
      "Organise repeat orders, customer information, payments and delivery records.",
    accent: "#B58A35",
    background: "#FBF4E4",
    capabilities: [
      "Repeat order organisation",
      "Customer information",
      "Payment and delivery records",
    ],
  },
  {
    number: "03",
    icon: Truck,
    title: "Delivery-led Businesses",
    subtitle: "Drivers & delivery teams",
    description:
      "Keep daily delivery activity, staff operations and collections organised.",
    accent: "#557FA9",
    background: "#EAF2F9",
    capabilities: [
      "Daily delivery activity",
      "Team operations",
      "Collection records",
    ],
  },
  {
    number: "04",
    icon: Building2,
    title: "Growing Water Businesses",
    subtitle: "Expanding distribution agencies",
    description:
      "Bring customer accounts, jar operations, invoices and business records together.",
    accent: "#8067B2",
    background: "#F0EDF9",
    capabilities: [
      "Customer account management",
      "Jar operations",
      "Invoices and business records",
    ],
  },
];

function AudienceCard({ audience, active, onSelect }) {
  const Icon = audience.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`
        group relative flex min-h-[225px] w-full flex-col
        overflow-hidden rounded-[22px] border p-5 text-left
        transition-all duration-300 sm:min-h-[245px] sm:p-6
        ${
          active
            ? "border-[#087E80]/35 bg-white shadow-[0_14px_35px_rgba(8,126,128,0.09)]"
            : "border-[#EDEAE0] bg-white hover:-translate-y-1 hover:border-[#C9DCD5] hover:shadow-[0_12px_28px_rgba(36,38,43,0.05)]"
        }
      `}
    >
      {/* Card background decoration */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full opacity-60 transition-transform duration-500 group-hover:scale-125"
        style={{ backgroundColor: audience.background }}
      />

      {/* Card header */}
      <div className="relative flex items-center justify-between">
        <span
          className="flex size-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
          style={{
            backgroundColor: audience.background,
            color: audience.accent,
          }}
        >
          <Icon size={23} strokeWidth={1.8} />
        </span>

        <span className="text-[10px] font-extrabold tracking-[0.15em] text-[#A5A49B]">
          {audience.number}
        </span>
      </div>

      {/* Card content */}
      <div className="relative mt-7 flex-1">
        <p
          className="text-[9px] font-extrabold uppercase tracking-[0.13em]"
          style={{ color: audience.accent }}
        >
          {audience.subtitle}
        </p>

        <h3 className="mt-2 text-lg font-extrabold leading-snug tracking-tight text-[#24262B] sm:text-xl">
          {audience.title}
        </h3>

        <p className="mt-2 text-xs leading-6 text-[#777970]">
          {audience.description}
        </p>
      </div>

      {/* Card footer */}
      <div className="relative mt-5 flex items-center justify-between border-t border-[#EDEAE0] pt-4">
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: audience.accent }}
        >
          {active ? "Selected" : "Explore business type"}
        </span>

        <span
          className={`
            flex size-8 items-center justify-center rounded-full
            transition-all duration-300
            ${
              active
                ? "text-white"
                : "bg-[#F7F6F0] text-[#777970] group-hover:text-white"
            }
          `}
          style={{
            backgroundColor: active ? audience.accent : undefined,
          }}
        >
          <ArrowUpRight size={16} />
        </span>
      </div>
    </button>
  );
}

export default function TargetAudienceSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeAudience = audiences[activeIndex];
  const ActiveIcon = activeAudience.icon;

  return (
    <section
      id="who-its-for"
      aria-labelledby="audience-heading"
      className="relative isolate overflow-hidden bg-[#F7F6F0] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:px-16"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 top-10 -z-10 size-80 rounded-full bg-[#087E80]/[0.05] blur-[100px]" />

      <div className="pointer-events-none absolute -right-40 bottom-0 -z-10 size-80 rounded-full bg-[#E9CA43]/[0.09] blur-[100px]" />

      <div className="mx-auto max-w-[1320px]">
        {/* Section heading */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EDEAE0] bg-white px-3.5 py-2 shadow-sm">
            <span className="size-1.5 rounded-full bg-[#087E80]" />

            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#087E80]">
              Who we serve
            </span>
          </div>

          <h2
            id="audience-heading"
            className="mt-6 text-balance text-[34px] font-black leading-[1.1] tracking-[-0.045em] text-[#24262B] sm:text-[46px] lg:text-[54px] xl:text-[60px]"
          >
            Made for your kind of
            <span className="block text-[#087E80]">
              water business.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#777970] sm:text-base sm:leading-8">
            Whether you deliver water locally or manage a growing
            distribution agency, Amrit Jal helps organise the
            everyday work behind your business.
          </p>
        </div>

        {/* Audience cards */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-5">
          {audiences.map((audience, index) => (
            <AudienceCard
              key={audience.number}
              audience={audience}
              active={activeIndex === index}
              onSelect={() => setActiveIndex(index)}
            />
          ))}
        </div>

        {/* Selected audience detail panel */}
        <div
          className="mt-6 overflow-hidden rounded-[24px] border border-[#E5E2D8] bg-white shadow-[0_8px_28px_rgba(36,38,43,0.035)]"
          aria-live="polite"
        >
          <div className="grid items-center gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_1.2fr] lg:p-8">
            {/* Selected business */}
            <div className="flex items-start gap-4">
              <span
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  color: activeAudience.accent,
                  backgroundColor: activeAudience.background,
                }}
              >
                <ActiveIcon size={27} strokeWidth={1.8} />
              </span>

              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#96968D]">
                  Your selected business type
                </p>

                <h3 className="mt-1 text-lg font-black tracking-tight text-[#24262B] sm:text-xl">
                  {activeAudience.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#777970]">
                  {activeAudience.subtitle}
                </p>
              </div>
            </div>

            {/* Capabilities */}
            <div>
              <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#96968D]">
                Workflows that matter
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {activeAudience.capabilities.map((item, index) => {
                  const icons = [Users, Package, Receipt];
                  const CapabilityIcon = icons[index];

                  return (
                    <div
                      key={item}
                      className="flex min-w-0 items-start gap-2.5 rounded-xl bg-[#F7F6F0] p-3"
                    >
                      <span
                        className="mt-0.5 shrink-0"
                        style={{ color: activeAudience.accent }}
                      >
                        <CapabilityIcon size={16} />
                      </span>

                      <span className="text-[11px] font-semibold leading-5 text-[#62645D]">
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA strip */}
        <div className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-[#E5E2D8] pt-7 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#EDEAE0] bg-white text-[#087E80]">
              <Droplet size={21} />
            </span>

            <div>
              <p className="text-sm font-extrabold text-[#24262B]">
                One platform. Different business needs.
              </p>

              <p className="mt-1 text-xs leading-5 text-[#898A81]">
                Designed for businesses that deliver water every day.
              </p>
            </div>
          </div>

          <a
            href="#contact"
            className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-[#087E80] px-6 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#06696B] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#087E80]/20"
          >
            Talk to our team
            <ArrowUpRight
              size={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
