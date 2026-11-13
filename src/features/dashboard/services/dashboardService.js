
import { supabase } from "../../../lib/supabase/client.js";

/* =========================================
   DATABASE COLUMNS
========================================= */

const CUSTOMER_COLUMNS = `
  id, business_id, name, phone,
  opening_balance, status, archived
`;

const DELIVERY_COLUMNS = `
  id, customer_id, delivery_date,
  jar_quantity, amount, notes, created_at
`;

const PAYMENT_COLUMNS = `
  id, customer_id, payment_date,
  amount, method, created_at
`;

const PRODUCT_COLUMNS = `
  id, name, sku, description, unit, jar_size_l,
  sale_price, cost_price, is_returnable_jar, status
`;

const EXPENSE_COLUMNS = `
  id, description, category, amount, expense_date,
  payment_method, notes, created_at
`;

const INVOICE_COLUMNS = `
  id, customer_id, invoice_number, invoice_date, period_start,
  period_end, due_date, subtotal, discount_amount, tax_amount,
  total_amount, amount_paid, status
`;

const numberValue = (value) => {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
};

const roundMoney = (value) =>
  Number(numberValue(value).toFixed(2));

const getBusinessDate = (timeZone = "Asia/Kolkata") => {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const values = Object.fromEntries(
      parts.map(({ type, value }) => [type, value])
    );

    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    const now = new Date();

    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  }
};

const throwQueryError = (section, error) => {
  if (!error) return;

  throw new Error(
    `Dashboard ${section}: ${error.message || "Unknown database error"}`
  );
};

/* =========================================
   FINANCE TREND
========================================= */

function getMonthKey(date) {
  if (!date || typeof date !== "string") return null;

  const match = date.slice(0, 7).match(/^(\d{4})-(\d{2})$/);

  if (!match) return null;

  const month = Number(match[2]);

  if (month < 1 || month > 12) return null;

  return `${match[1]}-${match[2]}`;
}

function getYearKey(date) {
  if (!date || typeof date !== "string") return null;

  const match = date.slice(0, 4).match(/^\d{4}$/);

  return match ? match[0] : null;
}

function getLastMonths(count = 12) {
  const now = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - count + index + 1,
      1
    );

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return {
      key: `${year}-${month}`,
      label: new Intl.DateTimeFormat("en-IN", {
        month: "short",
        year: "2-digit",
      }).format(date),
    };
  });
}

function getLastYears(count = 5) {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: count }, (_, index) => {
    const year = currentYear - count + index + 1;

    return {
      key: String(year),
      label: String(year),
    };
  });
}

function buildFinanceTrend(deliveries, payments, expenses) {
  const createBuckets = (periods) =>
    new Map(
      periods.map((period) => [
        period.key,
        {
          key: period.key,
          label: period.label,
          earning: 0,
          payment: 0,
          expense: 0,
          netCollection: 0,
        },
      ])
    );

  const monthly = createBuckets(getLastMonths(12));
  const yearly = createBuckets(getLastYears(5));

  const addValue = (date, field, amount) => {
    const monthKey = getMonthKey(date);
    const yearKey = getYearKey(date);
    const value = numberValue(amount);

    if (monthKey && monthly.has(monthKey)) {
      monthly.get(monthKey)[field] += value;
    }

    if (yearKey && yearly.has(yearKey)) {
      yearly.get(yearKey)[field] += value;
    }
  };

  deliveries.forEach((item) => {
    addValue(item.delivery_date, "earning", item.amount);
  });

  payments.forEach((item) => {
    addValue(item.payment_date, "payment", item.amount);
  });

  expenses.forEach((item) => {
    addValue(item.expense_date, "expense", item.amount);
  });

  const finalize = (buckets) =>
    Array.from(buckets.values()).map((item) => ({
      ...item,
      netCollection: item.payment - item.expense,
    }));

  return {
    monthly: finalize(monthly),
    yearly: finalize(yearly),
  };
}

/* =========================================
   EXPENSE CATEGORY SUMMARY
========================================= */

function buildExpenseCategorySummary(expenses) {
  const categories = new Map();

  expenses.forEach((expense) => {
    const category =
      expense.category?.trim() || "Uncategorized";

    const current = categories.get(category) || {
      category,
      totalAmount: 0,
      transactionCount: 0,
    };

    current.totalAmount += numberValue(expense.amount);
    current.transactionCount += 1;

    categories.set(category, current);
  });

  return Array.from(categories.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .map((item) => ({
      ...item,
      totalAmount: roundMoney(item.totalAmount),
    }));
}

/* =========================================
   TOP SELLING PRODUCTS
========================================= */

function buildTopSellingProducts(deliveryItems, products) {
  const productMap = new Map(
    products.map((product) => [product.id, product])
  );

  const sales = new Map();

  deliveryItems.forEach((item) => {
    const product = productMap.get(item.product_id);

    if (!product) return;

    const delivered = numberValue(item.quantity_delivered);
    const returned = numberValue(item.quantity_returned);
    const netQuantity = Math.max(0, delivered - returned);
    const unitPrice = numberValue(item.unit_price);

    const current = sales.get(item.product_id) || {
      productId: item.product_id,
      productName: product.name,
      sku: product.sku || "",
      unit: product.unit || "",
      quantityDelivered: 0,
      quantityReturned: 0,
      netQuantity: 0,
      grossSales: 0,
      returnedValue: 0,
      netSales: 0,
      deliveryCount: 0,
    };

    current.quantityDelivered += delivered;
    current.quantityReturned += returned;
    current.netQuantity += netQuantity;
    current.grossSales += numberValue(item.line_total);
    current.returnedValue += returned * unitPrice;
    current.netSales += netQuantity * unitPrice;
    current.deliveryCount += 1;

    sales.set(item.product_id, current);
  });

  return Array.from(sales.values())
    .sort((a, b) => b.netSales - a.netSales)
    .slice(0, 10)
    .map((item) => ({
      ...item,
      quantityDelivered: Number(item.quantityDelivered.toFixed(3)),
      quantityReturned: Number(item.quantityReturned.toFixed(3)),
      netQuantity: Number(item.netQuantity.toFixed(3)),
      grossSales: roundMoney(item.grossSales),
      returnedValue: roundMoney(item.returnedValue),
      netSales: roundMoney(item.netSales),
    }));
}

/* =========================================
   EVENTS
   Source: business_events
========================================= */

function getEventDate(event) {
  const candidates = [
    event.event_date,
    event.start_date,
    event.starts_at,
    event.event_at,
    event.date,
  ];

  return candidates.find(Boolean) || null;
}

function getEventTitle(event) {
  return (
    event.title ||
    event.name ||
    event.event_name ||
    event.event_title ||
    "Business event"
  );
}

function getEventStartTime(event) {
  return (
    event.start_time ||
    event.starts_at ||
    event.event_time ||
    null
  );
}

function getEventEndTime(event) {
  return (
    event.end_time ||
    event.ends_at ||
    null
  );
}

function buildTodayEvents(events, today) {
  return events
    .filter((event) => {
      const date = getEventDate(event);

      return date && String(date).slice(0, 10) === today;
    })
    .map((event) => ({
      id: event.id,
      title: getEventTitle(event),
      date: getEventDate(event),
      startTime: getEventStartTime(event),
      endTime: getEventEndTime(event),
      location: event.location || event.venue || "",
      description:
        event.description || event.notes || "",
      status: event.status || "",
      eventType: event.event_type || event.type || "",
    }))
    .sort((a, b) => {
      const timeA = a.startTime
        ? new Date(a.startTime).getTime()
        : 0;

      const timeB = b.startTime
        ? new Date(b.startTime).getTime()
        : 0;

      return timeA - timeB;
    });
}

/* =========================================
   BUSINESS HELPERS
========================================= */

async function getCurrentBusiness() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(`Authentication failed: ${authError.message}`);
  }

  if (!user) {
    throw new Error("Please sign in to view the dashboard.");
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id, name, currency_code, timezone")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load business: ${error.message}`);
  }

  if (!business) {
    throw new Error("No business is linked to this account.");
  }

  return business;
}

async function fetchBusinessRows(
  businessId,
  tableName,
  columns = "*",
  options = {}
) {
  let query = supabase
    .from(tableName)
    .select(columns)
    .eq("business_id", businessId);

  if (options.orderBy) {
    query = query.order(options.orderBy, {
      ascending: options.ascending ?? false,
    });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  throwQueryError(tableName, error);

  return data || [];
}

/* =========================================
   MAIN DASHBOARD SUMMARY
========================================= */

async function getDashboardSummary() {
  const business = await getCurrentBusiness();
  const businessId = business.id;

  const today = getBusinessDate(
    business.timezone || "Asia/Kolkata"
  );

  const [
    customers,
    deliveries,
    payments,
    products,
    expenses,
    invoices,
    deliveryItems,
    events,
  ] = await Promise.all([
    fetchBusinessRows(
      businessId,
      "customers",
      CUSTOMER_COLUMNS,
      { orderBy: "name", ascending: true }
    ),

    fetchBusinessRows(
      businessId,
      "deliveries",
      DELIVERY_COLUMNS,
      { orderBy: "delivery_date", ascending: false }
    ),

    fetchBusinessRows(
      businessId,
      "payments",
      PAYMENT_COLUMNS,
      { orderBy: "payment_date", ascending: false }
    ),

    fetchBusinessRows(
      businessId,
      "products",
      PRODUCT_COLUMNS,
      { orderBy: "name", ascending: true }
    ),

    fetchBusinessRows(
      businessId,
      "expenses",
      EXPENSE_COLUMNS,
      { orderBy: "expense_date", ascending: false }
    ),

    fetchBusinessRows(
      businessId,
      "invoices",
      INVOICE_COLUMNS,
      { orderBy: "invoice_date", ascending: false }
    ),

    fetchBusinessRows(
      businessId,
      "delivery_items",
      `
        id, delivery_id, product_id,
        quantity_delivered, quantity_returned,
        unit_price, line_total
      `
    ),

    // Tenant-scoped Events query.
    // select("*") avoids guessing event table columns.
    fetchBusinessRows(
      businessId,
      "business_events",
      "*"
    ),
  ]);

  const customerMap = new Map(
    customers.map((customer) => [customer.id, customer])
  );

  /* Customer summary */

  const activeCustomers = customers.filter(
    (customer) =>
      customer.status === "active" &&
      customer.archived !== true
  );

  /* Customer payments only */

  const customerPayments = payments.filter(
    (payment) =>
      payment.purpose === "customer_payment" &&
      payment.customer_id
  );

  /* Today's records */

  const todaysDeliveries = deliveries.filter(
    (delivery) => delivery.delivery_date === today
  );

  const todaysPayments = customerPayments.filter(
    (payment) => payment.payment_date === today
  );

  const todaysExpenses = expenses.filter(
    (expense) => expense.expense_date === today
  );

  const todayDeliveryCount = todaysDeliveries.length;

  const todayJarCount = todaysDeliveries.reduce(
    (total, delivery) =>
      total + numberValue(delivery.jar_quantity),
    0
  );

  const todayDeliveryValue = todaysDeliveries.reduce(
    (total, delivery) =>
      total + numberValue(delivery.amount),
    0
  );

  const todayCollection = todaysPayments.reduce(
    (total, payment) =>
      total + numberValue(payment.amount),
    0
  );

  const todayExpenses = todaysExpenses.reduce(
    (total, expense) =>
      total + numberValue(expense.amount),
    0
  );

  /* Overall totals */

  const openingBalance = customers.reduce(
    (total, customer) =>
      total + numberValue(customer.opening_balance),
    0
  );

  const totalDeliveryValue = deliveries.reduce(
    (total, delivery) =>
      total + numberValue(delivery.amount),
    0
  );

  const totalPaymentsReceived = customerPayments.reduce(
    (total, payment) =>
      total + numberValue(payment.amount),
    0
  );

  const outstandingBalance =
    openingBalance +
    totalDeliveryValue -
    totalPaymentsReceived;

  const totalExpenses = expenses.reduce(
    (total, expense) =>
      total + numberValue(expense.amount),
    0
  );

  /* Finance trend */

  const financeTrend = buildFinanceTrend(
    deliveries,
    customerPayments,
    expenses
  );

  /* Expense categories */

  const expensesByCategory =
    buildExpenseCategorySummary(expenses);

  /* Product sales */

  const topSellingProducts = buildTopSellingProducts(
    deliveryItems,
    products
  );

  /* Events scheduled today */

  const todayEvents = buildTodayEvents(events, today);

  /* Recent deliveries */

  const recentDeliveries = todaysDeliveries
    .slice()
    .sort((a, b) => {
      const dateA = new Date(
        a.created_at || a.delivery_date
      ).getTime();

      const dateB = new Date(
        b.created_at || b.delivery_date
      ).getTime();

      return dateB - dateA;
    })
    .slice(0, 5)
    .map((delivery) => {
      const customer = customerMap.get(delivery.customer_id);

      return {
        id: delivery.id,
        customerId: delivery.customer_id,
        customerName: customer?.name || "Unknown customer",
        quantity: numberValue(delivery.jar_quantity),
        amount: numberValue(delivery.amount),
        date: delivery.delivery_date,
        deliveryDate: delivery.delivery_date,
        notes: delivery.notes || "",
      };
    });

  /* Recent payments */

  const recentPayments = todaysPayments
    .slice()
    .sort((a, b) => {
      const dateA = new Date(
        a.created_at || a.payment_date
      ).getTime();

      const dateB = new Date(
        b.created_at || b.payment_date
      ).getTime();

      return dateB - dateA;
    })
    .slice(0, 5)
    .map((payment) => {
      const customer = customerMap.get(payment.customer_id);

      return {
        id: payment.id,
        customerId: payment.customer_id,
        customerName: customer?.name || "Unknown customer",
        amount: numberValue(payment.amount),
        method: payment.method || "other",
        date: payment.payment_date,
        paymentDate: payment.payment_date,
      };
    });

  /* Recent expenses */

  const recentExpenses = expenses.slice(0, 5).map((expense) => ({
    id: expense.id,
    description: expense.description || "",
    category: expense.category || "",
    amount: numberValue(expense.amount),
    date: expense.expense_date,
    expenseDate: expense.expense_date,
    paymentMethod: expense.payment_method || "",
    notes: expense.notes || "",
  }));

  /* Invoice summary */

  const validInvoices = invoices.filter(
    (invoice) =>
      !["void", "draft"].includes(invoice.status)
  );

  const totalInvoiceValue = validInvoices.reduce(
    (total, invoice) =>
      total + numberValue(invoice.total_amount),
    0
  );

  const totalInvoicePaid = validInvoices.reduce(
    (total, invoice) =>
      total + numberValue(invoice.amount_paid),
    0
  );

  const invoiceOutstanding = validInvoices.reduce(
    (total, invoice) =>
      total +
      Math.max(
        0,
        numberValue(invoice.total_amount) -
          numberValue(invoice.amount_paid)
      ),
    0
  );

  const invoiceSummary = {
    totalInvoices: validInvoices.length,
    totalAmount: roundMoney(totalInvoiceValue),
    totalPaid: roundMoney(totalInvoicePaid),
    outstanding: roundMoney(invoiceOutstanding),
  };

  /* Products */

  const productSummary = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    unit: product.unit,
    jarSizeLitres: numberValue(product.jar_size_l),
    salePrice: numberValue(product.sale_price),
    costPrice: numberValue(product.cost_price),
    isReturnableJar: product.is_returnable_jar,
    status: product.status,
    stockQuantity: null,
  }));

  /* Recent invoices */

  const recentInvoices = invoices.slice(0, 5).map((invoice) => ({
    id: invoice.id,
    customerId: invoice.customer_id,
    customerName:
      customerMap.get(invoice.customer_id)?.name ||
      "Unknown customer",
    invoiceNumber: invoice.invoice_number,
    invoiceDate: invoice.invoice_date,
    date: invoice.invoice_date,
    dueDate: invoice.due_date,
    totalAmount: numberValue(invoice.total_amount),
    amountPaid: numberValue(invoice.amount_paid),
    outstandingAmount: Math.max(
      0,
      numberValue(invoice.total_amount) -
        numberValue(invoice.amount_paid)
    ),
    status: invoice.status,
  }));

  return {
    business: {
      id: business.id,
      name: business.name,
      currencyCode: business.currency_code || "INR",
      timezone: business.timezone || "Asia/Kolkata",
    },

    today,

    /* Today */

    todayCollection,
    todayPaymentCount: todaysPayments.length,
    todayExpenses,
    todayExpenseCount: todaysExpenses.length,

    activeCustomers: activeCustomers.length,
    totalCustomers: customers.length,

    todayDeliveryCount,
    todayJarCount,
    todayDeliveryValue,

    outstandingBalance,

    todayEvents,
    eventsToday: todayEvents,
    todayEventCount: todayEvents.length,

    recentDeliveries,
    recentPayments,

    /* Finance */

    totalDeliveryValue,
    totalPaymentsReceived,
    openingBalance,
    totalExpenses,

    financeTrend,
    expensesByCategory,
    topSellingProducts,

    totalInvoiceValue,
    totalInvoicePaid,
    invoiceOutstanding,
    invoiceSummary,

    /* Account */

    productCount: products.length,
    products: productSummary,

    /* Recent records */

    recentExpenses,
    invoices: recentInvoices,
  };
}

const dashboardService = {
  getDashboardSummary,
};

export { getDashboardSummary };

export default dashboardService;
