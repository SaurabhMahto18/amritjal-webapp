
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

import {
  LayoutDashboard,
  Building2,
  Gem,
  Settings,
  CreditCard,
  Package,
  RefreshCw,
  Headset,
  History,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Users,
  SlidersHorizontal,
  Megaphone,
} from "lucide-react";

// ======================================
// ADMIN SIDEBAR NAVIGATION
// ======================================

const navigation = [
  {
    label: "Overview",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Businesses",
    path: "/admin/businesses",
    icon: Building2,
  },
  {
    label: "Subscriptions",
    path: "/admin/subscriptions",
    icon: Gem,
  },

  {
    label: "Revenue & Payments",
    path: "/admin/revenue",
    icon: CreditCard,
  },
  {
    label: "Plans",
    path: "/admin/plans",
    icon: Package,
  },
  {
    label: "Renewals",
    path: "/admin/renewals",
    icon: RefreshCw,
  },
  {
    label: "Support Tickets",
    path: "/admin/support-tickets",
    icon: Headset,
  },
  {
    label: "Activity Logs",
    path: "/admin/activity-logs",
    icon: History,
  },
  {
    label: "Admin Users",
    path: "/admin/users",
    icon: Users,
  },
  {
    label: "Platform Configuration",
    path: "/admin/configuration",
    icon: SlidersHorizontal,
  },
  {
  label: "Announcement Centre",
  path: "/admin/announcements",
  icon: Megaphone,
},
  {
    label: "Settings",
    path: "/admin/settings",
    icon: Settings,
  },
];

// ======================================
// ADMIN LAYOUT
// ======================================

export default function AdminLayout() {
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ======================================
  // ADMIN SEO PROTECTION
  // ======================================

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Admin Dashboard | Amrit Jal";

    let robotsMeta = document.querySelector(
      'meta[name="robots"]'
    );

    const existingRobotsMeta = Boolean(robotsMeta);

    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }

    const previousRobotsContent =
      robotsMeta.getAttribute("content");

    robotsMeta.setAttribute(
      "content",
      "noindex, nofollow, noarchive, nosnippet"
    );

    return () => {
      document.title = previousTitle;

      if (existingRobotsMeta) {
        if (previousRobotsContent !== null) {
          robotsMeta.setAttribute(
            "content",
            previousRobotsContent
          );
        } else {
          robotsMeta.removeAttribute("content");
        }
      } else {
        robotsMeta.remove();
      }
    };
  }, []);

  // ======================================
  // LOGOUT
  // ======================================

  async function handleLogout() {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      navigate("/admin/login", { replace: true });
    } catch (error) {
      console.error("Admin logout failed:", error);
      setLoggingOut(false);
    }
  }

  // ======================================
  // SIDEBAR LINK STYLE
  // ======================================

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isActive
      ? "bg-cyan-700 text-white shadow-sm"
      : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      {/* MOBILE OVERLAY */}

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#0B192B] transition-transform duration-200 ${mobileMenuOpen
          ? "translate-x-0"
          : "-translate-x-full"
          } lg:translate-x-0`}
      >

        {/* BRAND */}

        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-xl font-black text-white">
                A
              </div>

              <div>
                <h1 className="text-lg font-bold text-white">
                  Amrit Jal
                </h1>

                <p className="text-xs font-medium text-cyan-300">
                  Platform Admin
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>

          </div>
        </div>

        {/* NAVIGATION */}

        <div className="flex-1 overflow-y-auto px-4 pt-7 pb-4">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Management
          </p>

          <nav
            aria-label="Admin navigation"
            className="space-y-1"
          >
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  onClick={() => setMobileMenuOpen(false)}
                  className={linkClass}
                >
                  <Icon
                    size={20}
                    strokeWidth={2}
                    className="shrink-0"
                  />

                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

        </div>

        {/* SIDEBAR FOOTER */}

        <div className="border-t border-white/10 p-4">

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut size={19} />

            {loggingOut
              ? "Signing out..."
              : "Logout"}
          </button>

          <div className="mt-4 flex items-center gap-2 px-3">
            <ShieldCheck
              size={13}
              className="text-emerald-500"
            />

            <p className="text-[10px] text-slate-500">
              Amrit Jal Platform · Admin
            </p>
          </div>

        </div>

      </aside>

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <div className="min-h-screen lg:pl-64">

        {/* HEADER */}

        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            {/* MOBILE MENU BUTTON */}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            {/* HEADER TITLE */}

            <div>
              <p className="text-sm font-bold text-slate-900">
                Administration
              </p>

              <p className="hidden text-xs text-slate-500 sm:block">
                Manage your Amrit Jal platform
              </p>
            </div>

          </div>

          {/* SECURITY STATUS */}

          <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5">

            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <span className="text-xs font-semibold text-emerald-700">
              Secure Admin
            </span>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
}
