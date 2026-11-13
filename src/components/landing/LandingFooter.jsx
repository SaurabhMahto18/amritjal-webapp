
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/* =========================================
   CUSTOM SVG ICONS
========================================= */

function WaterDropIcon({ size = 30 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2.5C12 2.5 5 10.2 5 15.2a7 7 0 0 0 14 0C19 10.2 12 2.5 12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 15.5a3.5 3.5 0 0 0 3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InstagramIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="17.5" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.019 4.388 11.016 10.125 11.927v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.973h-1.513c-1.491 0-1.956.931-1.956 1.887v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.089 24 18.092 24 12.073Z" />
    </svg>
  );
}

function YouTubeIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.5c.3-.5.6-.5.9-.5l.8 1.7-.8 1c.6 1.3 1.6 2.3 2.9 2.9l1-.8 1.7.8c0 .3 0 .6-.5.9-.6.5-1.3.7-2 .5-2.3-.6-4.6-2.9-5.2-5.2-.2-.7 0-1.4.5-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ArrowUpRightIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

function MailIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function ArrowUpIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

/* =========================================
   FOOTER DATA
========================================= */

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "About", href: "#about" },
  { label: "FAQs", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

const solutionLinks = [
  { label: "Water billing software", href: "#features" },
  { label: "Smart water management", href: "#features" },
  { label: "RO water supplier management", href: "#features" },
  { label: "Jar inventory management", href: "#features" },
  { label: "Customer management", href: "#features" },
];

const socialLinks = [
  {
    name: "Instagram",
    icon: <InstagramIcon />,
    href: null,
    hover:
      "hover:border-[#E1306C]/40 hover:bg-[#E1306C]/10 hover:text-[#E1306C]",
  },
  {
    name: "Facebook",
    icon: <FacebookIcon />,
    href: null,
    hover:
      "hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10 hover:text-[#1877F2]",
  },
  {
    name: "YouTube",
    icon: <YouTubeIcon />,
    href: null,
    hover:
      "hover:border-[#FF0033]/40 hover:bg-[#FF0033]/10 hover:text-[#FF0033]",
  },
];

/* =========================================
   LANDING FOOTER
========================================= */

export default function LandingFooter() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Show floating arrow after scrolling down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Smooth scroll to page top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <footer className="w-full bg-[#08172B] text-[#D3DCE7]">
        <div className="mx-auto max-w-[1600px] px-6 pt-14 sm:px-10 sm:pt-16 lg:px-14 lg:pt-20">

          {/* MAIN FOOTER */}
          <div className="grid grid-cols-1 gap-12 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-[2fr_0.8fr_1.1fr_1.25fr] lg:gap-12">

            {/* BRAND */}
            <div className="max-w-lg">
              <Link
                to="/"
                aria-label="Amrit Jal home"
                className="inline-flex items-center gap-3"
              >
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-[#63D6D2]">
                  <WaterDropIcon size={30} />
                </span>

                <span>
                  <span className="block text-2xl font-bold tracking-tight text-white">
                    Amrit <span className="text-[#63D6D2]">Jal</span>
                  </span>

                  <span className="mt-1 block text-xs font-semibold text-[#63D6D2]">
                    Smarter Water Management
                  </span>
                </span>
              </Link>

              <p className="mt-7 max-w-[480px] text-sm leading-7 text-[#B0BDCC] sm:text-[15px]">
                The easier way for water jar suppliers and RO businesses
                to manage customers, daily deliveries, jar inventory,
                billing, employees and business operations — all in one place.
              </p>

              {/* SOCIAL LINKS */}
              <div className="mt-7 flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href || undefined}
                    aria-label={social.name}
                    aria-disabled={!social.href}
                    onClick={
                      social.href
                        ? undefined
                        : (event) => event.preventDefault()
                    }
                    className={`flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#AEBCCC] transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.07] ${social.hover}`}
                  >
                    {social.icon}
                  </a>
                ))}

                <a
                  href="#contact"
                  aria-label="WhatsApp support"
                  className="flex size-11 items-center justify-center rounded-xl border border-[#20C875]/30 bg-[#20C875]/[0.06] text-[#20C875] transition-all duration-300 hover:-translate-y-1 hover:bg-[#20C875]/15"
                >
                  <WhatsAppIcon size={19} />
                </a>
              </div>
            </div>

            {/* PRODUCT */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#63D6D2]">
                Product
              </h2>

              <ul className="mt-6 space-y-4">
                {productLinks.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-[#B0BDCC] transition-colors duration-200 hover:text-white"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* SOLUTIONS */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#63D6D2]">
                Solutions
              </h2>

              <ul className="mt-6 space-y-4">
                {solutionLinks.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm leading-6 text-[#B0BDCC] transition-colors duration-200 hover:text-white"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* REACH US */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#63D6D2]">
                Reach Us
              </h2>

              <div className="mt-6 space-y-6">

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8296A8]">
                    Sales & Support
                  </p>

                  <a
                    href="#contact"
                    className="mt-2 inline-flex items-center gap-2 text-sm text-[#D3DCE7] transition-colors hover:text-[#63D6D2]"
                  >
                    Contact support
                    <ArrowUpRightIcon />
                  </a>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8296A8]">
                    Email
                  </p>

                  <a
                    href="mailto:care.amritjal@gmail.com"
                    className="mt-2 inline-flex items-center gap-2 break-all text-sm text-[#D3DCE7] transition-colors hover:text-[#63D6D2]"
                  >
                    <MailIcon />
                    care.amritjal@gmail.com
                  </a>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8296A8]">
                    Service
                  </p>

                  <p className="mt-2 max-w-[260px] text-sm leading-6 text-[#B0BDCC]">
                    Water delivery businesses across India.
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* BOTTOM BAR */}
          <div className="flex flex-col gap-5 py-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-6 text-[#9AABBD]">
              © {new Date().getFullYear()} Amrit Jal. All rights reserved.
              <span className="mx-2 text-[#536579]">·</span>
              Built for smarter water delivery operations.
            </p>

            <div className="flex items-center gap-6 text-xs font-semibold text-[#D3DCE7]">
              <Link
                to="/privacy-policy"
                className="transition-colors hover:text-[#63D6D2]"
              >
                Privacy
              </Link>

              <Link
                to="/terms"
                className="transition-colors hover:text-[#63D6D2]"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* FLOATING SCROLL TO TOP */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        title="Back to top"
        tabIndex={showScrollTop ? 0 : -1}
        className={`
          fixed bottom-6 right-5 z-[100]
          flex size-12 items-center justify-center
          rounded-2xl border border-[#63D6D2]/30
          bg-[#087E85] text-white
          shadow-[0_8px_25px_rgba(8,126,133,0.28)]
          transition-all duration-300 ease-out
          hover:-translate-y-1 hover:bg-[#096C73]
          hover:shadow-[0_12px_30px_rgba(8,126,133,0.35)]
          focus-visible:outline-none focus-visible:ring-4
          focus-visible:ring-[#63D6D2]/40
          sm:bottom-8 sm:right-8
          ${
            showScrollTop
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-5 scale-90 opacity-0"
          }
        `}
      >
        <ArrowUpIcon size={21} />
      </button>
    </>
  );
}
