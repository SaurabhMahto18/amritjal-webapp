
import { supabase } from "../../../lib/supabase/client";

const CUSTOMERS_TABLE = "customers";
const DELIVERIES_TABLE = "deliveries";
const PAYMENTS_TABLE = "payments";

/* ----------------------------------
   Business Context
---------------------------------- */

const getBusinessId = async () => {
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError) throw authError;

  const user = authData?.user;

  if (!user) {
    throw new Error("Please log in to access the ledger.");
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!business?.id) {
    throw new Error("No business profile found for this account.");
  }

  return business.id;
};

/* ----------------------------------
   Normalizers
---------------------------------- */

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const toDateKey = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const normalizeCustomer = (customer) => ({
  id: customer.id,
  name: customer.name || "Unnamed customer",
  phone: customer.phone || "",
  address: customer.address || "",
  status: customer.status || "",
  openingBalance: toNumber(customer.opening_balance),
});

const normalizeDelivery = (delivery) => {
  const quantity = toNumber(delivery.jar_quantity);
  const rate = toNumber(delivery.jar_rate);

  return {
    id: delivery.id,
    customerId: delivery.customer_id,
    date: toDateKey(delivery.delivery_date),
    type: "Delivery",
    description: delivery.notes?.trim() || "Water jar delivery",
    debit: toNumber(delivery.amount ?? quantity * rate),
    credit: 0,
    quantity,
    rate,
    reference: delivery.id,
    createdAt: delivery.created_at,
  };
};

const normalizePayment = (payment) => ({
  id: payment.id,
  customerId: payment.customer_id,
  date: toDateKey(payment.payment_date),
  type: "Payment",
  description: payment.notes?.trim() || "Customer payment",
  debit: 0,
  credit: toNumber(payment.amount),
  quantity: 0,
  rate: 0,
  method: payment.payment_method || "other",
  reference: payment.id,
  createdAt: payment.created_at,
});

/* ----------------------------------
   Transaction Helpers
---------------------------------- */

const inDateRange = (date, from, to) => {
  const dateKey = toDateKey(date);

  if (!dateKey) return false;
  if (from && dateKey < from) return false;
  if (to && dateKey > to) return false;

  return true;
};

const sortTransactions = (transactions) => {
  return [...transactions].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);

    if (dateCompare !== 0) return dateCompare;

    return String(a.createdAt || "").localeCompare(
      String(b.createdAt || "")
    );
  });
};

const getTransactionKey = (transaction) =>
  `${transaction.type}:${transaction.id}`;

/* ----------------------------------
   Ledger Service
---------------------------------- */

const ledgerService = {
  async getCustomers() {
    const businessId = await getBusinessId();

    const { data, error } = await supabase
      .from(CUSTOMERS_TABLE)
      .select("*")
      .eq("business_id", businessId)
      .order("name", { ascending: true });

    if (error) throw error;

    return (data || []).map(normalizeCustomer);
  },

  async getTransactions({
    customerId = "",
    fromDate = "",
    toDate = "",
  } = {}) {
    const businessId = await getBusinessId();

    /*
     * Fetch the complete delivery and payment history.
     * Do not apply the date filter at database level:
     * running balances need transactions before fromDate.
     */

    let deliveriesQuery = supabase
      .from(DELIVERIES_TABLE)
      .select(
        `
          id,
          business_id,
          customer_id,
          delivery_date,
          jar_quantity,
          jar_rate,
          amount,
          notes,
          created_at
        `
      )
      .eq("business_id", businessId)
      .order("delivery_date", { ascending: true })
      .order("created_at", { ascending: true });

    let paymentsQuery = supabase
      .from(PAYMENTS_TABLE)
      .select(
        `
          id,
          business_id,
          customer_id,
          payment_date,
          amount,
          payment_method,
          notes,
          created_at
        `
      )
      .eq("business_id", businessId)
      .not("customer_id", "is", null)
      .order("payment_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (customerId) {
      deliveriesQuery = deliveriesQuery.eq(
        "customer_id",
        customerId
      );

      paymentsQuery = paymentsQuery.eq(
        "customer_id",
        customerId
      );
    }

    const [
      { data: deliveryRows, error: deliveryError },
      { data: paymentRows, error: paymentError },
    ] = await Promise.all([
      deliveriesQuery,
      paymentsQuery,
    ]);

    if (deliveryError) throw deliveryError;
    if (paymentError) throw paymentError;

    const deliveryTransactions = (deliveryRows || []).map(
      normalizeDelivery
    );

    const paymentTransactions = (paymentRows || []).map(
      normalizePayment
    );

    const history = sortTransactions([
      ...deliveryTransactions,
      ...paymentTransactions,
    ]);

    const transactions = history.filter((transaction) =>
      inDateRange(transaction.date, fromDate, toDate)
    );

    return {
      transactions,
      history,
      businessId,
    };
  },

  async getLedgerData(filters = {}) {
    const [customers, result] = await Promise.all([
      this.getCustomers(),
      this.getTransactions(filters),
    ]);

    const customerMap = new Map(
      customers.map((customer) => [customer.id, customer])
    );

    const historyByCustomer = new Map();

    for (const transaction of result.history) {
      const list =
        historyByCustomer.get(transaction.customerId) || [];

      list.push(transaction);
      historyByCustomer.set(transaction.customerId, list);
    }

    const visibleKeys = new Set(
      result.transactions.map(getTransactionKey)
    );

    const transactions = [];
    const closingBalanceByCustomer = new Map();

    /*
     * Calculate running balance using the complete history.
     * Opening balance is the starting point, not a new delivery.
     */

    for (const customer of customers) {
      const history = historyByCustomer.get(customer.id) || [];

      let runningBalance = toNumber(customer.openingBalance);

      for (const transaction of history) {
        runningBalance +=
          transaction.debit - transaction.credit;

        if (visibleKeys.has(getTransactionKey(transaction))) {
          transactions.push({
            ...transaction,
            customerName: customer.name,
            customerPhone: customer.phone,
            balance: runningBalance,
          });
        }
      }

      closingBalanceByCustomer.set(
        customer.id,
        runningBalance
      );
    }

    const sortedVisibleTransactions =
      sortTransactions(transactions);

    const totalDebit = sortedVisibleTransactions.reduce(
      (sum, transaction) => sum + transaction.debit,
      0
    );

    const totalCredit = sortedVisibleTransactions.reduce(
      (sum, transaction) => sum + transaction.credit,
      0
    );

    /*
     * Outstanding always means current outstanding,
     * independent of the selected display date range.
     */

    const outstanding = filters.customerId
      ? closingBalanceByCustomer.get(filters.customerId) ??
        toNumber(
          customerMap.get(filters.customerId)?.openingBalance
        )
      : customers.reduce(
          (sum, customer) =>
            sum +
            (
              closingBalanceByCustomer.get(customer.id) ??
              toNumber(customer.openingBalance)
            ),
          0
        );

    return {
      customers,
      transactions: sortedVisibleTransactions,
      totalDebit,
      totalCredit,
      outstanding,
      transactionCount: sortedVisibleTransactions.length,
    };
  },
};

export default ledgerService;
