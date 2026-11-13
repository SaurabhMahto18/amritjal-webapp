import { useCallback, useEffect, useState } from "react";
import { SMS_FILTER_DEFAULTS, SMS_PAGE_SIZE } from "../utils/smsConstants";
import { smsService } from "../services/smsService";

export function useSmsCustomers() {
  const [customers, setCustomers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filters, setFilters] = useState(SMS_FILTER_DEFAULTS);

  const [page, setPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(totalCustomers / SMS_PAGE_SIZE));

  const loadGroups = useCallback(async () => {
    try {
      const result = await smsService.getCustomerGroups();
      setGroups(result || []);
    } catch (err) {
      console.error("SMS groups loading error:", err);
      setGroups([]);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await smsService.getCustomers({
        filters,
        page,
        pageSize: SMS_PAGE_SIZE,
      });

      setCustomers(result?.data || []);
      setTotalCustomers(result?.count || 0);
    } catch (err) {
      console.error("SMS customers loading error:", err);
      setError(err.message || "Customers load nahi ho paaye.");
      setCustomers([]);
      setTotalCustomers(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const updateFilter = useCallback((key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...SMS_FILTER_DEFAULTS });
    setPage(1);
  }, []);

  const changePage = useCallback(
    (nextPage) => {
      setPage(Math.min(Math.max(1, nextPage), totalPages));
    },
    [totalPages]
  );

  return {
    customers,
    groups,
    filters,
    page,
    totalPages,
    totalCustomers,
    loading,
    error,
    updateFilter,
    resetFilters,
    changePage,
    refresh: loadCustomers,
  };
}