
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  Wallet,
  Plus,
  Search,
  Pencil,
  RefreshCw,
  X,
  AlertCircle,
} from "lucide-react";

import { useEmployees } from "../hooks/useEmployees";
import { employeeService } from "../services/employeeService";
import EmployeeForm from "../components/EmployeeForm";
import { formatINR } from "../utils/payroll";

export default function EmployeesPage() {
  const {
    employees = [],
    search,
    setSearch,
    status,
    setStatus,
    loading,
    error,
    refresh,
  } = useEmployees();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  // Private page SEO metadata.
  useEffect(() => {
    const previousTitle = document.title;

    const descriptionSelector = 'meta[name="description"]';
    const robotsSelector = 'meta[name="robots"]';

    const previousDescription =
      document.head.querySelector(descriptionSelector);

    const previousRobots =
      document.head.querySelector(robotsSelector);

    const description =
      previousDescription || document.createElement("meta");

    const robots =
      previousRobots || document.createElement("meta");

    const oldDescription =
      previousDescription?.getAttribute("content");

    const oldRobots =
      previousRobots?.getAttribute("content");

    document.title = "Employees | Amrit Jal";

    description.setAttribute("name", "description");
    description.setAttribute(
      "content",
      "Manage employee profiles, fixed monthly salaries, personal expenses and daily jar dispatch in Amrit Jal."
    );

    robots.setAttribute("name", "robots");
    robots.setAttribute("content", "noindex, nofollow");

    if (!previousDescription) {
      document.head.appendChild(description);
    }

    if (!previousRobots) {
      document.head.appendChild(robots);
    }

    return () => {
      document.title = previousTitle;

      if (previousDescription) {
        if (oldDescription === null) {
          previousDescription.removeAttribute("content");
        } else {
          previousDescription.setAttribute(
            "content",
            oldDescription || ""
          );
        }
      } else {
        description.remove();
      }

      if (previousRobots) {
        if (oldRobots === null) {
          previousRobots.removeAttribute("content");
        } else {
          previousRobots.setAttribute(
            "content",
            oldRobots || ""
          );
        }
      } else {
        robots.remove();
      }
    };
  }, []);

  const activeEmployees = useMemo(
    () =>
      employees.filter(
        (employee) => employee.status === "active"
      ),
    [employees]
  );

  const monthlySalary = useMemo(
    () =>
      activeEmployees.reduce(
        (total, employee) =>
          total + Number(employee.monthly_salary || 0),
        0
      ),
    [activeEmployees]
  );

  async function saveEmployee(employee) {
    try {
      setSaving(true);
      setSaveError("");

      await employeeService.save(employee);

      setOpen(false);
      setEditing(null);

      await refresh();
    } catch (err) {
      setSaveError(
        err?.message || "Unable to save employee."
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function openAddModal() {
    setEditing(null);
    setSaveError("");
    setOpen(true);
  }

  function openEditModal(employee) {
    setEditing(employee);
    setSaveError("");
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setOpen(false);
    setEditing(null);
    setSaveError("");
  }

  const summaryCards = [
    {
      label: "Total Employees",
      value: employees.length,
      icon: Users,
      iconClass: "bg-slate-100 text-[#102C46]",
    },
    {
      label: "Active Employees",
      value: activeEmployees.length,
      icon: UserCheck,
      iconClass: "bg-teal-50 text-teal-700",
    },
    {
      label: "Monthly Fixed Salary",
      value: formatINR(monthlySalary),
      icon: Wallet,
      iconClass: "bg-blue-50 text-blue-700",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F4F8FA] text-slate-800">
      <div className="mx-auto max-w-[1500px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">


        {/* PAGE ACTION */}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            <Plus size={17} />
            Add Employee
          </button>
        </div>


        {/* SUMMARY CARDS */}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-500">
                    {card.label}
                  </p>

                  <div
                    className={`flex size-9 items-center justify-center rounded-xl ${card.iconClass}`}
                  >
                    <Icon size={18} />
                  </div>
                </div>

                <p className="mt-2 break-words text-xl font-bold text-[#102C46]">
                  {card.value}
                </p>
              </div>
            );
          })}
        </section>

        {/* EMPLOYEE TABLE */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* SEARCH AND FILTER */}

          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                className="min-h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10"
                placeholder="Search employee or mobile..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <select
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-600"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* ERROR */}

          {(error || saveError) && (
            <div
              role="alert"
              className="flex items-start gap-2 border-b border-red-100 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0"
              />
              <span>{saveError || error}</span>
            </div>
          )}

          {/* LOADING */}

          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw
                size={25}
                className="mx-auto animate-spin text-teal-700"
              />

              <p className="mt-3 text-sm font-medium text-slate-500">
                Loading employees...
              </p>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center">
              <Users
                size={34}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-3 font-bold text-[#102C46]">
                No employees found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add an employee or change your search filters.
              </p>

              <button
                type="button"
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <Plus size={16} />
                Add Employee
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">

                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">
                      Employee
                    </th>

                    <th className="px-4 py-3.5">
                      Mobile
                    </th>

                    <th className="px-4 py-3.5">
                      Role
                    </th>

                    <th className="px-4 py-3.5">
                      Fixed Monthly Salary
                    </th>

                    <th className="px-4 py-3.5">
                      Status
                    </th>

                    <th className="px-4 py-3.5 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          className="font-semibold text-[#102C46] transition hover:text-teal-700"
                          to={`/employees/${employee.id}`}
                        >
                          {employee.name}
                        </Link>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        {employee.phone || "—"}
                      </td>

                      <td className="px-4 py-3.5 capitalize text-slate-600">
                        {(employee.role || "—").replaceAll(
                          "_",
                          " "
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-[#102C46]">
                        {formatINR(employee.monthly_salary)}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${employee.status === "active"
                              ? "bg-teal-50 text-teal-700"
                              : "bg-slate-100 text-slate-600"
                            }`}
                        >
                          {employee.status || "Unknown"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(employee)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ADD / EDIT MODAL */}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#102C46]/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#102C46]">
                  {editing ? "Edit Employee" : "Add Employee"}
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Employee details and fixed monthly salary
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-5">
              <EmployeeForm
                employee={editing}
                onSave={saveEmployee}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
