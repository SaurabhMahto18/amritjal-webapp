
import EmployeeSections from "./EmployeeSections";
import { formatINR } from "../utils/payroll";

export default function EmployeeDetail({ employee }) {
  if (!employee) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-500">
        Employee information not available.
      </div>
    );
  }

  const role = (employee.role || "employee")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const isActive = employee.status === "active";

  const initials = (employee.name || "E")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-5">

      {/* COMPACT EMPLOYEE PROFILE */}
      <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">

        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">

          {/* Avatar + Name */}
          <div className="flex min-w-[230px] flex-1 items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-xl font-bold text-cyan-700">
              {initials}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-bold text-slate-900">
                  {employee.name}
                </h2>

                <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">
                  {role}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {employee.phone || "Phone not available"}
              </p>
            </div>
          </div>

          {/* Joining Date */}
          <div className="min-w-[125px]">
            <p className="text-xs text-slate-400">JOINED ON</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {employee.joining_date || "—"}
            </p>
          </div>

          {/* Monthly Salary */}
          <div className="min-w-[145px]">
            <p className="text-xs text-slate-400">MONTHLY SALARY</p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {formatINR(employee.monthly_salary)}
            </p>
          </div>

          {/* Address */}
          <div className="min-w-[150px] max-w-[220px] flex-1">
            <p className="text-xs text-slate-400">ADDRESS</p>
            <p className="mt-1 truncate text-sm font-medium text-slate-800">
              {employee.address || "Not added"}
            </p>
          </div>

        </div>
      </section>

      {/* EMPLOYEE MANAGEMENT */}
<section>
  <EmployeeSections employee={employee} />
</section>

    </div>
  );
}
