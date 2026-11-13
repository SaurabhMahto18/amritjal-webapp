
import { supabase } from "../../../lib/supabase/client";

const businessIdCache = new Map();

const BUSINESS_CACHE_TTL = 5 * 60 * 1000;

const normalizePhone = (phone) =>
  String(phone || "").replace(/\D/g, "").slice(-10);

const today = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

// ==========================================
// DATABASE MAPPING
// ==========================================

function fromDatabase(row) {
  if (!row) return null;

  return {
    id: row.id,
    businessId: row.business_id,
    code: row.code || row.customer_code || "",
    name: row.name || "",
    phone: row.phone || "",
    alternatePhone: row.alternate_phone || "",
    billingPhone: row.billing_phone || "",

    sameBillingPhone:
      !row.billing_phone ||
      row.billing_phone === row.phone,

    email: row.email || "",
    address: row.address || "",
    area: row.area || "",
    village: row.village || "",
    district: row.district || "",
    state: row.state || "",
    postalCode: row.postal_code || "",
    landmark: row.landmark || "",
    customerGroupId: row.group_id || "",

    jarRate: Number(row.jar_rate ?? 0),
    openingBalance: Number(row.opening_balance ?? 0),

    // Refundable security deposit
    securityDeposit: Number(row.security_deposit ?? 0),

    creditLimit: Number(row.credit_limit ?? 0),
    dueDays: Number(row.due_days ?? 0),
    shift: row.delivery_shift || "Morning",
    paymentReminder: row.payment_reminder || "Monthly",
    notes: row.notes || "",
    status: row.status || "active",
    archived: Boolean(row.archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ==========================================
// CUSTOMER VALIDATION
// ==========================================

function validateCustomer(
  input,
  customers,
  excludeId = null,
  allowMissingPhone = false
) {
  const name = String(input?.name || "").trim();

  if (!name) {
    throw new Error("Customer name is required.");
  }

  // Primary mobile number.
  // Bulk import may omit it; normal create/edit may not.
  const rawPhone = String(input?.phone ?? "").replace(/\D/g, "");

  if (!allowMissingPhone && !rawPhone) {
    throw new Error("Mobile number is required.");
  }

  if (rawPhone && rawPhone.length !== 10) {
    throw new Error(
      "Mobile number must contain exactly 10 digits."
    );
  }

  const phone = rawPhone || null;

  // Check duplicates only when a phone number is present.
  if (phone) {
    const duplicatePhone = customers.some(
      (customer) =>
        customer.id !== excludeId &&
        normalizePhone(customer.phone) === phone
    );

    if (duplicatePhone) {
      throw new Error(
        "This mobile number is already registered."
      );
    }
  }

  // Billing mobile number
  const sameBillingPhone = input?.sameBillingPhone !== false;

  const rawBillingPhone = sameBillingPhone
    ? phone || ""
    : String(input?.billingPhone ?? "").replace(/\D/g, "");

  if (!allowMissingPhone && !sameBillingPhone && !rawBillingPhone) {
    throw new Error("Billing mobile number is required.");
  }

  if (rawBillingPhone && rawBillingPhone.length !== 10) {
    throw new Error(
      "Billing mobile number must contain exactly 10 digits."
    );
  }

  // Email validation
  const email = String(input?.email || "").trim();

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error("Please enter a valid email address.");
  }

  // Customer group
  const customerGroupId = String(
    input?.customerGroupId || ""
  ).trim();

  if (!customerGroupId) {
    throw new Error("Please select a customer group.");
  }

  // Shift validation
  const allowedShifts = [
    "Morning",
    "Afternoon",
    "Evening",
    "Night",
  ];

  const shift = String(input?.shift || "Morning");

  if (!allowedShifts.includes(shift)) {
    throw new Error("Please select a valid delivery shift.");
  }

  // Payment reminder validation
  const allowedReminders = [
    "Daily",
    "Weekly",
    "Monthly",
  ];

  const paymentReminder = String(
    input?.paymentReminder || "Monthly"
  );

  if (!allowedReminders.includes(paymentReminder)) {
    throw new Error(
      "Please select a valid payment reminder."
    );
  }

  // Pricing and balance validation
  const jarRate = Number(input?.jarRate ?? 0);
  const openingBalance = Number(input?.openingBalance ?? 0);
  const securityDeposit = Number(input?.securityDeposit ?? 0);

  if (!Number.isFinite(jarRate) || jarRate < 0) {
    throw new Error(
      "Jar rate must be a valid non-negative number."
    );
  }

  if (!Number.isFinite(openingBalance)) {
    throw new Error(
      "Opening balance must be a valid number."
    );
  }

  // Security deposit validation
  if (
    !Number.isFinite(securityDeposit) ||
    securityDeposit < 0
  ) {
    throw new Error(
      "Security deposit must be a valid non-negative number."
    );
  }

  return {
    name,
    phone: phone || null,
    billing_phone: rawBillingPhone || null,
    email: email || null,
    group_id: customerGroupId,
    address: String(input?.address || "").trim() || null,
    area: String(input?.area || "").trim() || null,

    jar_rate: jarRate,
    opening_balance: openingBalance,

    // Separate from opening balance and customer dues
    security_deposit: securityDeposit,

    delivery_shift: shift,
    payment_reminder: paymentReminder,
    notes: String(input?.notes || "").trim() || null,
  };
}

// ==========================================
// PRODUCT ASSIGNMENT VALIDATION
// ==========================================

function validateProductAssignment(unitPrice, defaultQuantity) {
  const price = Number(unitPrice);
  const quantity = Number(defaultQuantity);

  if (!Number.isFinite(price) || price < 0) {
    throw new Error(
      "Product rate must be a valid non-negative number."
    );
  }

  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error(
      "Default quantity must be a valid non-negative number."
    );
  }

  return {
    unit_price: price,
    default_quantity: quantity,
  };
}

// ==========================================
// BUSINESS HELPERS
// ==========================================

async function getCurrentBusinessId() {
  const {
    data: sessionData,
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  const user = sessionData.session?.user;

  if (!user) {
    businessIdCache.clear();
    throw new Error("Please log in to manage customers.");
  }

  const cached = businessIdCache.get(user.id);

  if (
    cached &&
    Date.now() - cached.cachedAt < BUSINESS_CACHE_TTL
  ) {
    return cached.businessId;
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!business?.id) {
    throw new Error(
      "No business is linked to this account. Please configure your business before managing customers."
    );
  }

  businessIdCache.set(user.id, {
    businessId: business.id,
    cachedAt: Date.now(),
  });

  return business.id;
}

// ==========================================
// SUBSCRIPTION ERROR HANDLING
// ==========================================

function getSubscriptionErrorMessage(error) {
  const message = String(error?.message || "");

  if (message.toLowerCase().includes("customer limit reached")) {
    return "Customer limit reached. Your current plan does not allow more active customers. Please upgrade your plan or contact support.";
  }

  if (
    message.toLowerCase().includes(
      "subscription has expired or is inactive"
    )
  ) {
    return "Your subscription is expired or inactive. Please renew your subscription or contact support.";
  }

  if (message.toLowerCase().includes("no subscription found")) {
    return "No active subscription was found for your business. Please contact support.";
  }

  if (
    message.toLowerCase().includes(
      "no customer limit is configured"
    )
  ) {
    return "Your plan's customer limit is not configured. Please contact support.";
  }

  return message || "Unable to complete customer operation.";
}

function throwCustomerServiceError(error) {
  const message = getSubscriptionErrorMessage(error);
  const normalizedError = new Error(message);

  normalizedError.code = error?.code;
  normalizedError.details = error?.details;
  normalizedError.hint = error?.hint;

  throw normalizedError;
}

function isSubscriptionBlockingError(error) {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("customer limit reached") ||
    message.includes("subscription has expired or is inactive") ||
    message.includes("no subscription found") ||
    message.includes("no customer limit is configured")
  );
}

// ==========================================
// SUBSCRIPTION ACCESS VALIDATION
// ==========================================

function isSubscriptionAccessValid(subscription) {
  if (!subscription) return false;

  const now = Date.now();

  const startsAt = subscription.starts_at
    ? new Date(subscription.starts_at).getTime()
    : NaN;

  const endsAt = subscription.ends_at
    ? new Date(subscription.ends_at).getTime()
    : null;

  const trialEndsAt = subscription.trial_ends_at
    ? new Date(subscription.trial_ends_at).getTime()
    : null;

  if (!Number.isFinite(startsAt) || startsAt > now) {
    return false;
  }

  if (subscription.status === "active") {
    return endsAt === null || endsAt > now;
  }

  if (subscription.status === "cancelled") {
    return endsAt !== null && endsAt > now;
  }

  if (subscription.status === "trialing") {
    const trialValid =
      trialEndsAt !== null
        ? trialEndsAt > now
        : endsAt !== null && endsAt > now;

    return trialValid && (endsAt === null || endsAt > now);
  }

  return false;
}


// ==========================================
// CUSTOMER GROUP VALIDATION
// ==========================================

async function validateCustomerGroup(businessId, groupId) {
  if (!groupId) {
    throw new Error("Customer group is required.");
  }

  const { data, error } = await supabase
    .from("customer_groups")
    .select("id")
    .eq("id", groupId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error(
      "Selected customer group does not belong to this business."
    );
  }

  return data.id;
}

// ==========================================
// CUSTOMER DATA HELPERS
// ==========================================

async function getAllRows(includeArchived = false) {
  const businessId = await getCurrentBusinessId();

  let query = supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId);

  if (!includeArchived) {
    query = query.eq("archived", false);
  }

  const { data, error } = await query.order("name", {
    ascending: true,
  });

  if (error) throw error;

  const customerRows = data || [];

  // Fetch actual customer group names
  const groupIds = [
    ...new Set(
      customerRows
        .map((customer) => customer.group_id)
        .filter(Boolean)
    ),
  ];

  let groupMap = new Map();

  if (groupIds.length > 0) {
    const { data: groups, error: groupError } = await supabase
      .from("customer_groups")
      .select("id, name")
      .eq("business_id", businessId)
      .in("id", groupIds);

    if (groupError) throw groupError;

    groupMap = new Map(
      (groups || []).map((group) => [
        group.id,
        group.name,
      ])
    );
  }

  return customerRows.map((row) => ({
    ...fromDatabase(row),
    groupId: row.group_id || "",
    groupName: groupMap.get(row.group_id) || "General",
  }));
}

// ==========================================
// CUSTOMER UPDATE EVENTS
// ==========================================

function notifyCustomersUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("amrit-jal-customers-updated")
    );
  }
}

function notifyProductAssignmentsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("amrit-jal-product-assignments-updated")
    );
  }
}

// ==========================================
// CUSTOMER SERVICE
// ==========================================

export const customerService = {
  // ==========================================
  // SUBSCRIPTION USAGE
  // ==========================================

  async getSubscriptionUsage() {
    const businessId = await getCurrentBusinessId();

    const { data, error } = await supabase
      .from("business_subscriptions")
      .select(`
        id,
        status,
        active_customer_count,
        custom_customer_limit,
        full_access_override,
        access_expires_at,
        is_complimentary,
        starts_at,
        ends_at,
        trial_ends_at,
        subscription_plans (
          name,
          max_customers
        )
      `)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return {
        exists: false,
        accessValid: false,
        activeCount: 0,
        limit: null,
        remaining: null,
        unlimited: false,
        status: "missing",
        planName: "No subscription",
        isComplimentary: false,
        overrideActive: false,
      };
    }

    const accessValid = isSubscriptionAccessValid(data);

    const overrideActive =
      Boolean(data.full_access_override) &&
      (
        !data.access_expires_at ||
        new Date(data.access_expires_at).getTime() > Date.now()
      );

    const plan = data.subscription_plans;

    const effectiveLimit =
      data.custom_customer_limit ??
      plan?.max_customers ??
      null;

    // Override bypasses customer limit only.
    // It does not bypass subscription validity.
    const unlimited = overrideActive && accessValid;

    const activeCount = Number(
      data.active_customer_count || 0
    );

    return {
      exists: true,
      accessValid,
      activeCount,
      limit: effectiveLimit,
      remaining: unlimited
        ? null
        : effectiveLimit === null
          ? null
          : Math.max(effectiveLimit - activeCount, 0),
      unlimited,
      status: data.status,
      planName: plan?.name || "Current plan",
      isComplimentary: Boolean(data.is_complimentary),
      overrideActive,
    };
  },

  // ==========================================
  // GET ALL CUSTOMERS
  // ==========================================

  async getAll({ includeArchived = false } = {}) {
    return getAllRows(includeArchived);
  },

  // ==========================================
  // GET CUSTOMER BY ID
  // ==========================================

  async getById(id) {
    if (!id) {
      throw new Error("Customer ID is required.");
    }

    const businessId = await getCurrentBusinessId();

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) throw error;

    return fromDatabase(data);
  },

  // ==========================================
  // BULK CUSTOMER IMPORT - SUBSCRIPTION AWARE
  // ==========================================

  async importCustomers(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("No customer rows found to import.");
    }

    const businessId = await getCurrentBusinessId();

    // Fetch existing customers once.
    // Archived customers are included for duplicate detection.
    const existingCustomers = await getAllRows(true);

    // Fetch this business's groups once.
    const { data: groups, error: groupError } = await supabase
      .from("customer_groups")
      .select("id, name")
      .eq("business_id", businessId);

    if (groupError) throw groupError;

    const groupById = new Map(
      (groups || []).map((group) => [
        String(group.id),
        group.id,
      ])
    );

    // Keep multiple IDs to detect ambiguous group names.
    const groupByName = new Map();

    for (const group of groups || []) {
      const key = String(group.name || "")
        .trim()
        .toLowerCase();

      if (!key) continue;

      const matches = groupByName.get(key) || [];
      matches.push(group.id);
      groupByName.set(key, matches);
    }

    // Includes existing and successfully imported customers.
    const knownCustomers = [...existingCustomers];

    const summary = {
      inserted: 0,
      skipped: 0,
      invalid: 0,
      blocked: false,
      blockReason: "",
      skippedRows: [],
      invalidRows: [],
    };

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index] || {};

      const rowNumber = Number(
        row._rowNumber || index + 1
      );

      const name = String(row.name || "").trim();

      try {
        // Resolve group UUID or existing group name.
        const groupValue = String(
          row.customerGroupId ||
          row.customerGroup ||
          row.groupName ||
          row.group ||
          ""
        ).trim();

        let groupId = groupById.get(groupValue);

        if (!groupId && groupValue) {
          const matches =
            groupByName.get(groupValue.toLowerCase()) || [];

          if (matches.length > 1) {
            throw new Error(
              `Multiple customer groups named "${groupValue}" exist. Use the group ID instead.`
            );
          }

          groupId = matches[0];
        }

        if (!groupId) {
          throw new Error(
            groupValue
              ? `Customer group "${groupValue}" was not found.`
              : "Customer group is required."
          );
        }

        // Normalize phone numbers.
        const rawPhone = String(row.phone ?? "")
          .replace(/\D/g, "");

        const rawBillingPhone = String(
          row.billingPhone ?? ""
        ).replace(/\D/g, "");

        const sameBillingPhone =
          !rawBillingPhone ||
          rawBillingPhone === rawPhone;

        const input = {
          ...row,
          name,
          phone: rawPhone,
          customerGroupId: groupId,
          sameBillingPhone,
          billingPhone: rawBillingPhone || rawPhone,
          jarRate: row.jarRate ?? 0,
          openingBalance: row.openingBalance ?? 0,
          securityDeposit: row.securityDeposit ?? 0,
          shift: row.shift || "Morning",
          paymentReminder: row.paymentReminder || "Monthly",
        };

        // Bulk import explicitly allows missing phone numbers.
        const customerData = validateCustomer(
          input,
          knownCustomers,
          null,
          true
        );

        // Insert one customer at a time.
        // Database trigger remains the final subscription authority.
        const { data: created, error } = await supabase
          .from("customers")
          .insert({
            business_id: businessId,
            code: `AJ-${crypto.randomUUID()
              .slice(0, 8)
              .toUpperCase()}`,
            ...customerData,
            status: "active",
            archived: false,
          })
          .select("*")
          .single();

        if (error) throw error;

        // Add successfully inserted customer to duplicate-check list.
        knownCustomers.push(fromDatabase(created));

        summary.inserted += 1;
      } catch (error) {
        const reason =
          error?.message || "Unable to import this row.";

        const rowInfo = {
          rowNumber,
          name,
          reason,
        };

        // Subscription restriction:
        // stop processing immediately.
        if (isSubscriptionBlockingError(error)) {
          summary.blocked = true;
          summary.blockReason =
            getSubscriptionErrorMessage(error);

          summary.invalid += 1;
          summary.invalidRows.push({
            ...rowInfo,
            reason: summary.blockReason,
          });

          break;
        }

        // Duplicate customer: skip and continue.
        const isDuplicate =
          reason.toLowerCase().includes("already registered") ||
          error?.code === "23505";

        if (isDuplicate) {
          summary.skipped += 1;
          summary.skippedRows.push(rowInfo);
        } else {
          summary.invalid += 1;
          summary.invalidRows.push(rowInfo);
        }
      }
    }

    // Notify customer list once after all rows are processed.
    if (summary.inserted > 0) {
      notifyCustomersUpdated();
    }

    return summary;
  },


// ==========================================
// CREATE CUSTOMER
// ==========================================

  async create(input) {
    const businessId = await getCurrentBusinessId();

    const customers = await getAllRows(true);

    // Normal create still requires a mobile number.
    const data = validateCustomer(input, customers);

    await validateCustomerGroup(
      businessId,
      data.group_id
    );

    const { data: created, error } = await supabase
      .from("customers")
      .insert({
        business_id: businessId,
        code: `AJ-${crypto.randomUUID()
          .slice(0, 8)
          .toUpperCase()}`,
        ...data,
        status: "active",
        archived: false,
      })
      .select("*")
      .single();

    if (error) throwCustomerServiceError(error);

    notifyCustomersUpdated();

    return fromDatabase(created);
  },

  // ==========================================
  // UPDATE CUSTOMER
  // ==========================================

  async update(id, input) {
    if (!id) {
      throw new Error("Customer ID is required.");
    }

    const businessId = await getCurrentBusinessId();

    const customers = await getAllRows(true);

    const existing = customers.find(
      (customer) => customer.id === id
    );

    if (!existing) {
      throw new Error("Customer not found.");
    }

    // Normal update still requires a mobile number.
    const data = validateCustomer(
      input,
      customers,
      id
    );

    await validateCustomerGroup(
      businessId,
      data.group_id
    );

    const { data: updated, error } = await supabase
      .from("customers")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("business_id", businessId)
      .select("*")
      .single();

    if (error) throwCustomerServiceError(error);

    notifyCustomersUpdated();

    return fromDatabase(updated);
  },

  // ==========================================
  // ARCHIVE CUSTOMER
  // ==========================================

  async archive(id) {
    const businessId = await getCurrentBusinessId();

    const { data, error } = await supabase
      .from("customers")
      .update({
        archived: true,
        status: "inactive",
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("business_id", businessId)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error("Customer not found.");
    }

    notifyCustomersUpdated();
  },

  // ==========================================
  // RESTORE CUSTOMER
  // ==========================================

  async restore(id) {
    const businessId = await getCurrentBusinessId();

    const { data, error } = await supabase
      .from("customers")
      .update({
        archived: false,
        status: "active",
        archived_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("business_id", businessId)
      .select("id")
      .maybeSingle();

    if (error) throwCustomerServiceError(error);

    if (!data) {
      throw new Error("Customer not found.");
    }

    notifyCustomersUpdated();
  },

  // ==========================================
  // DELETE CUSTOMER
  // ==========================================

  async delete(id) {
    const businessId = await getCurrentBusinessId();

    const { data, error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "Customer not found or could not be deleted."
      );
    }

    notifyCustomersUpdated();
  },

  // ==========================================
  // AVAILABLE PRODUCTS
  // ==========================================

  async getAvailableProducts() {
    const businessId = await getCurrentBusinessId();

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        sku,
        unit,
        sale_price,
        is_returnable_jar,
        status
      `)
      .eq("business_id", businessId)
      .eq("status", "active")
      .order("name");

    if (error) throw error;

    return (data || []).map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku || "",
      unit: product.unit || "",
      salePrice: Number(product.sale_price || 0),
      isReturnableJar: Boolean(
        product.is_returnable_jar
      ),
      status: product.status,
    }));
  },

  // ==========================================
  // GET ASSIGNED PRODUCTS
  // ==========================================

  async getAssignedProducts(customerId) {
    if (!customerId) {
      throw new Error("Customer ID is required.");
    }

    const businessId = await getCurrentBusinessId();

    const { data: plans, error: planError } =
      await supabase
        .from("customer_rate_plans")
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
        .eq("customer_id", customerId)
        .is("effective_to", null)
        .order("effective_from", {
          ascending: false,
        });

    if (planError) throw planError;

    if (!plans?.length) return [];

    const productIds = [
      ...new Set(plans.map((plan) => plan.product_id)),
    ];

    const { data: products, error: productError } =
      await supabase
        .from("products")
        .select(`
          id,
          name,
          sku,
          unit,
          sale_price,
          is_returnable_jar,
          status
        `)
        .eq("business_id", businessId)
        .in("id", productIds);

    if (productError) throw productError;

    const productMap = new Map(
      (products || []).map((product) => [
        product.id,
        product,
      ])
    );

    return plans.map((plan) => {
      const product = productMap.get(plan.product_id);

      return {
        id: plan.id,
        customerId: plan.customer_id,
        productId: plan.product_id,
        productName: product?.name || "Unknown Product",
        sku: product?.sku || "",
        unit: product?.unit || "",
        salePrice: Number(product?.sale_price || 0),
        unitPrice: Number(plan.unit_price || 0),
        defaultQuantity: Number(
          plan.default_quantity || 0
        ),
        isReturnableJar: Boolean(
          product?.is_returnable_jar
        ),
        productStatus: product?.status || "unknown",
        effectiveFrom: plan.effective_from,
        effectiveTo: plan.effective_to,
      };
    });
  },

  // ==========================================
  // ASSIGN PRODUCT
  // ==========================================

  async assignProduct(
    customerId,
    productId,
    unitPrice,
    defaultQuantity = 1
  ) {
    if (!customerId || !productId) {
      throw new Error("Customer and product are required.");
    }

    const businessId = await getCurrentBusinessId();

    const values = validateProductAssignment(
      unitPrice,
      defaultQuantity
    );

    // Verify customer
    const { data: customer, error: customerError } =
      await supabase
        .from("customers")
        .select("id, archived")
        .eq("id", customerId)
        .eq("business_id", businessId)
        .maybeSingle();

    if (customerError) throw customerError;

    if (!customer || customer.archived) {
      throw new Error(
        "Customer not found or is archived."
      );
    }

    // Verify product
    const { data: product, error: productError } =
      await supabase
        .from("products")
        .select("id, status")
        .eq("id", productId)
        .eq("business_id", businessId)
        .maybeSingle();

    if (productError) throw productError;

    if (!product || product.status !== "active") {
      throw new Error(
        "Selected product is unavailable or inactive."
      );
    }

    // Find existing active assignment
    const { data: existing, error: existingError } =
      await supabase
        .from("customer_rate_plans")
        .select("id")
        .eq("business_id", businessId)
        .eq("customer_id", customerId)
        .eq("product_id", productId)
        .is("effective_to", null)
        .maybeSingle();

    if (existingError) throw existingError;

    let result;

    if (existing?.id) {
      const { data, error } = await supabase
        .from("customer_rate_plans")
        .update({
          ...values,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .eq("business_id", businessId)
        .select("*")
        .single();

      if (error) throw error;

      result = data;
    } else {
      const { data, error } = await supabase
        .from("customer_rate_plans")
        .insert({
          business_id: businessId,
          customer_id: customerId,
          product_id: productId,
          ...values,
          effective_from: today(),
          effective_to: null,
        })
        .select("*")
        .single();

      if (error) throw error;

      result = data;
    }

    notifyProductAssignmentsUpdated();

    return result;
  },

  // ==========================================
  // UPDATE PRODUCT ASSIGNMENT
  // ==========================================

  async updateProductAssignment(
    assignmentId,
    unitPrice,
    defaultQuantity
  ) {
    if (!assignmentId) {
      throw new Error(
        "Product assignment ID is required."
      );
    }

    const businessId = await getCurrentBusinessId();

    const values = validateProductAssignment(
      unitPrice,
      defaultQuantity
    );

    const { data, error } = await supabase
      .from("customer_rate_plans")
      .update({
        ...values,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)
      .eq("business_id", businessId)
      .is("effective_to", null)
      .select("*")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "Active product assignment not found."
      );
    }

    notifyProductAssignmentsUpdated();

    return data;
  },

  // ==========================================
  // DEACTIVATE PRODUCT ASSIGNMENT
  // ==========================================

  async deactivateProductAssignment(assignmentId) {
    if (!assignmentId) {
      throw new Error(
        "Product assignment ID is required."
      );
    }

    const businessId = await getCurrentBusinessId();

    const { data, error } = await supabase
      .from("customer_rate_plans")
      .update({
        effective_to: today(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)
      .eq("business_id", businessId)
      .is("effective_to", null)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "Active product assignment not found."
      );
    }

    notifyProductAssignmentsUpdated();
  },
};

export default customerService;
