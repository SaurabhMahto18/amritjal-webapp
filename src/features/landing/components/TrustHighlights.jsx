
import {
  ClipboardList,
  PackageCheck,
  ReceiptText,
  Users,
  ArrowUpRight,
} from "lucide-react";

const items = [
  {
    icon: Users,
    title: "Customer Records",
    text: "Organised customer information",
    number: "01",
    accent: "#087E80",
  },
  {
    icon: ClipboardList,
    title: "Delivery Operations",
    text: "Daily delivery tracking",
    number: "02",
    accent: "#5486B5",
  },
  {
    icon: PackageCheck,
    title: "Jar Management",
    text: "Jar operations visibility",
    number: "03",
    accent: "#C28A25",
  },
  {
    icon: ReceiptText,
    title: "Billing & Payments",
    text: "Invoices and transaction records",
    number: "04",
    accent: "#8972B8",
  },
];

export default function TrustHighlights() {
  return (
    <section className="relative overflow-hidden border-y border-[#EDEAE0] bg-[#daf0ee]">
      {/* Subtle background accents */}
      <div className="pointer-events-none absolute -left-20 top-0 size-48 rounded-full bg-[#087E80]/[0.04] blur-[80px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 size-48 rounded-full bg-[#E9CA43]/[0.08] blur-[80px]" />

      <div className="relative mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-12 lg:py-11 xl:px-16">
        {/* Section intro */}
        <div className="mb-6 flex flex-col gap-2 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#087E80] sm:text-[11px]">
              Everything in one place
            </p>

            <h2 className="mt-2 text-xl font-black tracking-tight text-[#24262B] sm:text-2xl">
              Your business essentials, organised.
            </h2>
          </div>

          <p className="max-w-xs text-xs font-medium leading-relaxed text-[#777970] sm:text-right sm:text-sm">
            Built to simplify everyday water delivery operations.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, text, number, accent }) => (
            <div
              key={title}
              className="
                group relative flex min-w-0 items-start gap-3
                overflow-hidden rounded-2xl border border-[#EDEAE0]
                bg-[#F7F6F0] p-3.5
                transition-all duration-300
                hover:-translate-y-1 hover:border-[#087E80]/30
                hover:bg-white hover:shadow-[0_12px_30px_rgba(36,38,43,0.07)]
                sm:gap-4 sm:p-4
                lg:p-5
              "
            >
              {/* Icon */}
              <span
                className="
                  flex size-10 shrink-0 items-center justify-center
                  rounded-xl border border-[#EDEAE0] bg-white
                  transition-all duration-300
                  group-hover:border-transparent
                  sm:size-11
                "
                style={{ color: accent }}
              >
                <Icon size={21} strokeWidth={1.9} />
              </span>

              {/* Text */}
              <div className="relative z-10 min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between gap-1">
                  <span className="text-[9px] font-extrabold tracking-wider text-[#A5A49B]">
                    {number}
                  </span>

                  <ArrowUpRight
                    size={14}
                    className="shrink-0 text-[#A5A49B] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    style={{ color: undefined }}
                  />
                </div>

                <h3 className="break-words text-xs font-extrabold leading-snug text-[#24262B] sm:text-sm">
                  {title}
                </h3>

                <p className="mt-1.5 break-words text-[10px] leading-relaxed text-[#777970] sm:text-xs">
                  {text}
                </p>
              </div>

              {/* Decorative accent */}
              <span
                className="
                  pointer-events-none absolute -bottom-7 -right-7
                  size-20 rounded-full opacity-[0.06]
                  transition-transform duration-500
                  group-hover:scale-150
                "
                style={{ backgroundColor: accent }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
