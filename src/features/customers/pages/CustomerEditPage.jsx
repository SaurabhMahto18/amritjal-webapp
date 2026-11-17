
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  UserRound,
  ShieldCheck,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

import CustomerForm from "../components/CustomerForm";
import { useCustomers } from "../hooks/useCustomers";

export default function CustomerEditPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const { getCustomerById, updateCustomer } = useCustomers();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // LOAD CUSTOMER
  useEffect(() => {
    let isMounted = true;

    async function loadCustomer() {
      setLoading(true);
      setError("");
      setCustomer(null);

      try {
        const existing = await getCustomerById(customerId);

        if (!isMounted) return;

        if (!existing || existing.archived) {
          setError(
            "This customer could not be found or has been archived."
          );
          setCustomer(null);
        } else {
          setCustomer(existing);
        }
      } catch (err) {
        console.error("Failed to load customer:", err);

        if (isMounted) {
          setError(
            err?.message ||
              "Unable to load customer details. Please try again."
          );
          setCustomer(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (!customerId) {
      setError("Invalid customer ID.");
      setLoading(false);
    } else {
      loadCustomer();
    }

    return () => {
      isMounted = false;
    };
  }, [customerId, getCustomerById]);

  // SEO METADATA
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

    const robots =
      robotsMeta || document.createElement("meta");

    const customerName =
      customer?.name || customer?.customerName || "Customer";

    document.title = `Edit ${customerName} | Amrit Jal`;

    description.name = "description";
    description.content = customer
      ? `Update ${customerName}'s contact details, delivery preferences, jar rates and account information in Amrit Jal.`
      : "Edit customer details, delivery preferences and account information in Amrit Jal.";

    robots.name = "robots";
    robots.content = "noindex, nofollow";

    if (!descriptionMeta) {
      document.head.appendChild(description);
    }

    if (!robotsMeta) {
      document.head.appendChild(robots);
    }

    return () => {
      document.title = previousTitle;

      if (descriptionMeta) {
        descriptionMeta.content = previousDescription || "";
      } else {
        description.remove();
      }

      if (robotsMeta) {
        robotsMeta.content = previousRobots || "";
      } else {
        robots.remove();
      }
    };
  }, [customer]);

  // UPDATE CUSTOMER
  async function handleUpdate(formData) {
    setSubmitting(true);
    setError("");

    try {
      await updateCustomer(customerId, formData);

      navigate(`/customers/${customerId}`);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update customer details. Please try again."
      );

      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  // LOADING STATE
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50/80 px-4 py-6">
        <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-9 shadow-sm sm:px-8">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-50">
            <LoaderCircle
              size={30}
              className="animate-spin text-teal-700"
            />
          </div>

          <h2 className="mt-5 text-base font-bold text-slate-800">
            Loading Customer
          </h2>

          <p className="mt-2 text-center text-sm text-slate-500">
            Retrieving customer information. Please wait.
          </p>
        </div>
      </main>
    );
  }

  // CUSTOMER NOT FOUND
  if (!customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50/80 px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertCircle size={27} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Customer Unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || "This customer could not be found."}
          </p>

          <Link
            to="/customers"
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 sm:w-auto"
          >
            <ArrowLeft size={16} />
            Back to Customers
          </Link>
        </div>
      </main>
    );
  }

  // MAIN PAGE
  return (
    <main className="min-h-screen bg-slate-50/80 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-5xl">

        {/* BACK NAVIGATION */}
        <Link
          to={`/customers/${customerId}`}
          className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg py-2 text-sm font-medium text-slate-500 transition hover:text-teal-700 sm:mb-6"
        >
          <ArrowLeft size={17} />
          Back to customer profile
        </Link>

        {/* PAGE HEADER */}
        <header className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-700 p-4 text-white shadow-lg shadow-teal-900/10 sm:mb-7 sm:p-6 lg:p-8">

          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full border border-white/10 sm:size-64" />
          <div className="pointer-events-none absolute -right-4 -top-7 size-40 rounded-full border border-white/10 sm:size-44" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 sm:size-12">
                <Pencil size={22} aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100 sm:mb-2 sm:text-xs sm:tracking-[0.18em]">
                  Customer Management
                </p>

                <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
                  Edit Customer
                </h1>

                <p className="mt-2 max-w-xl break-words text-xs leading-5 text-teal-50/90 sm:text-sm sm:leading-6">
                  Update contact details, jar pricing and account information
                  for {customer.name || customer.customerName || "this customer"}.
                </p>

                {/* Customer badges */}
                <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
                  {customer.code && (
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold sm:text-xs">
                      {customer.code}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-teal-50 sm:text-xs">
                    <UserRound size={13} />
                    Existing Customer
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop information badge */}
            <div className="hidden shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white sm:inline-flex">
              <ShieldCheck size={16} />
              Customer Record
            </div>
          </div>
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 sm:p-4"
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />
            <p className="leading-5">{error}</p>
          </div>
        )}

        {/* CUSTOMER FORM */}
        <div className="w-full min-w-0">
          <CustomerForm
            key={customer.id}
            initialData={customer}
            onSubmit={handleUpdate}
            onCancel={() => navigate(`/customers/${customerId}`)}
            submitting={submitting}
          />
        </div>

        {/* FOOTER */}
        <footer className="mt-6 flex flex-wrap items-center justify-center gap-2 pb-3 text-center text-xs font-medium text-slate-400 sm:mt-7">
          <ShieldCheck size={14} className="text-teal-600" />
          <span>Amrit Jal</span>
          <span>·</span>
          <span>Customer Records Management</span>
        </footer>
      </div>
    </main>
  );
}
