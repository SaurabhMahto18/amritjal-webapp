import { useCallback, useEffect, useState } from "react";
import deliveryService from "../services/deliveryService";

export default function useDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [balances, setBalances] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // REFRESH ALL DELIVERY DATA
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        deliveryData,
        customerData,
        employeeData,
        productData,
        groupData,
        balanceData,
      ] = await Promise.all([
        deliveryService.getAll(),
        deliveryService.getCustomers(),
        deliveryService.getEmployees(),
        deliveryService.getProducts(),
        deliveryService.getGroups(),
        deliveryService.getCustomerBalances(),
      ]);

      setDeliveries(deliveryData ?? []);
      setCustomers(customerData ?? []);
      setEmployees(employeeData ?? []);
      setProducts(productData ?? []);
      setGroups(groupData ?? []);
      setBalances(balanceData ?? {});

      return {
        deliveries: deliveryData ?? [],
        customers: customerData ?? [],
        employees: employeeData ?? [],
        products: productData ?? [],
        groups: groupData ?? [],
        balances: balanceData ?? {},
      };
    } catch (err) {
      setError(err.message || "Unable to load deliveries.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // INITIAL LOAD
  useEffect(() => {
    refresh().catch(() => {
      // Error is already stored in hook state.
    });
  }, [refresh]);

  // CUSTOMER RATE PLANS
  const getCustomerRatePlans = useCallback(
    async (customerId, date) => {
      try {
        return await deliveryService.getCustomerRatePlans(
          customerId,
          date
        );
      } catch (err) {
        setError(
          err.message ||
            "Unable to load customer product assignments."
        );
        throw err;
      }
    },
    []
  );

  // CREATE DELIVERY
  const createDelivery = useCallback(
    async (payload) => {
      setError("");

      try {
        const created = await deliveryService.create(payload);
        await refresh();
        return created;
      } catch (err) {
        setError(err.message || "Unable to create delivery.");
        throw err;
      }
    },
    [refresh]
  );

  // DELETE DELIVERY
  const deleteDelivery = useCallback(
    async (deliveryId) => {
      setError("");

      try {
        await deliveryService.delete(deliveryId);

        setDeliveries((previous) =>
          previous.filter(
            (delivery) => delivery.id !== deliveryId
          )
        );

        await refresh();
        return true;
      } catch (err) {
        setError(err.message || "Unable to delete delivery.");
        throw err;
      }
    },
    [refresh]
  );

  // RETURN DATA AND ACTIONS
  return {
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
  };
}