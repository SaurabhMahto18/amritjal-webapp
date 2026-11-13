
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
        icon: "bg-[#E6F5F3] text-[#087E85]",
        dot: "bg-[#18B9B0]",
    },
    amber: {
        icon: "bg-[#FFF3DF] text-[#D58B27]",
        dot: "bg-[#F2A93B]",
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
            className="relative scroll-mt-24 overflow-hidden border-y border-[#E9ECE6] bg-[#F9F8F3] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24"
        >
            {/* BACKGROUND DETAILS */}
            <div className="pointer-events-none absolute -left-32 top-0 size-80 rounded-full bg-[#D9F0E9]/50 blur-[100px]" />
            <div className="pointer-events-none absolute -right-32 bottom-0 size-80 rounded-full bg-[#F2A93B]/[0.08] blur-[100px]" />

            <div className="relative mx-auto grid max-w-[1440px] items-start gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14 xl:gap-20">

                {/* LEFT CONTENT */}
                <div className="relative self-start lg:sticky lg:top-24">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E4EAE4] bg-white px-3.5 py-2">
                        <span className="size-2 rounded-full bg-[#087E85]" />
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#087E85]">
                            A better way to manage
                        </span>
                    </div>

                    <h2 className="max-w-[620px] text-[36px] font-black leading-[1.12] tracking-[-0.04em] text-[#101F35] sm:text-[46px] lg:text-[49px] xl:text-[56px]">
                        Still running your water business on{" "}
                        <span className="relative inline-block text-[#B96723]">
                            scattered records?
                            <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-[#F2A93B]" />
                        </span>
                    </h2>

                    <p className="mt-6 max-w-[530px] text-[14px] leading-7 text-[#596A78] sm:text-[16px] sm:leading-8">
                        Managing customers, deliveries, jar inventory and
                        payments separately can make everyday operations
                        harder to track. Amrit Jal brings these important
                        workflows together in one organised workspace.
                    </p>

                    {/* HIGHLIGHT */}
                    <div className="mt-6 flex max-w-[520px] items-start gap-3 rounded-xl border-l-[3px] border-[#F2A93B] bg-white/80 p-4">
                        <Droplets
                            size={21}
                            className="mt-0.5 shrink-0 text-[#087E85]"
                        />
                        <p className="text-sm font-semibold leading-6 text-[#344B5C]">
                            Less time searching for records.
                            More clarity across your daily business.
                        </p>
                    </div>

                    {/* CTA */}
                    <a
                        href="#features"
                        className="group mt-7 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-[#F2A93B] px-6 text-sm font-extrabold text-[#172337] shadow-[0_8px_22px_rgba(242,169,59,0.18)] transition hover:-translate-y-1 hover:bg-[#E99A20]"
                    >
                        Explore the solution
                        <ArrowRight
                            size={17}
                            className="transition-transform group-hover:translate-x-1"
                        />
                    </a>
                </div>

                {/* RIGHT: BEFORE / AFTER COMPARISON */}
                <div className="min-w-0 space-y-4">

                    {comparisons.map((item, index) => {
                        const Icon = item.icon;
                        const styles = accentStyles[item.accent];

                        return (
                            <article
                                key={item.title}
                                className="
                  group relative grid min-w-0 overflow-hidden
                  rounded-2xl border border-[#E1E8E5]
                  bg-white shadow-[0_4px_18px_rgba(16,31,53,0.025)]
                  transition-all duration-300
                  hover:-translate-y-1 hover:border-[#B9DDD7]
                  hover:shadow-[0_14px_35px_rgba(16,31,53,0.07)]
                  sm:grid-cols-[64px_minmax(0,1fr)]
                  lg:grid-cols-[64px_minmax(0,1fr)]
                "
                            >
                                {/* ICON COLUMN */}
                                <div className="hidden items-center justify-center border-r border-[#E8EEEA] sm:flex">
                                    <span
                                        className={`flex size-11 items-center justify-center rounded-xl ${styles.icon}`}
                                    >
                                        <Icon size={21} strokeWidth={1.9} />
                                    </span>
                                </div>

                                {/* COMPARISON CONTENT */}
                                <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2">

                                    {/* BEFORE */}
                                    <div className="min-w-0 p-4 sm:p-5 lg:p-6">
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F3F1] text-[#64746F] sm:hidden">
                                                <Icon size={18} />
                                            </span>

                                            <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#89958F]">
                                                Before
                                            </span>
                                        </div>

                                        <h3 className="mb-2 text-sm font-extrabold text-[#263D53]">
                                            {item.title}
                                        </h3>

                                        <p className="text-[12px] leading-6 text-[#647586] sm:text-[13px]">
                                            {item.before}
                                        </p>
                                    </div>

                                    {/* AFTER */}
                                    <div className="min-w-0 border-t border-[#E8EEEA] bg-[#FBFCFA] p-4 sm:border-l sm:border-t-0 sm:p-5 lg:p-6">
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className={`size-2 shrink-0 rounded-full ${styles.dot}`} />

                                            <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#087E85]">
                                                With Amrit Jal
                                            </span>
                                        </div>

                                        <p className="text-[12px] font-medium leading-6 text-[#344B5C] sm:text-[13px]">
                                            {item.after}
                                        </p>

                                        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-[#087E85]">
                                            <Check size={13} />
                                            Organised workflow
                                        </div>
                                    </div>
                                </div>

                                {/* TOP ACCENT */}
                                <div className={`absolute left-0 top-0 h-[3px] w-0 transition-all duration-300 group-hover:w-full ${styles.dot}`} />
                            </article>
                        );
                    })}

                    {/* BOTTOM NOTE */}
                    <div className="flex items-center gap-2 px-2 pt-1 text-[11px] font-medium text-[#89958F]">
                        <FileText size={14} />
                        <span>
                            One workspace for your everyday business records.
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
