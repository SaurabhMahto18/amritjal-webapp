
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Receipt,
  ShieldCheck,
} from "lucide-react";

import expenseService from "../services/expenseService";
import ExpenseForm from "../components/ExpenseForm";

export default function ExpenseCreatePage() {
  const navigate = useNavigate();

  const [pageError, setPageError] = useState("");

  const handleSubmit = async (form) => {
    setPageError("");

    try {
      await expenseService.create(form);

      navigate("/expenses", {
        replace: true,
        state: {
          success: "Expense recorded successfully.",
        },
      });
    } catch (error) {
      setPageError(
        error?.message || "Unable to record expense."
      );

      throw error;
    }
  };


  
  // SEO: Create Expense page
  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Record Expense | Amrit Jal";

    const setMeta = (name, content) => {
      let element = document.head.querySelector(
        `meta[name="${name}"]`
      );

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("name", name);
        document.head.appendChild(element);
      }

      const previousContent = element.getAttribute("content");

      element.setAttribute("content", content);

      return () => {
        if (previousContent === null) {
          element.remove();
        } else {
          element.setAttribute("content", previousContent);
        }
      };
    };

    const cleanups = [
      setMeta(
        "description",
        "Record and manage business expenses, payment methods and expense details in Amrit Jal."
      ),
      setMeta("robots", "noindex, nofollow"),
      setMeta("googlebot", "noindex, nofollow"),
    ];

    return () => {
      document.title = previousTitle;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);


  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">

      {/* BACK BUTTON */}
      <button
        type="button"
        onClick={() => navigate("/expenses")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-cyan-700"
      >
        <ArrowLeft size={18} />
        Back to Expenses
      </button>

      {/* PAGE HEADER */}
      <div className="flex items-center gap-4">

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
          <Receipt size={27} />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Record Expense
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Add and maintain your business expense records.
          </p>
        </div>

      </div>

      {/* ERROR */}
      {pageError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {pageError}
        </div>
      )}

      {/* EXPENSE FORM */}
      <ExpenseForm
        onSubmit={handleSubmit}
        onCancel={() => navigate("/expenses")}
        submitLabel="Save Expense"
      />

      {/* FOOTER NOTE */}
      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
        <ShieldCheck
          size={16}
          className="mt-0.5 shrink-0 text-cyan-700"
        />

        <p>
          Expense records are saved under your business account.
          Please verify the amount, date and payment method before saving.
        </p>
      </div>

    </div>
  );
}
