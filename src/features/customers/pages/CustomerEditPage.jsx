
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  UserRound,
  ShieldCheck,
  LoaderCircle,
  AlertCircle,
  X,
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

    if (customerId) {
      loadCustomer();
    } else {
      setError("Invalid customer ID.");
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [customerId, getCustomerById]);

  // SEO METADATA
  // Must remain above all conditional returns.
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
      customer?.name ||
      customer?.customerName ||
      "Customer";

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
      <main className="flex min-h-screen items-center justify-center bg-[#F4F8FA] px-4">
        <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
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

  // CUSTOMER NOT FOUND STATE
  if (!customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F8FA] px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
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
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#102C46] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173D5E]"
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
    <main className="min-h-screen bg-[#F4F8FA] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* BACK NAVIGATION */}
        <Link
          to={`/customers/${customerId}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-teal-700"
        >
          <ArrowLeft size={17} />
          Back to Customer Profile
        </Link>

        {/* PAGE HEADER */}
        <header className="relative mb-7 overflow-hidden rounded-2xl bg-gradient-to-br from-[#102C46] via-[#123F59] to-[#087F83] p-6 text-white shadow-lg shadow-slate-900/10 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 size-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-3 -top-7 size-44 rounded-full border border-white/10" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                <Pencil size={22} />
              </div>

              <div className="min-w-0">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-100">
                  Customer Management
                </p>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Edit Customer
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">
                  Update customer details, product preferences and account
                  information for {customer.name}.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {customer.code && (
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                      {customer.code}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-teal-50">
                    <UserRound size={13} />
                    Existing Customer
                  </span>
                </div>
              </div>
            </div>

            <Link
              to={`/customers/${customerId}`}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <X size={16} />
              Cancel
            </Link>
          </div>
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* CUSTOMER FORM CARD */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

          {/* SECTION HEADER */}
          <div className="flex items-start gap-3 border-b border-slate-100 bg-white px-5 py-5 sm:px-7">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h2 className="text-base font-bold text-[#102C46]">
                Customer Information
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Update the required information and save your changes.
              </p>
            </div>
          </div>

          {/* EXISTING CUSTOMER FORM */}
          <div className="p-4 sm:p-7">
            <CustomerForm
              key={customer.id}
              initialData={customer}
              onSubmit={handleUpdate}
              onCancel={() => navigate(`/customers/${customerId}`)}
              submitting={submitting}
            />
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-400">
          <ShieldCheck size={14} className="text-teal-600" />
          <span>Amrit Jal</span>
          <span>·</span>
          <span>Customer Records Management</span>
        </footer>
      </div>
    </main>
  );
}
