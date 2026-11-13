
import { Users, Package, Wallet, MapPinned } from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function Card({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[#DCE8EA] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[#8299A5]">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[#102D3A]">
            {value}
          </p>
          <p className="mt-1 text-xs text-[#8299A5]">
            {description}
          </p>
        </div>

        <div className="flex size-11 items-center justify-center rounded-xl bg-[#DDF4F1] text-[#087F8C]">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function GroupSummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
