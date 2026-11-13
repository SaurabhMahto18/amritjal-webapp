import { useState } from "react";
import {
  CalendarDays, Truck, Wallet, FileText, Activity, Banknote,
} from "lucide-react";
import AttendanceLeaveTab from "./AttendanceLeaveTab";
import DeliveryPerformanceTab from "./DeliveryPerformanceTab";
import SalaryHistoryTab from "./SalaryHistoryTab";
import EmployeeWalletTab from "./EmployeeWalletTab";
import EmployeeDocumentsTab from "./EmployeeDocumentsTab";
import EmployeeActivityTab from "./EmployeeActivityTab";

const TABS = [
  { id: "attendance", label: "Attendance", icon: CalendarDays },
  { id: "performance", label: "Performance", icon: Truck },
  { id: "salary", label: "Salary", icon: Banknote },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "activity", label: "Activity", icon: Activity },
];

export default function EmployeeSections({ employee }) {
  const [activeTab, setActiveTab] = useState("attendance");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  if (!employee?.id) return null;

  const content = {
    attendance: <AttendanceLeaveTab employee={employee} month={month} />,
    performance: <DeliveryPerformanceTab employee={employee} month={month} />,
    salary: <SalaryHistoryTab employee={employee} month={month} />,
    wallet: <EmployeeWalletTab employee={employee} month={month} />,
    documents: <EmployeeDocumentsTab employee={employee} />,
    activity: <EmployeeActivityTab employee={employee} />,
  };

  return (
    <section className="mt-6 space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Employee Management</h2>
            <p className="mt-1 text-sm text-slate-500">
              {employee.name} · {String(employee.role || "Employee").replaceAll("_", " ")}
            </p>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-600">
            Month
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
          </label>
        </div>

        {/* One horizontal row at every breakpoint. Mobile can scroll; it never wraps. */}
        <div className="-mx-1 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
          <div
            role="tablist"
            aria-label="Employee sections"
            className="flex min-w-[720px] flex-nowrap gap-2"
          >
            {TABS.map(({ id, label, icon: Icon }) => {
              const selected = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`employee-tab-${id}`}
                  aria-selected={selected}
                  aria-controls={`employee-panel-${id}`}
                  onClick={() => setActiveTab(id)}
                  className={`flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                    selected
                      ? "border-cyan-700 bg-cyan-700 text-white shadow-sm"
                      : "border-transparent bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        id={`employee-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`employee-tab-${activeTab}`}
        className="min-w-0"
      >
        {content[activeTab]}
      </div>
    </section>
  );
}
