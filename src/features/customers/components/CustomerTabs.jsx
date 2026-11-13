
import {
  UserRound,
  Truck,
  CreditCard,
  BookOpen,
  ReceiptText,
  CalendarDays,
  Sun,
  Scale,
} from "lucide-react";

const DEFAULT_TABS = [
  { id: "overview", label: "Details", icon: UserRound },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "invoices", label: "Invoices", icon: ReceiptText },
  { id: "monthly-card", label: "Monthly Card", icon: CalendarDays },
  { id: "deliveries", label: "Delivery", icon: Truck },
  { id: "ledger", label: "Ledger", icon: BookOpen },
  { id: "leaves", label: "Leaves", icon: Sun },
  {
    id: "unbalance-products",
    label: "Unbalance Products",
    icon: Scale,
  },
];

export default function CustomerTabs({
  activeTab = "overview",
  onChange,
  tabs = DEFAULT_TABS,
}) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
      <nav
        aria-label="Customer sections"
        className="flex w-full items-center gap-1 overflow-x-auto"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon || UserRound;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange?.(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={`
                inline-flex min-h-11 shrink-0 items-center
                justify-center gap-2 whitespace-nowrap
                rounded-lg px-4 py-3 text-sm font-medium
                transition-all duration-200
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-teal-600
                focus-visible:ring-offset-2
                ${
                  isActive
                    ? "bg-[#0D172B] text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }
              `}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
