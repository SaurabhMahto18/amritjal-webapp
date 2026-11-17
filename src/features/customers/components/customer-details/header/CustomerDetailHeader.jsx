
import {
  CalendarDays,
  CreditCard,
  LayoutList,
  Pencil,
  ReceiptText,
  Scale,
  Sun,
  Truck,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

const TABS = [
  { id: "overview", label: "Details", icon: UserRound },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "invoices", label: "Invoices", icon: ReceiptText },
  { id: "monthly-card", label: "Monthly Card", icon: CalendarDays },
  { id: "deliveries", label: "Delivery", icon: Truck },
  { id: "ledger", label: "Ledger", icon: LayoutList },
  { id: "leaves", label: "Leaves", icon: Sun },
  { id: "unbalance-products", label: "Unbalance products", icon: Scale },
];

function Metric({ label, value, tone = "slate" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    red: "bg-rose-50 text-rose-600",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
      <span className="text-sm text-slate-600">{label}</span>
      <span
        className={`min-w-10 rounded-full px-3 py-1.5 text-center text-xs font-semibold tabular-nums ${tones[tone]}`}
      >
        {value ?? 0}
      </span>
    </div>
  );
}

export default function CustomerDetailHeader({
  customer,
  activeTab = "overview",
  onTabChange,
  balanceJars = 0,
  dueAmount = 0,
  pastDue = 0,
  currentDue = 0,
}) {
  if (!customer) return null;

  const customerType =
    customer.customerType ||
    customer.customer_type ||
    customer.groupName ||
    customer.group?.name ||
    customer.group ||
    "Customer";

  const editPath = `/customers/${customer.id}/edit`;

  return (
    <div className="w-full space-y-4">
      {/* Customer summary card */}

      {/* Compact account summary */}
      <section
        aria-label="Customer account summary"
        className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5"
      >
        <div className="mb-2.5 flex items-center justify-between sm:hidden">
          <p className="text-xs font-semibold text-slate-700">Account Summary</p>
          <Link
            to={editPath}
            title="Edit customer"
            aria-label="Edit customer"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <Pencil size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-5">
          <Metric label="Balance Jar" value={balanceJars} tone="blue" />
          <Metric label="Due Amount" value={dueAmount} tone="red" />
          <Metric label="Past Due" value={pastDue} />
          <Metric label="Current Due" value={currentDue} />

          <Link
            to={editPath}
            title="Edit customer"
            aria-label="Edit customer"
            className="hidden size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:flex"
          >
            <Pencil size={17} />
          </Link>
        </div>
      </section>


      {/* Horizontal customer navigation */}
      <nav
        aria-label="Customer sections"
        className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
      >
        <div className="flex min-w-max items-center gap-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const selected = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange?.(id)}
                aria-current={selected ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors ${selected
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
