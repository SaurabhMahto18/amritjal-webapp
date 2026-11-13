
import {
  ArrowRight,
  ArrowUpRight,
  Droplets,
  Truck,
  Package,
  Wallet,
  Users,
  ReceiptText,
  ChartNoAxesCombined,
  Check,
  MessageCircle,
  Waves,
  Bell,
} from "lucide-react";

const dashboardStats = [
  {
    label: "Today's Deliveries",
    value: "142",
    detail: "Delivery overview",
    icon: Truck,
    color: "text-[#087E85]",
    bg: "bg-[#E6F5F3]",
  },
  {
    label: "Jar Inventory",
    value: "486",
    detail: "Stock overview",
    icon: Package,
    color: "text-[#D58B27]",
    bg: "bg-[#FFF3DF]",
  },
  {
    label: "Collections",
    value: "₹18,340",
    detail: "Payment overview",
    icon: Wallet,
    color: "text-[#557FA9]",
    bg: "bg-[#EAF2F9]",
  },
];

const quickFeatures = [
  { icon: Users, label: "Customers" },
  { icon: Truck, label: "Deliveries" },
  { icon: ReceiptText, label: "Billing" },
  { icon: ChartNoAxesCombined, label: "Reports" },
];

export default function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#F7F6F0]">
      {/* BACKGROUND WATER ELEMENTS */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-32 h-[380px] w-[380px] rounded-full bg-[#BDEAE5]/45 blur-[90px]" />

        <div className="absolute -right-40 top-20 h-[460px] w-[460px] rounded-full bg-[#D8F0EB]/70 blur-[100px]" />

        <div className="absolute bottom-0 left-[35%] h-[250px] w-[450px] rounded-full bg-[#F2A93B]/[0.07] blur-[100px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#173B4B 1px, transparent 1px), linear-gradient(90deg, #173B4B 1px, transparent 1px)",
            backgroundSize: "54px 54px",
          }}
        />
      </div>

      <div className="mx-auto grid w-full max-w-[1600px] items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[690px] lg:grid-cols-[1fr_0.95fr] lg:gap-8 lg:px-12 lg:py-16 xl:px-16">

        {/* LEFT: BRAND MESSAGE */}
        <div className="relative z-10 mx-auto w-full max-w-[670px] lg:mx-0">

          {/* EYEBROW */}
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-[#DFEAE6] bg-white/90 px-4 py-2.5 shadow-sm">
            <span className="flex size-2 items-center justify-center rounded-full bg-[#16B9B0]">
              <span className="size-2 animate-ping rounded-full bg-[#16B9B0] opacity-60" />
            </span>

            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#344B5C] sm:text-[11px]">
              A Smarter Way to Run Your Water Business
            </span>
          </div>

          {/* HEADLINE */}
          <h1 className="max-w-[700px] text-[42px] font-black leading-[1.08] tracking-[-0.045em] text-[#101F35] sm:text-[54px] lg:text-[58px] xl:text-[66px]">
            Every Jar.
            <br />
            Every Delivery.
            <br />
            <span className="relative inline-block text-[#087E85]">
              Under Control.
              <span className="absolute -bottom-1 left-0 h-[4px] w-full rounded-full bg-[#F2A93B]" />
            </span>
          </h1>

          {/* DESCRIPTION */}
          <p className="mt-7 max-w-[590px] text-[15px] leading-7 text-[#536576] sm:text-[17px] sm:leading-8">
            Run your water delivery business with confidence.
            Manage customers, daily deliveries, jar inventory,
            payments, invoices and expenses — all from one
            simple platform.
          </p>

          {/* HINDI BRAND STATEMENT */}
          <div className="mt-6 flex max-w-[590px] items-start gap-3 rounded-xl border-l-[3px] border-[#F2A93B] bg-white/75 px-4 py-4 shadow-[0_5px_20px_rgba(16,31,53,0.025)]">
            <span className="text-2xl font-black leading-none text-[#E6A033]">
              “
            </span>

            <p className="text-sm font-semibold leading-7 text-[#344B5C] sm:text-[15px]">
              Har delivery ka hisaab. Har jar par nazar.
              Har payment ka record.
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-7 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center">

            <a
              href="#features"
              className="group inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-xl bg-[#087E85] px-6 text-sm font-extrabold text-white shadow-[0_9px_24px_rgba(8,126,133,0.19)] transition duration-200 hover:-translate-y-1 hover:bg-[#066C72]"
            >
              Explore Amrit Jal
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </a>

            <a
              href="#contact"
              className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-xl border border-[#DCE6E3] bg-white px-6 text-sm font-bold text-[#263D53] transition hover:border-[#087E85] hover:bg-[#F0F8F7] hover:text-[#087E85]"
            >
              <MessageCircle size={18} />
              Book a Free Demo
              <ArrowUpRight size={16} />
            </a>
          </div>

          {/* TRUST POINTS */}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-[#647586]">
            <span className="inline-flex items-center gap-1.5">
              <Check size={15} className="text-[#087E85]" />
              Simple to manage
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Check size={15} className="text-[#087E85]" />
              Hindi & English
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Check size={15} className="text-[#087E85]" />
              Business overview
            </span>
          </div>

          {/* FEATURE SHORTCUTS */}
          <div className="mt-9 grid grid-cols-4 gap-2 sm:max-w-[540px] sm:gap-3">
            {quickFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.label}
                  className="flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-[#E2E9E4] bg-white/80 px-1 py-4 shadow-sm transition hover:-translate-y-1 hover:border-[#B8DDD7] sm:flex-row sm:justify-start sm:px-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F5F2] text-[#087E85]">
                    <Icon size={18} />
                  </span>

                  <span className="truncate text-[10px] font-bold text-[#405468] sm:text-xs">
                    {feature.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: ORIGINAL PRODUCT VISUAL */}
        <div className="relative mx-auto flex min-h-[490px] w-full max-w-[620px] items-center justify-center sm:min-h-[580px] lg:min-h-[620px]">

          {/* ABSTRACT WATER RIPPLES */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="absolute h-[290px] w-[290px] rounded-full border border-[#87D6CF]/35 sm:h-[420px] sm:w-[420px]" />
            <div className="absolute h-[350px] w-[350px] rounded-full border border-[#87D6CF]/25 sm:h-[500px] sm:w-[500px]" />
            <div className="absolute h-[410px] w-[410px] rounded-full border border-[#87D6CF]/15 sm:h-[570px] sm:w-[570px]" />

            <div className="absolute h-[270px] w-[270px] rounded-full bg-[#BDEAE5]/35 blur-3xl sm:h-[390px] sm:w-[390px]" />
          </div>

          {/* WATER SHAPE */}
          <div className="pointer-events-none absolute -right-4 top-[7%] h-[170px] w-[170px] rotate-12 rounded-[55%_45%_60%_40%] bg-[#B8E7E1]/45 blur-[1px] sm:right-0 sm:h-[220px] sm:w-[220px]" />

          <div className="pointer-events-none absolute bottom-[10%] left-0 h-[120px] w-[170px] -rotate-12 rounded-[50%_50%_35%_65%] bg-[#D5EDE7]/75 blur-[1px] sm:h-[160px] sm:w-[220px]" />

          {/* MAIN DASHBOARD PANEL */}
          <div className="relative z-10 w-[min(100%,390px)] rotate-[-2deg] rounded-[28px] border border-white/90 bg-white p-3 shadow-[0_30px_80px_rgba(16,48,60,0.16)] transition-transform duration-500 hover:rotate-0 sm:rounded-[34px] sm:p-4">

            {/* Dashboard top bar */}
            <div className="flex items-center justify-between border-b border-[#EDF1EE] px-2 pb-4 pt-2">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#087E85] text-white shadow-sm">
                  <Droplets size={23} />
                </span>

                <div>
                  <p className="text-[14px] font-black tracking-tight text-[#101F35]">
                    Amrit <span className="text-[#087E85]">Jal</span>
                  </p>
                  <p className="text-[9px] font-semibold text-[#91A0A9]">
                    BUSINESS OVERVIEW
                  </p>
                </div>
              </div>

              <div className="flex size-9 items-center justify-center rounded-full bg-[#F1F6F3] text-[#55716E]">
                <Bell size={17} />
              </div>
            </div>

            {/* Greeting */}
            <div className="px-2 pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#91A0A9]">
                YOUR BUSINESS AT A GLANCE
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#101F35]">
                Daily Overview
              </h2>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {dashboardStats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className={`rounded-2xl border border-[#EDF0EB] p-3 ${stat.bg} ${
                      stat.label === "Collections"
                        ? "col-span-2 flex items-center justify-between"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#657786]">
                        {stat.label}
                      </span>

                      <Icon size={16} className={stat.color} />
                    </div>

                    <p className="mt-3 text-[23px] font-black tracking-tight text-[#172C40]">
                      {stat.value}
                    </p>

                    <p className="mt-1 text-[9px] font-medium text-[#8997A1]">
                      {stat.detail}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Delivery progress */}
            <div className="mt-3 rounded-2xl border border-[#E9EFEB] bg-[#FBFCFA] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-extrabold text-[#263D53]">
                    Delivery Progress
                  </p>
                  <p className="mt-1 text-[9px] text-[#8A999F]">
                    Sample dashboard preview
                  </p>
                </div>

                <span className="rounded-lg bg-[#E6F5F3] px-2 py-1 text-[9px] font-bold text-[#087E85]">
                  Overview
                </span>
              </div>

              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#E8EFEC]">
                <div className="w-[62%] rounded-full bg-[#087E85]" />
                <div className="w-[18%] bg-[#F2A93B]" />
              </div>

              <div className="mt-3 flex flex-wrap justify-between gap-2 text-[9px] font-semibold text-[#72838D]">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#087E85]" />
                  Delivered
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#F2A93B]" />
                  In progress
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#DCE5E1]" />
                  Pending
                </span>
              </div>
            </div>

            {/* Feature tiles */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { icon: Users, label: "Customers" },
                { icon: Package, label: "Inventory" },
                { icon: Wallet, label: "Payments" },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex flex-col items-center gap-2 rounded-xl border border-[#EDF0EB] bg-white py-3"
                  >
                    <Icon size={18} className="text-[#087E85]" />
                    <span className="text-[9px] font-bold text-[#526578]">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Dashboard bottom */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-[#101F35] px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Waves size={17} className="text-[#63D6D2]" />
                <span className="text-[10px] font-bold">
                  Manage your business
                </span>
              </div>

              <ArrowUpRight size={16} className="text-[#F2A93B]" />
            </div>
          </div>

          {/* FLOATING CARD: CUSTOMER MANAGEMENT */}
          <div className="absolute left-0 top-[12%] z-20 hidden items-center gap-3 rounded-2xl border border-[#E5ECE8] bg-white p-3 shadow-[0_15px_40px_rgba(16,31,53,0.10)] sm:flex">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#E6F5F3] text-[#087E85]">
              <Users size={19} />
            </span>

            <div>
              <p className="text-[11px] font-extrabold text-[#172B40]">
                Customer Management
              </p>
              <p className="mt-1 text-[9px] text-[#83929D]">
                Organised customer records
              </p>
            </div>
          </div>

          {/* FLOATING CARD: JAR INVENTORY */}
          <div className="absolute bottom-[16%] right-0 z-20 hidden items-center gap-3 rounded-2xl border border-[#E5ECE8] bg-white p-3 shadow-[0_15px_40px_rgba(16,31,53,0.10)] sm:flex">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#FFF3DF] text-[#D58B27]">
              <Package size={19} />
            </span>

            <div>
              <p className="text-[11px] font-extrabold text-[#172B40]">
                Jar Inventory
              </p>
              <p className="mt-1 text-[9px] text-[#83929D]">
                Track your stock
              </p>
            </div>
          </div>

          {/* BRAND WATER DROP */}
          <div className="absolute bottom-[4%] left-[7%] z-20 flex size-12 items-center justify-center rounded-2xl border border-white bg-white/90 text-[#087E85] shadow-lg sm:bottom-[6%] sm:left-[10%]">
            <Droplets size={23} />
          </div>
        </div>
      </div>

      {/* BOTTOM SOFT WAVE */}
      <div className="pointer-events-none absolute bottom-0 left-0 h-5 w-full rounded-t-[50%] bg-white/70" />
    </section>
  );
}
