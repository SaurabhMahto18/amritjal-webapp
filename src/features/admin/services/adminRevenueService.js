
import { supabase } from "../../../lib/supabase/client";

const MONTHS_TO_SHOW = 12;
const MAX_RECORDS = 10000;

const PAYMENT_STATUSES = [
  "pending",
  "successful",
  "failed",
  "refunded",
];

const EDITABLE_PAYMENT_FIELDS = [
  "amount",
  "currency",
  "payment_status",
  "payment_method",
  "payment_provider",
  "provider_payment_id",
  "reference_no",
  "paid_at",
  "billing_cycle",
  "plan_id",
  "notes",
];

const getDateKey = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const getMonthKey = (value) => {
  const date = new Date(value);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

const getMonthLabel = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });

const getTransactionDate = (payment) => {
  if (
    payment.payment_status === "successful" ||
    payment.payment_status === "refunded"
  ) {
    return payment.paid_at || payment.created_at;
  }

  return payment.created_at;
};

const isWithinDateRange = (payment, startDate, endDate) => {
  const transactionDate = getDateKey(
    getTransactionDate(payment)
  );

  if (!transactionDate) return false;
  if (startDate && transactionDate < startDate) return false;
  if (endDate && transactionDate > endDate) return false;

  return true;
};

function createMonthRange(startDate, endDate) {
  const months = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  let current = new Date(
    start.getFullYear(),
    start.getMonth(),
    1
  );

  const last = new Date(
    end.getFullYear(),
    end.getMonth(),
    1
  );

  while (current <= last && months.length < 24) {
    const key = getMonthKey(current);

    months.push({
      key,
      label: getMonthLabel(current),
      revenue: 0,
    });

    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

export const adminRevenueService = {
  // ==========================================
  // GET REVENUE ANALYTICS
  // ==========================================

  async getRevenueAnalytics({ startDate, endDate } = {}) {
    const { data, error } = await supabase
      .from("platform_subscription_payments")
      .select(`
        id,
        business_id,
        subscription_id,
        plan_id,
        amount,
        currency,
        payment_status,
        payment_method,
        payment_provider,
        provider_payment_id,
        reference_no,
        paid_at,
        created_at,
        billing_cycle,
        notes,
        businesses(name),
        subscription_plans(name, code)
      `)
      .order("created_at", { ascending: false })
      .range(0, MAX_RECORDS - 1);

    if (error) throw error;

    const allPayments = data || [];

    const payments = allPayments.filter((payment) =>
      isWithinDateRange(payment, startDate, endDate)
    );

    const successful = payments.filter(
      (p) => p.payment_status === "successful"
    );

    const pending = payments.filter(
      (p) => p.payment_status === "pending"
    );

    const failed = payments.filter(
      (p) => p.payment_status === "failed"
    );

    const refunded = payments.filter(
      (p) => p.payment_status === "refunded"
    );

    const sumAmount = (items) =>
      items.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

    const totalRevenue = sumAmount(successful);
    const pendingAmount = sumAmount(pending);
    const refundedAmount = sumAmount(refunded);

    const now = new Date();

    const defaultEnd = getDateKey(now);

    const defaultStartDate = new Date(
      now.getFullYear(),
      now.getMonth() - (MONTHS_TO_SHOW - 1),
      1
    );

    const chartStart =
      startDate || getDateKey(defaultStartDate);

    const chartEnd = endDate || defaultEnd;

    const monthlyRevenue = createMonthRange(
      chartStart,
      chartEnd
    );

    const monthlyMap = new Map(
      monthlyRevenue.map((item) => [item.key, item])
    );

    successful.forEach((payment) => {
      const date = payment.paid_at || payment.created_at;
      if (!date) return;

      const key = getMonthKey(date);
      const month = monthlyMap.get(key);

      if (month) {
        month.revenue += Number(payment.amount || 0);
      }
    });

    const currentMonthKey = getMonthKey(now);

    const previousMonthDate = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const previousMonthKey = getMonthKey(
      previousMonthDate
    );

    const currentMonthRevenue =
      monthlyMap.get(currentMonthKey)?.revenue || 0;

    const lastMonthRevenue =
      monthlyMap.get(previousMonthKey)?.revenue || 0;

    const planMap = {};

    successful.forEach((payment) => {
      const planId = payment.plan_id || "unassigned";

      const planName =
        payment.subscription_plans?.name ||
        "Unassigned Plan";

      if (!planMap[planId]) {
        planMap[planId] = {
          id: planId,
          name: planName,
          revenue: 0,
          transactions: 0,
        };
      }

      planMap[planId].revenue += Number(
        payment.amount || 0
      );

      planMap[planId].transactions += 1;
    });

    const planRevenue = Object.values(planMap).sort(
      (a, b) => b.revenue - a.revenue
    );

    const statusCounts = {
      successful: successful.length,
      pending: pending.length,
      failed: failed.length,
      refunded: refunded.length,
    };

    return {
      totalRevenue,
      thisMonthRevenue: currentMonthRevenue,
      lastMonthRevenue,
      pendingAmount,
      refundedAmount,
      failedAmount: sumAmount(failed),
      monthlyRevenue,
      planRevenue,
      statusCounts,
      recentTransactions: payments,
      totalTransactions: payments.length,
      recordLimitReached:
        allPayments.length === MAX_RECORDS,
    };
  },

  // ==========================================
  // UPDATE PAYMENT
  // ==========================================

  async updatePayment(paymentId, input) {
    if (!paymentId) {
      throw new Error("Payment ID is required.");
    }

    if (!input || typeof input !== "object") {
      throw new Error("Payment update data is required.");
    }

    const payload = {};

    // Only allow explicitly approved fields.
    EDITABLE_PAYMENT_FIELDS.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(input, field)) {
        payload[field] = input[field];
      }
    });

    if (Object.keys(payload).length === 0) {
      throw new Error("No valid payment fields provided.");
    }

    if (
      payload.amount !== undefined &&
      (!Number.isFinite(Number(payload.amount)) ||
        Number(payload.amount) < 0)
    ) {
      throw new Error("Enter a valid payment amount.");
    }

    if (
      payload.payment_status !== undefined &&
      !PAYMENT_STATUSES.includes(payload.payment_status)
    ) {
      throw new Error("Invalid payment status.");
    }

    if (
      payload.currency !== undefined &&
      !String(payload.currency).trim()
    ) {
      throw new Error("Currency is required.");
    }

    if (payload.amount !== undefined) {
      payload.amount = Number(payload.amount);
    }

    if (payload.currency !== undefined) {
      payload.currency = String(
        payload.currency
      ).trim().toUpperCase();
    }

    if (payload.reference_no !== undefined) {
      payload.reference_no =
        String(payload.reference_no || "").trim() || null;
    }

    if (payload.provider_payment_id !== undefined) {
      payload.provider_payment_id =
        String(
          payload.provider_payment_id || ""
        ).trim() || null;
    }

    if (payload.notes !== undefined) {
      payload.notes =
        String(payload.notes || "").trim() || null;
    }

    if (payload.paid_at !== undefined) {
      payload.paid_at = payload.paid_at || null;

      if (
        payload.paid_at &&
        Number.isNaN(new Date(payload.paid_at).getTime())
      ) {
        throw new Error("Invalid payment date.");
      }
    }

    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("platform_subscription_payments")
      .update(payload)
      .eq("id", paymentId)
      .select(`
        id,
        business_id,
        subscription_id,
        plan_id,
        amount,
        currency,
        payment_status,
        payment_method,
        payment_provider,
        provider_payment_id,
        reference_no,
        paid_at,
        created_at,
        billing_cycle,
        notes,
        businesses(name),
        subscription_plans(name, code)
      `)
      .single();

    if (error) throw error;

    return data;
  },

  // ==========================================
  // DELETE PAYMENT
  // ==========================================

  async deletePayment(paymentId) {
    if (!paymentId) {
      throw new Error("Payment ID is required.");
    }

    const { data, error } = await supabase
      .from("platform_subscription_payments")
      .delete()
      .eq("id", paymentId)
      .select("id")
      .single();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "Payment not found or could not be deleted."
      );
    }

    return data;
  },
};
