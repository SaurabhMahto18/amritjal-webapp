import { useCallback, useEffect, useState } from "react";
import { getWalletTransactions } from "../services/walletService";

export default function useWalletTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getWalletTransactions();
      setTransactions(result);
    } catch (err) {
      setError(err.message || "Unable to load wallet transactions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refresh: fetchTransactions,
  };
}
