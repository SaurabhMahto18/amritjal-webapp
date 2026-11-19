import { supabase } from "../../../lib/supabase/client";
import { getCurrentBusinessId } from "../../auth/services/businessAccessService";

const TABLES = {
  deliveries: "deliveries",
  deliveryItems: "delivery_items",
  customers: "customers",
  businesses: "businesses",
  employees: "staff_employees",
  products: "products",
  ratePlans: "customer_rate_plans",
  jars: "jar_transactions",
  payments: "payments",
  groups: "customer_groups",
  memberships: "customer_group_members",
  events: "events",
};

async function getBusinessId() {
  return getCurrentBusinessId();
}

function notifyJarUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("amrit-jal-jars-updated"));
    window.dispatchEvent(new Event("amrit-jal-deliveries-updated"));
  }
}

function normalizeDelivery(row, items = []) {
  return {
    id: row.id,
    businessId: row.business_id,
    eventId: row.event_id || null,
    customerId: row.customer_id,
    customerName: row.customers?.name || "Unknown Customer",
    customerPhone: row.customers?.phone || "",
    customerArea: row.customers?.area || "",
    date: row.delivery_date,
    quantity: Number(row.jar_quantity || 0),
    jarsReceived: Number(row.jars_received || 0),
    rate: Number(row.jar_rate || 0),
    amount: Number(row.amount || 0),
    shift: row.delivery_shift || row.shift || "",
    deliveredBy: row.delivered_by || "",
    deliveryPerson: row.delivery_person || "",
    notes: row.notes || "",
    createdAt: row.created_at || null,
    items,
  };
}

const DELIVERY_SELECT = `
  id,
  business_id,
  event_id,
  customer_id,
  delivery_date,
  jar_quantity,
  jars_received,
  jar_rate,
  amount,
  notes,
  shift,
  delivery_shift,
  delivered_by,
  delivery_person,
  created_at,
  customers!inner(name, phone, area)
`;

const deliveryService = {
  // ------------------------------------------
  // GET CUSTOMERS
  // ------------------------------------------

  async getCustomers() {
    const businessId = await getBusinessId();

    const { data, error } = await supabase
      .from(TABLES.customers)
      .select(`
        id,
        code,
        name,
        phone,
        address,
        area,
        jar_rate,
        opening_balance,
        group_id,
        status,
        archived
      `)
      .eq("business_id", businessId)
      .eq("archived", false)
      .order("name");

    if (error) throw error;

    return (data || [])
      .filter((customer) => customer.status !== "inactive")
      .map((customer) => ({
        id: customer.id,
        code: customer.code || "",
        name: customer.name || "",
        phone: customer.phone || "",
        address: customer.address || "",
        area: customer.area || "",
        jarRate: Number(customer.jar_rate || 0),
        openingBalance: Number(customer.opening_balance || 0),
        group_id: customer.group_id || "",
        groupId: customer.group_id || "",
      }));
  },

  // ------------------------------------------
  // GET EMPLOYEES
  // Source: public.staff_employees
  // ------------------------------------------

  async getEmployees() {
    const businessId = await getBusinessId();

    const { data, error } = await supabase
      .from(TABLES.employees)
      .select("id, business_id, name, phone, role")
      .eq("business_id", businessId)
      .order("name", { ascending: true });

    if (error) throw error;

    return (data || []).map((employee) => ({
      id: employee.id,
      name: employee.name || "",
      full_name: employee.name || "",
      phone: employee.phone || "",
      role: employee.role || "",
      status: "active",
    }));
  },

  // ------------------------------------------
  // GET PRODUCTS
  // ------------------------------------------

  async getProducts() {
    const businessId = await getBusinessId();

    const { data, error } = await supabase
      .from(TABLES.products)
      .select(`
        id,
        name,
        sku,
        unit,
        sale_price,
        cost_price,
        is_returnable_jar,
        status
      `)
      .eq("business_id", businessId)
      .order("name");

    if (error) throw error;

    return (data || []).filter(
      (product) => !product.status || product.status === "active"
    );
  },

  // ------------------------------------------
  // CUSTOMER PRODUCT RATE PLANS
  // ------------------------------------------

  async getCustomerRatePlans(
    customerId,
    deliveryDate,
    periodStart = null
  ) {
    if (!customerId) return [];

    if (
      deliveryDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)
    ) {
      throw new Error("Please provide a valid rate-plan date.");
    }

    if (
      periodStart &&
      !/^\d{4}-\d{2}-\d{2}$/.test(periodStart)
    ) {
      throw new Error("Please provide a valid period start date.");
    }

    const businessId = await getBusinessId();

    let query = supabase
      .from(TABLES.ratePlans)
      .select(`
        id,
        customer_id,
        product_id,
        unit_price,
        default_quantity,
        effective_from,
        effective_to
      `)
      .eq("business_id", businessId)
      .eq("customer_id", customerId);

    if (deliveryDate) {
      const rangeStart = periodStart || deliveryDate;
      const rangeEnd = deliveryDate;

      query = query.or(
        `effective_from.is.null,effective_from.lte.${rangeEnd}`
      );

      query = query.or(
        `effective_to.is.null,effective_to.gte.${rangeStart}`
      );
    } else {
      query = query.is("effective_to", null);
    }

    const { data, error } = await query.order("effective_from", {
      ascending: false,
      nullsFirst: false,
    });

    if (error) throw error;

    const latestPlanByProduct = new Map();

    for (const plan of data || []) {
      if (!latestPlanByProduct.has(plan.product_id)) {
        latestPlanByProduct.set(plan.product_id, plan);
      }
    }

    return Array.from(latestPlanByProduct.values());
  },

  // ------------------------------------------
  // BATCH CUSTOMER PRODUCT RATE PLANS
  // ------------------------------------------

  async getCustomerRatePlansForCustomers(
    customerIds,
    deliveryDate,
    periodStart = null
  ) {
    const uniqueCustomerIds = [
      ...new Set((customerIds || []).filter(Boolean)),
    ];

    if (!uniqueCustomerIds.length) return {};

    if (
      !deliveryDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)
    ) {
      throw new Error("Please provide a valid rate-plan date.");
    }

    if (
      periodStart &&
      !/^\d{4}-\d{2}-\d{2}$/.test(periodStart)
    ) {
      throw new Error("Please provide a valid period start date.");
    }

    const businessId = await getBusinessId();
    const rangeStart = periodStart || deliveryDate;
    const rangeEnd = deliveryDate;

    const { data, error } = await supabase
      .from(TABLES.ratePlans)
      .select(`
        id,
        customer_id,
        product_id,
        unit_price,
        default_quantity,
        effective_from,
        effective_to
      `)
      .eq("business_id", businessId)
      .in("customer_id", uniqueCustomerIds)
      .or(
        `effective_from.is.null,effective_from.lte.${rangeEnd}`
      )
      .or(
        `effective_to.is.null,effective_to.gte.${rangeStart}`
      )
      .order("effective_from", {
        ascending: false,
        nullsFirst: false,
      });

    if (error) throw error;

    const result = {};

    uniqueCustomerIds.forEach((customerId) => {
      result[customerId] = [];
    });

    const latestPlanByCustomerProduct = new Map();

    for (const plan of data || []) {
      const key = `${plan.customer_id}:${plan.product_id}`;

      if (!latestPlanByCustomerProduct.has(key)) {
        latestPlanByCustomerProduct.set(key, plan);
      }
    }

    for (const plan of latestPlanByCustomerProduct.values()) {
      result[plan.customer_id].push(plan);
    }

    return result;
  },

  // ------------------------------------------
  // GET ALL DELIVERIES
  // ------------------------------------------

  async getAll({
    date = "",
    customerId = "",
    eventId = "",
  } = {}) {
    const businessId = await getBusinessId();

    let query = supabase
      .from(TABLES.deliveries)
      .select(DELIVERY_SELECT)
      .eq("business_id", businessId)
      .order("delivery_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    if (date) {
      query = query.eq("delivery_date", date);
    }

    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const rows = data || [];

    if (!rows.length) return [];

    const deliveryIds = rows.map((row) => row.id);

    const { data: itemRows, error: itemError } = await supabase
      .from(TABLES.deliveryItems)
      .select(`
        id,
        delivery_id,
        product_id,
        quantity_delivered,
        quantity_returned,
        unit_price,
        line_total,
        notes
      `)
      .eq("business_id", businessId)
      .in("delivery_id", deliveryIds);

    if (itemError) throw itemError;

    const itemsByDelivery = (itemRows || []).reduce((map, item) => {
      if (!map[item.delivery_id]) {
        map[item.delivery_id] = [];
      }

      map[item.delivery_id].push({
        id: item.id,
        productId: item.product_id,
        quantity: Number(item.quantity_delivered || 0),
        returned: Number(item.quantity_returned || 0),
        unitPrice: Number(item.unit_price || 0),
        lineTotal: Number(item.line_total || 0),
        notes: item.notes || "",
      });

      return map;
    }, {});

    return rows.map((row) =>
      normalizeDelivery(row, itemsByDelivery[row.id] || [])
    );
  },

  // ------------------------------------------
  // GET CUSTOMER GROUPS
  // ------------------------------------------

  async getGroups() {
    const businessId = await getBusinessId();

    const { data, error } = await supabase
      .from(TABLES.groups)
      .select("id, name")
      .eq("business_id", businessId)
      .order("name");

    if (error) throw error;

    return data || [];
  },

  // ------------------------------------------
  // GET CUSTOMER GROUP MAP
  // ------------------------------------------

  async getCustomerGroupMap() {
    const businessId = await getBusinessId();

    const { data, error } = await supabase
      .from(TABLES.memberships)
      .select(`
        customer_id,
        group_id,
        customer_groups(id, name)
      `)
      .eq("business_id", businessId);

    if (error) throw error;

    return (data || []).reduce((map, row) => {
      map[row.customer_id] = {
        id: row.group_id,
        name: row.customer_groups?.name || "",
      };

      return map;
    }, {});
  },

  // ------------------------------------------
  // CUSTOMER OUTSTANDING BALANCES
  // ------------------------------------------

  async getCustomerBalances() {
    const businessId = await getBusinessId();

    const [customers, deliveries, payments] = await Promise.all([
      supabase
        .from(TABLES.customers)
        .select("id, opening_balance")
        .eq("business_id", businessId)
        .eq("archived", false),

      supabase
        .from(TABLES.deliveries)
        .select("customer_id, amount")
        .eq("business_id", businessId),

      supabase
        .from(TABLES.payments)
        .select("customer_id, amount")
        .eq("business_id", businessId),
    ]);

    for (const result of [customers, deliveries, payments]) {
      if (result.error) throw result.error;
    }

    const balances = {};

    (customers.data || []).forEach((customer) => {
      balances[customer.id] = Number(customer.opening_balance || 0);
    });

    (deliveries.data || []).forEach((delivery) => {
      balances[delivery.customer_id] =
        (balances[delivery.customer_id] || 0) +
        Number(delivery.amount || 0);
    });

    (payments.data || []).forEach((payment) => {
      balances[payment.customer_id] =
        (balances[payment.customer_id] || 0) -
        Number(payment.amount || 0);
    });

    return balances;
  },

  // ------------------------------------------
  // CREATE DELIVERY / EVENT BOOKING
  // ------------------------------------------

  async create(input) {
    const businessId = await getBusinessId();

    const customerId = input.customerId;
    const eventId = input.eventId || null;
    const date = input.date;
    const shift = input.shift || "morning";
    const employeeId = input.deliveredBy || null;
    const notes = input.notes?.trim() || null;

    const items = (
      Array.isArray(input.items) ? input.items : []
    ).filter((item) => Number(item.quantity) > 0);

    if (!customerId) {
      throw new Error("Please select a customer.");
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("Please select a valid delivery date.");
    }

    if (!items.length) {
      throw new Error(
        "This customer has no assigned products. Assign products before creating a delivery."
      );
    }

    // Verify customer belongs to current business.

    const { data: customer, error: customerError } = await supabase
      .from(TABLES.customers)
      .select("id")
      .eq("id", customerId)
      .eq("business_id", businessId)
      .eq("archived", false)
      .maybeSingle();

    if (customerError) throw customerError;

    if (!customer) {
      throw new Error("The selected customer is unavailable.");
    }

    // Verify event belongs to this business and customer.

    if (eventId) {
      const { data: event, error: eventError } = await supabase
        .from(TABLES.events)
        .select("id, customer_id")
        .eq("id", eventId)
        .eq("business_id", businessId)
        .maybeSingle();

      if (eventError) throw eventError;

      if (!event) {
        throw new Error("The selected event is unavailable.");
      }

      if (event.customer_id !== customerId) {
        throw new Error(
          "The selected customer does not belong to this event."
        );
      }
    }

    // Verify employee from staff_employees.

    let employeeName = input.deliveryPerson?.trim() || null;

    if (employeeId) {
      const { data: employee, error } = await supabase
        .from(TABLES.employees)
        .select("id, business_id, name, phone, role")
        .eq("id", employeeId)
        .eq("business_id", businessId)
        .maybeSingle();

      if (error) throw error;

      if (!employee) {
        throw new Error("The selected employee is unavailable.");
      }

      employeeName = employee.name || "";
    }

    // Load assigned product plans.

    const plans = await this.getCustomerRatePlans(customerId, date);

    const planByProduct = new Map(
      plans.map((plan) => [plan.product_id, plan])
    );

    const products = await this.getProducts();

    const productById = new Map(
      products.map((product) => [product.id, product])
    );

    // Validate and normalize product rows.

    const cleanItems = items.map((item) => {
      const product = productById.get(item.productId);
      const plan = planByProduct.get(item.productId);

      if (!product || !plan) {
        throw new Error(
          "A selected product is not assigned to this customer."
        );
      }

      const quantity = Number(item.quantity);
      const returned = Number(item.returned || 0);
      const unitPrice = Number(item.unitPrice);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(
          `Enter a valid quantity for ${product.name}.`
        );
      }

      if (
        product.is_returnable_jar &&
        !Number.isInteger(quantity)
      ) {
        throw new Error(
          `Jar quantity for ${product.name} must be a whole number.`
        );
      }

      if (
        !Number.isFinite(returned) ||
        returned < 0 ||
        returned > quantity
      ) {
        throw new Error(
          `Returned quantity for ${product.name} must be between 0 and delivered quantity.`
        );
      }

      if (
        product.is_returnable_jar &&
        !Number.isInteger(returned)
      ) {
        throw new Error(
          `Returned jar quantity for ${product.name} must be a whole number.`
        );
      }

      if (
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        throw new Error(
          `Enter a valid rate for ${product.name}.`
        );
      }

      return {
        product,
        productId: product.id,
        quantity,
        returned,
        unitPrice,
        lineTotal: Number(
          (quantity * unitPrice).toFixed(2)
        ),
        notes: item.notes?.trim() || null,
      };
    });

    // Calculate total amount.

    const total = Number(
      cleanItems
        .reduce((sum, item) => sum + item.lineTotal, 0)
        .toFixed(2)
    );

    // Calculate returnable jar quantities only.

    const returnableItems = cleanItems.filter(
      (item) => item.product.is_returnable_jar
    );

    const jarQuantity = returnableItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const jarsReceived = returnableItems.reduce(
      (sum, item) => sum + item.returned,
      0
    );

    const firstReturnable = returnableItems[0];
    const legacyRate = firstReturnable?.unitPrice ?? 0;

    // Create main delivery record.

    const { data: delivery, error: insertError } = await supabase
      .from(TABLES.deliveries)
      .insert({
        business_id: businessId,
        customer_id: customerId,
        event_id: eventId,
        delivery_date: date,
        jar_quantity: jarQuantity,
        jars_received: jarsReceived,
        jar_rate: legacyRate,
        amount: total,
        shift,
        delivery_shift: shift,
        delivered_by: employeeId,
        delivery_person: employeeName,
        notes,
      })
      .select(DELIVERY_SELECT)
      .single();

    if (insertError) throw insertError;

    // Prepare delivery_items records.

    const itemRows = cleanItems.map((item) => ({
      business_id: businessId,
      delivery_id: delivery.id,
      product_id: item.productId,
      quantity_delivered: item.quantity,
      quantity_returned: item.returned,
      unit_price: item.unitPrice,
      notes: item.notes,
    }));

    // Prepare jar transactions.

    const transactions = [];

    cleanItems
      .filter((item) => item.product.is_returnable_jar)
      .forEach((item) => {
        if (item.quantity > 0) {
          transactions.push({
            business_id: businessId,
            customer_id: customerId,
            product_id: item.productId,
            delivery_id: delivery.id,
            movement_type: "delivered",
            quantity: item.quantity,
            transaction_date: date,
            notes: "Delivery recorded",
          });
        }

        if (item.returned > 0) {
          transactions.push({
            business_id: businessId,
            customer_id: customerId,
            product_id: item.productId,
            delivery_id: delivery.id,
            movement_type: "returned",
            quantity: item.returned,
            transaction_date: date,
            notes: "Jar return recorded with delivery",
          });
        }
      });

    // Insert child records with compensating rollback.

    try {
      const { error: itemError } = await supabase
        .from(TABLES.deliveryItems)
        .insert(itemRows);

      if (itemError) throw itemError;

      if (transactions.length) {
        const { error: jarError } = await supabase
          .from(TABLES.jars)
          .insert(transactions);

        if (jarError) throw jarError;
      }
    } catch (err) {
      const { error: rollbackJarError } = await supabase
        .from(TABLES.jars)
        .delete()
        .eq("business_id", businessId)
        .eq("delivery_id", delivery.id);

      const { error: rollbackItemsError } = await supabase
        .from(TABLES.deliveryItems)
        .delete()
        .eq("business_id", businessId)
        .eq("delivery_id", delivery.id);

      const { error: rollbackDeliveryError } = await supabase
        .from(TABLES.deliveries)
        .delete()
        .eq("business_id", businessId)
        .eq("id", delivery.id);

      if (
        rollbackJarError ||
        rollbackItemsError ||
        rollbackDeliveryError
      ) {
        throw new Error(
          `${err.message}. Automatic rollback was incomplete; verify delivery ${delivery.id} before retrying.`
        );
      }

      throw err;
    }

    notifyJarUpdate();

    const createdItems = cleanItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      returned: item.returned,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    }));

    return normalizeDelivery(delivery, createdItems);
  },

  // ------------------------------------------
  // DELETE DELIVERY
  // ------------------------------------------

  async delete(id) {
    if (!id) {
      throw new Error("Delivery ID is required.");
    }

    const businessId = await getBusinessId();

    // Remove linked jar movements first.

    const { error: jarError } = await supabase
      .from(TABLES.jars)
      .delete()
      .eq("business_id", businessId)
      .eq("delivery_id", id);

    if (jarError) throw jarError;

    // Remove delivery items explicitly.

    const { error: itemError } = await supabase
      .from(TABLES.deliveryItems)
      .delete()
      .eq("business_id", businessId)
      .eq("delivery_id", id);

    if (itemError) throw itemError;

    // Delete delivery.

    const { data, error } = await supabase
      .from(TABLES.deliveries)
      .delete()
      .eq("id", id)
      .eq("business_id", businessId)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "Delivery not found or could not be deleted."
      );
    }

    notifyJarUpdate();

    return true;
  },

  // ------------------------------------------
  // SAVE / UPDATE BULK DELIVERY DAY
  // ------------------------------------------

  async saveBulkDeliveryDay({
    customerId,
    date,
    shift = "morning",
    items = [],
    notes = "",
  }) {
    if (!customerId) {
      throw new Error("Please select a customer.");
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("Please provide a valid delivery date.");
    }

    if (!["morning", "evening", "other"].includes(shift)) {
      throw new Error("Invalid delivery shift.");
    }

    if (!Array.isArray(items)) {
      throw new Error("Invalid delivery items.");
    }

    const seenProducts = new Set();

    const payload = items.map((item) => {
      const productId = item.productId;
      const quantity = Number(item.quantity ?? 0);
      const returned = Number(item.returned ?? 0);
      const unitPrice = Number(item.unitPrice ?? 0);

      if (!productId) {
        throw new Error("Product is missing from a delivery row.");
      }

      if (seenProducts.has(productId)) {
        throw new Error(
          "A product appears more than once in this delivery."
        );
      }

      seenProducts.add(productId);

      if (
        !Number.isFinite(quantity) ||
        !Number.isFinite(returned) ||
        !Number.isFinite(unitPrice) ||
        quantity < 0 ||
        returned < 0 ||
        unitPrice < 0
      ) {
        throw new Error("Invalid quantity or rate.");
      }

      if (returned > quantity) {
        throw new Error(
          "Returned quantity cannot exceed delivered quantity."
        );
      }

      return {
        productId,
        quantity,
        returned,
        unitPrice,
      };
    });

    const { data, error } = await supabase.rpc(
      "save_bulk_delivery",
      {
        p_customer_id: customerId,
        p_delivery_date: date,
        p_shift: shift,
        p_items: payload,
        p_notes: notes || null,
      }
    );

    if (error) {
      throw new Error(
        error.message || "Unable to save bulk delivery."
      );
    }

    notifyJarUpdate();

    return data;
  },
};

export default deliveryService;