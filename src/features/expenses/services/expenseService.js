
import { supabase } from "../../../lib/supabase/client";

/* =========================================================
   BUSINESS CONTEXT
========================================================= */

const getBusinessContext = async () => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;

  if (!user) {
    throw new Error("Please sign in to continue.");
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (error) throw error;

  if (!business?.id) {
    throw new Error("Business account not found.");
  }

  return {
    businessId: business.id,
    userId: user.id,
  };
};


/* =========================================================
   CONSTANTS
========================================================= */

const ALLOWED_CATEGORIES = [
  "fuel",
  "salary",
  "rent",
  "maintenance",
  "supplies",
  "utilities",
  "transport",
  "other",
];

const ALLOWED_PAYMENT_METHODS = [
  "cash",
  "upi",
  "bank_transfer",
  "other",
];


/* =========================================================
   DATE VALIDATION
========================================================= */

const validateExpenseDate = (value) => {
  const expenseDate = String(value ?? "").trim();

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
    expenseDate
  );

  if (!match) {
    throw new Error("Please select a valid expense date.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Please enter a valid expense date.");
  }

  return expenseDate;
};


/* =========================================================
   EXPENSE VALIDATION
========================================================= */

const validateExpense = (expense) => {
  if (!expense || typeof expense !== "object") {
    throw new Error("Invalid expense information.");
  }

  // UI title maps to database description.
  const description = String(
    expense.title ?? expense.description ?? ""
  ).trim();

  if (!description) {
    throw new Error("Expense title is required.");
  }

  if (description.length > 150) {
    throw new Error(
      "Expense title cannot exceed 150 characters."
    );
  }

  if (
    expense.amount === "" ||
    expense.amount === null ||
    expense.amount === undefined
  ) {
    throw new Error("Expense amount is required.");
  }

  const amount = Number(expense.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      "Enter a valid expense amount greater than zero."
    );
  }

  const expenseDate = validateExpenseDate(
    expense.expense_date
  );

  const category = expense.category || "other";

  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new Error("Please select a valid expense category.");
  }

  const paymentMethod =
    expense.payment_method || "cash";

  if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
    throw new Error("Please select a valid payment method.");
  }

  const notes = String(expense.notes ?? "").trim();

  if (notes.length > 1000) {
    throw new Error("Notes cannot exceed 1000 characters.");
  }

  return {
    // Actual database column is description, NOT title.
    description,

    category,
    amount,
    expense_date: expenseDate,
    payment_method: paymentMethod,
    notes: notes || null,
  };
};


/* =========================================================
   DATABASE RESPONSE NORMALIZATION
========================================================= */

/**
 * Database:
 * description
 *
 * Frontend:
 * title
 *
 * This keeps existing ExpensesPage.jsx compatible.
 */
const normalizeExpense = (expense) => {
  if (!expense) return null;

  return {
    ...expense,
    title: expense.description,
  };
};


/* =========================================================
   EXPENSE SERVICE
========================================================= */

const expenseService = {

  /* -------------------------------------------------------
     GET ALL EXPENSES
  ------------------------------------------------------- */

  async getAll() {
    const { businessId } = await getBusinessContext();

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("business_id", businessId)
      .order("expense_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return (data ?? []).map(normalizeExpense);
  },


  /* -------------------------------------------------------
     GET EXPENSE BY ID
  ------------------------------------------------------- */

  async getById(expenseId) {
    if (!expenseId) {
      throw new Error("Expense ID is required.");
    }

    const { businessId } = await getBusinessContext();

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", expenseId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error("Expense not found.");
    }

    return normalizeExpense(data);
  },


  /* -------------------------------------------------------
     CREATE EXPENSE
  ------------------------------------------------------- */

  async create(expense) {
    const { businessId, userId } =
      await getBusinessContext();

    const validatedExpense = validateExpense(expense);

    const payload = {
      business_id: businessId,
      created_by: userId,
      ...validatedExpense,
    };

    const { data, error } = await supabase
      .from("expenses")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return normalizeExpense(data);
  },


  /* -------------------------------------------------------
     UPDATE EXPENSE
  ------------------------------------------------------- */

  async update(expenseId, expense) {
    if (!expenseId) {
      throw new Error("Expense ID is required.");
    }

    const { businessId } = await getBusinessContext();

    const validatedExpense = validateExpense(expense);

    const { data, error } = await supabase
      .from("expenses")
      .update(validatedExpense)
      .eq("id", expenseId)
      .eq("business_id", businessId)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "Expense not found or you do not have permission to update it."
      );
    }

    return normalizeExpense(data);
  },


  /* -------------------------------------------------------
     DELETE EXPENSE
  ------------------------------------------------------- */

  async delete(expenseId) {
    if (!expenseId) {
      throw new Error("Expense ID is required.");
    }

    const { businessId } = await getBusinessContext();

    const { data, error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId)
      .eq("business_id", businessId)
      .select("id");

    if (error) throw error;

    if (!data?.length) {
      throw new Error(
        "Expense not found or you do not have permission to delete it."
      );
    }

    return true;
  },

};

export default expenseService;
