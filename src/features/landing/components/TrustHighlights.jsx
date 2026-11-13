
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
    accent: "#63D6D2",
  },
  {
    icon: ClipboardList,
    title: "Delivery Operations",
    text: "Daily delivery tracking",
    number: "02",
    accent: "#8CBCE5",
  },
  {
    icon: PackageCheck,
    title: "Jar Management",
    text: "Jar operations visibility",
    number: "03",
    accent: "#F2A93B",
  },
  {
    icon: ReceiptText,
    title: "Billing & Payments",
    text: "Invoices and transaction records",
    number: "04",
    accent: "#B6A1E5",
  },
];

export default function TrustHighlights() {
  return (
    <section className="relative overflow-hidden border-y border-[#294057] bg-[#0B192B]">

      {/* SUBTLE BACKGROUND ACCENTS */}
      <div className="pointer-events-none absolute -left-24 top-0 size-48 rounded-full bg-[#087E85]/10 blur-[80px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-48 rounded-full bg-[#F2A93B]/[0.06] blur-[80px]" />

      <div className="relative mx-auto max-w-[1600px] px-4 py-7 sm:px-6 sm:py-8 lg:px-12 lg:py-9 xl:px-16">

        {/* SECTION INTRO */}
        <div className="mb-5 flex flex-col gap-1 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#63D6D2]">
              Everything in one place
            </p>

            <h2 className="mt-1 text-lg font-black tracking-tight text-white sm:text-xl">
              Your business essentials, organised.
            </h2>
          </div>

          <p className="hidden text-xs font-medium text-[#91A5B8] sm:block">
            Built for everyday water delivery operations
          </p>
        </div>

        {/* FEATURE GRID */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {items.map(({ icon: Icon, title, text, number, accent }) => (
            <div
              key={title}
              className="
                group relative flex min-w-0 items-start gap-3
                overflow-hidden rounded-2xl border border-[#294057]
                bg-[#13263B] p-3.5
                transition-all duration-300
                hover:-translate-y-1 hover:border-[#63D6D2]/50
                hover:bg-[#172D43]
                hover:shadow-[0_10px_28px_rgba(0,0,0,0.18)]
                sm:gap-4 sm:p-4
                lg:p-5
              "
            >
              {/* ICON */}
              <span
                className="
                  flex size-10 shrink-0 items-center justify-center
                  rounded-xl border border-white/10 bg-white/[0.06]
                  transition-all duration-300
                  group-hover:bg-white/10
                  sm:size-11
                "
                style={{ color: accent }}
              >
                <Icon size={21} strokeWidth={1.9} />
              </span>

              {/* TEXT */}
              <div className="relative z-10 min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-1">
                  <span className="text-[9px] font-extrabold tracking-wider text-[#6F8497]">
                    {number}
                  </span>

                  <ArrowUpRight
                    size={13}
                    className="shrink-0 text-[#71889A] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#63D6D2]"
                  />
                </div>

                <h3 className="break-words text-[12px] font-extrabold leading-snug text-white sm:text-sm">
                  {title}
                </h3>

                <p className="mt-1 break-words text-[10px] leading-[1.5] text-[#A8B8C7] sm:text-xs">
                  {text}
                </p>
              </div>

              {/* SUBTLE DECORATION */}
              <span className="pointer-events-none absolute -bottom-5 -right-5 size-16 rounded-full bg-[#63D6D2]/[0.05] transition-transform duration-300 group-hover:scale-150" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
