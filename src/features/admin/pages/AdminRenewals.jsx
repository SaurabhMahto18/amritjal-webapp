import { useCallback, useEffect, useMemo, useState } from "react";
import { adminRenewalService } from "../services/adminRenewalService";

const FILTERS = ["all", "pending", "active", "cancelled"];

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    alert: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </>
    ),
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.calendar}
    </svg>
  );
}

function StatCard({ label, value, detail, icon, tone }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="rounded-2xl border border-[#EDEAE0] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#24262B]">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>

        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            tones[tone] || tones.slate
          }`}
        >
          <Icon name={icon} />
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700",
    active: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-700",
  };

  const normalized = String(status || "unknown").toLowerCase();

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
        styles[normalized] || "bg-slate-100 text-slate-600"
      }`}
    >
      {normalized.replaceAll("_", " ")}
    </span>
  );
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

function formatMoney(amount, currency = "INR") {
  if (amount === null || amount === undefined || amount === "") {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function getPaymentAmount(payment) {
  if (!payment) return null;

  return (
    payment.amount ??
    payment.total_amount ??
    payment.paid_amount ??
    null
  );
}

function getPaymentMethod(payment) {
  if (!payment) return "—";

  return (
    payment.payment_method ||
    payment.method ||
    payment.payment_mode ||
    "—"
  );
}

function getDaysRemaining(dateValue) {
  if (!dateValue) return null;

  const now = new Date();
  const end = new Date(dateValue);

  if (Number.isNaN(end.getTime())) return null;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  );

  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#E3E0D6] bg-white px-3 text-sm text-[#24262B] outline-none transition placeholder:text-slate-400 focus:border-[#C6A82D] focus:ring-4 focus:ring-[#E9CA43]/15";

export default function AdminRenewals() {
  const [renewals, setRenewals] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("history");

  const [notice, setNotice] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    try {
      const [renewalRows, subscriptionRows] = await Promise.all([
        adminRenewalService.getRenewals(),
        adminRenewalService.getCurrentSubscriptions(),
      ]);

      setRenewals(renewalRows);
      setSubscriptions(subscriptionRows);
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Unable to load renewal information.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingCount = renewals.filter(
    (item) => item.status === "pending"
  ).length;

  const activeCount = renewals.filter(
    (item) => item.status === "active"
  ).length;

  const cancelledCount = renewals.filter(
    (item) => item.status === "cancelled"
  ).length;

  // Active subscriptions expiring in the next 30 days.
  const upcomingRenewals = useMemo(() => {
    return subscriptions
      .map((subscription) => ({
        ...subscription,
        daysRemaining: getDaysRemaining(subscription.ends_at),
      }))
      .filter((subscription) => {
        return (
          subscription.status === "active" &&
          subscription.daysRemaining !== null &&
          subscription.daysRemaining >= 0 &&
          subscription.daysRemaining <= 30
        );
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [subscriptions]);

  const filteredRenewals = useMemo(() => {
    const query = search.trim().toLowerCase();

    return renewals.filter((renewal) => {
      const statusMatches =
        statusFilter === "all" || renewal.status === statusFilter;

      const searchableText = [
        renewal.business?.name,
        renewal.plan?.name,
        renewal.plan?.code,
        renewal.payment_id,
        renewal.billing_cycle,
        renewal.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const searchMatches =
        !query || searchableText.includes(query);

      return statusMatches && searchMatches;
    });
  }, [renewals, search, statusFilter]);

  const tabs = [
    { id: "history", label: "Renewal History" },
    { id: "upcoming", label: "Upcoming Expirations" },
  ];

  return (
    <main className="min-w-0 space-y-6 bg-[#F7F6F0] p-4 sm:p-6 lg:p-8">
      {/* Page heading */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#927719]">
            Platform Administration
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-[#24262B] sm:text-3xl">
            Renewal Management
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Monitor subscription renewals, upcoming expirations and renewal
            history across businesses.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E3E0D6] bg-white px-4 text-sm font-semibold text-[#34363B] hover:bg-slate-50 disabled:opacity-50"
        >
          <Icon
            name="refresh"
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </header>

      {/* Error message */}
      {notice && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{notice.text}</span>
        </div>
      )}

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Renewals"
          value={renewals.length}
          detail="All recorded renewal entries"
          icon="calendar"
          tone="slate"
        />

        <StatCard
          label="Pending Renewals"
          value={pendingCount}
          detail="Waiting for scheduled activation"
          icon="clock"
          tone="amber"
        />

        <StatCard
          label="Activated Renewals"
          value={activeCount}
          detail="Successfully activated"
          icon="check"
          tone="green"
        />

        <StatCard
          label="Upcoming Expirations"
          value={upcomingRenewals.length}
          detail="Active subscriptions expiring in 30 days"
          icon="users"
          tone="blue"
        />
      </section>

      {/* Tabs */}
      <section className="overflow-hidden rounded-2xl border border-[#EDEAE0] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#EDEAE0] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#24262B] text-white"
                    : "bg-[#F5F4EF] text-slate-600 hover:bg-[#EDEAE0]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "history" && (
            <div className="relative w-full sm:max-w-xs">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search business, plan, payment..."
                className={`${inputClass} pl-10`}
              />
            </div>
          )}
        </div>

        {/* Renewal History */}
        {activeTab === "history" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EEE8] px-5 py-3">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <strong className="text-[#24262B]">
                  {filteredRenewals.length}
                </strong>{" "}
                renewal records
              </p>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-9 rounded-lg border border-[#E3E0D6] bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#C6A82D]"
              >
                {FILTERS.map((filter) => (
                  <option key={filter} value={filter}>
                    {filter === "all"
                      ? "All statuses"
                      : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : filteredRenewals.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <Icon name="calendar" className="h-6 w-6" />
                </div>

                <h3 className="mt-3 font-semibold text-[#24262B]">
                  No renewal records found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Renewal records will appear here when payments are recorded
                  through the subscription payment workflow.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-[#F8F7F2] text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-bold">Business</th>
                      <th className="px-5 py-4 font-bold">Plan</th>
                      <th className="px-5 py-4 font-bold">Billing</th>
                      <th className="px-5 py-4 font-bold">Amount</th>
                      <th className="px-5 py-4 font-bold">Payment</th>
                      <th className="px-5 py-4 font-bold">Validity</th>
                      <th className="px-5 py-4 font-bold">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRenewals.map((renewal) => {
                      const paymentAmount = getPaymentAmount(
                        renewal.payment
                      );

                      const currency =
                        renewal.payment?.currency || "INR";

                      return (
                        <tr
                          key={renewal.id}
                          className="border-t border-[#F0EEE8] hover:bg-[#FCFBF8]"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-[#24262B]">
                              {renewal.business?.name ||
                                "Unknown business"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              ID: {renewal.business_id || "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-700">
                              {renewal.plan?.name || "Unknown plan"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {renewal.plan?.code || "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4 capitalize text-slate-600">
                            {renewal.billing_cycle || "—"}
                          </td>

                          <td className="px-5 py-4 font-semibold text-[#24262B]">
                            {formatMoney(
                              paymentAmount,
                              currency
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium capitalize text-slate-700">
                              {getPaymentMethod(renewal.payment)}
                            </p>

                            <p className="mt-1 max-w-[150px] truncate text-xs text-slate-400">
                              {renewal.payment_id || "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600">
                            <p>
                              Start:{" "}
                              {formatDate(renewal.scheduled_start_at)}
                            </p>

                            <p className="mt-1">
                              End:{" "}
                              {formatDate(renewal.scheduled_end_at)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={renewal.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Upcoming Expirations */}
        {activeTab === "upcoming" && (
          <>
            <div className="border-b border-[#F0EEE8] px-5 py-3">
              <p className="text-sm text-slate-500">
                Active subscriptions expiring within the next 30 days.
              </p>
            </div>

            {loading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-16 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : upcomingRenewals.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Icon name="check" className="h-6 w-6" />
                </div>

                <h3 className="mt-3 font-semibold text-[#24262B]">
                  No upcoming expirations
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  No active subscriptions are expiring in the next 30 days.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-[#F8F7F2] text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-bold">Business</th>
                      <th className="px-5 py-4 font-bold">Current Plan</th>
                      <th className="px-5 py-4 font-bold">Billing Cycle</th>
                      <th className="px-5 py-4 font-bold">Expiry Date</th>
                      <th className="px-5 py-4 font-bold">Time Remaining</th>
                      <th className="px-5 py-4 font-bold">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {upcomingRenewals.map((subscription) => (
                      <tr
                        key={subscription.id}
                        className="border-t border-[#F0EEE8] hover:bg-[#FCFBF8]"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#24262B]">
                            {subscription.business?.name ||
                              "Unknown business"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            ID: {subscription.business_id}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {subscription.plan?.name || "Unknown plan"}
                        </td>

                        <td className="px-5 py-4 capitalize text-slate-600">
                          {subscription.billing_cycle || "—"}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                          {formatDate(subscription.ends_at)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`font-semibold ${
                              subscription.daysRemaining <= 7
                                ? "text-red-600"
                                : "text-amber-700"
                            }`}
                          >
                            {subscription.daysRemaining === 0
                              ? "Expires today"
                              : `${subscription.daysRemaining} days`}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={subscription.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer information */}
      <p className="text-xs leading-5 text-slate-400">
        Renewal history is read-only on this page. Renewal activation and
        payment recording continue through the existing subscription payment
        workflow and scheduled renewal processor.
      </p>
    </main>
  );
}