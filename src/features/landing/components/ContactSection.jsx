
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
    accent: "#087E80",
    background: "#EAF5F2",
    href: "mailto:care.amritjal@gmail.com",
    available: true,
  },
  {
    icon: Phone,
    title: "Call Support",
    value: "Support number coming soon",
    description: "For direct business assistance.",
    accent: "#B58A35",
    background: "#FBF4E4",
    available: false,
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    value: "WhatsApp support coming soon",
    description: "For quick questions and assistance.",
    accent: "#269568",
    background: "#EAF5EE",
    available: false,
  },
];

export default function ContactSection() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="
        relative isolate scroll-mt-24 overflow-hidden
        bg-[#F7F6F0] px-4 py-16
        sm:px-6 sm:py-20
        lg:px-10 lg:py-24 xl:px-16
      "
    >
      {/* Background accents */}
      <div className="pointer-events-none absolute -left-32 top-10 -z-10 size-72 rounded-full bg-[#087E80]/[0.06] blur-[100px]" />

      <div className="pointer-events-none absolute -right-32 bottom-0 -z-10 size-72 rounded-full bg-[#E9CA43]/[0.08] blur-[100px]" />

      <div className="mx-auto grid max-w-[1440px] items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 xl:gap-24">
        {/* Left content */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EDEAE0] bg-white px-3.5 py-2 shadow-sm">
            <span className="size-1.5 rounded-full bg-[#087E80]" />

            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#087E80]">
              Contact Amrit Jal
            </span>
          </div>

          <h2
            id="contact-heading"
            className="
              mt-6 max-w-xl text-balance
              text-[36px] font-black leading-[1.1]
              tracking-[-0.045em] text-[#24262B]
              sm:text-[46px] lg:text-[52px] xl:text-[58px]
            "
          >
            We're here to help you
            <span className="block text-[#087E80]">
              move forward.
            </span>
          </h2>

          <p className="mt-5 max-w-lg text-sm leading-7 text-[#777970] sm:text-base sm:leading-8">
            Have questions about Amrit Jal or need help getting started?
            Our support channels will help you connect with the team
            for product information and assistance.
          </p>

          {/* Support information */}
          <div className="mt-8 flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#EDEAE0] bg-white text-[#087E80] shadow-sm">
              <Headphones size={20} />
            </span>

            <div>
              <p className="text-sm font-bold text-[#24262B]">
                Customer assistance
              </p>

              <p className="mt-1 text-xs leading-6 text-[#898A81]">
                Contact us through our official email for assistance.
              </p>
            </div>
          </div>

          {/* Email shortcut */}
          <a
            href="mailto:care.amritjal@gmail.com"
            className="
              mt-7 inline-flex items-center gap-2
              text-sm font-bold text-[#087E80]
              transition-colors hover:text-[#065F61]
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-[#087E80]
              focus-visible:ring-offset-4
            "
          >
            Send us an email
            <ArrowUpRight size={16} />
          </a>
        </div>

        {/* Right contact cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {contacts.map(
            ({
              icon: Icon,
              title,
              value,
              description,
              accent,
              background,
              href,
              available,
            }) => {
              const cardContent = (
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
                      className="text-[#B0AEA3] transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                    />
                  </div>

                  <h3 className="mt-5 text-base font-extrabold text-[#24262B]">
                    {title}
                  </h3>

                  <p
                    className="mt-2 break-all text-xs font-bold"
                    style={{ color: accent }}
                  >
                    {value}
                  </p>

                  <p className="mt-2 text-xs leading-6 text-[#898A81]">
                    {description}
                  </p>

                  <span
                    className="
                      pointer-events-none absolute -bottom-10 -right-10
                      size-28 rounded-full opacity-30
                      transition-transform duration-500
                      group-hover:scale-150
                    "
                    style={{ backgroundColor: background }}
                  />

                  {!available && (
                    <span className="mt-4 inline-flex items-center rounded-full border border-[#EDEAE0] bg-[#F7F6F0] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#898A81]">
                      Coming soon
                    </span>
                  )}
                </>
              );

              const cardClass = `
                group relative overflow-hidden rounded-[20px]
                border border-[#EDEAE0] bg-white p-5
                shadow-[0_4px_18px_rgba(36,38,43,0.025)]
                transition-all duration-300
                ${
                  available
                    ? "cursor-pointer hover:-translate-y-1 hover:border-[#B8D9D3] hover:shadow-[0_14px_30px_rgba(8,126,128,0.07)]"
                    : "cursor-default"
                }
                sm:p-6
                ${title === "WhatsApp" ? "sm:col-span-2" : ""}
              `;

              return href ? (
                <a
                  key={title}
                  href={href}
                  aria-label={`${title}: ${value}`}
                  className={cardClass}
                >
                  {cardContent}
                </a>
              ) : (
                <article
                  key={title}
                  aria-label={`${title}: ${value}`}
                  className={cardClass}
                >
                  {cardContent}
                </article>
              );
            }
          )}
        </div>
      </div>

      {/* Bottom note */}
      <div className="
        mx-auto mt-10 flex max-w-[1440px]
        flex-col items-start gap-3
        border-t border-[#E5E2D8] pt-6
        sm:flex-row sm:items-center sm:justify-between
      ">
        <div className="flex items-center gap-2 text-xs text-[#898A81]">
          <Clock3 size={15} className="text-[#087E80]" />
          <span>
            Official support availability will be announced soon.
          </span>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-[#087E80]">
          Amrit Jal · Business Management
        </span>
      </div>
    </section>
  );
}
