
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  Clock,
  CreditCard,
  Droplets,
  FileText,
  HandCoins,
  Package,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Receipt,
  CalendarClock,
  Smartphone,
  Globe,
} from "lucide-react";

import BusinessTrendChart from "../components/BusinessTrendChart";
import dashboardService from "../services/dashboardService";

/* =========================================
   HELPERS
========================================= */

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const safePercent = (value, total) => {
  if (!total || total <= 0) return 0;

  return Math.min(100, Math.max(0, (value / total) * 100));
};

/* =========================================
   REUSABLE COMPONENTS
========================================= */

function Section({
  title,
  subtitle,
  action,
  children,
  className = "",
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color = "bg-cyan-50 text-cyan-700",
  onClick,
}) {
  const content = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-950">
          {value}
        </p>
        <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
      </div>
      <div className={`shrink-0 rounded-xl p-3 ${color}`}>
        {icon}
      </div>
    </div>
  );

  if (!onClick) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {content}
    </button>
  );
}

function TabButton({ active, icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
        active
          ? "bg-slate-950 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function InfoPlaceholder({ icon, title, description }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center px-5 py-8 text-center">
      <div className="mb-3 rounded-2xl bg-slate-100 p-3 text-slate-500">
        {icon}
      </div>
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function DataTable({ columns, rows, loading, emptyMessage }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`whitespace-nowrap px-4 py-3 font-medium text-slate-600 ${
                  column.align === "right" ? "text-right" : ""
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4">
                    <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length > 0 ? (
            rows.map((row, index) => (
              <tr
                key={row.id || index}
                className="transition-colors hover:bg-slate-50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3.5 text-slate-700 ${
                      column.align === "right" ? "text-right" : ""
                    }`}
                  >
                    {column.render
                      ? column.render(row)
                      : row[column.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-9 text-center text-sm text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MetricCard({ label, value, icon, description, tone = "slate" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`rounded-lg p-2 ${tones[tone]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-xl font-bold text-slate-900">
        {value}
      </p>
      {description && (
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      )}
    </div>
  );
}

/* =========================================
   FINANCE CATEGORY LIST
========================================= */

function ExpenseCategoryList({ categories }) {
  if (!categories.length) {
    return (
      <InfoPlaceholder
        icon={<Receipt size={24} />}
        title="No expenses recorded"
        description="Your expense categories will appear here."
      />
    );
  }

  const total = categories.reduce(
    (sum, item) => sum + Number(item.totalAmount || 0),
    0
  );

  return (
    <div className="space-y-5">
      {categories.map((item, index) => (
        <div key={item.category}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">
                {item.category}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {item.transactionCount} transactions
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-slate-900">
              {currency(item.totalAmount)}
            </p>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-rose-400"
              style={{
                width: `${safePercent(item.totalAmount, total)}%`,
                opacity: Math.max(0.45, 1 - index * 0.08),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================
   MAIN DASHBOARD
========================================= */

export default function DashboardPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("today");

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await dashboardService.getDashboardSummary();
      setSummary(result);
    } catch (err) {
      setError(
        err.message || "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Dashboard | Amrit Jal";

    let description = document.querySelector(
      'meta[name="description"]'
    );

    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }

    description.content =
      "Amrit Jal business dashboard for deliveries, payments, expenses and reports.";

    let robots = document.querySelector('meta[name="robots"]');

    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }

    robots.content = "noindex, nofollow";
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const deliveries = summary?.recentDeliveries || [];
  const payments = summary?.recentPayments || [];
  const products = summary?.products || [];
  const events = summary?.todayEvents || [];

  const financeTrend = summary?.financeTrend?.monthly || [];

  const invoiceSummary = summary?.invoiceSummary || {
    totalInvoices: 0,
    totalAmount: 0,
    totalPaid: 0,
    outstanding: 0,
  };

  const invoiceStats = useMemo(() => {
    const invoices = summary?.invoices || [];

    const unpaid = invoices.filter(
      (invoice) =>
        Number(invoice.outstandingAmount || 0) > 0
    );

    const overdue = unpaid.filter(
      (invoice) =>
        invoice.dueDate &&
        invoice.dueDate < summary?.today
    );

    return {
      unpaidCount: unpaid.length,
      overdueAmount: overdue.reduce(
        (total, invoice) =>
          total + Number(invoice.outstandingAmount || 0),
        0
      ),
      notDueAmount: unpaid
        .filter((invoice) => !overdue.includes(invoice))
        .reduce(
          (total, invoice) =>
            total + Number(invoice.outstandingAmount || 0),
          0
        ),
    };
  }, [summary]);

  const financeTotals = useMemo(() => {
    const data = financeTrend;

    return data.reduce(
      (totals, item) => ({
        earning: totals.earning + Number(item.earning || 0),
        payment: totals.payment + Number(item.payment || 0),
        expense: totals.expense + Number(item.expense || 0),
      }),
      {
        earning: 0,
        payment: 0,
        expense: 0,
      }
    );
  }, [financeTrend]);

  const netCollection =
    financeTotals.payment - financeTotals.expense;

  const tabs = [
    {
      id: "today",
      label: "Today",
      icon: <CalendarDays size={18} />,
    },
    {
      id: "finance",
      label: "Finance",
      icon: <ChartNoAxesCombined size={18} />,
    },
    {
      id: "account",
      label: "Account",
      icon: <Users size={18} />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#edf2f7] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">

        {/* HEADER */}

        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-cyan-800">
              AMRIT JAL
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Business Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              {summary?.business?.name
                ? `Welcome to ${summary.business.name}.`
                : "Your business overview at a glance."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
              <CalendarDays size={18} className="text-cyan-700" />
              {formatDate(summary?.today)}
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-900 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </header>

        {/* STATUS BANNER */}

        <div className="flex flex-col gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={21}
              className="mt-0.5 shrink-0 text-cyan-800"
            />
            <div>
              <p className="font-semibold text-slate-800">
                Business overview
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Monitor daily operations, financial performance and account
                information from one place.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 text-xs font-medium text-cyan-800">
            <Activity size={15} />
            Live database records
          </span>
        </div>

        {/* TABS */}

        <div className="flex w-fit max-w-full flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              icon={tab.icon}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </TabButton>
          ))}
        </div>

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">
                Dashboard could not be loaded
              </p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={loadDashboard}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* =====================================
            TODAY TAB
        ===================================== */}

        {activeTab === "today" && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title="Today's Payment"
                value={currency(summary?.todayCollection)}
                subtitle={`${summary?.todayPaymentCount ?? 0} payments recorded`}
                icon={<HandCoins size={24} />}
                color="bg-teal-50 text-teal-700"
                onClick={() => navigate("/payments")}
              />

              <SummaryCard
                title="Today's Expenses"
                value={currency(summary?.todayExpenses)}
                subtitle={`${summary?.todayExpenseCount ?? 0} expenses recorded`}
                icon={<Wallet size={24} />}
                color="bg-rose-50 text-rose-600"
                onClick={() => navigate("/expenses")}
              />

              <SummaryCard
                title="Today's Earning"
                value={currency(summary?.todayDeliveryValue)}
                subtitle="Recorded delivery value"
                icon={<TrendingUp size={24} />}
                color="bg-sky-50 text-sky-700"
                onClick={() => navigate("/deliveries")}
              />

              <SummaryCard
                title="Security Deposit"
                value="Not connected"
                subtitle="Deposit summary requires ledger integration"
                icon={<CreditCard size={24} />}
                color="bg-orange-50 text-orange-700"
                onClick={() => navigate("/customers")}
              />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              {/* EVENTS */}

              <Section
                title="Today's Events"
                subtitle={`${events.length} events scheduled today`}
                className="flex flex-col"
                action={
                  <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                    <CalendarDays size={22} />
                  </div>
                }
              >
                {events.length ? (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-xl border border-slate-200 p-3"
                      >
                        <p className="font-semibold text-slate-800">
                          {event.title}
                        </p>

                        {(event.startTime || event.endTime) && (
                          <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                            <Clock size={14} />
                            {formatTime(event.startTime)}
                            {event.endTime
                              ? ` – ${formatTime(event.endTime)}`
                              : ""}
                          </p>
                        )}

                        {event.location && (
                          <p className="mt-1 text-xs text-slate-500">
                            {event.location}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <InfoPlaceholder
                    icon={<CalendarDays size={24} />}
                    title="No events today"
                    description="Events scheduled for today will appear here."
                  />
                )}

                <button
                  type="button"
                  onClick={() => navigate("/events")}
                  className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100"
                >
                  Manage Events
                  <ArrowRight size={16} />
                </button>
              </Section>

              {/* INVOICES */}

              <Section
                title="Invoices"
                subtitle="Billing overview"
                className="xl:col-span-2"
                action={
                  <button
                    type="button"
                    onClick={() => navigate("/invoices")}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                  >
                    All Invoices
                    <ArrowRight size={16} />
                  </button>
                }
              >
                <div className="mb-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Total Outstanding Invoices
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {currency(invoiceSummary.outstanding)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {invoiceStats.unpaidCount} unpaid invoices in recent records
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <p className="flex items-center gap-2 text-sm text-rose-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      Overdue
                    </p>
                    <p className="mt-3 text-xl font-bold text-rose-700">
                      {currency(invoiceStats.overdueAmount)}
                    </p>
                    <p className="mt-1 text-xs text-rose-600">
                      Based on invoice due dates
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="flex items-center gap-2 text-sm text-amber-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      Not Due Yet
                    </p>
                    <p className="mt-3 text-xl font-bold text-amber-700">
                      {currency(invoiceStats.notDueAmount)}
                    </p>
                    <p className="mt-1 text-xs text-amber-600">
                      Based on invoice due dates
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Paid: {currency(invoiceSummary.totalPaid)}
                    </span>
                    <span>
                      Total: {currency(invoiceSummary.totalAmount)}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${safePercent(
                          invoiceSummary.totalPaid,
                          invoiceSummary.totalAmount
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </Section>
            </section>

            {/* DELIVERY TABLE */}

            <Section
              title="Today's Deliveries"
              subtitle={`Delivery records · ${formatDate(summary?.today)}`}
              action={
                <button
                  type="button"
                  onClick={() => navigate("/deliveries")}
                  className="text-sm font-semibold text-cyan-800 hover:text-cyan-950"
                >
                  View All
                </button>
              }
            >
              <DataTable
                loading={loading}
                rows={deliveries}
                emptyMessage="No deliveries recorded today."
                columns={[
                  {
                    key: "customerName",
                    label: "Customer Name",
                  },
                  {
                    key: "quantity",
                    label: "Quantity",
                    align: "right",
                    render: (row) => `${formatNumber(row.quantity)} jars`,
                  },
                  {
                    key: "date",
                    label: "Delivery Date",
                    render: (row) => formatDate(row.date),
                  },
                  {
                    key: "amount",
                    label: "Amount",
                    align: "right",
                    render: (row) => currency(row.amount),
                  },
                ]}
              />
            </Section>

            {/* EXPECTED DELIVERY */}

            <Section
              title="Expected Product Deliveries"
              subtitle="Planned deliveries by customer group"
            >
              <InfoPlaceholder
                icon={<CalendarClock size={24} />}
                title="Schedule integration pending"
                description="Expected quantities require a configured recurring delivery schedule. No estimated quantities are shown without that data."
              />
            </Section>

            {/* LOW STOCK */}

            <Section
              title="Low Stock Products"
              subtitle="Inventory overview"
              action={
                <button
                  type="button"
                  onClick={() => navigate("/products")}
                  className="text-sm font-semibold text-cyan-800 hover:text-cyan-950"
                >
                  Manage Products
                </button>
              }
            >
              <InfoPlaceholder
                icon={<Package size={24} />}
                title="Stock tracking not connected"
                description="Product stock quantity and low-stock thresholds are not available in the current dashboard data."
              />
            </Section>

            {/* EMPLOYEE */}

            <Section
              title="Employee Deliveries and Payment Collection"
              subtitle={`Daily employee activity · ${formatDate(summary?.today)}`}
            >
              <InfoPlaceholder
                icon={<Users size={24} />}
                title="Employee-wise reporting pending"
                description="This section needs employee-linked delivery and collection data. It will not display estimated or fabricated figures."
              />
            </Section>

            {/* RECENT RECORDS */}

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Section
                title="Recent Deliveries"
                subtitle="Today's latest delivery records"
                action={
                  <button
                    type="button"
                    onClick={() => navigate("/deliveries")}
                    className="text-sm font-semibold text-cyan-800"
                  >
                    View All
                  </button>
                }
              >
                {deliveries.length ? (
                  <div className="divide-y divide-slate-100">
                    {deliveries.map((row) => (
                      <div
                        key={row.id}
                        className="flex items-center justify-between gap-3 py-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="rounded-xl bg-cyan-50 p-3 text-cyan-800">
                            <Droplets size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {row.customerName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatNumber(row.quantity)} jars ·{" "}
                              {formatDate(row.date)}
                            </p>
                          </div>
                        </div>
                        <p className="shrink-0 font-bold">
                          {currency(row.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <InfoPlaceholder
                    icon={<Droplets size={24} />}
                    title="No deliveries today"
                    description="New delivery records will appear here."
                  />
                )}
              </Section>

              <Section
                title="Recent Payments"
                subtitle="Today's latest collections"
                action={
                  <button
                    type="button"
                    onClick={() => navigate("/payments")}
                    className="text-sm font-semibold text-cyan-800"
                  >
                    View All
                  </button>
                }
              >
                {payments.length ? (
                  <div className="divide-y divide-slate-100">
                    {payments.map((row) => (
                      <div
                        key={row.id}
                        className="flex items-center justify-between gap-3 py-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                            <ArrowDownLeft size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {row.customerName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {row.method || "Payment"} ·{" "}
                              {formatDate(row.date)}
                            </p>
                          </div>
                        </div>
                        <p className="shrink-0 font-bold text-emerald-700">
                          +{currency(row.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <InfoPlaceholder
                    icon={<Wallet size={24} />}
                    title="No payments today"
                    description="New payment records will appear here."
                  />
                )}
              </Section>
            </section>
          </>
        )}

        {/* =====================================
            FINANCE TAB
        ===================================== */}

        {activeTab === "finance" && (
          <>
            {/* BUSINESS TREND */}

            <BusinessTrendChart data={summary?.financeTrend} />

            {/* OVERVIEW METRICS */}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Earning"
                value={currency(financeTotals.earning)}
                icon={<TrendingUp size={19} />}
                tone="blue"
                description="Delivery value"
              />

              <MetricCard
                label="Expense"
                value={currency(financeTotals.expense)}
                icon={<TrendingDown size={19} />}
                tone="red"
                description="Recorded expenses"
              />

              <MetricCard
                label="Payment"
                value={currency(financeTotals.payment)}
                icon={<HandCoins size={19} />}
                tone="green"
                description="Customer collections"
              />

              <MetricCard
                label="Net Collection"
                value={currency(netCollection)}
                icon={<Wallet size={19} />}
                tone="violet"
                description="Payment minus expense"
              />

              <MetricCard
                label="Due"
                value={currency(summary?.outstandingBalance)}
                icon={<CreditCard size={19} />}
                tone="amber"
                description="Customer outstanding balance"
              />
            </section>

            {/* FINANCE OVERVIEW */}

            <Section
              title="Finance Overview"
              subtitle="Last 12 months of recorded financial activity"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                  <p className="text-sm text-blue-800">Total Earning</p>
                  <p className="mt-3 text-2xl font-bold text-blue-900">
                    {currency(financeTotals.earning)}
                  </p>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
                  <p className="text-sm text-rose-800">Total Expense</p>
                  <p className="mt-3 text-2xl font-bold text-rose-900">
                    {currency(financeTotals.expense)}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-sm text-emerald-800">Total Payment</p>
                  <p className="mt-3 text-2xl font-bold text-emerald-900">
                    {currency(financeTotals.payment)}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm text-amber-800">Outstanding Due</p>
                  <p className="mt-3 text-2xl font-bold text-amber-900">
                    {currency(summary?.outstandingBalance)}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Net Collection is calculated as customer payments received
                minus recorded expenses. It is a cash-flow indicator, not
                accounting profit.
              </p>
            </Section>

            {/* CATEGORY + TOP PRODUCTS */}

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Section
                title="Expenses by Category"
                subtitle="Recorded expense distribution"
                action={
                  <button
                    type="button"
                    onClick={() => navigate("/expenses")}
                    className="text-sm font-semibold text-cyan-800"
                  >
                    View Expenses
                  </button>
                }
              >
                <ExpenseCategoryList
                  categories={summary?.expensesByCategory || []}
                />
              </Section>

              <Section
                title="Top Selling Products"
                subtitle="Based on net delivered quantity and value"
                action={
                  <button
                    type="button"
                    onClick={() => navigate("/products")}
                    className="text-sm font-semibold text-cyan-800"
                  >
                    View Products
                  </button>
                }
              >
                {summary?.topSellingProducts?.length ? (
                  <div className="space-y-4">
                    {summary.topSellingProducts.map((product, index) => (
                      <div
                        key={product.productId}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-sm font-bold text-cyan-800">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {product.productName}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Net quantity: {formatNumber(product.netQuantity)}{" "}
                              {product.unit}
                            </p>
                          </div>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-slate-900">
                          {currency(product.netSales)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <InfoPlaceholder
                    icon={<Package size={24} />}
                    title="No product sales data"
                    description="Product-wise sales will appear after delivery items are recorded."
                  />
                )}
              </Section>
            </section>

            {/* PAYMENT HISTORY */}

            <Section
              title="Today's Payment History"
              subtitle="Customer collections recorded today"
              action={
                <button
                  type="button"
                  onClick={() => navigate("/payments")}
                  className="text-sm font-semibold text-cyan-800"
                >
                  View All
                </button>
              }
            >
              <DataTable
                loading={loading}
                rows={payments}
                emptyMessage="No payments recorded today."
                columns={[
                  {
                    key: "customerName",
                    label: "Customer Name",
                  },
                  {
                    key: "date",
                    label: "Payment Date",
                    render: (row) => formatDate(row.date),
                  },
                  {
                    key: "method",
                    label: "Payment Method",
                  },
                  {
                    key: "amount",
                    label: "Amount",
                    align: "right",
                    render: (row) => currency(row.amount),
                  },
                ]}
              />
            </Section>
          </>
        )}

        {/* =====================================
            ACCOUNT TAB
        ===================================== */}

        {activeTab === "account" && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryCard
                title="Active Customers"
                value={summary?.activeCustomers ?? 0}
                subtitle="Active customer accounts"
                icon={<Users size={24} />}
                color="bg-cyan-50 text-cyan-700"
                onClick={() => navigate("/customers")}
              />

              <SummaryCard
                title="Total Customers"
                value={summary?.totalCustomers ?? 0}
                subtitle="All customer accounts"
                icon={<Users size={24} />}
                color="bg-violet-50 text-violet-700"
                onClick={() => navigate("/customers")}
              />

              <SummaryCard
                title="Products"
                value={products.length}
                subtitle="Saved product records"
                icon={<Package size={24} />}
                color="bg-orange-50 text-orange-700"
                onClick={() => navigate("/products")}
              />
            </section>

            {/* SUBSCRIPTION PLANS */}

            <Section
              title="Subscription & Plans"
              subtitle="Amrit Jal application subscription information"
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
                        <Smartphone size={22} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          App Plan
                        </h3>
                        <p className="text-xs text-slate-500">
                          Mobile application plan
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      Not configured
                    </span>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-500">
                      Subscription validity
                    </p>
                    <p className="mt-2 font-semibold text-slate-800">
                      Not available yet
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      App subscription management will be activated when the
                      SaaS subscription backend is implemented.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                        <Globe size={22} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          Web Plan
                        </h3>
                        <p className="text-xs text-slate-500">
                          Web application plan
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      Not configured
                    </span>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-500">
                      Subscription validity
                    </p>
                    <p className="mt-2 font-semibold text-slate-800">
                      Not available yet
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Web plan activation, renewal and expiry tracking will
                      require subscription records.
                    </p>
                  </div>
                </div>
              </div>
            </Section>

            {/* PRODUCT INVENTORY */}

            <Section
              title="Product Inventory"
              subtitle="Saved product information"
              action={
                <button
                  type="button"
                  onClick={() => navigate("/products")}
                  className="text-sm font-semibold text-cyan-800"
                >
                  Manage Products
                </button>
              }
            >
              <DataTable
                loading={loading}
                rows={products}
                emptyMessage="No products found."
                columns={[
                  {
                    key: "name",
                    label: "Product Name",
                  },
                  {
                    key: "sku",
                    label: "SKU",
                  },
                  {
                    key: "salePrice",
                    label: "Sale Price",
                    align: "right",
                    render: (row) => currency(row.salePrice),
                  },
                  {
                    key: "unit",
                    label: "Unit",
                  },
                  {
                    key: "stockQuantity",
                    label: "Current Stock",
                    align: "right",
                    render: (row) =>
                      row.stockQuantity == null
                        ? "Not tracked"
                        : formatNumber(row.stockQuantity),
                  },
                ]}
              />
            </Section>

            {/* ACCOUNT MANAGEMENT */}

            <Section title="Account Management">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => navigate("/customers")}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:bg-slate-50"
                >
                  <span className="flex items-center gap-3">
                    <Users size={20} className="text-cyan-800" />
                    <span>
                      <span className="block font-semibold">
                        Customers
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Customer profiles and accounts
                      </span>
                    </span>
                  </span>
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/products")}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:bg-slate-50"
                >
                  <span className="flex items-center gap-3">
                    <Package size={20} className="text-cyan-800" />
                    <span>
                      <span className="block font-semibold">
                        Products
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Product pricing and details
                      </span>
                    </span>
                  </span>
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/employees")}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:bg-slate-50"
                >
                  <span className="flex items-center gap-3">
                    <Users size={20} className="text-cyan-800" />
                    <span>
                      <span className="block font-semibold">
                        Employees
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Employee management
                      </span>
                    </span>
                  </span>
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/settings")}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:bg-slate-50"
                >
                  <span className="flex items-center gap-3">
                    <ShieldCheck size={20} className="text-cyan-800" />
                    <span>
                      <span className="block font-semibold">
                        Business Settings
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Business profile and preferences
                      </span>
                    </span>
                  </span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </Section>
          </>
        )}

        {/* FOOTER */}

        <footer className="pb-3 pt-1 text-center text-xs text-slate-400">
          Amrit Jal · Business Management Dashboard
        </footer>
      </div>
    </main>
  );
}
