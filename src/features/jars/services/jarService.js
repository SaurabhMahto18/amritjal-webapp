
import { supabase } from "../../../lib/supabase/client";

const TABLE = "jar_transactions";
const CUSTOMERS = "customers";
const PRODUCTS = "products";
const EMPLOYEES = "staff_employees";
const BUSINESSES = "businesses";

const MOVEMENTS = [
  "opening",
  "loaded",
  "unloaded",
  "delivered",
  "returned",
  "damaged",
  "lost",
  "adjustment",
];

const businessIdCache = new Map();

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

function normalize(row, names = {}) {
  if (!row) return null;

  return {
    id: row.id,
    businessId: row.business_id,
    customerId: row.customer_id || null,
    customerName: names.customers?.get(row.customer_id) || "",
    productId: row.product_id,
    productName: names.products?.get(row.product_id) || "",
    employeeId: row.employee_id || null,
    employeeName: names.employees?.get(row.employee_id) || "",
    deliveryId: row.delivery_id || null,
    type: row.movement_type,
    quantity: toNumber(row.quantity),
    adjustmentDirection: row.adjustment_direction || null,
    transactionDate: row.transaction_date,
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

async function getBusinessContext() {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  const user = sessionData.session?.user;

  if (!user) {
    throw new Error("Please log in to manage jar inventory.");
  }

  let businessId = businessIdCache.get(user.id);

  if (!businessId) {
    const { data, error } = await supabase
      .from(BUSINESSES)
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "Business account not found. Set up your business first."
      );
    }

    businessId = data.id;
    businessIdCache.set(user.id, businessId);
  }

  return { user, businessId };
}

async function fetchTransactions(businessId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("business_id", businessId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = data || [];

  const ids = (key) => [
    ...new Set(rows.map((row) => row[key]).filter(Boolean)),
  ];

  const customerIds = ids("customer_id");
  const productIds = ids("product_id");
  const employeeIds = ids("employee_id");

  const [customerRows, productRows, employeeRows] =
    await Promise.all([
      customerIds.length
        ? supabase
            .from(CUSTOMERS)
            .select("id,name")
            .eq("business_id", businessId)
            .in("id", customerIds)
        : Promise.resolve({ data: [], error: null }),

      productIds.length
        ? supabase
            .from(PRODUCTS)
            .select("id,name")
            .eq("business_id", businessId)
            .in("id", productIds)
        : Promise.resolve({ data: [], error: null }),

      employeeIds.length
        ? supabase
            .from(EMPLOYEES)
            .select("id,name")
            .eq("business_id", businessId)
            .in("id", employeeIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  for (const result of [
    customerRows,
    productRows,
    employeeRows,
  ]) {
    if (result.error) throw result.error;
  }

  const mapById = (items) =>
    new Map(
      (items || []).map((item) => [
        item.id,
        item.name || "",
      ])
    );

  const names = {
    customers: mapById(customerRows.data),
    products: mapById(productRows.data),
    employees: mapById(employeeRows.data),
  };

  return rows.map((row) => normalize(row, names));
}

function validate(input = {}) {
  const type = String(input.type || "");
  const quantity = Number(input.quantity);

  if (!MOVEMENTS.includes(type)) {
    throw new Error("Select a valid jar movement.");
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  if (!input.productId) {
    throw new Error("Select a jar product.");
  }

  if (
    ["delivered", "returned", "damaged", "lost"].includes(type) &&
    !input.customerId
  ) {
    throw new Error("Select a customer for this movement.");
  }

  if (
    ["loaded", "unloaded"].includes(type) &&
    !input.employeeId
  ) {
    throw new Error("Select an employee for this movement.");
  }

  if (
    type === "adjustment" &&
    !["increase", "decrease"].includes(
      input.adjustmentDirection
    )
  ) {
    throw new Error(
      "Select whether the adjustment increases or decreases stock."
    );
  }

  return {
    type,
    quantity,
    productId: input.productId,
    customerId: input.customerId || null,
    employeeId: input.employeeId || null,
    adjustmentDirection:
      type === "adjustment"
        ? input.adjustmentDirection
        : null,
    transactionDate:
      input.transactionDate ||
      new Date().toISOString().slice(0, 10),
    notes: String(input.notes || "").trim() || null,
  };
}

// Warehouse stock effect.
// Database quantity remains positive for every movement.
function warehouseEffect(transaction) {
  const quantity = transaction.quantity;

  switch (transaction.type) {
    case "opening":
      return quantity;

    case "loaded":
      return -quantity;

    case "unloaded":
      return quantity;

    case "delivered":
      return transaction.employeeId ? 0 : -quantity;

    case "returned":
      return quantity;

    case "damaged":
    case "lost":
      return -quantity;

    case "adjustment":
      return transaction.adjustmentDirection === "increase"
        ? quantity
        : -quantity;

    default:
      return 0;
  }
}

function buildSummary(transactions, products) {
  const byProduct = new Map();

  for (const product of products) {
    byProduct.set(product.id, {
      productId: product.id,
      productName: product.name,
      available: 0,
      totalOpening: 0,
      totalLoaded: 0,
      totalUnloaded: 0,
      totalDelivered: 0,
      totalReturned: 0,
      totalDamaged: 0,
      totalLost: 0,
      adjustmentIncrease: 0,
      adjustmentDecrease: 0,
      totalWithCustomers: 0,
    });
  }

  const customerBalances = new Map();
  const employeeBalances = new Map();

  for (const tx of transactions) {
    const item = byProduct.get(tx.productId);

    if (!item) continue;

    item.available += warehouseEffect(tx);

    const field = {
      opening: "totalOpening",
      loaded: "totalLoaded",
      unloaded: "totalUnloaded",
      delivered: "totalDelivered",
      returned: "totalReturned",
      damaged: "totalDamaged",
      lost: "totalLost",
    }[tx.type];

    if (field) {
      item[field] += tx.quantity;
    }

    if (tx.type === "adjustment") {
      if (tx.adjustmentDirection === "decrease") {
        item.adjustmentDecrease += tx.quantity;
      } else {
        item.adjustmentIncrease += tx.quantity;
      }
    }

    // Customer-wise product balance
    if (tx.customerId) {
      const key = `${tx.productId}:${tx.customerId}`;

      const current = customerBalances.get(key) || {
        productId: tx.productId,
        productName: tx.productName,
        customerId: tx.customerId,
        customerName: tx.customerName,
        delivered: 0,
        returned: 0,
        outstanding: 0,
      };

      if (tx.type === "delivered") {
        current.delivered += tx.quantity;
      }

      if (tx.type === "returned") {
        current.returned += tx.quantity;
      }

      current.outstanding =
        current.delivered - current.returned;

      customerBalances.set(key, current);
    }

    // Employee-wise product balance
    if (tx.employeeId) {
      const key = `${tx.productId}:${tx.employeeId}`;

      const current = employeeBalances.get(key) || {
        productId: tx.productId,
        productName: tx.productName,
        employeeId: tx.employeeId,
        employeeName: tx.employeeName,
        loaded: 0,
        unloaded: 0,
        outstanding: 0,
      };

      if (tx.type === "loaded") {
        current.loaded += tx.quantity;
      }

      if (tx.type === "unloaded") {
        current.unloaded += tx.quantity;
      }

      current.outstanding =
        current.loaded - current.unloaded;

      employeeBalances.set(key, current);
    }
  }

  const customerRows = [...customerBalances.values()];

  const productRows = [...byProduct.values()].map((item) => ({
    ...item,
    totalWithCustomers: customerRows
      .filter((row) => row.productId === item.productId)
      .reduce((sum, row) => sum + row.outstanding, 0),
  }));

  return {
    products: productRows,

    available: productRows.reduce(
      (sum, row) => sum + row.available,
      0
    ),

    totalWithCustomers: customerRows.reduce(
      (sum, row) => sum + row.outstanding,
      0
    ),

    totalPurchased: productRows.reduce(
      (sum, row) => sum + row.totalOpening,
      0
    ),

    totalDelivered: productRows.reduce(
      (sum, row) => sum + row.totalDelivered,
      0
    ),

    totalReturned: productRows.reduce(
      (sum, row) => sum + row.totalReturned,
      0
    ),

    totalDamaged: productRows.reduce(
      (sum, row) => sum + row.totalDamaged,
      0
    ),

    totalLost: productRows.reduce(
      (sum, row) => sum + row.totalLost,
      0
    ),

    customerBalances: customerRows,
    employeeBalances: [...employeeBalances.values()],
  };
}

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("amrit-jal-jars-updated")
    );
  }
}

async function getProducts() {
  const { businessId } = await getBusinessContext();

  const { data, error } = await supabase
    .from(PRODUCTS)
    .select("id,name")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) throw error;

  return data || [];
}

async function getCustomers() {
  const { businessId } = await getBusinessContext();

  const { data, error } = await supabase
    .from(CUSTOMERS)
    .select("id,name,phone,status,archived")
    .eq("business_id", businessId)
    .eq("archived", false)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data || []).map((row) => ({
    ...row,
    name: row.name || "",
  }));
}

async function getEmployees() {
  const { businessId } = await getBusinessContext();

  const { data, error } = await supabase
    .from(EMPLOYEES)
    .select("id,name")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) throw error;

  return data || [];
}

async function getTransactions() {
  const { businessId } = await getBusinessContext();

  return fetchTransactions(businessId);
}

async function getInventorySummary() {
  const [transactions, products] = await Promise.all([
    getTransactions(),
    getProducts(),
  ]);

  return buildSummary(transactions, products);
}

async function getCustomerJarBalance(customerId) {
  if (!customerId) {
    throw new Error("Customer ID is required.");
  }

  const transactions = await getTransactions();

  const rows = transactions.filter(
    (tx) => tx.customerId === customerId
  );

  const delivered = rows
    .filter((tx) => tx.type === "delivered")
    .reduce((sum, tx) => sum + tx.quantity, 0);

  const returned = rows
    .filter((tx) => tx.type === "returned")
    .reduce((sum, tx) => sum + tx.quantity, 0);

  return {
    customerId,
    delivered,
    returned,
    outstanding: delivered - returned,
    transactions: rows,
  };
}

async function getCustomerBalances() {
  const [transactions, products] = await Promise.all([
    getTransactions(),
    getProducts(),
  ]);

  return buildSummary(
    transactions,
    products
  ).customerBalances;
}

async function createTransaction(input) {
  const { user, businessId } = await getBusinessContext();

  const tx = validate(input);

  // Validate product belongs to this business
  const { data: product, error: productError } =
    await supabase
      .from(PRODUCTS)
      .select("id")
      .eq("id", tx.productId)
      .eq("business_id", businessId)
      .maybeSingle();

  if (productError) throw productError;

  if (!product) {
    throw new Error("Selected product was not found.");
  }

  // Validate customer
  if (tx.customerId) {
    const { data, error } = await supabase
      .from(CUSTOMERS)
      .select("id")
      .eq("id", tx.customerId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error("Selected customer was not found.");
    }
  }

  // Validate employee against staff_employees
  if (tx.employeeId) {
    const { data, error } = await supabase
      .from(EMPLOYEES)
      .select("id")
      .eq("id", tx.employeeId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error("Selected employee was not found.");
    }
  }

  const existing = await fetchTransactions(businessId);

  const sameProduct = existing.filter(
    (row) => row.productId === tx.productId
  );

  const available = sameProduct.reduce(
    (sum, row) => sum + warehouseEffect(row),
    0
  );

  if (available + warehouseEffect(tx) < 0) {
    throw new Error(
      `Insufficient warehouse stock. Available: ${available} jar(s).`
    );
  }

  // Prevent customer over-return
  if (tx.type === "returned") {
    const customerBalance = sameProduct
      .filter((row) => row.customerId === tx.customerId)
      .reduce((sum, row) => {
        if (row.type === "delivered") {
          return sum + row.quantity;
        }

        if (row.type === "returned") {
          return sum - row.quantity;
        }

        return sum;
      }, 0);

    if (tx.quantity > customerBalance) {
      throw new Error(
        `Customer has only ${customerBalance} outstanding jar(s) of this product.`
      );
    }
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      business_id: businessId,
      customer_id: tx.customerId,
      product_id: tx.productId,
      employee_id: tx.employeeId,
      delivery_id: null,
      movement_type: tx.type,
      quantity: tx.quantity,
      adjustment_direction: tx.adjustmentDirection,
      transaction_date: tx.transactionDate,
      notes: tx.notes,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) throw error;

  notify();

  return normalize(data);
}

async function deleteTransaction(id) {
  if (!id) {
    throw new Error("Transaction ID is required.");
  }

  const { businessId } = await getBusinessContext();

  const { data: row, error: lookupError } = await supabase
    .from(TABLE)
    .select("id,delivery_id")
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (!row) {
    throw new Error("Transaction not found.");
  }

  if (row.delivery_id) {
    throw new Error(
      "This movement is linked to a delivery. Delete or edit it from the Deliveries page."
    );
  }

  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .eq("business_id", businessId)
    .is("delivery_id", null)
    .select("id")
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error(
      "Transaction could not be deleted. Refresh and try again."
    );
  }

  notify();
}

export const jarService = {
  movementTypes: MOVEMENTS,
  getProducts,
  getCustomers,
  getEmployees,
  getTransactions,
  getInventorySummary,
  getCustomerJarBalance,
  getCustomerBalances,
  createTransaction,
  deleteTransaction,
};
