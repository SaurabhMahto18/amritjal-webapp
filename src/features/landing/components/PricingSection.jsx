
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Users,
  Building2,
  Headset,
  ShieldCheck,
} from "lucide-react";

const plans = [
  {
    id: "free_start",
    name: "Free Start",
    customers: 25,
    monthly: 0,
    yearly: 0,
    description: "A simple starting point for small water businesses.",
  },
  {
    id: "growth_starter",
    name: "Growth Starter",
    customers: 50,
    monthly: 59,
    yearly: 590,
    description: "For businesses ready to organise daily operations.",
  },
  {
    id: "growth",
    name: "Growth",
    customers: 100,
    monthly: 109,
    yearly: 1090,
    description: "For growing businesses managing more customers.",
    popular: true,
  },
  {
    id: "growth_pro",
    name: "Growth Pro",
    customers: 250,
    monthly: 349,
    yearly: 3490,
    description: "More capacity for established delivery businesses.",
  },
  {
    id: "growth_business",
    name: "Growth Business",
    customers: 500,
    monthly: 699,
    yearly: 6990,
    description: "For larger operations with a growing customer base.",
  },
  {
    id: "growth_enterprise",
    name: "Growth Enterprise",
    customers: 1000,
    monthly: 1299,
    yearly: 12990,
    description: "For high-volume water distribution businesses.",
  },
  {
    id: "scale",
    name: "Scale",
    customers: "Custom",
    monthly: null,
    yearly: null,
    description: "Flexible pricing for large-scale operations.",
  },
];

const formatPrice = (price) => {
  if (price === null) return "Custom";

  return `₹${new Intl.NumberFormat("en-IN").format(price)}`;
};

function PricingCard({ plan, billingCycle, selected, onClick }) {
  const isYearly = billingCycle === "yearly";
  const isCustom = plan.id === "scale";
  const isFree = plan.monthly === 0;
  const price = isYearly ? plan.yearly : plan.monthly;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative flex h-full w-full flex-col rounded-[24px] border p-5 text-left transition-all duration-500 sm:p-6 ${
        selected
          ? "border-[#087E80] bg-white shadow-[0_24px_65px_rgba(8,126,128,0.18)]"
          : "border-[#E8E5DD] bg-white/90 shadow-sm hover:border-[#B8D5CC]"
      }`}
    >
      {selected && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#087E80] px-4 py-1.5 text-[10px] font-bold text-white shadow-md">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={12} />
            SELECTED PLAN
          </span>
        </div>
      )}

      {plan.popular && (
        <div className="absolute right-4 top-4 rounded-full bg-[#F7F2D9] px-2.5 py-1 text-[9px] font-bold text-[#806B18]">
          POPULAR
        </div>
      )}

      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
            selected
              ? "bg-[#EAF4EF] text-[#087E80]"
              : "bg-[#F5F4EF] text-slate-500"
          }`}
        >
          {isCustom ? <Building2 size={20} /> : <Users size={20} />}
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-[#24262B] sm:text-lg">
            {plan.name}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {typeof plan.customers === "number"
              ? `${plan.customers.toLocaleString("en-IN")} customers`
              : "Custom capacity"}
          </p>
        </div>
      </div>

      <div className="mt-7">
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span
            className={`font-extrabold tracking-tight text-[#24262B] ${
              selected ? "text-4xl sm:text-5xl" : "text-3xl"
            }`}
          >
            {formatPrice(price)}
          </span>

          {!isCustom && !isFree && (
            <span className="text-xs text-slate-500">
              / {isYearly ? "year" : "month"}
            </span>
          )}

          {isFree && (
            <span className="text-xs text-slate-500">/ forever</span>
          )}
        </div>

        {isYearly && !isCustom && !isFree && (
          <p className="mt-2 text-xs font-semibold text-[#087E80]">
            {formatPrice(Math.round(plan.yearly / 12))} / month equivalent
          </p>
        )}

        <p className="mt-3 min-h-[48px] text-xs leading-5 text-slate-500">
          {plan.description}
        </p>
      </div>

      <div className="mt-5 border-t border-[#EDEAE0] pt-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Plan capacity
        </p>

        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#24262B]">
          <Users size={16} className="text-[#087E80]" />
          {typeof plan.customers === "number"
            ? `Up to ${plan.customers.toLocaleString("en-IN")} customers`
            : "Custom customer limit"}
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#F7F6F0] p-3">
        <Check size={15} className="mt-0.5 shrink-0 text-[#087E80]" />
        <p className="text-xs leading-5 text-slate-600">
          {isCustom
            ? "Discuss your requirements with our team."
            : isFree
              ? "Start with no subscription charge."
              : "Choose monthly or yearly billing."}
        </p>
      </div>

      <div className="mt-auto pt-6">
        <span
          className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
            selected
              ? "bg-[#087E80] text-white"
              : "bg-[#F0F3EF] text-[#24262B]"
          }`}
        >
          {isCustom ? "Contact Sales" : isFree ? "Start for Free" : "Choose Plan"}
          <ArrowRight size={16} />
        </span>
      </div>
    </button>
  );
}

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [activeIndex, setActiveIndex] = useState(2);
  const trackRef = useRef(null);
  const cardRefs = useRef([]);

  const moveToPlan = (index) => {
    const safeIndex = Math.max(0, Math.min(index, plans.length - 1));

    setActiveIndex(safeIndex);

    const container = trackRef.current;
    const card = cardRefs.current[safeIndex];

    if (!container || !card) return;

    const left =
      card.offsetLeft -
      (container.clientWidth - card.offsetWidth) / 2;

    container.scrollTo({
      left,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const container = trackRef.current;
    if (!container) return;

    const card = cardRefs.current[activeIndex];
    if (!card) return;

    const left =
      card.offsetLeft -
      (container.clientWidth - card.offsetWidth) / 2;

    container.scrollTo({
      left,
      behavior: "auto",
    });
  }, []);

  useEffect(() => {
    const container = trackRef.current;
    if (!container) return;

    let animationFrame;

    const handleScroll = () => {
      cancelAnimationFrame(animationFrame);

      animationFrame = requestAnimationFrame(() => {
        const center =
          container.getBoundingClientRect().left +
          container.clientWidth / 2;

        let nearestIndex = activeIndex;
        let nearestDistance = Infinity;

        cardRefs.current.forEach((card, index) => {
          if (!card) return;

          const rect = card.getBoundingClientRect();
          const cardCenter = rect.left + rect.width / 2;
          const distance = Math.abs(center - cardCenter);

          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });

        setActiveIndex((previous) =>
          previous === nearestIndex ? previous : nearestIndex
        );
      });
    };

    container.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="overflow-hidden bg-[#F7F6F0] py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[1500px]">
        {/* HEADER */}
        <div className="mx-auto max-w-2xl px-5 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E9CA43]/50 bg-white px-4 py-2 text-xs font-bold text-[#76651B]">
            <Sparkles size={14} />
            SIMPLE & TRANSPARENT PRICING
          </span>

          <h2
            id="pricing-heading"
            className="mt-5 text-3xl font-extrabold tracking-tight text-[#24262B] sm:text-4xl lg:text-5xl"
          >
            Choose your perfect
            <span className="text-[#087E80]"> plan.</span>
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
            Flexible plans for every stage of your water delivery business.
            Swipe through the plans to find the right fit.
          </p>
        </div>

        {/* BILLING TOGGLE */}
        <div className="mt-8 flex justify-center px-4">
          <div
            role="group"
            aria-label="Select billing cycle"
            className="inline-flex items-center gap-1 rounded-xl border border-[#E5E1D8] bg-white p-1.5 shadow-sm"
          >
            <button
              type="button"
              aria-pressed={billingCycle === "monthly"}
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                billingCycle === "monthly"
                  ? "bg-[#087E80] text-white"
                  : "text-slate-500 hover:text-[#24262B]"
              }`}
            >
              Monthly
            </button>

            <button
              type="button"
              aria-pressed={billingCycle === "yearly"}
              onClick={() => setBillingCycle("yearly")}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                billingCycle === "yearly"
                  ? "bg-[#087E80] text-white"
                  : "text-slate-500 hover:text-[#24262B]"
              }`}
            >
              Yearly
              <span className="rounded-full bg-[#EAF4EC] px-2 py-0.5 text-[10px] font-bold text-[#087E80]">
                Save 2 months
              </span>
            </button>
          </div>
        </div>

        {/* CAROUSEL CONTROLS */}
        <div className="mx-auto mt-10 flex max-w-5xl items-center justify-between px-5 sm:px-8">
          <div>
            <p className="text-sm font-bold text-[#24262B]">
              Explore our plans
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {activeIndex + 1} of {plans.length} plans
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => moveToPlan(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="Previous plan"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E1D8] bg-white text-[#24262B] transition hover:border-[#087E80] hover:text-[#087E80] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowLeft size={18} />
            </button>

            <button
              type="button"
              onClick={() => moveToPlan(activeIndex + 1)}
              disabled={activeIndex === plans.length - 1}
              aria-label="Next plan"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E1D8] bg-white text-[#24262B] transition hover:border-[#087E80] hover:text-[#087E80] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* SWIPE CAROUSEL */}
        <div
          ref={trackRef}
          className="mt-8 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto overflow-y-visible px-[calc((100%-280px)/2)] pb-12 pt-6 sm:gap-6 sm:px-[calc((100%-330px)/2)] lg:gap-7"
          style={{
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {plans.map((plan, index) => {
            const selected = activeIndex === index;

            return (
              <div
                key={plan.id}
                ref={(element) => {
                  cardRefs.current[index] = element;
                }}
                className={`w-[280px] shrink-0 snap-center transition-all duration-500 ease-out sm:w-[330px] ${
                  selected
                    ? "scale-100 opacity-100"
                    : "scale-[0.88] opacity-65"
                }`}
              >
                <PricingCard
                  plan={plan}
                  billingCycle={billingCycle}
                  selected={selected}
                  onClick={() => moveToPlan(index)}
                />
              </div>
            );
          })}
        </div>

        {/* DOT INDICATORS */}
        <div className="flex items-center justify-center gap-2">
          {plans.map((plan, index) => (
            <button
              key={plan.id}
              type="button"
              aria-label={`Select ${plan.name}`}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => moveToPlan(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? "w-8 bg-[#087E80]"
                  : "w-2 bg-[#D4D8D1] hover:bg-[#9DB9AE]"
              }`}
            />
          ))}
        </div>

        {/* SELECTED PLAN INFO */}
        <div className="mx-auto mt-8 max-w-xl px-5">
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#E5E1D8] bg-white p-5 text-center shadow-sm sm:flex-row sm:text-left">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Currently selected
              </p>
              <h3 className="mt-1 text-lg font-extrabold text-[#24262B]">
                {plans[activeIndex].name}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {typeof plans[activeIndex].customers === "number"
                  ? `Up to ${plans[activeIndex].customers.toLocaleString("en-IN")} customers`
                  : "Custom customer capacity"}
              </p>
            </div>

            {plans[activeIndex].id === "scale" ? (
              <a
                href="#contact"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087E80] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#06696B]"
              >
                Contact Sales
                <ArrowRight size={16} />
              </a>
            ) : (
              <Link
                to="/signup"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087E80] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#06696B]"
              >
                {plans[activeIndex].monthly === 0
                  ? "Start for Free"
                  : "Choose Plan"}
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>

        {/* TRUST NOTES */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 px-4 text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-[#087E80]" />
            Transparent pricing
          </span>
          <span className="flex items-center gap-2">
            <Users size={15} className="text-[#087E80]" />
            Customer-based plans
          </span>
          <span className="flex items-center gap-2">
            <Headset size={15} className="text-[#087E80]" />
            Custom business support
          </span>
        </div>
      </div>

      <style>{`
        #pricing [ref] {
          -webkit-tap-highlight-color: transparent;
        }

        #pricing ::-webkit-scrollbar {
          display: none;
        }

        @media (prefers-reduced-motion: reduce) {
          #pricing * {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
}
