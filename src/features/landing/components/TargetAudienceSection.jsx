
import {
  Droplet,
  Store,
  Truck,
  Building2,
  ArrowUpRight,
  Check,
  MoveUpRight,
} from "lucide-react";

const audiences = [
  {
    number: "01",
    icon: Droplet,
    title: "Water Jar Suppliers",
    subtitle: "Home & office water delivery",
    description:
      "Manage recurring jar deliveries, customer accounts and daily supply operations.",
    accent: "#087E85",
    background: "#E6F5F2",
  },
  {
    number: "02",
    icon: Store,
    title: "Local Water Distributors",
    subtitle: "Local supply businesses",
    description:
      "Organise repeat orders, customer information, payments and delivery records.",
    accent: "#D58B27",
    background: "#FFF3DF",
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
  },
];

export default function TargetAudienceSection() {
  return (
    <section
      id="who-its-for"
      aria-labelledby="audience-heading"
      className="relative isolate overflow-hidden bg-[#F7F6F0] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:px-16"
    >
      <div className="mx-auto max-w-[1440px]">

        {/* MAIN LAYOUT */}
        <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 xl:gap-24">

          {/* LEFT: EDITORIAL INTRO */}
          <div className="lg:sticky lg:top-28">

            <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE7E0] bg-white px-3.5 py-2">
              <span className="size-1.5 rounded-full bg-[#087E85]" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#087E85]">
                Who we serve
              </span>
            </div>

            <h2
              id="audience-heading"
              className="mt-6 max-w-xl text-balance text-[36px] font-black leading-[1.08] tracking-[-0.045em] text-[#101F35] sm:text-[46px] lg:text-[52px] xl:text-[60px]"
            >
              Made for the people behind
              <span className="relative mt-1 block w-fit text-[#087E85]">
                every water delivery.
                <span className="absolute -bottom-2 left-0 h-[3px] w-full rounded-full bg-[#F2A93B]" />
              </span>
            </h2>

            <p className="mt-7 max-w-lg text-sm leading-7 text-[#687B87] sm:text-base sm:leading-8">
              Every water delivery business has its own daily challenges.
              From managing repeat customers to tracking deliveries and
              collections, Amrit Jal brings important business workflows
              into one organised workspace.
            </p>

            {/* SUPPORTING MESSAGE */}
            <div className="mt-9 rounded-2xl border border-[#E1E9E3] bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F5F2] text-[#087E85]">
                  <Check size={20} />
                </span>

                <div>
                  <p className="text-sm font-extrabold text-[#172B40]">
                    One workspace for everyday operations.
                  </p>
                  <p className="mt-2 text-xs leading-6 text-[#81909A]">
                    Customer records, deliveries, jar management,
                    payments and invoices — organised together.
                  </p>
                </div>
              </div>
            </div>

            <a
              href="#contact"
              className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#087E85] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(8,126,133,0.16)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#066B71] hover:shadow-lg"
            >
              Explore Amrit Jal
              <ArrowUpRight size={17} />
            </a>
          </div>

          {/* RIGHT: AUDIENCE LIST */}
          <div className="min-w-0">

            <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#DDE5DE] pb-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#84938D]">
                Businesses we support
              </p>

              <span className="text-xs font-bold text-[#087E85]">
                01 — 04
              </span>
            </div>

            <div className="divide-y divide-[#DDE5DE]">
              {audiences.map(
                ({
                  number,
                  icon: Icon,
                  title,
                  subtitle,
                  description,
                  accent,
                  background,
                }) => (
                  <article
                    key={number}
                    className="group grid grid-cols-[48px_minmax(0,1fr)] gap-4 py-6 transition-all duration-300 sm:grid-cols-[58px_minmax(0,1fr)] sm:gap-5 sm:py-8"
                  >
                    {/* ICON */}
                    <div
                      className="flex size-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 sm:size-[52px] sm:rounded-2xl"
                      style={{
                        color: accent,
                        backgroundColor: background,
                      }}
                    >
                      <Icon size={23} strokeWidth={1.8} />
                    </div>

                    {/* DETAILS */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[9px] font-extrabold tracking-widest text-[#A0ADA5]">
                          {number}
                        </span>

                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: accent }}
                        />

                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#84938D]">
                          {subtitle}
                        </p>
                      </div>

                      <div className="mt-2 flex items-start justify-between gap-3">
                        <h3 className="text-base font-extrabold tracking-tight text-[#172B40] transition-colors group-hover:text-[#087E85] sm:text-xl">
                          {title}
                        </h3>

                        <MoveUpRight
                          size={18}
                          className="mt-0.5 shrink-0 text-[#A8B8B2] transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#087E85]"
                        />
                      </div>

                      <p className="mt-2 max-w-lg text-xs leading-6 text-[#718394] sm:text-sm sm:leading-7">
                        {description}
                      </p>
                    </div>
                  </article>
                )
              )}
            </div>

            {/* BOTTOM NOTE */}
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#EAF3ED] px-4 py-4">
              <Droplet size={18} className="shrink-0 text-[#087E85]" />
              <p className="text-xs leading-5 text-[#536F69]">
                Whether you serve a few neighbourhoods or manage a growing
                distribution operation, keep your daily records organised.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
