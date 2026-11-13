
import { useMemo } from "react";
import {
  AlertCircle,
  Package,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

export default function UnbalancedProductsSection({
  products = [],
  loading = false,
  error = "",
}) {
  const summary = useMemo(() => {
    return products.reduce(
      (result, product) => {
        const balance = Number(product.balance || 0);

        if (balance > 0) result.customerHas += balance;
        if (balance < 0) result.customerOwes += Math.abs(balance);

        return result;
      },
      { customerHas: 0, customerOwes: 0 }
    );
  }, [products]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Scale size={22} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">
            Unbalanced Products
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Track product and jar balance differences for this customer.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <TrendingUp size={17} />
            Customer Has
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-800">
            {formatNumber(summary.customerHas)}
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            Net positive product balance
          </p>
        </div>

        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-sm text-rose-700">
            <TrendingDown size={17} />
            Customer Owes
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-rose-800">
            {formatNumber(summary.customerOwes)}
          </p>
          <p className="mt-1 text-xs text-rose-700">
            Net negative product balance
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
          <Package size={18} className="text-slate-500" />
          <h4 className="text-sm font-semibold text-slate-800">
            Product-wise Balance
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading product balances...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-5 text-sm text-rose-600">
            <AlertCircle size={18} />
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <Package
              size={30}
              className="mx-auto mb-3 text-slate-300"
            />
            <p className="text-sm font-medium text-slate-700">
              No unbalanced products
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Product balance details will appear here when available.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1fr)_110px_130px] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
              <span>Product</span>
              <span className="text-right">Balance</span>
              <span className="text-right">Status</span>
            </div>

            <div className="divide-y divide-slate-100">
              {products.map((product) => {
                const balance = Number(product.balance || 0);
                const status =
                  balance > 0
                    ? "Customer has"
                    : balance < 0
                      ? "Customer owes"
                      : "Balanced";

                const statusClass =
                  balance > 0
                    ? "bg-emerald-50 text-emerald-700"
                    : balance < 0
                      ? "bg-rose-50 text-rose-700"
                      : "bg-slate-100 text-slate-600";

                return (
                  <div
                    key={product.id || product.productId || product.name}
                    className="grid grid-cols-1 gap-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_110px_130px] sm:items-center sm:gap-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {product.name || product.productName || "Product"}
                      </p>
                      {product.unit && (
                        <p className="mt-1 text-xs text-slate-500">
                          Unit: {product.unit}
                        </p>
                      )}
                    </div>

                    <p className="text-sm font-semibold tabular-nums text-slate-800 sm:text-right">
                      {formatNumber(Math.abs(balance))}
                    </p>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass} sm:ml-auto`}
                    >
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Balance values are supplied by the parent page. Ensure they are
        calculated from actual jar/product transactions before using
        them for reconciliation.
      </p>
    </div>
  );
}
