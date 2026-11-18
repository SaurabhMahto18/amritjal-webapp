import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  RefreshCw,
  RotateCcw,
  Trash2,
  UserRound,
  X,
  Package,
  IndianRupee,
} from "lucide-react";

import useDeliveries from "../hooks/useDeliveries";
import DeliveryBulkEntry from "../components/DeliveryBulkEntry";
import deliveryService from "../services/deliveryService";

const today = () => {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10";

export default function DeliveriesPage() {
  const {
    deliveries,
    customers,
    employees,
    products,
    groups,
    balances,
    loading,
    error,
    refresh,
    createDelivery,
    deleteDelivery,
    getCustomerRatePlans,
  } = useDeliveries();

  const [dateFilter, setDateFilter] = useState(today());
  const [customerFilter, setCustomerFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [search, setSearch] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [deletingId, setDeletingId] = useState("");
  const [pageError, setPageError] = useState("");
  const [success, setSuccess] = useState("");

  const [groupMap, setGroupMap] = useState({});

  // Private workspace SEO: operational delivery data must not be indexed.
  useEffect(() => {
    const previousTitle = document.title;
    const descriptionSelector = 'meta[name="description"]';
    const robotsSelector = 'meta[name="robots"]';
    const previousDescription = document.head.querySelector(descriptionSelector);
    const previousRobots = document.head.querySelector(robotsSelector);
    const description = previousDescription || document.createElement("meta");
    const robots = previousRobots || document.createElement("meta");
    const oldDescription = previousDescription?.getAttribute("content");
    const oldRobots = previousRobots?.getAttribute("content");

    document.title = "Deliveries | Amrit Jal";
    description.setAttribute("name", "description");
    description.setAttribute(
      "content",
      "Manage daily customer water deliveries, jar quantities, delivery shifts and customer-wise delivery records in Amrit Jal."
    );
    robots.setAttribute("name", "robots");
    robots.setAttribute("content", "noindex, nofollow");

    if (!previousDescription) document.head.appendChild(description);
    if (!previousRobots) document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;
      if (previousDescription) {
        if (oldDescription === null) previousDescription.removeAttribute("content");
        else previousDescription.setAttribute("content", oldDescription || "");
      } else {
        description.remove();
      }
      if (previousRobots) {
        if (oldRobots === null) previousRobots.removeAttribute("content");
        else previousRobots.setAttribute("content", oldRobots || "");
      } else {
        robots.remove();
      }
    };
  }, []);

  // ------------------------------------------
  // GROUP LOOKUP
  // ------------------------------------------

  async function loadGroupMap() {
    try {
      const result =
        await deliveryService.getCustomerGroupMap();

      setGroupMap(result || {});
    } catch (err) {
      setPageError(
        err?.message || "Unable to load customer groups."
      );
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchGroupMap() {
      try {
        const result =
          await deliveryService.getCustomerGroupMap();

        if (!cancelled) {
          setGroupMap(result || {});
        }
      } catch (err) {
        if (!cancelled) {
          setPageError(
            err?.message || "Unable to load customer groups."
          );
        }
      }
    }

    fetchGroupMap();

    return () => {
      cancelled = true;
    };
  }, []);

  // Resolve customer group from membership map first,
  // then fall back to direct customer group fields.
  function getCustomerGroupId(customer) {
    if (!customer) return "";

    const membership = groupMap[customer.id];

    const groupId =
      membership?.id ??
      customer.group_id ??
      customer.groupId ??
      customer.customer_group_id ??
      "";

    return String(groupId || "");
  }

  // ------------------------------------------
  // FILTERED CUSTOMERS
  // ------------------------------------------

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const searchable = [
        customer.name,
        customer.phone,
        customer.area,
        customer.address,
        customer.code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchable.includes(query);

      const matchesCustomer =
        !customerFilter ||
        String(customer.id) === String(customerFilter);

      const customerGroupId =
        getCustomerGroupId(customer);

      const matchesGroup =
        !groupFilter ||
        customerGroupId === String(groupFilter);

      return (
        matchesSearch &&
        matchesCustomer &&
        matchesGroup
      );
    });
  }, [
    customers,
    search,
    customerFilter,
    groupFilter,
    groupMap,
  ]);

  // ------------------------------------------
  // DELIVERY RECORDS FOR SELECTED DATE
  // ------------------------------------------

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((delivery) => {
      const matchesDate =
        !dateFilter || delivery.date === dateFilter;

      const matchesShift =
        !shiftFilter ||
        String(delivery.shift || "").toLowerCase() ===
        shiftFilter.toLowerCase();

      const matchesEmployee =
        !employeeFilter ||
        String(delivery.deliveredBy || "") ===
        String(employeeFilter);

      const matchesCustomer =
        !customerFilter ||
        String(delivery.customerId) ===
        String(customerFilter);

      const customer = customers.find(
        (item) =>
          String(item.id) === String(delivery.customerId)
      );

      const customerGroupId =
        getCustomerGroupId(customer);

      const matchesGroup =
        !groupFilter ||
        customerGroupId === String(groupFilter);

      return (
        matchesDate &&
        matchesShift &&
        matchesEmployee &&
        matchesCustomer &&
        matchesGroup
      );
    });
  }, [
    deliveries,
    customers,
    dateFilter,
    shiftFilter,
    employeeFilter,
    customerFilter,
    groupFilter,
    groupMap,
  ]);

  // ------------------------------------------
  // ONE CARD PER CUSTOMER
  // ------------------------------------------

  const deliveryByCustomer = useMemo(() => {
    const map = {};

    filteredDeliveries.forEach((delivery) => {
      const existing = map[delivery.customerId];

      if (
        !existing ||
        new Date(delivery.createdAt || 0) >
        new Date(existing.createdAt || 0)
      ) {
        map[delivery.customerId] = delivery;
      }
    });

    return map;
  }, [filteredDeliveries]);

  // ------------------------------------------
  // SUMMARY
  // ------------------------------------------

  const summary = useMemo(() => {
    const recorded = filteredCustomers.filter(
      (customer) => deliveryByCustomer[customer.id]
    );

    const totalAmount = recorded.reduce(
      (sum, customer) =>
        sum +
        Number(
          deliveryByCustomer[customer.id]?.amount || 0
        ),
      0
    );

    const totalDue = filteredCustomers.reduce(
      (sum, customer) =>
        sum + Number(balances[customer.id] || 0),
      0
    );

    const totalJars = recorded.reduce(
      (sum, customer) => {
        const delivery = deliveryByCustomer[customer.id];

        return (
          sum +
          Number(delivery?.quantity || 0)
        );
      },
      0
    );

    return {
      recorded: recorded.length,
      pending: filteredCustomers.length - recorded.length,
      totalAmount,
      totalDue,
      totalJars,
    };
  }, [
    filteredCustomers,
    deliveryByCustomer,
    balances,
  ]);

  // ------------------------------------------
  // RESET FILTERS
  // ------------------------------------------

  function resetFilters() {
    setDateFilter(today());
    setCustomerFilter("");
    setGroupFilter("");
    setShiftFilter("");
    setEmployeeFilter("");
    setSearch("");
    setPageError("");
    setSuccess("");
  }

  async function handleBulkSubmit(payloads) {
    setPageError("");
    setSuccess("");

    const saved = [];
    const failed = [];

    for (const payload of payloads) {
      try {
        await deliveryService.saveBulkDeliveryDay({
          customerId: payload.customerId,
          date: payload.date,
          shift: payload.shift,
          items: payload.items,
          notes: payload.notes,
        });

        saved.push({
          customerId: payload.customerId,
          customerName: payload.customerName,
        });
      } catch (err) {
        failed.push({
          customerId: payload.customerId,
          customerName: payload.customerName,
          error: err.message || "Unable to save delivery.",
        });
      }
    }

    if (saved.length > 0) {
      await refresh();
      await loadGroupMap();
    }

    if (failed.length > 0) {
      setPageError(
        `${saved.length} saved, ${failed.length} failed: ` +
        failed.map(
          (item) => `${item.customerName}: ${item.error}`
        ).join(" | ")
      );
    } else {
      setSuccess(
        `All ${saved.length} customer deliveries saved successfully.`
      );
    }

    return { saved, failed };
  }
  // ------------------------------------------
  // DELETE DELIVERY
  // ------------------------------------------

  async function handleDelete(delivery) {
    const confirmed = window.confirm(
      `Delete delivery for ${delivery.customerName}? This will also remove its linked jar movements.`
    );

    if (!confirmed) return;

    setDeletingId(delivery.id);
    setPageError("");
    setSuccess("");

    try {
      await deleteDelivery(delivery.id);
      setSuccess("Delivery deleted successfully.");
    } catch (err) {
      setPageError(
        err?.message || "Unable to delete delivery."
      );
    } finally {
      setDeletingId("");
    }
  }

  // ------------------------------------------
  // REFRESH
  // ------------------------------------------

  async function handleRefresh() {
    setPageError("");
    setSuccess("");

    try {
      await refresh();
      await loadGroupMap();
    } catch (err) {
      setPageError(
        err?.message || "Unable to refresh delivery data."
      );
    }
  }


  // ------------------------------------------
  // PAGE UI
  // ------------------------------------------

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto w-full max-w-[1600px] space-y-2.5 px-2.5 py-2.5 sm:space-y-4 sm:px-5 sm:py-4 lg:px-8">
        

        {/* ALERTS */}
        {(pageError || error) && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:p-4">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="min-w-0 flex-1 break-words">{pageError || error}</span>
            <button type="button" onClick={() => setPageError("")} className="shrink-0 rounded-lg p-1 hover:bg-red-100" aria-label="Dismiss error">
              <X size={16} />
            </button>
          </div>
        )}
        {success && (
          <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 sm:p-4">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span className="min-w-0 flex-1 break-words">{success}</span>
            <button type="button" onClick={() => setSuccess("")} className="shrink-0 rounded-lg p-1 hover:bg-emerald-100" aria-label="Dismiss success">
              <X size={16} />
            </button>
          </div>
        )}

        {/* RESPONSIVE KPI GRID: 2 mobile / 2 tablet / 4 desktop */}
        <section aria-label="Delivery summary" className="grid grid-cols-4 gap-1.5 sm:gap-3">
          <SummaryCard icon={<UserRound size={18} />} label="Customers" value={filteredCustomers.length} tone="navy" />
          <SummaryCard icon={<CheckCircle2 size={18} />} label="Delivered" value={summary.recorded} tone="teal" />
          <SummaryCard icon={<Clock3 size={18} />} label="Pending" value={summary.pending} tone="amber" />
          <SummaryCard icon={<IndianRupee size={18} />} label="Delivery value" value={money(summary.totalAmount)} tone="blue" />
        </section>

        {/* FILTERS */}
        <section id="delivery-filters" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Filter size={17} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900">Find deliveries</h2>
                <p className="hidden text-xs text-slate-500 sm:block">Filter by date, customer, group, shift or delivery person.</p>
                <p className="text-[11px] text-slate-500 sm:hidden">Date, customer, group and shift</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {showFilters && (
                <button type="button" onClick={resetFilters} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-teal-700 hover:bg-teal-50">
                  <RotateCcw size={13} /> Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFilters((previous) => !previous)}
                aria-expanded={showFilters}
                aria-controls="delivery-filter-fields"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {showFilters ? "Close" : "Open"}
                <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
          {showFilters && (
            <div id="delivery-filter-fields" className="border-t border-slate-100 bg-slate-50/70 p-2.5 sm:p-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <FilterField label="Delivery date">
                  <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className={inputClass} />
                </FilterField>
                <FilterField label="Customer">
                  <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className={inputClass}>
                    <option value="">All customers</option>
                    {filteredCustomers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </select>
                </FilterField>
                <FilterField label="Customer group">
                  <select value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setCustomerFilter(""); }} className={inputClass}>
                    <option value="">All groups</option>
                    {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                  </select>
                </FilterField>
                <FilterField label="Delivery shift">
                  <select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)} className={inputClass}>
                    <option value="">All shifts</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                  </select>
                </FilterField>
                <FilterField label="Search customer">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, phone, area..." className={inputClass} />
                </FilterField>
                <FilterField label="Delivery person">
                  <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className={inputClass}>
                    <option value="">All delivery persons</option>
                    {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name || employee.full_name || "Employee"}</option>)}
                  </select>
                </FilterField>
              </div>
            </div>
          )}
        </section>

        {/* DELIVERY WORKSPACE */}
        <section aria-label="Customer delivery entry" className="min-w-0">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center sm:py-16">
              <RefreshCw size={26} className="mx-auto animate-spin text-teal-700" />
              <p className="mt-3 text-sm font-semibold text-slate-600">Loading delivery records...</p>
              <p className="mt-1 text-xs text-slate-400">Please wait while we prepare your delivery list.</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center sm:py-16">
              <Package size={32} className="mx-auto text-slate-300" />
              <h2 className="mt-3 font-bold text-slate-800">No customers found</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Try another group, date or search term to find customers.</p>
              <button type="button" onClick={resetFilters} className="mt-4 min-h-11 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">
                Reset filters
              </button>
            </div>
          ) : (
            <DeliveryBulkEntry
              customers={filteredCustomers}
              products={products}
              balances={balances}
              date={dateFilter}
              shift={shiftFilter || "morning"}
              getCustomerRatePlans={getCustomerRatePlans}
              onSubmit={handleBulkSubmit}
            />
          )}
        </section>
      </div>
    </main>
  );
}

/* ---------------------------------
   SMALL COMPONENTS
--------------------------------- */

function SummaryCard({ icon, label, value, tone }) {
  const tones = {
    navy: "bg-slate-100 text-[#102C46]",
    teal: "bg-teal-50 text-teal-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-2 shadow-sm sm:rounded-xl sm:p-3 lg:p-4">
      <div className="flex min-h-7 flex-col items-start justify-between gap-1 sm:min-h-0 sm:flex-row sm:items-center sm:gap-1.5">
        <p className="w-full min-w-0 break-words text-[8px] font-bold uppercase leading-tight tracking-tight text-slate-500 sm:text-xs">{label}</p>
        <div className={`hidden size-8 shrink-0 items-center justify-center rounded-lg sm:flex sm:size-9 sm:rounded-xl ${tones[tone]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-1 min-w-0 break-all text-sm font-extrabold leading-tight tracking-tight text-[#102C46] sm:mt-2 sm:break-words sm:text-xl">{value}</p>
    </article>
  );
}

function FilterField({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      {children}
    </label>
  );
}