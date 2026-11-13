import { Link } from "react-router-dom";

import {
  getMySubscription,
} from "../services/subscriptionService";

import {
  dateText,
  Notice,
  PageShell,
  Panel,
  StatusPill,
  useAsync,
} from "./subscriptionUi";

export default function MySubscriptionPage() {
  const {
    data: subscription,
    loading,
    error,
  } = useAsync(getMySubscription, []);

  const plan = subscription?.subscription_plans;

  const limit =
    subscription?.custom_customer_limit ??
    plan?.max_customers;

  const used = Number(
    subscription?.active_customer_count || 0
  );

  const percent = limit
    ? Math.min(
        100,
        Math.round((used / Number(limit)) * 100)
      )
    : 0;

  return (
    <PageShell
      title="My current plan"
      subtitle="See your active subscription, customer capacity and validity at a glance."
    >
      <Panel>

        {loading ? (
          <p className="text-sm text-[#686961]">
            Loading current subscription...
          </p>
        ) : error ? (
          <Notice type="error">
            {error}
          </Notice>
        ) : !subscription ? (
          <div className="py-8 text-center">
            <h2 className="text-xl font-bold">
              No subscription found
            </h2>

            <p className="mt-2 text-sm text-[#686961]">
              Select a subscription plan to get started.
            </p>

            <Link
              to="/subscriptions"
              className="mt-5 inline-flex rounded-xl bg-[#24262B] px-5 py-3 text-sm font-bold text-white"
            >
              View plans
            </Link>
          </div>
        ) : (
          <>
            {/* CURRENT PLAN HEADER */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#8A7620]">
                  Current subscription
                </p>

                <h2 className="mt-2 text-3xl font-extrabold">
                  {plan?.name || "Business Plan"}
                </h2>

                <p className="mt-2 text-sm capitalize text-[#686961]">
                  {subscription.billing_cycle || "—"} billing
                </p>
              </div>

              <StatusPill status={subscription.status} />
            </div>

            {/* DETAILS */}
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {/* CUSTOMER CAPACITY */}
              <div className="rounded-2xl bg-[#F7F6F0] p-4">
                <p className="text-xs text-[#85857D]">
                  Customer capacity
                </p>

                <p className="mt-2 text-2xl font-extrabold">
                  {limit
                    ? `${used} / ${limit}`
                    : `${used} / Custom`}
                </p>

                {limit && (
                  <>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E5E2D8]">
                      <div
                        className="h-full rounded-full bg-[#6F987B] transition-all"
                        style={{
                          width: `${percent}%`,
                        }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-[#77766F]">
                      {percent}% capacity used
                    </p>
                  </>
                )}
              </div>

              {/* START DATE */}
              <div className="rounded-2xl bg-[#F7F6F0] p-4">
                <p className="text-xs text-[#85857D]">
                  Start date
                </p>

                <p className="mt-2 text-xl font-bold">
                  {dateText(subscription.starts_at)}
                </p>
              </div>

              {/* VALIDITY */}
              <div className="rounded-2xl bg-[#F7F6F0] p-4">
                <p className="text-xs text-[#85857D]">
                  Valid until
                </p>

                <p className="mt-2 text-xl font-bold">
                  {dateText(
                    subscription.ends_at ||
                    subscription.access_expires_at
                  )}
                </p>
              </div>

            </div>

            {/* SPECIAL ACCESS */}
            {subscription.full_access_override && (
              <div className="mt-5">
                <Notice type="success">
                  Full access override is enabled for this business.
                </Notice>
              </div>
            )}

            {subscription.is_complimentary && (
              <div className="mt-5">
                <Notice>
                  This subscription has been granted as a complimentary plan.
                </Notice>
              </div>
            )}

            {/* ACTIONS */}
            <div className="mt-7 flex flex-wrap gap-3">

              <Link
                to="/subscription/upgrade"
                className="inline-flex rounded-xl bg-[#24262B] px-5 py-3 text-sm font-bold text-white hover:bg-[#3B3D42]"
              >
                Upgrade / Renew
              </Link>

              <Link
                to="/subscription/history"
                className="inline-flex rounded-xl border border-[#E5E2D8] px-5 py-3 text-sm font-bold hover:bg-[#F7F6F0]"
              >
                Payment history
              </Link>

            </div>
          </>
        )}

      </Panel>
    </PageShell>
  );
}