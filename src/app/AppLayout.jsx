
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Droplets,
  Menu,
  ChevronDown,
  UserRound,
  LogOut,
  LoaderCircle,
} from "lucide-react";

import Sidebar from "../components/layout/Sidebar";

import { useAuth } from "../features/auth/hooks/useAuth";
import { getAgencyProfile } from "../features/settings/services/settingsService";

import { employeeService } from "../features/employees/services/employeeService";
import { customerService } from "../features/customers/services/customerService";
import groupService from "../features/groups/services/groupService";
import productService from "../features/products/services/productService";

import { supabase } from "../lib/supabase/client";

// STATIC PAGE TITLES
const PAGE_TITLES = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/customers": "Customers",
  "/deliveries": "Deliveries",
  "/products": "Products",
  "/payments": "Payments",
  "/expenses": "Expenses",
  "/invoices": "Invoices",
  "/ledger": "Customer Ledger",
  "/employees": "Employees",
  "/groups": "Customer Groups",
  "/reports": "Reports",
  "/routes": "Delivery Routes",
  "/events": "Events",
  "/settings": "Settings",
  "/jars": "Jar Management",
  "/wallet": "Wallet Transactions",
  "/wallet-transactions": "Wallet Transactions",
  "/sms-settings": "SMS Settings",
  "/whatsapp": "WhatsApp Center",
};

// IDENTIFIER CHECK
function isRecordIdentifier(value) {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ||
    /^\d{6,}$/.test(value)
  );
}

// STATIC PAGE TITLE
function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }

  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] || "Dashboard";

  if (["new", "create"].includes(lastSegment)) {
    return `${
      PAGE_TITLES[`/${segments[0]}`] || segments[0]
    } - Create`;
  }

  if (lastSegment === "edit") {
    return "Edit";
  }

  // Never expose a raw UUID as a page title.
  if (isRecordIdentifier(lastSegment)) {
    return "Record Details";
  }

  return lastSegment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// IDENTIFY DETAIL ROUTES
function getDetailRoute(pathname) {
  // CUSTOMER DETAIL + EDIT
  const customerMatch = pathname.match(
    /^\/customers\/([^/]+)(?:\/edit)?\/?$/
  );

  if (
    customerMatch &&
    !["new", "import"].includes(customerMatch[1])
  ) {
    return {
      type: "customer",
      id: customerMatch[1],
      fallback: "Customer Profile",
    };
  }

  // EMPLOYEE DETAIL + EDIT + WALLET
  const employeeMatch = pathname.match(
    /^\/employees\/([^/]+)(?:\/(edit|wallet))?\/?$/
  );

  if (
    employeeMatch &&
    employeeMatch[1] !== "new"
  ) {
    return {
      type: "employee",
      id: employeeMatch[1],
      fallback: "Employee Profile",
    };
  }

  // CUSTOMER GROUP DETAIL
  const groupMatch = pathname.match(
    /^\/groups\/([^/]+)\/?$/
  );

  if (
    groupMatch &&
    groupMatch[1] !== "new"
  ) {
    return {
      type: "group",
      id: groupMatch[1],
      fallback: "Group Details",
    };
  }

  // PRODUCT DETAIL
  const productMatch = pathname.match(
    /^\/products\/([^/]+)\/?$/
  );

  if (
    productMatch &&
    productMatch[1] !== "new"
  ) {
    return {
      type: "product",
      id: productMatch[1],
      fallback: "Product Details",
    };
  }

  // INVOICE DETAIL + PRINT PAGES
  const invoiceMatch = pathname.match(
    /^\/invoices\/([^/]+)(?:\/(print(?:\/(?:summary|thermal|report|standard))?))?\/?$/
  );

  if (
    invoiceMatch &&
    invoiceMatch[1] !== "new"
  ) {
    return {
      type: "invoice",
      id: invoiceMatch[1],
      fallback: "Invoice Details",
    };
  }

  return null;
}

// USER NAME
function getUserName(user) {
  const metadata = user?.user_metadata || {};

  return (
    metadata.full_name ||
    metadata.fullName ||
    metadata.name ||
    user?.email?.split("@")[0] ||
    "User"
  );
}

// USER ROLE
function getUserRole(user) {
  const metadata = user?.user_metadata || {};
  const appMetadata = user?.app_metadata || {};

  const role = appMetadata.role || metadata.role;

  if (role) {
    return String(role)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  return "Agency Owner";
}

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [businessProfile, setBusinessProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [recordHeader, setRecordHeader] = useState({
    key: "",
    title: "",
  });

  const profileMenuRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { user, signOut } = useAuth();

  // CURRENT DETAIL ROUTE
  const detailRoute = useMemo(
    () => getDetailRoute(location.pathname),
    [location.pathname]
  );

  const recordKey = detailRoute
    ? `${detailRoute.type}:${detailRoute.id}`
    : "";

  // SHARED HEADER TITLE
  const pageTitle = useMemo(() => {
    if (!detailRoute) {
      return getPageTitle(location.pathname);
    }

    if (
      recordHeader.key === recordKey &&
      recordHeader.title
    ) {
      return recordHeader.title;
    }

    // Human-readable fallback while data loads.
    return detailRoute.fallback;
  }, [
    location.pathname,
    detailRoute,
    recordHeader,
    recordKey,
  ]);

  const userName = getUserName(user);
  const userRole = getUserRole(user);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // BUSINESS PROFILE
  useEffect(() => {
    let active = true;

    async function loadBusiness() {
      try {
        const result = await getAgencyProfile();

        if (!active) return;

        setBusinessProfile({
          name: result?.business?.name || "",
          type:
            result?.business?.business_type ||
            result?.business?.business_category ||
            "R.O. Mineral Water Supplier",
          logo: result?.settings?.business_logo_url || "",
        });
      } catch (error) {
        console.error(
          "Unable to load business profile:",
          error
        );

        if (active) {
          setBusinessProfile(null);
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }

    loadBusiness();

    const handleBusinessUpdate = () => {
      loadBusiness();
    };

    window.addEventListener(
      "amrit-jal-business-updated",
      handleBusinessUpdate
    );

    return () => {
      active = false;

      window.removeEventListener(
        "amrit-jal-business-updated",
        handleBusinessUpdate
      );
    };
  }, []);

  // LOAD ACTUAL RECORD NAME FOR SHARED HEADER
  useEffect(() => {
    let active = true;

    setRecordHeader({
      key: recordKey,
      title: "",
    });

    if (!detailRoute) return undefined;

    async function loadRecordName() {
      try {
        let record = null;
        let resolvedTitle = "";

        switch (detailRoute.type) {
          case "customer": {
            record = await customerService.getById(
              detailRoute.id
            );
            break;
          }

          case "employee": {
            record = await employeeService.get(
              detailRoute.id
            );
            break;
          }

          case "group": {
            record = await groupService.getById(
              detailRoute.id
            );
            break;
          }

          case "product": {
            record = await productService.getById(
              detailRoute.id
            );
            break;
          }

          case "invoice": {
            // RLS restricts invoice visibility to the
            // authenticated business.
            const { data, error } = await supabase
              .from("invoices")
              .select("invoice_number")
              .eq("id", detailRoute.id)
              .maybeSingle();

            if (error) throw error;

            const invoiceNumber = data?.invoice_number;

            resolvedTitle = invoiceNumber
              ? `Invoice ${invoiceNumber}`
              : "";

            break;
          }

          default:
            break;
        }

        if (!active) return;

        const recordName =
          record?.name ||
          record?.customerName ||
          record?.employeeName ||
          record?.productName ||
          record?.title ||
          "";

        const title =
          resolvedTitle ||
          String(recordName).trim() ||
          detailRoute.fallback;

        setRecordHeader({
          key: recordKey,
          title,
        });
      } catch (error) {
        console.error(
          `Unable to load ${detailRoute.type} header name:`,
          error
        );

        if (active) {
          setRecordHeader({
            key: recordKey,
            title: detailRoute.fallback,
          });
        }
      }
    }

    loadRecordName();

    return () => {
      active = false;
    };
  }, [detailRoute, recordKey]);

  // CLOSE MENUS ON NAVIGATION
  useEffect(() => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // OUTSIDE CLICK AND ESCAPE
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // LOGOUT
  const handleLogout = async () => {
    try {
      if (typeof signOut !== "function") {
        throw new Error("Logout function is unavailable.");
      }

      await signOut();

      setProfileMenuOpen(false);
      setMobileMenuOpen(false);

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // PROFILE
  const handleProfile = () => {
    setProfileMenuOpen(false);
    navigate("/settings");
  };

  const agencyName =
    businessProfile?.name || "Amrit Jal Agency";

  // PROFILE MENU
  const profileButton = (
    <div className="relative" ref={profileMenuRef}>
      <button
        type="button"
        onClick={() =>
          setProfileMenuOpen((open) => !open)
        }
        aria-label="Open profile menu"
        aria-expanded={profileMenuOpen}
        className="flex max-w-full items-center gap-2 rounded-full bg-slate-100 py-1.5 pl-1.5 pr-3 transition hover:bg-slate-200"
      >
        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
          {businessProfile?.logo ? (
            <img
              src={businessProfile.logo}
              alt={`${agencyName} logo`}
              className="size-full object-contain"
            />
          ) : (
            <Droplets
              size={23}
              className="text-cyan-700"
            />
          )}
        </div>

        <div className="min-w-0 text-left">
          <p className="max-w-36 truncate text-sm font-semibold text-slate-900">
            {userName}
          </p>

          <p className="max-w-36 truncate text-xs text-slate-500">
            {userRole}
          </p>
        </div>

        <ChevronDown
          size={18}
          className={`ml-1 shrink-0 text-slate-400 transition ${
            profileMenuOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {profileMenuOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
          <button
            type="button"
            onClick={handleProfile}
            className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <UserRound size={19} />
            My Profile
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      )}
    </div>
  );

  // TEMPORARY: Detect actual browser reload vs component remount
useEffect(() => {
  console.log("APP LAYOUT MOUNTED");

  const navigationEntry =
    performance.getEntriesByType("navigation")[0];

  console.log("Navigation type:", navigationEntry?.type);

  const handlePageShow = (event) => {
    console.log("PAGESHOW:", {
      persisted: event.persisted,
      time: new Date().toISOString(),
    });
  };

  const handleVisibility = () => {
    console.log("TAB VISIBILITY:", document.visibilityState);
  };

  window.addEventListener("pageshow", handlePageShow);
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    console.log("APP LAYOUT UNMOUNTED");

    window.removeEventListener("pageshow", handlePageShow);
    document.removeEventListener(
      "visibilitychange",
      handleVisibility
    );
  };
}, []);

  return (
    <div className="min-h-screen bg-[#EEF2F6] lg:flex">

      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-dvh w-64 overflow-hidden border-r border-slate-800/60 print:hidden lg:block">
        <Sidebar
          onNavigate={closeMobileMenu}
          onLogout={handleLogout}
        />
      </aside>

      {/* MAIN APPLICATION */}
      <div className="min-w-0 flex-1 lg:ml-64">

        {/* SHARED HEADER */}
        <header className="sticky top-0 z-30 flex min-h-[80px] items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 shadow-sm print:hidden sm:px-7 lg:px-10">

          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileMenuOpen}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">
                {pageTitle}
              </h1>

              <p className="max-w-[55vw] truncate text-xs text-slate-400 sm:text-sm">
                {agencyName}
              </p>
            </div>
          </div>

          {profileLoading ? (
            <div className="flex size-10 items-center justify-center">
              <LoaderCircle
                size={20}
                className="animate-spin text-cyan-700"
              />
            </div>
          ) : (
            profileButton
          )}
        </header>

        {/* PAGE CONTENT */}
        <main className="min-h-[calc(100vh-80px)]">
          <Outlet />
        </main>
      </div>

      {/* MOBILE NAVIGATION */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 print:hidden lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={closeMobileMenu}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          <aside className="absolute inset-y-0 left-0 h-dvh w-72 max-w-[85vw] overflow-hidden shadow-2xl">
            <Sidebar
              onNavigate={closeMobileMenu}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
