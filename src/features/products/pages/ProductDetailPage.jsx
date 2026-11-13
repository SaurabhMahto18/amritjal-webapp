
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  AlertTriangle,
  Boxes,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import productService from "../services/productService";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const dateFormat = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const movementLabels = {
  opening: "Opening Stock",
  loaded: "Stock Added",
  unloaded: "Stock Unloaded",
  delivered: "Delivered",
  returned: "Customer Return",
  damaged: "Damaged",
  lost: "Lost",
  adjustment: "Stock Adjustment",
};

function getMovementDisplay(transaction) {
  const type = transaction.movementType;
  const quantity = Number(transaction.quantity) || 0;

  if (type === "adjustment") {
    return {
      label: quantity >= 0 ? "Stock Increased" : "Stock Reduced",
      quantityLabel: `${quantity > 0 ? "+" : ""}${quantity}`,
      className:
        quantity >= 0
          ? "text-emerald-700"
          : "text-red-700",
    };
  }

  const increase = ["opening", "loaded", "returned"].includes(type);

  return {
    label: movementLabels[type] || type,
    quantityLabel: `${increase ? "+" : "-"}${quantity}`,
    className: increase
      ? "text-emerald-700"
      : "text-red-700",
  };
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [stockMode, setStockMode] = useState("add");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  // LOAD PRODUCT AND STOCK TRANSACTIONS
  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [productData, transactionData] = await Promise.all([
        productService.getById(productId),
        productService.getStockTransactions(productId),
      ]);

      if (!productData) {
        setProduct(null);
        setTransactions([]);
        setError("Product not found.");
        return;
      }

      setProduct(productData);
      setTransactions(transactionData || []);
    } catch (err) {
      console.error("Product detail loading error:", err);

      setProduct(null);
      setTransactions([]);

      setError(
        err?.message || "Unable to load product details."
      );
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  // SEO METADATA
  // IMPORTANT: Keep this hook above all conditional returns.
  useEffect(() => {
    const previousTitle = document.title;

    const descriptionMeta = document.querySelector(
      'meta[name="description"]'
    );

    const robotsMeta = document.querySelector(
      'meta[name="robots"]'
    );

    const previousDescription =
      descriptionMeta?.getAttribute("content");

    const previousRobots =
      robotsMeta?.getAttribute("content");

    const description =
      descriptionMeta || document.createElement("meta");

    const robots =
      robotsMeta || document.createElement("meta");

    const productName = product?.name || "Product";

    const pageTitle =
      `${productName} | Product Details | Amrit Jal`;

    const pageDescription = product
      ? `View ${productName} product information, SKU, category, pricing, current stock, inventory value and stock transaction history in Amrit Jal.`
      : "Manage product information, pricing, inventory and stock transactions in Amrit Jal.";

    document.title = pageTitle;

    description.setAttribute("name", "description");
    description.setAttribute("content", pageDescription);

    robots.setAttribute("name", "robots");
    robots.setAttribute("content", "noindex, nofollow");

    if (!descriptionMeta) {
      document.head.appendChild(description);
    }

    if (!robotsMeta) {
      document.head.appendChild(robots);
    }

    return () => {
      document.title = previousTitle;

      if (descriptionMeta) {
        if (previousDescription === null) {
          description.removeAttribute("content");
        } else {
          description.setAttribute(
            "content",
            previousDescription
          );
        }
      } else {
        description.remove();
      }

      if (robotsMeta) {
        if (previousRobots === null) {
          robots.removeAttribute("content");
        } else {
          robots.setAttribute("content", previousRobots);
        }
      } else {
        robots.remove();
      }
    };
  }, [product]);

  // ADD STOCK OR ADJUST PHYSICAL STOCK
  async function handleStockSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const amount = Number(quantity);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a quantity greater than zero.");
      return;
    }

    setSaving(true);

    try {
      if (stockMode === "add") {
        await productService.addStock(
          productId,
          amount,
          notes || "Stock added from product detail page"
        );

        setSuccess(
          `${amount} ${product.unit} added successfully.`
        );
      } else {
        await productService.adjustStock(
          productId,
          amount,
          notes || "Physical stock count adjustment"
        );

        setSuccess(
          `Physical stock updated to ${amount} ${product.unit}.`
        );
      }

      setQuantity("");
      setNotes("");

      await loadProduct();
    } catch (err) {
      console.error("Stock update error:", err);

      setError(
        err?.message || "Unable to update stock."
      );
    } finally {
      setSaving(false);
    }
  }

  // All hooks are above this point.

  // LOADING STATE
  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <LoaderCircle
            className="animate-spin text-cyan-700"
            size={25}
          />
          Loading product...
        </div>
      </main>
    );
  }

  // PRODUCT NOT FOUND
  if (!product) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={20} />
            <h1 className="font-bold">
              Product unavailable
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            {error || "This product could not be found."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/products")}
            className="mt-5 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Back to Products
          </button>
        </div>
      </main>
    );
  }

  const stock = Number(product.stockQuantity) || 0;

  const stockValue =
    stock * (Number(product.costPrice) || 0);

  const stockStatus =
    stock <= 0
      ? {
          label: "Out of Stock",
          className: "bg-red-50 text-red-700",
        }
      : stock <= 10
        ? {
            label: "Low Stock",
            className: "bg-amber-50 text-amber-700",
          }
        : {
            label: "In Stock",
            className: "bg-emerald-50 text-emerald-700",
          };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* PRODUCT HEADER */}

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-900"
            >
              <ArrowLeft size={17} />
              Back to Products
            </button>

          
          </div>

        
        </header>

        {/* FEEDBACK */}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {/* PRODUCT SUMMARY */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Current Stock"
            value={`${stock} ${product.unit}`}
            subtitle={stockStatus.label}
            icon={<Boxes size={21} />}
          />

          <StatCard
            title="Selling Price"
            value={currency(product.sellingPrice)}
            subtitle="Price per unit"
            icon={<CircleDollarSign size={21} />}
          />

          <StatCard
            title="Cost Price"
            value={currency(product.costPrice)}
            subtitle="Cost per unit"
            icon={<Wallet size={21} />}
          />

          <StatCard
            title="Inventory Value"
            value={currency(stockValue)}
            subtitle="Current stock × cost price"
            icon={<Package size={21} />}
          />
        </section>

        {/* PRODUCT INFORMATION */}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">
                Product Information
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${stockStatus.className}`}
              >
                {stockStatus.label}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <InfoItem label="Product Name" value={product.name} />
              <InfoItem label="SKU" value={product.sku || "—"} />
              <InfoItem
                label="Category"
                value={product.category || "Other"}
              />
              <InfoItem
                label="Unit"
                value={product.unit || "jar"}
              />

              <InfoItem
                label="Jar Size"
                value={
                  product.jarSizeL
                    ? `${product.jarSizeL} Litres`
                    : "Not specified"
                }
              />

              <InfoItem
                label="Returnable Jar"
                value={product.isReturnableJar ? "Yes" : "No"}
              />

              <InfoItem
                label="Product Status"
                value={product.status || "active"}
              />

              <InfoItem
                label="Created On"
                value={dateFormat(product.createdAt)}
              />
            </div>

            {product.description && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </p>

                <p className="mt-2 text-sm text-slate-700">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* STOCK MANAGEMENT */}

          <div className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-cyan-700" />
              <h2 className="text-lg font-bold">
                Stock Management
              </h2>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStockMode("add")}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                  stockMode === "add"
                    ? "border-cyan-700 bg-cyan-50 text-cyan-800"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Plus size={16} />
                  Add Stock
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStockMode("adjust")}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                  stockMode === "adjust"
                    ? "border-cyan-700 bg-cyan-50 text-cyan-800"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                Adjust
              </button>
            </div>

            <form
              onSubmit={handleStockSubmit}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  {stockMode === "add"
                    ? "Quantity to Add"
                    : "Physical Stock Count"}
                </label>

                <input
                  type="number"
                  min="0"
                  step="any"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(event.target.value)
                  }
                  placeholder={
                    stockMode === "add"
                      ? "Enter quantity"
                      : `Current stock: ${stock}`
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                />

                {stockMode === "adjust" && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Enter the actual physical quantity available.
                    The system will calculate the difference.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  Notes (Optional)
                </label>

                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="Reason for stock update..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : stockMode === "add" ? (
                  <TrendingUp size={17} />
                ) : (
                  <TrendingDown size={17} />
                )}

                {saving
                  ? "Saving..."
                  : stockMode === "add"
                    ? "Add Stock"
                    : "Update Physical Stock"}
              </button>
            </form>
          </div>
        </section>

        {/* STOCK TRANSACTION HISTORY */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">
                Stock Transaction History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                All recorded stock movements for this product.
              </p>
            </div>

            <span className="text-sm font-semibold text-slate-500">
              {transactions.length} transactions
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-14 text-center">
              <div className="rounded-2xl bg-cyan-50 p-4 text-cyan-700">
                <CalendarDays size={28} />
              </div>

              <h3 className="mt-4 font-semibold">
                No stock transactions yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Stock additions, deliveries and returns will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Movement</th>
                    <th className="px-5 py-4 text-right">
                      Quantity
                    </th>
                    <th className="px-5 py-4">Notes</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {transactions.map((transaction) => {
                    const display = getMovementDisplay(transaction);

                    return (
                      <tr
                        key={transaction.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 text-slate-600">
                          {dateFormat(transaction.transactionDate)}
                        </td>

                        <td className="px-5 py-4 font-medium">
                          {display.label}
                        </td>

                        <td
                          className={`px-5 py-4 text-right font-bold ${display.className}`}
                        >
                          {display.quantityLabel}
                        </td>

                        <td className="max-w-sm px-5 py-4 text-slate-500">
                          {transaction.notes || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value, subtitle, icon }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
          {icon}
        </div>
      </div>
    </article>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}
