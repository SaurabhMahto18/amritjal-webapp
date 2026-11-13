
import { supabase } from "../../../lib/supabase/client";

const TABLES = {
  businesses: "businesses",
  groups: "customer_groups",
  memberships: "customer_group_members",
  customers: "customers",
  deliveries: "deliveries",
  payments: "payments",
  jars: "jar_transactions",
};

async function getBusinessId() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("Please log in to manage groups.");

  const { data, error } = await supabase
    .from(TABLES.businesses)
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Business profile not found.");

  return data.id;
}

function money(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function buildCustomerBalances(customers, deliveries, payments) {
  const balances = {};

  customers.forEach((customer) => {
    balances[customer.id] = money(customer.opening_balance);
  });

  deliveries.forEach((delivery) => {
    balances[delivery.customer_id] =
      (balances[delivery.customer_id] || 0) +
      money(delivery.amount);
  });

  payments.forEach((payment) => {
    balances[payment.customer_id] =
      (balances[payment.customer_id] || 0) -
      money(payment.amount);
  });

  return balances;
}

function buildJarBalances(customers, transactions) {
  const balances = {};

  customers.forEach((customer) => {
    balances[customer.id] = 0;
  });

  transactions.forEach((transaction) => {
    const customerId = transaction.customer_id;
    if (!customerId) return;

    if (balances[customerId] === undefined) {
      balances[customerId] = 0;
    }

    const quantity = money(transaction.quantity);

    if (transaction.movement_type === "delivered") {
      balances[customerId] += quantity;
    }

    if (transaction.movement_type === "returned") {
      balances[customerId] -= quantity;
    }
  });

  return balances;
}

function calculateGroup(
  group,
  memberships,
  customers,
  balances,
  jars
) {
  const membershipIds = new Set(
    memberships
      .filter((membership) => membership.group_id === group.id)
      .map((membership) => membership.customer_id)
  );

  const groupCustomers = customers.filter(
    (customer) =>
      customer.group_id === group.id ||
      membershipIds.has(customer.id)
  );

  let balanceJar = 0;
  let totalDue = 0;
  let advance = 0;

  groupCustomers.forEach((customer) => {
    balanceJar += money(jars[customer.id]);

    const balance = money(balances[customer.id]);

    if (balance > 0) {
      totalDue += balance;
    } else if (balance < 0) {
      advance += balance;
    }
  });

  return {
    id: group.id,
    name: group.name,
    customerCount: groupCustomers.length,
    balanceJar,
    pastDue: null,
    currentDue: null,
    totalDue,
    advance,

    customers: groupCustomers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || "",
      area: customer.area || "",
      jarBalance: money(jars[customer.id]),
      balance: money(balances[customer.id]),
      due: Math.max(money(balances[customer.id]), 0),
      advance: Math.min(money(balances[customer.id]), 0),
    })),
  };
}

const groupService = {
  async getAll() {
    const businessId = await getBusinessId();

    const [
      groupsResult,
      membershipsResult,
      customersResult,
      deliveriesResult,
      paymentsResult,
      jarsResult,
    ] = await Promise.all([
      supabase
        .from(TABLES.groups)
        .select("id, name")
        .eq("business_id", businessId)
        .order("name"),

      supabase
        .from(TABLES.memberships)
        .select("customer_id, group_id")
        .eq("business_id", businessId),

      supabase
        .from(TABLES.customers)
        .select("id, name, phone, area, group_id, opening_balance, archived, status")
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

      supabase
        .from(TABLES.jars)
        .select("customer_id, movement_type, quantity")
        .eq("business_id", businessId)
        .not("customer_id", "is", null)
        .in("movement_type", ["delivered", "returned"]),
    ]);

    const results = [
      groupsResult,
      membershipsResult,
      customersResult,
      deliveriesResult,
      paymentsResult,
      jarsResult,
    ];

    const failed = results.find((result) => result.error);
    if (failed) throw failed.error;

    const groups = groupsResult.data || [];
    const memberships = membershipsResult.data || [];

    const customers = (customersResult.data || []).filter(
      (customer) => customer.status !== "inactive"
    );

    const balances = buildCustomerBalances(
      customers,
      deliveriesResult.data || [],
      paymentsResult.data || []
    );

    const jars = buildJarBalances(
      customers,
      jarsResult.data || []
    );

    return groups.map((group) =>
      calculateGroup(group, memberships, customers, balances, jars)
    );
  },

  async getById(id) {
    if (!id) throw new Error("Group ID is required.");

    const businessId = await getBusinessId();

    const { data: group, error } = await supabase
      .from(TABLES.groups)
      .select("id, name")
      .eq("id", id)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) throw error;
    if (!group) throw new Error("Group not found.");

    const allGroups = await this.getAll();

    return (
      allGroups.find((item) => item.id === id) || {
        id: group.id,
        name: group.name,
        customerCount: 0,
        balanceJar: 0,
        totalDue: 0,
        advance: 0,
        customers: [],
      }
    );
  },

  async create(input) {
    const businessId = await getBusinessId();
    const name = String(input.name || "").trim();

    if (!name) throw new Error("Group name is required.");
    if (name.length > 100) {
      throw new Error("Group name cannot exceed 100 characters.");
    }

    const { data: existing, error: checkError } = await supabase
      .from(TABLES.groups)
      .select("id")
      .eq("business_id", businessId)
      .ilike("name", name);

    if (checkError) throw checkError;

    if (existing?.length) {
      throw new Error("A group with this name already exists.");
    }

    const { data, error } = await supabase
      .from(TABLES.groups)
      .insert({
        business_id: businessId,
        name,
      })
      .select("id, name")
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, input) {
    const businessId = await getBusinessId();
    const name = String(input.name || "").trim();

    if (!id) throw new Error("Group ID is required.");
    if (!name) throw new Error("Group name is required.");
    if (name.length > 100) {
      throw new Error("Group name cannot exceed 100 characters.");
    }

    const { data: existing, error: checkError } = await supabase
      .from(TABLES.groups)
      .select("id")
      .eq("business_id", businessId)
      .ilike("name", name)
      .neq("id", id);

    if (checkError) throw checkError;

    if (existing?.length) {
      throw new Error("Another group already uses this name.");
    }

    const { data, error } = await supabase
      .from(TABLES.groups)
      .update({ name })
      .eq("id", id)
      .eq("business_id", businessId)
      .select("id, name")
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const businessId = await getBusinessId();

    if (!id) throw new Error("Group ID is required.");

    // Remove memberships before deleting the group.
    const { error: membershipError } = await supabase
      .from(TABLES.memberships)
      .delete()
      .eq("business_id", businessId)
      .eq("group_id", id);

    if (membershipError) throw membershipError;

    const { data, error } = await supabase
      .from(TABLES.groups)
      .delete()
      .eq("id", id)
      .eq("business_id", businessId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Group could not be deleted.");

    return true;
  },

  async getAvailableCustomers(groupId) {
    const businessId = await getBusinessId();

    const [customersResult, membershipsResult] = await Promise.all([
      supabase
        .from(TABLES.customers)
        .select("id, name, phone, area")
        .eq("business_id", businessId)
        .eq("archived", false)
        .order("name"),

      supabase
        .from(TABLES.memberships)
        .select("customer_id")
        .eq("business_id", businessId),
    ]);

    if (customersResult.error) throw customersResult.error;
    if (membershipsResult.error) throw membershipsResult.error;

    const assignedIds = new Set(
      (membershipsResult.data || []).map((row) => row.customer_id)
    );

    return (customersResult.data || []).filter(
      (customer) =>
        !assignedIds.has(customer.id) &&
        !customer.group_id
    );
  },

  async addCustomer(groupId, customerId) {
    const businessId = await getBusinessId();

    if (!groupId || !customerId) {
      throw new Error("Group and customer are required.");
    }

    const { data: group, error: groupError } = await supabase
      .from(TABLES.groups)
      .select("id")
      .eq("id", groupId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (groupError) throw groupError;
    if (!group) throw new Error("Group not found.");

    const { data: customer, error: customerError } = await supabase
      .from(TABLES.customers)
      .select("id")
      .eq("id", customerId)
      .eq("business_id", businessId)
      .eq("archived", false)
      .maybeSingle();

    if (customerError) throw customerError;
    if (!customer) throw new Error("Customer not found.");

    const { data: existing, error: existingError } = await supabase
      .from(TABLES.memberships)
      .select("customer_id")
      .eq("business_id", businessId)
      .eq("customer_id", customerId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) throw new Error("Customer is already assigned to a group.");

    const { error } = await supabase
      .from(TABLES.memberships)
      .insert({
        business_id: businessId,
        group_id: groupId,
        customer_id: customerId,
      });

    const { error: customerUpdateError } = await supabase
      .from(TABLES.customers)
      .update({
        group_id: groupId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId)
      .eq("business_id", businessId);

    if (customerUpdateError) {
      throw customerUpdateError;
    }

    if (error) throw error;
    return true;
  },



  async removeCustomer(groupId, customerId) {
    const businessId = await getBusinessId();

    const { data, error } = await supabase
      .from(TABLES.memberships)
      .delete()
      .eq("business_id", businessId)
      .eq("group_id", groupId)
      .eq("customer_id", customerId)
      .select("customer_id")
      .maybeSingle();

    const { error: customerUpdateError } = await supabase
      .from(TABLES.customers)
      .update({
        group_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId)
      .eq("business_id", businessId)
      .eq("group_id", groupId);

    if (customerUpdateError) {
      throw customerUpdateError;
    }

    if (error) throw error;
    if (!data) throw new Error("Customer membership was not found.");

    return true;
  },
};

export default groupService;
