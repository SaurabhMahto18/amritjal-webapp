
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Droplets,
  Package,
  Plus,
  Minus,
  Save,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const getProductId = (plan) =>
  plan.product_id || plan.productId;

const getPlanRate = (plan) =>
  Number(plan.unit_price ?? plan.unitPrice ?? 0);

export default function DeliveryBulkEntry({
  customers = [],
  products = [],
  balances = {},
  date,
  shift = "morning",
  getCustomerRatePlans,
  onSubmit,
  onCancel,
}) {
  const [entries, setEntries] = useState({});
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [planErrors, setPlanErrors] = useState({});
  const [expandedOther, setExpandedOther] = useState({});
  const [productSearch, setProductSearch] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      if (!customers.length || !date) {
        setEntries({});
        return;
      }

      if (typeof getCustomerRatePlans !== "function") {
        setError("Customer product rate-plan service is not configured.");
        return;
      }

      setLoadingPlans(true);
      setError("");
      setPlanErrors({});

      try {
        const results = await Promise.all(
          customers.map(async (customer) => {
            try {
              const plans = await getCustomerRatePlans(
                customer.id,
                date
              );

              const assignedItems = (plans || []).map((plan) => {
                const productId = getProductId(plan);
                const product = products.find(
                  (item) => String(item.id) === String(productId)
                );

                return {
                  productId,
                  productName: product?.name || "Product",
                  isReturnableJar: Boolean(
                    product?.is_returnable_jar
                  ),
                  quantity: 0,
                  returned: 0,
                  unitPrice: getPlanRate(plan),
                  assigned: true,
                };
              });

              // Include all active products, but do not add
              // assigned products a second time.
              const assignedIds = new Set(
                assignedItems.map((item) => String(item.productId))
              );

              const otherItems = products
                .filter(
                  (product) =>
                    !assignedIds.has(String(product.id))
                )
                .map((product) => ({
                  productId: product.id,
                  productName: product.name || "Product",
                  isReturnableJar: Boolean(
                    product.is_returnable_jar
                  ),
                  quantity: 0,
                  returned: 0,
                  unitPrice: Number(product.sale_price || 0),
                  assigned: false,
                }));

              return {
                customerId: customer.id,
                items: [...assignedItems, ...otherItems],
                assignedIds: Array.from(assignedIds),
                error: "",
              };
            } catch (err) {
              return {
                customerId: customer.id,
                items: products.map((product) => ({
                  productId: product.id,
                  productName: product.name || "Product",
                  isReturnableJar: Boolean(
                    product.is_returnable_jar
                  ),
                  quantity: 0,
                  returned: 0,
                  unitPrice: Number(product.sale_price || 0),
                  assigned: false,
                })),
                assignedIds: [],
                error:
                  err?.message ||
                  "Unable to load assigned products.",
              };
            }
          })
        );

        if (cancelled) return;

        const nextEntries = {};
        const nextErrors = {};

        results.forEach((result) => {
          nextEntries[result.customerId] = result.items;

          if (result.error) {
            nextErrors[result.customerId] = result.error;
          }
        });

        setEntries(nextEntries);
        setPlanErrors(nextErrors);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message || "Unable to load customer products."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPlans(false);
        }
      }
    }

    loadPlans();

    return () => {
      cancelled = true;
    };
  }, [customers, products, date, getCustomerRatePlans]);

  const updateItem = (customerId, productId, field, value) => {
    setEntries((previous) => ({
      ...previous,
      [customerId]: (previous[customerId] || []).map((item) => {
        if (String(item.productId) !== String(productId)) {
          return item;
        }

        const nextValue = Math.max(0, Number(value) || 0);

        if (field === "returned") {
          return {
            ...item,
            returned: Math.min(nextValue, item.quantity),
          };
        }

        if (field === "quantity") {
          return {
            ...item,
            quantity: nextValue,
            returned: Math.min(item.returned, nextValue),
          };
        }

        if (field === "unitPrice") {
          return {
            ...item,
            unitPrice: nextValue,
          };
        }

        return item;
      }),
    }));
  };

  const addOtherProduct = (customerId, productId) => {
    setEntries((previous) => ({
      ...previous,
      [customerId]: (previous[customerId] || []).map((item) =>
        String(item.productId) === String(productId)
          ? { ...item, selected: true }
          : item
      ),
    }));
  };

  const removeOtherProduct = (customerId, productId) => {
    setEntries((previous) => ({
      ...previous,
      [customerId]: (previous[customerId] || []).map((item) =>
        String(item.productId) === String(productId)
          ? {
              ...item,
              selected: false,
              quantity: 0,
              returned: 0,
            }
          : item
      ),
    }));
  };

  const toggleOtherProducts = (customerId) => {
    setExpandedOther((previous) => ({
      ...previous,
      [customerId]: !previous[customerId],
    }));
  };

  const totals = useMemo(() => {
    let amount = 0;
    let jars = 0;
    let received = 0;
    let activeCustomers = 0;

    customers.forEach((customer) => {
      const items = entries[customer.id] || [];
      let customerHasDelivery = false;

      items.forEach((item) => {
        const quantity = Number(item.quantity || 0);
        const returned = Number(item.returned || 0);

        amount += quantity * Number(item.unitPrice || 0);

        if (item.isReturnableJar) {
          jars += quantity;
          received += returned;
        }

        if (quantity > 0) {
          customerHasDelivery = true;
        }
      });

      if (customerHasDelivery) activeCustomers += 1;
    });

    return {
      amount,
      jars,
      received,
      activeCustomers,
    };
  }, [customers, entries]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!date) {
      setError("Please select a delivery date.");
      return;
    }

    if (!customers.length) {
      setError("No customers available for bulk delivery.");
      return;
    }

    if (Object.keys(planErrors).length) {
      setError(
        "Some customer product plans could not be loaded. Refresh and try again."
      );
      return;
    }

    const payload = [];

    for (const customer of customers) {
      const items = entries[customer.id] || [];

      const activeItems = items.filter(
        (item) => Number(item.quantity) > 0
      );

      if (!activeItems.length) continue;

      for (const item of activeItems) {
        if (
          !Number.isFinite(Number(item.quantity)) ||
          Number(item.quantity) <= 0
        ) {
          setError(`Enter a valid quantity for ${customer.name}.`);
          return;
        }

        if (
          !Number.isFinite(Number(item.returned)) ||
          Number(item.returned) < 0 ||
          Number(item.returned) > Number(item.quantity)
        ) {
          setError(
            `Received quantity cannot exceed delivered quantity for ${customer.name}.`
          );
          return;
        }

        if (
          !Number.isFinite(Number(item.unitPrice)) ||
          Number(item.unitPrice) < 0
        ) {
          setError(`Invalid product rate for ${customer.name}.`);
          return;
        }
      }

      payload.push({
        customerId: customer.id,
        customerName: customer.name,
        date,
        shift,
        items: activeItems.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          returned: Number(item.returned),
          unitPrice: Number(item.unitPrice),
        })),
        notes: "",
      });
    }

    if (!payload.length) {
      setError("Enter at least one delivered quantity before submitting.");
      return;
    }

    if (typeof onSubmit !== "function") {
      setError("Bulk delivery submission is not configured.");
      return;
    }

    setSaving(true);

    try {
      const result = await onSubmit(payload);

      const savedIds = new Set(
        (result?.saved || []).map((item) =>
          String(item.customerId)
        )
      );

      if (savedIds.size) {
        setEntries((previous) => {
          const next = { ...previous };

          savedIds.forEach((customerId) => {
            next[customerId] = (next[customerId] || []).map(
              (item) => ({
                ...item,
                quantity: 0,
                returned: 0,
              })
            );
          });

          return next;
        });
      }

      if (result?.failed?.length) {
        setError(
          `${result.saved.length} customer(s) saved; ${result.failed.length} failed. Check failed customers and retry.`
        );
      } else {
        setSuccess(
          `${result?.saved?.length || payload.length} customer deliveries saved successfully.`
        );
      }
    } catch (err) {
      setError(
        err?.message || "Unable to submit group deliveries."
      );
    } finally {
      setSaving(false);
    }
  };

  const renderProduct = (customer, item) => (
    <div
      key={item.productId}
      className="rounded-xl border border-slate-200 p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-800">
            {item.productName}
          </p>
          {!item.assigned && (
            <span className="text-[10px] font-semibold text-amber-700">
              Other Product
            </span>
          )}
        </div>

        {item.assigned ? (
          <span className="shrink-0 text-xs text-slate-500">
            Assigned
          </span>
        ) : (
          <button
            type="button"
            onClick={() =>
              removeOtherProduct(customer.id, item.productId)
            }
            className="text-xs font-semibold text-rose-600"
          >
            Remove
          </button>
        )}
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-semibold text-slate-500">
          Rate per unit (₹)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.unitPrice}
          onChange={(event) =>
            updateItem(
              customer.id,
              item.productId,
              "unitPrice",
              event.target.value
            )
          }
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <QuantityControl
          label="Delivered"
          value={item.quantity}
          onDecrease={() =>
            updateItem(
              customer.id,
              item.productId,
              "quantity",
              item.quantity - 1
            )
          }
          onIncrease={() =>
            updateItem(
              customer.id,
              item.productId,
              "quantity",
              item.quantity + 1
            )
          }
          onChange={(value) =>
            updateItem(
              customer.id,
              item.productId,
              "quantity",
              value
            )
          }
        />

        <QuantityControl
          label="Received"
          value={item.returned}
          onDecrease={() =>
            updateItem(
              customer.id,
              item.productId,
              "returned",
              item.returned - 1
            )
          }
          onIncrease={() =>
            updateItem(
              customer.id,
              item.productId,
              "returned",
              item.returned + 1
            )
          }
          onChange={(value) =>
            updateItem(
              customer.id,
              item.productId,
              "returned",
              value
            )
          }
        />
      </div>

      <p className="mt-3 text-right text-sm font-bold text-[#102C46]">
        Amount: {money(item.quantity * item.unitPrice)}
      </p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pb-36 sm:space-y-5 sm:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#102C46]">
            Group-wise Delivery Entry
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Assigned and other products are available for each customer.
          </p>
        </div>

        <div className="rounded-xl bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800">
          {customers.length} Customers
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {loadingPlans ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <RefreshCw
            size={25}
            className="mx-auto animate-spin text-teal-700"
          />
          <p className="mt-3 text-sm font-semibold text-slate-600">
            Loading customer products...
          </p>
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No customers found in this group.
        </div>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer) => {
            const items = entries[customer.id] || [];
            const assignedItems = items.filter(
              (item) => item.assigned
            );
            const otherItems = items.filter(
              (item) => !item.assigned
            );
            const selectedOtherItems = otherItems.filter(
              (item) => item.selected || item.quantity > 0
            );
            const search = (
              productSearch[customer.id] || ""
            ).trim().toLowerCase();

            const availableOtherItems = otherItems.filter(
              (item) =>
                !item.selected &&
                item.productName.toLowerCase().includes(search)
            );

            const customerTotal = items.reduce(
              (sum, item) =>
                sum +
                Number(item.quantity || 0) *
                  Number(item.unitPrice || 0),
              0
            );

            return (
              <article
                key={customer.id}
                className="overflow-hidden rounded-2xl border border-slate-200 border-l-4 border-l-teal-600 bg-white shadow-sm"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                        <Droplets size={23} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-[#102C46]">
                          {customer.name}
                        </h3>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {customer.phone || customer.area || "Customer"}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600">
                      Due: {money(balances[customer.id] || 0)}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-slate-600">
                    Delivery for <strong>{date}</strong>
                  </p>

                  {planErrors[customer.id] && (
                    <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                      {planErrors[customer.id]}
                    </p>
                  )}

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Assigned Products
                        </h4>
                        <span className="text-xs text-slate-400">
                          {assignedItems.length}
                        </span>
                      </div>

                      {assignedItems.length ? (
                        <div className="space-y-3">
                          {assignedItems.map((item) =>
                            renderProduct(customer, item)
                          )}
                        </div>
                      ) : (
                        <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                          No assigned products. Add products from Other Products below.
                        </p>
                      )}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-amber-200">
                      <button
                        type="button"
                        onClick={() =>
                          toggleOtherProducts(customer.id)
                        }
                        className="flex w-full items-center justify-between gap-2 bg-amber-50 p-3 text-left"
                      >
                        <span>
                          <span className="block text-sm font-bold text-amber-900">
                            Other Products
                          </span>
                          <span className="text-xs text-amber-700">
                            {otherItems.length} available products
                          </span>
                        </span>

                        {expandedOther[customer.id] ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>

                      {expandedOther[customer.id] && (
                        <div className="space-y-3 p-3">
                          {selectedOtherItems.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-xs font-bold uppercase text-slate-500">
                                Added to this delivery
                              </p>
                              {selectedOtherItems.map((item) =>
                                renderProduct(customer, item)
                              )}
                            </div>
                          )}

                          <div className="relative">
                            <Search
                              size={15}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                              value={productSearch[customer.id] || ""}
                              onChange={(event) =>
                                setProductSearch((previous) => ({
                                  ...previous,
                                  [customer.id]: event.target.value,
                                }))
                              }
                              placeholder="Search all other products..."
                              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
                            />
                          </div>

                          {availableOtherItems.length ? (
                            <div className="space-y-2">
                              {availableOtherItems.map((item) => (
                                <div
                                  key={item.productId}
                                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 p-3"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                      {item.productName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Default rate: {money(item.unitPrice)}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      addOtherProduct(
                                        customer.id,
                                        item.productId
                                      )
                                    }
                                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800"
                                  >
                                    <Plus size={14} />
                                    Add
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-xs text-slate-500">
                              No more products available.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between border-t border-slate-100 pt-3">
                    <span className="text-sm font-semibold text-slate-600">
                      Customer Total
                    </span>
                    <span className="font-bold text-teal-800">
                      {money(customerTotal)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Compact summary + action dock: fixed on phones, inline on larger screens */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2.5 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-6px_22px_rgba(15,23,42,0.10)] backdrop-blur sm:static sm:rounded-2xl sm:border sm:bg-white sm:p-4 sm:shadow-lg sm:backdrop-blur-none">
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-2 sm:gap-3 md:grid-cols-5 md:items-stretch">
          <Summary label="Customers" value={customers.length} />
          <Summary label="Entries" value={totals.activeCustomers} />
          <Summary label="Jars" value={totals.jars} />
          <Summary label="Amount" value={money(totals.amount)} />

          <div className="col-span-4 flex items-center gap-2 sm:col-span-2 sm:flex-col sm:items-stretch sm:justify-center md:col-span-1">
            <button
              type="submit"
              disabled={
                saving ||
                loadingPlans ||
                !customers.length ||
                totals.activeCustomers === 0
              }
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[46px] sm:gap-2 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
            >
              {saving ? (
                <RefreshCw size={15} className="animate-spin sm:size-[17px]" />
              ) : (
                <Save size={15} className="sm:size-[17px]" />
              )}
              {saving ? "Submitting..." : "SUBMIT ALL DELIVERIES"}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 sm:min-h-10 sm:rounded-xl sm:px-4 sm:text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

function QuantityControl({
  label,
  value,
  onDecrease,
  onIncrease,
  onChange,
}) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-100 p-2">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <div className="flex min-h-9 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          onClick={onDecrease}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-600 hover:bg-slate-100"
          aria-label={`Decrease ${label}`}
        >
          <Minus size={14} />
        </button>

        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full min-w-0 border-0 bg-transparent p-0 text-center text-sm font-bold text-slate-800 outline-none"
          aria-label={label}
        />

        <button
          type="button"
          onClick={onIncrease}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-600 hover:bg-slate-100"
          aria-label={`Increase ${label}`}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 px-1.5 py-1.5 sm:rounded-xl sm:p-3">
      <p className="truncate text-[8px] font-bold uppercase leading-tight tracking-tight text-slate-500 sm:text-[11px] sm:tracking-normal">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-extrabold leading-tight text-[#102C46] sm:mt-1 sm:break-words sm:text-base">
        {value}
      </p>
    </div>
  );
}
