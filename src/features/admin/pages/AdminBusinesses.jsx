
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

import BusinessStatusBadge from "../components/BusinessStatusBadge";
import BusinessStatusModal from "../components/BusinessStatusModal";

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const active = status === "active";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

function SummaryCard({ title, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [accessStatuses, setAccessStatuses] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [accessError, setAccessError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");

  const [selectedBusiness, setSelectedBusiness] = useState(null);

  // Load businesses and their suspension status
  const loadBusinesses = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setAccessError("");

      // Fetch businesses
      const { data, error: queryError } = await supabase
        .from("businesses")
        .select(
          "id, name, legal_name, email, phone, district, state, status, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (queryError) throw queryError;

      const businessList = data || [];
      setBusinesses(businessList);

      // Fetch suspension records
      if (businessList.length > 0) {
        const businessIds = businessList.map((business) => business.id);

        const {
          data: accessData,
          error: accessQueryError,
        } = await supabase
          .from("business_access_controls")
          .select(
            "business_id, is_suspended, suspension_reason, suspended_at, suspended_by, updated_at"
          )
          .in("business_id", businessIds);

        if (accessQueryError) {
          throw accessQueryError;
        }

        const statusMap = {};

        (accessData || []).forEach((item) => {
          statusMap[item.business_id] = item;
        });

        setAccessStatuses(statusMap);
      } else {
        setAccessStatuses({});
      }
    } catch (err) {
      console.error("Business list error:", err);

      // Preserve business list if only suspension status fails.
      if (businesses.length > 0 && !isRefresh) {
        setAccessError(err.message);
      } else {
        setError(err.message || "Unable to load registered businesses.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businesses.length]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  // Search and filters
  const filteredBusinesses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return businesses.filter((business) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          business.name,
          business.legal_name,
          business.email,
          business.phone,
          business.district,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch)
          );

      const matchesStatus =
        statusFilter === "all" ||
        business.status === statusFilter;

      const isSuspended =
        accessStatuses[business.id]?.is_suspended === true;

      const matchesAccess =
        accessFilter === "all" ||
        (accessFilter === "suspended" && isSuspended) ||
        (accessFilter === "active" && !isSuspended);

      return matchesSearch && matchesStatus && matchesAccess;
    });
  }, [businesses, search, statusFilter, accessFilter, accessStatuses]);

  // Summary calculations
  const activeCount = businesses.filter(
    (business) => business.status === "active"
  ).length;

  const inactiveCount = businesses.length - activeCount;

  const suspendedCount = businesses.filter(
    (business) =>
      accessStatuses[business.id]?.is_suspended === true
  ).length;

  // Update suspension status after modal action
  const handleStatusSuccess = (updatedStatus) => {
    if (!selectedBusiness) return;

    setAccessStatuses((previous) => ({
      ...previous,
      [selectedBusiness.id]: updatedStatus,
    }));

    setSelectedBusiness(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
            Platform Management
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Businesses
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View, monitor and manage all registered businesses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadBusinesses(true)}
          disabled={loading || refreshing}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {accessError && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          Suspension information could not be loaded: {accessError}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Businesses Loaded"
          value={loading ? "—" : businesses.length}
          description="Latest 100 registered businesses"
        />

        <SummaryCard
          title="Active Businesses"
          value={loading ? "—" : activeCount}
          description="Based on business account status"
        />

        <SummaryCard
          title="Other Statuses"
          value={loading ? "—" : inactiveCount}
          description="Inactive or archived businesses"
        />

        <SummaryCard
          title="Suspended Businesses"
          value={loading ? "—" : suspendedCount}
          description="Restricted by platform admin"
        />
      </div>

      {/* Registered Businesses */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              Registered Businesses
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Search, filter and manage business accounts.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50 sm:w-64"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-cyan-600"
            >
              <option value="all">All account statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={accessFilter}
              onChange={(event) => setAccessFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-cyan-600"
            >
              <option value="all">All access statuses</option>
              <option value="active">Not suspended</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading businesses...
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-semibold text-slate-700">
              No businesses found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">

              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Business
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Contact
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Location
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Account Status
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Access Status
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Registered
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredBusinesses.map((business) => {
                  const accessStatus =
                    accessStatuses[business.id] || {
                      is_suspended: false,
                    };

                  return (
                    <tr
                      key={business.id}
                      className="hover:bg-slate-50/70"
                    >

                      {/* Business Name - Click to Details */}
                      <td className="px-5 py-4">
                        <Link
                          to={`/admin/businesses/${business.id}`}
                          className="font-semibold text-slate-900 transition-colors hover:text-cyan-700 hover:underline"
                        >
                          {business.name || "Unnamed business"}
                        </Link>

                        {business.legal_name && (
                          <p className="mt-1 text-xs text-slate-500">
                            {business.legal_name}
                          </p>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        <p className="text-slate-700">
                          {business.phone || "No phone"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {business.email || "No email"}
                        </p>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-4 text-slate-600">
                        {[business.district, business.state]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </td>

                      {/* Original Business Status */}
                      <td className="px-5 py-4">
                        <StatusBadge status={business.status} />
                      </td>

                      {/* Platform Access Status */}
                      <td className="px-5 py-4">
                        <BusinessStatusBadge
                          suspended={accessStatus.is_suspended === true}
                        />
                      </td>

                      {/* Registered */}
                      <td className="px-5 py-4 text-slate-500">
                        {formatDate(business.created_at)}
                      </td>

                      {/* Manage Access */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedBusiness(business)}
                          className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
                        >
                          Manage Access
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
          Showing {filteredBusinesses.length} of {businesses.length} loaded businesses.
        </div>
      </section>

      {/* Business Suspension / Reactivation Modal */}
      {selectedBusiness && (
        <BusinessStatusModal
          business={selectedBusiness}
          accessStatus={
            accessStatuses[selectedBusiness.id] || {
              is_suspended: false,
              suspension_reason: null,
              suspended_at: null,
            }
          }
          onClose={() => setSelectedBusiness(null)}
          onSuccess={handleStatusSuccess}
        />
      )}
    </div>
  );
}
