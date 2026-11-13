
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
    <div className="space-y-5">
      {/* Customer heading */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-lg font-semibold text-white">
            {(customer?.name || "C").charAt(0).toUpperCase()}
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              {customer?.name || "Customer"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Unbalanced Product Summary
            </p>
          </div>
        </div>

        <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
          Product-wise Jar Balance
        </span>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <span className={`rounded-lg p-2 ${stat.bg}`}>
                  <Icon size={19} className={stat.color} />
                </span>
              </div>

              <p className={`mt-3 text-2xl font-semibold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          );
        })}
      </section>

      {/* Product filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
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
                className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Balance Status
            </label>

            <select
              value={balanceFilter}
              onChange={(event) => setBalanceFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
            >
              <option value="all">All Products</option>
              <option value="positive">Positive Balance</option>
              <option value="zero">Zero Balance</option>
              <option value="negative">Negative Balance</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </section>

      {/* Product balance table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">
            Unbalanced Products
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Product-wise delivered and received jar details
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-5 py-4 font-medium">Product</th>
                <th className="px-5 py-4 text-center font-medium">
                  Delivered
                </th>
                <th className="px-5 py-4 text-center font-medium">
                  Received
                </th>
                <th className="px-5 py-4 text-center font-medium">
                  Unbalanced
                </th>
                <th className="px-5 py-4 text-center font-medium">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    Loading product balances...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Droplets
                      size={34}
                      className="mx-auto mb-3 text-slate-300"
                    />

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
                            <Droplets
                              size={19}
                              className="text-cyan-600"
                            />
                          </div>

                          <div>
                            <p className="font-medium text-slate-900">
                              {getProductName(product)}
                            </p>
                            {product.unit ? (
                              <p className="mt-1 text-xs text-slate-400">
                                Unit: {product.unit}
                              </p>
                            ) : null}
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
                          className={`font-semibold ${
                            balance > 0
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

        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </section>
    </div>
  );
}
