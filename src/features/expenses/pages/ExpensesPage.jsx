
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Plus,
  Receipt,
  Search,
  Trash2,
  RefreshCw,
  Wallet,
  CalendarDays,
  TrendingUp,
  Download,
  X,
} from "lucide-react";

import expenseService from "../services/expenseService";

const categories = [
  { value: "fuel", label: "Fuel" },
  { value: "salary", label: "Salary" },
  { value: "rent", label: "Rent" },
  { value: "maintenance", label: "Maintenance" },
  { value: "supplies", label: "Supplies" },
  { value: "utilities", label: "Utilities" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
];

const categoryLabels = Object.fromEntries(
  categories.map((item) => [item.value, item.label])
);

const paymentLabels = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  other: "Other",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (value) => {
  if (!value) return "—";

  const [year, month, day] = String(value)
    .slice(0, 10)
    .split("-");

  if (!year || !month || !day) return "—";

  return `${day}/${month}/${year}`;
};

function exportCSV(rows) {
  const columns = [
    "expense_date",
    "title",
    "category",
    "payment_method",
    "amount",
    "notes",
  ];

  const escapeCSV = (value) => {
    let text = String(value ?? "");

    // Protect against spreadsheet formula injection.
    if (/^[=+\-@\t\r]/.test(text)) {
      text = `'${text}`;
    }

    return `"${text.replaceAll('"', '""')}"`;
  };

  const csv = [
    columns.join(","),
    ...rows.map((row) =>
      columns.map((key) => escapeCSV(row[key])).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `business-expenses-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ExpensesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  // LOAD EXPENSES
  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await expenseService.getAll();

      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Unable to load expenses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // SUCCESS MESSAGE FROM CREATE PAGE
  useEffect(() => {
    const message = location.state?.success;

    if (!message) return;

    setSuccess(message);

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.state, navigate]);

  // FILTER EXPENSES
  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesCategory =
        categoryFilter === "all" ||
        expense.category === categoryFilter;

      const matchesPayment =
        paymentFilter === "all" ||
        expense.payment_method === paymentFilter;

      const matchesSearch =
        !query ||
        [
          expense.title,
          expense.notes,
          expense.category,
          categoryLabels[expense.category],
          paymentLabels[expense.payment_method],
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        );

      const expenseDate = String(
        expense.expense_date || ""
      ).slice(0, 10);

      const matchesFrom =
        !fromDate || expenseDate >= fromDate;

      const matchesTo =
        !toDate || expenseDate <= toDate;

      return (
        matchesCategory &&
        matchesPayment &&
        matchesSearch &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    expenses,
    search,
    categoryFilter,
    paymentFilter,
    fromDate,
    toDate,
  ]);

  // TOTAL EXPENDITURE
  const totalExpense = useMemo(
    () =>
      filteredExpenses.reduce(
        (sum, expense) =>
          sum + (Number(expense.amount) || 0),
        0
      ),
    [filteredExpenses]
  );

  const allExpenseTotal = useMemo(
    () =>
      expenses.reduce(
        (sum, expense) =>
          sum + (Number(expense.amount) || 0),
        0
      ),
    [expenses]
  );

  // CATEGORY SUMMARY
  const categorySummary = useMemo(
    () =>
      categories
        .map((category) => {
          const matching = filteredExpenses.filter(
            (expense) => expense.category === category.value
          );

          return {
            ...category,
            count: matching.length,
            total: matching.reduce(
              (sum, expense) =>
                sum + (Number(expense.amount) || 0),
              0
            ),
          };
        })
        .filter((item) => item.count > 0)
        .sort((a, b) => b.total - a.total),
    [filteredExpenses]
  );

  // CLEAR FILTERS
  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setPaymentFilter("all");
    setFromDate("");
    setToDate("");
  };

  const hasFilters =
    Boolean(search) ||
    categoryFilter !== "all" ||
    paymentFilter !== "all" ||
    Boolean(fromDate) ||
    Boolean(toDate);

  // DELETE EXPENSE
  const handleDelete = async (expense) => {
    if (deletingId) return;

    const confirmed = window.confirm(
      `Delete "${expense.title}" expense? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(expense.id);
      setError("");
      setSuccess("");

      await expenseService.delete(expense.id);

      setExpenses((previous) =>
        previous.filter((item) => item.id !== expense.id)
      );

      setSuccess("Expense deleted successfully.");
    } catch (err) {
      setError(
        err?.message || "Unable to delete the expense."
      );
    } finally {
      setDeletingId(null);
    }
  };

  
  // SEO: Expenses page
  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Expenses | Amrit Jal";

    const setMeta = (name, content) => {
      let element = document.head.querySelector(
        `meta[name="${name}"]`
      );

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("name", name);
        document.head.appendChild(element);
      }

      const previousContent = element.getAttribute("content");

      element.setAttribute("content", content);

      return () => {
        if (previousContent === null) {
          element.remove();
        } else {
          element.setAttribute("content", previousContent);
        }
      };
    };

    const cleanups = [
      setMeta(
        "description",
        "Manage business expenses, track payments, review expenditure and maintain expense records with Amrit Jal."
      ),
      setMeta("robots", "noindex, nofollow"),
      setMeta("googlebot", "noindex, nofollow"),
    ];

    return () => {
      document.title = previousTitle;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);



  return (
    <div className="space-y-6 p-4 md:p-6">

      {/* PAGE ACTIONS — page title is provided by AppLayout */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => navigate("/expenses/new")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-100"
        >
          <Plus size={18} />
          Record Expense
        </button>
      </div>

      {/* SUCCESS */}
      {success && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total Expenditure
            </p>

            <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-700">
              <Wallet size={20} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {loading ? "—" : formatCurrency(allExpenseTotal)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            All recorded expenses
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Filtered Expenditure
            </p>

            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
              <TrendingUp size={20} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {loading ? "—" : formatCurrency(totalExpense)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {filteredExpenses.length} matching expense(s)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total Records
            </p>

            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-700">
              <Receipt size={20} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {loading ? "—" : expenses.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Across all recorded dates
          </p>
        </div>

      </div>

      {/* SEARCH AND FILTERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="mb-3 flex items-center gap-2">
          <Search size={17} className="text-slate-500" />

          <h2 className="text-sm font-semibold text-slate-800">
            Search & Filters
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">

          <div className="relative xl:col-span-2">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search expense, notes..."
              aria-label="Search expenses"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
            aria-label="Filter category"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
          >
            <option value="all">All Categories</option>

            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(event) =>
              setPaymentFilter(event.target.value)
            }
            aria-label="Filter payment method"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
          >
            <option value="all">All Payments</option>

            {Object.entries(paymentLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadExpenses}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

        </div>

        {/* DATE FILTER */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">

          <label className="text-xs font-medium text-slate-500">
            From date

            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-700"
            />
          </label>

          <label className="text-xs font-medium text-slate-500">
            To date

            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-700"
            />
          </label>

          <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-3">

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Clear Filters
              </button>
            )}

            <button
              type="button"
              onClick={() => exportCSV(filteredExpenses)}
              disabled={!filteredExpenses.length || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>

          </div>

        </div>
      </div>

      {/* CATEGORY BREAKDOWN */}
      {!loading && categorySummary.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <h2 className="mb-4 font-semibold text-slate-900">
            Category Breakdown
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {categorySummary.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() =>
                  setCategoryFilter(
                    categoryFilter === item.value
                      ? "all"
                      : item.value
                  )
                }
                className={`rounded-xl border p-3 text-left transition hover:border-cyan-300 ${
                  categoryFilter === item.value
                    ? "border-cyan-400 bg-cyan-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="text-xs text-slate-500">
                  {item.label}
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {formatCurrency(item.total)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {item.count} expense(s)
                </p>
              </button>
            ))}

          </div>
        </div>
      )}

      {/* EXPENSE HISTORY */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="font-semibold text-slate-900">
              Expense History
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredExpenses.length} records displayed
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CalendarDays size={16} />
            {loading ? "—" : formatCurrency(totalExpense)}
          </div>

        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            <RefreshCw
              size={22}
              className="mx-auto mb-3 animate-spin text-cyan-700"
            />
            Loading expenses...
          </div>
        ) : error && expenses.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-slate-800">
              Unable to load expense records.
            </p>

            <button
              type="button"
              onClick={loadExpenses}
              className="mt-4 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800"
            >
              Try Again
            </button>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-10 text-center">

            <Receipt
              size={36}
              className="mx-auto mb-3 text-slate-300"
            />

            <p className="font-medium text-slate-800">
              {expenses.length === 0
                ? "No expenses recorded yet"
                : "No matching expenses found"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {expenses.length === 0
                ? "Record your first business expense to get started."
                : "Try changing your search or filters."}
            </p>

            {expenses.length === 0 && (
              <button
                type="button"
                onClick={() => navigate("/expenses/new")}
                className="mt-4 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800"
              >
                Record First Expense
              </button>
            )}

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-left text-sm">

              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">
                    Date
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Expense
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Category
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Payment Method
                  </th>

                  <th className="px-5 py-3 text-right font-semibold">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {formatDate(expense.expense_date)}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {expense.title}
                      </p>

                      {expense.notes && (
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {expense.notes}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {categoryLabels[expense.category] || "Other"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {paymentLabels[expense.payment_method] || "Other"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-slate-900">
                      {formatCurrency(expense.amount)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(expense)}
                        disabled={Boolean(deletingId)}
                        title="Delete expense"
                        aria-label={`Delete ${expense.title}`}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === expense.id ? (
                          <RefreshCw
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
