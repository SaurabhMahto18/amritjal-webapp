import { Users, Package, Wallet, MapPinned } from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function Card({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#DCE8EA] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-[#8299A5]">{title}</p>

          <p className="mt-1.5 text-xl font-bold leading-tight text-[#102D3A]">
            {value}
          </p>

          <p className="mt-1 text-[11px] leading-4 text-[#8299A5]">
            {description}
          </p>
        </div>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#DDF4F1] text-[#087F8C]">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export default function GroupSummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Card
        title="Total Groups"
        value={summary.totalGroups}
        description="Registered customer groups"
        icon={MapPinned}
      />

      <Card
        title="Total Customers"
        value={summary.totalCustomers}
        description="Customers assigned to groups"
        icon={Users}
      />

      <Card
        title="Balance Jar"
        value={summary.balanceJar}
        description="Jars currently with customers"
        icon={Package}
      />

      <Card
        title="Total Outstanding"
        value={formatCurrency(summary.totalDue)}
        description="Net customer dues"
        icon={Wallet}
      />
    </div>
  );
}