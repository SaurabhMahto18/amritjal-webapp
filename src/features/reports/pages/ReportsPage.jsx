
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Users,
  Droplets,
  Wallet,
  Receipt,
  TrendingUp,
  UserRound,
  Truck,
  IndianRupee,
  Clock,
  AlertCircle,
} from "lucide-react";

import { getMonthlyReportData } from "../services/reportService";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const currentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (month) => {
  if (!month) return "";
  const [year, number] = month.split("-").map(Number);

  return new Date(year, number - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const REPORTS = [
  {
    category: "Sales & Operations",
    items: [
      { id: "monthlySales", label: "Monthly Sales Report", icon: TrendingUp },
      { id: "deliveries", label: "Delivery Report", icon: Droplets },
      { id: "customers", label: "Customer Report", icon: Users },
    ],
  },
  {
    category: "Finance",
    items: [
      { id: "payments", label: "Payment Report", icon: Wallet },
      { id: "expenses", label: "Expense Report", icon: Receipt },
      { id: "invoices", label: "Invoice & Outstanding Report", icon: FileText },
      { id: "businessSummary", label: "Monthly Business Summary", icon: BarChart3 },
    ],
  },
  {
    category: "Employees",
    items: [
      { id: "employees", label: "Employee Report", icon: UserRound },
      { id: "employeePayments", label: "Employee Payment Report", icon: IndianRupee },
      { id: "employeeAttendance", label: "Employee Attendance Report", icon: Clock },
    ],
  },
  {
    category: "Events",
    items: [
      {
        id: "events",
        label: "Event Report",
        icon: CalendarDays,
        disabled: true,
      },
      {
        id: "eventPayments",
        label: "Event Payment Report",
        icon: Wallet,
        disabled: true,
      },
    ],
  },
];

function Metric({ title, value, detail, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className="rounded-xl bg-cyan-50 p-2 text-cyan-700">
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

function buildReports(data) {
  const customerSales = new Map();

  data.deliveries.forEach((row) => {
    const id = row.customer_id || "unknown";
    const current = customerSales.get(id) || {
      customer: row.customers?.name || "Unknown Customer",
      deliveries: 0,
      jars: 0,
      amount: 0,
    };

    current.deliveries += 1;
    current.jars += row.jar_quantity;
    current.amount += row.amount;

    customerSales.set(id, current);
  });

  return {
    monthlySales: [
      {
        metric: "Delivery records",
        value: data.deliveries.length,
      },
      {
        metric: "Total jars delivered",
        value: data.summary.deliveredJars,
      },
      {
        metric: "Delivery value",
        value: data.summary.deliveryValue,
      },
      {
        metric: "Payment collections",
        value: data.summary.collections,
      },
    ],

    deliveries: data.deliveries.map((row) => ({
      date: row.delivery_date,
      customer: row.customers?.name || "Unknown Customer",
      jars: row.jar_quantity,
      rate: row.jar_rate,
      amount: row.amount,
    })),

    customers: data.customers.map((row) => ({
      name: row.name,
      phone: row.phone || "",
      status: row.status || "",
      opening_balance: Number(row.opening_balance || 0),
    })),

    payments: data.payments.map((row) => ({
      date: row.payment_date,
      customer: row.customers?.name || "Unknown Customer",
      method: row.payment_method || "",
      amount: row.amount,
    })),

    expenses: data.expenses.map((row) => ({
      date: row.expense_date,
      description: row.title,
      category: row.category,
      vendor: row.vendor || "",
      payment_method: row.payment_method || "",
      amount: row.amount,
    })),

    invoices: data.invoices.map((row) => ({
      date: row.invoice_date,
      invoice_number: row.invoice_number || "",
      customer: row.customers?.name || "Unknown Customer",
      total: row.total_amount,
      paid: row.paid_amount,
      balance: row.balance,
      status: row.status || "",
    })),

    businessSummary: [
      { metric: "Active customers", value: data.summary.activeCustomers },
      { metric: "Jars delivered", value: data.summary.deliveredJars },
      { metric: "Delivery value", value: data.summary.deliveryValue },
      { metric: "Collections", value: data.summary.collections },
      { metric: "Recorded expenses", value: data.summary.expenseTotal },
      { metric: "Invoice value", value: data.summary.invoiceValue },
      { metric: "Invoice outstanding", value: data.summary.outstandingInvoices },
      { metric: "Collections minus expenses", value: data.summary.operatingNet },
    ],

    employees: data.employeePerformance,

    employeePayments: data.salaryTransactions.map((row) => ({
      date: row.transaction_date,
      employee: row.employee_name,
      transaction_type: row.transaction_type,
      amount: row.amount,
      payment_method: row.payment_method || "",
      reference: row.reference || "",
      notes: row.notes || "",
    })),

    employeeAttendance: data.attendance.map((row) => ({
      date: row.attendance_date,
      employee: row.employee_name,
      status: row.status,
      notes: row.notes || "",
    })),

    events: [],
    eventPayments: [],
  };
}

function getColumns(reportId) {
  const columns = {
    monthlySales: [
      ["metric", "Particulars"],
      ["value", "Value"],
    ],
    deliveries: [
      ["date", "Date"],
      ["customer", "Customer"],
      ["jars", "Jars"],
      ["rate", "Rate"],
      ["amount", "Amount"],
    ],
    customers: [
      ["name", "Customer"],
      ["phone", "Phone"],
      ["status", "Status"],
      ["opening_balance", "Opening Balance"],
    ],
    payments: [
      ["date", "Date"],
      ["customer", "Customer"],
      ["method", "Method"],
      ["amount", "Amount"],
    ],
    expenses: [
      ["date", "Date"],
      ["description", "Description"],
      ["category", "Category"],
      ["vendor", "Vendor"],
      ["payment_method", "Payment Method"],
      ["amount", "Amount"],
    ],
    invoices: [
      ["date", "Date"],
      ["invoice_number", "Invoice No."],
      ["customer", "Customer"],
      ["total", "Total"],
      ["paid", "Paid"],
      ["balance", "Balance"],
      ["status", "Status"],
    ],
    businessSummary: [
      ["metric", "Particulars"],
      ["value", "Value"],
    ],
    employees: [
      ["employee_name", "Employee"],
      ["phone", "Phone"],
      ["role", "Role"],
      ["status", "Status"],
      ["monthly_salary", "Monthly Salary"],
      ["trips", "Trips"],
      ["jars_delivered", "Jars Delivered"],
      ["pending_jars", "Pending Jars"],
    ],
    employeePayments: [
      ["date", "Date"],
      ["employee", "Employee"],
      ["transaction_type", "Transaction Type"],
      ["amount", "Amount"],
      ["payment_method", "Method"],
      ["reference", "Reference"],
      ["notes", "Notes"],
    ],
    employeeAttendance: [
      ["date", "Date"],
      ["employee", "Employee"],
      ["status", "Status"],
      ["notes", "Notes"],
    ],
  };

  return columns[reportId] || [];
}

function ReportTable({ rows, columns }) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <FileText className="mx-auto text-slate-300" size={34} />
        <p className="mt-3 font-semibold text-slate-700">No records found</p>
        <p className="mt-1 text-sm text-slate-500">
          There are no records for this report in the selected month.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map(([key, label]) => (
                <th key={key} className="whitespace-nowrap px-5 py-3 font-semibold">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={row.id || index} className="text-slate-700">
                {columns.map(([key]) => (
                  <td key={key} className="whitespace-nowrap px-5 py-3">
                    {typeof row[key] === "number" &&
                    ["amount", "rate", "total", "paid", "balance", "monthly_salary", "opening_balance", "value"].includes(key)
                      ? money(row[key])
                      : row[key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        {rows.length} records
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [month, setMonth] = useState(currentMonth);
  const [selectedReport, setSelectedReport] = useState("monthlySales");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const previousTitle = document.title;
    const description =
      "Monthly business, sales, delivery, payment, expense and employee reports for Amrit Jal.";
    let meta = document.querySelector('meta[name="description"]');
    let robots = document.querySelector('meta[name="robots"]');

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }

    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }

    const previousDescription = meta.content;
    const previousRobots = robots.content;

    document.title = "Monthly Reports | Amrit Jal";
    meta.content = description;
    robots.content = "noindex,nofollow";

    return () => {
      document.title = previousTitle;
      meta.content = previousDescription;
      robots.content = previousRobots;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getMonthlyReportData(month);
      setData(result);
    } catch (err) {
      setError(err?.message || "Could not load monthly reports.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const reports = useMemo(() => (data ? buildReports(data) : {}), [data]);

  const selectedRows = reports[selectedReport] || [];
  const columns = getColumns(selectedReport);

  const selectedLabel =
    REPORTS.flatMap((group) => group.items).find(
      (item) => item.id === selectedReport
    )?.label || "Report";

  const exportExcel = () => {
    if (!selectedRows.length) {
      setError("No records available to export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(selectedRows);
    worksheet["!cols"] = columns.map(([key, label]) => ({
      wch: Math.max(
        label.length + 4,
        ...selectedRows.map((row) => String(row[key] ?? "").length + 2),
        12
      ),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");

    XLSX.writeFile(
      workbook,
      `amrit-jal-${selectedReport}-${month}.xlsx`
    );
  };

  const exportPdf = () => {
    if (!selectedRows.length) {
      setError("No records available to export.");
      return;
    }

    const doc = new jsPDF({
      orientation: columns.length > 5 ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(18);
    doc.text("AMRIT JAL", 14, 16);

    doc.setFontSize(11);
    doc.text(selectedLabel, 14, 24);

    doc.setFontSize(9);
    doc.text(`Reporting Month: ${monthLabel(month)}`, 14, 30);

    autoTable(doc, {
      startY: 36,
      head: [columns.map(([, label]) => label)],
      body: selectedRows.map((row) =>
        columns.map(([key]) => {
          const value = row[key];
          return value == null ? "—" : String(value);
        })
      ),
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [8, 145, 178],
        textColor: 255,
      },
      margin: { left: 14, right: 14 },
    });

    doc.save(`amrit-jal-${selectedReport}-${month}.pdf`);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-800">
              <BarChart3 size={20} />
              <span className="text-sm font-semibold">Business insights</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Monthly Reports
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Business performance, sales, finance and employee reporting.
            </p>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Reporting month
            <input
              type="month"
              value={month}
              max={currentMonth()}
              onChange={(event) => setMonth(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2.5"
            />
          </label>

          <button
            onClick={() => setMonth(currentMonth())}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Current month
          </button>

          <p className="text-xs text-slate-500 sm:ml-auto">
            {monthLabel(month)} · Actual saved records
          </p>
        </section>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            <span>{error}</span>
            <button onClick={load} className="font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {loading && !data ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Loading monthly reports...
          </div>
        ) : data ? (
          <>
            <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                title="Active customers"
                value={data.summary.activeCustomers}
                detail="Current active customer records"
                icon={Users}
              />
              <Metric
                title="Jars delivered"
                value={data.summary.deliveredJars.toLocaleString("en-IN")}
                detail={`${data.deliveries.length} delivery records`}
                icon={Droplets}
              />
              <Metric
                title="Delivery value"
                value={money(data.summary.deliveryValue)}
                detail="Recorded delivery value"
                icon={FileText}
              />
              <Metric
                title="Collections"
                value={money(data.summary.collections)}
                detail="Payments received this month"
                icon={Wallet}
              />
              <Metric
                title="Expenses"
                value={money(data.summary.expenseTotal)}
                detail="Recorded expenses"
                icon={Receipt}
              />
              <Metric
                title="Invoice outstanding"
                value={money(data.summary.outstandingInvoices)}
                detail="Balance on invoices dated this month"
                icon={Wallet}
              />
              <Metric
                title="Employees"
                value={data.summary.employeeCount}
                detail={`${data.summary.employeeTrips} dispatch trips`}
                icon={Truck}
              />
              <Metric
                title="Employee transactions"
                value={money(data.summary.employeePayments)}
                detail="Recorded financial transactions"
                icon={IndianRupee}
              />
            </section>

            <p className="mt-3 text-xs text-slate-500">
              Collections minus expenses is a cash movement indicator, not
              statutory profit. Employee transactions are reported as recorded
              in the financial transaction table; this figure is not a
              verified payroll calculation.
            </p>

            <div className="mt-7 grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
              <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="mb-4 text-sm font-bold text-slate-900">
                  Report categories
                </h2>

                <div className="space-y-5">
                  {REPORTS.map((group) => (
                    <div key={group.category}>
                      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {group.category}
                      </p>

                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const active = selectedReport === item.id;

                          return (
                            <button
                              key={item.id}
                              disabled={item.disabled}
                              onClick={() => {
                                setSelectedReport(item.id);
                                setError("");
                              }}
                              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                                active
                                  ? "bg-cyan-50 text-cyan-800"
                                  : "text-slate-600 hover:bg-slate-50"
                              } disabled:cursor-not-allowed disabled:opacity-40`}
                            >
                              <Icon size={16} />
                              <span className="flex-1">{item.label}</span>
                              {item.disabled && (
                                <span className="text-[10px]">Pending</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </aside>

              <section className="min-w-0">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedLabel}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {monthLabel(month)} · {selectedRows.length} records
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={exportExcel}
                      disabled={!selectedRows.length}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <FileSpreadsheet size={16} />
                      Excel
                    </button>

                    <button
                      onClick={exportPdf}
                      disabled={!selectedRows.length}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-40"
                    >
                      <Download size={16} />
                      PDF
                    </button>
                  </div>
                </div>

                <ReportTable rows={selectedRows} columns={columns} />
              </section>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>
                Event Report and Event Payment Report are not enabled yet.
                Their database schema and payment linkage need verification
                before they can be included in exports.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
