
import { useEffect, useMemo, useState } from "react";

import WalletFilters from "../components/WalletFilters";
import WalletTransactionList from "../components/WalletTransactionList";
import useWalletTransactions from "../hooks/useWalletTransactions";

export default function WalletTransactionsPage() {
  const {
    transactions,
    loading,
    error,
    refresh,
  } = useWalletTransactions();

  const [filters, setFilters] = useState({
    min: "",
    max: "",
    from: "",
    to: "",
    key: "",
    type: "",
  });

  // SEO: Private Wallet Transactions Page
  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Wallet Transactions | Amrit Jal";

    const setMeta = (name, content) => {
      let element = document.head.querySelector(
        `meta[name="${name}"]`
      );

      const existed = Boolean(element);
      const previousContent = element?.getAttribute("content");

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("name", name);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);

      return () => {
        if (!existed) {
          element.remove();
        } else {
          element.setAttribute("content", previousContent ?? "");
        }
      };
    };

    const cleanups = [
      setMeta(
        "description",
        "View and manage wallet transactions, filter payments and review transaction history in Amrit Jal."
      ),
      setMeta("robots", "noindex, nofollow"),
      setMeta("googlebot", "noindex, nofollow"),
    ];

    return () => {
      document.title = previousTitle;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  // FILTER TRANSACTIONS
  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const amount = Number(item.amount) || 0;

      if (
        filters.min !== "" &&
        amount < Number(filters.min)
      ) {
        return false;
      }

      if (
        filters.max !== "" &&
        amount > Number(filters.max)
      ) {
        return false;
      }

      if (filters.from && item.date) {
        const itemDate = String(item.date).slice(0, 10);

        if (itemDate < filters.from) {
          return false;
        }
      }

      if (filters.to && item.date) {
        const itemDate = String(item.date).slice(0, 10);

        if (itemDate > filters.to) {
          return false;
        }
      }

      if (filters.key) {
        const searchText = String(
          item.key ?? ""
        ).toLowerCase();

        if (
          !searchText.includes(filters.key.trim().toLowerCase())
        ) {
          return false;
        }
      }

      if (
        filters.type &&
        item.type !== filters.type
      ) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6 lg:p-8">
      <WalletFilters onSearch={setFilters} />

      <WalletTransactionList
        transactions={filteredTransactions}
        loading={loading}
        error={error}
        onRetry={refresh}
      />
    </div>
  );
}
