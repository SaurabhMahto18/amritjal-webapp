
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Search,
  RefreshCw,
  Save,
  Droplets,
  AlertCircle,
  CheckCircle2,
  Package,
  IndianRupee,
} from "lucide-react";

import useDeliveries from "../hooks/useDeliveries";
import deliveryService from "../services/deliveryService";

// ------------------------------------------
// DATE HELPERS
// ------------------------------------------

const getCurrentMonth = () => {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getMinMonth = () => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - 11);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getEditableMinMonth = () => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - 5);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const normalizeId = (value) =>
  value === null || value === undefined ? "" : String(value);

const getToday = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const getDaysInMonth = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0).getDate();
};

const makeDate = (month, day) =>
  `${month}-${String(day).padStart(2, "0")}`;

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const getShiftLabel = (shift) => {
  if (shift === "morning") return "Morning";
  if (shift === "evening") return "Evening";
  return "Other";
};

const inputClass =
  "h-9 w-[54px] rounded-md border border-slate-200 bg-white text-center text-sm font-semibold text-[#102C46] outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

// ------------------------------------------
// CREATE CUSTOMER MONTHLY ENTRIES
// ------------------------------------------

function createCustomerEntries(
  plans,
  deliveries,
  customerId,
  month,
  dayCount,
  shift
) {
  const result = {};

  plans.forEach((plan) => {
    result[plan.productId] = {};

    for (let day = 1; day <= dayCount; day += 1) {
      result[plan.productId][day] = {
        delivered: 0,
        returned: 0,
        unitPrice: null,
      };
    }
  });

  deliveries
    .filter(
      (delivery) =>
        delivery.customerId === customerId &&
        delivery.date?.startsWith(`${month}-`) &&
        (delivery.shift || "morning") === shift
    )
    .forEach((delivery) => {
      const day = Number(delivery.date.slice(-2));

      (delivery.items || []).forEach((item) => {
        if (
          !result[item.productId] ||
          !result[item.productId][day]
        ) {
          return;
        }

        result[item.productId][day] = {
          delivered: Number(item.quantity || 0),
          returned: Number(item.returned || 0),
          unitPrice: Number(item.unitPrice || 0),
        };
      });
    });

  return result;
}

// ------------------------------------------
// MAIN COMPONENT
// ------------------------------------------

export default function BulkDeliveryPage() {
  // This is an authenticated business workspace, not a public SEO landing page.
  // Keep useful browser metadata while preventing indexing of private operational data.
  useEffect(() => {
    const previousTitle = document.title;
    const descriptionMeta =
      document.querySelector('meta[name="description"]');
    const robotsMeta = document.querySelector('meta[name="robots"]');

    const previousDescription = descriptionMeta?.getAttribute("content");
    const previousRobots = robotsMeta?.getAttribute("content");

    document.title = "Monthly Bulk Deliveries | Amrit Jal";

    const description = descriptionMeta || document.createElement("meta");
    description.name = "description";
    description.content =
      "Manage monthly customer-wise water delivery entries, jar returns and delivery quantities in Amrit Jal.";
    if (!descriptionMeta) document.head.appendChild(description);

    const robots = robotsMeta || document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    if (!robotsMeta) document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;

      if (descriptionMeta) {
        descriptionMeta.setAttribute("content", previousDescription || "");
      } else {
        description.remove();
      }

      if (robotsMeta) {
        robotsMeta.setAttribute("content", previousRobots || "");
      } else {
        robots.remove();
      }
    };
  }, []);
  const {
    customers = [],
    loading: customersLoading,
    error: customersError,
  } = useDeliveries();

  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupMap, setGroupMap] = useState({});
  const [deliveries, setDeliveries] = useState([]);

  const [customerBalances, setCustomerBalances] = useState({});
  const [customerJarBalances, setCustomerJarBalances] = useState({});

  const [customerPlans, setCustomerPlans] = useState({});
  const [entries, setEntries] = useState({});

  const [month, setMonth] = useState(getCurrentMonth());
  const [shift, setShift] = useState("morning");
  const [groupId, setGroupId] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const dayCount = useMemo(
    () => getDaysInMonth(month),
    [month]
  );

  const monthStart = `${month}-01`;
  const monthEnd = `${month}-${String(dayCount).padStart(2, "0")}`;

  const today = getToday();
  const editableMinMonth = getEditableMinMonth();
  const isMonthEditable = month >= editableMinMonth && month <= getCurrentMonth();

  // ------------------------------------------
  // LOAD SHARED PAGE DATA
  // ------------------------------------------

  useEffect(() => {
    let active = true;

    async function loadPageData() {
      setLoading(true);
      setError("");

      try {
        const [
          productData,
          groupData,
          groupMapping,
          deliveryData,
          balanceData,
        ] = await Promise.all([
          deliveryService.getProducts(),
          deliveryService.getGroups(),
          deliveryService.getCustomerGroupMap(),
          deliveryService.getAll(),
          deliveryService.getCustomerBalances(),
        ]);

        if (!active) return;

        setProducts(productData || []);
        setGroups(groupData || []);
        setGroupMap(groupMapping || {});
        setDeliveries(deliveryData || []);
        setCustomerBalances(balanceData || {});

        // Calculate customer jar balances.
        // Only returnable jar products are included.

        const returnableProductIds = new Set(
          (productData || [])
            .filter((product) => product.is_returnable_jar)
            .map((product) => product.id)
        );

        const jarBalances = {};

        customers.forEach((customer) => {
          jarBalances[customer.id] = 0;
        });

        (deliveryData || []).forEach((delivery) => {
          (delivery.items || []).forEach((item) => {
            if (!returnableProductIds.has(item.productId)) return;

            jarBalances[delivery.customerId] =
              (jarBalances[delivery.customerId] || 0) +
              Number(item.quantity || 0) -
              Number(item.returned || 0);
          });
        });

        setCustomerJarBalances(jarBalances);
      } catch (err) {
        if (active) {
          setError(
            err.message ||
              "Unable to load monthly delivery register."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPageData();

    return () => {
      active = false;
    };
  }, [customers]);

  // ------------------------------------------
  // FILTER CUSTOMERS
  // ------------------------------------------

  const visibleCustomers = useMemo(() => {
    const query = search.trim().replace(/\s+/g, " ").toLowerCase();

    return customers
      .filter((customer) => {
        const mappedGroupId = groupMap[customer.id]?.id;
        const customerGroupId =
          mappedGroupId ??
          customer.group_id ??
          customer.customer_group_id ??
          "";
        const matchesGroup =
          !groupId || normalizeId(customerGroupId) === normalizeId(groupId);

        const searchable = [
          customer.name,
          customer.phone,
          customer.area,
          customer.address,
          customer.code,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          matchesGroup &&
          (!query || searchable.includes(query))
        );
      })
      .sort((a, b) =>
        String(a.name || "").localeCompare(
          String(b.name || "")
        )
      );
  }, [customers, groupId, groupMap, search]);

  // ------------------------------------------
  // LOAD CUSTOMER RATE PLANS
  // ------------------------------------------

  useEffect(() => {
    let active = true;

    async function loadAllCustomerPlans() {
      if (!customers.length || !products.length || loading) {
        return;
      }

      setPlansLoading(true);
      setError("");

      try {
        const productMap = new Map(
          products.map((product) => [product.id, product])
        );

        const results = await Promise.all(
          visibleCustomers.map(async (customer) => {
            const plans =
              await deliveryService.getCustomerRatePlans(
                customer.id,
                monthEnd,
                monthStart
              );

            const normalizedPlans = (plans || [])
              .filter((plan) =>
                productMap.has(plan.product_id)
              )
              .map((plan) => {
                const product = productMap.get(
                  plan.product_id
                );

                return {
                  productId: plan.product_id,
                  productName: product.name,
                  isReturnable: Boolean(
                    product.is_returnable_jar
                  ),
                  rate: Number(plan.unit_price || 0),
                };
              });

            return [customer.id, normalizedPlans];
          })
        );

        if (!active) return;

        const planMap = Object.fromEntries(results);
        const loadedEntries = {};

        visibleCustomers.forEach((customer) => {
          loadedEntries[customer.id] = createCustomerEntries(
            planMap[customer.id] || [],
            deliveries,
            customer.id,
            month,
            dayCount,
            shift
          );
        });

        setCustomerPlans((previous) => {
          const merged = { ...previous };

          visibleCustomers.forEach((customer) => {
            const customerId = customer.id;
            const savedPlans = planMap[customerId] || [];
            const manuallyAddedPlans = (previous[customerId] || []).filter(
              (plan) => plan.isOtherProduct &&
                !savedPlans.some((saved) => normalizeId(saved.productId) === normalizeId(plan.productId))
            );
            merged[customerId] = [...savedPlans, ...manuallyAddedPlans];
          });

          return merged;
        });

        // Do not discard typed quantities merely because the user searched
        // or changed the group filter. Existing in-memory cells take priority.
        setEntries((previous) => {
          const merged = { ...previous };

          visibleCustomers.forEach((customer) => {
            const customerId = customer.id;
            const serverCustomerEntries = loadedEntries[customerId] || {};
            const previousCustomerEntries = previous[customerId] || {};
            const nextCustomerEntries = {};

            Object.entries(serverCustomerEntries).forEach(
              ([productId, dayMap]) => {
                nextCustomerEntries[productId] = {
                  ...dayMap,
                  ...(previousCustomerEntries[productId] || {}),
                };
              }
            );

            // Keep manually selected Others products and their typed cells
            // when the customer search/group filter causes plans to reload.
            Object.entries(previousCustomerEntries).forEach(
              ([productId, dayMap]) => {
                if (!nextCustomerEntries[productId]) {
                  nextCustomerEntries[productId] = dayMap;
                }
              }
            );

            merged[customerId] = nextCustomerEntries;
          });

          return merged;
        });
      } catch (err) {
        if (active) {
          setError(
            err.message ||
              "Unable to load customer product rate plans."
          );
        }
      } finally {
        if (active) {
          setPlansLoading(false);
        }
      }
    }

    loadAllCustomerPlans();

    return () => {
      active = false;
    };
  }, [
    customers,
    products,
    visibleCustomers,
    deliveries,
    month,
    monthStart,
    monthEnd,
    dayCount,
    shift,
    loading,
  ]);

  // ------------------------------------------
  // EXISTING DELIVERY MAP
  // ------------------------------------------

  const existingDeliveriesByCustomer = useMemo(() => {
    const map = {};

    visibleCustomers.forEach((customer) => {
      map[customer.id] = {};

      deliveries
        .filter(
          (delivery) =>
            delivery.customerId === customer.id &&
            delivery.date?.startsWith(`${month}-`) &&
            (delivery.shift || "morning") === shift
        )
        .forEach((delivery) => {
          const day = Number(delivery.date.slice(-2));

          map[customer.id][day] = delivery;
        });
    });

    return map;
  }, [visibleCustomers, deliveries, month, shift]);

  // ------------------------------------------
  // ADD AN UNASSIGNED PRODUCT TO THIS CUSTOMER
  // ------------------------------------------

  function addOtherProduct(customerId, productId) {
    if (!productId) return;

    const product = products.find(
      (item) => normalizeId(item.id) === normalizeId(productId)
    );
    if (!product) return;

    const currentPlans = customerPlans[customerId] || [];
    if (currentPlans.some(
      (plan) => normalizeId(plan.productId) === normalizeId(product.id)
    )) return;

    const newPlan = {
      productId: product.id,
      productName: product.name,
      isReturnable: Boolean(product.is_returnable_jar),
      rate: Number(product.sale_price || 0),
      isOtherProduct: true,
    };

    setCustomerPlans((previous) => ({
      ...previous,
      [customerId]: [...(previous[customerId] || []), newPlan],
    }));

    setEntries((previous) => {
      const productDays = {};
      for (let day = 1; day <= dayCount; day += 1) {
        productDays[day] = {
          delivered: 0,
          returned: 0,
          unitPrice: null,
        };
      }

      // Restore quantities already recorded for this product in the selected month.
      deliveries
        .filter((delivery) =>
          normalizeId(delivery.customerId) === normalizeId(customerId) &&
          delivery.date?.startsWith(`${month}-`) &&
          (delivery.shift || "morning") === shift
        )
        .forEach((delivery) => {
          const day = Number(delivery.date.slice(-2));
          (delivery.items || []).forEach((item) => {
            if (normalizeId(item.productId) === normalizeId(product.id) && productDays[day]) {
              productDays[day] = {
                delivered: Number(item.quantity || 0),
                returned: Number(item.returned || 0),
                unitPrice: Number(item.unitPrice ?? product.sale_price ?? 0),
              };
            }
          });
        });

      return {
        ...previous,
        [customerId]: {
          ...previous[customerId],
          [product.id]: productDays,
        },
      };
    });

    setError("");
    setSuccess("");
  }

  // ------------------------------------------
  // UPDATE CELL
  // ------------------------------------------

  function updateCell(
    customerId,
    productId,
    day,
    field,
    value
  ) {
    const nextValue =
      value === ""
        ? ""
        : Math.max(0, Math.floor(Number(value) || 0));

    setEntries((previous) => ({
      ...previous,
      [customerId]: {
        ...previous[customerId],
        [productId]: {
          ...previous[customerId]?.[productId],
          [day]: {
            ...previous[customerId]?.[productId]?.[day],
            [field]: nextValue,
          },
        },
      },
    }));

    setError("");
    setSuccess("");
  }

  // ------------------------------------------
  // CUSTOMER TOTALS
  // ------------------------------------------

  function getCustomerTotals(customerId) {
    const plans = customerPlans[customerId] || [];
    const customerEntry = entries[customerId] || {};

    return plans.reduce(
      (total, plan) => {
        for (let day = 1; day <= dayCount; day += 1) {
          const cell =
            customerEntry[plan.productId]?.[day] || {};

          const rate = Number(
            cell.unitPrice ?? plan.rate
          );

          total.delivered += Number(
            cell.delivered || 0
          );

          total.returned += Number(
            cell.returned || 0
          );

          total.amount +=
            Number(cell.delivered || 0) * rate;
        }

        return total;
      },
      {
        delivered: 0,
        returned: 0,
        amount: 0,
      }
    );
  }

  // ------------------------------------------
  // REFRESH BALANCES
  // ------------------------------------------

  async function refreshSavedData() {
    const [refreshed, balances] = await Promise.all([
      deliveryService.getAll(),
      deliveryService.getCustomerBalances(),
    ]);

    setDeliveries(refreshed || []);
    setCustomerBalances(balances || {});

    const returnableProductIds = new Set(
      products
        .filter((product) => product.is_returnable_jar)
        .map((product) => product.id)
    );

    const jarBalances = {};

    customers.forEach((customer) => {
      jarBalances[customer.id] = 0;
    });

    (refreshed || []).forEach((delivery) => {
      (delivery.items || []).forEach((item) => {
        if (!returnableProductIds.has(item.productId)) return;

        jarBalances[delivery.customerId] =
          (jarBalances[delivery.customerId] || 0) +
          Number(item.quantity || 0) -
          Number(item.returned || 0);
      });
    });

    setCustomerJarBalances(jarBalances);
  }

  // ------------------------------------------
  // SAVE ALL MONTHLY ENTRIES
  // ------------------------------------------

  async function handleSaveAll() {
    setError("");
    setSuccess("");

    if (!visibleCustomers.length) {
      setError(
        "No customers found for the selected filters."
      );
      return;
    }

    if (!isMonthEditable) {
      setError(
        `This month is view-only. Bulk entries can be edited only from ${editableMinMonth} through ${getCurrentMonth()}.`
      );
      return;
    }

    const pending = [];

    // Validate and prepare all records before saving.

    for (const customer of visibleCustomers) {
      const plans = customerPlans[customer.id] || [];
      const customerEntry = entries[customer.id] || {};

      const existingDays =
        existingDeliveriesByCustomer[customer.id] || {};

      if (!plans.length) continue;

      for (let day = 1; day <= dayCount; day += 1) {
        const date = makeDate(month, day);

        // Future dates cannot be saved.
        if (date > today) continue;

        const existingDelivery = existingDays[day];

        const items = [];
        let hasQuantity = false;

        for (const plan of plans) {
          const cell =
            customerEntry[plan.productId]?.[day] || {};

          const quantity = Number(
            cell.delivered || 0
          );

          const returned = Number(
            cell.returned || 0
          );

          const unitPrice = Number(
            cell.unitPrice ?? plan.rate
          );

          if (
            !Number.isInteger(quantity) ||
            !Number.isInteger(returned) ||
            quantity < 0 ||
            returned < 0 ||
            !Number.isFinite(unitPrice) ||
            unitPrice < 0
          ) {
            setError(
              `${customer.name}, day ${day}: invalid quantity or rate.`
            );
            return;
          }

          if (!plan.isReturnable && returned > 0) {
            setError(
              `${customer.name}, ${plan.productName}: this product does not accept jar returns.`
            );
            return;
          }

          if (returned > quantity) {
            setError(
              `${customer.name}, day ${day}: returned quantity cannot exceed delivered quantity.`
            );
            return;
          }

          if (
            plan.isReturnable &&
            (!Number.isInteger(quantity) ||
              !Number.isInteger(returned))
          ) {
            setError(
              `${customer.name}, ${plan.productName}: jar quantities must be whole numbers.`
            );
            return;
          }

          if (quantity > 0) {
            hasQuantity = true;
          }

          // Include zero-quantity rows for existing records.
          // This allows an existing product entry to be cleared.

          items.push({
            productId: plan.productId,
            quantity,
            returned,
            unitPrice,
          });
        }

        // Existing delivery: update even if quantities are zero.
        // New delivery: save only if at least one quantity exists.

        if (existingDelivery || hasQuantity) {
          pending.push({
            customer,
            date,
            items,
          });
        }
      }
    }

    if (!pending.length) {
      setError("There are no delivery entries to save.");
      return;
    }

    setSaving(true);

    let saved = 0;
    const failures = [];

    try {
      for (const entry of pending) {
        try {
          await deliveryService.saveBulkDeliveryDay({
            customerId: entry.customer.id,
            date: entry.date,
            shift,
            notes: `Monthly bulk entry - ${month}`,
            items: entry.items,
          });

          saved += 1;
        } catch (err) {
          failures.push(
            `${entry.customer.name} (${entry.date}): ${
              err.message || "Save failed"
            }`
          );
        }
      }

      await refreshSavedData();

      if (saved) {
        setSuccess(
          `${saved} daily delivery record(s) saved/updated successfully.`
        );
      }

      if (failures.length) {
        setError(
          `${failures.length} record(s) failed. ${failures
            .slice(0, 4)
            .join(" | ")}`
        );
      }
    } catch (err) {
      setError(
        err.message ||
          "Unable to refresh delivery records."
      );
    } finally {
      setSaving(false);
    }
  }

  // ------------------------------------------
  // QUANTITY INPUT
  // ------------------------------------------

  function renderQuantityInput(
    customerId,
    plan,
    day,
    field
  ) {
    const value =
      entries[customerId]?.[plan.productId]?.[day]?.[
        field
      ] ?? 0;

    const date = makeDate(month, day);
    const isFutureDate = date > today;
    const isOutsideEditWindow = month < editableMinMonth;

    return (
      <input
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        aria-label={`${plan.productName} ${field} day ${day}`}
        value={value}
        disabled={
          isFutureDate ||
          isOutsideEditWindow ||
          saving ||
          plansLoading
        }
        onChange={(event) =>
          updateCell(
            customerId,
            plan.productId,
            day,
            field,
            event.target.value
          )
        }
        className={inputClass}
      />
    );
  }

  // ------------------------------------------
  // RENDER
  // ------------------------------------------

  return (
    <main className="min-h-screen bg-[#eef2f7] px-3 py-4 text-slate-900 sm:px-5">
      <div className="mx-auto max-w-[1800px] space-y-4">

        

      

        {/* FILTERS */}

        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600">
              Groups
            </span>

            <select
              value={groupId}
              onChange={(event) =>
                setGroupId(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            >
              <option value="">All Groups</option>

              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600">
              Delivery Month
            </span>

            <input
              type="month"
              value={month}
              min={getMinMonth()}
              max={getCurrentMonth()}
              onChange={(event) => {
                setMonth(event.target.value);
                setError("");
                setSuccess("");
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            />
            <span className="mt-1.5 block text-xs text-slate-500">
              View: last 12 months · Edit: last 6 months only
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600">
              Shift
            </span>

            <select
              value={shift}
              onChange={(event) =>
                setShift(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
              
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600">
              Search Customer
            </span>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-3 text-slate-400"
              />

              <input
                aria-label="Search customers by name, phone, area or customer code"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Name, phone, area or code"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-600"
              />
            </div>
          </label>

          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-4">
            <button
              type="button"
              onClick={() => {
                setGroupId("");
                setMonth(getCurrentMonth());
                setShift("morning");
                setSearch("");
              }}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>

            <span className="text-xs text-slate-500">
              {visibleCustomers.length} customer(s)
            </span>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={
                saving ||
                loading ||
                plansLoading ||
                !visibleCustomers.length ||
                !isMonthEditable
              }
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#102C46] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Save size={16} />
              )}

              {saving
                ? "Saving..."
                : "Save All Monthly Entries"}
            </button>
          </div>
        </section>

        {!isMonthEditable && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>
              You are viewing a historical month. Entries older than the last
              6 months are read-only; you can still review the saved quantities,
              returns and totals.
            </span>
          </div>
        )}

        {/* STATUS */}

        {(error || customersError) && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{error || customersError}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* LOADING */}

        {loading || customersLoading || plansLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            <RefreshCw className="mx-auto mb-3 animate-spin text-teal-700" />
            Loading customer monthly registers...
          </div>
        ) : !visibleCustomers.length ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Search
              className="mx-auto mb-3 text-slate-400"
              size={28}
            />

            <h2 className="font-bold text-[#102C46]">
              No customers found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Try changing the group or search filters.
            </p>
          </div>
        ) : (
          <div className="space-y-3">

            {visibleCustomers.map((customer) => {
              const plans =
                customerPlans[customer.id] || [];

              const totals =
                getCustomerTotals(customer.id);

              const jarBalance =
                customerJarBalances[customer.id] || 0;

              const due =
                Number(customerBalances[customer.id] || 0);

              const groupName =
                groupMap[customer.id]?.name ||
                groups.find(
                  (group) =>
                    normalizeId(group.id) ===
                    normalizeId(
                      customer.group_id ??
                      customer.customer_group_id
                    )
                )?.name ||
                "No Group";

              return (
                <section
                  key={customer.id}
                  className="grid min-w-0 grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[300px_minmax(0,1fr)]"
                >

                  {/* CUSTOMER SUMMARY */}

                  <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:left-0">
                    <div className="flex items-center gap-3">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#e8eff8] text-xl font-bold text-[#4778b8]">
                        {customer.name?.charAt(0)?.toUpperCase() || "C"}
                      </div>

                      <div className="min-w-0">
                        <h2
                          className="truncate text-lg font-bold text-slate-900"
                          title={customer.name}
                        >
                          {customer.name}
                        </h2>

                        <p className="truncate text-sm text-slate-500">
                          {customer.phone ||
                            customer.area ||
                            "Customer"}
                        </p>
                      </div>
                    </div>

                    <div className="my-4 border-t border-slate-200" />

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-100 p-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Package size={14} />
                          Unbal. Jar
                        </div>

                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {jarBalance}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-100 p-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <IndianRupee size={14} />
                          Due
                        </div>

                        <p className="mt-1 truncate text-xl font-bold text-rose-500">
                          {formatMoney(due)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{groupName}</span>

                      <span>
                        {totals.delivered} delivered ·{" "}
                        {totals.returned} returned
                      </span>
                    </div>

                    <div className="mt-2 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-800">
                      Monthly amount:{" "}
                      <strong>
                        ₹{formatMoney(totals.amount)}
                      </strong>
                    </div>
                  </aside>

                  {/* CUSTOMER MONTHLY REGISTER */}

                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#326eb5]">
                        <CalendarDays size={17} />

                        {new Date(
                          `${month}-01T00:00:00`
                        ).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })}

                        · {getShiftLabel(shift)}
                        · {groupName}
                      </div>

                      <span className="text-xs text-slate-400">
                        {dayCount} days
                      </span>
                    </div>

                    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <label className="text-sm font-semibold text-slate-700" htmlFor={`other-product-${customer.id}`}>
                        Others product
                      </label>
                      <select
                        id={`other-product-${customer.id}`}
                        value=""
                        disabled={!isMonthEditable || saving || plansLoading}
                        onChange={(event) => addOtherProduct(customer.id, event.target.value)}
                        className="min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        <option value="">Select other product...</option>
                        {products
                          .filter((product) => !plans.some((plan) => normalizeId(plan.productId) === normalizeId(product.id)))
                          .map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} · ₹{formatMoney(product.sale_price || 0)}
                            </option>
                          ))}
                      </select>
                      <span className="text-xs text-slate-500">Product select karte hi monthly card add ho jayega.</span>
                    </div>

                    {!plans.length ? (
                      <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                        Is customer ka koi product assigned nahi hai. Upar Others product dropdown se product select karein.
                      </div>
                    ) : (
                      <div className="space-y-3">

                        {/* DATE HEADER */}

                        <div className="overflow-x-auto">
                          <div className="min-w-max">
                            <div className="flex">
                              <div className="sticky left-0 z-20 w-14 shrink-0 border-b border-slate-200 bg-white" />

                              {Array.from(
                                { length: dayCount },
                                (_, index) => index + 1
                              ).map((day) => {
                                const date = makeDate(month, day);
                                const isToday = date === today;
                                const isFuture = date > today;

                                return (
                                  <div
                                    key={day}
                                    className={`flex h-10 w-[54px] shrink-0 items-center justify-center border-b border-r border-slate-200 text-xs ${
                                      isToday
                                        ? "bg-[#3977bd] font-bold text-white"
                                        : isFuture
                                          ? "bg-slate-100 text-slate-400"
                                          : "bg-white text-slate-600"
                                    }`}
                                  >
                                    {day}
                                  </div>
                                );
                              })}

                              <div className="w-16 shrink-0 border-b border-slate-200 bg-white" />
                            </div>
                          </div>
                        </div>

                        {/* PRODUCT SECTIONS */}

                        {plans.map((plan) => {
                          const productEntry =
                            entries[customer.id]?.[
                              plan.productId
                            ] || {};

                          const deliveredTotal = Array.from(
                            { length: dayCount },
                            (_, index) =>
                              Number(
                                productEntry[index + 1]?.delivered || 0
                              )
                          ).reduce((sum, value) => sum + value, 0);

                          const returnedTotal = Array.from(
                            { length: dayCount },
                            (_, index) =>
                              Number(
                                productEntry[index + 1]?.returned || 0
                              )
                          ).reduce((sum, value) => sum + value, 0);

                          return (
                            <div
                              key={plan.productId}
                              className="overflow-hidden"
                            >
                              <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-2 py-2.5 text-sm font-bold text-[#102C46]">
                                <Droplets
                                  size={16}
                                  className="text-teal-700"
                                />

                                {plan.productName}

                                <span className="text-xs font-normal text-slate-400">
                                  ₹{formatMoney(plan.rate)} / unit
                                  {plan.isOtherProduct ? " · Others" : ""}
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <div className="min-w-max">

                                  {/* DELIVERED ROW */}

                                  <div className="flex">
                                    <div className="sticky left-0 z-10 flex w-14 shrink-0 items-center border-r border-b border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600">
                                      Del.
                                    </div>

                                    {Array.from(
                                      { length: dayCount },
                                      (_, index) => index + 1
                                    ).map((day) => (
                                      <div
                                        key={day}
                                        className="flex h-11 w-[54px] shrink-0 items-center justify-center border-b border-r border-slate-200"
                                      >
                                        {renderQuantityInput(
                                          customer.id,
                                          plan,
                                          day,
                                          "delivered"
                                        )}
                                      </div>
                                    ))}

                                    <div className="flex w-16 shrink-0 items-center justify-center border-b border-slate-200 bg-slate-50 text-sm font-bold text-[#102C46]">
                                      {deliveredTotal}
                                    </div>
                                  </div>

                                  {/* RETURNED ROW */}

                                  <div className="flex">
                                    <div className="sticky left-0 z-10 flex w-14 shrink-0 items-center border-r border-b border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600">
                                      Rec.
                                    </div>

                                    {Array.from(
                                      { length: dayCount },
                                      (_, index) => index + 1
                                    ).map((day) => (
                                      <div
                                        key={day}
                                        className="flex h-11 w-[54px] shrink-0 items-center justify-center border-b border-r border-slate-200"
                                      >
                                        {plan.isReturnable ? (
                                          renderQuantityInput(
                                            customer.id,
                                            plan,
                                            day,
                                            "returned"
                                          )
                                        ) : (
                                          <span className="text-slate-300">
                                            —
                                          </span>
                                        )}
                                      </div>
                                    ))}

                                    <div className="flex w-16 shrink-0 items-center justify-center border-b border-slate-200 bg-slate-50 text-sm font-bold text-[#102C46]">
                                      {returnedTotal}
                                    </div>
                                  </div>

                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

      

       
      </div>
    </main>
  );
}
