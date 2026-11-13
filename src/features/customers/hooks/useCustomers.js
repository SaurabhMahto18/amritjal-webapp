
import { useCallback, useEffect, useState } from "react";
import { customerService } from "../services/customerService";

export function useCustomers({ includeArchived = false } = {}) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [subscriptionUsage, setSubscriptionUsage] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await customerService.getAll({ includeArchived });
      setCustomers(data || []);
    } catch (err) {
      setError(err.message || "Customers load nahi ho paaye.");
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  const refreshSubscription = useCallback(async () => {
    setSubscriptionLoading(true);
    setSubscriptionError("");

    try {
      const data = await customerService.getSubscriptionUsage();
      setSubscriptionUsage(data);
    } catch (err) {
      setSubscriptionError(
        err.message || "Subscription details load nahi ho paaye."
      );
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    refreshSubscription();

    const handleCustomersUpdated = () => {
      refresh();
      refreshSubscription();
    };

    window.addEventListener(
      "amrit-jal-customers-updated",
      handleCustomersUpdated
    );

    return () => {
      window.removeEventListener(
        "amrit-jal-customers-updated",
        handleCustomersUpdated
      );
    };
  }, [refresh, refreshSubscription]);

  const createCustomer = useCallback(async (input) => {
    return await customerService.create(input);
  }, []);

  const updateCustomer = useCallback(async (id, input) => {
    return await customerService.update(id, input);
  }, []);

  const archiveCustomer = useCallback(async (id) => {
    return await customerService.archive(id);
  }, []);

  const restoreCustomer = useCallback(async (id) => {
    return await customerService.restore(id);
  }, []);

  const deleteCustomer = useCallback(async (id) => {
    return await customerService.delete(id);
  }, []);

  const importCustomers = useCallback(async (rows) => {
    return await customerService.importCustomers(rows);
  }, []);

  const getCustomerById = useCallback(async (id) => {
    return await customerService.getById(id);
  }, []);

  return {
    customers,
    loading,
    error,

    subscriptionUsage,
    subscriptionLoading,
    subscriptionError,

    refresh,
    refreshSubscription,

    createCustomer,
    updateCustomer,
    archiveCustomer,
    restoreCustomer,
    deleteCustomer,
    importCustomers,
    getCustomerById,
  };
}
