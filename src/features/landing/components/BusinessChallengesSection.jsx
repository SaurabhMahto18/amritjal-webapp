
import {
  ClipboardList,
  Wallet,
  Bell,
  Truck,
  ArrowRight,
  Check,
  Droplets,
  FileText,
} from "lucide-react";

const comparisons = [
  {
    icon: ClipboardList,
    title: "Delivery Tracking",
    before:
      "Delivery details scattered across registers and WhatsApp messages.",
    after:
      "Record daily deliveries and keep customer-wise delivery history organised.",
    accent: "teal",
  },
  {
    icon: Wallet,
    title: "Payments & Dues",
    before:
      "Manually checking who paid, who owes money and which payments are pending.",
    after:
      "Track payments, outstanding balances and customer ledger records in one place.",
    accent: "amber",
  },
  {
    icon: Bell,
    title: "Customer Management",
    before:
      "Searching for customer details and remembering delivery or payment updates.",
    after:
      "Access customer information, delivery history and account details together.",
    accent: "blue",
  },
  {
    icon: Truck,
    title: "Daily Operations",
    before:
      "Managing delivery schedules, jar stock and business activities separately.",
    after:
      "Get a connected view of deliveries, jar operations and business records.",
    accent: "purple",
  },
];

const accentStyles = {
  teal: {
    icon: "bg-[#EAF5F2] text-[#087E80]",
    dot: "bg-[#087E80]",
  },
  amber: {
    icon: "bg-[#FBF4E4] text-[#B58A35]",
    dot: "bg-[#C28D32]",
  },
  blue: {
    icon: "bg-[#EAF2F9] text-[#557FA9]",
    dot: "bg-[#6EA6D5]",
  },
  purple: {
    icon: "bg-[#F0EDF9] text-[#8067B2]",
    dot: "bg-[#9B85D1]",
  },
};

export default function BusinessChallengesSection() {
  return (
    <section
      id="business-challenges"
      aria-labelledby="business-challenges-heading"
      className="
        relative isolate scroll-mt-24 overflow-hidden
        border-y border-[#EDEAE0]
        bg-white px-4 py-16
        sm:px-6 sm:py-20
        lg:px-10 lg:py-24
      "
    >
      {/* Background accents */}
      <div className="pointer-events-none absolute -left-32 top-0 -z-10 size-80 rounded-full bg-[#087E80]/[0.05] blur-[100px]" />

      <div className="pointer-events-none absolute -right-32 bottom-0 -z-10 size-80 rounded-full bg-[#E9CA43]/[0.08] blur-[100px]" />

      <div className="relative mx-auto grid max-w-[1440px] items-start gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14 xl:gap-20">
        {/* Left content */}
        <div className="relative self-start lg:sticky lg:top-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#EDEAE0] bg-[#F7F6F0] px-3.5 py-2">
            <span className="size-2 rounded-full bg-[#087E80]" />

            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#087E80]">
              A better way to manage
            </span>
          </div>

          <h2
            id="business-challenges-heading"
            className="
              max-w-[620px] text-[36px] font-black
              leading-[1.12] tracking-[-0.04em]
              text-[#24262B]
              sm:text-[46px] lg:text-[49px] xl:text-[56px]
            "
          >
            Still running your water business on{" "}
            <span className="relative inline-block text-[#A87525]">
              scattered records?
              <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-[#E9CA43]" />
            </span>
          </h2>

          <p className="mt-6 max-w-[530px] text-sm leading-7 text-[#777970] sm:text-base sm:leading-8">
            Managing customers, deliveries, jar inventory and
            payments separately can make everyday operations
            harder to track. Amrit Jal brings these important
            workflows together in one organised workspace.
          </p>

          {/* Highlight */}
          <div className="mt-6 flex max-w-[520px] items-start gap-3 rounded-xl border border-[#EDEAE0] border-l-[3px] border-l-[#E9CA43] bg-[#F7F6F0] p-4">
            <Droplets
              size={21}
              className="mt-0.5 shrink-0 text-[#087E80]"
            />

            <p className="text-sm font-semibold leading-6 text-[#52635F]">
              Less time searching for records.
              More clarity across your daily business.
            </p>
          </div>

          {/* CTA */}
          <a
            href="#features"
            className="
              group mt-7 inline-flex min-h-[50px]
              items-center justify-center gap-2
              rounded-full bg-[#087E80] px-6
              text-sm font-extrabold text-white
              shadow-[0_8px_22px_rgba(8,126,128,0.15)]
              transition-all duration-300
              hover:-translate-y-1 hover:bg-[#06696B]
              hover:shadow-[0_12px_25px_rgba(8,126,128,0.2)]
              focus-visible:outline-none
              focus-visible:ring-4 focus-visible:ring-[#087E80]/20
            "
          >
            Explore the solution
            <ArrowRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </a>
        </div>

        {/* Right: Before / After comparison */}
        <div className="min-w-0 space-y-4">
          {comparisons.map((item) => {
            const Icon = item.icon;
            const styles = accentStyles[item.accent];

            return (
              <article
                key={item.title}
                className="
                  group relative grid min-w-0 overflow-hidden
                  rounded-2xl border border-[#EDEAE0]
                  bg-white
                  shadow-[0_4px_18px_rgba(36,38,43,0.025)]
                  transition-all duration-300
                  hover:-translate-y-1 hover:border-[#C9DDD5]
                  hover:shadow-[0_14px_35px_rgba(36,38,43,0.06)]
                  sm:grid-cols-[64px_minmax(0,1fr)]
                "
              >
                {/* Icon column */}
                <div className="hidden items-center justify-center border-r border-[#EDEAE0] sm:flex">
                  <span
                    className={`flex size-11 items-center justify-center rounded-xl ${styles.icon}`}
                  >
                    <Icon size={21} strokeWidth={1.9} />
                  </span>
                </div>

                {/* Comparison content */}
                <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2">
                  {/* Before */}
                  <div className="min-w-0 p-4 sm:p-5 lg:p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F7F6F0] text-[#777970] sm:hidden">
                        <Icon size={18} />
                      </span>

                      <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#96968D]">
                        Before
                      </span>
                    </div>

                    <h3 className="mb-2 text-sm font-extrabold text-[#24262B]">
                      {item.title}
                    </h3>

                    <p className="text-xs leading-6 text-[#777970] sm:text-[13px]">
                      {item.before}
                    </p>
                  </div>

                  {/* With Amrit Jal */}
                  <div className="min-w-0 border-t border-[#EDEAE0] bg-[#F7F9F6] p-4 sm:border-l sm:border-t-0 sm:p-5 lg:p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className={`size-2 shrink-0 rounded-full ${styles.dot}`}
                      />

                      <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#087E80]">
                        With Amrit Jal
                      </span>
                    </div>

                    <p className="text-xs font-medium leading-6 text-[#52635F] sm:text-[13px]">
                      {item.after}
                    </p>

                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-[#087E80]">
                      <Check size={13} />
                      Organised workflow
                    </div>
                  </div>
                </div>

                {/* Top accent */}
                <div
                  className={`
                    absolute left-0 top-0 h-[3px] w-0
                    transition-all duration-300
                    group-hover:w-full ${styles.dot}
                  `}
                />
              </article>
            );
          })}

          {/* Bottom note */}
          <div className="flex items-center gap-2 px-2 pt-1 text-[11px] font-medium text-[#96968D]">
            <FileText size={14} className="shrink-0 text-[#087E80]" />

            <span>
              One workspace for your everyday business records.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
