
import { useMemo, useState } from "react";
import {
  Search,
  Package,
  RotateCcw,
  Droplets,
  ArrowUpRight,
  ArrowDownLeft,
  Boxes,
} from "lucide-react";

export default function CustomerUnbalancedProductsSection({
  customer,
  products = [],
  loading = false,
  error = "",
}) {
  const [search, setSearch] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("all");

  const getNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  const getProductName = (product) =>
    product.productName ||
    product.product_name ||
    product.name ||
    product.product?.name ||
    "Unnamed Product";

  const getDelivered = (product) =>
    getNumber(
      product.totalDelivered ??
      product.total_delivered ??
      product.deliveredQuantity ??
      product.delivered_quantity ??
      product.delivered
    );

  const getReceived = (product) =>
    getNumber(
      product.totalReceived ??
      product.total_received ??
      product.receivedQuantity ??
      product.received_quantity ??
      product.received
    );

  const getBalance = (product) => {
    const explicitBalance =
      product.balanceQuantity ??
      product.balance_quantity ??
      product.unbalance ??
      product.balance;

    // Use the supplied balance when available.
    // Otherwise calculate only when delivered and received data exist.
    if (explicitBalance !== undefined && explicitBalance !== null) {
      return getNumber(explicitBalance);
    }

    const hasDelivered =
      product.totalDelivered !== undefined ||
      product.total_delivered !== undefined ||
      product.deliveredQuantity !== undefined ||
      product.delivered_quantity !== undefined ||
      product.delivered !== undefined;

    const hasReceived =
      product.totalReceived !== undefined ||
      product.total_received !== undefined ||
      product.receivedQuantity !== undefined ||
      product.received_quantity !== undefined ||
      product.received !== undefined;

    return hasDelivered && hasReceived
      ? getDelivered(product) - getReceived(product)
      : null;
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const name = getProductName(product).toLowerCase();
      const balance = getBalance(product);

      const matchesSearch = name.includes(search.toLowerCase());

      const matchesBalance =
        balanceFilter === "all" ||
        (balanceFilter === "positive" && balance !== null && balance > 0) ||
        (balanceFilter === "zero" && balance === 0) ||
        (balanceFilter === "negative" && balance !== null && balance < 0);

      return matchesSearch && matchesBalance;
    });
  }, [products, search, balanceFilter]);

  const totalDelivered = products.reduce(
    (sum, product) => sum + getDelivered(product),
    0
  );

  const totalReceived = products.reduce(
    (sum, product) => sum + getReceived(product),
    0
  );

  const totalBalance = products.reduce((sum, product) => {
    const balance = getBalance(product);
    return sum + (balance === null ? 0 : balance);
  }, 0);

  const resetFilters = () => {
    setSearch("");
    setBalanceFilter("all");
  };

  const stats = [
    {
      label: "Total Products",
      value: products.length,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Delivered",
      value: totalDelivered,
      icon: ArrowUpRight,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      label: "Total Received",
      value: totalReceived,
      icon: ArrowDownLeft,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Unbalanced Jars",
      value: totalBalance,
      icon: Boxes,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
  ];

  return (
    <div className="min-w-0 space-y-3 sm:space-y-5">
      {/* Customer heading */}
      <section className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm font-semibold text-white sm:h-12 sm:w-12 sm:text-lg">
            {(customer?.name || "C").charAt(0).toUpperCase()}
          </div>

          <div>
            <h2 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
              {customer?.name || "Customer"}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500 sm:mt-1 sm:text-xs">
              Unbalanced Product Summary
            </p>
          </div>
        </div>

        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-medium text-slate-600 sm:px-3 sm:py-2 sm:text-xs">
          Product-wise Jar Balance
        </span>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] leading-tight text-slate-500 sm:text-sm">{stat.label}</p>
                <span className={`rounded-lg p-1.5 sm:p-2 ${stat.bg}`}>
                  <Icon size={16} className={`${stat.color} sm:h-[19px] sm:w-[19px]`} />
                </span>
              </div>

              <p className={`mt-2 text-xl font-semibold tabular-nums sm:mt-3 sm:text-2xl ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          );
        })}
      </section>

      {/* Product filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-slate-600 sm:mb-2 sm:text-sm">
              Search Product
            </label>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search product name..."
                className="w-full min-w-0 rounded-lg border border-slate-200 py-2.5 pl-9 pr-2 text-xs outline-none focus:border-blue-400 sm:py-3 sm:pl-10 sm:pr-3 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-slate-600 sm:mb-2 sm:text-sm">
              Balance Status
            </label>

            <select
              value={balanceFilter}
              onChange={(event) => setBalanceFilter(event.target.value)}
              className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-xs outline-none focus:border-blue-400 sm:px-3 sm:py-3 sm:text-sm"
            >
              <option value="all">All Products</option>
              <option value="positive">Positive Balance</option>
              <option value="zero">Zero Balance</option>
              <option value="negative">Negative Balance</option>
            </select>
          </div>
        </div>

        <div className="mt-2 flex justify-end sm:mt-4">
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </section>


      {/* Product Balance */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-3 py-3 sm:px-5 sm:py-4">
          <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
            Unbalanced Products
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
            Product-wise delivered and received jar details
          </p>
        </div>

        {/* Mobile View - Compact Cards */}
        <div className="space-y-2 p-2.5 sm:hidden">
          {loading ? (
            <p className="py-8 text-center text-xs text-slate-400">
              Loading product balances...
            </p>
          ) : error ? (
            <p className="py-8 text-center text-xs text-red-500">{error}</p>
          ) : filteredProducts.length === 0 ? (
            <div className="py-8 text-center">
              <Droplets size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">
                No product balance found
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Product balance records will appear here.
              </p>
            </div>
          ) : (
            filteredProducts.map((product, index) => {
              const balance = getBalance(product);
              const delivered = getDelivered(product);
              const received = getReceived(product);

              const status =
                balance === null
                  ? "Unavailable"
                  : balance > 0
                    ? "Pending Return"
                    : balance < 0
                      ? "Over Received"
                      : "Balanced";

              const statusClass =
                balance === null
                  ? "bg-slate-100 text-slate-600"
                  : balance > 0
                    ? "bg-rose-50 text-rose-600"
                    : balance < 0
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700";

              return (
                <div
                  key={product.id || product.productId || index}
                  className="rounded-lg border border-slate-100 bg-white p-3"
                >
                  {/* Product name and status */}
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50">
                        <Droplets size={16} className="text-cyan-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {getProductName(product)}
                        </p>
                        {product.unit && (
                          <p className="text-[10px] text-slate-400">
                            Unit: {product.unit}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${statusClass}`}
                    >
                      {status}
                    </span>
                  </div>

                  {/* Quantity details */}
                  <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 rounded-md bg-slate-50 py-2">
                    <div className="px-1 text-center">
                      <p className="text-[9px] text-slate-400">Delivered</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-700">
                        {delivered}
                      </p>
                    </div>

                    <div className="px-1 text-center">
                      <p className="text-[9px] text-slate-400">Received</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-700">
                        {received}
                      </p>
                    </div>

                    <div className="px-1 text-center">
                      <p className="text-[9px] text-slate-400">Unbalanced</p>
                      <p
                        className={`mt-0.5 text-sm font-bold ${balance === null
                            ? "text-slate-500"
                            : balance > 0
                              ? "text-rose-600"
                              : balance < 0
                                ? "text-amber-600"
                                : "text-emerald-600"
                          }`}
                      >
                        {balance === null ? "—" : balance}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View - Existing Table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-5 py-4 font-medium">Product</th>
                <th className="px-5 py-4 text-center font-medium">Delivered</th>
                <th className="px-5 py-4 text-center font-medium">Received</th>
                <th className="px-5 py-4 text-center font-medium">Unbalanced</th>
                <th className="px-5 py-4 text-center font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    Loading product balances...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Droplets size={34} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-600">
                      No product balance found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Product balance records will appear here when available.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => {
                  const balance = getBalance(product);
                  const delivered = getDelivered(product);
                  const received = getReceived(product);

                  const status =
                    balance === null
                      ? "Unavailable"
                      : balance > 0
                        ? "Pending Return"
                        : balance < 0
                          ? "Over Received"
                          : "Balanced";

                  const statusClass =
                    balance === null
                      ? "bg-slate-100 text-slate-600"
                      : balance > 0
                        ? "bg-rose-50 text-rose-600"
                        : balance < 0
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700";

                  return (
                    <tr
                      key={product.id || product.productId || index}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50">
                            <Droplets size={19} className="text-cyan-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {getProductName(product)}
                            </p>
                            {product.unit && (
                              <p className="mt-1 text-xs text-slate-400">
                                Unit: {product.unit}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center font-medium text-slate-700">
                        {delivered}
                      </td>
                      <td className="px-5 py-4 text-center font-medium text-slate-700">
                        {received}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`font-semibold ${balance === null
                              ? "text-slate-500"
                              : balance > 0
                                ? "text-rose-600"
                                : balance < 0
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                            }`}
                        >
                          {balance === null ? "—" : balance}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${statusClass}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-3 py-2.5 text-[11px] text-slate-400 sm:px-5 sm:py-3 sm:text-xs">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </section>

    </div>
  );
}
