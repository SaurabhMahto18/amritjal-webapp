
const statistics = [
  {
    key: "total",
    label: "Total Customers",
    color: "text-[#24262B]",
  },
  {
    key: "active",
    label: "Active Customers",
    color: "text-green-700",
  },
  {
    key: "archived",
    label: "Archived Customers",
    color: "text-gray-500",
  },
];

function StatCard({ label, value, color, loading }) {
  return (
    <div className="rounded-2xl border border-[#EDEAE0] bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-3 text-2xl font-bold ${color}`}>
        {loading ? "..." : value ?? "Unavailable"}
      </p>
    </div>
  );
}

export default function BusinessStatistics({
  customers,
  activity,
  loading,
}) {
  const activityCards = [
    {
      label: "Total Deliveries",
      value: activity?.deliveries,
    },
    {
      label: "Total Invoices",
      value: activity?.invoices,
    },
    {
      label: "Payment Records",
      value: activity?.payments,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-[#24262B]">
          Customer Statistics
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statistics.map((item) => (
            <StatCard
              key={item.key}
              label={item.label}
              value={customers?.[item.key]}
              color={item.color}
              loading={loading}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-[#24262B]">
          Business Activity
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {activityCards.map((item) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value}
              color="text-[#24262B]"
              loading={loading}
            />
          ))}
        </div>
      </div>

      {(customers?.errors?.length > 0 ||
        activity?.errors?.length > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            Some statistics could not be loaded.
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-amber-700">
            {[...(customers?.errors || []), ...(activity?.errors || [])].map(
              (error, index) => (
                <li key={`${index}-${error}`}>{error}</li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
