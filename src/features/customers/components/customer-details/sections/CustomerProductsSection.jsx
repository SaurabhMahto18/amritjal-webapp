
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
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function ProductField({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function QuantityControl({ value, onChange, disabled = false }) {
  const quantity = Number(value) || 0;

  return (
    <div className="inline-flex h-10 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        disabled={disabled || quantity <= 0}
        onClick={() => onChange(String(Math.max(0, quantity - 1)))}
        className="flex h-full w-9 items-center justify-center bg-slate-50 text-slate-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
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
        className="h-full w-14 border-x border-slate-200 text-center text-sm outline-none disabled:bg-slate-50"
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(String(quantity + 1))}
        className="flex h-full w-9 items-center justify-center bg-slate-50 text-slate-600 hover:bg-blue-50 disabled:opacity-40"
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
    if (!customerId || !customerServiceApi) return;

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

    if (isArchived) return;

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

    if (isArchived || !editingId) return;

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
      <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
        <RefreshCw size={19} className="animate-spin text-blue-600" />
        Loading customer products...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Messages */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          {success}
        </div>
      )}

      {/* Assign Product Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">
            Assigned Products
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Select products and manage customer-specific rates.
          </p>
        </div>

        {!isArchived && (
          <button
            type="button"
            onClick={() => {
              setShowForm((value) => !value);
              setError("");
              setSuccess("");
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Close" : "Assign Product"}
          </button>
        )}
      </div>

      {/* New Assignment Form */}
      {showForm && !isArchived && (
        <form
          onSubmit={handleAssignProduct}
          className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5"
        >
          <h4 className="font-semibold text-slate-900">
            Assign New Product
          </h4>

          {unassignedProducts.length === 0 ? (
            <p className="rounded-lg bg-white p-4 text-sm text-slate-500">
              All active products are already assigned to this customer.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                    value={unitPrice}
                    onChange={(event) => setUnitPrice(event.target.value)}
                    className={inputClass}
                    required
                  />
                </ProductField>

                <ProductField label="Daily Delivered Quantity">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={defaultQuantity}
                    onChange={(event) =>
                      setDefaultQuantity(event.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </ProductField>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving || !selectedProductId}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
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
                  className="min-h-10 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* Assigned Product List */}
      {assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
          <Package size={30} className="mx-auto text-blue-600" />

          <h4 className="mt-3 font-semibold text-slate-900">
            No Products Assigned
          </h4>

          <p className="mt-2 text-sm text-slate-500">
            Assign a product to manage this customer's delivery rate.
          </p>

          {!isArchived && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              Assign First Product
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {assignments.map((item) => {
            const expanded = expandedId === item.id;
            const editing = editingId === item.id;

            return (
              <article key={item.id} className="p-4 sm:p-5">
                {/* Product Row */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked
                    readOnly
                    aria-label={`${item.productName} is assigned`}
                    className="size-5 shrink-0 accent-blue-600"
                  />

                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-slate-900">
                      {item.productName}
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      Price Per Unit: {money(item.unitPrice)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(expanded ? null : item.id)
                    }
                    aria-expanded={expanded}
                    aria-label={
                      expanded ? "Collapse product" : "Expand product"
                    }
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {expanded ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                </div>

                {/* Expanded Details */}
                {expanded && (
                  <div className="mt-5 space-y-5 border-l-2 border-blue-100 pl-4 sm:ml-2 sm:pl-5">
                    {editing ? (
                      <form
                        onSubmit={handleUpdateAssignment}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <ProductField label="Price Per Unit (₹)">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editingPrice}
                              onChange={(event) =>
                                setEditingPrice(event.target.value)
                              }
                              className={inputClass}
                              required
                            />
                          </ProductField>

                          <ProductField label="Daily Delivered Quantity">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={editingQuantity}
                              onChange={(event) =>
                                setEditingQuantity(event.target.value)
                              }
                              className={inputClass}
                              required
                            />
                          </ProductField>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            <Save size={15} />
                            Save Changes
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingId("")}
                            disabled={saving}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                            Pricing
                          </p>

                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <p className="mb-1.5 text-xs text-slate-500">
                                Price Per Unit
                              </p>
                              <p className="font-semibold text-slate-900">
                                {money(item.unitPrice)}
                              </p>
                            </div>

                            <div>
                              <p className="mb-1.5 text-xs text-slate-500">
                                Daily Delivered Quantity
                              </p>
                              <p className="font-semibold text-slate-900">
                                {item.defaultQuantity ?? 0}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">
                            Price To Customer:{" "}
                            {money(
                              Number(item.unitPrice) *
                                Number(item.defaultQuantity)
                            )}
                          </p>

                          {!isArchived && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => startEditing(item)}
                                disabled={saving}
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Pencil size={13} />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeactivate(item)}
                                disabled={saving}
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 size={13} />
                                Deactivate
                              </button>
                            </div>
                          )}
                        </div>
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
      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-700" />
        <p className="text-xs leading-5 text-blue-800">
          Product assignment controls which products are available for this
          customer's deliveries. Changing an assignment does not rewrite
          historical delivery records.
        </p>
      </div>
    </div>
  );
}
