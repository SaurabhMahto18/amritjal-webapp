
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Droplets,
  Menu,
  X,
  Download,
  MessageCircle,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";

const navigation = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Customers", href: "#customers" },
  { label: "FAQ", href: "#faq" },
  { label: "Blog", href: "/blog" },
  { label: "Tools", href: "/tools" },
];

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
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

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5EFEE] bg-white/95 shadow-[0_4px_24px_rgba(16,31,53,0.055)] backdrop-blur-xl">

      {/* MAIN NAVBAR */}
      <nav
        aria-label="Main navigation"
        className="
          relative z-20 mx-auto grid h-[68px] w-full max-w-[1600px]
          grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4
          sm:h-[74px] sm:px-6 lg:px-8
          min-[1280px]:h-[82px]
          min-[1280px]:grid-cols-[auto_minmax(0,1fr)_auto]
          min-[1280px]:gap-3 min-[1280px]:px-6
          min-[1440px]:gap-5 min-[1440px]:px-8
        "
      >

        {/* BRAND */}
        <Link
          to="/"
          onClick={closeMenu}
          aria-label="Amrit Jal home"
          className="flex min-w-0 items-center gap-2.5 justify-self-start"
        >
          <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#087E85] text-white shadow-lg shadow-[#087E85]/20 sm:size-11 min-[1280px]:size-12">
            <Droplets size={26} strokeWidth={2.2} />
            <span className="absolute -bottom-3 -right-3 size-9 rounded-full bg-[#63D6D2]/40" />
          </span>

          <span className="min-w-0 leading-tight">
            <span className="block whitespace-nowrap text-[20px] font-black tracking-tight text-[#101F35] sm:text-[22px]">
              Amrit <span className="text-[#087E85]">Jal</span>
            </span>

            <span className="mt-1 hidden whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.13em] text-[#8493A2] min-[360px]:block sm:text-[10px]">
              Business Management
            </span>
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden min-w-0 items-center justify-center gap-0 min-[1280px]:flex">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="
                whitespace-nowrap rounded-lg px-2.5 py-3
                text-[14px] font-bold text-[#47576A]
                transition-colors duration-200
                hover:bg-[#EAF7F5] hover:text-[#087E85]
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[#087E85]/40
                min-[1440px]:px-2 min-[1440px]:text-[12px]
                min-[1600px]:px-2.5
              "
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* DESKTOP ACTIONS */}
        <div className="hidden shrink-0 items-center justify-self-end gap-1.5 min-[1280px]:flex min-[1440px]:gap-2">

          <Link
            to="/signup"
            className="
              inline-flex h-10 items-center justify-center gap-1
              whitespace-nowrap rounded-full bg-[#EAF5F7]
              px-2.5 text-[13px] font-extrabold text-[#1877A5]
              transition hover:-translate-y-0.5 hover:bg-[#D9EFF3]
              min-[1440px]:px-3 min-[1440px]:text-xs
            "
          >
            <Download size={15} />
            Get App
          </Link>

          <Link
            to="/customer-login"
            className="
              inline-flex h-10 items-center justify-center
              whitespace-nowrap rounded-full border border-[#DCE5E8]
              bg-white px-2.5 text-[13px] font-bold text-[#34465A]
              transition hover:border-[#087E85]
              hover:bg-[#F0F8F7] hover:text-[#087E85]
              min-[1440px]:px-3 min-[1440px]:text-xs
            "
          >
            Customer Login
          </Link>

          <Link
            to="/login"
            className="
              inline-flex h-10 items-center justify-center
              whitespace-nowrap rounded-full bg-[#101F35]
              px-2.5 text-[13px] font-bold text-white
              transition hover:bg-[#263C56]
              min-[1440px]:px-3 min-[1440px]:text-xs
            "
          >
            Business Login
          </Link>

          <a
            href="#contact"
            className="
              inline-flex h-10 items-center justify-center gap-1
              whitespace-nowrap rounded-full bg-[#F2A93B]
              px-2.5 text-[13px] font-extrabold text-[#172337]
              transition hover:-translate-y-0.5 hover:bg-[#E99A20]
              min-[1440px]:px-3 min-[1440px]:text-xs
            "
          >
            <MessageCircle size={15} />
            Book Demo
            <ArrowRight size={14} />
          </a>
        </div>

        {/* MOBILE / TABLET ACTIONS */}
        <div className="col-start-2 row-start-1 flex items-center justify-self-end gap-2 min-[1280px]:hidden">

          {/* BUSINESS LOGIN OUTSIDE HAMBURGER */}
          <Link
            to="/login"
            className="
              inline-flex h-10 items-center justify-center
              whitespace-nowrap rounded-full bg-[#101F35]
              px-3 text-[11px] font-bold text-white
              transition hover:bg-[#263C56]
              sm:h-11 sm:px-4 sm:text-[13px]
            "
          >
            Business Login
          </Link>

          {/* HAMBURGER BUTTON */}
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="amrit-jal-mobile-menu"
            className="
              flex size-11 shrink-0 items-center justify-center
              rounded-xl border border-[#DFEBE9]
              bg-[#F0F8F7] text-[#26374B]
              transition-all duration-200
              hover:border-[#087E85]/30 hover:bg-[#DFF3F0]
              hover:text-[#087E85] active:scale-95
              focus-visible:outline-none
              focus-visible:ring-4 focus-visible:ring-[#087E85]/15
              sm:size-12
            "
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* MOBILE / TABLET BACKDROP */}
      <button
        type="button"
        aria-label="Close navigation menu"
        tabIndex={open ? 0 : -1}
        onClick={closeMenu}
        className={`
          fixed inset-0 z-10 bg-[#101F35]/30
          backdrop-blur-[2px] transition-opacity duration-300
          min-[1280px]:hidden
          ${open ? "visible opacity-100" : "invisible opacity-0"}
        `}
      />

      {/* MOBILE / TABLET DROPDOWN */}
      <div
        ref={menuRef}
        id="amrit-jal-mobile-menu"
        aria-hidden={!open}
        className={`
          absolute left-0 right-0 top-full z-30
          max-h-[calc(100dvh-68px)] overflow-y-auto
          border-t border-[#E5EFEE] bg-white
          px-4 pb-6 pt-4 shadow-[0_20px_50px_rgba(16,31,53,0.12)]
          transition-all duration-300 ease-out
          sm:px-6
          min-[1280px]:hidden
          ${
            open
              ? "visible translate-y-0 opacity-100"
              : "invisible pointer-events-none -translate-y-3 opacity-0"
          }
        `}
      >
        <div className="mx-auto max-w-2xl">

          {/* MENU INTRO */}
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#DDEEEB] bg-[#F0F8F7] p-4">
            <div>
              <p className="text-base font-extrabold text-[#101F35]">
                Explore Amrit Jal
              </p>
              <p className="mt-1 text-xs text-[#718394]">
                Everything for your water business
              </p>
            </div>

            <span className="flex size-12 items-center justify-center rounded-xl bg-[#087E85] text-white">
              <Droplets size={25} />
            </span>
          </div>

          {/* NAVIGATION LINKS */}
          <p className="mb-3 px-1 text-[11px] font-extrabold uppercase tracking-widest text-[#8493A2]">
            Navigation
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {navigation.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                tabIndex={open ? 0 : -1}
                onClick={closeMenu}
                className="
                  group flex min-h-[66px] items-center
                  justify-between gap-2 rounded-xl
                  border border-[#E6EEEE] bg-white
                  px-3.5 py-3 transition-all duration-200
                  hover:border-[#B9E5E2] hover:bg-[#F0F8F7]
                  active:scale-[0.98]
                "
              >
                <span className="min-w-0">
                  <span className="block text-[12px] font-bold text-[#9AA9B5]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-1 block truncate text-[15px] font-bold text-[#34465A] group-hover:text-[#087E85] sm:text-sm">
                    {item.label}
                  </span>
                </span>

                <ChevronRight
                  size={17}
                  className="
                    shrink-0 text-[#A3B0BC]
                    transition-transform group-hover:translate-x-1
                    group-hover:text-[#087E85]
                  "
                />
              </a>
            ))}
          </div>

          {/* APPLICATION */}
          <div className="mt-5">
            <p className="mb-3 px-1 text-[12px] font-extrabold uppercase tracking-widest text-[#8493A2]">
              Application
            </p>

            <Link
              to="/signup"
              onClick={closeMenu}
              tabIndex={open ? 0 : -1}
              className="
                flex min-h-[52px] items-center justify-center gap-2
                rounded-xl bg-[#EAF5F7] text-md font-extrabold
                text-[#1877A5] transition hover:bg-[#D9EFF3]
              "
            >
              <Download size={18} />
              Get App
              <ArrowUpRight size={17} />
            </Link>
          </div>

          {/* ACCOUNT ACCESS */}
          <div className="mt-5">
            <p className="mb-3 px-1 text-[12px] font-extrabold uppercase tracking-widest text-[#8493A2]">
              Account Access
            </p>

            <Link
              to="/customer-login"
              onClick={closeMenu}
              tabIndex={open ? 0 : -1}
              className="
                flex min-h-[52px] w-full items-center justify-center
                rounded-xl border border-[#DCE5E8] px-2
                text-md font-extrabold text-[#34465A]
                transition hover:border-[#087E85]
                hover:text-[#087E85]
              "
            >
              Customer Login
            </Link>
          </div>

          {/* DEMO CTA */}
          <a
            href="#contact"
            onClick={closeMenu}
            tabIndex={open ? 0 : -1}
            className="
              mt-3 flex min-h-[54px] items-center justify-center
              gap-2 rounded-xl bg-[#F2A93B]
              text-md font-extrabold text-[#172337]
              transition hover:bg-[#E99A20] active:scale-[0.98]
            "
          >
            <MessageCircle size={18} />
            Book Free Demo
            <ArrowRight size={17} />
          </a>

          <p className="mt-5 text-center text-[11px] font-medium text-[#94A1AD]">
            Amrit Jal · Business Management
          </p>
        </div>
      </div>
    </header>
  );
}
