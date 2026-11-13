
import { NavLink } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

import {
  getActiveBusinessId,
  getUnreadAnnouncementCount,
} from "../../features/announcements/services/businessAnnouncementService";

import {
  BarChart3,
  BookOpen,
  Box,
  Package,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Droplets,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Receipt,
  Truck,
  UserRound,
  UserRoundCog,
  Users,
  Wallet,
  X,
  Settings,
  Route,
  MessageCircle,
  Megaphone,
} from "lucide-react";

// ========================================
// NAVIGATION CONFIGURATION
// ========================================

const navigationGroups = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },

  {
    title: "Customer Management",
    items: [
      {
        label: "Customers",
        path: "/customers",
        icon: UserRound,
      },
      {
        label: "Customer Groups",
        path: "/groups",
        icon: Users,
      },
    ],
  },

  {
    title: "Operations",
    items: [
      {
        label: "Jar Management",
        path: "/jars",
        icon: Package,
      },
      {
        label: "Products",
        path: "/products",
        icon: Box,
      },
      {
        label: "Deliveries",
        path: "/deliveries",
        icon: Truck,
        end: true,
      },
      {
        label: "Bulk Delivery",
        path: "/deliveries/bulk",
        icon: ClipboardList,
        end: true,
      },
      {
        label: "Routes",
        path: "/routes",
        icon: Route,
      },
      {
        label: "Events",
        path: "/events",
        icon: CalendarDays,
      },
    ],
  },

  {
    title: "Finance & Billing",
    items: [
      {
        label: "Ledger",
        path: "/ledger",
        icon: BookOpen,
      },
      {
        label: "Customer Payments",
        path: "/payments",
        icon: CreditCard,
      },
      {
        label: "Employee Payments",
        path: "/employee-payments",
        icon: Wallet,
      },
      {
        label: "Invoices",
        path: "/invoices",
        icon: FileText,
      },
      {
        label: "Expenses",
        path: "/expenses",
        icon: Receipt,
      },
      {
        label: "Wallet Transactions",
        path: "/wallet-transactions",
        icon: Wallet,
      },
      {
        label: "Monthly Card",
        path: "/monthly-card",
        icon: FileSpreadsheet,
      },
      {
        label: "Subscription",
        path: "/subscription",
        icon: CreditCard,
      },
      
    ],
  },

  {
    title: "Team Management",
    items: [
      {
        label: "Employees",
        path: "/employees",
        icon: UserRoundCog,
      },
    ],
  },

  {
    title: "Reports & Analytics",
    items: [
      {
        label: "Reports",
        path: "/reports",
        icon: BarChart3,
        end: true,
      },
      {
        label: "Bulk Report",
        path: "/reports/bulk",
        icon: ClipboardList,
        end: true,
      },
    ],
  },

  {
    title: "Communication",
    items: [
      {
        label: "SMS Center",
        path: "/sms",
        icon: MessageSquare,
      },
      {
        label: "WhatsApp Center",
        path: "/whatsapp",
        icon: MessageCircle,
      },
      {
        label: "Announcement Centre",
        path: "/announcements",
        icon: Megaphone,
      },
    ],
  },

  {
    title: "Settings",
    items: [
      {
        label: "My Shop",
        path: "/settings",
        icon: Settings,
        end: true,
      },
    ],
  },
];

// ========================================
// SIDEBAR COMPONENT
// ========================================

function Sidebar({ onNavigate, onLogout }) {
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  // LOAD UNREAD ANNOUNCEMENT COUNT
  const loadUnreadCount = useCallback(async () => {
    try {
      const businessId = await getActiveBusinessId();

      const count = await getUnreadAnnouncementCount(businessId);

      setUnreadAnnouncements(count);
    } catch (error) {
      console.error(
        "Unable to load announcement count:",
        error
      );
    }
  }, []);

  // INITIAL LOAD + ANNOUNCEMENT UPDATE LISTENER
  useEffect(() => {
    loadUnreadCount();

    const handleAnnouncementUpdate = () => {
      loadUnreadCount();
    };

    window.addEventListener(
      "amrit-jal-announcements-updated",
      handleAnnouncementUpdate
    );

    return () => {
      window.removeEventListener(
        "amrit-jal-announcements-updated",
        handleAnnouncementUpdate
      );
    };
  }, [loadUnreadCount]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#08172B] text-slate-200">

      {/* BRAND HEADER */}
      <div className="flex h-[78px] shrink-0 items-center gap-3 border-b border-white/[0.08] px-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F8F7] text-[#00858B] shadow-sm">
          <Droplets size={27} strokeWidth={2.1} />
        </div>

        <div className="min-w-0">
          <h1 className="text-lg font-extrabold tracking-tight text-white">
            Amrit Jal
          </h1>

          <p className="mt-0.5 text-xs font-medium tracking-wide text-slate-400">
            Business Console
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigate}
          aria-label="Close navigation"
          className="ml-auto rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X size={21} />
        </button>
      </div>

      {/* NAVIGATION GROUPS */}
      <nav
        aria-label="Main navigation"
        className="sidebar-scroll min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-3.5 py-5"
      >
        {navigationGroups.map((group) => (
          <section key={group.title}>
            <h2 className="mb-2.5 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#38BFC3]">
              {group.title}
            </h2>

            <div className="space-y-1">
              {group.items.map(({ label, path, icon: Icon, end }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={Boolean(end)}
                  onClick={onNavigate}
                  title={label}
                  className={({ isActive }) =>
                    `group relative flex min-h-[43px] items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[#0D5263] text-white shadow-sm ring-1 ring-[#168C96]/30"
                        : "text-slate-300 hover:bg-white/[0.055] hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#3AD1D0]" />
                      )}

                      {/* NAVIGATION ICON */}
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-all ${
                          isActive
                            ? "bg-[#147C87]/40 text-[#75E4DF]"
                            : "text-[#91B3C1] group-hover:bg-white/[0.07] group-hover:text-[#67DBD6]"
                        }`}
                      >
                        <Icon size={18} strokeWidth={1.9} />
                      </span>

                      {/* NAVIGATION LABEL */}
                      <span className="min-w-0 flex-1 truncate">
                        {label}
                      </span>

                      {/* UNREAD ANNOUNCEMENT BADGE */}
                      {path === "/announcements" &&
                        unreadAnnouncements > 0 && (
                          <span
                            className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-extrabold text-white shadow-sm"
                            aria-label={`${unreadAnnouncements} unread announcements`}
                          >
                            {unreadAnnouncements > 99
                              ? "99+"
                              : unreadAnnouncements}
                          </span>
                        )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </nav>

      {/* SIDEBAR FOOTER */}
      <div className="shrink-0 border-t border-white/[0.08] bg-[#071426] p-3.5">
        <button
          type="button"
          onClick={onLogout}
          className="group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-300 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <span className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition group-hover:bg-rose-500/10 group-hover:text-rose-300">
            <LogOut size={19} />
          </span>

          <span>Logout</span>
        </button>

        <p className="mt-3 px-3 text-[10px] font-medium tracking-wide text-slate-600">
          AMRIT JAL BUSINESS CONSOLE
        </p>
      </div>

      {/* CUSTOM SCROLLBAR */}
      <style>{`
        .sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: #33465f transparent;
        }

        .sidebar-scroll::-webkit-scrollbar {
          width: 5px;
        }

        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #33465f;
          border-radius: 20px;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #4b647e;
        }
      `}</style>
    </div>
  );
}

export default Sidebar;
