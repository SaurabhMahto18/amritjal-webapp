
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Droplets,
  Menu,
  X,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  UserRound,
  Sparkles,
  BookOpen,
  Layers3,
  MessageCircle,
} from "lucide-react";

const navigation = [
  {
    label: "Features",
    href: "/#features",
  },
  {
    label: "Solutions",
    href: "/#who-its-for",
  },
  {
    label: "How It Works",
    href: "/#how-it-works",
  },
  {
    label: "Pricing",
    href: "/#pricing",
  },
  {
    label: "Blogs",
    href: "/blog",
  },
  {
    label: "About",
    href: "/#about",
  },
  {
    label: "Contact",
    href: "/#contact",
  },
];

const compactNavigation = [
  navigation[0],
  navigation[1],
  navigation[2],
  navigation[3],
];

const mobileLinks = [
  ...navigation,
  {
    label: "Tools & Resources",
    href: "/tools",
  },
];

function BrandLogo({ onClick }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label="Amrit Jal homepage"
      className="group flex shrink-0 items-center gap-2.5"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-[#087E80] text-white shadow-[0_4px_12px_rgba(8,126,128,0.16)] transition-transform duration-300 group-hover:scale-105 sm:size-11">
        <Droplets size={25} strokeWidth={2.2} />
      </span>

      <span className="leading-tight">
        <span className="block whitespace-nowrap text-[20px] font-extrabold tracking-tight text-[#24262B] sm:text-[22px]">
          AMRIT <span className="text-[#087E80]">JAL</span>
        </span>

        <span className="mt-0.5 block text-[8px] font-bold tracking-[0.12em] text-[#89928B] sm:text-[9px]">
          WATER BUSINESS MANAGEMENT
        </span>
      </span>
    </Link>
  );
}

function TrialButton({ mobile = false, onClick }) {
  return (
    <Link
      to="/signup"
      onClick={onClick}
      className={`
        group inline-flex shrink-0 items-center justify-center gap-2
        rounded-xl bg-[#087E80] font-bold text-white
        shadow-[0_5px_14px_rgba(8,126,128,0.13)]
        transition-all duration-300
        hover:-translate-y-0.5 hover:bg-[#06696B] hover:shadow-[0_8px_20px_rgba(8,126,128,0.20)]
        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#087E80]/20
        active:scale-[0.98]
        ${
          mobile
            ? "min-h-10 px-3 text-[11px] sm:px-4 sm:text-xs"
            : "min-h-11 px-4 text-xs sm:px-5 sm:text-sm"
        }
      `}
    >
      {mobile ? "Start Free" : "Start Free Trial"}
      <ArrowRight
        size={mobile ? 14 : 16}
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
    </Link>
  );
}

export default function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const location = useLocation();

  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const closeMenu = () => {
    setOpen(false);
    setAccountOpen(false);
  };

  // Close menu when route or hash changes.
  useEffect(() => {
    closeMenu();
  }, [location.pathname, location.hash]);

  // Lock body scroll and handle Escape key.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeMenu();
        buttonRef.current?.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // Close menu when clicking outside.
  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current?.contains(event.target)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E8EAE2] bg-[#FFFFFF]/95 shadow-[0_3px_20px_rgba(36,38,43,0.035)] backdrop-blur-xl">
      {/* Main navigation */}
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-[66px] w-full max-w-[1500px] items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6 lg:px-8 xl:px-10"
      >
        {/* Brand */}
        <BrandLogo onClick={closeMenu} />

        {/* Compact desktop navigation: large tablets and laptops */}
        <div className="hidden items-center gap-0.5 lg:flex 2xl:hidden">
          {compactNavigation.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="whitespace-nowrap rounded-lg px-2.5 py-2.5 text-[11px] font-semibold text-[#626B64] transition-colors hover:bg-[#EDF3EF] hover:text-[#087E80] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E80]/40 xl:px-3 xl:text-xs"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Full desktop navigation */}
        <div className="hidden items-center gap-0.5 2xl:flex">
          {navigation.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2.5 text-[12px] font-semibold text-[#626B64] transition-colors hover:bg-[#EDF3EF] hover:text-[#087E80] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E80]/40"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden shrink-0 items-center gap-2 2xl:flex">
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#E8EAE2] bg-white px-4 text-xs font-bold text-[#3E4942] transition hover:border-[#B9D8CE] hover:bg-[#F5F8F5] hover:text-[#087E80]"
          >
            <UserRound size={16} />
            Login
          </Link>

          <TrialButton />
        </div>

        {/* Tablet and mobile actions */}
        <div className="flex shrink-0 items-center gap-2 2xl:hidden">
          <TrialButton mobile />

          <button
            ref={buttonRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="amrit-jal-mobile-menu"
            className="flex size-10 items-center justify-center rounded-xl border border-[#E8EAE2] bg-white text-[#24262B] transition hover:border-[#C8DDD3] hover:bg-[#F5F8F5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#087E80]/15 sm:size-11"
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </nav>

      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label="Close navigation menu"
        tabIndex={open ? 0 : -1}
        onClick={closeMenu}
        className={`
          fixed inset-0 z-40 bg-[#24262B]/35 backdrop-blur-[2px]
          transition-opacity duration-200 2xl:hidden
          ${open ? "visible opacity-100" : "invisible opacity-0"}
        `}
      />

      {/* Mobile and tablet menu */}
      <div
        ref={menuRef}
        id="amrit-jal-mobile-menu"
        aria-hidden={!open}
        className={`
          absolute left-0 right-0 top-full z-50
          max-h-[calc(100dvh-66px)] overflow-y-auto
          border-t border-[#E8EAE2] bg-white
          px-4 pb-6 pt-4 shadow-[0_20px_40px_rgba(36,38,43,0.12)]
          transition-all duration-200 sm:px-6
          2xl:hidden
          ${
            open
              ? "visible translate-y-0 opacity-100"
              : "invisible pointer-events-none -translate-y-2 opacity-0"
          }
        `}
      >
        <div className="mx-auto max-w-2xl">
          {/* Menu intro */}
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#E1EAE2] bg-[#EDF3EF] p-4 sm:p-5">
            <div>
              <p className="text-sm font-extrabold text-[#24262B]">
                Explore Amrit Jal
              </p>

              <p className="mt-1 text-xs leading-5 text-[#737E76]">
                Everything you need to manage your water business.
              </p>
            </div>

            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#087E80] text-white shadow-sm">
              <Droplets size={23} />
            </span>
          </div>

          {/* Navigation links */}
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#929990]">
              Explore pages
            </p>

            <span className="text-[10px] font-semibold text-[#087E80]">
              08 sections
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {mobileLinks.map((item, index) => (
              <Link
                key={item.label}
                to={item.href}
                tabIndex={open ? 0 : -1}
                onClick={closeMenu}
                className="group flex min-h-[68px] items-center justify-between gap-2 rounded-xl border border-[#EAECE5] bg-white px-3 py-3 transition hover:border-[#B9D8CE] hover:bg-[#F5F8F5] active:scale-[0.98]"
              >
                <span className="min-w-0">
                  <span className="block text-[9px] font-extrabold tracking-wider text-[#A2AAA1]">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="mt-1 block truncate text-[12px] font-bold text-[#3E4942] transition-colors group-hover:text-[#087E80] sm:text-[13px]">
                    {item.label}
                  </span>
                </span>

                <ChevronRight
                  size={15}
                  className="shrink-0 text-[#A4ACA4] transition-transform group-hover:translate-x-1 group-hover:text-[#087E80]"
                />
              </Link>
            ))}
          </div>

          {/* Account access */}
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setAccountOpen((value) => !value)}
              aria-expanded={accountOpen}
              aria-controls="amrit-jal-account-links"
              className="flex min-h-12 w-full items-center justify-between rounded-xl border border-[#E8EAE2] bg-white px-4 text-sm font-bold text-[#3E4942] transition hover:bg-[#F7F8F5]"
            >
              <span className="flex items-center gap-2.5">
                <UserRound size={17} className="text-[#087E80]" />
                Account Access
              </span>

              <ChevronDown
                size={17}
                className={`text-[#858F87] transition-transform duration-200 ${
                  accountOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {accountOpen && (
              <div
                id="amrit-jal-account-links"
                className="mt-2 grid grid-cols-2 gap-2"
              >
                <Link
                  to="/login"
                  tabIndex={open ? 0 : -1}
                  onClick={closeMenu}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#EDF3EF] px-2 text-xs font-bold text-[#3E4942] transition hover:bg-[#E2EEE6]"
                >
                  <LayoutDashboard size={15} className="text-[#087E80]" />
                  Business Login
                </Link>

                <Link
                  to="/customer-login"
                  tabIndex={open ? 0 : -1}
                  onClick={closeMenu}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#EDF3EF] px-2 text-xs font-bold text-[#3E4942] transition hover:bg-[#E2EEE6]"
                >
                  <UserRound size={15} className="text-[#087E80]" />
                  Customer Login
                </Link>
              </div>
            )}
          </div>

          {/* Trial CTA */}
          <Link
            to="/signup"
            tabIndex={open ? 0 : -1}
            onClick={closeMenu}
            className="group mt-5 flex min-h-[54px] items-center justify-center gap-2 rounded-xl bg-[#087E80] px-4 text-sm font-extrabold text-white shadow-[0_6px_18px_rgba(8,126,128,0.16)] transition hover:bg-[#06696B] active:scale-[0.98]"
          >
            <Sparkles size={17} />
            Start Your Free Trial
            <ArrowRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>

          {/* Footer links */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-[#EAECE5] pt-5">
            <Link
              to="/blog"
              onClick={closeMenu}
              tabIndex={open ? 0 : -1}
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#858F87] hover:text-[#087E80]"
            >
              <BookOpen size={13} />
              Resources
            </Link>

            <Link
              to="/tools"
              onClick={closeMenu}
              tabIndex={open ? 0 : -1}
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#858F87] hover:text-[#087E80]"
            >
              <Layers3 size={13} />
              Business Tools
            </Link>

            <Link
              to="/#contact"
              onClick={closeMenu}
              tabIndex={open ? 0 : -1}
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#858F87] hover:text-[#087E80]"
            >
              <MessageCircle size={13} />
              Contact Support
            </Link>
          </div>

          <p className="mt-5 text-center text-[9px] font-semibold tracking-wide text-[#A0A79F]">
            AMRIT JAL · WATER BUSINESS MANAGEMENT
          </p>
        </div>
      </div>
    </header>
  );
}
