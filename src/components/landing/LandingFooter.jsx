
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Droplets,
  ArrowUp,
  ArrowRight,
  Mail,
  MapPin,
  LayoutDashboard,
  BookOpen,
  ShieldCheck,
} from "lucide-react";

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing & Plans", href: "/pricing" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Dashboard Preview", href: "/#product-preview" },
      { label: "Start Free Trial", href: "/signup" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Water Jar Suppliers", href: "/solutions" },
      { label: "Water Distribution", href: "/solutions" },
      { label: "Customer Management", href: "/features" },
      { label: "Delivery Management", href: "/features" },
      { label: "Billing & Invoices", href: "/features" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Tools & Resources", href: "/tools" },
      { label: "FAQs", href: "/#faq" },
      { label: "Contact Support", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Amrit Jal", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "Business Login", href: "/login" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
];

function FooterLink({ item }) {
  const isExternal = item.href.startsWith("http");

  if (isExternal) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-slate-500 transition-colors hover:text-[#087E80]"
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link
      to={item.href}
      className="text-sm text-slate-500 transition-colors hover:text-[#087E80]"
    >
      {item.label}
    </Link>
  );
}

export default function LandingFooter() {
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <footer className="border-t border-[#EDEAE0] bg-white text-[#24262B]">

        {/* MAIN FOOTER */}
        <div className="mx-auto max-w-[1440px] px-4 pb-6 pt-12 sm:px-6 sm:pt-16 lg:px-8">

          <div className="grid grid-cols-1 gap-10 border-b border-[#EDEAE0] pb-10 sm:grid-cols-2 lg:grid-cols-[1.7fr_repeat(4,1fr)] lg:gap-8 lg:pb-12">

            {/* BRAND INFORMATION */}
            <div className="max-w-sm">
              <Link
                to="/"
                aria-label="Amrit Jal homepage"
                className="inline-flex items-center gap-3"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-[#087E80] text-white shadow-sm">
                  <Droplets size={27} strokeWidth={2.1} />
                </span>

                <span>
                  <span className="block text-xl font-extrabold tracking-tight text-[#24262B]">
                    AMRIT <span className="text-[#087E80]">JAL</span>
                  </span>

                  <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.11em] text-slate-500">
                    WATER BUSINESS MANAGEMENT
                  </span>
                </span>
              </Link>

              <p className="mt-5 text-sm leading-7 text-slate-500">
                Manage your water delivery business with one platform
                for customers, daily deliveries, inventory, invoices,
                payments and business operations.
              </p>

              <div className="mt-5 flex items-center gap-2 text-xs font-medium text-[#087E80]">
                <ShieldCheck size={16} />
                <span>Built for water businesses across India</span>
              </div>

              <div className="mt-6">
                <Link
                  to="/signup"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#087E80] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#06696B]"
                >
                  Start 30-Day Free Trial
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* FOOTER LINK GROUPS */}
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-bold text-[#24262B]">
                  {group.title}
                </h2>

                <ul className="mt-5 space-y-3.5">
                  {group.links.map((item) => (
                    <li key={item.label}>
                      <FooterLink item={item} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* CONTACT STRIP */}
          <div className="grid grid-cols-1 gap-4 border-b border-[#EDEAE0] py-6 sm:grid-cols-2">

            <a
              href="mailto:care.amritjal@gmail.com"
              className="flex min-w-0 items-center gap-3 rounded-xl bg-[#F7F6F0] p-3 transition hover:bg-[#F0EEE5]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#087E80]">
                <Mail size={19} />
              </span>

              <span className="min-w-0">
                <span className="block text-xs font-semibold text-slate-400">
                  Email Support
                </span>
                <span className="mt-1 block break-all text-sm font-semibold text-[#343A40]">
                  care.amritjal@gmail.com
                </span>
              </span>
            </a>

            <div className="flex items-center gap-3 rounded-xl bg-[#F7F6F0] p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#087E80]">
                <MapPin size={19} />
              </span>

              <span>
                <span className="block text-xs font-semibold text-slate-400">
                  Service Area
                </span>
                <span className="mt-1 block text-sm font-semibold text-[#343A40]">
                  Water businesses across India
                </span>
              </span>
            </div>
          </div>

          {/* BOTTOM BAR */}
          <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-xs leading-6 text-slate-400">
              © {new Date().getFullYear()} Amrit Jal. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link
                to="/privacy-policy"
                className="text-xs font-medium text-slate-500 transition hover:text-[#087E80]"
              >
                Privacy Policy
              </Link>

              <Link
                to="/terms"
                className="text-xs font-medium text-slate-500 transition hover:text-[#087E80]"
              >
                Terms & Conditions
              </Link>

              <Link
                to="/contact"
                className="text-xs font-medium text-slate-500 transition hover:text-[#087E80]"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* BACK TO TOP */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        title="Back to top"
        tabIndex={showScrollTop ? 0 : -1}
        className={`fixed bottom-5 right-4 z-40 flex size-11 items-center justify-center rounded-xl bg-[#087E80] text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#06696B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#087E80]/20 sm:bottom-7 sm:right-7 ${
          showScrollTop
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-90 opacity-0"
        }`}
      >
        <ArrowUp size={20} />
      </button>
    </>
  );
}
