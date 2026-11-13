import { supabase } from "../../../lib/supabase/client";

/* -------------------------------------------------------
   BUSINESS CONTEXT
------------------------------------------------------- */

async function getBusinessContext() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    throw new Error("Please sign in to continue.");
  }

  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (error) throw error;

  if (!data?.id) {
    throw new Error("Business profile not found.");
  }

  return {
    businessId: data.id,
    userId: user.id,
  };
}

async function getBusinessId() {
  const { businessId } = await getBusinessContext();
  return businessId;
}

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function getLocalDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeProductInput(product) {
  const name = product.name?.trim();

  if (!name) {
    throw new Error("Product name is required.");
  }

  const costPrice = Number(
    product.costPrice ?? product.cost_price ?? 0
  );

  const salePrice = Number(
    product.sellingPrice ??
      product.selling_price ??
      product.sale_price ??
      0
  );

  if (!Number.isFinite(costPrice) || costPrice < 0) {
    throw new Error("Please enter a valid cost price.");
  }

  if (!Number.isFinite(salePrice) || salePrice < 0) {
    throw new Error("Please enter a valid selling price.");
  }

  const jarSize = Number(
    product.jarSizeL ?? product.jar_size_l ?? 0
  );

  if (!Number.isFinite(jarSize) || jarSize < 0) {
    throw new Error("Please enter a valid jar size.");
  }

  return {
    name,
    sku: product.sku?.trim() || null,
    category: product.category || "other",
    unit: product.unit || "jar",
    description: product.description?.trim() || null,

    cost_price: costPrice,
    sale_price: salePrice,

    jar_size_l: jarSize > 0 ? jarSize : null,

    is_returnable_jar:
      product.isReturnableJar ??
      product.is_returnable_jar ??
      true,

    status: product.status || "active",

    metadata: product.metadata || {},
  };
}

/* -------------------------------------------------------
   STOCK CALCULATION
------------------------------------------------------- */

const STOCK_INCREASE_TYPES = new Set([
  "opening",
  "loaded",
  "returned",
]);

const STOCK_DECREASE_TYPES = new Set([
  "unloaded",
  "delivered",
  "damaged",
  "lost",
]);

function calculateStock(transactions = []) {
  return transactions.reduce((total, transaction) => {
    const quantity = Number(transaction.quantity) || 0;
    const movementType = transaction.movement_type;

    if (STOCK_INCREASE_TYPES.has(movementType)) {
      return total + quantity;
    }

    if (STOCK_DECREASE_TYPES.has(movementType)) {
      return total - quantity;
    }

    if (movementType === "adjustment") {
      // Adjustment quantity is treated as a signed stock difference.
      return total + quantity;
    }

    return total;
  }, 0);
}

/* -------------------------------------------------------
   PRODUCT MAPPER
------------------------------------------------------- */

function mapProduct(product, stockQuantity = 0) {
  return {
    id: product.id,
    businessId: product.business_id,

    name: product.name,
    sku: product.sku || "",
    category: product.category || "other",

    costPrice: Number(product.cost_price) || 0,
    sellingPrice: Number(product.sale_price) || 0,

    stockQuantity: Number(stockQuantity) || 0,

    unit: product.unit || "jar",
    description: product.description || "",

    jarSizeL: Number(product.jar_size_l) || 0,

    isReturnableJar: product.is_returnable_jar ?? true,

    status: product.status || "active",

    metadata: product.metadata || {},

    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

/* -------------------------------------------------------
   TRANSACTION MAPPER
------------------------------------------------------- */

function mapStockTransaction(transaction) {
  return {
    id: transaction.id,
    businessId: transaction.business_id,

    productId: transaction.product_id,
    customerId: transaction.customer_id || null,
    employeeId: transaction.employee_id || null,
    deliveryId: transaction.delivery_id || null,

    movementType: transaction.movement_type,

    quantity: Number(transaction.quantity) || 0,

    transactionDate: transaction.transaction_date,

    notes: transaction.notes || "",
    createdAt: transaction.created_at,
  };
}

/* -------------------------------------------------------
   STOCK TRANSACTION INSERT
------------------------------------------------------- */

async function insertStockTransaction({
  businessId,
  userId,
  productId,
  movementType,
  quantity,
  notes = "",
  transactionDate = getLocalDate(),
}) {
  const numericQuantity = Number(quantity);

  if (!Number.isFinite(numericQuantity) || numericQuantity === 0) {
    throw new Error("Stock transaction quantity must be non-zero.");
  }

  const payload = {
    business_id: businessId,
    product_id: productId,

    movement_type: movementType,
    quantity: numericQuantity,

    transaction_date: transactionDate,

    notes: notes || null,
    created_by: userId,
  };

  const { data, error } = await supabase
    .from("jar_transactions")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Stock transaction insert error:", error);
    throw error;
  }

  return mapStockTransaction(data);
}

/* -------------------------------------------------------
   STOCK FETCH
------------------------------------------------------- */

async function getTransactionsForProduct(businessId, productId) {
  const { data, error } = await supabase
    .from("jar_transactions")
    .select("*")
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

async function getStockMap(businessId, productIds) {
  if (!productIds.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("jar_transactions")
    .select("product_id, movement_type, quantity")
    .eq("business_id", businessId)
    .in("product_id", productIds);

  if (error) throw error;

  const grouped = new Map();

  for (const transaction of data || []) {
    const existing = grouped.get(transaction.product_id) || [];

    existing.push(transaction);

    grouped.set(transaction.product_id, existing);
  }

  const stockMap = new Map();

  for (const productId of productIds) {
    stockMap.set(
      productId,
      calculateStock(grouped.get(productId) || [])
    );
  }

  return stockMap;
}

/* -------------------------------------------------------
   PRODUCT SERVICE
------------------------------------------------------- */

const productService = {
  /* -----------------------------------------------
     GET ALL PRODUCTS WITH ACTUAL STOCK
  ------------------------------------------------ */

  async getAll() {
    const businessId = await getBusinessId();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const products = data || [];

    const stockMap = await getStockMap(
      businessId,
      products.map((product) => product.id)
    );

    return products.map((product) =>
      mapProduct(product, stockMap.get(product.id) || 0)
    );
  },

  /* -----------------------------------------------
     GET SINGLE PRODUCT
  ------------------------------------------------ */

  async getById(productId) {
    const businessId = await getBusinessId();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    const transactions = await getTransactionsForProduct(
      businessId,
      productId
    );

    return mapProduct(data, calculateStock(transactions));
  },

  /* -----------------------------------------------
     CREATE PRODUCT
     Optional initial stock = opening transaction
  ------------------------------------------------ */

  async create(product) {
    const { businessId, userId } = await getBusinessContext();

    const payload = {
      business_id: businessId,
      ...normalizeProductInput(product),
    };

    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    const initialStock = Number(product.stockQuantity ?? 0);

    if (!Number.isFinite(initialStock) || initialStock < 0) {
      throw new Error("Initial stock must be a valid non-negative number.");
    }

    if (initialStock > 0) {
      try {
        await insertStockTransaction({
          businessId,
          userId,
          productId: data.id,
          movementType: "opening",
          quantity: initialStock,
          notes: "Opening stock at product creation",
        });
      } catch (stockError) {
        throw new Error(
          `Product was created, but opening stock could not be saved. Product ID: ${data.id}. Error: ${stockError.message}`
        );
      }
    }

    return mapProduct(data, initialStock);
  },

  /* -----------------------------------------------
     UPDATE PRODUCT
     Optional stockAction:
       none
       add
       adjust
  ------------------------------------------------ */

  async update(productId, product) {
    const { businessId, userId } = await getBusinessContext();

    const payload = normalizeProductInput(product);

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", productId)
      .eq("business_id", businessId)
      .select()
      .single();

    if (error) throw error;

    const stockAction = product.stockAction || "none";
    const stockQuantity = Number(product.stockQuantity ?? 0);

    if (
      !Number.isFinite(stockQuantity) ||
      stockQuantity < 0
    ) {
      throw new Error("Stock quantity must be a valid non-negative number.");
    }

    if (stockAction === "add" && stockQuantity > 0) {
      await insertStockTransaction({
        businessId,
        userId,
        productId,
        movementType: "loaded",
        quantity: stockQuantity,
        notes: product.stockNotes || "Stock added from product form",
      });
    }

    if (stockAction === "adjust") {
      const currentTransactions = await getTransactionsForProduct(
        businessId,
        productId
      );

      const currentStock = calculateStock(currentTransactions);
      const difference = stockQuantity - currentStock;

      if (difference !== 0) {
        await insertStockTransaction({
          businessId,
          userId,
          productId,
          movementType: "adjustment",
          quantity: difference,
          notes:
            product.stockNotes ||
            `Physical stock adjustment. Previous: ${currentStock}, counted: ${stockQuantity}`,
        });
      }
    }

    const transactions = await getTransactionsForProduct(
      businessId,
      productId
    );

    return mapProduct(data, calculateStock(transactions));
  },

  /* -----------------------------------------------
     ADD STOCK
  ------------------------------------------------ */

  async addStock(productId, quantity, notes = "") {
    const { businessId, userId } = await getBusinessContext();

    const amount = Number(quantity);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Enter a stock quantity greater than zero.");
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (productError) throw productError;

    if (!product) {
      throw new Error("Product not found.");
    }

    await insertStockTransaction({
      businessId,
      userId,
      productId,
      movementType: "loaded",
      quantity: amount,
      notes: notes || "Stock added",
    });

    return this.getById(productId);
  },

  /* -----------------------------------------------
     ADJUST STOCK TO PHYSICAL COUNT
  ------------------------------------------------ */

  async adjustStock(productId, physicalStock, notes = "") {
    const { businessId, userId } = await getBusinessContext();

    const targetStock = Number(physicalStock);

    if (!Number.isFinite(targetStock) || targetStock < 0) {
      throw new Error("Enter a valid physical stock quantity.");
    }

    const transactions = await getTransactionsForProduct(
      businessId,
      productId
    );

    const currentStock = calculateStock(transactions);
    const difference = targetStock - currentStock;

    if (difference === 0) {
      return this.getById(productId);
    }

    await insertStockTransaction({
      businessId,
      userId,
      productId,
      movementType: "adjustment",
      quantity: difference,
      notes:
        notes ||
        `Physical stock count adjustment. Previous: ${currentStock}, counted: ${targetStock}`,
    });

    return this.getById(productId);
  },

  /* -----------------------------------------------
     GET STOCK TRANSACTION HISTORY
  ------------------------------------------------ */

  async getStockTransactions(productId) {
    const businessId = await getBusinessId();

    const transactions = await getTransactionsForProduct(
      businessId,
      productId
    );

    return transactions.map(mapStockTransaction);
  },

  /* -----------------------------------------------
     DELETE PRODUCT
  ------------------------------------------------ */

  async delete(productId) {
    const businessId = await getBusinessId();

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("business_id", businessId);

    if (error) {
      if (error.code === "23503") {
        throw new Error(
          "This product is linked to existing stock or delivery records. Deactivate it instead of deleting it."
        );
      }

      throw error;
    }

    return true;
  },
};

export default productService;