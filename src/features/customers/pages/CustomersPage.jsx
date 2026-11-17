
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserRoundPlus,
  Search,
  RefreshCw,
  Phone,
  MapPin,
  Eye,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  UserCheck,
  UserRoundX,
  Droplets,
  RotateCcw,
  Filter,
  ChevronDown,
  Wallet,
  Upload,
} from "lucide-react";

import CustomerSubscriptionUsage from "../components/CustomerSubscriptionUsage";
import { useCustomers } from "../hooks/useCustomers";
import { supabase } from "../../../lib/supabase/client";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function SummaryCard({ title, value, subtitle, icon: Icon, tone }) {
  const tones = {
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            {title}
          </p>

          <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:mt-2 sm:text-2xl">
            {value}
          </p>

          <p className="mt-1 hidden text-xs text-slate-400 sm:block">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10 sm:rounded-xl ${tones[tone] || tones.teal
            }`}
        >
          <Icon size={18} className="sm:size-5" />
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ archived }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${archived
        ? "bg-slate-100 text-slate-600"
        : "bg-emerald-50 text-emerald-700"
        }`}
    >
      <span
        className={`size-1.5 rounded-full ${archived ? "bg-slate-400" : "bg-emerald-500"
          }`}
      />

      {archived ? "Archived" : "Active"}
    </span>
  );
}

function IconButton({
  title,
  onClick,
  children,
  danger = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex size-9 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-40 ${danger
        ? "border-rose-100 text-rose-600 hover:border-rose-200 hover:bg-rose-50"
        : "border-slate-200 text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
        }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ archived, hasSearch, onReset }) {
  return (
    <div className="flex flex-col items-center px-5 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <Users size={29} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">
        {hasSearch
          ? "No matching customers"
          : archived
            ? "No archived customers"
            : "No customers yet"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {hasSearch
          ? "Try a different name, mobile number, area, or customer code."
          : archived
            ? "Archived customers will appear here."
            : "Add your first customer to start managing deliveries and account records."}
      </p>

      {hasSearch && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw size={15} />
          Clear filters
        </button>
      )}

      {!archived && !hasSearch && (
        <Link
          to="/customers/new"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          <UserRoundPlus size={17} />
          Add Customer
        </Link>
      )}
    </div>
  );
}

function CustomerAvatar({ name }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-sm font-bold text-teal-800">
      {String(name || "C").trim().charAt(0).toUpperCase()}
    </div>
  );
}

function SwipeToDelete({ children, onDelete, disabled = false }) {
  const startX = useRef(0);
  const [offset, setOffset] = useState(0);
  const revealWidth = 92;

  function handleTouchStart(event) {
    startX.current = event.touches[0]?.clientX || 0;
  }

  function handleTouchEnd(event) {
    const endX = event.changedTouches[0]?.clientX || startX.current;
    const delta = endX - startX.current;

    if (delta < -35) setOffset(-revealWidth);
    else if (delta > 35) setOffset(0);
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOffset(0);
          onDelete();
        }}
        className="absolute inset-y-0 right-0 flex w-[92px] flex-col items-center justify-center gap-2 bg-rose-600 text-white transition hover:bg-rose-700 disabled:opacity-60"
        aria-label="Delete customer"
      >
        <Trash2 size={21} />
        <span className="text-xs font-semibold">Delete</span>
      </button>

      <div
        className="relative bg-white transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const {
    customers = [],
    loading,
    error,
    archiveCustomer,
    restoreCustomer,
    deleteCustomer,

    subscriptionUsage,
    subscriptionLoading,
    subscriptionError,
    refreshSubscription,
  } = useCustomers({ includeArchived: true });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [customerFinance, setCustomerFinance] = useState({});
  const [customerJarBalances, setCustomerJarBalances] = useState({});
  const [financeLoading, setFinanceLoading] = useState(true);

  const loadCustomerFinance = useCallback(async () => {
    setFinanceLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Please sign in to continue.");

      const { data: business, error: businessError } =
        await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", user.id)
          .single();

      if (businessError) throw businessError;

      const [
        deliveriesResult,
        paymentsResult,
        jarTransactionsResult,
      ] = await Promise.all([
        supabase
          .from("deliveries")
          .select("customer_id, amount")
          .eq("business_id", business.id),

        supabase
          .from("payments")
          .select("customer_id, amount")
          .eq("business_id", business.id),

        supabase
          .from("jar_transactions")
          .select("customer_id, movement_type, quantity")
          .eq("business_id", business.id)
          .not("customer_id", "is", null)
          .in("movement_type", ["delivered", "returned"]),
      ]);

      const failed = [
        deliveriesResult,
        paymentsResult,
        jarTransactionsResult,
      ].find((result) => result.error);

      if (failed) throw failed.error;

      const finance = {};

      for (const customer of customers) {
        finance[customer.id] = {
          delivered: 0,
          paid: 0,
        };
      }

      for (const row of deliveriesResult.data || []) {
        if (!finance[row.customer_id]) {
          finance[row.customer_id] = {
            delivered: 0,
            paid: 0,
          };
        }

        finance[row.customer_id].delivered += Number(
          row.amount || 0
        );
      }

      for (const row of paymentsResult.data || []) {
        if (!finance[row.customer_id]) {
          finance[row.customer_id] = {
            delivered: 0,
            paid: 0,
          };
        }

        finance[row.customer_id].paid += Number(
          row.amount || 0
        );
      }

      setCustomerFinance(finance);

      // Customer jar balance = delivered jars - returned jars.
      // Stock-in transactions are intentionally excluded.
      const jarBalances = {};

      for (const customer of customers) {
        jarBalances[customer.id] = 0;
      }

      for (const row of jarTransactionsResult.data || []) {
        if (!row.customer_id) continue;

        if (jarBalances[row.customer_id] === undefined) {
          jarBalances[row.customer_id] = 0;
        }

        const quantity = Number(row.quantity || 0);

        if (row.movement_type === "delivered") {
          jarBalances[row.customer_id] += quantity;
        } else if (row.movement_type === "returned") {
          jarBalances[row.customer_id] -= quantity;
        }
      }

      setCustomerJarBalances(jarBalances);
      setActionError("");
    } catch (err) {
      setActionError(
        err?.message || "Unable to load customer account totals."
      );
    } finally {
      setFinanceLoading(false);
    }
  }, [customers]);

  useEffect(() => {
    void loadCustomerFinance();
  }, [loadCustomerFinance]);

  useEffect(() => {
    const handleJarUpdate = () => {
      void loadCustomerFinance();
    };

    window.addEventListener(
      "amrit-jal-jars-updated",
      handleJarUpdate
    );

    return () => {
      window.removeEventListener(
        "amrit-jal-jars-updated",
        handleJarUpdate
      );
    };
  }, [loadCustomerFinance]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers
      .filter((customer) => {
        const matchesSearch = [
          customer.name,
          customer.phone,
          customer.code,
          customer.area,
          customer.address,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

        const archived = Boolean(customer.archived);

        const matchesStatus =
          status === "all" ||
          (status === "active" && !archived) ||
          (status === "archived" && archived);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
  }, [customers, search, status]);

  const activeCount = customers.filter(
    (customer) => !customer.archived
  ).length;

  const archivedCount = customers.filter(
    (customer) => customer.archived
  ).length;

  const totalDue = customers
    .filter((customer) => !customer.archived)
    .reduce((total, customer) => {
      const finance = customerFinance[customer.id] || {};

      const due =
        Number(customer.openingBalance || 0) +
        Number(finance.delivered || 0) -
        Number(finance.paid || 0);

      return total + Math.max(0, due);
    }, 0);

  async function runAction(customer, action, successMessage) {
    if (typeof action !== "function") {
      setActionError(
        "This action is not available. Please check the customer hook."
      );
      return;
    }

    setActionError("");
    setActionSuccess("");
    setActionLoading(customer.id);

    try {
      await action(customer.id);
      await loadCustomerFinance();

      setActionSuccess(successMessage);
    } catch (err) {
      setActionError(
        err?.message || "The action could not be completed."
      );
    } finally {
      setActionLoading("");
    }
  }

  async function handleArchive(customer) {
    const confirmed = window.confirm(
      `Archive "${customer.name}"? You can restore this customer later.`
    );

    if (!confirmed) return;

    await runAction(
      customer,
      archiveCustomer,
      `${customer.name} has been archived.`
    );
  }

  async function handleRestore(customer) {
    await runAction(
      customer,
      restoreCustomer,
      `${customer.name} has been restored.`
    );
  }

  async function handleDelete() {
    if (!confirmDelete) return;

    const customer = confirmDelete;
    setConfirmDelete(null);

    await runAction(
      customer,
      deleteCustomer,
      `${customer.name} has been permanently deleted.`
    );
  }

  function clearFilters() {
    setSearch("");
    setStatus("all");
  }


  // SEO metadata
  useEffect(() => {
    const previousTitle = document.title;

    const descriptionSelector = 'meta[name="description"]';
    const robotsSelector = 'meta[name="robots"]';

    const previousDescription =
      document.querySelector(descriptionSelector);

    const previousRobots =
      document.querySelector(robotsSelector);

    const oldDescription = previousDescription?.content;
    const oldRobots = previousRobots?.content;

    const description =
      previousDescription || document.createElement("meta");

    const robots =
      previousRobots || document.createElement("meta");

    document.title = "Customers | Amrit Jal";

    description.name = "description";
    description.content =
      "Manage customer profiles, contact details, delivery records, account balances, outstanding dues and customer groups in Amrit Jal.";

    robots.name = "robots";
    robots.content = "noindex, nofollow";

    if (!previousDescription) {
      document.head.appendChild(description);
    }

    if (!previousRobots) {
      document.head.appendChild(robots);
    }

    return () => {
      document.title = previousTitle;

      if (previousDescription) {
        previousDescription.content = oldDescription || "";
      } else {
        description.remove();
      }

      if (previousRobots) {
        previousRobots.content = oldRobots || "";
      } else {
        robots.remove();
      }
    };
  }, []);

  return (
    <main className="min-h-full w-full bg-slate-50 text-slate-800">
      <div className="mx-auto w-full max-w-[1600px] space-y-3 px-2.5 py-3 sm:space-y-5 sm:px-5 sm:py-4 lg:px-7">


        {/* FEEDBACK */}

        {actionSuccess && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />

            <p className="flex-1">{actionSuccess}</p>

            <button
              type="button"
              onClick={() => setActionSuccess("")}
              aria-label="Dismiss success message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {(actionError || error) && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />

            <p className="flex-1">
              {actionError || error}
            </p>

            <button
              type="button"
              onClick={() => setActionError("")}
              aria-label="Dismiss error message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* SUMMARY CARDS */}

        <section className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
          <SummaryCard
            title="All Customers"
            value={customers.length}
            subtitle="Total customer records"
            icon={Users}
            tone="teal"
          />

          <SummaryCard
            title="Active Customers"
            value={activeCount}
            subtitle="Available for regular service"
            icon={UserCheck}
            tone="blue"
          />

          <SummaryCard
            title="Archived Customers"
            value={archivedCount}
            subtitle="Inactive customer records"
            icon={UserRoundX}
            tone="amber"
          />

          <SummaryCard
            title="Total Outstanding"
            value={
              financeLoading ? "Loading..." : currency(totalDue)
            }
            subtitle="Active customer dues"
            icon={Wallet}
            tone="violet"
          />
        </section>

        <div className="-mt-1 min-w-0">
          <CustomerSubscriptionUsage
            usage={subscriptionUsage}
            loading={subscriptionLoading}
            error={subscriptionError}
            onRetry={refreshSubscription}
          />
        </div>

        {/* CUSTOMER LIST */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">

          {/* TOOLBAR */}

          <div className="border-b border-slate-100 p-3 sm:p-5">
            <div className="flex flex-col gap-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <div className="relative min-w-0 flex-1">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 sm:left-4"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, mobile, area or customer ID..."
                  aria-label="Search customers"
                  className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-2 text-xs outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50 sm:h-11 sm:pl-11 sm:pr-4 sm:text-sm"
                />
                </div>

                <button
                  type="button"
                  onClick={() => setShowFilters((value) => !value)}
                  aria-expanded={showFilters}
                  className={`inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-xl border px-2.5 text-[11px] font-semibold transition sm:h-11 sm:gap-1.5 sm:px-4 sm:text-sm ${showFilters
                    ? "border-teal-200 bg-teal-50 text-teal-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  <Filter size={15} />
                  <span>Filters</span>

                  <ChevronDown
                    size={15}
                    className={`transition ${showFilters ? "rotate-180" : ""
                      }`}
                  />

                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Link
                  to="/customers/import"
                  className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-xl border border-teal-200 bg-white px-2 text-[11px] font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50 sm:h-11 sm:gap-2 sm:px-4 sm:text-sm"
                >
                  <Upload size={15} className="shrink-0 sm:size-[17px]" />
                  <span className="truncate">Import Customers</span>
                </Link>

                <Link
                  to="/customers/new"
                  className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-xl bg-teal-700 px-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-teal-800 sm:h-11 sm:gap-2 sm:px-4 sm:text-sm"
                >
                  <UserRoundPlus size={15} className="shrink-0 sm:size-[17px]" />
                  <span className="truncate">Add Customer</span>
                </Link>

                {(search || status !== "all") && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  >
                    <RotateCcw size={15} />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-4">
                <label
                  htmlFor="customer-status-filter"
                  className="text-sm font-semibold text-slate-600"
                >
                  Customer status
                </label>

                <select
                  id="customer-status-filter"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="min-w-44 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
                >
                  <option value="all">All customers</option>
                  <option value="active">Active only</option>
                  <option value="archived">Archived only</option>
                </select>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>{customers.length} total records</span>
                <span>{activeCount} active</span>
                <span>{archivedCount} archived</span>
              </div>

              <span>
                {filteredCustomers.length} result
                {filteredCustomers.length === 1 ? "" : "s"} shown
              </span>
            </div>
          </div>

          {/* LOADING / EMPTY / DATA */}

          {loading ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <LoaderCircle
                size={30}
                className="animate-spin text-teal-700"
              />

              <p className="mt-4 text-sm font-semibold text-slate-700">
                Loading customers...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please wait while records are fetched.
              </p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <EmptyState
              archived={status === "archived"}
              hasSearch={Boolean(search || status !== "all")}
              onReset={clearFilters}
            />
          ) : (
            <>
              {/* MOBILE LAYOUT — reference-style horizontal customer cards */}

              <div className="space-y-3 bg-slate-100 p-3 md:hidden">
                {filteredCustomers.map((customer) => {
                  const finance = customerFinance[customer.id] || {};
                  const due = Math.max(
                    0,
                    Number(customer.openingBalance || 0) +
                      Number(finance.delivered || 0) -
                      Number(finance.paid || 0)
                  );
                  const jarBalance = Math.max(
                    0,
                    Number(customerJarBalances[customer.id] || 0)
                  );

                  return (
                    <SwipeToDelete
                      key={customer.id}
                      disabled={actionLoading === customer.id}
                      onDelete={() => setConfirmDelete(customer)}
                    >
                      <article className="bg-white px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/customers/${customer.id}`}
                            aria-label={`View ${customer.name}`}
                            className="flex size-[68px] shrink-0 items-center justify-center rounded-full bg-cyan-100 text-2xl font-bold text-cyan-800 ring-4 ring-cyan-50"
                          >
                            {String(customer.name || "C").trim().charAt(0).toUpperCase()}
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                to={`/customers/${customer.id}`}
                                className="break-words text-[17px] font-medium leading-6 text-slate-900"
                              >
                                {customer.name}
                              </Link>
                              <StatusBadge archived={customer.archived} />
                            </div>

                            {customer.phone && (
                              <p className="mt-1.5 text-sm text-slate-500">
                                {customer.phone}
                              </p>
                            )}

                            <p className="mt-1 text-sm text-slate-400">
                              {customer.groupName || "Customer"}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-center gap-3">
                            {customer.phone ? (
                              <a
                                href={`tel:${customer.phone}`}
                                aria-label={`Call ${customer.name}`}
                                className="text-sky-600"
                              >
                                <Phone size={23} fill="currentColor" />
                              </a>
                            ) : null}
                            <Link
                              to={`/customers/${customer.id}`}
                              aria-label={`Open account for ${customer.name}`}
                              className="text-sky-600"
                            >
                              <Wallet size={25} />
                            </Link>
                          </div>
                        </div>

                        <div className="my-4 border-t border-slate-300" />

                        <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">
                          <div className="px-1">
                            <p className="text-[13px] font-semibold text-sky-600">
                              {financeLoading ? "..." : jarBalance}
                            </p>
                            <p className="mt-1 text-xs leading-4 text-slate-400">Balance Jar</p>
                          </div>
                          <div className="px-1">
                            <p className={`text-[13px] font-bold ${due > 0 ? "text-rose-600" : "text-slate-900"}`}>
                              {financeLoading ? "Loading..." : currency(due)}
                            </p>
                            <p className="mt-1 text-xs leading-4 text-slate-400">Total Due</p>
                          </div>
                          <div className="px-1">
                            <p className="text-[13px] font-semibold text-teal-700">
                              {currency(customer.jarRate)}
                            </p>
                            <p className="mt-1 text-xs leading-4 text-slate-400">Per Jar</p>
                          </div>
                        </div>
                      </article>
                    </SwipeToDelete>
                  );
                })}
              </div>

              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1050px] border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-4 font-semibold">
                        Customer
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Shift
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Due Amount
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Balance Jar
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Group
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((customer) => {
                      const finance = customerFinance[customer.id] || {};

                      const due = Math.max(
                        0,
                        Number(customer.openingBalance || 0) +
                          Number(finance.delivered || 0) -
                          Number(finance.paid || 0)
                      );

                      const jarBalance = Math.max(
                        0,
                        Number(customerJarBalances[customer.id] || 0)
                      );

                      return (
                        <tr
                          key={customer.id}
                          className="transition hover:bg-teal-50/30"
                        >
                          <td className="px-5 py-4">
                            <Link
                              to={`/customers/${customer.id}`}
                              className="flex items-center gap-3"
                            >
                              <CustomerAvatar name={customer.name} />

                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900">
                                  {customer.name}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {customer.code
                                    ? `ID: ${customer.code}`
                                    : "Customer"}
                                </p>
                              </div>
                            </Link>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {customer.shift || customer.shifts || "—"}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${financeLoading
                                ? "bg-slate-100 text-slate-500"
                                : due > 0
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-emerald-50 text-emerald-700"
                                }`}
                            >
                              {financeLoading
                                ? "Loading..."
                                : currency(due)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex min-w-10 justify-center rounded-full px-3 py-1.5 text-xs font-semibold ${jarBalance > 0
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                                }`}
                            >
                              {financeLoading ? "..." : jarBalance}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm font-medium text-slate-700">
                            {customer.groupName || "General"}
                          </td>



                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1.5">

                              <Link
                                to={`/customers/${customer.id}/edit`}
                                title="Edit customer"
                                aria-label="Edit customer"
                                className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                              >
                                <Pencil size={16} />
                              </Link>

                              {customer.archived ? (
                                <>
                                  <IconButton
                                    title="Restore customer"
                                    disabled={actionLoading === customer.id}
                                    onClick={() =>
                                      void handleRestore(customer)
                                    }
                                  >
                                    <ArchiveRestore size={16} />
                                  </IconButton>

                                  <IconButton
                                    title="Permanently delete customer"
                                    danger
                                    disabled={actionLoading === customer.id}
                                    onClick={() =>
                                      setConfirmDelete(customer)
                                    }
                                  >
                                    <Trash2 size={16} />
                                  </IconButton>
                                </>
                              ) : (
                                <IconButton
                                  title="Archive customer"
                                  disabled={actionLoading === customer.id}
                                  onClick={() =>
                                    void handleArchive(customer)
                                  }
                                >
                                  <Archive size={16} />
                                </IconButton>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* TABLE FOOTER */}

              <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p>
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredCustomers.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {customers.length}
                  </span>{" "}
                  customers
                </p>

                <p>
                  Select a customer to view their full profile.
                </p>
              </div>
            </>
          )}
        </section>
      </div>

      {/* PERMANENT DELETE CONFIRMATION */}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmDelete(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-customer-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Trash2 size={23} />
            </div>

            <h2
              id="delete-customer-title"
              className="mt-4 text-lg font-bold text-slate-900"
            >
              Permanently delete customer?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              You are about to delete{" "}
              <span className="font-semibold text-slate-900">
                {confirmDelete.name}
              </span>
              . This action may be irreversible and could affect linked
              records.
            </p>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={actionLoading === confirmDelete.id}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading === confirmDelete.id && (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                )}

                Delete Customer
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
