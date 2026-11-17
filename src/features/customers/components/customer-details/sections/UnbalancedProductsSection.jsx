
import { memo, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Package,
  RefreshCw,
  RotateCcw,
  Scale,
  Search,
  Droplets,
} from "lucide-react";

function getNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getProductName(product) {
  return (
    product.productName ||
    product.product_name ||
    product.name ||
    product.product?.name ||
    "Unnamed Product"
  );
}

function getDelivered(product) {
  return getNumber(
    product.totalDelivered ??
      product.total_delivered ??
      product.deliveredQuantity ??
      product.delivered_quantity ??
      product.delivered
  ) ?? 0;
}

function getReturned(product) {
  return getNumber(
    product.totalReturned ??
      product.total_returned ??
      product.totalReceived ??
      product.total_received ??
      product.receivedQuantity ??
      product.received_quantity ??
      product.returned ??
      product.received
  ) ?? 0;
}

function getBalance(product) {
  const explicitBalance = getNumber(
    product.balanceQuantity ??
      product.balance_quantity ??
      product.balance
  );

  if (explicitBalance !== null) return explicitBalance;

  const hasDelivered =
    product.totalDelivered !== undefined ||
    product.total_delivered !== undefined ||
    product.deliveredQuantity !== undefined ||
    product.delivered_quantity !== undefined ||
    product.delivered !== undefined;

  const hasReturned =
    product.totalReturned !== undefined ||
    product.total_returned !== undefined ||
    product.totalReceived !== undefined ||
    product.total_received !== undefined ||
    product.receivedQuantity !== undefined ||
    product.received_quantity !== undefined ||
    product.returned !== undefined ||
    product.received !== undefined;

  return hasDelivered && hasReturned
    ? getDelivered(product) - getReturned(product)
    : null;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function getBalanceStatus(balance) {
  if (balance === null) {
    return {
      label: "Unavailable",
      className: "bg-slate-100 text-slate-600",
    };
  }

  if (balance > 0) {
    return {
      label: "With Customer",
      className: "bg-rose-50 text-rose-700",
    };
  }

  if (balance < 0) {
    return {
      label: "Extra Returned",
      className: "bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Balanced",
    className: "bg-emerald-50 text-emerald-700",
  };
}

function SummaryCard({ label, value, description, icon: Icon, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    teal: "bg-teal-50 text-teal-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium leading-5 text-slate-500">
          {label}
        </p>

        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>

      <p className="mt-2 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
        {formatNumber(value)}
      </p>

      <p className="mt-1 text-[11px] leading-4 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ProductBalanceCard({ product }) {
  const name = getProductName(product);
  const delivered = getDelivered(product);
  const returned = getReturned(product);
  const balance = getBalance(product);
  const status = getBalanceStatus(balance);

  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <Droplets size={19} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="break-words text-sm font-bold text-slate-800">
            {name}
          </h4>

          {product.unit && (
            <p className="mt-1 text-xs text-slate-500">
              Unit: {product.unit}
            </p>
          )}
        </div>

        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
        <div className="min-w-0">
          <p className="text-[10px] leading-4 text-slate-500 sm:text-xs">
            Delivered
          </p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800">
            {formatNumber(delivered)}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] leading-4 text-slate-500 sm:text-xs">
            Returned
          </p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800">
            {formatNumber(returned)}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] leading-4 text-slate-500 sm:text-xs">
            Balance
          </p>

          <p
            className={`mt-1 text-sm font-bold tabular-nums ${
              balance > 0
                ? "text-rose-700"
                : balance < 0
                  ? "text-amber-700"
                  : "text-emerald-700"
            }`}
          >
            {balance === null ? "—" : formatNumber(Math.abs(balance))}
          </p>
        </div>
      </div>
    </article>
  );
}

function UnbalancedProductsSection({
  customer,
  products = [],
  loading = false,
  error = "",
  onRefresh,
}) {
  const [search, setSearch] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("all");

  const safeProducts = Array.isArray(products) ? products : [];

  const summary = useMemo(() => {
    return safeProducts.reduce(
      (result, product) => {
        const delivered = getDelivered(product);
        const returned = getReturned(product);
        const balance = getBalance(product);

        result.totalDelivered += delivered;
        result.totalReturned += returned;

        if (balance !== null) {
          if (balance > 0) result.customerHas += balance;
          if (balance < 0) result.extraReturned += Math.abs(balance);
        }

        return result;
      },
      {
        totalDelivered: 0,
        totalReturned: 0,
        customerHas: 0,
        extraReturned: 0,
      }
    );
  }, [safeProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeProducts.filter((product) => {
      const name = getProductName(product).toLowerCase();
      const balance = getBalance(product);

      const matchesSearch =
        !query ||
        name.includes(query) ||
        String(product.sku || "").toLowerCase().includes(query);

      const matchesBalance =
        balanceFilter === "all" ||
        (balanceFilter === "with-customer" &&
          balance !== null &&
          balance > 0) ||
        (balanceFilter === "extra-returned" &&
          balance !== null &&
          balance < 0) ||
        (balanceFilter === "balanced" && balance === 0);

      return matchesSearch && matchesBalance;
    });
  }, [safeProducts, search, balanceFilter]);

  function resetFilters() {
    setSearch("");
    setBalanceFilter("all");
  }

  return (
    <section className="min-w-0 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Scale size={22} aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Unbalanced Products
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              {customer?.name
                ? `Jar balance for ${customer.name}`
                : "Product-wise delivered and returned balance"}
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              aria-hidden="true"
            />
            Refresh
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && safeProducts.length === 0 ? (
        <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <RefreshCw
            size={24}
            className="animate-spin text-teal-700"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-slate-600">
            Loading product balances...
          </p>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Unable to load product balances</p>
            <p className="mt-1 break-words text-xs leading-5">
              {error}
            </p>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="shrink-0 text-xs font-semibold underline"
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4 sm:gap-3">
            <SummaryCard
              label="Total Products"
              value={safeProducts.length}
              description="Products with jar transactions"
              icon={Package}
              tone="blue"
            />

            <SummaryCard
              label="Total Delivered"
              value={summary.totalDelivered}
              description="Total jars delivered"
              icon={ArrowUpRight}
              tone="teal"
            />

            <SummaryCard
              label="Total Returned"
              value={summary.totalReturned}
              description="Total jars received back"
              icon={ArrowDownLeft}
              tone="blue"
            />

            <SummaryCard
              label="With Customer"
              value={summary.customerHas}
              description="Net jars still with customer"
              icon={Boxes}
              tone="rose"
            />
          </div>

          {summary.extraReturned > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-900">
                Extra Returned: {formatNumber(summary.extraReturned)}
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                Returned quantity exceeds delivered quantity for one or more products. Review these records before reconciliation.
              </p>
            </div>
          )}

          {/* Search and Filters */}
          <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Search Product
                </span>

                <div className="relative">
                  <Search
                    size={17}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search product name..."
                    className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                  />
                </div>
              </label>

              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Balance Status
                </span>

                <select
                  value={balanceFilter}
                  onChange={(event) =>
                    setBalanceFilter(event.target.value)
                  }
                  className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                >
                  <option value="all">All Products</option>
                  <option value="with-customer">With Customer</option>
                  <option value="extra-returned">Extra Returned</option>
                  <option value="balanced">Balanced</option>
                </select>
              </label>
            </div>

            {(search || balanceFilter !== "all") && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-teal-700"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  Reset Filters
                </button>
              </div>
            )}
          </section>

          {/* Product List */}
          <section className="min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-800">
                Product-wise Balance
              </h3>

              <span className="text-xs text-slate-500">
                {filteredProducts.length} of {safeProducts.length}
              </span>
            </div>

            {safeProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
                <Package
                  size={30}
                  className="mx-auto text-slate-300"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No jar transactions found
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
                  Product-wise balance details will appear after delivered or returned jar transactions are recorded.
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <Search
                  size={25}
                  className="mx-auto text-slate-300"
                  aria-hidden="true"
                />
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  No matching products
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-3 text-xs font-semibold text-teal-700 underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {filteredProducts.map((product, index) => (
                    <ProductBalanceCard
                      key={product.productId || product.id || index}
                      product={product}
                    />
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-4 font-semibold">Product</th>
                          <th className="px-5 py-4 text-right font-semibold">Delivered</th>
                          <th className="px-5 py-4 text-right font-semibold">Returned</th>
                          <th className="px-5 py-4 text-right font-semibold">Balance</th>
                          <th className="px-5 py-4 text-right font-semibold">Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {filteredProducts.map((product, index) => {
                          const balance = getBalance(product);
                          const status = getBalanceStatus(balance);

                          return (
                            <tr
                              key={product.productId || product.id || index}
                              className="transition hover:bg-slate-50"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <span className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                                    <Droplets size={18} aria-hidden="true" />
                                  </span>

                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-800">
                                      {getProductName(product)}
                                    </p>
                                    {product.unit && (
                                      <p className="mt-1 text-xs text-slate-500">
                                        Unit: {product.unit}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4 text-right font-medium tabular-nums text-slate-700">
                                {formatNumber(getDelivered(product))}
                              </td>

                              <td className="px-5 py-4 text-right font-medium tabular-nums text-slate-700">
                                {formatNumber(getReturned(product))}
                              </td>

                              <td className="px-5 py-4 text-right font-bold tabular-nums text-slate-800">
                                {balance === null
                                  ? "—"
                                  : formatNumber(Math.abs(balance))}
                              </td>

                              <td className="px-5 py-4 text-right">
                                <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${status.className}`}>
                                  {status.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </section>
  );
}

export default memo(UnbalancedProductsSection);
