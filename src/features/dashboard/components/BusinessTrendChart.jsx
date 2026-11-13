import { useMemo, useState } from "react";
import { ChartNoAxesCombined } from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "earning", label: "Earning" },
  { key: "expense", label: "Expense" },
  { key: "payment", label: "Payment" },
  { key: "profit", label: "Profit" },
  { key: "due", label: "Due" },
];

const SERIES = {
  earning: {
    label: "Earning",
    color: "#0D9488",
  },
  payment: {
    label: "Payment",
    color: "#2563EB",
  },
  expense: {
    label: "Expense",
    color: "#E87979",
  },
  profit: {
    label: "Operating Surplus",
    color: "#6F987B",
  },
  due: {
    label: "Net Due Movement",
    color: "#D6A63A",
  },
};

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const compactCurrency = (value) => {
  const amount = Number(value) || 0;

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return `₹${Math.round(amount)}`;
};

const getMetricValue = (item, key) => {
  const earning = Number(item.earning) || 0;
  const payment = Number(item.payment) || 0;
  const expense = Number(item.expense) || 0;

  switch (key) {
    case "earning":
      return earning;

    case "payment":
      return payment;

    case "expense":
      return expense;

    // This is an operational indicator, not accounting profit.
    case "profit":
      return earning - expense;

    // Period-wise movement, not cumulative customer outstanding.
    case "due":
      return earning - payment;

    default:
      return 0;
  }
};

function getVisibleSeries(activeTab) {
  if (activeTab === "overview") {
    return ["earning", "payment", "expense"];
  }

  return [activeTab];
}

function BarChart({
  data,
  activeTab,
  selectedPeriod,
  onSelectPeriod,
}) {
  const width = 900;
  const height = 360;

  const left = 75;
  const right = 25;
  const top = 24;
  const bottom = 55;

  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;

  const visibleSeries = getVisibleSeries(activeTab);

  const allValues = data.flatMap((item) =>
    visibleSeries.map((key) => getMetricValue(item, key))
  );

  const positiveMax = Math.max(
    1,
    ...allValues.filter((value) => value > 0)
  );

  const negativeMin = Math.min(
    0,
    ...allValues.filter((value) => value < 0)
  );

  const maxValue = positiveMax * 1.12;
  const minValue = negativeMin * 1.12;

  const range = maxValue - minValue || 1;
  const zeroY = top + (maxValue / range) * chartHeight;

  const groupWidth = chartWidth / Math.max(data.length, 1);
  const groupPadding = Math.min(12, groupWidth * 0.12);

  const barGap = 5;
  const availableBarWidth =
    groupWidth - groupPadding * 2;

  const barWidth = Math.max(
    4,
    Math.min(
      24,
      (availableBarWidth -
        barGap * (visibleSeries.length - 1)) /
        visibleSeries.length
    )
  );

  const actualGroupWidth =
    visibleSeries.length * barWidth +
    (visibleSeries.length - 1) * barGap;

  const gridValues = Array.from(
    { length: 5 },
    (_, index) => maxValue - (index / 4) * range
  );

  const getY = (value) =>
    top + ((maxValue - value) / range) * chartHeight;

  if (!data.length) {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${activeTab} business trend bar chart`}
        className="h-auto min-w-[650px] w-full"
      >
        {/* Horizontal grid */}

        {gridValues.map((value, index) => {
          const y = getY(value);

          return (
            <g key={index}>
              <line
                x1={left}
                y1={y}
                x2={width - right}
                y2={y}
                stroke="#E9EDF2"
                strokeWidth="1"
              />

              <text
                x={left - 12}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#718096"
              >
                {compactCurrency(value)}
              </text>
            </g>
          );
        })}

        {/* Zero line */}

        <line
          x1={left}
          y1={zeroY}
          x2={width - right}
          y2={zeroY}
          stroke="#CBD5E1"
          strokeWidth="1.2"
        />

        {/* Bars */}

        {data.map((item, index) => {
          const groupX = left + index * groupWidth;

          const startX =
            groupX + (groupWidth - actualGroupWidth) / 2;

          return (
            <g key={item.key}>
              {visibleSeries.map((key, seriesIndex) => {
                const value = getMetricValue(item, key);
                const y = getY(value);

                const barHeight = Math.max(
                  0,
                  Math.abs(zeroY - y)
                );

                const x =
                  startX +
                  seriesIndex * (barWidth + barGap);

                const isSelected =
                  selectedPeriod === item.key;

                return (
                  <g key={key}>
                    <rect
                      x={x}
                      y={Math.min(y, zeroY)}
                      width={barWidth}
                      height={barHeight}
                      rx="5"
                      fill={SERIES[key].color}
                      opacity={
                        selectedPeriod && !isSelected
                          ? 0.35
                          : 0.9
                      }
                    >
                      <title>
                        {`${SERIES[key].label}: ${currency(value)}`}
                      </title>
                    </rect>
                  </g>
                );
              })}

              {/* Select period */}

              <rect
                x={groupX}
                y={top}
                width={groupWidth}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onClick={() =>
                  onSelectPeriod(
                    selectedPeriod === item.key
                      ? null
                      : item.key
                  )
                }
              />

              {/* X axis labels */}

              <text
                x={groupX + groupWidth / 2}
                y={height - 18}
                textAnchor="middle"
                fontSize="11"
                fill="#64748B"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function BusinessTrendChart({ data }) {
  const [activeTab, setActiveTab] = useState("payment");
  const [period, setPeriod] = useState("monthly");
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  const chartData = useMemo(() => {
    const source =
      period === "monthly"
        ? data?.monthly
        : data?.yearly;

    if (!Array.isArray(source)) return [];

    return source;
  }, [data, period]);

  const selectedItem = chartData.find(
    (item) => item.key === selectedPeriod
  );

  const activeSeries = getVisibleSeries(activeTab);

  const description = {
    overview: "Business financial overview",
    earning: "Delivery earnings",
    expense: "Recorded business expenses",
    payment: "Customer payments received",
    profit: "Operating surplus indicator",
    due: "Period-wise due movement",
  };

  const tabAvailable = (tab) => {
    if (tab === "profit" || tab === "due") return true;
    return chartData.length > 0;
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Header and top navigation */}

      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <h2 className="font-semibold text-slate-900">
            Business Trend
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {description[activeTab]}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Metric tabs */}

          <div
            role="tablist"
            aria-label="Financial metric"
            className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1"
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedPeriod(null);
                }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:bg-white/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Monthly / Yearly */}

          <div
            role="group"
            aria-label="Chart time period"
            className="flex items-center gap-1 rounded-xl bg-slate-100 p-1"
          >
            {["monthly", "yearly"].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={period === value}
                onClick={() => {
                  setPeriod(value);
                  setSelectedPeriod(null);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                  period === value
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:bg-white/70"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}

      <div className="mt-6 flex flex-wrap items-center gap-5">
        {activeSeries.map((key) => (
          <div
            key={key}
            className="flex items-center gap-2 text-xs font-medium text-slate-600"
          >
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{
                backgroundColor: SERIES[key].color,
              }}
            />
            {SERIES[key].label}
          </div>
        ))}
      </div>

      {/* Selected period summary */}

      {selectedItem && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {activeSeries.map((key) => (
            <div
              key={key}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <p className="text-xs text-slate-500">
                {SERIES[key].label}
              </p>

              <p className="mt-2 font-bold text-slate-900">
                {currency(getMetricValue(selectedItem, key))}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}

      {chartData.length > 0 ? (
        <div className="mt-5">
          <BarChart
            data={chartData}
            activeTab={activeTab}
            selectedPeriod={selectedPeriod}
            onSelectPeriod={setSelectedPeriod}
          />
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center text-center">
          <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
            <ChartNoAxesCombined size={28} />
          </div>

          <p className="mt-4 font-semibold text-slate-800">
            No trend data available
          </p>

          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Financial records will appear here when available.
          </p>
        </div>
      )}

      {/* Footer */}

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-xs leading-5 text-slate-500">
          {activeTab === "profit"
            ? "Operating Surplus = Delivery Earning − Recorded Expenses. This is not a final accounting profit calculation."
            : activeTab === "due"
              ? "Net Due Movement = Delivery Earning − Customer Payments for the selected period. It is not the cumulative outstanding balance."
              : "Select a month or year to view its financial breakdown."}
        </p>
      </div>
    </section>
  );
}