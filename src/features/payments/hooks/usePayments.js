
import { useCallback, useEffect, useMemo, useState } from "react";
import paymentService from "../services/paymentService";

export const PAYMENT_METHOD_LABELS = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  other: "Other",
};

const toAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export const formatPaymentCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(toAmount(value));

export default function usePayments(options = {}) {
  const { autoLoad = true } = options;

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(Boolean(autoLoad));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");

  const loadPayments = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const result = await paymentService.getPayments();
      setPayments(Array.isArray(result) ? result : []);
      return result;
    } catch (err) {
      setError(err?.message || "Unable to load payment records.");
      throw err;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refreshPayments = useCallback(async () => {
    try {
      await loadPayments({ silent: true });
    } catch {
      // The hook exposes the error in `error` for the page to display.
    }
  }, [loadPayments]);

  useEffect(() => {
    if (!autoLoad) return;

    let active = true;

    const initialLoad = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await paymentService.getPayments();
        if (active) {
          setPayments(Array.isArray(result) ? result : []);
        }
      } catch (err) {
        if (active) {
          setError(err?.message || "Unable to load payment records.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    initialLoad();

    return () => {
      active = false;
    };
  }, [autoLoad]);

  const visiblePayments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const methodLabel =
        PAYMENT_METHOD_LABELS[payment.method] || payment.method || "";

      const matchesSearch =
        !term ||
        String(payment.customerName || "").toLowerCase().includes(term) ||
        String(payment.customerPhone || "").toLowerCase().includes(term) ||
        String(payment.notes || "").toLowerCase().includes(term) ||
        String(methodLabel).toLowerCase().includes(term) ||
        String(payment.id || "").toLowerCase().includes(term);

      const matchesDate =
        !filterDate || payment.date === filterDate;

      const matchesMethod =
        filterMethod === "all" || payment.method === filterMethod;

      return matchesSearch && matchesDate && matchesMethod;
    });
  }, [payments, search, filterDate, filterMethod]);

  const totals = useMemo(() => {
    return visiblePayments.reduce(
      (result, payment) => {
        const amount = toAmount(payment.amount);

        result.totalCollected += amount;

        if (payment.method === "cash") {
          result.cashTotal += amount;
        } else if (["upi", "bank_transfer"].includes(payment.method)) {
          result.digitalTotal += amount;
        } else {
          result.otherTotal += amount;
        }

        result.paymentCount += 1;

        return result;
      },
      {
        totalCollected: 0,
        cashTotal: 0,
        digitalTotal: 0,
        otherTotal: 0,
        paymentCount: 0,
      }
    );
  }, [visiblePayments]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilterDate("");
    setFilterMethod("all");
  }, []);

  return {
    payments,
    visiblePayments,
    loading,
    refreshing,
    error,
    setError,
    search,
    setSearch,
    filterDate,
    setFilterDate,
    filterMethod,
    setFilterMethod,
    totals,
    loadPayments,
    refreshPayments,
    clearFilters,
  };
}
