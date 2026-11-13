
function Row({ label, value }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-gray-100 py-3 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-semibold text-[#24262B]">
        {value ?? "—"}
      </span>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Not set";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function BusinessSubscriptionHistory({ subscription }) {
  if (!subscription) {
    return (
      <section className="rounded-2xl border border-[#EDEAE0] bg-white p-6">
        <h2 className="font-bold text-[#24262B]">
          Subscription Details
        </h2>
        <p className="mt-3 text-sm text-gray-500">
          No subscription record found for this business.
        </p>
      </section>
    );
  }

  const plan = subscription.subscription_plans;
  const limit =
    subscription.custom_customer_limit ?? plan?.max_customers;

  const overrideActive =
    subscription.full_access_override &&
    (!subscription.access_expires_at ||
      new Date(subscription.access_expires_at) > new Date());

  return (
    <section className="rounded-2xl border border-[#EDEAE0] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#24262B]">
            Subscription Details
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Current plan and access information
          </p>
        </div>

        <span className="rounded-full bg-[#F7F6F0] px-3 py-1 text-xs font-semibold capitalize text-[#24262B]">
          {subscription.status}
        </span>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="rounded-xl bg-[#F7F6F0] p-4">
          <p className="text-xs text-gray-500">Current Plan</p>
          <p className="mt-2 text-xl font-bold text-[#24262B]">
            {plan?.name || "Unknown Plan"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {plan?.code || ""}
          </p>
        </div>

        <div className="rounded-xl bg-[#F7F6F0] p-4">
          <p className="text-xs text-gray-500">Customer Limit</p>
          <p className="mt-2 text-xl font-bold text-[#24262B]">
            {overrideActive
              ? "Full Access"
              : limit == null
                ? "Not configured"
                : limit}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Active customers: {subscription.active_customer_count}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Row label="Billing Cycle" value={subscription.billing_cycle} />
        <Row
          label="Complimentary"
          value={subscription.is_complimentary ? "Yes" : "No"}
        />
        <Row
          label="Full Access Override"
          value={overrideActive ? "Active" : "Inactive"}
        />
        <Row
          label="Override Expiry"
          value={formatDate(subscription.access_expires_at)}
        />
        <Row
          label="Subscription Started"
          value={formatDate(subscription.starts_at)}
        />
        <Row
          label="Subscription Ends"
          value={formatDate(subscription.ends_at)}
        />
        <Row
          label="Trial Ends"
          value={formatDate(subscription.trial_ends_at)}
        />
        <Row
          label="Grant Reason"
          value={subscription.grant_reason}
        />
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-4">
        <h3 className="text-sm font-semibold text-[#24262B]">
          Historical Subscription Changes
        </h3>
        <p className="mt-2 text-xs leading-5 text-gray-500">
          Historical plan changes and admin actions will appear here after
          the subscription audit-log system is connected.
        </p>
      </div>
    </section>
  );
}
