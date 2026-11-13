export const EMPLOYEE_ROLES = [
  { value: "driver", label: "Driver" },
  { value: "delivery_boy", label: "Delivery Boy" },
  { value: "helper", label: "Helper" },
  { value: "manager", label: "Manager" },
  { value: "other", label: "Other" },
];

export const FINANCIAL_TYPES = [
  { value: "personal_expense", label: "Personal Expense" },
  { value: "salary_advance", label: "Salary Advance" },
  { value: "salary_payment", label: "Salary Payment" },
  { value: "bonus", label: "Bonus / Incentive" },
  { value: "adjustment", label: "Adjustment" },
];

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank", label: "Bank Transfer" },
];

export const DEFAULT_EMPLOYEE_FORM = {
  name: "",
  phone: "",
  address: "",
  role: "delivery_boy",
  joining_date: new Date().toISOString().slice(0, 10),
  monthly_salary: "",
  status: "active",
  notes: "",
};