
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

import {
  getMyPayments,
  getMySubscription,
} from "../services/subscriptionService";

const FALLBACK_PLANS = [
  { code: "free_start", name: "Free Start", description: "Everything you need to get started.", max_customers: 25, price_monthly: 0, price_yearly: 0 },
  { code: "growth_starter", name: "Growth Starter", description: "For growing businesses getting organised.", max_customers: 50, price_monthly: 59, price_yearly: 590 },
  { code: "growth", name: "Growth", description: "More room for your expanding business.", max_customers: 100, price_monthly: 109, price_yearly: 1090 },
  { code: "growth_pro", name: "Growth Pro", description: "For established businesses with higher volume.", max_customers: 250, price_monthly: 349, price_yearly: 3490 },
  { code: "growth_business", name: "Growth Business", description: "For large and growing operations.", max_customers: 500, price_monthly: 699, price_yearly: 6990 },
  { code: "scale", name: "Scale", description: "A tailored plan for high-volume operations.", max_customers: null, is_custom: true, price_monthly: null, price_yearly: null },
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

const date = (value) => {
  if (!value) return "—";

  const d = new Date(value);

  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const statusStyle = (status) => {
  const s = String(status || "").toLowerCase();

  if (["successful", "active", "approved", "paid"].includes(s))
    return "bg-[#EAF4EC] text-[#477B55]";

  if (["pending", "trial"].includes(s))
    return "bg-[#FFF5D9] text-[#92701B]";

  if (["rejected", "failed", "expired", "cancelled"].includes(s))
    return "bg-[#FCEBE8] text-[#B34E43]";

  return "bg-[#F0EFEA] text-[#686961]";
};

function Status({ value }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold capitalize ${statusStyle(value)}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {String(value || "Unknown").replaceAll("_", " ")}
    </span>
  );
}

function Icon({ name, size = 20 }) {
  const paths = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    plans: (
      <>
        <path d="M3 7h18M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M7 11h10M7 15h6" />
      </>
    ),
    payments: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M7 15h3" />
      </>
    ),
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9A8535]">
          {eyebrow}
        </p>

        <h2 className="text-2xl font-extrabold tracking-tight text-[#24262B] sm:text-3xl">
          {title}
        </h2>

        {description && (
          <p className="mt-2 text-sm text-[#85857D]">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

function PlanCard({ plan, cycle, onChoose, busy, currentPlan }) {
  const custom = Boolean(plan.is_custom);
  const price = cycle === "yearly"
    ? plan.price_yearly
    : plan.price_monthly;

  const popular = plan.code === "growth";

  return (
    <article
      className={`relative flex min-h-[340px] flex-col overflow-hidden rounded-[20px] border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        popular
          ? "border-[#E9CA43] bg-[#FFFDF4] shadow-md"
          : "border-[#EDEAE0] bg-white"
      }`}
    >
      {popular && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-[#E9CA43] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-[#24262B]">
          Most popular
        </div>
      )}

      <div className="mb-4">
        <div
          className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
            popular ? "bg-[#E9CA43]" : "bg-[#F7F6F0]"
          }`}
        >
          <span className="text-base font-black">
            {plan.name.charAt(0)}
          </span>
        </div>

        <h3 className="text-base font-extrabold text-[#24262B]">
          {plan.name} Plan
        </h3>

        <p className="mt-1 min-h-[32px] text-[11px] leading-4 text-[#85857D]">
          {plan.description}
        </p>
      </div>

      <div className="mb-4">
        {custom ? (
          <p className="text-2xl font-extrabold text-[#24262B]">
            Custom
          </p>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold">₹</span>

            <span className="text-3xl font-black tracking-tight text-[#24262B]">
              {money(price)}
            </span>

            <span className="text-[10px] text-[#85857D]">
              /{cycle === "yearly" ? "year" : "month"}
            </span>
          </div>
        )}

        {cycle === "yearly" && !custom && Number(price) > 0 && (
          <p className="mt-1 text-[10px] font-semibold text-[#6F987B]">
            2 months free annually
          </p>
        )}
      </div>

      <div className="mb-4 h-px bg-[#EDEAE0]" />

      <div className="mb-5 flex-1 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#85857D]">Customer capacity</span>

          <span className="font-bold text-[#24262B]">
            {plan.max_customers
              ? money(plan.max_customers)
              : "Custom"}
          </span>
        </div>

        {[
          "Customer management",
          "Delivery management",
          "Business dashboard",
          "Records & reports",
        ].map((feature) => (
          <div
            key={feature}
            className="flex items-center gap-2 text-[11px] text-[#686961]"
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EDF4EC] text-[#6F987B]">
              <Icon name="check" size={10} />
            </span>

            {feature}
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={busy || currentPlan}
        onClick={() => onChoose(plan)}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          popular
            ? "bg-[#24262B] text-white hover:bg-[#42444A]"
            : "bg-[#F2F0E8] text-[#24262B] hover:bg-[#E9CA43]"
        }`}
      >
        {busy
          ? "Please wait..."
          : currentPlan
            ? "Current plan"
            : custom
              ? "Contact sales"
              : "Choose plan"}

        {!busy && !currentPlan && (
          <Icon name="arrow" size={14} />
        )}
      </button>
    </article>
  );
}

function MyPlanSection({ subscription, onUpgrade }) {
  if (!subscription) {
    return (
      <div className="rounded-[28px] border border-[#EDEAE0] bg-white p-10 text-center">
        <h3 className="text-xl font-extrabold">
          No active subscription
        </h3>

        <p className="mt-2 text-sm text-[#85857D]">
          Choose a plan to get started.
        </p>

        <button
          onClick={onUpgrade}
          className="mt-5 rounded-xl bg-[#24262B] px-5 py-3 text-sm font-bold text-white"
        >
          Explore plans
        </button>
      </div>
    );
  }

  const plan = subscription.subscription_plans || {};
  const limit =
    subscription.custom_customer_limit ?? plan.max_customers ?? 0;

  const used = Number(subscription.active_customer_count || 0);

  const percentage =
    limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[30px] bg-[#24262B] p-7 text-white sm:p-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[35px] border-white/[0.04]" />

        <div className="absolute -bottom-24 right-28 h-48 w-48 rounded-full bg-[#E9CA43]/10 blur-2xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E9CA43]">
              Your current membership
            </p>

            <h3 className="mt-3 text-3xl font-black sm:text-4xl">
              {plan.name || "Subscription"}
            </h3>

            <p className="mt-2 max-w-md text-sm text-white/55">
              {plan.description || "Your business subscription"}
            </p>
          </div>

          <Status value={subscription.status} />
        </div>

        <div className="relative mt-10 grid gap-6 border-t border-white/10 pt-7 sm:grid-cols-3">
          <div>
            <p className="text-xs text-white/45">Billing cycle</p>
            <p className="mt-2 text-lg font-bold capitalize">
              {subscription.billing_cycle || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-white/45">Started on</p>
            <p className="mt-2 text-lg font-bold">
              {date(subscription.starts_at)}
            </p>
          </div>

          <div>
            <p className="text-xs text-white/45">Valid until</p>
            <p className="mt-2 text-lg font-bold">
              {date(
                subscription.access_expires_at ||
                subscription.ends_at
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onUpgrade}
          className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-[#E9CA43] px-5 py-3 text-sm font-extrabold text-[#24262B] transition hover:bg-[#F5D95B]"
        >
          Change subscription
          <Icon name="arrow" size={16} />
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[26px] border border-[#EDEAE0] bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Customer capacity</p>
              <p className="mt-1 text-xs text-[#85857D]">
                Active customers in your business
              </p>
            </div>

            <div className="rounded-xl bg-[#F7F6F0] p-3 text-[#6F987B]">
              <Icon name="users" />
            </div>
          </div>

          <div className="mt-7 flex items-end gap-2">
            <span className="text-4xl font-black">
              {money(used)}
            </span>

            <span className="pb-1 text-sm text-[#85857D]">
              / {limit ? money(limit) : "Custom"}
            </span>
          </div>

          {limit > 0 && (
            <>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#F0EFEA]">
                <div
                  className="h-full rounded-full bg-[#6F987B] transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <p className="mt-3 text-xs text-[#85857D]">
                {Math.round(percentage)}% of your customer limit used
              </p>
            </>
          )}
        </div>

        <div className="rounded-[26px] border border-[#EDEAE0] bg-white p-6">
          <p className="text-sm font-bold">
            Subscription information
          </p>

          <div className="mt-5 space-y-4">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[#85857D]">Plan type</span>
              <span className="font-semibold">
                {subscription.is_complimentary
                  ? "Complimentary"
                  : "Paid"}
              </span>
            </div>

            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[#85857D]">Status</span>
              <Status value={subscription.status} />
            </div>

            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[#85857D]">Access override</span>
              <span className="font-semibold">
                {subscription.full_access_override
                  ? "Enabled"
                  : "No"}
              </span>
            </div>
          </div>

          {subscription.grant_reason && (
            <p className="mt-5 rounded-xl bg-[#F7F6F0] p-3 text-xs text-[#686961]">
              {subscription.grant_reason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentHistory({ payments, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center text-sm text-[#85857D]">
        Loading transactions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <p className="text-sm text-red-700">{error}</p>

        <button
          onClick={onRetry}
          className="mt-4 rounded-xl bg-[#24262B] px-5 py-2.5 text-sm font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div className="rounded-[26px] border border-[#EDEAE0] bg-white p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F6F0] text-[#9A8535]">
          <Icon name="payments" size={26} />
        </div>

        <h3 className="mt-5 text-lg font-extrabold">
          No transactions yet
        </h3>

        <p className="mt-2 text-sm text-[#85857D]">
          Your payment records will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[26px] border border-[#EDEAE0] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDEAE0] p-6">
        <div>
          <h3 className="font-extrabold">All transactions</h3>
          <p className="mt-1 text-xs text-[#85857D]">
            {payments.length} payment record(s)
          </p>
        </div>

        <span className="rounded-full bg-[#F7F6F0] px-3 py-2 text-xs font-semibold text-[#686961]">
          INR · India
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-[#FAF9F5] text-[10px] uppercase tracking-wider text-[#85857D]">
            <tr>
              <th className="px-6 py-4">Transaction</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Method / UTR</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Remarks</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F0EFEA]">
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="transition hover:bg-[#FCFBF8]"
              >
                <td className="px-6 py-5">
                  <p className="font-bold text-[#24262B]">
                    {payment.subscription_plans?.name ||
                      payment.plan_name ||
                      "Subscription"}
                  </p>

                  <p className="mt-1 text-[10px] text-[#A09F97]">
                    #{String(payment.id).slice(0, 8)}
                  </p>
                </td>

                <td className="whitespace-nowrap px-6 py-5 text-[#686961]">
                  {date(payment.created_at)}
                </td>

                <td className="px-6 py-5">
                  <p className="capitalize text-[#24262B]">
                    {String(payment.payment_method || "—").replaceAll("_", " ")}
                  </p>

                  <p className="mt-1 text-xs text-[#85857D]">
                    {payment.reference_no || "No reference"}
                  </p>
                </td>

                <td className="whitespace-nowrap px-6 py-5 font-extrabold">
                  ₹{money(payment.amount)}
                </td>

                <td className="px-6 py-5">
                  <Status value={payment.payment_status} />
                </td>

                <td className="max-w-[190px] px-6 py-5 text-xs text-[#85857D]">
                  {payment.rejection_reason || payment.notes || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PublicSubscriptionPage({
  checkoutPath = "/subscription/checkout",
  loginPath = "/login",
  contactPath = "/contact",
}) {
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");
  const [cycle, setCycle] = useState("monthly");
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);

  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [busyPlan, setBusyPlan] = useState("");
  const [error, setError] = useState("");
  const [accountError, setAccountError] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true);
    setError("");

    try {
      const { data, error: queryError } = await supabase
        .from("subscription_plans")
        .select(
          "id, code, name, description, max_customers, is_custom, is_active, price_monthly, price_yearly"
        )
        .eq("is_active", true)
        .order("price_monthly", {
          ascending: true,
          nullsFirst: false,
        });

      if (queryError) throw queryError;

      setPlans((data || []).filter((p) => p.is_active));
    } catch (e) {
      console.error(e);
      setPlans(FALLBACK_PLANS);
      setError(
        "Live pricing could not be loaded. Fallback prices are being displayed."
      );
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  const loadAccount = useCallback(async () => {
    setLoadingAccount(true);
    setAccountError("");

    try {
      const result = await getMySubscription();
      const data = result?.data ?? result ?? null;

      setSubscription(
        Array.isArray(data) ? data[0] || null : data
      );
    } catch (e) {
      console.error(e);
      setAccountError(
        e?.message || "Unable to load your subscription."
      );
      setSubscription(null);
    } finally {
      setLoadingAccount(false);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setLoadingPayments(true);
    setPaymentError("");

    try {
      const result = await getMyPayments();
      const data = result?.data ?? result ?? [];

      setPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setPaymentError(
        e?.message || "Unable to load payment history."
      );
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    const { data, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.error(sessionError);
      return;
    }

    const logged = Boolean(data?.session);
    setLoggedIn(logged);

    if (logged) {
      await Promise.allSettled([
        loadAccount(),
        loadPayments(),
      ]);
    } else {
      setSubscription(null);
      setPayments([]);
    }
  }, [loadAccount, loadPayments]);

  useEffect(() => {
    loadPlans();
    loadDashboard();
  }, [loadPlans, loadDashboard]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const logged = Boolean(session);
        setLoggedIn(logged);

        if (logged) {
          loadAccount();
          loadPayments();
        } else {
          setSubscription(null);
          setPayments([]);
          setTab("overview");
        }
      }
    );

    return () => data.subscription.unsubscribe();
  }, [loadAccount, loadPayments]);

  const visiblePlans = useMemo(
    () =>
      [...plans].sort((a, b) => {
        if (a.is_custom) return 1;
        if (b.is_custom) return -1;

        return (
          Number(a.price_monthly || 0) -
          Number(b.price_monthly || 0)
        );
      }),
    [plans]
  );

  // ----------------------------------------------------
  // BASIC SEO - NO HELMET / NO EXTRA DEPENDENCY
  // ----------------------------------------------------

  useEffect(() => {
    const pageTitle =
      "Amrit Jal Subscription Plans | Water Jar Business Management Software";

    const pageDescription =
      "Explore Amrit Jal subscription plans for water jar businesses. Manage customers, deliveries, business records and reports with flexible monthly and yearly pricing.";

    const pageUrl = `${window.location.origin}/subscription`;

    document.title = pageTitle;

    const setMeta = (key, value, attribute = "name") => {
      let element = document.head.querySelector(
        `meta[${attribute}="${key}"]`
      );

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }

      element.setAttribute("content", value);
    };

    setMeta("description", pageDescription);

    setMeta(
      "keywords",
      "Amrit Jal, Amrit Jal pricing, water jar business software, water delivery management software, customer management software, business management software India"
    );

    setMeta("author", "Amrit Jal");
    setMeta("robots", "index, follow");
    setMeta("googlebot", "index, follow");

    setMeta("theme-color", "#F7F6F0");

    // Open Graph metadata
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", "Amrit Jal", "property");
    setMeta("og:title", pageTitle, "property");
    setMeta("og:description", pageDescription, "property");
    setMeta("og:url", pageUrl, "property");

    // Twitter metadata
    setMeta("twitter:card", "summary");
    setMeta("twitter:title", pageTitle);
    setMeta("twitter:description", pageDescription);

    // Canonical URL: only add on non-localhost domains
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    let canonical = document.head.querySelector(
      'link[rel="canonical"]'
    );

    if (!isLocalhost) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }

      canonical.href = pageUrl;
    }

    // SoftwareApplication structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Amrit Jal",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: pageDescription,

      offers: visiblePlans
        .filter((plan) => !plan.is_custom)
        .flatMap((plan) => [
          {
            "@type": "Offer",
            name: `${plan.name} Monthly`,
            price: Number(plan.price_monthly ?? 0),
            priceCurrency: "INR",
            url: pageUrl,
          },
          {
            "@type": "Offer",
            name: `${plan.name} Yearly`,
            price: Number(plan.price_yearly ?? 0),
            priceCurrency: "INR",
            url: pageUrl,
          },
        ]),
    };

    let schemaScript = document.getElementById(
      "amrit-jal-subscription-schema"
    );

    if (!schemaScript) {
      schemaScript = document.createElement("script");
      schemaScript.id = "amrit-jal-subscription-schema";
      schemaScript.type = "application/ld+json";
      document.head.appendChild(schemaScript);
    }

    schemaScript.textContent = JSON.stringify(structuredData);
  }, [visiblePlans]);

  const choosePlan = async (plan) => {
    if (busyPlan) return;

    if (plan.is_custom) {
      navigate(contactPath);
      return;
    }

    setBusyPlan(plan.code);

    try {
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const destination = `${checkoutPath}?${new URLSearchParams({
        plan: plan.code,
        cycle,
      }).toString()}`;

      if (!data?.session) {
        navigate(
          `${loginPath}?redirect=${encodeURIComponent(destination)}`
        );
        return;
      }

      navigate(destination);
    } catch (e) {
      console.error(e);
      setError(
        "Unable to verify your login session. Please try again."
      );
    } finally {
      setBusyPlan("");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "overview" },
    { id: "plans", label: "Plans & Pricing", icon: "plans" },
    ...(loggedIn
      ? [{ id: "payments", label: "Payments", icon: "payments" }]
      : []),
  ];

  return (
    <main className="min-h-screen bg-[#F7F6F0] text-[#24262B]">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-7 lg:px-10 lg:py-10">

        {/* Top brand header */}
        <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E9CA43] text-lg font-black">
              A
            </div>

            <div>
              <p className="text-sm font-black tracking-tight">
                AMRIT JAL
              </p>

              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#85857D]">
                Subscription centre
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#EDEAE0] bg-white px-4 py-2 text-xs font-semibold text-[#686961]">
            <span className="h-2 w-2 rounded-full bg-[#6F987B]" />
            {loggedIn ? "Business account" : "Public pricing"}
          </div>
        </header>

        {/* Hero */}
        <section className="relative mb-8 overflow-hidden rounded-[28px] border border-[#E9CA43]/40 bg-white">
          <div className="grid items-center lg:grid-cols-[1.2fr_0.8fr]">

            {/* Left Content */}
            <div className="relative z-10 px-7 py-9 sm:px-10 sm:py-11">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E9CA43]/50 bg-[#FFF9DC] px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#C5A72D]" />

                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#76621B]">
                  Amrit Jal · Subscription Centre
                </span>
              </div>

              <h1 className="max-w-xl text-3xl font-black leading-[1.12] tracking-tight text-[#24262B] sm:text-4xl lg:text-[48px]">
                Water Jar Business
                <span className="block text-[#A68A1D]">
                  Management Plans
                </span>
              </h1>

              <p className="mt-4 max-w-lg text-sm leading-6 text-[#77766F] sm:text-base">
                Choose an Amrit Jal subscription plan to manage
                customers, track water jar deliveries, organise
                business records and monitor your operations —
                all from one place.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTab("plans")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#24262B] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#41434A]"
                >
                  Explore plans
                  <Icon name="arrow" size={16} />
                </button>

                {loggedIn && (
                  <button
                    type="button"
                    onClick={() => setTab("overview")}
                    className="rounded-xl border border-[#EDEAE0] bg-white px-5 py-3 text-sm font-bold text-[#24262B] transition hover:bg-[#F7F6F0]"
                  >
                    My subscription
                  </button>
                )}
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden bg-[#F7F6F0] px-6 py-8 sm:min-h-[260px]">
              <div className="absolute right-[-50px] top-[-80px] h-64 w-64 rounded-full border border-[#E9CA43]/40" />

              <div className="absolute bottom-[-100px] left-[-50px] h-64 w-64 rounded-full border border-[#E9CA43]/40" />

              <div className="relative w-full max-w-[290px] rounded-[24px] border border-[#EDEAE0] bg-white p-5 shadow-[0_15px_45px_rgba(36,38,43,0.07)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#99988F]">
                      Business membership
                    </p>

                    <p className="mt-1 text-lg font-black text-[#24262B]">
                      Grow with Amrit Jal
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9CA43] text-lg font-black text-[#24262B]">
                    A
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-[#F7F6F0] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#77766F]">
                      Business growth
                    </span>

                    <Icon name="arrow" size={16} />
                  </div>

                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-3xl font-black text-[#24262B]">
                      ∞
                    </span>

                    <span className="pb-1 text-xs text-[#77766F]">
                      Possibilities
                    </span>
                  </div>

                  <div className="mt-4 flex h-2 gap-1 overflow-hidden rounded-full bg-[#EDEAE0]">
                    <div className="w-[65%] rounded-full bg-[#E9CA43]" />
                    <div className="flex-1 rounded-full bg-[#6F987B]/50" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#99988F]">
                      One platform
                    </p>

                    <p className="mt-1 text-xs font-bold text-[#24262B]">
                      Plans · Payments · Growth
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EDF4EC] text-[#6F987B]">
                    <Icon name="check" size={17} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Main layout */}
        <div className="grid items-start gap-7 lg:grid-cols-[230px_minmax(0,1fr)]">

          {/* Sidebar navigation */}
          <aside className="lg:sticky lg:top-6">
            <div className="rounded-[24px] border border-[#EDEAE0] bg-white p-3">
              <p className="px-3 pb-3 pt-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#A09F97]">
                Workspace
              </p>

              <nav className="flex gap-1 overflow-x-auto lg:flex-col">
                {tabs.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                      tab === item.id
                        ? "bg-[#F7F6F0] text-[#24262B]"
                        : "text-[#85857D] hover:bg-[#FAF9F5] hover:text-[#24262B]"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        tab === item.id
                          ? "bg-[#E9CA43]"
                          : "bg-[#F7F6F0]"
                      }`}
                    >
                      <Icon name={item.icon} size={17} />
                    </span>

                    {item.label}

                    {tab === item.id && (
                      <span className="ml-auto hidden text-[#9A8535] lg:block">
                        ●
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="mt-5 hidden rounded-2xl bg-[#F7F6F0] p-4 lg:block">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#E9CA43]">
                  <Icon name="calendar" size={17} />
                </div>

                <p className="text-xs font-bold">
                  Need assistance?
                </p>

                <p className="mt-1 text-[11px] leading-5 text-[#85857D]">
                  Our team can help you choose the right subscription.
                </p>

                <button
                  onClick={() => navigate(contactPath)}
                  className="mt-3 text-xs font-extrabold text-[#8A751E]"
                >
                  Contact support ↗
                </button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0">

            {/* OVERVIEW */}
            {tab === "overview" && (
              <section>
                <SectionTitle
                  eyebrow="Account overview"
                  title="My subscription"
                  description="Your plan, usage and membership details."
                  action={
                    <button
                      onClick={loadDashboard}
                      className="flex items-center gap-2 rounded-xl border border-[#EDEAE0] bg-white px-4 py-2.5 text-xs font-bold hover:bg-[#FAF9F5]"
                    >
                      <Icon name="refresh" size={15} />
                      Refresh
                    </button>
                  }
                />

                {!loggedIn ? (
                  <div className="rounded-[26px] border border-[#EDEAE0] bg-white p-8 sm:p-12">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9A8535]">
                      Welcome to Amrit Jal
                    </p>

                    <h3 className="mt-3 text-3xl font-black">
                      Your subscription starts here.
                    </h3>

                    <p className="mt-3 max-w-lg text-sm leading-6 text-[#85857D]">
                      Sign in to see your current plan and payment
                      history, or explore the available plans.
                    </p>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <button
                        onClick={() => navigate(loginPath)}
                        className="rounded-xl bg-[#24262B] px-5 py-3 text-sm font-bold text-white"
                      >
                        Sign in
                      </button>

                      <button
                        onClick={() => setTab("plans")}
                        className="rounded-xl border border-[#EDEAE0] px-5 py-3 text-sm font-bold"
                      >
                        View plans
                      </button>
                    </div>
                  </div>
                ) : loadingAccount ? (
                  <div className="h-72 animate-pulse rounded-[26px] bg-white" />
                ) : accountError ? (
                  <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">
                    {accountError}
                  </div>
                ) : (
                  <MyPlanSection
                    subscription={subscription}
                    onUpgrade={() => setTab("plans")}
                  />
                )}

                {loggedIn && (
                  <div className="mt-7 rounded-[26px] border border-[#EDEAE0] bg-white p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold">
                          Recent payments
                        </h3>

                        <p className="mt-1 text-xs text-[#85857D]">
                          Your latest subscription transactions.
                        </p>
                      </div>

                      <button
                        onClick={() => setTab("payments")}
                        className="text-xs font-extrabold text-[#8A751E]"
                      >
                        View all payments ↗
                      </button>
                    </div>

                    {loadingPayments ? (
                      <p className="mt-6 text-sm text-[#85857D]">
                        Loading recent payments...
                      </p>
                    ) : payments.length === 0 ? (
                      <p className="mt-6 text-sm text-[#85857D]">
                        No payment records found.
                      </p>
                    ) : (
                      <div className="mt-5 divide-y divide-[#F0EFEA]">
                        {payments.slice(0, 3).map((payment) => (
                          <div
                            key={payment.id}
                            className="flex flex-wrap items-center justify-between gap-3 py-4"
                          >
                            <div>
                              <p className="text-sm font-bold">
                                {payment.subscription_plans?.name ||
                                  payment.plan_name ||
                                  "Subscription"}
                              </p>

                              <p className="mt-1 text-xs text-[#85857D]">
                                {date(payment.created_at)}
                              </p>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="font-extrabold">
                                ₹{money(payment.amount)}
                              </span>

                              <Status value={payment.payment_status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* PLANS */}
            {tab === "plans" && (
              <section>
                <SectionTitle
                  eyebrow="Find your next level"
                  title="Choose the Right Amrit Jal Subscription Plan"
                  description="Compare monthly and yearly pricing and choose the customer capacity that matches your business."
                />

                <div className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#EDEAE0] bg-white p-3">
                  <div className="px-2">
                    <p className="text-sm font-bold">
                      Choose billing cycle
                    </p>

                    <p className="mt-1 text-xs text-[#85857D]">
                      Save more with annual billing.
                    </p>
                  </div>

                  <div className="flex rounded-xl bg-[#F7F6F0] p-1">
                    {["monthly", "yearly"].map((value) => (
                      <button
                        key={value}
                        onClick={() => setCycle(value)}
                        className={`rounded-lg px-4 py-2.5 text-xs font-bold capitalize ${
                          cycle === value
                            ? "bg-[#24262B] text-white shadow-sm"
                            : "text-[#686961]"
                        }`}
                      >
                        {value}

                        {value === "yearly" && (
                          <span className="ml-1 text-[#E9CA43]">
                            · Save 2 months
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                    {error}
                  </div>
                )}

                {loadingPlans ? (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="h-[420px] animate-pulse rounded-[26px] bg-white"
                      />
                    ))}
                  </div>
                ) : visiblePlans.length === 0 ? (
                  <div className="rounded-2xl bg-white p-8 text-center">
                    <p className="font-bold">
                      No plans available right now.
                    </p>

                    <button
                      onClick={loadPlans}
                      className="mt-4 text-sm font-bold text-[#8A751E]"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {visiblePlans.map((plan) => (
                      <PlanCard
                        key={plan.id || plan.code}
                        plan={plan}
                        cycle={cycle}
                        onChoose={choosePlan}
                        busy={busyPlan === plan.code}
                        currentPlan={
                          subscription?.subscription_plans?.code ===
                          plan.code
                        }
                      />
                    ))}
                  </div>
                )}

                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[#E9CA43]/50 bg-[#FFFBE9] p-6">
                  <div>
                    <p className="font-extrabold">
                      Need something bigger?
                    </p>

                    <p className="mt-1 text-xs text-[#77766F]">
                      Talk to our team about a custom Scale plan.
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(contactPath)}
                    className="rounded-xl bg-[#24262B] px-5 py-3 text-xs font-bold text-white"
                  >
                    Contact sales ↗
                  </button>
                </div>
              </section>
            )}

            {/* PAYMENTS */}
            {tab === "payments" && (
              <section>
                <SectionTitle
                  eyebrow="Billing activity"
                  title="Payment history."
                  description="A complete record of your subscription payments."
                  action={
                    <button
                      onClick={loadPayments}
                      className="flex items-center gap-2 rounded-xl border border-[#EDEAE0] bg-white px-4 py-2.5 text-xs font-bold"
                    >
                      <Icon name="refresh" size={15} />
                      Refresh
                    </button>
                  }
                />

                <PaymentHistory
                  payments={payments}
                  loading={loadingPayments}
                  error={paymentError}
                  onRetry={loadPayments}
                />
              </section>
            )}
          </div>
        </div>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E2D8] pt-6 text-[10px] text-[#99988F]">
          <p>
            © {new Date().getFullYear()} Amrit Jal · Subscription Centre
          </p>

          <p>
            All prices in INR · Manual payments subject to verification
          </p>
        </footer>
      </div>
    </main>
  );
}
