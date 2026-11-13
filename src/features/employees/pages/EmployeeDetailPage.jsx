
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, LoaderCircle, AlertCircle } from "lucide-react";

import { employeeService } from "../services/employeeService";
import EmployeeDetail from "../components/EmployeeDetail";

export default function EmployeeDetailPage() {
  const { employeeId } = useParams();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // SEO metadata
  useEffect(() => {
    const previousTitle = document.title;

    const descriptionSelector = 'meta[name="description"]';
    const robotsSelector = 'meta[name="robots"]';

    const previousDescription =
      document.head.querySelector(descriptionSelector);

    const previousRobots =
      document.head.querySelector(robotsSelector);

    const oldDescription =
      previousDescription?.getAttribute("content");

    const oldRobots =
      previousRobots?.getAttribute("content");

    const description =
      previousDescription || document.createElement("meta");

    const robots =
      previousRobots || document.createElement("meta");

    document.title = "Employee Profile | Amrit Jal";

    description.name = "description";
    description.content =
      "Manage employee information, attendance, salary, wallet, documents and daily operations.";

    robots.name = "robots";
    robots.content = "noindex, nofollow";

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

  // Load employee
  useEffect(() => {
    let active = true;

    async function loadEmployee() {
      setLoading(true);
      setError("");

      try {
        const result = await employeeService.get(employeeId);

        if (!active) return;

        if (!result) {
          setEmployee(null);
          setError("Employee not found.");
        } else {
          setEmployee(result);
        }
      } catch (err) {
        if (active) {
          setEmployee(null);
          setError(
            err?.message || "Unable to load employee."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (employeeId) {
      loadEmployee();
    } else {
      setError("Invalid employee ID.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [employeeId]);

  const isActive = employee?.status === "active";

  return (
    <main className="min-h-screen bg-[#F4F8FA] px-4 py-5 sm:px-6 lg:px-8">

      {/* TOP ACTIONS */}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

        <Link
          to="/employees"
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-900"
        >
          <ArrowLeft size={17} />
          Back to Employees
        </Link>

        {!loading && employee && (
          <span
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
              isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <span className="size-2 rounded-full bg-current" />
            {isActive ? "Active Employee" : "Inactive Employee"}
          </span>
        )}
      </div>

      {/* LOADING */}

      {loading ? (
        <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8">
          <LoaderCircle
            size={28}
            className="animate-spin text-teal-700"
          />

          <p className="mt-3 text-sm font-medium text-slate-500">
            Loading employee profile...
          </p>
        </div>
      ) : error ? (
        /* ERROR */

        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <AlertCircle size={18} />
            Unable to open employee profile
          </div>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <Link
            to="/employees"
            className="mt-4 inline-flex text-sm font-semibold text-red-700 underline"
          >
            Back to Employees
          </Link>
        </div>
      ) : (
        /* EMPLOYEE DETAILS */

        <EmployeeDetail employee={employee} />
      )}
    </main>
  );
}
