import { CreditCard, MessageCircle, BarChart3 } from "lucide-react";

const tabs = [
  {
    id: "settings",
    label: "Settings",
    icon: MessageCircle,
  },
  {
    id: "usage",
    label: "Usage",
    icon: BarChart3,
  },
];

export default function SmsTabs({
  activeTab = "settings",
  onChange,
}) {
  return (
    <div className="mb-5 inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1.5">
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-[#08172b] text-white shadow-md"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        );
      })}
    </div>
  );
}