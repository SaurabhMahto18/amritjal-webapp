
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboardStats } from "../services/adminService";

/* ------------------------------
   Helpers
-------------------------------- */

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value, currency = "INR") {
  const amount = Number(value) || 0;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${formatNumber(amount)}`;
  }
}

function getCurrencyEntries(data) {
  if (!data || typeof data !== "object") return [];

  return Object.entries(data)
    .filter(([, value]) => Number.isFinite(Number(value)))
    .sort((a, b) => Number(b[1]) - Number(a[1]));
}

/* ------------------------------
   Reusable Components
-------------------------------- */

function StatCard({
  title,
  value,
  description,
  icon,
  iconStyle = "bg-cyan-50 text-cyan-700",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </h3>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${iconStyle}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center">
      <div>
        <h2 className="font-bold text-slate-900">{title}</h2>

        {description && (
          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
        —
      </div>

      <p className="mt-3 text-sm text-slate-500">
        {message}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "unknown").toLowerCase();

  const styles = {
    active: "bg-emerald-50 text-emerald-700",
    trialing: "bg-blue-50 text-blue-700",
    suspended: "bg-red-50 text-red-700",
    expired: "bg-rose-50 text-rose-700",
    cancelled: "bg-slate-100 text-slate-600",
    pending: "bg-amber-50 text-amber-700",
    unknown: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[normalized] || styles.unknown
      }`}
    >
      {normalized.replaceAll("_", " ")}
    </span>
  );
}

function CurrencyList({ data, emptyMessage }) {
  const entries = getCurrencyEntries(data);

  if (entries.length === 0) {
    return (
      <p className="py-5 text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(([currency, amount]) => (
        <div
          key={currency}
          className="flex items-center justify-between gap-3"
        >
          <span className="text-sm font-medium text-slate-600">
            {currency}
          </span>

          <span className="text-sm font-bold tabular-nums text-slate-900">
            {formatCurrency(amount, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------
   Main Dashboard
-------------------------------- */

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const result = await getAdminDashboardStats();

      setStats(result);
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err.message || "Unable to load dashboard statistics."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totalBusinesses = stats?.totalBusinesses ?? 0;
  const activeBusinesses = stats?.activeBusinesses ?? 0;
  const activeSubscriptions = stats?.activeSubscriptions ?? 0;
  const trialSubscriptions = stats?.trialSubscriptions ?? 0;
  const expiringSubscriptions = stats?.expiringSubscriptions ?? 0;
  const totalPlans = stats?.totalPlans ?? 0;
  const activePlans = stats?.activePlans ?? 0;
  const pendingRenewals = stats?.pendingRenewals ?? 0;

  const recentBusinesses = Array.isArray(stats?.recentBusinesses)
    ? stats.recentBusinesses
    : [];

  const businessInactive = Math.max(
    totalBusinesses - activeBusinesses,
    0
  );

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-8">

      {/* Page Header */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
            Platform Overview
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Admin Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor your platform, businesses and subscriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className={refreshing ? "animate-spin" : ""}>
            ↻
          </span>

          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* Error State */}

      {error && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 sm:flex-row sm:items-center"
        >
          <div>
            <p className="text-sm font-semibold text-red-800">
              Dashboard could not be loaded
            </p>

            <p className="mt-1 text-xs text-red-700">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            className="rounded-lg bg-red-100 px-4 py-2 text-xs font-bold text-red-800 hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Statistics */}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Platform Statistics
          </h2>

          <span className="text-xs text-slate-400">
            Live database data
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Total Businesses"
            value={loading ? "—" : formatNumber(totalBusinesses)}
            description="All registered businesses"
            icon="▣"
          />

          <StatCard
            title="Active Businesses"
            value={loading ? "—" : formatNumber(activeBusinesses)}
            description="Businesses with active status"
            icon="✓"
            iconStyle="bg-emerald-50 text-emerald-700"
          />

          <StatCard
            title="Active Subscriptions"
            value={loading ? "—" : formatNumber(activeSubscriptions)}
            description="Currently active subscriptions"
            icon="◈"
            iconStyle="bg-blue-50 text-blue-700"
          />

          <StatCard
            title="Trial Subscriptions"
            value={loading ? "—" : formatNumber(trialSubscriptions)}
            description="Subscriptions currently in trial"
            icon="◷"
            iconStyle="bg-violet-50 text-violet-700"
          />

          <StatCard
            title="Active Plans"
            value={loading ? "—" : formatNumber(activePlans)}
            description={`${formatNumber(totalPlans)} total configured plans`}
            icon="◇"
            iconStyle="bg-amber-50 text-amber-700"
          />

          <StatCard
            title="Pending Renewals"
            value={loading ? "—" : formatNumber(pendingRenewals)}
            description="Renewals waiting for activation"
            icon="↻"
            iconStyle="bg-orange-50 text-orange-700"
          />
        </div>
      </section>

      {/* Revenue Overview */}

      <section>
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-800">
            Revenue Overview
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Successful platform subscription payments only
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Collection
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  All-time successful payments
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-700">
                ₹
              </div>
            </div>

            <div className="mt-5">
              {loading ? (
                <p className="text-sm text-slate-400">
                  Loading revenue...
                </p>
              ) : (
                <CurrencyList
                  data={stats?.totalCollectedByCurrency}
                  emptyMessage="No successful payments recorded yet."
                />
              )}
            </div>

            <Link
              to="/admin/revenue"
              className="mt-5 inline-flex text-xs font-bold text-cyan-700 hover:text-cyan-900"
            >
              View Revenue Details →
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  This Month's Collection
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Current calendar month · IST
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-lg text-cyan-700">
                ↗
              </div>
            </div>

            <div className="mt-5">
              {loading ? (
                <p className="text-sm text-slate-400">
                  Loading revenue...
                </p>
              ) : (
                <CurrencyList
                  data={stats?.monthlyCollectedByCurrency}
                  emptyMessage="No successful payments this month."
                />
              )}
            </div>

            <Link
              to="/admin/revenue"
              className="mt-5 inline-flex text-xs font-bold text-cyan-700 hover:text-cyan-900"
            >
              View Payment Records →
            </Link>
          </div>

        </div>
      </section>

      {/* Subscription Health */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          title="Subscription Health"
          description="Current subscription and business status"
          action={
            <Link
              to="/admin/subscriptions"
              className="text-xs font-bold text-cyan-700 hover:text-cyan-900"
            >
              Manage Subscriptions →
            </Link>
          }
        />

        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-xl bg-emerald-50/70 p-4">
            <p className="text-xs font-medium text-emerald-700">
              Active Subscriptions
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-800">
              {loading ? "—" : formatNumber(activeSubscriptions)}
            </p>
          </div>

          <div className="rounded-xl bg-blue-50/70 p-4">
            <p className="text-xs font-medium text-blue-700">
              Trial Subscriptions
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-800">
              {loading ? "—" : formatNumber(trialSubscriptions)}
            </p>
          </div>

          <div className="rounded-xl bg-amber-50/70 p-4">
            <p className="text-xs font-medium text-amber-700">
              Expiring in 7 Days
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-800">
              {loading ? "—" : formatNumber(expiringSubscriptions)}
            </p>
          </div>

          <div className="rounded-xl bg-red-50/70 p-4">
            <p className="text-xs font-medium text-red-700">
              Inactive Businesses
            </p>

            <p className="mt-2 text-2xl font-bold text-red-800">
              {loading ? "—" : formatNumber(businessInactive)}
            </p>
          </div>

        </div>
      </section>

      {/* Recent Businesses + Quick Actions */}

      <div className="grid gap-6 xl:grid-cols-3">

        {/* Recent Businesses */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">

          <SectionHeader
            title="Recent Businesses"
            description="Latest registered businesses on the platform"
            action={
              <Link
                to="/admin/businesses"
                className="text-xs font-bold text-cyan-700 hover:text-cyan-900"
              >
                View All →
              </Link>
            }
          />

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading businesses...
            </div>
          ) : recentBusinesses.length === 0 ? (
            <EmptyState message="No registered businesses found." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">
                      Business
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Registered
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentBusinesses.map((business) => (
                    <tr
                      key={business.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {business.name || "Unnamed business"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {business.id?.slice(0, 8) || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={business.status} />
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {formatDate(business.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </section>

        {/* Quick Actions */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <h2 className="font-bold text-slate-900">
            Quick Actions
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Platform management shortcuts
          </p>

          <div className="mt-5 space-y-3">

            <Link
              to="/admin/businesses"
              className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/50"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Manage Businesses
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  View and manage registrations
                </p>
              </div>

              <span className="text-cyan-700">→</span>
            </Link>

            <Link
              to="/admin/subscriptions"
              className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/50"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Subscriptions
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Manage plans and access
                </p>
              </div>

              <span className="text-cyan-700">→</span>
            </Link>

            <Link
              to="/admin/plans"
              className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/50"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Subscription Plans
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Configure pricing and limits
                </p>
              </div>

              <span className="text-cyan-700">→</span>
            </Link>

            <Link
              to="/admin/revenue"
              className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/50"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Revenue & Payments
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Review platform collections
                </p>
              </div>

              <span className="text-cyan-700">→</span>
            </Link>

            <Link
              to="/admin/configuration"
              className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/50"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Platform Configuration
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Manage global settings
                </p>
              </div>

              <span className="text-cyan-700">→</span>
            </Link>

          </div>
        </section>

      </div>

      {/* Footer Info */}

      <div className="flex flex-col justify-between gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold text-slate-700">
            Amrit Jal Platform Administration
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Dashboard statistics are retrieved from the database.
          </p>
        </div>

        <p className="text-xs text-slate-400">
          Subscription revenue excludes unsuccessful payments.
        </p>
      </div>

    </div>
  );
}
