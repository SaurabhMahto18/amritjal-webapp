import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";

const inputClass =
  "min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function ProductField({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600 sm:text-sm">
        {label}
      </span>
      {children}
    </label>
  );
}

function Message({ type = "error", children }) {
  const styles =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-rose-200 bg-rose-50 text-rose-700";

  const Icon = type === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={type === "success" ? "status" : "alert"}
      className={`flex min-w-0 items-start gap-2.5 rounded-xl border p-3 text-sm ${styles}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function QuantityControl({ value, onChange, disabled = false }) {
  const quantity = Number(value) || 0;

  return (
    <div className="flex h-11 w-full max-w-40 items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        disabled={disabled || quantity <= 0}
        onClick={() =>
          onChange(String(Math.max(0, quantity - 1)))
        }
        className="flex h-full w-11 shrink-0 items-center justify-center bg-slate-50 text-lg text-slate-600 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        −
      </button>

      <input
        type="number"
        min="0"
        step="1"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-full min-w-0 flex-1 border-x border-slate-200 text-center text-sm font-semibold outline-none disabled:bg-slate-50"
        aria-label="Quantity"
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(String(quantity + 1))}
        className="flex h-full w-11 shrink-0 items-center justify-center bg-slate-50 text-lg text-slate-600 hover:bg-teal-50 disabled:opacity-40"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export default function CustomerProductsSection({
  customerId,
  customer,
  isArchived = false,
  customerServiceApi,
}) {
  const [assignments, setAssignments] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [defaultQuantity, setDefaultQuantity] = useState("1");

  const [editingId, setEditingId] = useState("");
  const [editingPrice, setEditingPrice] = useState("");
  const [editingQuantity, setEditingQuantity] = useState("1");

  const loadProducts = useCallback(async () => {
    if (!customerId || !customerServiceApi) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [assigned, products] = await Promise.all([
        customerServiceApi.getAssignedProducts(customerId),
        customerServiceApi.getAvailableProducts(),
      ]);

      setAssignments(Array.isArray(assigned) ? assigned : []);
      setAvailableProducts(Array.isArray(products) ? products : []);
    } catch (err) {
      setError(err?.message || "Unable to load customer products.");
    } finally {
      setLoading(false);
    }
  }, [customerId, customerServiceApi]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const assignedProductIds = useMemo(
    () => new Set(assignments.map((item) => item.productId)),
    [assignments]
  );

  const unassignedProducts = useMemo(
    () =>
      availableProducts.filter(
        (product) => !assignedProductIds.has(product.id)
      ),
    [availableProducts, assignedProductIds]
  );

  function handleProductChange(productId) {
    setSelectedProductId(productId);

    const product = availableProducts.find(
      (item) => item.id === productId
    );

    setUnitPrice(product ? String(product.salePrice ?? 0) : "");
  }

  function resetForm() {
    setShowForm(false);
    setSelectedProductId("");
    setUnitPrice("");
    setDefaultQuantity("1");
  }

  function validateNumbers(price, quantity) {
    if (
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      setError("Please enter a valid product rate.");
      return false;
    }

    if (
      quantity === "" ||
      !Number.isFinite(Number(quantity)) ||
      Number(quantity) < 0
    ) {
      setError("Please enter a valid default quantity.");
      return false;
    }

    return true;
  }

  async function handleAssignProduct(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (isArchived || saving) return;

    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }

    if (!validateNumbers(unitPrice, defaultQuantity)) return;

    setSaving(true);

    try {
      await customerServiceApi.assignProduct(
        customerId,
        selectedProductId,
        Number(unitPrice),
        Number(defaultQuantity)
      );

      resetForm();
      await loadProducts();
      setSuccess("Product assigned successfully.");
    } catch (err) {
      setError(err?.message || "Unable to assign product.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(item) {
    setEditingId(item.id);
    setEditingPrice(String(item.unitPrice ?? 0));
    setEditingQuantity(String(item.defaultQuantity ?? 1));
    setExpandedId(item.id);
    setError("");
    setSuccess("");
  }

  async function handleUpdateAssignment(event) {
    event.preventDefault();

    if (isArchived || saving || !editingId) return;

    setError("");
    setSuccess("");

    if (!validateNumbers(editingPrice, editingQuantity)) return;

    setSaving(true);

    try {
      await customerServiceApi.updateProductAssignment(
        editingId,
        Number(editingPrice),
        Number(editingQuantity)
      );

      setEditingId("");
      await loadProducts();
      setSuccess("Product assignment updated successfully.");
    } catch (err) {
      setError(err?.message || "Unable to update product assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(item) {
    if (isArchived || saving) return;

    const confirmed = window.confirm(
      `Remove ${item.productName} from this customer's active product list?`
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await customerServiceApi.deactivateProductAssignment(item.id);

      if (expandedId === item.id) setExpandedId(null);
      if (editingId === item.id) setEditingId("");

      await loadProducts();
      setSuccess(`${item.productName} assignment deactivated.`);
    } catch (err) {
      setError(err?.message || "Unable to deactivate assignment.");
    } finally {
      setSaving(false);
    }
  }


    if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        <RefreshCw size={19} className="animate-spin text-teal-700" />
        Loading customer products...
      </div>
    );
  }

  return (
    <section
      className="w-full min-w-0 space-y-4 sm:space-y-5"
      aria-busy={saving}
    >
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Assigned Products
            </h2>

            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
              {assignments.length} assigned
            </span>
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            Manage products, customer rates and daily quantities.
          </p>

          {customer?.name && (
            <p className="mt-1 text-xs font-medium text-slate-600">
              Customer: {customer.name}
            </p>
          )}
        </div>

        {!isArchived && (
          <button
            type="button"
            onClick={() => {
              setShowForm((value) => !value);
              setError("");
              setSuccess("");
            }}
            disabled={saving}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {showForm ? <X size={17} /> : <Plus size={17} />}
            {showForm ? "Close Form" : "Assign Product"}
          </button>
        )}
      </div>

      {/* Feedback */}
      {error && <Message type="error">{error}</Message>}
      {success && <Message type="success">{success}</Message>}

      {/* Assign Product Form */}
      {showForm && !isArchived && (
        <form
          onSubmit={handleAssignProduct}
          className="min-w-0 space-y-4 rounded-2xl border border-teal-100 bg-teal-50/50 p-4 sm:p-5"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 sm:text-base">
              Assign New Product
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Select a product and configure its customer rate.
            </p>
          </div>

          {unassignedProducts.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
              All active products are already assigned to this customer.
            </div>
          ) : (
            <>
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ProductField label="Select Product">
                  <select
                    value={selectedProductId}
                    onChange={(event) =>
                      handleProductChange(event.target.value)
                    }
                    className={inputClass}
                    required
                  >
                    <option value="">Choose product</option>

                    {unassignedProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                        {product.unit ? ` (${product.unit})` : ""}
                      </option>
                    ))}
                  </select>
                </ProductField>

                <ProductField label="Price Per Unit (₹)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={unitPrice}
                    onChange={(event) => setUnitPrice(event.target.value)}
                    className={inputClass}
                    placeholder="Enter price"
                    required
                  />
                </ProductField>

                <ProductField label="Daily Delivered Quantity">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={defaultQuantity}
                    onChange={(event) =>
                      setDefaultQuantity(event.target.value)
                    }
                    className={inputClass}
                    placeholder="Enter quantity"
                    required
                  />
                </ProductField>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving || !selectedProductId}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {saving ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? "Saving..." : "Save Assignment"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* Empty State */}
      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center sm:py-12">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <Package size={27} />
          </div>

          <h3 className="mt-4 text-base font-bold text-slate-900">
            No Products Assigned
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Assign products to manage this customer's delivery rates and
            quantities.
          </p>

          {!isArchived && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 sm:w-auto"
            >
              <Plus size={17} />
              Assign First Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
          {assignments.map((item) => {
            const expanded = expandedId === item.id;
            const editing = editingId === item.id;

            const totalPrice =
              Number(item.unitPrice || 0) *
              Number(item.defaultQuantity || 0);

            return (
              <article
                key={item.id}
                className={`min-w-0 overflow-hidden rounded-2xl border bg-white transition ${
                  expanded
                    ? "border-teal-200 shadow-sm"
                    : "border-slate-200"
                }`}
              >
                {/* Product Card Header */}
                <div className="flex min-w-0 items-center gap-3 p-3.5 sm:p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 sm:size-11">
                    <Package size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-sm font-bold text-slate-900 sm:text-base">
                      {item.productName}
                    </h3>

                    <p className="mt-0.5 break-words text-xs text-slate-500">
                      {item.sku || item.unit || "Assigned product"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(expanded ? null : item.id)
                    }
                    aria-expanded={expanded}
                    aria-label={
                      expanded
                        ? `Collapse ${item.productName}`
                        : `Expand ${item.productName}`
                    }
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-teal-50 hover:text-teal-700"
                  >
                    {expanded ? (
                      <ChevronUp size={19} />
                    ) : (
                      <ChevronDown size={19} />
                    )}
                  </button>
                </div>

                {/* Compact Summary */}
                <div className="grid grid-cols-2 gap-2 px-3.5 pb-3.5 sm:px-4 sm:pb-4">
                  <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                      Unit Price
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-slate-900 sm:text-base">
                      {money(item.unitPrice)}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                      Default Qty
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 sm:text-base">
                      {item.defaultQuantity ?? 0}
                    </p>
                  </div>
                </div>

                {/* Expanded Details */}
                {expanded && (
                  <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 p-3.5 sm:p-4">
                    {editing ? (
                      <form
                        onSubmit={handleUpdateAssignment}
                        className="space-y-4"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            Edit Product Assignment
                          </h4>
                          <p className="mt-1 text-xs text-slate-500">
                            Update price and default delivery quantity.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <ProductField label="Price Per Unit (₹)">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              inputMode="decimal"
                              value={editingPrice}
                              onChange={(event) =>
                                setEditingPrice(event.target.value)
                              }
                              className={inputClass}
                              required
                            />
                          </ProductField>

                          <ProductField label="Daily Delivered Quantity">
                            <QuantityControl
                              value={editingQuantity}
                              onChange={setEditingQuantity}
                              disabled={saving}
                            />
                          </ProductField>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50 sm:w-auto"
                          >
                            {saving ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Save size={16} />
                            )}
                            {saving ? "Saving..." : "Save Changes"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingId("")}
                            disabled={saving}
                            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-xs text-slate-500">
                              Price Per Unit
                            </p>
                            <p className="mt-1 text-base font-bold text-slate-900">
                              {money(item.unitPrice)}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-xs text-slate-500">
                              Daily Delivered Quantity
                            </p>
                            <p className="mt-1 text-base font-bold text-slate-900">
                              {item.defaultQuantity ?? 0}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-100 bg-teal-50 p-3">
                          <span className="text-xs font-semibold text-teal-800 sm:text-sm">
                            Default Daily Value
                          </span>
                          <span className="text-base font-bold text-teal-900">
                            {money(totalPrice)}
                          </span>
                        </div>

                        {!isArchived && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => startEditing(item)}
                              disabled={saving}
                              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 sm:text-sm"
                            >
                              <Pencil size={15} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeactivate(item)}
                              disabled={saving}
                              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 sm:text-sm"
                            >
                              <Trash2 size={15} />
                              Deactivate
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Information */}
      <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-3.5 sm:p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-700" />
        <p className="min-w-0 text-xs leading-5 text-blue-800 sm:text-sm">
          Product assignment controls which products are available for this
          customer's deliveries. Changing an assignment does not rewrite
          historical delivery records.
        </p>
      </div>
    </section>
  );
}