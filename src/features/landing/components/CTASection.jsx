
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
      className="
        relative isolate w-full overflow-hidden
        bg-[#EDF3EF] px-4 py-16
        sm:px-6 sm:py-20
        lg:px-10 lg:py-24 xl:px-16
      "
    >
      {/* Background accents */}
      <div className="pointer-events-none absolute -right-24 -top-32 -z-10 size-[360px] rounded-full bg-[#087E80]/[0.07] blur-[100px]" />

      <div className="pointer-events-none absolute -bottom-40 -left-20 -z-10 size-[300px] rounded-full bg-[#E9CA43]/[0.12] blur-[100px]" />

      {/* Main CTA card */}
      <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[28px] border border-[#EDEAE0] bg-white px-5 py-12 shadow-[0_15px_50px_rgba(36,38,43,0.05)] sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        {/* Decorative elements */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-16 flex size-44 items-center justify-center rounded-full border border-[#EDEAE0] bg-[#F7F6F0]/70 text-[#087E80]/10 sm:right-5 sm:top-5 sm:size-56"
        >
          <Droplets size={110} strokeWidth={1} />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-20 size-64 rounded-full bg-[#E9CA43]/[0.08] blur-[70px]"
        />

        {/* Content */}
        <div className="relative mx-auto max-w-4xl text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EDEAE0] bg-[#F7F6F0] px-4 py-2">
            <Sparkles size={13} className="text-[#B58A35]" />

            <span className="text-[9px] font-extrabold uppercase tracking-[0.17em] text-[#087E80] sm:text-[10px]">
              Take control of daily operations
            </span>
          </div>

          {/* Heading */}
          <h2
            id="cta-heading"
            className="
              mx-auto mt-6 max-w-3xl text-balance
              text-[34px] font-black leading-[1.12]
              tracking-[-0.04em] text-[#24262B]
              sm:text-[44px] lg:text-[56px] xl:text-[64px]
            "
          >
            Ready to organise your
            <span className="block text-[#087E80]">
              water delivery business?
            </span>
          </h2>

          {/* Description */}
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#777970] sm:text-base sm:leading-8">
            Bring customer records, daily deliveries, jar operations,
            payments and invoices together with Amrit Jal.
            Start building a more organised business workflow.
          </p>

          {/* Benefits */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            {benefits.map((benefit) => (
              <span
                key={benefit}
                className="inline-flex items-center gap-2 text-[10px] font-semibold text-[#62645D] sm:text-xs"
              >
                <CheckCircle2
                  size={14}
                  className="shrink-0 text-[#087E80]"
                />
                {benefit}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              to="/signup"
              className="
                group inline-flex min-h-12 items-center
                justify-center gap-3 rounded-full
                bg-[#087E80] px-7 py-3.5
                text-sm font-extrabold text-white
                shadow-[0_8px_25px_rgba(8,126,128,0.16)]
                transition-all duration-300
                hover:-translate-y-1 hover:bg-[#06696B]
                hover:shadow-[0_12px_30px_rgba(8,126,128,0.22)]
                focus-visible:outline-none
                focus-visible:ring-4 focus-visible:ring-[#087E80]/20
              "
            >
              Get started
              <ArrowUpRight
                size={17}
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>

            <Link
              to="/login"
              className="
                inline-flex min-h-12 items-center
                justify-center gap-2 rounded-full
                border border-[#E5E2D8] bg-white
                px-7 py-3.5 text-sm font-bold
                text-[#24262B]
                transition-all duration-300
                hover:-translate-y-0.5 hover:border-[#087E80]/40
                hover:bg-[#F7F6F0]
                focus-visible:outline-none
                focus-visible:ring-4 focus-visible:ring-[#087E80]/15
              "
            >
              Already have an account?
            </Link>
          </div>

          {/* Footnote */}
          <p className="mt-6 text-[10px] leading-5 text-[#96968D]">
            Manage your water delivery business from one connected workspace.
          </p>
        </div>
      </div>
    </section>
  );
}
