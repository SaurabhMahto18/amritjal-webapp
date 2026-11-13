
import {
  Mail,
  Phone,
  MessageCircle,
  ArrowUpRight,
  Headphones,
  Clock3,
} from "lucide-react";

const contacts = [
  {
    icon: Mail,
    title: "Email Support",
    value: "care.amritjal@gmail.com",
    description: "For product enquiries and support.",
    accent: "#087E85",
    background: "#E6F5F2",
    href: "mailto:care.amritjal@gmail.com",
  },
  {
    icon: Phone,
    title: "Call Support",
    value: "Support number coming soon",
    description: "For direct business assistance.",
    accent: "#D58B27",
    background: "#FFF3DF",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    value: "WhatsApp support coming soon",
    description: "For quick questions and assistance.",
    accent: "#159B63",
    background: "#E7F6ED",
  },
];

export default function ContactSection() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative isolate scroll-mt-24 overflow-hidden bg-[#F7F8F5] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:px-16"
    >
      {/* BACKGROUND GRID */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(#DCE7E0 1px, transparent 1px),
            linear-gradient(90deg, #DCE7E0 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px",
        }}
      />

      {/* BACKGROUND ACCENT */}
      <div className="pointer-events-none absolute -left-32 top-10 -z-10 size-72 rounded-full bg-[#BCE9DE]/30 blur-[100px]" />

      <div className="mx-auto grid max-w-[1440px] items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 xl:gap-24">

        {/* LEFT CONTENT */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE7E0] bg-white px-3.5 py-2 shadow-sm">
            <span className="size-1.5 rounded-full bg-[#087E85]" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#087E85]">
              Contact Amrit Jal
            </span>
          </div>

          <h2
            id="contact-heading"
            className="mt-6 max-w-xl text-balance text-[36px] font-black leading-[1.1] tracking-[-0.045em] text-[#101F35] sm:text-[46px] lg:text-[52px] xl:text-[58px]"
          >
            We're here to help you
            <span className="block text-[#087E85]">
              move forward.
            </span>
          </h2>

          <p className="mt-5 max-w-lg text-sm leading-7 text-[#687B87] sm:text-base sm:leading-8">
            Have questions about Amrit Jal or need help getting started?
            Our support channels will help you connect with the team
            for product information and assistance.
          </p>

          {/* SUPPORT INFO */}
          <div className="mt-8 flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F5F2] text-[#087E85]">
              <Headphones size={20} />
            </span>

            <div>
              <p className="text-sm font-bold text-[#172B40]">
                Customer assistance
              </p>
              <p className="mt-1 text-xs leading-6 text-[#81909A]">
                Contact us through our official email for assistance.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT CONTACT CARDS */}
        <div className="grid gap-4 sm:grid-cols-2">
          {contacts.map(
            ({ icon: Icon, title, value, description, accent, background, href }, index) => {
              const CardContent = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="flex size-12 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: background,
                        color: accent,
                      }}
                    >
                      <Icon size={23} strokeWidth={1.9} />
                    </span>

                    <ArrowUpRight
                      size={17}
                      className="text-[#A8B8B2] transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                    />
                  </div>

                  <h3 className="mt-5 text-base font-extrabold text-[#172B40]">
                    {title}
                  </h3>

                  <p className="mt-2 break-all text-xs font-bold" style={{ color: accent }}>
                    {value}
                  </p>

                  <p className="mt-2 text-xs leading-6 text-[#81909A]">
                    {description}
                  </p>

                  <span
                    className="pointer-events-none absolute -bottom-10 -right-10 size-28 rounded-full opacity-30 transition-transform duration-500 group-hover:scale-150"
                    style={{ backgroundColor: background }}
                  />
                </>
              );

              const cardClass = `
                group relative overflow-hidden rounded-[20px]
                border border-[#E2EAE5] bg-white p-5
                shadow-[0_4px_18px_rgba(16,31,53,0.025)]
                transition-all duration-300
                hover:-translate-y-1 hover:border-[#B9DDD7]
                hover:shadow-[0_14px_30px_rgba(8,126,133,0.07)]
                sm:p-6
                ${index === 2 ? "sm:col-span-2" : ""}
              `;

              return href ? (
                <a key={title} href={href} className={cardClass}>
                  {CardContent}
                </a>
              ) : (
                <article key={title} className={cardClass}>
                  {CardContent}
                </article>
              );
            }
          )}
        </div>
      </div>

      {/* BOTTOM NOTE */}
      <div className="mx-auto mt-10 flex max-w-[1440px] flex-col items-start gap-3 border-t border-[#DFE7E2] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-[#81909A]">
          <Clock3 size={15} className="text-[#087E85]" />
          <span>Official support availability will be announced soon.</span>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-[#087E85]">
          Amrit Jal · Business Management
        </span>
      </div>
    </section>
  );
}
