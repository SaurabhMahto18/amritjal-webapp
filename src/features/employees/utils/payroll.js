export const formatINR = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

export function monthBounds(month) {
  const [year, monthNumber] = month.split("-").map(Number);

  const start = `${month}-01`;

  const lastDay = new Date(
    year,
    monthNumber,
    0
  ).getDate();

  const end = `${month}-${String(lastDay).padStart(2, "0")}`;

  return { start, end };
}

export function calculatePayroll(
  employee,
  transactions,
  month
) {
  const { start, end } = monthBounds(month);

  const rows = transactions.filter((transaction) => {
    return (
      transaction.transaction_date >= start &&
      transaction.transaction_date <= end
    );
  });

  const sum = (type) => {
    return rows
      .filter((item) => item.transaction_type === type)
      .reduce(
        (total, item) => total + Number(item.amount || 0),
        0
      );
  };

  const positiveAdjustments = rows
    .filter(
      (item) =>
        item.transaction_type === "adjustment" &&
        Number(item.amount) > 0
    )
    .reduce(
      (total, item) => total + Number(item.amount),
      0
    );

  const negativeAdjustments = rows
    .filter(
      (item) =>
        item.transaction_type === "adjustment" &&
        Number(item.amount) < 0
    )
    .reduce(
      (total, item) => total + Math.abs(Number(item.amount)),
      0
    );

  const fixedSalary = Number(employee.monthly_salary || 0);
  const bonus = sum("bonus");
  const personalExpenses = sum("personal_expense");
  const salaryAdvances = sum("salary_advance");
  const paid = sum("salary_payment");

  const additions = bonus + positiveAdjustments;

  const deductions =
    personalExpenses +
    salaryAdvances +
    negativeAdjustments;

  const netPayable =
    fixedSalary + additions - deductions;

  const balance = netPayable - paid;

  return {
    month,
    fixedSalary,
    bonus,
    positiveAdjustments,
    negativeAdjustments,
    personalExpenses,
    salaryAdvances,
    paid,
    additions,
    deductions,
    netPayable,
    balance,

    remainingPayable: Math.max(balance, 0),

    overpaid: Math.max(-balance, 0),

    transactions: rows,
  };
}