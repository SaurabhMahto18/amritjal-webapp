
import { useEffect, useMemo, useState } from "react";

import {
  Save,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Package,
  AlertCircle,
  Info,
  UserRound,
  ReceiptText,
  CalendarDays,
  Truck,
  ClipboardList,
  IndianRupee,
  CheckCircle2,
} from "lucide-react";

import deliveryService from "../services/deliveryService";

/* ---------------------------------
   Helpers
--------------------------------- */

const today = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const getInitialForm = (initialData = {}) => ({
  customer_id:
    initialData.customer_id ||
    initialData.customerId ||
    "",

  delivery_date:
    initialData.delivery_date ||
    initialData.date ||
    today(),

  delivery_shift:
    initialData.delivery_shift ||
    initialData.shift ||
    "morning",

  delivered_by:
    initialData.delivered_by ||
    initialData.deliveredBy ||
    "",

  notes: initialData.notes || "",
});

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const inputClass =
  "w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

function createProductRow(plan, product) {
  return {
    rowId: `${product.id}-${Date.now()}-${Math.random()}`,

    productId: product.id,
    productName: product.name,

    unit: product.unit || "unit",

    isReturnableJar: Boolean(product.is_returnable_jar),

    quantity: String(
      Number(plan.default_quantity) > 0
        ? plan.default_quantity
        : 1
    ),

    returned: "0",

    unitPrice: String(
      plan.unit_price ?? product.sale_price ?? 0
    ),
  };
}

/* ---------------------------------
   Component
--------------------------------- */

export default function DeliveryForm({
  customers = [],
  employees = [],
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = "Save Delivery",
}) {
  const [form, setForm] = useState(() =>
    getInitialForm(initialData)
  );

  const [assignedProducts, setAssignedProducts] = useState([]);
  const [productRows, setProductRows] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [productError, setProductError] = useState("");

  /* ---------------------------------
     Selected records
  --------------------------------- */

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) => customer.id === form.customer_id
      ),
    [customers, form.customer_id]
  );

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) => employee.id === form.delivered_by
      ),
    [employees, form.delivered_by]
  );

  const selectedProductIds = useMemo(
    () => new Set(productRows.map((row) => row.productId)),
    [productRows]
  );

  const availableProducts = useMemo(
    () =>
      assignedProducts.filter(
        (item) => !selectedProductIds.has(item.productId)
      ),
    [assignedProducts, selectedProductIds]
  );

  const validRows = useMemo(
    () =>
      productRows.filter(
        (row) =>
          row.productId &&
          Number(row.quantity) > 0
      ),
    [productRows]
  );

  /* ---------------------------------
     Calculations
  --------------------------------- */

  const totalAmount = useMemo(
    () =>
      validRows.reduce(
        (sum, row) =>
          sum +
          Number(row.quantity || 0) *
          Number(row.unitPrice || 0),
        0
      ),
    [validRows]
  );

  const totalDelivered = useMemo(
    () =>
      validRows
        .filter((row) => row.isReturnableJar)
        .reduce(
          (sum, row) => sum + Number(row.quantity || 0),
          0
        ),
    [validRows]
  );

  const totalReturned = useMemo(
    () =>
      validRows
        .filter((row) => row.isReturnableJar)
        .reduce(
          (sum, row) => sum + Number(row.returned || 0),
          0
        ),
    [validRows]
  );

  /* ---------------------------------
     Load customer assigned products
  --------------------------------- */

  useEffect(() => {
    let active = true;

    async function load() {
      if (!form.customer_id) {
        setAssignedProducts([]);
        setProductRows([]);
        setLoadingProducts(false);
        return;
      }

      setLoadingProducts(true);
      setProductError("");

      try {
        const [plans, products] = await Promise.all([
          deliveryService.getCustomerRatePlans(
            form.customer_id,
            form.delivery_date
          ),

          deliveryService.getProducts(),
        ]);

        if (!active) return;

        const productMap = new Map(
          products.map((product) => [
            product.id,
            product,
          ])
        );

        const mapped = plans
          .map((plan) => {
            const product = productMap.get(plan.product_id);

            if (!product) return null;

            return {
              planId: plan.id,
              productId: product.id,
              productName: product.name,
              sku: product.sku || "",
              unit: product.unit || "unit",

              salePrice: Number(product.sale_price || 0),
              unitPrice: Number(plan.unit_price || 0),

              defaultQuantity: Number(
                plan.default_quantity ?? 1
              ),

              isReturnableJar: Boolean(
                product.is_returnable_jar
              ),
            };
          })
          .filter(Boolean);

        setAssignedProducts(mapped);

        // Preserve rows where the product remains assigned.
        setProductRows((previous) => {
          if (previous.length === 0) return [];

          return previous
            .map((row) => {
              const updated = mapped.find(
                (product) =>
                  product.productId === row.productId
              );

              if (!updated) return null;

              return {
                ...row,
                productName: updated.productName,
                unit: updated.unit,
                isReturnableJar: updated.isReturnableJar,
              };
            })
            .filter(Boolean);
        });
      } catch (err) {
        if (active) {
          setProductError(
            err?.message ||
              "Unable to load assigned products."
          );
        }
      } finally {
        if (active) {
          setLoadingProducts(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [form.customer_id, form.delivery_date]);

  /* ---------------------------------
     Reset when editing another delivery
  --------------------------------- */

  useEffect(() => {
    setForm(getInitialForm(initialData));
    setProductRows([]);
    setAssignedProducts([]);
    setError("");
    setProductError("");
  }, [initialData]);

  /* ---------------------------------
     Form handlers
  --------------------------------- */

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleCustomerChange(event) {
    const customerId = event.target.value;

    setForm((previous) => ({
      ...previous,
      customer_id: customerId,
    }));

    setProductRows([]);
    setAssignedProducts([]);
    setProductError("");
    setError("");
  }

  /* ---------------------------------
     Product handlers
  --------------------------------- */

  function addProductRow() {
    if (availableProducts.length === 0) return;

    const product = availableProducts[0];

    setProductRows((previous) => [
      ...previous,

      createProductRow(
        {
          default_quantity: product.defaultQuantity,
          unit_price: product.unitPrice,
        },
        {
          id: product.productId,
          name: product.productName,
          unit: product.unit,
          is_returnable_jar: product.isReturnableJar,
        }
      ),
    ]);
  }

  // Update a product using its unique rowId.
  function updateProductRow(rowId, field, value) {
    setProductRows((previous) =>
      previous.map((row) =>
        row.rowId === rowId
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  }

  function changeProduct(rowId, productId) {
    const product = assignedProducts.find(
      (item) => item.productId === productId
    );

    if (!product) return;

    setProductRows((previous) =>
      previous.map((row) =>
        row.rowId === rowId
          ? {
              ...row,

              productId: product.productId,
              productName: product.productName,
              unit: product.unit,

              isReturnableJar: product.isReturnableJar,

              quantity: String(
                product.defaultQuantity > 0
                  ? product.defaultQuantity
                  : 1
              ),

              returned: "0",
              unitPrice: String(product.unitPrice),
            }
          : row
      )
    );
  }

  function removeProductRow(rowId) {
    setProductRows((previous) =>
      previous.filter((row) => row.rowId !== rowId)
    );
  }

  /* ---------------------------------
     Validation
  --------------------------------- */

  function validateRows() {
    if (productRows.length === 0) {
      return "Please add at least one assigned product.";
    }

    for (const row of productRows) {
      const product = assignedProducts.find(
        (item) => item.productId === row.productId
      );

      if (!product) {
        return "A selected product is not assigned to this customer.";
      }

      const quantity = Number(row.quantity);
      const returned = Number(row.returned);
      const rate = Number(row.unitPrice);

      if (
        row.quantity === "" ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return `Enter a valid delivered quantity for ${row.productName}.`;
      }

      if (
        product.isReturnableJar &&
        !Number.isInteger(quantity)
      ) {
        return `Jar quantity for ${row.productName} must be a whole number.`;
      }

      if (
        row.returned === "" ||
        !Number.isFinite(returned) ||
        returned < 0 ||
        returned > quantity
      ) {
        return `Returned quantity for ${row.productName} must be between 0 and delivered quantity.`;
      }

      if (
        product.isReturnableJar &&
        !Number.isInteger(returned)
      ) {
        return `Returned jar quantity for ${row.productName} must be a whole number.`;
      }

      if (
        !Number.isFinite(rate) ||
        rate < 0 ||
        row.unitPrice === ""
      ) {
        return `Enter a valid rate for ${row.productName}.`;
      }
    }

    return "";
  }

  /* ---------------------------------
     Submit
  --------------------------------- */

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!form.customer_id) {
      setError("Please select a customer.");
      return;
    }

    if (!form.delivery_date) {
      setError("Please select a delivery date.");
      return;
    }

    if (!assignedProducts.length) {
      setError(
        "This customer has no assigned products for the selected date. Assign products from the customer profile first."
      );
      return;
    }

    const validationError = validateRows();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (form.delivered_by && !selectedEmployee) {
      setError("Please select an available employee.");
      return;
    }

    if (typeof onSubmit !== "function") {
      setError("Delivery submission is not configured.");
      return;
    }

    const items = productRows.map((row) => ({
      productId: row.productId,
      quantity: Number(row.quantity),

      returned: row.isReturnableJar
        ? Number(row.returned)
        : 0,

      unitPrice: Number(row.unitPrice),
    }));

    const employeeName =
      selectedEmployee?.full_name ||
      selectedEmployee?.name ||
      "";

    try {
      setSaving(true);

      await onSubmit({
        customerId: form.customer_id,
        date: form.delivery_date,
        shift: form.delivery_shift,

        deliveredBy: form.delivered_by || null,
        deliveryPerson: employeeName,

        notes: form.notes.trim(),
        items,

        // Compatibility fields
        customer_id: form.customer_id,
        delivery_date: form.delivery_date,
        delivery_shift: form.delivery_shift,
        delivered_by: form.delivered_by || null,
      });
    } catch (err) {
      setError(
        err?.message || "Unable to save delivery."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------
     UI
  --------------------------------- */

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 px-5 py-6 text-white sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-teal-100">
                <Truck size={14} />
                DELIVERY MANAGEMENT
              </div>

              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                New Delivery
              </h2>

              <p className="mt-1.5 text-sm text-slate-300">
                Manage customer deliveries, products and returns.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start rounded-xl border border-white/15 bg-white/10 px-4 py-3 sm:self-center">
              <div className="rounded-lg bg-teal-400/15 p-2 text-teal-300">
                <CalendarDays size={20} />
              </div>

              <div>
                <p className="text-xs text-slate-300">
                  Delivery Date
                </p>

                <p className="text-sm font-semibold text-white">
                  {form.delivery_date || today()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="space-y-7 p-4 sm:p-6 lg:p-7">

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={19} className="mt-0.5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Unable to continue
                </p>

                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Delivery Details */}
          <section>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <ClipboardList size={20} />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delivery Details
                </h3>

                <p className="text-xs text-slate-500">
                  Customer and delivery information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Customer */}
              <div className="md:col-span-2">
                <label
                  htmlFor="delivery-customer"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Customer <span className="text-red-500">*</span>
                </label>

                <select
                  id="delivery-customer"
                  name="customer_id"
                  required
                  value={form.customer_id}
                  onChange={handleCustomerChange}
                  className={inputClass}
                >
                  <option value="">Choose a customer</option>

                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.phone ? ` — ${customer.phone}` : ""}
                    </option>
                  ))}
                </select>

                {selectedCustomer && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-3 py-2.5 text-xs text-teal-800">
                    <CheckCircle2 size={15} />

                    <span className="font-semibold">
                      {selectedCustomer.name}
                    </span>

                    {selectedCustomer.phone && (
                      <span>· {selectedCustomer.phone}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label
                  htmlFor="delivery-date"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Delivery Date <span className="text-red-500">*</span>
                </label>

                <input
                  id="delivery-date"
                  name="delivery_date"
                  type="date"
                  required
                  value={form.delivery_date}
                  onChange={handleFormChange}
                  className={inputClass}
                />
              </div>

              {/* Shift */}
              <div>
                <label
                  htmlFor="delivery-shift"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Delivery Shift <span className="text-red-500">*</span>
                </label>

                <select
                  id="delivery-shift"
                  name="delivery_shift"
                  value={form.delivery_shift}
                  onChange={handleFormChange}
                  className={inputClass}
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
              </div>

              {/* Employee */}
              <div className="md:col-span-2">
                <label
                  htmlFor="delivery-employee"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Delivery Person{" "}
                  <span className="font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <select
                  id="delivery-employee"
                  name="delivered_by"
                  value={form.delivered_by}
                  onChange={handleFormChange}
                  className={inputClass}
                >
                  <option value="">Assign delivery person</option>

                  {employees
                    .filter(
                      (employee) =>
                        employee.active !== false &&
                        employee.status !== "inactive"
                    )
                    .map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.full_name || employee.name || "Employee"}
                        {employee.job_title
                          ? ` — ${employee.job_title}`
                          : employee.role
                            ? ` — ${employee.role}`
                            : ""}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </section>

          <div className="border-t border-slate-100" />

          {/* Products */}
          <section>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                  <Package size={20} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Delivery Products
                  </h3>

                  <p className="text-xs text-slate-500">
                    Add products assigned to this customer
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={addProductRow}
                disabled={
                  loadingProducts ||
                  availableProducts.length === 0
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={17} />
                Add Product
              </button>
            </div>

            {/* Loading */}
            {loadingProducts && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                <RefreshCw
                  size={18}
                  className="animate-spin text-teal-700"
                />
                Loading customer assigned products...
              </div>
            )}

            {/* Product error */}
            {productError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {productError}
              </div>
            )}

            {/* No products */}
            {!loadingProducts &&
              form.customer_id &&
              assignedProducts.length === 0 &&
              !productError && (
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-6 text-center">
                  <Package
                    size={30}
                    className="mx-auto mb-3 text-amber-600"
                  />

                  <p className="font-semibold text-amber-900">
                    No products assigned
                  </p>

                  <p className="mt-1 text-sm text-amber-700">
                    Assign products from this customer's Products tab
                    before creating a delivery.
                  </p>
                </div>
              )}

            {/* Select customer */}
            {!form.customer_id && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
                <UserRound
                  size={30}
                  className="mx-auto mb-3 text-slate-400"
                />

                <p className="font-semibold text-slate-700">
                  Select a customer first
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Assigned products and rates will appear here.
                </p>
              </div>
            )}

            {/* Product rows */}
            <div className="space-y-4">
              {productRows.map((row, index) => (
                <div
                  key={row.rowId}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-200"
                >
                  {/* Product header */}
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-sm font-bold text-teal-800">
                        {index + 1}
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Product {index + 1}
                        </p>

                        <p className="text-xs text-slate-500">
                          Delivery item details
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeProductRow(row.rowId)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>

                  {/* Product content */}
                  <div className="space-y-5 p-4 sm:p-5">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        Select Product
                      </label>

                      <select
                        value={row.productId}
                        onChange={(event) =>
                          changeProduct(
                            row.rowId,
                            event.target.value
                          )
                        }
                        className={inputClass}
                        required
                      >
                        {assignedProducts.map((product) => {
                          const usedByAnotherRow =
                            productRows.some(
                              (other) =>
                                other.productId === product.productId &&
                                other.rowId !== row.rowId
                            );

                          return (
                            <option
                              key={product.productId}
                              value={product.productId}
                              disabled={usedByAnotherRow}
                            >
                              {product.productName}
                              {product.sku ? ` (${product.sku})` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Quantity and rate grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Delivered */}
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          Delivered Qty *
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.quantity}
                          onChange={(event) =>
                            updateProductRow(
                              row.rowId,
                              "quantity",
                              event.target.value
                            )
                          }
                          className={inputClass}
                          required
                        />
                      </div>

                      {/* Returned */}
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          Returned Qty
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.returned}
                          onChange={(event) =>
                            updateProductRow(
                              row.rowId,
                              "returned",
                              event.target.value
                            )
                          }
                          className={inputClass}
                          disabled={!row.isReturnableJar}
                        />

                        {!row.isReturnableJar && (
                          <p className="mt-1 text-xs text-slate-400">
                            Returns not enabled
                          </p>
                        )}
                      </div>

                      {/* Rate */}
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          Rate Per Unit (₹) *
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.unitPrice}
                          onChange={(event) =>
                            updateProductRow(
                              row.rowId,
                              "unitPrice",
                              event.target.value
                            )
                          }
                          className={inputClass}
                          required
                        />
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          Product Amount
                        </label>

                        <div className="flex min-h-[46px] items-center rounded-xl border border-teal-100 bg-teal-50 px-3.5 py-2.5">
                          <span className="text-base font-bold text-teal-800">
                            {currency.format(
                              Math.max(
                                0,
                                Number(row.quantity) || 0
                              ) *
                              Math.max(
                                0,
                                Number(row.unitPrice) || 0
                              )
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add another product */}
            {productRows.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">
                  {productRows.length} product
                  {productRows.length === 1 ? "" : "s"} added
                </p>

                {availableProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={addProductRow}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                  >
                    <Plus size={16} />
                    Add another product
                  </button>
                )}
              </div>
            )}

            {/* First product button */}
            {assignedProducts.length > 0 &&
              productRows.length === 0 &&
              !loadingProducts && (
                <button
                  type="button"
                  onClick={addProductRow}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-teal-400 bg-teal-50/50 px-4 py-4 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"
                >
                  <Plus size={18} />
                  Add your first product
                </button>
              )}
          </section>

          <div className="border-t border-slate-100" />

          {/* Delivery Summary */}
          <section>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ReceiptText size={20} />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delivery Summary
                </h3>

                <p className="text-xs text-slate-500">
                  Review quantities and total amount
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">
                    Products Selected
                  </p>

                  <Package size={17} className="text-slate-400" />
                </div>

                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {productRows.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">
                    Delivered Jars
                  </p>

                  <Truck size={17} className="text-teal-600" />
                </div>

                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {totalDelivered}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">
                    Returned Jars
                  </p>

                  <RefreshCw size={17} className="text-amber-600" />
                </div>

                <p className="mt-3 text-2xl font-bold text-amber-600">
                  {totalReturned}
                </p>
              </div>
            </div>

            {/* Total amount */}
            <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 to-teal-900 p-5 text-white shadow-lg sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-teal-100">
                    <IndianRupee size={16} />
                    Total Delivery Amount
                  </div>

                  <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                    {currency.format(totalAmount)}
                  </p>

                  <p className="mt-2 text-xs text-teal-100/80">
                    Delivered quantity × unit rate
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-teal-200">
                  <ReceiptText size={28} />
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Returned quantities are recorded separately.
              Delivery amount is calculated using delivered
              quantity and unit rate. Returns are not deducted
              from this amount in the current form.
            </p>
          </section>

          {/* Notes */}
          <section>
            <label
              htmlFor="delivery-notes"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Delivery Notes{" "}
              <span className="font-normal text-slate-400">
                (Optional)
              </span>
            </label>

            <textarea
              id="delivery-notes"
              name="notes"
              rows={3}
              maxLength={1000}
              value={form.notes}
              onChange={handleFormChange}
              className={`${inputClass} min-h-[100px] resize-y`}
              placeholder="Add special delivery instructions..."
            />
          </section>

          {/* Information */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <Info
              size={18}
              className="mt-0.5 shrink-0 text-blue-700"
            />

            <p className="text-xs leading-5 text-blue-800">
              Product rates are loaded from the customer's
              assigned rate plans. Changing a rate here
              affects this delivery only and does not update
              the saved customer rate plan.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <X size={17} />
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                loadingProducts ||
                customers.length === 0 ||
                productRows.length === 0
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-700 px-7 py-3 text-sm font-bold text-white shadow-md shadow-teal-900/10 transition hover:bg-teal-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              {saving ? "Saving Delivery..." : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
