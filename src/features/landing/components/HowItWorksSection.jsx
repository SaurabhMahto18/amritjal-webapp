
import { useEffect, useRef, useState } from "react";
import {
  UserPlus,
  ContactRound,
  Truck,
  FileCheck,
  ChartNoAxesCombined,
  ArrowRight,
  ArrowUpRight,
  Check,
  Droplets,
  CircleCheck,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Set up your business",
    subtitle: "Start with your workspace",
    description:
      "Access your business workspace and configure the essentials to get started.",
    detail: "Business workspace",
  },
  {
    number: "02",
    icon: ContactRound,
    title: "Add your customers",
    subtitle: "Build your customer database",
    description:
      "Create customer records and keep your customer information organised in one place.",
    detail: "Customer management",
  },
  {
    number: "03",
    icon: Truck,
    title: "Record daily deliveries",
    subtitle: "Stay on top of operations",
    description:
      "Maintain daily delivery records and track customer-wise operational activity.",
    detail: "Delivery tracking",
  },
  {
    number: "04",
    icon: FileCheck,
    title: "Manage billing & payments",
    subtitle: "Keep finances organised",
    description:
      "Record payments, review ledger entries and manage customer invoices.",
    detail: "Billing & ledger",
  },
  {
    number: "05",
    icon: ChartNoAxesCombined,
    title: "Review your performance",
    subtitle: "Understand your business",
    description:
      "Use reports to review business activity, monitor trends and understand performance.",
    detail: "Reports & analytics",
  },
];

export default function HowItWorksSection() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
      false;

    if (
      reducedMotion ||
      typeof IntersectionObserver === "undefined"
    ) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="relative isolate overflow-hidden bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
    >
      {/* BACKGROUND */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-48 top-10 -z-10 h-[420px] w-[420px] rounded-full bg-[#EAF4EF] blur-[110px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-[#F7F2D9]/70 blur-[110px]"
      />

      <div className="mx-auto max-w-[1320px]">
        {/* INTRO */}
        <div
          className={`grid gap-8 transition-all duration-700 lg:grid-cols-[0.9fr_1.1fr] lg:items-end ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DDE9E1] bg-[#F7FAF7] px-3.5 py-2">
              <Droplets size={15} className="text-[#087E80]" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#087E80]">
                How Amrit Jal works
              </span>
            </div>

            <h2
              id="how-it-works-heading"
              className="mt-6 max-w-xl text-[36px] font-extrabold leading-[1.12] tracking-[-0.045em] text-[#24262B] sm:text-5xl lg:text-[54px]"
            >
              From daily tasks to
              <span className="block text-[#087E80]">
                organised business.
              </span>
            </h2>
          </div>

          <div className="max-w-lg lg:justify-self-end lg:pb-2">
            <p className="text-sm leading-7 text-[#737E78] sm:text-base sm:leading-8">
              Running a water delivery business involves many moving
              parts. Amrit Jal brings your daily workflow together
              in one organised workspace, step by step.
            </p>

            <a
              href="/signup"
              className="group mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#087E80] transition hover:text-[#06696B]"
            >
              Get started with Amrit Jal
              <ArrowUpRight
                size={17}
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          </div>
        </div>

        {/* WORKFLOW PANEL */}
        <div className="mt-14 overflow-hidden rounded-[28px] border border-[#E9E8DF] bg-[#F8F8F4] shadow-[0_18px_55px_rgba(36,38,43,0.045)] sm:mt-20">
          <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
            {/* LEFT PANEL */}
            <div className="relative flex flex-col justify-between overflow-hidden bg-[#087E80] p-7 text-white sm:p-10 lg:min-h-[650px] lg:p-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full border border-white/10"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-12 -left-8 h-52 w-52 rounded-full border border-white/10"
              />

              <div className="relative">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">
                  Your business journey
                </span>

                <h3 className="mt-5 max-w-sm text-3xl font-extrabold leading-tight tracking-tight sm:text-[38px]">
                  Five simple steps.
                  <span className="block text-[#E9CA43]">
                    One connected workflow.
                  </span>
                </h3>

                <p className="mt-5 max-w-sm text-sm leading-7 text-white/75">
                  Organise your business activities in a structured
                  way, from setting up your workspace to reviewing
                  your performance.
                </p>
              </div>

              <div className="relative mt-12">
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-extrabold tracking-tighter text-white">
                    0{activeStep + 1}
                  </span>

                  <span className="mb-2 text-sm text-white/65">
                    / 05 steps
                  </span>
                </div>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-[#E9CA43] transition-all duration-500"
                    style={{
                      width: `${((activeStep + 1) / steps.length) * 100}%`,
                    }}
                  />
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-white/65">
                  Currently viewing
                </p>

                <p className="mt-2 text-lg font-bold text-white">
                  {steps[activeStep].title}
                </p>
              </div>
            </div>

            {/* RIGHT TIMELINE */}
            <div className="p-5 sm:p-9 lg:p-12">
              <div className="mb-8 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#087E80]">
                    The process
                  </p>
                  <h3 className="mt-1 text-lg font-extrabold text-[#24262B]">
                    How your workflow unfolds
                  </h3>
                </div>

                <span className="hidden rounded-full border border-[#E5E7DE] bg-white px-3 py-2 text-[10px] font-semibold text-slate-500 sm:inline-flex">
                  5 easy steps
                </span>
              </div>

              <div className="relative">
                {/* CONNECTING LINE */}
                <div className="absolute bottom-10 left-[22px] top-8 w-px bg-[#DDE5DC] sm:left-[27px]" />

                <div className="space-y-3">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const selected = activeStep === index;
                    const completed = index < activeStep;

                    return (
                      <button
                        key={step.number}
                        type="button"
                        onClick={() => setActiveStep(index)}
                        aria-pressed={selected}
                        className={`group relative flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-300 sm:gap-5 sm:p-5 ${
                          selected
                            ? "border-[#B7D9CC] bg-white shadow-[0_10px_30px_rgba(8,126,128,0.08)]"
                            : "border-transparent bg-transparent hover:border-[#E7EAE2] hover:bg-white/80"
                        }`}
                      >
                        {/* ICON */}
                        <span
                          className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 sm:h-[54px] sm:w-[54px] ${
                            selected
                              ? "bg-[#087E80] text-white shadow-md shadow-[#087E80]/20"
                              : completed
                                ? "bg-[#E7F2EB] text-[#087E80]"
                                : "border border-[#E7EAE2] bg-white text-[#839088] group-hover:text-[#087E80]"
                          }`}
                        >
                          {completed ? (
                            <Check size={20} strokeWidth={2.5} />
                          ) : (
                            <Icon size={21} strokeWidth={1.8} />
                          )}
                        </span>

                        {/* CONTENT */}
                        <span className="min-w-0 flex-1 pt-0.5">
                          <span className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[9px] font-extrabold uppercase tracking-[0.14em] ${
                                selected
                                  ? "text-[#087E80]"
                                  : "text-[#9AA39B]"
                              }`}
                            >
                              STEP {step.number}
                            </span>

                            {selected && (
                              <span className="rounded-full bg-[#EAF4EF] px-2 py-0.5 text-[9px] font-bold text-[#087E80]">
                                ACTIVE
                              </span>
                            )}
                          </span>

                          <span
                            className={`mt-1.5 block text-sm font-extrabold sm:text-base ${
                              selected
                                ? "text-[#24262B]"
                                : "text-[#46534B]"
                            }`}
                          >
                            {step.title}
                          </span>

                          <span className="mt-1 block text-xs font-medium text-[#087E80]">
                            {step.subtitle}
                          </span>

                          <span
                            className={`grid transition-all duration-300 ${
                              selected
                                ? "mt-3 grid-rows-[1fr] opacity-100"
                                : "mt-0 grid-rows-[0fr] opacity-0"
                            }`}
                          >
                            <span className="overflow-hidden text-xs leading-6 text-[#737E78]">
                              {step.description}
                            </span>
                          </span>
                        </span>

                        {/* RIGHT INDICATOR */}
                        <span
                          className={`mt-2 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all sm:flex ${
                            selected
                              ? "bg-[#EAF4EF] text-[#087E80]"
                              : "text-[#B5BDB6] group-hover:text-[#087E80]"
                          }`}
                        >
                          {selected ? (
                            <ArrowRight size={16} />
                          ) : (
                            <span className="text-xs font-bold">
                              {step.number}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BOTTOM NOTE */}
              <div className="mt-7 flex items-center gap-3 border-t border-[#E7EAE2] pt-6">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF4EF] text-[#087E80]">
                  <CircleCheck size={18} />
                </span>

                <p className="text-xs leading-5 text-[#737E78]">
                  One organised workspace for your day-to-day
                  water delivery business operations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-2xl border border-[#E9E8DF] bg-white p-6 sm:flex-row sm:px-8">
          <div className="text-center sm:text-left">
            <h3 className="text-base font-extrabold text-[#24262B]">
              Ready to organise your business?
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Get started with your Amrit Jal business workspace.
            </p>
          </div>

          <a
            href="/signup"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087E80] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#06696B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#087E80]/20"
          >
            Get Started
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
