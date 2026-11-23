
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Sparkles,
  Users,
  Truck,
  ReceiptText,
  ChartNoAxesCombined,
} from "lucide-react";

const quickFeatures = [
  { icon: Users, label: "Customers" },
  { icon: Truck, label: "Deliveries" },
  { icon: ReceiptText, label: "Invoices" },
  { icon: ChartNoAxesCombined, label: "Reports" },
];

export default function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#F7F6F0]">

      {/* BACKGROUND DECORATION */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-[400px] rounded-full bg-[#CDEBE3]/50 blur-[100px]" />

        <div className="absolute -right-40 top-20 size-[450px] rounded-full bg-[#DCEFE7]/70 blur-[110px]" />

        <div className="absolute bottom-0 left-[35%] h-[200px] w-[400px] rounded-full bg-[#E9CA43]/10 blur-[100px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#087E80 1px, transparent 1px), linear-gradient(90deg, #087E80 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
      </div>

      {/* MAIN HERO CONTAINER */}
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:min-h-[720px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:px-8 lg:py-16 xl:px-10">

        {/* =========================================
            LEFT: HERO CONTENT
        ========================================= */}
        <div className="relative z-10 mx-auto w-full max-w-[620px] lg:mx-0">

          {/* EYEBROW */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#DDE8DD] bg-white/90 px-3.5 py-2 shadow-sm sm:mb-7">
            <span className="flex size-6 items-center justify-center rounded-full bg-[#E8F4F0] text-[#087E80]">
              <Sparkles size={13} />
            </span>

            <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#536576] sm:text-[11px]">
              Water Business Management Software
            </span>
          </div>

          {/* HEADLINE */}
          <h1 className="max-w-[700px] text-[39px] font-extrabold leading-[1.1] tracking-[-0.045em] text-[#24262B] sm:text-[52px] lg:text-[58px] xl:text-[64px]">
            Run Your Water Business.

            <span className="mt-1 block text-[#087E80]">
              Smarter.
            </span>
          </h1>

          {/* DESCRIPTION */}
          <p className="mt-6 max-w-[560px] text-[14px] leading-7 text-[#626B70] sm:mt-7 sm:text-[17px] sm:leading-8">
            Manage customers, daily deliveries, jar inventory,
            invoices, payments and expenses — all from one
            simple business management platform.
          </p>

          {/* HINDI BRAND STATEMENT */}
          <div className="mt-5 flex max-w-[550px] items-start gap-3 rounded-xl border-l-[3px] border-[#E9CA43] bg-white/80 px-4 py-3.5">
            <span className="text-xl font-bold leading-none text-[#B18C20]">
              “
            </span>

            <p className="text-sm font-semibold leading-6 text-[#47545A] sm:text-[15px]">
              Har delivery ka hisaab. Har jar par nazar.
              Har payment ka record.
            </p>
          </div>

          {/* CTA BUTTONS */}
          <div className="mt-7 flex flex-col gap-3 min-[440px]:flex-row min-[440px]:items-center">

            <a
              href="/signup"
              className="group inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-[#087E80] px-6 text-sm font-bold text-white shadow-[0_9px_24px_rgba(8,126,128,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#06696B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#087E80]/20"
            >
              Start 30-Day Free Trial

              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </a>

            <a
              href="#features"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-[#DDE5DA] bg-white px-6 text-sm font-semibold text-[#34434A] transition hover:border-[#087E80] hover:bg-[#F5FAF7] hover:text-[#087E80]"
            >
              Explore Features

              <ArrowUpRight size={17} />
            </a>
          </div>

          {/* TRUST POINTS */}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2.5 text-xs font-medium text-[#687579]">

            <span className="inline-flex items-center gap-1.5">
              <Check size={15} className="text-[#087E80]" />
              30-day free trial
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Check size={15} className="text-[#087E80]" />
              Monthly & yearly plans
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Check size={15} className="text-[#087E80]" />
              For small & large businesses
            </span>

          </div>

          {/* QUICK FEATURE SHORTCUTS */}
          <div className="mt-8 grid grid-cols-4 gap-2 sm:max-w-[530px] sm:gap-3">

            {quickFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <a
                  key={feature.label}
                  href="#features"
                  className="flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-[#E5E9DF] bg-white/90 px-1 py-3.5 shadow-sm transition hover:-translate-y-1 hover:border-[#B9DAD0] sm:flex-row sm:justify-start sm:px-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F4F0] text-[#087E80]">
                    <Icon size={18} />
                  </span>

                  <span className="truncate text-[10px] font-bold text-[#53616A] sm:text-xs">
                    {feature.label}
                  </span>
                </a>
              );
            })}

          </div>
        </div>

        {/* =========================================
            RIGHT: LAPTOP + MOBILE DASHBOARD
        ========================================= */}
        <div
          id="product-preview"
          className="relative mx-auto flex min-h-[390px] w-full max-w-[720px] items-center justify-center px-1 pb-12 pt-8 sm:min-h-[550px] sm:px-3 lg:min-h-[620px]"
        >

          {/* BACKGROUND WATER RIPPLES */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

            <div className="absolute size-[280px] rounded-full bg-[#CDEBE3]/50 blur-[90px] sm:size-[460px]" />

            <div className="absolute size-[350px] rounded-full border border-[#87CFC2]/25 sm:size-[560px]" />

            <div className="absolute size-[280px] rounded-full border border-[#87CFC2]/20 sm:size-[450px]" />

          </div>

          {/* LAPTOP BODY */}
          <div className="relative z-10 w-full">

            {/* LAPTOP SCREEN FRAME */}
            <div className="relative overflow-hidden rounded-t-[13px] border-[5px] border-[#252A30] bg-[#252A30] shadow-[0_25px_65px_rgba(20,35,35,0.22)] sm:rounded-t-[17px] sm:border-[8px]">

              {/* WEBCAM */}
              <div className="absolute left-1/2 top-[2px] z-20 flex -translate-x-1/2 items-center justify-center">
                <span className="size-[4px] rounded-full bg-[#75818A] ring-1 ring-[#414950] sm:size-[5px]" />
              </div>

              {/* REAL WEB DASHBOARD SCREEN */}
              <div className="overflow-hidden rounded-t-[5px] bg-white">

                <img
                  src="/images/landing/dashboard-desktop.png"
                  alt="Amrit Jal web dashboard showing business overview, payments, expenses, events and invoices on a laptop"
                  className="block h-auto w-full object-contain"
                  loading="eager"
                  fetchPriority="high"
                />

              </div>

              {/* SCREEN LABEL */}
              <div className="absolute bottom-3 left-3 hidden items-center gap-2 rounded-full border border-[#E5EBE5] bg-white/95 px-3 py-1.5 text-[10px] font-bold text-[#34413D] shadow-sm sm:flex">
                <span className="size-2 rounded-full bg-[#087E80]" />
                Web Dashboard
              </div>

            </div>

            {/* LAPTOP HINGE */}
            <div className="mx-auto h-[5px] w-[98%] rounded-b-md bg-[#8B9298]" />

            {/* LAPTOP BASE */}
            <div className="relative mx-auto h-[12px] w-[106%] -translate-x-[3%] rounded-b-[50%] border-x border-b border-[#AEB5BA] bg-[#D9DEE1] shadow-[0_12px_18px_rgba(20,35,35,0.13)] sm:h-[16px]">

              {/* TRACKPAD */}
              <div className="absolute left-1/2 top-0 h-[4px] w-[16%] -translate-x-1/2 rounded-b-md bg-[#AEB5BA] sm:h-[5px]" />

            </div>
          </div>

          {/* =========================================
              MOBILE PHONE PREVIEW
          ========================================= */}
          <div className="absolute bottom-2 right-0 z-30 w-[27%] min-w-[105px] max-w-[170px] overflow-hidden rounded-[20px] border-[4px] border-[#252A30] bg-[#252A30] shadow-[0_22px_50px_rgba(20,35,35,0.28)] sm:bottom-4 sm:right-[-1%] sm:w-[25%] sm:min-w-[140px] sm:rounded-[27px] sm:border-[6px]">

            {/* PHONE CAMERA / NOTCH */}
            <div className="absolute left-1/2 top-0 z-20 h-[9px] w-[35%] -translate-x-1/2 rounded-b-lg bg-[#252A30] sm:h-[12px]" />

            {/* REAL MOBILE DASHBOARD */}
            <img
              src="/images/landing/dashboard-mobile.png"
              alt="Amrit Jal mobile dashboard showing payments, invoices, deliveries and business events on a smartphone"
              className="block h-auto w-full rounded-[13px] bg-white object-contain sm:rounded-[19px]"
              loading="eager"
            />

          </div>

          {/* FLOATING WEB DASHBOARD LABEL */}
          <div className="absolute left-0 top-[3%] z-30 hidden items-center gap-2 rounded-xl border border-[#E5ECE8] bg-white px-3 py-2.5 shadow-lg sm:flex">

            <span className="flex size-8 items-center justify-center rounded-lg bg-[#E8F4F0] text-[#087E80]">
              <ChartNoAxesCombined size={17} />
            </span>

            <div>
              <p className="text-[10px] font-extrabold text-[#34413D]">
                Web Dashboard
              </p>

              <p className="text-[9px] text-[#8A9695]">
                Desktop experience
              </p>
            </div>

          </div>

          {/* MOBILE DASHBOARD LABEL */}
          <div className="absolute bottom-0 right-[2%] z-30 rounded-full border border-[#DDE8DD] bg-white px-3 py-1.5 text-[9px] font-bold text-[#087E80] shadow-md sm:bottom-1">
            Mobile Dashboard
          </div>

        </div>
      </div>
    </section>
  );
}
