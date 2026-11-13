
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  RefreshCw,
  Plus,
  AlertCircle,
  Info,
} from "lucide-react";

import LedgerSummaryCards from "../components/LedgerSummaryCards";
import LedgerFilters from "../components/LedgerFilters";
import LedgerTable from "../components/LedgerTable";
import ledgerService from "../services/ledgerService";

const INITIAL_FILTERS = {
  search: "",
  type: "all",
  fromDate: "",
  toDate: "",
};

function getTransactionDate(transaction) {
  return String(
    transaction.date || transaction.transaction_date || ""
  ).slice(0, 10);
}

function getTransactionType(transaction) {
  return String(
    transaction.type || transaction.transaction_type || ""
  ).trim().toLowerCase();
}

function getDebit(transaction) {
  return Number(transaction.debit ?? 0) || 0;
}

function getCredit(transaction) {
  return Number(transaction.credit ?? 0) || 0;
}

function getDescription(transaction) {
  return (
    transaction.description ||
    transaction.notes ||
    transaction.reference ||
    "Ledger transaction"
  );
}

function matchesType(transaction, selectedType) {
  if (selectedType === "all") return true;

  const type = getTransactionType(transaction);

  if (selectedType === "delivery") {
    return type === "delivery";
  }

  if (selectedType === "payment") {
    return type === "payment" || type === "credit";
  }

  if (selectedType === "debit") {
    return getDebit(transaction) > 0;
  }

  if (selectedType === "credit") {
    return getCredit(transaction) > 0;
  }

  return type === selectedType;
}

function matchesSearch(transaction, search) {
  if (!search) return true;

  const query = search.trim().toLowerCase();

  if (!query) return true;

  const fields = [
    getDescription(transaction),
    getTransactionType(transaction),
    transaction.reference,
    transaction.reference_number,
    transaction.customerName,
    transaction.customer_name,
    transaction.customerPhone,
  ];

  return fields.some((value) =>
    String(value ?? "").toLowerCase().includes(query)
  );
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-200 bg-rose-50 p-5"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          size={21}
          className="mt-0.5 shrink-0 text-rose-700"
        />

        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-rose-900">
            Unable to load ledger
          </h2>

          <p className="mt-1 break-words text-sm leading-6 text-rose-800">
            {message}
          </p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800"
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LedgerPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [ledgerData, setLedgerData] = useState({
    customers: [],
    transactions: [],
    totalDebit: 0,
    totalCredit: 0,
    outstanding: 0,
    transactionCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch complete transaction history so date filtering does not
      // accidentally reset the running balance.
      const result = await ledgerService.getLedgerData();

      setLedgerData({
        customers: Array.isArray(result?.customers)
          ? result.customers
          : [],
        transactions: Array.isArray(result?.transactions)
          ? result.transactions
          : [],
        totalDebit: Number(result?.totalDebit) || 0,
        totalCredit: Number(result?.totalCredit) || 0,
        outstanding: Number(result?.outstanding) || 0,
        transactionCount: Number(result?.transactionCount) || 0,
      });
    } catch (err) {
      console.error("Failed to load ledger:", err);

      setError(
        err?.message ||
          "An unexpected error occurred while loading ledger data."
      );

      setLedgerData({
        customers: [],
        transactions: [],
        totalDebit: 0,
        totalCredit: 0,
        outstanding: 0,
        transactionCount: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLedger();
  }, [loadLedger, reloadKey]);

  const openingBalance = useMemo(
    () =>
      ledgerData.customers.reduce(
        (sum, customer) =>
          sum + (Number(customer.openingBalance) || 0),
        0
      ),
    [ledgerData.customers]
  );

  const filteredTransactions = useMemo(() => {
    return ledgerData.transactions.filter((transaction) => {
      const date = getTransactionDate(transaction);

      const matchesFromDate =
        !filters.fromDate ||
        (date !== "" && date >= filters.fromDate);

      const matchesToDate =
        !filters.toDate ||
        (date !== "" && date <= filters.toDate);

      return (
        matchesSearch(transaction, filters.search) &&
        matchesType(transaction, filters.type) &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [ledgerData.transactions, filters]);

  const filteredTotals = useMemo(
    () =>
      filteredTransactions.reduce(
        (totals, transaction) => ({
          debit: totals.debit + getDebit(transaction),
          credit: totals.credit + getCredit(transaction),
        }),
        { debit: 0, credit: 0 }
      ),
    [filteredTransactions]
  );

  // This is a transaction-based estimate, not necessarily the
  // complete outstanding balance when payment history is missing.
  const filteredClosingBalance =
    openingBalance +
    filteredTotals.debit -
    filteredTotals.credit;

  function resetFilters() {
    setFilters({ ...INITIAL_FILTERS });
  }

  function retryLoading() {
    setReloadKey((current) => current + 1);
  }

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/dashboard"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-teal-700"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </Link>

        <header className="mb-7 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-700 p-6 text-white shadow-lg shadow-teal-900/10 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <BookOpen size={27} />
              </div>

              <div>
                <p className="text-sm font-medium text-teal-100">
                  Amrit Jal Management
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  Account Ledger
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-teal-50/90">
                  Review ledger entries, search transactions and filter
                  records by date or type.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={retryLoading}
                disabled={loading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <Link
                to="/customers"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"
              >
                <Plus size={17} />
                View Customers
              </Link>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {error ? (
            <ErrorPanel
              message={error}
              onRetry={retryLoading}
            />
          ) : (
            <>
              <LedgerSummaryCards
                openingBalance={openingBalance}
                totalDebit={ledgerData.totalDebit}
                totalCredit={ledgerData.totalCredit}
                closingBalance={ledgerData.outstanding}
              />

              <LedgerFilters
                filters={filters}
                onChange={setFilters}
                onReset={resetFilters}
                resultCount={filteredTransactions.length}
                loading={loading}
              />

              <LedgerTable
                transactions={filteredTransactions}
                loading={loading}
                error=""
                onRetry={retryLoading}
              />

              <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
                <Info
                  size={20}
                  className="mt-0.5 shrink-0 text-blue-700"
                />

                <div>
                  <h2 className="text-sm font-bold text-blue-900">
                    Ledger data status
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    {ledgerData.customers.length} customer(s) and{" "}
                    {ledgerData.transactionCount} transaction(s) were
                    returned by the current ledger service. The service
                    currently reads delivery records; payment integration
                    must be verified separately before treating these
                    figures as the complete customer outstanding balance.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
          <BookOpen size={13} />
          Amrit Jal · Ledger Management
        </footer>
      </div>
    </main>
  );
}
