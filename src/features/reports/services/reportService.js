
import { supabase } from "../../../lib/supabase/client";

async function getBusinessId() {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) throw authError;

  if (!authData?.user?.id) {
    throw new Error("User authentication required.");
  }

  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", authData.user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data?.id) {
    throw new Error("Business not found for this account.");
  }

  return data.id;
}

function monthRange(month) {
  if (!/^\d{4}-\d{2}$/.test(month || "")) {
    throw new Error("Select a valid reporting month.");
  }

  const [year, monthNumber] = month.split("-").map(Number);

  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error("Select a valid reporting month.");
  }

  const lastDay = new Date(year, monthNumber, 0).getDate();

  return {
    fromDate: `${month}-01`,
    toDate: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function amount(value) {
  return Number(value || 0);
}

async function fetchRows(table, select, businessId, dateColumn, range) {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq("business_id", businessId)
    .gte(dateColumn, range.fromDate)
    .lte(dateColumn, range.toDate)
    .order(dateColumn, { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function getMonthlyReportData(month) {
  const range = monthRange(month);
  const businessId = await getBusinessId();

  const [
    customersRes,
    deliveries,
    payments,
    expenses,
    invoices,
    employeesRes,
    dispatches,
    salaryTransactions,
    attendance,
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id,name,phone,status,archived,opening_balance")
      .eq("business_id", businessId),

    fetchRows(
      "deliveries",
      "id,customer_id,delivery_date,jar_quantity,jar_rate,amount,customers(name)",
      businessId,
      "delivery_date",
      range
    ),

    fetchRows(
      "payments",
      "id,customer_id,payment_date,amount,payment_method,customers(name)",
      businessId,
      "payment_date",
      range
    ),

    fetchRows(
      "expenses",
      "id,description,category,amount,expense_date,payment_method,vendor,notes",
      businessId,
      "expense_date",
      range
    ),

    fetchRows(
      "invoices",
      "id,invoice_number,customer_id,invoice_date,total_amount,paid_amount:amount_paid,status,customers(name)",
      businessId,
      "invoice_date",
      range
    ),

    supabase
      .from("staff_employees")
      .select("id,name,phone,role,joining_date,monthly_salary,status")
      .eq("business_id", businessId)
      .order("name"),

    fetchRows(
      "staff_dispatches",
      "id,employee_id,dispatch_date,trip_label,area,vehicle_number,jars_taken,jars_delivered,jars_returned,jars_damaged,jars_missing,pending_jars,notes",
      businessId,
      "dispatch_date",
      range
    ),

    fetchRows(
      "staff_financial_transactions",
      "id,employee_id,transaction_date,transaction_type,amount,payment_method,reference,notes",
      businessId,
      "transaction_date",
      range
    ),

    fetchRows(
      "staff_attendance",
      "id,employee_id,attendance_date,status,notes",
      businessId,
      "attendance_date",
      range
    ),
  ]);

  for (const result of [customersRes, employeesRes]) {
    if (result.error) throw result.error;
  }

  const customers = (customersRes.data || []).filter(
    (customer) => !customer.archived
  );

  const employees = employeesRes.data || [];

  const normalizedDeliveries = deliveries.map((row) => ({
    ...row,
    jar_quantity: amount(row.jar_quantity),
    amount: amount(
      row.amount ?? amount(row.jar_quantity) * amount(row.jar_rate)
    ),
  }));

  const normalizedPayments = payments.map((row) => ({
    ...row,
    amount: amount(row.amount),
  }));

  const normalizedExpenses = expenses.map((row) => ({
    ...row,
    title: row.description,
    amount: amount(row.amount),
  }));

  const normalizedInvoices = invoices.map((row) => {
    const totalAmount = amount(row.total_amount);
    const paidAmount = amount(row.paid_amount);

    return {
      ...row,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      balance: Math.max(0, totalAmount - paidAmount),
    };
  });

  const normalizedDispatches = dispatches.map((row) => ({
    ...row,
    jars_taken: amount(row.jars_taken),
    jars_delivered: amount(row.jars_delivered),
    jars_returned: amount(row.jars_returned),
    jars_damaged: amount(row.jars_damaged),
    jars_missing: amount(row.jars_missing),
    pending_jars: amount(row.pending_jars),
  }));

  const normalizedSalaryTransactions = salaryTransactions.map((row) => ({
    ...row,
    amount: amount(row.amount),
  }));

  const activeCustomers = customers.filter(
    (customer) => customer.status !== "inactive"
  ).length;

  const deliveredJars = normalizedDeliveries.reduce(
    (sum, row) => sum + row.jar_quantity,
    0
  );

  const deliveryValue = normalizedDeliveries.reduce(
    (sum, row) => sum + row.amount,
    0
  );

  const collections = normalizedPayments.reduce(
    (sum, row) => sum + row.amount,
    0
  );

  const expenseTotal = normalizedExpenses.reduce(
    (sum, row) => sum + row.amount,
    0
  );

  const invoiceValue = normalizedInvoices.reduce(
    (sum, row) => sum + row.total_amount,
    0
  );

  const outstandingInvoices = normalizedInvoices.reduce(
    (sum, row) => sum + row.balance,
    0
  );

  const employeeMap = new Map(
    employees.map((employee) => [employee.id, employee.name])
  );

  const employeeDispatches = normalizedDispatches.map((row) => ({
    ...row,
    employee_name: employeeMap.get(row.employee_id) || "Unknown Employee",
  }));

  const employeeTransactions = normalizedSalaryTransactions.map((row) => ({
    ...row,
    employee_name: employeeMap.get(row.employee_id) || "Unknown Employee",
  }));

  const employeeAttendance = attendance.map((row) => ({
    ...row,
    employee_name: employeeMap.get(row.employee_id) || "Unknown Employee",
  }));

  const employeePerformance = employees.map((employee) => {
    const trips = employeeDispatches.filter(
      (row) => row.employee_id === employee.id
    );

    return {
      employee_name: employee.name,
      phone: employee.phone || "",
      role: employee.role || "",
      status: employee.status || "",
      joining_date: employee.joining_date || "",
      monthly_salary: amount(employee.monthly_salary),
      trips: trips.length,
      jars_delivered: trips.reduce(
        (sum, row) => sum + row.jars_delivered,
        0
      ),
      pending_jars: trips.reduce(
        (sum, row) => sum + row.pending_jars,
        0
      ),
    };
  });

  return {
    month,
    range,
    customers,
    deliveries: normalizedDeliveries,
    payments: normalizedPayments,
    expenses: normalizedExpenses,
    invoices: normalizedInvoices,
    employees,
    dispatches: employeeDispatches,
    salaryTransactions: employeeTransactions,
    attendance: employeeAttendance,
    employeePerformance,
    summary: {
      activeCustomers,
      deliveredJars,
      deliveryValue,
      collections,
      expenseTotal,
      invoiceValue,
      outstandingInvoices,
      operatingNet: collections - expenseTotal,
      employeeCount: employees.length,
      employeeTrips: employeeDispatches.length,
      employeePayments: employeeTransactions.reduce(
        (sum, row) => sum + row.amount,
        0
      ),
    },
  };
}

// Retained for compatibility with existing CSV export usage.
export function downloadReportCsv(
  rows,
  filename = "amrit-jal-report.csv"
) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("There are no rows to export.");
  }

  const columns = Object.keys(rows[0]);

  const escape = (value) => {
    const text =
      value == null
        ? ""
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);

    return /[",\r\n]/.test(text)
      ? `"${text.replace(/"/g, '""')}"`
      : text;
  };

  const csv = [
    columns.map(escape).join(","),
    ...rows.map((row) =>
      columns.map((key) => escape(row[key])).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}
