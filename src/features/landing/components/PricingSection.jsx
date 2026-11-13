
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const customerOptions = [50, 100, 200, 300, 500, 1000];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);

/* =========================================
   INLINE SVG ICONS
========================================= */

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m12 2 2.9 6 6.6.9-4.8 4.7 1.1 6.6-5.8-3.1-5.8 3.1 1.1-6.6-4.8-4.7 6.6-.9L12 2Z" />
    </svg>
  );
}

/* =========================================
   CHECKLIST
========================================= */

function CheckList({ items, dark = false }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className={`flex items-start gap-2.5 text-xs leading-5 ${
            dark ? "text-[#DCE7F0]" : "text-[#405168]"
          }`}
        >
          <span className="mt-0.5 shrink-0 text-[#087E85]">
            <CheckIcon />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

/* =========================================
   PRICING CARD
========================================= */

function PricingCard({
  eyebrow,
  title,
  price,
  unit,
  description,
  features,
  buttonText,
  buttonLink,
  featured = false,
  badge,
}) {
  return (
    <article
      className={`relative flex h-full min-h-[390px] flex-col rounded-[20px] border p-5 transition-all duration-300 hover:-translate-y-1 sm:p-6 ${
        featured
          ? "border-[#14243B] bg-[#08172B] text-white shadow-[0_18px_40px_rgba(8,23,43,0.18)] hover:shadow-[0_24px_48px_rgba(8,23,43,0.23)]"
          : "border-[#E0E7EC] bg-white text-[#101F35] hover:border-[#C5D8D9] hover:shadow-[0_16px_35px_rgba(16,31,53,0.07)]"
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#FF9F1C] px-4 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-[#17263A] shadow-md">
          <StarIcon />
          {badge}
        </div>
      )}

      <div>
        <p
          className={`text-[9px] font-bold uppercase tracking-[0.18em] ${
            featured ? "text-[#63D6D2]" : "text-[#6480A1]"
          }`}
        >
          {eyebrow}
        </p>

        <h3 className="mt-2 text-2xl font-black tracking-tight">
          {title}
        </h3>

        <div className="mt-5 flex flex-wrap items-baseline gap-1.5">
          <span className="text-[34px] font-black leading-none tracking-tight">
            {price}
          </span>

          {unit && (
            <span
              className={`text-[10px] font-semibold ${
                featured ? "text-[#C3D3E1]" : "text-[#64748B]"
              }`}
            >
              {unit}
            </span>
          )}
        </div>

        <p
          className={`mt-2 text-[10px] leading-5 ${
            featured ? "text-[#A8B8C7]" : "text-[#64748B]"
          }`}
        >
          {description}
        </p>
      </div>

      <CheckList items={features} dark={featured} />

      <Link
        to={buttonLink}
        className={`mt-auto flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-extrabold transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 ${
          featured
            ? "bg-[#FF9F1C] text-[#17263A] shadow-[0_8px_20px_rgba(255,159,28,0.2)] hover:bg-[#FFB13F] focus-visible:ring-[#FF9F1C]/30"
            : "bg-[#08172B] text-white hover:bg-[#132D4B] focus-visible:ring-[#087E85]/30"
        }`}
      >
        {buttonText}
        <ArrowIcon />
      </Link>
    </article>
  );
}

/* =========================================
   FREE DEMO MODAL
========================================= */

function FreeDemoModal({ open, onClose }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  // Replace with verified WhatsApp Business number.
  // Format: 91XXXXXXXXXX, without + or spaces.
  const DEMO_WHATSAPP_NUMBER = "";

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanPhone = phone.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!DEMO_WHATSAPP_NUMBER) {
      setError(
        "Demo booking is not connected yet. Please configure the official WhatsApp number."
      );
      return;
    }

    const message = encodeURIComponent(
      `Hello Amrit Jal! I would like to book a free demo.\nMy mobile number: +91 ${cleanPhone}`
    );

    window.open(
      `https://wa.me/${DEMO_WHATSAPP_NUMBER}?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );

    onClose();
  };

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 transition-all duration-300 ease-out ${
        open
          ? "visible opacity-100"
          : "invisible pointer-events-none opacity-0"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-[#071426]/65 backdrop-blur-md" />

      {/* MODAL GRID */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "linear-gradient(#FFFFFF 1px, transparent 1px), linear-gradient(90deg, #FFFFFF 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* MODAL PANEL */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-modal-heading"
        className={`relative my-auto w-full max-w-[460px] rounded-[25px] border border-[#E0E7EC] bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out sm:p-7 ${
          open
            ? "translate-y-0 scale-100"
            : "translate-y-5 scale-[0.96]"
        }`}
      >
        {/* CLOSE */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close demo dialog"
          className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full text-[#526171] transition hover:bg-[#F0F3F5] hover:text-[#101F35]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m18 6-12 12M6 6l12 12" />
          </svg>
        </button>

        {/* EYEBROW */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E9E8] bg-[#F5F4EF] px-3 py-1.5">
          <span className="size-1.5 rounded-full bg-[#20C5C4]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#263D55]">
            Free Demo
          </span>
        </div>

        <h2
          id="demo-modal-heading"
          className="mt-4 pr-5 text-2xl font-black leading-tight tracking-tight text-[#101F35] sm:text-[27px]"
        >
          Get a free demo on WhatsApp
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#526171]">
          Enter your mobile number — our team can help you
          understand Amrit Jal.
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-7">
          <div className="flex min-h-[52px] overflow-hidden rounded-xl border border-[#20C5C4] bg-white transition focus-within:ring-4 focus-within:ring-[#20C5C4]/10">
            <span className="flex items-center border-r border-[#E0E7EC] bg-[#F5F4EF] px-4 text-sm font-bold text-[#263D55]">
              +91
            </span>

            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              placeholder="Enter 10-digit mobile"
              aria-label="10-digit mobile number"
              value={phone}
              onChange={(event) => {
                setPhone(
                  event.target.value.replace(/\D/g, "").slice(0, 10)
                );
                setError("");
              }}
              className="min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-[#101F35] outline-none placeholder:text-[#9AA6B2]"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-2 text-xs leading-5 text-red-600"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-3 flex min-h-[50px] w-full items-center justify-center rounded-xl bg-[#FF9F1C] px-5 py-3 text-sm font-extrabold text-[#17263A] shadow-[0_8px_22px_rgba(255,159,28,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#FFB13F] hover:shadow-[0_12px_28px_rgba(255,159,28,0.3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF9F1C]/30"
          >
            Get Free Demo
          </button>
        </form>

        {/* TRUST NOTES */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] text-[#526171]">
            <span className="font-bold text-[#20C5C4]">✓</span>
            Free & no obligation
          </span>

          <span className="inline-flex items-center gap-1.5 text-[10px] text-[#526171]">
            <span className="font-bold text-[#20C5C4]">✓</span>
            No signup required
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   MAIN PRICING SECTION
========================================= */

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [customers, setCustomers] = useState(300);
  const [demoOpen, setDemoOpen] = useState(false);

  const isYearly = billingCycle === "yearly";

  const pricing = useMemo(() => {
    const count = customers;

    const monthlyTotal = Math.round(count * 1.2);
    const yearlyTotal = Math.round(count * 12);

    return {
      count,
      monthlyTotal,
      yearlyTotal,
      selectedTotal: isYearly ? yearlyTotal : monthlyTotal,
      monthlyEquivalent: isYearly ? 1 : 1.2,
      savings: Math.max(0, monthlyTotal * 12 - yearlyTotal),
    };
  }, [customers, isYearly]);

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="relative isolate overflow-hidden bg-[#FCFBF8] px-5 py-16 sm:px-8 sm:py-20 lg:px-14 lg:py-24"
    >
      {/* BACKGROUND GRID */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,31,53,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(16,31,53,0.035) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      {/* SUBTLE GLOW */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-10 size-[300px] rounded-full bg-[#63D6D2]/10 blur-[100px]"
      />

      <div className="relative mx-auto max-w-[1440px]">

        {/* SECTION INTRO */}
        <div className="mb-9 max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6480A1]">
            Pricing — Honest & Simple
          </p>

          <h2
            id="pricing-heading"
            className="mt-3 text-[36px] font-black leading-[1.08] tracking-[-0.045em] text-[#101F35] sm:text-5xl lg:text-[56px]"
          >
            From{" "}
            <span className="text-[#FF9F1C]">
              ₹1 per customer,
            </span>{" "}
            per month.
          </h2>

          <p className="mt-5 max-w-[600px] text-sm leading-7 text-[#526171] sm:text-base">
            Monthly billing is ₹1.20 per customer. Pay yearly
            and it drops to{" "}
            <strong className="text-[#101F35]">
              ₹1 flat per customer per month
            </strong>
            {" "}— you save about two months. No per-user fees.
            Your whole team uses it free.
          </p>
        </div>

        {/* LIVE PRICE CALCULATOR */}
        <div className="grid overflow-hidden rounded-[20px] border border-[#DFE6EC] bg-white shadow-[0_16px_40px_rgba(16,31,53,0.07)] lg:grid-cols-[1.15fr_1fr]">

          {/* CUSTOMER SELECTOR */}
          <div className="bg-[#F5F4EF] p-5 sm:p-7 lg:p-8">
            <div
              className="inline-flex rounded-full border border-[#DDE4E9] bg-white p-1"
              role="group"
              aria-label="Billing cycle"
            >
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                aria-pressed={!isYearly}
                className={`rounded-full px-4 py-2 text-[10px] font-bold transition ${
                  !isYearly
                    ? "bg-[#08172B] text-white shadow-sm"
                    : "text-[#526171] hover:text-[#101F35]"
                }`}
              >
                Monthly
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                aria-pressed={isYearly}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-bold transition ${
                  isYearly
                    ? "bg-[#08172B] text-white shadow-sm"
                    : "text-[#526171] hover:text-[#101F35]"
                }`}
              >
                Yearly
                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[8px] font-bold text-[#A94F17]">
                  Save ~2 mo
                </span>
              </button>
            </div>

            <div className="mt-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#263D55]">
                How many customers do you have?
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {customerOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCustomers(value)}
                    aria-pressed={customers === value}
                    className={`min-h-9 rounded-full border px-3.5 text-[10px] font-bold transition-all duration-200 ${
                      customers === value
                        ? "border-[#08172B] bg-[#08172B] text-white shadow-sm"
                        : "border-[#DDE4E9] bg-white text-[#263D55] hover:-translate-y-0.5 hover:border-[#087E85] hover:text-[#087E85]"
                    }`}
                  >
                    {value.toLocaleString("en-IN")}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setDemoOpen(true)}
                  className="min-h-9 rounded-full border border-dashed border-[#DDE4E9] bg-white px-3.5 text-[10px] font-bold text-[#263D55] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#087E85] hover:bg-[#EAF5F3] hover:text-[#087E85]"
                >
                  1000+ →
                </button>
              </div>

              <p className="mt-5 text-[10px] leading-5 text-[#526171]">
                Not sure?{" "}
                <a
                  href="#contact"
                  className="font-bold text-[#087E85] hover:underline"
                >
                  Contact us
                </a>
                {" "}— we'll help size it right.
              </p>
            </div>
          </div>

          {/* PRICE RESULT */}
          <div className="flex flex-col justify-center bg-[#08172B] p-6 text-white sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#63D6D2]">
              You'd pay
              <span className="ml-2 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[8px] normal-case tracking-normal text-[#DCE7F0]">
                {isYearly ? "Yearly" : "Monthly"}
              </span>
            </p>

            <div className="mt-5 flex flex-wrap items-baseline gap-2">
              <span
                key={`${pricing.selectedTotal}-${billingCycle}`}
                className="animate-[priceReveal_300ms_ease-out] text-4xl font-black tracking-tight sm:text-5xl"
              >
                ₹{formatCurrency(pricing.selectedTotal)}
              </span>

              <span className="text-xs text-[#C3D3E1]">
                / {isYearly ? "year" : "month"}
              </span>
            </div>

            <p className="mt-2 text-[11px] font-semibold text-[#63D6D2]">
              ≈ ₹{pricing.monthlyEquivalent.toFixed(2)} / customer / month
            </p>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-[11px] leading-5 text-[#DCE7F0]">
                {isYearly ? (
                  <>
                    <strong className="text-white">
                      Annual billing:
                    </strong>{" "}
                    ₹{formatCurrency(pricing.yearlyTotal)} for{" "}
                    {pricing.count.toLocaleString("en-IN")} customers.
                    You save ₹{formatCurrency(pricing.savings)} compared
                    with monthly billing for 12 months.
                  </>
                ) : (
                  <>
                    <strong className="text-white">
                      Pay yearly:
                    </strong>{" "}
                    ₹{formatCurrency(pricing.yearlyTotal)}/year.
                    That's ₹{formatCurrency(pricing.savings)} less than
                    12 monthly payments.
                  </>
                )}
              </p>
            </div>

            <Link
              to="/signup"
              className="mt-6 inline-flex min-h-11 w-fit items-center justify-center gap-3 rounded-full bg-[#FF9F1C] px-6 py-3 text-xs font-extrabold text-[#17263A] shadow-[0_8px_22px_rgba(255,159,28,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#FFB13F]"
            >
              Get started
              <ArrowIcon />
            </Link>
          </div>
        </div>

        {/* PRICING PLANS */}
        <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

          <PricingCard
            eyebrow="Try us first"
            title="Free Start"
            price="₹0"
            description="For your first weeks"
            features={[
              "Up to 25 customers",
              "Daily deliveries & bulk entry",
              "Auto monthly invoices",
              "WhatsApp bill send",
              "Customer QR + app",
              "Hindi & 7 more languages",
            ]}
            buttonText="Start free"
            buttonLink="/signup"
          />

          <PricingCard
            eyebrow="Best for growing businesses"
            title="Growth"
            price="₹1"
            unit="/ customer / month"
            description="Billed yearly — save ~2 months. Or ₹1.20/customer on monthly billing."
            features={[
              "Unlimited customers (tiered 50–1000+)",
              "Daily, weekly & custom subscriptions",
              "Pause / resume customer leaves",
              "Corporate event bookings",
              "UPI, PhonePe, Paytm, Razorpay",
              "Staff & payroll management",
              "30+ reports + P&L dashboard",
              "Priority WhatsApp support",
            ]}
            buttonText="Get started"
            buttonLink="/signup"
            featured
            badge="Most agencies pick this"
          />

          <PricingCard
            eyebrow="Multi-branch / White-label"
            title="Scale"
            price="Custom"
            description="For agencies with branches"
            features={[
              "Everything in Growth",
              "Multi-branch / franchise",
              "White-label customer app",
              "Dedicated success manager",
              "Custom reports & API access",
              "Onboarding & staff training",
            ]}
            buttonText="Talk to sales"
            buttonLink="/#contact"
          />
        </div>

        {/* BOTTOM NOTE */}
        <div className="mt-10 flex flex-col gap-3 border-t border-[#E7EAE8] pt-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#101F35]">
              Simple pricing. No per-user fees.
            </h3>

            <p className="mt-1 text-xs leading-5 text-[#64748B]">
              Pricing is based on the number of customers in your business.
            </p>
          </div>

          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#087E85] hover:underline"
          >
            Have questions? Contact us
            <ArrowIcon />
          </a>
        </div>
      </div>

      {/* FREE DEMO POPUP */}
      <FreeDemoModal
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
      />

      {/* PRICE ANIMATION */}
      <style>{`
        @keyframes priceReveal {
          from {
            opacity: 0;
            transform: translateY(7px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
}
