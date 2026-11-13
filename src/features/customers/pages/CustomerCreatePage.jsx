
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserRoundPlus,
  ShieldCheck,
  Droplets,
  Wallet,
  UserRound,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import CustomerForm from "../components/CustomerForm";
import { useCustomers } from "../hooks/useCustomers";

export default function CustomerCreatePage() {
  const navigate = useNavigate();
  const { createCustomer } = useCustomers();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(formData) {
    setSubmitting(true);
    setError("");

    try {
      const customer = await createCustomer(formData);
      navigate(`/customers/${customer.id}`);
      
      if (!customer?.id) {
        throw new Error(
          "Customer was saved, but its record ID was not returned."
        );
      }

      navigate(`/customers/${customer.id}`);
    } catch (err) {
      setError(
        err?.message ||
        "Unable to save the customer. Please try again."
      );
      throw err;
    } finally {
      setSubmitting(false);
    }
  }


  useEffect(() => {
    const previousTitle = document.title;

    const descriptionMeta = document.querySelector(
      'meta[name="description"]'
    );
    const robotsMeta = document.querySelector(
      'meta[name="robots"]'
    );

    const previousDescription = descriptionMeta?.content;
    const previousRobots = robotsMeta?.content;

    const description =
      descriptionMeta || document.createElement("meta");
    const robots = robotsMeta || document.createElement("meta");

    document.title = "Add Customer | Amrit Jal";

    description.name = "description";
    description.content =
      "Add a new customer to Amrit Jal. Manage customer contact details, delivery preferences, jar rates and account information.";

    robots.name = "robots";
    robots.content = "noindex, nofollow";

    if (!descriptionMeta) document.head.appendChild(description);
    if (!robotsMeta) document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;

      if (descriptionMeta) {
        description.content = previousDescription || "";
      } else {
        description.remove();
      }

      if (robotsMeta) {
        robots.content = previousRobots || "";
      } else {
        robots.remove();
      }
    };
  }, []);


  return (
    <main className="min-h-screen bg-[#F4F7FA] px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Back navigation */}
        <div className="mb-5">
          <Link
            to="/customers"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-teal-700"
          >
            <span className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white transition group-hover:border-teal-200 group-hover:bg-teal-50">
              <ArrowLeft size={17} />
            </span>
            Back to Customers
          </Link>
        </div>

        {/* Page header */}
        <header className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#102B46] via-[#12485D] to-[#087F83] p-5 text-white shadow-lg shadow-slate-900/10 sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 size-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-2 -top-7 size-44 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-24 right-36 size-48 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner sm:size-14">
                <UserRoundPlus size={26} />
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-100">
                    Customer Management
                  </span>

                  <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-teal-50">
                    NEW CUSTOMER
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Add New Customer
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">
                  Create a customer account, configure jar pricing and
                  record the opening balance.
                </p>
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-teal-50 lg:flex">
              <ShieldCheck size={19} />
              Secure Registration
            </div>
          </div>

          {/* Header highlights */}
          <div className="relative mt-7 grid grid-cols-3 gap-2 border-t border-white/15 pt-5 sm:max-w-xl sm:gap-5">
            <div className="flex items-center gap-2">
              <UserRound size={17} className="shrink-0 text-teal-200" />
              <span className="text-xs text-slate-200">
                Customer Details
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Droplets size={17} className="shrink-0 text-teal-200" />
              <span className="text-xs text-slate-200">
                Jar Pricing
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Wallet size={17} className="shrink-0 text-teal-200" />
              <span className="text-xs text-slate-200">
                Account Balance
              </span>
            </div>
          </div>
        </header>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">Customer could not be saved</p>
              <p className="mt-1 leading-5">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="shrink-0 rounded-lg p-1 hover:bg-rose-100"
            >
              ×
            </button>
          </div>
        )}

        {/* Form section */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Customer Registration Form
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the details below to create a new customer account.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800">
              <CheckCircle2 size={14} />
              Database Connected Flow
            </div>
          </div>

          <div className="p-3 sm:p-6 lg:p-7">
            <CustomerForm
              onSubmit={handleCreate}
              onCancel={() => navigate("/customers")}
              submitting={submitting}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-5 flex flex-col items-center justify-center gap-2 pb-3 text-center">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <ShieldCheck size={14} className="text-teal-700" />
            Customer information is saved through your existing account service.
          </div>

          <p className="text-[11px] text-slate-400">
            Amrit Jal · Customer Management
          </p>
        </footer>

      </div>
    </main>
  );
}
