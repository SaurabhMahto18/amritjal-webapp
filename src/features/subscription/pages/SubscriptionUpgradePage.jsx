import { useEffect, useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  getActivePlans,
} from "../services/subscriptionService";

import {
  money,
  Notice,
  PageShell,
  Panel,
} from "./subscriptionUi";

export default function SubscriptionUpgradePage() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [cycle, setCycle] = useState("monthly");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load active plans
  useEffect(() => {
    let active = true;

    getActivePlans()
      .then((rows) => {
        if (active) {
          setPlans(rows || []);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Choose plan
  const handleChoosePlan = (plan) => {
    if (plan.is_custom) {
      navigate("/contact");
      return;
    }

    navigate(
      `/subscription/checkout?plan=${encodeURIComponent(
        plan.code
      )}&cycle=${cycle}`
    );
  };

  return (
    <PageShell
      title="Upgrade or renew"
      subtitle="Compare available plans and choose the right subscription for your business."
    >

      {/* BILLING TOGGLE */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">

        <div>
          <h2 className="text-lg font-bold">
            Available plans
          </h2>

          <p className="mt-1 text-sm text-[#686961]">
            Select a billing period to compare pricing.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-[#EDEAE0] bg-white p-1">
          {["monthly", "yearly"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCycle(value)}
              aria-pressed={cycle === value}
              className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition ${
                cycle === value
                  ? "bg-[#24262B] text-white"
                  : "text-[#686961] hover:text-[#24262B]"
              }`}
            >
              {value}
            </button>
          ))}
        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6">
          <Notice type="error">
            {error}
          </Notice>
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-80 animate-pulse rounded-3xl border border-[#EDEAE0] bg-white"
            />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Panel>
          <div className="py-8 text-center">
            <h2 className="text-xl font-bold">
              No plans available
            </h2>

            <p className="mt-2 text-sm text-[#686961]">
              Please try again later.
            </p>
          </div>
        </Panel>
      ) : (
        <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {plans.map((plan) => {
            const price =
              cycle === "yearly"
                ? plan.price_yearly
                : plan.price_monthly;

            const popular = plan.code === "growth";

            return (
              <Panel
                key={plan.id}
                className={`relative flex flex-col ${
                  popular
                    ? "border-[#E9CA43] ring-2 ring-[#E9CA43]/30"
                    : ""
                }`}
              >

                {popular && (
                  <span className="absolute -top-3 left-5 rounded-full bg-[#E9CA43] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#24262B]">
                    Popular choice
                  </span>
                )}

                <div className="flex-1">

                  <h3 className="text-xl font-extrabold">
                    {plan.name}
                  </h3>

                  <p className="mt-2 min-h-10 text-sm leading-6 text-[#686961]">
                    {plan.description ||
                      "Choose the right capacity for your business."}
                  </p>

                  <div className="mt-6">
                    {plan.is_custom ? (
                      <p className="text-3xl font-extrabold">
                        Custom
                      </p>
                    ) : (
                      <>
                        <p className="text-3xl font-extrabold">
                          {money(price)}
                        </p>

                        <p className="mt-1 text-xs text-[#77766F]">
                          per {cycle === "yearly" ? "year" : "month"}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="mt-6 border-t border-[#EDEAE0] pt-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#85857D]">
                      Customer capacity
                    </p>

                    <p className="mt-2 text-sm font-semibold">
                      {plan.max_customers
                        ? `Up to ${plan.max_customers} customers`
                        : "Custom customer capacity"}
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() => handleChoosePlan(plan)}
                  className={`mt-7 w-full rounded-xl px-4 py-3 text-sm font-bold transition ${
                    popular
                      ? "bg-[#24262B] text-white hover:bg-[#3B3D42]"
                      : "bg-[#F7F6F0] text-[#24262B] hover:bg-[#EDEAE0]"
                  }`}
                >
                  {plan.is_custom
                    ? "Contact sales"
                    : "Choose this plan"}
                </button>

              </Panel>
            );
          })}

        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="mt-8 flex flex-wrap gap-3">

        <Link
          to="/subscription/my-plan"
          className="rounded-xl border border-[#E5E2D8] bg-white px-5 py-3 text-sm font-bold hover:bg-[#F7F6F0]"
        >
          Back to my current plan
        </Link>

        <Link
          to="/subscription/history"
          className="rounded-xl border border-[#E5E2D8] bg-white px-5 py-3 text-sm font-bold hover:bg-[#F7F6F0]"
        >
          Payment history
        </Link>

      </div>

    </PageShell>
  );
}