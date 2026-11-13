
import SectionHeading from "../../../components/landing/SectionHeading";
import {
  Droplets,
  CircleCheck,
  Users,
  Truck,
  Package,
  Wallet,
  ArrowUpRight,
  Waves,
} from "lucide-react";

const benefits = [
  "Keep customer and delivery information organised",
  "Review payments and outstanding balances",
  "Manage jar operations and invoices",
  "Get a clearer view of day-to-day activity",
];

const workflows = [
  {
    icon: Users,
    title: "Customer Management",
    description: "Customer information in one place",
    color: "bg-[#E6F5F3] text-[#087E85]",
  },
  {
    icon: Truck,
    title: "Daily Deliveries",
    description: "Keep delivery records organised",
    color: "bg-[#EAF2F9] text-[#557FA9]",
  },
  {
    icon: Package,
    title: "Jar Operations",
    description: "Monitor your jar inventory",
    color: "bg-[#FFF3DF] text-[#D58B27]",
  },
  {
    icon: Wallet,
    title: "Payments & Billing",
    description: "Track invoices and collections",
    color: "bg-[#F0EDF9] text-[#8067B2]",
  },
];

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative scroll-mt-24 overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24"
    >
      {/* SUBTLE BACKGROUND DECORATION */}
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#DDF2ED]/50 blur-[90px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#F2A93B]/[0.07] blur-[100px]" />

      <div className="relative mx-auto grid w-full max-w-[1440px] items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-24">

        {/* LEFT: ORIGINAL PRODUCT VISUAL */}
        <div className="relative mx-auto w-full max-w-[580px]">

          {/* WATER RIPPLE BACKGROUND */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[260px] w-[260px] rounded-full border border-[#A9DED6]/40 sm:h-[370px] sm:w-[370px]" />
            <div className="absolute h-[340px] w-[340px] rounded-full border border-[#A9DED6]/25 sm:h-[470px] sm:w-[470px]" />
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-[#DFEBE6] bg-[#F0F8F5] p-4 shadow-[0_20px_60px_rgba(16,48,60,0.07)] sm:rounded-[34px] sm:p-7">

            {/* VISUAL HEADER */}
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#087E85]">
                  One connected workspace
                </p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-[#101F35] sm:text-2xl">
                  Meet Amrit Jal
                </h3>
              </div>

              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#087E85] text-white shadow-lg shadow-[#087E85]/20 sm:size-12">
                <Droplets size={26} />
              </span>
            </div>

            {/* WORKFLOW CARDS */}
            <div className="relative z-10 mt-7 grid grid-cols-1 gap-3 min-[430px]:grid-cols-2">
              {workflows.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white bg-white/90 p-3.5 shadow-[0_5px_20px_rgba(16,31,53,0.035)] transition duration-300 hover:-translate-y-1 hover:shadow-md sm:p-4"
                  >
                    <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                      <Icon size={21} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <h4 className="break-words text-[12px] font-extrabold text-[#172B40] sm:text-sm">
                        {item.title}
                      </h4>
                      <p className="mt-1 break-words text-[10px] leading-relaxed text-[#87959E] sm:text-xs">
                        {item.description}
                      </p>
                    </div>

                    <ArrowUpRight
                      size={15}
                      className="shrink-0 text-[#A8B8B2] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#087E85]"
                    />
                  </div>
                );
              })}
            </div>

            {/* BRAND STATEMENT */}
            <div className="relative z-10 mt-5 overflow-hidden rounded-2xl bg-[#101F35] p-5 text-white sm:p-6">
              <div className="absolute -right-8 -top-12 size-36 rounded-full border border-white/10" />
              <div className="absolute -right-2 -top-6 size-24 rounded-full border border-white/10" />

              <div className="relative flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#087E85] text-white">
                  <Waves size={22} />
                </span>

                <div>
                  <p className="text-sm font-extrabold">
                    Everything connected.
                  </p>
                  <p className="mt-1 text-[11px] text-white/60">
                    One platform for everyday business operations.
                  </p>
                </div>
              </div>
            </div>

            {/* BOTTOM BRAND NOTE */}
            <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-2 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#81948F]">
                AMRIT JAL · BUSINESS MANAGEMENT
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#087E85]">
                <Droplets size={13} />
                Manage with clarity
              </span>
            </div>
          </div>

          {/* DECORATIVE WATER DROP */}
          <div className="pointer-events-none absolute -bottom-5 -left-3 flex size-12 items-center justify-center rounded-2xl border border-white bg-white text-[#087E85] shadow-lg sm:-left-5">
            <Droplets size={23} />
          </div>
        </div>

        {/* RIGHT: ABOUT CONTENT */}
        <div className="w-full min-w-0 lg:py-5">

          <SectionHeading
            align="left"
            eyebrow="About Amrit Jal"
            title="Less scattered work. More business clarity."
            description="Running a water delivery business involves customers, delivery records, jars, collections and invoices. Amrit Jal brings these everyday workflows into one digital workspace."
          />

          {/* BENEFITS */}
          <ul className="mt-7 space-y-3.5 sm:mt-8 sm:space-y-4">
            {benefits.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-transparent p-2.5 transition hover:border-[#E5EFEB] hover:bg-[#F8FAF7]"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#E6F5F3] text-[#087E85]">
                  <CircleCheck size={16} strokeWidth={2.3} />
                </span>

                <span className="min-w-0 text-[13px] font-semibold leading-6 text-[#536576] sm:text-sm">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          {/* HINDI BRAND MESSAGE */}
          <div className="mt-7 rounded-2xl border border-[#E4ECE7] bg-[#F8FAF7] p-4 sm:p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#087E85]">
              Built around your daily work
            </p>
            <p className="mt-2 text-sm font-bold leading-7 text-[#263D53] sm:text-base">
              Aapke business ka har zaroori hisaab,
              ab ek hi digital workspace mein.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
