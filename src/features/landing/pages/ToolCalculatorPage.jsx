
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import LandingNavbar from "../../../components/landing/LandingNavbar";
import LandingFooter from "../../../components/landing/LandingFooter";

import ToolCard from "../components/ToolCard";
import { getToolById, tools } from "../data/tools";
import { calculatorFunctions } from "../utils/calculators";

import "../styles/tools.css";

const DEFAULT_TITLE =
  "Amrit Jal – Water Delivery & Jar Business Management Software";

export default function ToolCalculatorPage() {
  const { toolId } = useParams();

  const tool = useMemo(() => getToolById(toolId), [toolId]);

  const initialValues = useMemo(() => {
    if (!tool) return {};

    return Object.fromEntries(
      tool.fields.map((field) => [
        field.name,
        String(field.defaultValue ?? ""),
      ])
    );
  }, [tool]);

  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const result = useMemo(() => {
    if (!tool) return null;

    try {
      const calculate = calculatorFunctions[tool.id];

      if (!calculate) return null;

      for (const field of tool.fields) {
        const value = values[field.name];

        if (
          value === "" ||
          value === undefined ||
          !Number.isFinite(Number(value))
        ) {
          return null;
        }

        const number = Number(value);

        if (field.min !== undefined && number < field.min) {
          return null;
        }

        if (field.max !== undefined && number > field.max) {
          return null;
        }
      }

      return calculate(values);
    } catch {
      return null;
    }
  }, [tool, values]);

  const error = useMemo(() => {
    if (!tool) return "";

    for (const field of tool.fields) {
      const value = values[field.name];

      if (value === "" || value === undefined) {
        return `Enter ${field.label.toLowerCase()} to see your result.`;
      }

      const number = Number(value);

      if (!Number.isFinite(number)) {
        return `Enter a valid value for ${field.label.toLowerCase()}.`;
      }

      if (field.min !== undefined && number < field.min) {
        return `${field.label} must be at least ${field.min}.`;
      }

      if (field.max !== undefined && number > field.max) {
        return `${field.label} cannot exceed ${field.max}.`;
      }
    }

    return "";
  }, [tool, values]);

  useEffect(() => {
    if (!tool) {
      document.title = DEFAULT_TITLE;
      return;
    }

    document.title = tool.seoTitle;

    const updateMeta = (name, content) => {
      let meta = document.head.querySelector(
        `meta[name="${name}"]`
      );

      if (!meta) {
        meta = document.createElement("meta");
        meta.name = name;
        document.head.appendChild(meta);
      }

      meta.content = content;
    };

    updateMeta("description", tool.seoDescription);
    updateMeta("robots", "index, follow");

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [tool]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleReset = () => {
    setValues(initialValues);
  };

  const relatedTools = tools.filter(
    (item) => item.id !== tool?.id
  );

  if (!tool) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F7F8F5]">
        <LandingNavbar />

        <main className="flex flex-1 flex-col items-center justify-center px-5 py-24 text-center">
          <h1 className="text-3xl font-black text-[#101F35]">
            Calculator not found
          </h1>

          <p className="mt-3 text-sm text-[#64748B]">
            The requested calculator does not exist.
          </p>

          <Link
            to="/tools"
            className="mt-6 rounded-full bg-[#087E85] px-6 py-3 text-sm font-bold text-white hover:bg-[#06686E]"
          >
            Explore all tools
          </Link>
        </main>

        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCFA] text-[#101F35]">
      <LandingNavbar />

      <main>
        {/* HERO */}
        <section className="tools-hero px-5 pb-10 pt-8 sm:px-8 sm:pb-12 sm:pt-10 lg:px-14">
          <div className="relative z-10 mx-auto max-w-[1110px]">

            <nav
              aria-label="Breadcrumb"
              className="mb-7 flex flex-wrap items-center gap-2 text-xs font-medium text-[#526171]"
            >
              <Link to="/" className="transition hover:text-[#087E85]">
                Home
              </Link>

              <span aria-hidden="true">›</span>

              <Link to="/tools" className="transition hover:text-[#087E85]">
                Tools
              </Link>

              <span aria-hidden="true">›</span>

              <span aria-current="page" className="text-[#101F35]">
                {tool.shortTitle}
              </span>
            </nav>

            <div className="flex items-start gap-4">
              <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl border border-[#DDE8E7] bg-white text-[#087E85] shadow-sm sm:flex">
                <span className="text-lg font-bold">
                  {tool.number}
                </span>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#DDE8E7] bg-white px-3 py-1.5">
                  <span className="size-1.5 rounded-full bg-[#20C5C4]" />
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#263D55] sm:text-[10px]">
                    Free tool · No signup
                  </span>
                </div>

                <h1 className="mt-4 text-balance text-[32px] font-black leading-[1.12] tracking-[-0.04em] text-[#101F35] sm:text-4xl lg:text-[46px]">
                  {tool.title}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526171] sm:text-base">
                  {tool.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* COMPACT CALCULATOR */}
        <section className="bg-[#FCFCFA] px-5 py-9 sm:px-8 sm:py-12">
          <div className="mx-auto max-w-[760px]">

            <div className="rounded-[20px] border border-[#E0E7EC] bg-white p-5 shadow-[0_12px_35px_rgba(16,31,53,0.045)] sm:rounded-[24px] sm:p-7">

              {/* INPUTS */}
              <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">

                {tool.fields.map((field) => (
                  <div key={field.name} className="min-w-0">
                    <label
                      htmlFor={field.name}
                      className="mb-2 block text-xs font-semibold text-[#263D55]"
                    >
                      {field.label}
                    </label>

                    <div className="relative">
                      {field.unit === "₹" && (
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#64748B]">
                          ₹
                        </span>
                      )}

                      <input
                        id={field.name}
                        name={field.name}
                        type="number"
                        inputMode="decimal"
                        step={field.step || "any"}
                        min={field.min}
                        max={field.max}
                        value={values[field.name] ?? ""}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        aria-describedby={`${field.name}-unit`}
                        className={`tools-input w-full rounded-xl border border-[#DDE4E9] bg-white py-3 text-sm font-medium text-[#263D55] outline-none transition focus:border-[#087E85] focus:ring-2 focus:ring-[#087E85]/10 ${
                          field.unit === "₹" ? "pl-8 pr-3" : "px-3 pr-20"
                        }`}
                      />

                      {field.unit !== "₹" && (
                        <span
                          id={`${field.name}-unit`}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#64748B]"
                        >
                          {field.unit}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* RESULT */}
              <div
                aria-live="polite"
                aria-atomic="true"
                className="mt-6 rounded-xl border border-[#DFE6ED] bg-[#F5F4EF] p-4 sm:p-5"
              >
                {result ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#526171]">
                      {result.title}
                    </p>

                    <p className="mt-1 break-words text-3xl font-black tracking-tight text-[#101F35] sm:text-4xl">
                      {result.primaryValue}
                    </p>

                    {result.status && (
                      <p className="mt-2 text-xs font-bold text-[#087E85]">
                        {result.status}
                      </p>
                    )}

                    {result.description && (
                      <p className="mt-2 text-xs leading-5 text-[#526171]">
                        {result.description}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-1 gap-4 border-t border-[#DDE3E8] pt-4 sm:grid-cols-3">
                      {result.details.map((item) => (
                        <div key={item.label} className="min-w-0">
                          <p className="text-[10px] text-[#64748B]">
                            {item.label}
                          </p>

                          <p className="mt-1 break-words text-xs font-bold text-[#263D55]">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {result.note && (
                      <p className="mt-4 border-t border-[#DDE3E8] pt-3 text-[10px] leading-5 text-[#64748B]">
                        {result.note}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="py-5 text-center">
                    <p className="text-sm font-bold text-[#263D55]">
                      Your result will appear here
                    </p>

                    <p className="mt-1 text-xs text-[#64748B]">
                      {error || "Enter your details to see the calculation."}
                    </p>
                  </div>
                )}
              </div>

              {/* RESET */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-[10px] leading-5 text-[#8291A0]">
                  Results update automatically as you edit the values.
                </p>

                <button
                  type="button"
                  onClick={handleReset}
                  className="shrink-0 rounded-full border border-[#DDE4E9] px-4 py-2 text-xs font-bold text-[#526171] transition hover:border-[#087E85] hover:text-[#087E85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E85]/30"
                >
                  Reset
                </button>
              </div>
            </div>

            <p className="mt-3 text-[10px] leading-5 text-[#8291A0]">
              General estimates only. Not a substitute for professional water testing or advice.
            </p>
          </div>
        </section>

        {/* MORE FREE TOOLS */}
        <section className="bg-[#F5F4EF] px-5 py-12 sm:px-8 sm:py-14 lg:px-14">
          <div className="mx-auto max-w-[1110px]">

            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-xl font-black tracking-tight text-[#101F35] sm:text-2xl">
                More free tools
              </h2>

              <Link
                to="/tools"
                className="shrink-0 text-xs font-semibold text-[#263D55] transition hover:text-[#087E85]"
              >
                ← All tools
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedTools.map((relatedTool) => (
                <ToolCard key={relatedTool.id} tool={relatedTool} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
