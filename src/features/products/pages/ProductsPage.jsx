
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Pencil,
  Boxes,
  Wallet,
  X,
  Filter,
} from "lucide-react";

import productService from "../services/productService";
import ProductForm from "../components/ProductForm";

const COLORS = {
  navy: "#102D3A",
  teal: "#087F8C",
  aqua: "#DDF4F1",
  background: "#F3F7F8",
  border: "#DCE8EA",
  muted: "#8299A5",
};

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const categoryLabels = {
  water: "Water",
  jar: "Jars and Containers",
  accessories: "Accessories",
  other: "Other",
};

function getStockStatus(quantity) {
  const stock = Number(quantity) || 0;

  if (stock <= 0) {
    return {
      label: "Out of Stock",
      className: "bg-red-50 text-red-700",
      dot: "bg-red-500",
    };
  }

  if (stock <= 10) {
    return {
      label: "Low Stock",
      className: "bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    };
  }

  return {
    label: "In Stock",
    className: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  };
}

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[#DCE8EA] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#8299A5]">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#102D3A]">
            {value}
          </p>
          <p className="mt-1 text-xs text-[#8299A5]">
            {subtitle}
          </p>
        </div>

        <div className="flex size-11 items-center justify-center rounded-xl bg-[#DDF4F1] text-[#087F8C]">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function ProductImage() {
  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[#DCE8EA] bg-[#F3F7F8] text-[#087F8C]">
      <Package size={23} />
    </div>
  );
}

function ActionButton({ children, onClick, variant = "default", disabled }) {
  const styles = {
    default:
      "border border-[#DCE8EA] text-[#102D3A] hover:bg-[#F3F7F8]",
    primary:
      "bg-[#087F8C] text-white hover:bg-[#066B76]",
    danger:
      "text-red-500 hover:bg-red-50 hover:text-red-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export default function ProductsPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await productService.getAll();
      setProducts(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Products loading error:", err);
      setError(err.message || "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const name = (product.name || "").toLowerCase();
      const sku = (product.sku || "").toLowerCase();
      const productCategory = (
        product.category || "other"
      ).toLowerCase();

      const matchesSearch =
        !term ||
        name.includes(term) ||
        sku.includes(term) ||
        productCategory.includes(term);

      const matchesCategory =
        category === "all" || productCategory === category;

      const stock = Number(product.stockQuantity) || 0;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "out" && stock <= 0) ||
        (stockFilter === "low" && stock > 0 && stock <= 10) ||
        (stockFilter === "available" && stock > 10);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, category, stockFilter]);

  const totalStock = products.reduce(
    (sum, product) =>
      sum + (Number(product.stockQuantity) || 0),
    0
  );

  const inventoryCost = products.reduce((sum, product) => {
    return (
      sum +
      (Number(product.costPrice) || 0) *
        (Number(product.stockQuantity) || 0)
    );
  }, 0);

  const lowStockCount = products.filter(
    (product) => (Number(product.stockQuantity) || 0) <= 10
  ).length;

  async function handleSave(formData) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, formData);
        setSuccess("Product updated successfully.");
      } else {
        await productService.create(formData);
        setSuccess("Product created successfully.");
      }

      setShowForm(false);
      setEditingProduct(null);

      await loadProducts();
    } catch (err) {
      console.error("Product save error:", err);
      setError(err.message || "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"?\n\nIf this product has existing stock transactions or delivery records, the database may prevent deletion to protect historical records.`
    );

    if (!confirmed) return;

    setDeletingId(product.id);
    setError("");
    setSuccess("");

    try {
      await productService.delete(product.id);

      setProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );

      setSuccess("Product deleted successfully.");
    } catch (err) {
      console.error("Product delete error:", err);
      setError(
        err.message ||
          "Unable to delete product. It may be linked to existing records."
      );
    } finally {
      setDeletingId("");
    }
  }

  function startCreate() {
    setEditingProduct(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function startEdit(product) {
    setEditingProduct(product);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingProduct(null);
  }

  function openProductDetails(product) {
    navigate(`/products/${product.id}`);
  }

  function clearFilters() {
    setSearch("");
    setCategory("all");
    setStockFilter("all");
  }

  const hasFilters =
    search.trim() !== "" ||
    category !== "all" ||
    stockFilter !== "all";



  // SEO METADATA
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

    document.title = "Products & Inventory | Amrit Jal";

    description.setAttribute("name", "description");
    description.setAttribute(
      "content",
      "Manage your Amrit Jal product catalog, product categories, jar pricing, inventory, stock availability and product records."
    );

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
  }, []);

  
  return (
    <main className="min-h-screen bg-[#F3F7F8] px-4 py-5 text-[#102D3A] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">

      
        {/* ALERTS */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
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

        {/* SUMMARY */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Products"
            value={products.length}
            subtitle="Products in catalog"
            icon={Boxes}
          />

          <StatCard
            title="Total Stock"
            value={totalStock}
            subtitle="Units across products"
            icon={Package}
          />

          <StatCard
            title="Low / Out of Stock"
            value={lowStockCount}
            subtitle="Products with 10 units or fewer"
            icon={AlertCircle}
          />

          <StatCard
            title="Inventory Cost"
            value={currency(inventoryCost)}
            subtitle="Estimated cost of current stock"
            icon={Wallet}
          />
        </section>

        {/* ADD / EDIT PRODUCT */}
        {showForm && (
          <section className="overflow-hidden rounded-2xl border border-[#DCE8EA] bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[#DCE8EA] bg-[#F8FAFB] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-[#102D3A]">
                  {editingProduct ? "Edit Product" : "Add Product"}
                </h2>

                <p className="mt-1 text-sm text-[#8299A5]">
                  Enter product details, pricing and inventory.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-[#8299A5] transition hover:bg-white hover:text-[#102D3A]"
                aria-label="Close product form"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <ProductForm
                initialData={editingProduct}
                onSubmit={handleSave}
                onCancel={closeForm}
                saving={saving}
              />
            </div>
          </section>
        )}

        {/* PRODUCT SEARCH */}
        <section className="rounded-2xl border border-[#DCE8EA] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8299A5]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search product..."
                aria-label="Search products"
                className="w-full rounded-xl border border-[#DCE8EA] bg-white py-3.5 pl-11 pr-4 text-sm text-[#102D3A] outline-none transition placeholder:text-[#8299A5] focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters((current) => !current)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  showFilters || hasFilters
                    ? "border-[#087F8C] bg-[#DDF4F1] text-[#087F8C]"
                    : "border-[#DCE8EA] bg-white text-[#102D3A] hover:bg-[#F3F7F8]"
                }`}
              >
                <Filter size={17} />
                Filters
                {hasFilters && (
                  <span className="size-2 rounded-full bg-[#087F8C]" />
                )}
              </button>
               <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087F8C] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#066B76]"
            >
              <Plus size={18} />
              Add Product
            </button>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl px-3 py-3 text-sm font-semibold text-[#087F8C] hover:bg-[#DDF4F1]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#DCE8EA] pt-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#8299A5]">
                  Product Category
                </label>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-xl border border-[#DCE8EA] bg-white px-3 py-3 text-sm outline-none focus:border-[#087F8C]"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#8299A5]">
                  Stock Status
                </label>

                <select
                  value={stockFilter}
                  onChange={(event) => setStockFilter(event.target.value)}
                  className="w-full rounded-xl border border-[#DCE8EA] bg-white px-3 py-3 text-sm outline-none focus:border-[#087F8C]"
                >
                  <option value="all">All Stock Statuses</option>
                  <option value="available">Available (More than 10)</option>
                  <option value="low">Low Stock (1–10)</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* PRODUCT INVENTORY */}
        <section className="overflow-hidden rounded-2xl border border-[#DCE8EA] bg-white shadow-sm">

          <div className="flex flex-col gap-1 border-b border-[#DCE8EA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-bold text-[#102D3A]">
                Product Inventory
              </h2>

              <p className="mt-1 text-xs text-[#8299A5]">
                Manage your products, pricing and available stock.
              </p>
            </div>

            <span className="text-xs font-medium text-[#8299A5]">
              {visibleProducts.length} of {products.length} products
            </span>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16 text-[#8299A5]">
              <LoaderCircle
                size={30}
                className="animate-spin text-[#087F8C]"
              />
              <p className="text-sm">Loading products...</p>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-16 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#DDF4F1] text-[#087F8C]">
                <Package size={30} />
              </div>

              <h3 className="font-semibold text-[#102D3A]">
                No products found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-[#8299A5]">
                {hasFilters
                  ? "Try changing your search or filters."
                  : "Start by adding your first product to the catalog."}
              </p>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl border border-[#DCE8EA] px-4 py-2.5 text-sm font-semibold text-[#087F8C] hover:bg-[#DDF4F1]"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCreate}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#087F8C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#066B76]"
                >
                  <Plus size={17} />
                  Add Product
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">

                <thead className="bg-[#F3F7F8] text-[#607987]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Product</th>
                    <th className="px-5 py-4 font-semibold">Category</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Cost Price
                    </th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Price / Unit
                    </th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Stock
                    </th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#DCE8EA]">
                  {visibleProducts.map((product) => {
                    const stock =
                      Number(product.stockQuantity) || 0;

                    const status = getStockStatus(stock);

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-[#F8FAFB]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <ProductImage />

                            <div className="min-w-0">
                              <p className="font-semibold text-[#102D3A]">
                                {product.name}
                              </p>

                              <p className="mt-1 text-xs text-[#8299A5]">
                                SKU: {product.sku || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-[#DCE8EA] bg-[#F3F7F8] px-3 py-1.5 text-xs font-medium text-[#607987]">
                            {categoryLabels[product.category] ||
                              product.category ||
                              "Other"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right text-[#607987]">
                          {currency(product.costPrice)}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-[#102D3A]">
                          {currency(product.sellingPrice)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="font-semibold text-[#102D3A]">
                            {stock}
                          </span>

                          <span className="ml-1 text-xs text-[#8299A5]">
                            {product.unit || "jar"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.className}`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${status.dot}`}
                            />
                            {status.label}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <ActionButton
                              onClick={() => openProductDetails(product)}
                            >
                              <Eye size={15} />
                              View
                            </ActionButton>

                            <ActionButton
                              onClick={() => startEdit(product)}
                            >
                              <Pencil size={14} />
                              Edit
                            </ActionButton>

                            <button
                              type="button"
                              onClick={() => handleDelete(product)}
                              disabled={deletingId === product.id}
                              aria-label={`Delete ${product.name}`}
                              title="Delete product"
                              className="rounded-lg p-2 text-[#8299A5] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              {deletingId === product.id ? (
                                <LoaderCircle
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={17} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && visibleProducts.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-[#DCE8EA] bg-[#F8FAFB] px-5 py-4 text-xs text-[#8299A5] sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {visibleProducts.length} of {products.length} products
              </span>

              <span>
                Inventory cost: {currency(inventoryCost)}
              </span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
