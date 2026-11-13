export function validateEmployee(employee) {
  if (!String(employee.name || "").trim()) {
    return "Employee name is required.";
  }

  const phone = String(employee.phone || "").replace(/\D/g, "");

  if (phone.length < 10 || phone.length > 15) {
    return "Enter a valid mobile number.";
  }

  const salary = Number(employee.monthly_salary);

  if (!Number.isFinite(salary) || salary < 0) {
    return "Monthly fixed salary must be zero or more.";
  }

  if (!employee.joining_date) {
    return "Joining date is required.";
  }

  return null;
}

export function validateDispatch(input) {
  const fields = [
    "jars_taken",
    "jars_delivered",
    "jars_returned",
    "jars_damaged",
    "jars_missing",
  ];

  for (const field of fields) {
    const value = Number(input[field] || 0);

    if (!Number.isInteger(value) || value < 0) {
      return "Jar quantities must be non-negative whole numbers.";
    }
  }

  const accounted =
    Number(input.jars_delivered || 0) +
    Number(input.jars_returned || 0) +
    Number(input.jars_damaged || 0) +
    Number(input.jars_missing || 0);

  if (accounted > Number(input.jars_taken || 0)) {
    return "Delivered, returned, damaged and missing cannot exceed jars taken.";
  }

  if (!input.dispatch_date) {
    return "Dispatch date is required.";
  }

  return null;
}

export function validateMoney(input) {
  if (
    !input.employee_id ||
    !input.transaction_date ||
    !input.transaction_type
  ) {
    return "Employee, date and transaction type are required.";
  }

  const amount = Number(input.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Amount must be greater than zero.";
  }

  return null;
}