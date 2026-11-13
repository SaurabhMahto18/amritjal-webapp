
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getBusinessOverview,
} from "../services/businessService";

import BusinessOverview from "../components/BusinessOverview";
import BusinessStatistics from "../components/BusinessStatistics";
import BusinessSubscriptionHistory from "../components/BusinessSubscriptionHistory";

export default function AdminBusinessDetails() {
  const { businessId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBusiness = useCallback(async () => {
    if (!businessId) {
      setError("Business ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getBusinessOverview(businessId);

      if (!result.business) {
        throw new Error(
          result.errors?.join(", ") || "Business not found."
        );
      }

      setData(result);

      if (result.errors.length > 0) {
        setError(result.errors.join(" | "));
      }
    } catch (err) {
      setError(err.message || "Unable to load business details.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadBusiness();
  }, [loadBusiness]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading business details...
        </p>
      </div>
    );
  }

  if (!data?.business) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
        <h2 className="text-lg font-bold text-[#24262B]">
          Business Not Found
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {error || "Unable to find this business."}
        </p>
        <Link
          to="/admin/businesses"
          className="mt-5 inline-block rounded-xl bg-[#24262B] px-5 py-3 text-sm font-semibold text-white"
        >
          Back to Businesses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/admin/businesses"
            className="text-sm font-medium text-gray-500 hover:text-[#24262B]"
          >
            ← Back to Businesses
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-[#24262B]">
            Business Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Business profile, operations and subscription overview.
          </p>
        </div>

        <button
          onClick={loadBusiness}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#24262B] hover:bg-gray-50"
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Some information could not be loaded: {error}
        </div>
      )}

      <BusinessOverview business={data.business} />

      <BusinessStatistics
        customers={data.customers}
        activity={data.activity}
        loading={loading}
      />

      <BusinessSubscriptionHistory
        subscription={data.subscription}
      />
    </div>
  );
}
