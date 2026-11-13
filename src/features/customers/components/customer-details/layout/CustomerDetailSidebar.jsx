
import {
  UserRound,
  Package,
  Wallet,
  Truck,
  CreditCard,
  ReceiptText,
  MessageSquare,
  ShieldCheck,
  Droplets,
  QrCode,
  UserPlus,
  ChevronRight,
} from "lucide-react";

const MENU_ITEMS = [
  {
    id: "Profile",
    label: "Customer Profile",
    description: "Update customer basic details",
    icon: UserRound,
  },
  {
    id: "Products",
    label: "Customer Product",
    description: "Manage assigned products and rates",
    icon: Package,
  },
  {
    id: "Opening Amount",
    label: "Opening Amount",
    description: "Initial customer account balance",
    icon: Wallet,
  },
  {
    id: "Opening Delivery",
    label: "Opening Delivery",
    description: "Previous delivery records",
    icon: Truck,
  },
  {
    id: "Security Deposit",
    label: "Security Deposit",
    description: "Manage refundable deposit",
    icon: CreditCard,
  },
  {
    id: "Invoice Preference",
    label: "Customer Invoice Preference",
    description: "Configure invoice preferences",
    icon: ReceiptText,
  },
  {
    id: "Message Settings",
    label: "Message Settings",
    description: "Customer message preferences",
    icon: MessageSquare,
  },
  {
    id: "Warn / Block",
    label: "Warn / Block",
    description: "Manage delivery restrictions",
    icon: ShieldCheck,
  },
  {
    id: "Unbalanced Products",
    label: "Unbalanced Products",
    description: "Outstanding empty containers",
    icon: Droplets,
  },
  {
    id: "Customer QR Code",
    label: "Customer QR Code",
    description: "View customer QR code",
    icon: QrCode,
  },
  {
    id: "Invite",
    label: "Invite to Customer App",
    description: "Invite customer to the application",
    icon: UserPlus,
  },
];

export default function CustomerDetailSidebar({
  activeSection = "Profile",
  onChange,
}) {
  return (
    <aside className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-bold text-[#102C46]">
          Customer Settings
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Manage customer account
        </p>
      </div>

      <nav
        aria-label="Customer settings"
        className="divide-y divide-slate-100"
      >
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const selected = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange?.(item.id)}
              aria-current={selected ? "page" : undefined}
              className={`flex w-full items-center gap-3 px-4 py-4 text-left transition ${
                selected
                  ? "bg-teal-50"
                  : "bg-white hover:bg-slate-50"
              }`}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                  selected
                    ? "bg-teal-100 text-teal-800"
                    : "bg-slate-50 text-slate-500"
                }`}
              >
                <Icon size={19} />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm font-semibold ${
                    selected
                      ? "text-teal-900"
                      : "text-slate-800"
                  }`}
                >
                  {item.label}
                </span>

                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {item.description}
                </span>
              </span>

              <ChevronRight
                size={17}
                className="shrink-0 text-slate-400"
              />
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
