
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Search,
  RefreshCw,
  Save,
  Droplets,
  AlertCircle,
  CheckCircle2,
  Package,
  IndianRupee,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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
  "h-10 w-[50px] rounded-md border border-slate-200 bg-white text-center text-sm font-semibold text-[#102C46] outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

const CUSTOMER_PAGE_SIZE = 5;

// ------------------------------------------
// CREATE CUSTOMER MONTHLY ENTRIES
// ------------------------------------------

function createCustomerEntries(
  plans,
  customerDeliveries,
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

  // The caller passes only this customer's deliveries.
  // This avoids filtering the entire delivery history once per customer.
  customerDeliveries.forEach((delivery) => {
    if (
      !delivery.date?.startsWith(`${month}-`) ||
      (delivery.shift || "morning") !== shift
    ) {
      return;
    }

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


function normalizeCustomerPlanRows(targetCustomers, plansByCustomer, products) {
  const productMap = new Map(
    products.map((product) => [normalizeId(product.id), product])
  );
  const normalized = {};

  targetCustomers.forEach((customer) => {
    const customerKey = normalizeId(customer.id);
    const rawPlans =
      plansByCustomer?.[customer.id] || plansByCustomer?.[customerKey] || [];

    normalized[customerKey] = rawPlans
      .filter((plan) => productMap.has(normalizeId(plan.product_id)))
      .map((plan) => {
        const product = productMap.get(normalizeId(plan.product_id));
        return {
          productId: plan.product_id,
          productName: product.name,
          isReturnable: Boolean(product.is_returnable_jar),
          rate: Number(plan.unit_price || 0),
        };
      });
  });

  return normalized;
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
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState("");

  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [lookupsError, setLookupsError] = useState("");
  const [groupMap, setGroupMap] = useState({});
  const [deliveries, setDeliveries] = useState([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(true);
  const [deliveriesError, setDeliveriesError] = useState("");

  const [customerBalances, setCustomerBalances] = useState({});
  const [balancesLoading, setBalancesLoading] = useState(true);

  const [customerPlans, setCustomerPlans] = useState({});
  const [loadedPlanIds, setLoadedPlanIds] = useState([]);
  const [plansError, setPlansError] = useState("");
  const [entries, setEntries] = useState({});
  const [dirtyCells, setDirtyCells] = useState({});

  const [month, setMonth] = useState(getCurrentMonth());
  const [shift, setShift] = useState("morning");
  const [groupId, setGroupId] = useState("");
  const [search, setSearch] = useState("");
  const [customerPage, setCustomerPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
  // LOAD CUSTOMER DETAILS FIRST
  // ------------------------------------------

  // Do not wait for the full delivery history before showing customer cards.
  // Customer data is fetched independently from delivery history.
  useEffect(() => {
    let active = true;

    async function loadCustomers() {
      setCustomersLoading(true);
      setCustomersError("");

      try {
        const data = await deliveryService.getCustomers();

        if (active) setCustomers(data || []);
      } catch (err) {
        if (active) {
          setCustomersError(
            err?.message || "Unable to load customers."
          );
        }
      } finally {
        if (active) setCustomersLoading(false);
      }
    }

    loadCustomers();

    return () => {
      active = false;
    };
  }, []);

  // Load products and group lookups in parallel. This is separate from
  // customer details, deliveries and balance summaries.
  useEffect(() => {
    let active = true;

    async function loadLookups() {
      setLoading(true);
      setLookupsError("");

      try {
        const [productData, groupData, groupMapping] = await Promise.all([
          deliveryService.getProducts(),
          deliveryService.getGroups(),
          deliveryService.getCustomerGroupMap(),
        ]);

        if (!active) return;

        setProducts(productData || []);
        setGroups(groupData || []);
        setGroupMap(groupMapping || {});
      } catch (err) {
        if (active) {
          const message =
            err?.message || "Unable to load products and customer groups.";
          setLookupsError(message);
          setError(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLookups();

    return () => {
      active = false;
    };
  }, []);

  // Load delivery history independently. The register remains visible
  // while this request is in progress; only quantity cells stay disabled.
  useEffect(() => {
    let active = true;

    async function loadDeliveries() {
      setDeliveriesLoading(true);
      setDeliveriesError("");

      try {
        const data = await deliveryService.getAll();

        if (active) setDeliveries(data || []);
      } catch (err) {
        if (active) {
          const message =
            err?.message || "Unable to load delivery history.";
          setDeliveriesError(message);
          setError((previous) => previous || message);
        }
      } finally {
        if (active) setDeliveriesLoading(false);
      }
    }

    loadDeliveries();

    return () => {
      active = false;
    };
  }, []);

  // Outstanding balances are fetched independently so they cannot block
  // the first customer details from appearing.
  useEffect(() => {
    let active = true;

    async function loadCustomerBalances() {
      setBalancesLoading(true);

      try {
        const balanceData = await deliveryService.getCustomerBalances();

        if (active) setCustomerBalances(balanceData || {});
      } catch (err) {
        if (active) {
          setError((previous) =>
            previous || err?.message || "Unable to load customer balances."
          );
        }
      } finally {
        if (active) setBalancesLoading(false);
      }
    }

    loadCustomerBalances();

    return () => {
      active = false;
    };
  }, []);

  // Index history once by customer. Entry construction and balance
  // calculation no longer scan every delivery separately for each customer.
  const deliveriesByCustomer = useMemo(() => {
    const map = {};

    deliveries.forEach((delivery) => {
      const customerId = normalizeId(delivery.customerId);
      if (!customerId) return;

      if (!map[customerId]) map[customerId] = [];
      map[customerId].push(delivery);
    });

    return map;
  }, [deliveries]);

  const customerJarBalances = useMemo(() => {
    const returnableProductIds = new Set(
      products
        .filter((product) => product.is_returnable_jar)
        .map((product) => normalizeId(product.id))
    );

    const balances = {};

    deliveries.forEach((delivery) => {
      const customerId = normalizeId(delivery.customerId);
      if (!customerId) return;

      (delivery.items || []).forEach((item) => {
        if (!returnableProductIds.has(normalizeId(item.productId))) return;

        balances[customerId] =
          (balances[customerId] || 0) +
          Number(item.quantity || 0) -
          Number(item.returned || 0);
      });
    });

    return balances;
  }, [deliveries, products]);

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

  const totalCustomerPages = Math.max(
    1,
    Math.ceil(visibleCustomers.length / CUSTOMER_PAGE_SIZE)
  );

  const paginatedCustomers = useMemo(() => {
    const startIndex = (customerPage - 1) * CUSTOMER_PAGE_SIZE;

    return visibleCustomers.slice(
      startIndex,
      startIndex + CUSTOMER_PAGE_SIZE
    );
  }, [visibleCustomers, customerPage]);

  const currentPagePlansReady = paginatedCustomers.every((customer) =>
    loadedPlanIds.includes(normalizeId(customer.id))
  );
  // The visible register does not wait for the full history/balance scans.
  // Historical data is merged into the cells as soon as it arrives.
  const registerLoading =
    loading || customersLoading || plansLoading || !currentPagePlansReady;
  const registerUnavailable = Boolean(
    deliveriesError || plansError || lookupsError
  );

  useEffect(() => {
    setCustomerPage(1);
  }, [groupId, search]);

  useEffect(() => {
    if (customerPage > totalCustomerPages) {
      setCustomerPage(totalCustomerPages);
    }
  }, [customerPage, totalCustomerPages]);

  // ------------------------------------------
  // LOAD RATE PLANS FOR THE VISIBLE PAGE ONLY
  // ------------------------------------------

  useEffect(() => {
    let active = true;

    async function loadVisibleCustomerPlans() {
      if (customersLoading || loading) return;

      if (!paginatedCustomers.length) {
        setPlansLoading(false);
        return;
      }

      const missingCustomers = paginatedCustomers.filter(
        (customer) => !loadedPlanIds.includes(normalizeId(customer.id))
      );

      if (!missingCustomers.length) {
        setPlansError("");
        setPlansLoading(false);
        return;
      }

      // If the catalogue is genuinely empty, mark these customers as loaded
      // so the UI can show the no-assigned-products state instead of spinning.
      if (!products.length) {
        const ids = missingCustomers.map((customer) => normalizeId(customer.id));
        setLoadedPlanIds((previous) => [...new Set([...previous, ...ids])]);
        setCustomerPlans((previous) => {
          const next = { ...previous };
          ids.forEach((id) => { if (!next[id]) next[id] = []; });
          return next;
        });
        setPlansLoading(false);
        return;
      }

      const missingIds = missingCustomers.map((customer) => customer.id);
      setPlansLoading(true);
      setPlansError("");

      try {
        const plansByCustomer =
          await deliveryService.getCustomerRatePlansForCustomers(
            missingIds,
            monthEnd,
            monthStart
          );

        if (!active) return;

        const normalized = normalizeCustomerPlanRows(
          missingCustomers,
          plansByCustomer,
          products
        );

        setCustomerPlans((previous) => {
          const next = { ...previous };

          missingCustomers.forEach((customer) => {
            const customerId = normalizeId(customer.id);
            const savedPlans = normalized[customerId] || [];
            const manualPlans = (previous[customerId] || []).filter(
              (plan) =>
                plan.isOtherProduct &&
                !savedPlans.some(
                  (saved) => normalizeId(saved.productId) === normalizeId(plan.productId)
                )
            );
            next[customerId] = [...savedPlans, ...manualPlans];
          });

          return next;
        });

        setLoadedPlanIds((previous) => [
          ...new Set([...previous, ...missingIds.map(normalizeId)]),
        ]);
      } catch (err) {
        if (active) {
          const message =
            err?.message || "Unable to load customer product rate plans.";
          setPlansError(message);
          setError(message);
        }
      } finally {
        if (active) setPlansLoading(false);
      }
    }

    loadVisibleCustomerPlans();

    return () => {
      active = false;
    };
  }, [
    paginatedCustomers,
    loadedPlanIds,
    customersLoading,
    products,
    loading,
    monthStart,
    monthEnd,
  ]);

  // Hydrate only the visible page. This work is small and does not hold up
  // customer/product display while the historical delivery scan is running.
  useEffect(() => {
    if (
      customersLoading ||
      loading ||
      !paginatedCustomers.length ||
      !currentPagePlansReady
    ) {
      return;
    }

    setEntries((previous) => {
      const merged = { ...previous };

      paginatedCustomers.forEach((customer) => {
        const customerId = normalizeId(customer.id);
        const serverEntries = createCustomerEntries(
          customerPlans[customerId] || [],
          deliveriesByCustomer[customerId] || [],
          month,
          dayCount,
          shift
        );

        const previousCustomerEntries = previous[customerId] || {};
        const customerDirtyCells = dirtyCells[customerId] || {};
        const nextCustomerEntries = {};

        Object.entries(serverEntries).forEach(([productId, dayMap]) => {
          const previousProductEntries = previousCustomerEntries[productId] || {};
          const productDirtyCells = customerDirtyCells[productId] || {};
          const nextDayMap = {};

          Object.entries(dayMap).forEach(([day, serverCell]) => {
            const previousCell = previousProductEntries[day] || {};
            const dirtyFields = productDirtyCells[day] || {};
            nextDayMap[day] = {
              ...serverCell,
              ...(dirtyFields.delivered ? { delivered: previousCell.delivered } : {}),
              ...(dirtyFields.returned ? { returned: previousCell.returned } : {}),
            };
          });

          nextCustomerEntries[productId] = nextDayMap;
        });

        // Preserve locally added product rows not present in the server plan set.
        Object.entries(previousCustomerEntries).forEach(([productId, dayMap]) => {
          if (!nextCustomerEntries[productId]) {
            nextCustomerEntries[productId] = dayMap;
          }
        });

        merged[customerId] = nextCustomerEntries;
      });

      return merged;
    });
  }, [
    paginatedCustomers,
    customersLoading,
    loading,
    currentPagePlansReady,
    customerPlans,
    deliveriesByCustomer,
    dirtyCells,
    month,
    dayCount,
    shift,
  ]);

  // ------------------------------------------
  // EXISTING DELIVERY MAP
  // ------------------------------------------

  const existingDeliveriesByCustomer = useMemo(() => {
    const map = {};

    deliveries.forEach((delivery) => {
      if (
        !delivery.date?.startsWith(`${month}-`) ||
        (delivery.shift || "morning") !== shift
      ) {
        return;
      }

      const customerId = normalizeId(delivery.customerId);
      const day = Number(delivery.date.slice(-2));

      if (!map[customerId]) map[customerId] = {};
      map[customerId][day] = delivery;
    });

    return map;
  }, [deliveries, month, shift]);

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
      (deliveriesByCustomer[normalizeId(customerId)] || [])
        .filter((delivery) =>
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

    setDirtyCells((previous) => ({
      ...previous,
      [normalizeId(customerId)]: {
        ...previous[normalizeId(customerId)],
        [normalizeId(productId)]: {
          ...previous[normalizeId(customerId)]?.[normalizeId(productId)],
          [day]: {
            ...previous[normalizeId(customerId)]?.[normalizeId(productId)]?.[day],
            [field]: true,
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
  }

  // ------------------------------------------
  // SAVE ALL MONTHLY ENTRIES
  // ------------------------------------------

  async function handleSaveAll() {
    setError("");
    setSuccess("");

    if (registerLoading || deliveriesLoading || registerUnavailable) {
      setError(
        deliveriesError
          ? "Delivery history could not be loaded. Refresh the page before saving."
          : plansError
            ? "Customer rate plans could not be loaded. Refresh the page before saving."
            : lookupsError
              ? "Product and group data could not be loaded. Refresh the page before saving."
              : "Customer delivery data is still loading. Please try again in a moment."
      );
      return;
    }

    if (!visibleCustomers.length) {
      setError("No customers found for the selected filters.");
      return;
    }

    if (!isMonthEditable) {
      setError(
        `This month is view-only. Bulk entries can be edited only from ${editableMinMonth} through ${getCurrentMonth()}.`
      );
      return;
    }

    setSaving(true);
    let saved = 0;
    const failures = [];

    try {
      // Rate plans are loaded page-by-page for speed. Before Save All, fetch
      // any remaining filtered customers in one batch so no entries are skipped.
      let allPlans = { ...customerPlans };
      const missingCustomers = visibleCustomers.filter(
        (customer) => !loadedPlanIds.includes(normalizeId(customer.id))
      );

      if (missingCustomers.length) {
        const plansByCustomer =
          await deliveryService.getCustomerRatePlansForCustomers(
            missingCustomers.map((customer) => customer.id),
            monthEnd,
            monthStart
          );
        const normalized = normalizeCustomerPlanRows(
          missingCustomers,
          plansByCustomer,
          products
        );

        missingCustomers.forEach((customer) => {
          const customerId = normalizeId(customer.id);
          const savedPlans = normalized[customerId] || [];
          const manualPlans = (customerPlans[customerId] || []).filter(
            (plan) =>
              plan.isOtherProduct &&
              !savedPlans.some(
                (savedPlan) => normalizeId(savedPlan.productId) === normalizeId(plan.productId)
              )
          );
          allPlans[customerId] = [...savedPlans, ...manualPlans];
        });

        setCustomerPlans((previous) => ({ ...previous, ...allPlans }));
        setLoadedPlanIds((previous) => [
          ...new Set([
            ...previous,
            ...missingCustomers.map((customer) => normalizeId(customer.id)),
          ]),
        ]);
      }

      const pending = [];

      for (const customer of visibleCustomers) {
        const customerId = normalizeId(customer.id);
        const plans = allPlans[customerId] || [];
        const existingDays = existingDeliveriesByCustomer[customerId] || {};
        if (!plans.length) continue;

        // Customers not visited yet still receive a server-hydrated baseline.
        // Values already edited in the UI override that baseline.
        const baselineEntries = createCustomerEntries(
          plans,
          deliveriesByCustomer[customerId] || [],
          month,
          dayCount,
          shift
        );
        const currentEntries = entries[customerId] || {};
        const customerEntry = { ...baselineEntries };

        Object.entries(currentEntries).forEach(([productId, dayMap]) => {
          customerEntry[productId] = {
            ...(customerEntry[productId] || {}),
            ...dayMap,
          };
        });

        for (let day = 1; day <= dayCount; day += 1) {
          const date = makeDate(month, day);
          if (date > today) continue;

          const existingDelivery = existingDays[day];
          const items = [];
          let hasQuantity = false;

          for (const plan of plans) {
            const cell = customerEntry[plan.productId]?.[day] || {};
            const quantity = Number(cell.delivered || 0);
            const returned = Number(cell.returned || 0);
            const unitPrice = Number(cell.unitPrice ?? plan.rate);

            if (
              !Number.isInteger(quantity) ||
              !Number.isInteger(returned) ||
              quantity < 0 ||
              returned < 0 ||
              !Number.isFinite(unitPrice) ||
              unitPrice < 0
            ) {
              setError(`${customer.name}, day ${day}: invalid quantity or rate.`);
              return;
            }

            if (!plan.isReturnable && returned > 0) {
              setError(
                `${customer.name}, ${plan.productName}: this product does not accept jar returns.`
              );
              return;
            }

            if (returned > quantity) {
              setError(`${customer.name}, day ${day}: returned quantity cannot exceed delivered quantity.`);
              return;
            }

            if (plan.isReturnable && (!Number.isInteger(quantity) || !Number.isInteger(returned))) {
              setError(`${customer.name}, ${plan.productName}: jar quantities must be whole numbers.`);
              return;
            }

            if (quantity > 0) hasQuantity = true;

            items.push({
              productId: plan.productId,
              quantity,
              returned,
              unitPrice,
            });
          }

          if (existingDelivery || hasQuantity) {
            pending.push({ customer, date, items });
          }
        }
      }

      if (!pending.length) {
        setError("There are no delivery entries to save.");
        return;
      }

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
            `${entry.customer.name} (${entry.date}): ${err.message || "Save failed"}`
          );
        }
      }

      await refreshSavedData();

      if (saved) {
        setSuccess(`${saved} daily delivery record(s) saved/updated successfully.`);
      }
      if (failures.length) {
        setError(
          `${failures.length} record(s) failed. ${failures.slice(0, 4).join(" | ")}`
        );
      }
    } catch (err) {
      setError(err?.message || "Unable to save monthly delivery entries.");
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
          registerLoading || registerUnavailable
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
    <main className="min-h-screen bg-[#eef2f7] px-2 py-3 text-slate-900 sm:px-5 sm:py-4">
      <div className="mx-auto max-w-[1800px] space-y-4">

        

      

        {/* COMPACT FILTER BAR */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <SlidersHorizontal size={19} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#102C46]">Delivery Filters</h2>
                <p className="truncate text-xs text-slate-500">
                  {visibleCustomers.length} customers · {month} · {getShiftLabel(shift)}
                  {groupId ? " · Group selected" : " · All groups"}
                </p>
              </div>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-none"
              >
                <Search size={16} />
                {filtersOpen ? "Hide Filters" : "Show Filters"}
                {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={
                  saving || loading || customersLoading || deliveriesLoading ||
                  plansLoading || !currentPagePlansReady || registerUnavailable ||
                  !visibleCustomers.length || !isMonthEditable
                }
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#102C46] px-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-4"
              >
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                <span className="whitespace-nowrap">{saving ? "Saving..." : "Save All"}</span>
              </button>
            </div>
          </div>

          {filtersOpen && (
            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/70 p-2.5 sm:gap-3 sm:p-4">
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-semibold text-slate-600 sm:text-xs">Group</span>
                <select
                  value={groupId}
                  onChange={(event) => setGroupId(event.target.value)}
                  className="min-h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:min-h-11 sm:rounded-xl sm:px-3 sm:text-sm"
                >
                  <option value="">All Groups</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </label>

              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-semibold text-slate-600 sm:text-xs">Delivery Month</span>
                <input
                  type="month"
                  value={month}
                  min={getMinMonth()}
                  max={getCurrentMonth()}
                  onChange={(event) => {
                    setMonth(event.target.value);
                    setEntries({});
                    setDirtyCells({});
                    setLoadedPlanIds([]);
                    setPlansError("");
                    setError("");
                    setSuccess("");
                  }}
                  className="min-h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:min-h-11 sm:rounded-xl sm:px-3 sm:text-sm"
                />
                <span className="mt-1 block text-[11px] text-slate-500">View: 12 months · Edit: 6 months</span>
              </label>

              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-semibold text-slate-600 sm:text-xs">Shift</span>
                <select
                  value={shift}
                  onChange={(event) => {
                    setShift(event.target.value);
                    setEntries({});
                    setDirtyCells({});
                    setError("");
                    setSuccess("");
                  }}
                  className="min-h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:min-h-11 sm:rounded-xl sm:px-3 sm:text-sm"
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
              </label>

              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-semibold text-slate-600 sm:text-xs">Search Customer</span>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    aria-label="Search customers by name, phone, area or customer code"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Name, phone, area or code"
                    className="min-h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-2 text-xs outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:min-h-11 sm:rounded-xl sm:pl-9 sm:pr-3 sm:text-sm"
                  />
                </div>
              </label>

              <div className="col-span-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-500">{visibleCustomers.length} customer(s) match the selected filters</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextMonth = getCurrentMonth();
                    const monthChanged = month !== nextMonth;
                    const shiftChanged = shift !== "morning";
                    setGroupId("");
                    setSearch("");
                    if (monthChanged || shiftChanged) {
                      setEntries({});
                      setDirtyCells({});
                    }
                    if (monthChanged) {
                      setLoadedPlanIds([]);
                      setPlansError("");
                      setMonth(nextMonth);
                    }
                    setShift("morning");
                    setFiltersOpen(false);
                  }}
                  className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Reset filters
                </button>
              </div>
            </div>
          )}
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

        {customersLoading ? (
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

            {paginatedCustomers.map((customer) => {
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
                  className="grid min-w-0 grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:gap-3 sm:p-3 lg:grid-cols-[260px_minmax(0,1fr)]"
                >

                  {/* CUSTOMER SUMMARY */}

                  <aside className="h-fit min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:rounded-2xl sm:bg-white sm:p-4 lg:sticky lg:left-0">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e8eff8] text-lg font-bold text-[#4778b8] sm:size-14 sm:text-xl">
                        {customer.name?.charAt(0)?.toUpperCase() || "C"}
                      </div>

                      <div className="min-w-0">
                        <h2
                          className="truncate text-base font-bold text-slate-900 sm:text-lg"
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

                    <div className="my-3 border-t border-slate-200 sm:my-4" />

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-100 p-2.5 sm:p-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Package size={14} />
                          Unbal. Jar
                        </div>

                        <p className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                          {deliveriesError
                            ? "—"
                            : deliveriesLoading
                              ? "..."
                              : jarBalance}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-100 p-2.5 sm:p-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <IndianRupee size={14} />
                          Due
                        </div>

                        <p className="mt-1 truncate text-lg font-bold text-rose-500 sm:text-xl">
                          {balancesLoading ? "..." : formatMoney(due)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{groupName}</span>

                      <span>
                        {registerUnavailable
                          ? "—"
                          : registerLoading || deliveriesLoading
                            ? "Loading totals..."
                            : `${totals.delivered} delivered · ${totals.returned} returned`}
                      </span>
                    </div>

                    <div className="mt-2 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-800">
                      Monthly amount:{" "}
                      <strong>
                        {registerUnavailable
                          ? "Unavailable"
                          : registerLoading || deliveriesLoading
                            ? "Loading..."
                            : `₹${formatMoney(totals.amount)}`}
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
                        disabled={
                          !isMonthEditable ||
                          saving ||
                          registerLoading ||
                          registerUnavailable
                        }
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

                    {registerUnavailable ? (
                      <div
                        role="alert"
                        className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                      >
                        {deliveriesError
                          ? "Delivery history could not be loaded. Reload the page before editing or saving this monthly register."
                          : plansError
                            ? "Customer product rate plans could not be loaded. Reload the page before editing or saving this monthly register."
                            : "Product and customer group data could not be loaded. Reload the page before editing or saving this monthly register."}
                      </div>
                    ) : registerLoading && !plans.length ? (
                      <div
                        role="status"
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500"
                      >
                        <RefreshCw size={16} className="animate-spin text-teal-700" />
                        Loading assigned products...
                      </div>
                    ) : !registerLoading && !plans.length ? (
                      <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                        Is customer ka koi product assigned nahi hai. Upar Others product dropdown se product select karein.
                      </div>
                    ) : registerLoading ? (
                      <div
                        role="status"
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500"
                      >
                        <RefreshCw size={16} className="animate-spin text-teal-700" />
                        Preparing monthly delivery entries...
                      </div>
                    ) : (
                      <div className="space-y-3">

                        {/* DATE HEADER */}
                        <p className="mb-1 px-1 text-[11px] text-slate-400 sm:hidden">
                          Swipe horizontally to view all dates →
                        </p>

                        <div className="overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:thin]" style={{ WebkitOverflowScrolling: "touch" }}>
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

                              <div className="overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:thin]" style={{ WebkitOverflowScrolling: "touch" }}>
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

      

       
        
        {/* PAGINATION - keeps the monthly register DOM lightweight */}
        {!loading &&
          !customersLoading &&
          visibleCustomers.length > CUSTOMER_PAGE_SIZE && (
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <strong className="text-slate-800">
                  {(customerPage - 1) * CUSTOMER_PAGE_SIZE + 1}
                  {"–"}
                  {Math.min(
                    customerPage * CUSTOMER_PAGE_SIZE,
                    visibleCustomers.length
                  )}
                </strong>{" "}
                of{" "}
                <strong className="text-slate-800">
                  {visibleCustomers.length}
                </strong>{" "}
                customers
                {plansLoading && " · Loading rate plans..."}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCustomerPage((page) => Math.max(1, page - 1))
                  }
                  disabled={customerPage <= 1}
                  className="min-h-10 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                >
                  Previous
                </button>

                <span className="min-w-16 text-center text-xs font-semibold text-slate-600">
                  {customerPage} / {totalCustomerPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCustomerPage((page) =>
                      Math.min(totalCustomerPages, page + 1)
                    )
                  }
                  disabled={customerPage >= totalCustomerPages}
                  className="min-h-10 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}

      </div>
    </main>
  );
}
