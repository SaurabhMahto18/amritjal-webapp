
import { useEffect, useRef, useState } from "react";
import SectionHeading from "../../../components/landing/SectionHeading";
import {
  UserPlus,
  ContactRound,
  Truck,
  FileCheck,
  ChartNoAxesCombined,
  ArrowRight,
  Check,
} from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Set up your business",
    text: "Access your business workspace and configure the essentials.",
  },
  {
    icon: ContactRound,
    title: "Add customers",
    text: "Create customer records and organise your customer base.",
  },
  {
    icon: Truck,
    title: "Record deliveries",
    text: "Maintain daily delivery records and operational activity.",
  },
  {
    icon: FileCheck,
    title: "Manage billing",
    text: "Record payments, review ledger entries and manage invoices.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Review performance",
    text: "Use reports to review business activity and trends.",
  },
];

export default function HowItWorksSection() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    // Respect reduced-motion accessibility preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
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
      {
        threshold: 0.12,
      }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative isolate scroll-mt-24 overflow-hidden bg-[#F7F8F5] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:px-16"
    >
      {/* SUBTLE BACKGROUND DECORATION */}
      <div className="pointer-events-none absolute -left-32 top-10 -z-10 size-72 rounded-full bg-[#DDF2ED]/60 blur-[100px]" />

      <div className="pointer-events-none absolute -right-32 bottom-0 -z-10 size-72 rounded-full bg-[#F2A93B]/[0.07] blur-[100px]" />

      <div className="mx-auto max-w-[1440px]">

        {/* SECTION HEADING */}
        <div
          className={`mx-auto max-w-3xl transition-all duration-700 ease-out ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"
          }`}
        >
          <SectionHeading
            eyebrow="How it works"
            title="A clear workflow from customer to collection."
            description="Start with customer records, track operations and keep financial activity organised — step by step."
          />
        </div>

        {/* STEP CARDS */}
        <div className="relative mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5">

          {/* CONNECTING LINE - DESKTOP */}
          <div className="pointer-events-none absolute left-[10%] right-[10%] top-[39px] hidden h-px bg-[#D9E7E1] lg:block" />

          {steps.map(({ icon: Icon, title, text }, index) => (
            <article
              key={title}
              style={{ transitionDelay: `${index * 120}ms` }}
              className={`
                group relative flex min-w-0 flex-col
                rounded-2xl border border-[#E4EBE6]
                bg-white p-5 sm:p-6
                shadow-[0_4px_18px_rgba(16,31,53,0.025)]
                transition-all duration-700 ease-out
                hover:-translate-y-1 hover:border-[#B9DDD7]
                hover:shadow-[0_14px_30px_rgba(8,126,133,0.08)]
                ${isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"}
              `}
            >
              {/* CARD TOP */}
              <div className="relative z-10 flex items-center justify-between gap-3">

                <span className="flex size-11 items-center justify-center rounded-xl border border-[#E1EEEA] bg-[#EAF6F3] text-[#087E85] transition-all duration-300 group-hover:border-[#087E85] group-hover:bg-[#087E85] group-hover:text-white">
                  <Icon size={21} strokeWidth={1.9} />
                </span>

                <span className="text-[24px] font-black tracking-tight text-[#E2EAE5] transition-colors duration-300 group-hover:text-[#B8DCD5]">
                  0{index + 1}
                </span>
              </div>

              {/* CONTENT */}
              <div className="mt-6 min-w-0 flex-1">
                <h3 className="break-words text-[15px] font-extrabold leading-snug text-[#172B40] sm:text-base">
                  {title}
                </h3>

                <p className="mt-2 break-words text-[12px] leading-6 text-[#718394] sm:text-[13px]">
                  {text}
                </p>
              </div>

              {/* BOTTOM STEP INDICATOR */}
              <div className="mt-6 flex items-center justify-between border-t border-[#EEF1EE] pt-4">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#91A09A]">
                  Step {index + 1}
                </span>

                <span className="flex size-6 items-center justify-center rounded-full bg-[#EAF6F3] text-[#087E85] transition-all duration-300 group-hover:bg-[#087E85] group-hover:text-white">
                  <Check size={13} strokeWidth={2.5} />
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* BOTTOM MESSAGE */}
        <div
          style={{ transitionDelay: "650ms" }}
          className={`
            mt-8 flex flex-col items-center justify-center gap-3
            rounded-2xl border border-[#E3ECE7]
            bg-white/80 px-5 py-5 text-center
            transition-all duration-700 ease-out
            sm:mt-10 sm:flex-row sm:gap-4 sm:py-6
            ${isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0"}
          `}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F5F3] text-[#087E85]">
            <Check size={21} />
          </span>

          <div>
            <p className="text-sm font-extrabold text-[#172B40]">
              Your daily business workflow, connected.
            </p>

            <p className="mt-1 text-xs leading-5 text-[#81909A]">
              From adding customers to reviewing business performance,
              manage your operations in one place.
            </p>
          </div>

          <a
            href="#contact"
            className="group inline-flex shrink-0 items-center gap-2 text-xs font-bold text-[#087E85] transition hover:text-[#065F63]"
          >
            Get started
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
