
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Droplets,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const benefits = [
  "Organised customer records",
  "Daily delivery tracking",
  "Payments and invoice management",
];

export default function CTASection() {
  return (
    <section
      id="get-started"
      aria-labelledby="cta-heading"
      className="relative isolate w-full overflow-hidden bg-[#0B192B] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:px-16"
    >
      {/* GRID BACKGROUND */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(#8BA5B8 1px, transparent 1px),
            linear-gradient(90deg, #8BA5B8 1px, transparent 1px)
          `,
          backgroundSize: "42px 42px",
        }}
      />

      {/* BACKGROUND GLOWS */}
      <div className="pointer-events-none absolute -right-24 -top-32 -z-10 size-[360px] rounded-full bg-[#087E85]/25 blur-[100px]" />

      <div className="pointer-events-none absolute -bottom-40 -left-20 -z-10 size-[300px] rounded-full bg-[#F2A93B]/10 blur-[100px]" />

      {/* DECORATIVE WATER ICON */}
      <div className="pointer-events-none absolute right-8 top-8 hidden size-28 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.025] text-[#63D6D2]/20 sm:flex lg:right-16 lg:top-12 lg:size-40">
        <Droplets size={76} strokeWidth={1} />
      </div>

      {/* CONTENT */}
      <div className="relative mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-4xl text-center">

          {/* EYEBROW */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#315267] bg-[#142B40] px-4 py-2">
            <Sparkles size={13} className="text-[#F2A93B]" />
            <span className="text-[9px] font-extrabold uppercase tracking-[0.17em] text-[#83DCD5] sm:text-[10px]">
              Take control of daily operations
            </span>
          </div>

          {/* HEADING */}
          <h2
            id="cta-heading"
            className="mx-auto mt-6 max-w-3xl text-balance text-[34px] font-black leading-[1.12] tracking-[-0.04em] text-white sm:text-[44px] lg:text-[56px] xl:text-[64px]"
          >
            Ready to organise your
            <span className="block text-[#63D6D2]">
              water delivery business?
            </span>
          </h2>

          {/* DESCRIPTION */}
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#A8B8C7] sm:text-base sm:leading-8">
            Bring customer records, daily deliveries, jar operations,
            payments and invoices together with Amrit Jal.
            Start building a more organised business workflow.
          </p>

          {/* BENEFITS */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            {benefits.map((benefit) => (
              <span
                key={benefit}
                className="inline-flex items-center gap-2 text-[10px] font-medium text-[#C4D3DC] sm:text-xs"
              >
                <CheckCircle2
                  size={14}
                  className="shrink-0 text-[#63D6D2]"
                />
                {benefit}
              </span>
            ))}
          </div>

          {/* CTA BUTTONS */}
          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              to="/signup"
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#F2A93B] px-7 py-3.5 text-sm font-extrabold text-[#172B40] shadow-[0_8px_25px_rgba(242,169,59,0.2)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#FFBA52] hover:shadow-[0_12px_30px_rgba(242,169,59,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A93B]/30"
            >
              Get started
              <ArrowUpRight
                size={17}
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>

            <Link
              to="/login"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#496075] bg-white/[0.04] px-7 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:border-[#63D6D2] hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#63D6D2]/20"
            >
              Already have an account?
            </Link>
          </div>

          {/* FOOTNOTE */}
          <p className="mt-6 text-[10px] leading-5 text-[#8296A8]">
            Manage your water delivery business from one connected workspace.
          </p>
        </div>
      </div>
    </section>
  );
}
