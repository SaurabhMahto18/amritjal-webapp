
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { adminSubscriptionService } from "../services/adminSubscriptionService";

// Local SVG icons - no external icon package required

function Icon({ children, className = "", size = 18, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

const FiSearch = (props) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </Icon>
);

const FiRefreshCw = (props) => (
  <Icon {...props}>
    <path d="M20 7v5h-5M4 17v-5h5" />
    <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" />
  </Icon>
);

const FiX = (props) => (
  <Icon {...props}>
    <path d="m18 6-12 12M6 6l12 12" />
  </Icon>
);

const FiUsers = (props) => (
  <Icon {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="10" cy="7" r="4" />
    <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);

const FiCheckCircle = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m8 12 3 3 5-6" />
  </Icon>
);

const FiGift = (props) => (
  <Icon {...props}>
    <rect x="3" y="8" width="18" height="13" rx="2" />
    <path d="M12 8v13M3 12h18M12 8H7a2.5 2.5 0 1 1 2.5-2.5C9.5 7 12 8 12 8ZM12 8h5a2.5 2.5 0 1 0-2.5-2.5C14.5 7 12 8 12 8Z" />
  </Icon>
);

const FiClock = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Icon>
);

const FiDroplet = (props) => (
  <Icon {...props}>
    <path d="M12 2.5S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.5-7-12.5Z" />
  </Icon>
);

const FiSettings = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1 0 2Z" />
  </Icon>
);

const FiShield = (props) => (
  <Icon {...props}>
    <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

const FiCalendar = (props) => (
  <Icon {...props}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Icon>
);

const FiSave = (props) => (
  <Icon {...props}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M17 21v-8H7v8M7 3v5h8" />
  </Icon>
);

const FiAlertCircle = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </Icon>
);

const FiCreditCard = (props) => (
  <Icon {...props}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 10h20M7 15h3" />
  </Icon>
);

const FiEdit3 = (props) => (
  <Icon {...props}>
    <path d="m16 4 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15v5Z" />
  </Icon>
);

const FiMail = (props) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
);

const FiChevronRight = (props) => (
  <Icon {...props}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);

const initialForm = {
  plan_id: "",
  status: "active",
  billing_cycle: "monthly",
  custom_customer_limit: "",
  is_complimentary: false,
  full_access_override: false,
  grant_reason: "",
  access_expires_at: "",
};

const STATUSES = [
  "active",
  "trialing",
  "past_due",
  "cancelled",
  "expired",
  "suspended",
];

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofLoading, setProofLoading] = useState(false);
  const [reviewingPayment, setReviewingPayment] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Load subscriptions and plans through service.
  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const [result, paymentRows] = await Promise.all([
        adminSubscriptionService.getAdminSubscriptionData(),
        adminSubscriptionService.getSubscriptionPayments(),
      ]);

      setSubscriptions(result.subscriptions || []);
      setPlans(result.plans || []);
      setPayments(paymentRows || []);
    } catch (error) {
      console.error("Subscription loading error:", error);
      setMessage(
        error.message || "Unable to load subscription data."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lock background scrolling and support Escape key.
  useEffect(() => {
    if (!selected) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) {
        closeEditor();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selected, saving]);

  const openEditor = (subscription) => {
    setSelected(subscription);

    setForm({
      plan_id: subscription.plan_id || "",
      status: subscription.status || "active",
      billing_cycle: subscription.billing_cycle || "monthly",
      custom_customer_limit:
        subscription.custom_customer_limit ?? "",
      is_complimentary: Boolean(subscription.is_complimentary),
      full_access_override: Boolean(
        subscription.full_access_override
      ),
      grant_reason: subscription.grant_reason || "",
      access_expires_at: subscription.access_expires_at
        ? new Date(subscription.access_expires_at)
            .toISOString()
            .slice(0, 16)
        : "",
    });

    setMessage("");
    setMessageType("error");
  };

  const closeEditor = () => {
    if (saving) return;

    setSelected(null);
    setForm(initialForm);
    setMessage("");
  };

  const updateField = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // Save subscription using adminSubscriptionService.
  const saveSubscription = async (event) => {
    event.preventDefault();

    if (!selected || saving) return;

    const customLimit =
      form.custom_customer_limit === ""
        ? null
        : Number(form.custom_customer_limit);

    if (
      customLimit !== null &&
      (!Number.isInteger(customLimit) || customLimit < 0)
    ) {
      setMessage(
        "Custom customer limit must be a non-negative integer."
      );
      setMessageType("error");
      return;
    }

    if (
      form.full_access_override &&
      !form.grant_reason.trim()
    ) {
      setMessage(
        "Please provide a reason for full-access override."
      );
      setMessageType("error");
      return;
    }

    if (!form.plan_id) {
      setMessage("Please select a subscription plan.");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Unable to verify the admin account.");
      }

      const payload = {
        plan_id: form.plan_id,
        status: form.status,
        billing_cycle: form.billing_cycle,
        custom_customer_limit: customLimit,
        is_complimentary: form.is_complimentary,
        full_access_override: form.full_access_override,
        grant_reason: form.grant_reason.trim() || null,
        granted_by: user.id,
        access_expires_at: form.access_expires_at
          ? new Date(form.access_expires_at).toISOString()
          : null,
      };

      await adminSubscriptionService.updateSubscription(
        selected.id,
        payload
      );

      setSelected(null);
      setForm(initialForm);
      setMessage("Subscription updated successfully.");
      setMessageType("success");

      await loadData();
    } catch (error) {
      console.error("Subscription update error:", error);
      setMessage(
        error.message || "Unable to update subscription."
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const openPaymentReview = async (payment) => {
    setSelectedPayment(payment);
    setProofUrl("");
    setRejectionReason("");
    setMessage("");
    setProofLoading(true);

    try {
      if (!payment.proof_storage_path) {
        throw new Error("Payment screenshot is not attached.");
      }
      const url = await adminSubscriptionService.getPaymentProofUrl(
        payment.proof_storage_path
      );
      setProofUrl(url);
    } catch (error) {
      setMessage(error.message || "Unable to load payment proof.");
      setMessageType("error");
    } finally {
      setProofLoading(false);
    }
  };

  const closePaymentReview = () => {
    if (reviewingPayment) return;
    setSelectedPayment(null);
    setProofUrl("");
    setRejectionReason("");
  };

  const approveSelectedPayment = async () => {
    if (!selectedPayment || reviewingPayment) return;
    if (!window.confirm("Approve this payment and activate or schedule the subscription?")) return;

    setReviewingPayment(true);
    setMessage("");
    try {
      await adminSubscriptionService.approvePayment(
        selectedPayment.id,
        "Payment verified by platform admin."
      );
      setSelectedPayment(null);
      setProofUrl("");
      setMessage("Payment approved successfully. Subscription workflow processed.");
      setMessageType("success");
      await loadData();
    } catch (error) {
      setMessage(error.message || "Unable to approve payment.");
      setMessageType("error");
    } finally {
      setReviewingPayment(false);
    }
  };

  const rejectSelectedPayment = async () => {
    if (!selectedPayment || reviewingPayment) return;
    if (!rejectionReason.trim()) {
      setMessage("Please enter a rejection reason.");
      setMessageType("error");
      return;
    }

    setReviewingPayment(true);
    setMessage("");
    try {
      await adminSubscriptionService.rejectPayment(
        selectedPayment.id,
        rejectionReason
      );
      setSelectedPayment(null);
      setProofUrl("");
      setRejectionReason("");
      setMessage("Payment rejected successfully.");
      setMessageType("success");
      await loadData();
    } catch (error) {
      setMessage(error.message || "Unable to reject payment.");
      setMessageType("error");
    } finally {
      setReviewingPayment(false);
    }
  };

  const pendingPayments = payments.filter(
    (payment) => payment.payment_status === "pending"
  );
  const successfulPayments = payments.filter(
    (payment) => payment.payment_status === "successful"
  );
  const totalSubscriptionRevenue = successfulPayments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  const filteredSubscriptions = subscriptions.filter((item) => {
    const businessName = item.businesses?.name || "";
    const businessEmail = item.businesses?.email || "";
    const businessPhone = item.businesses?.phone || "";
    const planName = item.subscription_plans?.name || "";
    const query = search.toLowerCase().trim();

    return `${businessName} ${businessEmail} ${businessPhone} ${planName}`
      .toLowerCase()
      .includes(query);
  });

  const getLimit = (item) =>
    item.custom_customer_limit ??
    item.subscription_plans?.max_customers ??
    "Not configured";

  const isOverrideActive = (item) =>
    item.full_access_override &&
    (!item.access_expires_at ||
      new Date(item.access_expires_at) > new Date());

  const activeCount = subscriptions.filter(
    (item) => item.status === "active"
  ).length;

  const complimentaryCount = subscriptions.filter(
    (item) => item.is_complimentary
  ).length;

  const expiredCount = subscriptions.filter(
    (item) => item.status === "expired"
  ).length;

  const trialCount = subscriptions.filter(
    (item) => item.status === "trialing"
  ).length;

  const totalCustomers = subscriptions.reduce(
    (total, item) =>
      total + (Number(item.active_customer_count) || 0),
    0
  );

  return (
    <div className="w-full min-w-0 space-y-6 transition-opacity duration-200">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F8F2D8] text-[#927719]">
              <FiCreditCard className="text-lg" />
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#927719]">
              Platform Administration
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#24262B] sm:text-3xl">
            Subscription Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage business plans, customer limits and access privileges.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#E1DDD1] bg-white px-5 py-3 text-[13px] font-semibold text-[#24262B] transition hover:border-[#D2CDBF] hover:bg-[#F8F7F2] disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {/* SUBSCRIPTION / PAYMENT TABS */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#EDEAE0] bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("subscriptions")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === "subscriptions" ? "bg-[#24262B] text-white" : "text-gray-600 hover:bg-[#F8F7F2]"
          }`}
        >
          Subscription Management
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === "payments" ? "bg-[#24262B] text-white" : "text-gray-600 hover:bg-[#F8F7F2]"
          }`}
        >
          Payment Verification
          {pendingPayments.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
              {pendingPayments.length}
            </span>
          )}
        </button>
      </div>

      {/* PAGE MESSAGE */}
      {message && !selected && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            messageType === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {messageType === "success" ? (
            <FiCheckCircle className="mt-0.5 shrink-0 text-lg" />
          ) : (
            <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />
          )}

          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            className="ml-auto"
            aria-label="Dismiss message"
          >
            <FiX />
          </button>
        </div>
      )}

      {activeTab === "subscriptions" ? (
        <>
      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Subscriptions"
          value={subscriptions.length}
          description="All business accounts"
          icon={<FiCreditCard />}
          accent="default"
        />

        <StatCard
          label="Active"
          value={activeCount}
          description="Currently active"
          icon={<FiCheckCircle />}
          accent="green"
        />

        <StatCard
          label="Trial Accounts"
          value={trialCount}
          description="Currently in trial"
          icon={<FiClock />}
          accent="blue"
        />

        <StatCard
          label="Complimentary"
          value={complimentaryCount}
          description="Admin granted access"
          icon={<FiGift />}
          accent="gold"
        />

        <StatCard
          label="Expired"
          value={expiredCount}
          description="Access has expired"
          icon={<FiAlertCircle />}
          accent="red"
        />
      </div>

      {/* CUSTOMER COUNT OVERVIEW */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#EDEAE0] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8F2D8] text-[#927719]">
            <FiUsers className="text-xl" />
          </div>

          <div>
            <p className="text-sm font-semibold text-[#24262B]">
              Customers across subscribed businesses
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Combined active customer count
            </p>
          </div>
        </div>

        <p className="text-2xl font-bold tabular-nums text-[#24262B]">
          {totalCustomers.toLocaleString("en-IN")}
          <span className="ml-2 text-xs font-medium text-gray-400">
            customers
          </span>
        </p>
      </div>

      {/* SEARCH AND TABLE */}
      <div className="overflow-hidden rounded-2xl border border-[#EDEAE0] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#EDEAE0] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-[#24262B]">
              All Subscriptions
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {filteredSubscriptions.length} of {subscriptions.length} records
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400">
              <FiSearch />
            </span>

            <input
              type="search"
              className="h-[46px] w-full rounded-xl border border-[#E1DDD1] bg-white py-0 pl-11 pr-4 text-sm text-[#24262B] outline-none transition placeholder:text-gray-400 focus:border-[#C6A82D] focus:ring-[3px] focus:ring-[#E9CA43]/15"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search business, email, phone or plan..."
              aria-label="Search subscriptions"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4"
              >
                <div className="h-10 w-10 animate-pulse rounded-xl bg-[#EEEBE2]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-[#EEEBE2]" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-[#EEEBE2]" />
                </div>
                <div className="h-8 w-20 animate-pulse rounded-lg bg-[#EEEBE2]" />
              </div>
            ))}
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8F7F2] text-2xl text-gray-400">
              <FiSearch />
            </div>

            <h3 className="mt-4 font-semibold text-[#24262B]">
              No subscriptions found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try another search term or refresh the data.
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 text-sm font-semibold text-[#927719] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[1150px] text-left text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-4">Business</th>
                  <th className="px-5 py-4">Plan</th>
                  <th className="px-5 py-4">Customers</th>
                  <th className="px-5 py-4">Limit</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Access</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredSubscriptions.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8F2D8] text-[#927719]">
                          <FiDroplet className="text-lg" />
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate font-semibold text-[#24262B]">
                            {item.businesses?.name || "Unknown business"}
                          </p>

                          <p className="mt-1 flex items-center gap-1 truncate text-xs text-gray-500">
                            <FiMail className="shrink-0" />
                            {item.businesses?.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#34363B]">
                        {item.subscription_plans?.name || "Unknown"}
                      </p>
                      <p className="mt-1 text-xs capitalize text-gray-400">
                        {item.billing_cycle || "monthly"} billing
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold tabular-nums text-[#34363B]">
                        {Number(
                          item.active_customer_count || 0
                        ).toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-medium text-[#34363B]">
                      {isOverrideActive(item)
                        ? "Unlimited"
                        : getLimit(item)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-5 py-4">
                      {isOverrideActive(item) ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
                          <FiShield />
                          Full Access
                        </span>
                      ) : item.is_complimentary ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                          <FiGift />
                          Complimentary
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-gray-500">
                          Standard
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEditor(item)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#24262B] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-black hover:shadow-md"
                      >
                        <FiEdit3 />
                        Manage
                        <FiChevronRight />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

        </>
      ) : (
        <PaymentManagementPanel
          payments={payments}
          pendingPayments={pendingPayments}
          successfulPayments={successfulPayments}
          totalRevenue={totalSubscriptionRevenue}
          onReview={openPaymentReview}
        />
      )}

      {/* PAYMENT REVIEW MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#17191D]/60 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="payment-review-title"
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#EDEAE0] px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#927719]">Manual payment verification</p>
                <h2 id="payment-review-title" className="mt-1 text-xl font-bold text-[#24262B]">Review payment</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedPayment.businesses?.name || "Business"} · {selectedPayment.id}
                </p>
              </div>
              <button type="button" onClick={closePaymentReview} disabled={reviewingPayment}
                aria-label="Close payment review"
                className="rounded-xl border border-[#EDEAE0] p-2 text-gray-500 hover:bg-[#F8F7F2] disabled:opacity-50">
                <FiX />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
              {message && (
                <div role="alert" className={`rounded-xl border px-4 py-3 text-sm ${
                  messageType === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
                }`}>{message}</div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <PaymentDetail label="Plan" value={selectedPayment.subscription_plans?.name || "Unknown"} />
                <PaymentDetail label="Amount" value={`${selectedPayment.currency || "INR"} ${Number(selectedPayment.amount || 0).toLocaleString("en-IN")}`} />
                <PaymentDetail label="Billing cycle" value={selectedPayment.billing_cycle || "—"} />
                <PaymentDetail label="Payment method" value={selectedPayment.payment_method || "—"} />
                <PaymentDetail label="Transaction reference" value={selectedPayment.reference_no || "—"} />
                <PaymentDetail label="Submitted" value={selectedPayment.created_at ? new Date(selectedPayment.created_at).toLocaleString("en-IN") : "—"} />
                <PaymentDetail label="Business email" value={selectedPayment.businesses?.email || "—"} />
                <PaymentDetail label="Status" value={selectedPayment.payment_status || "pending"} />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#24262B]">Payment screenshot</h3>
                  <span className="text-xs text-gray-400">Private storage</span>
                </div>
                <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-2xl border border-[#EDEAE0] bg-[#F8F7F2] p-3">
                  {proofLoading ? (
                    <p className="text-sm text-gray-500">Loading screenshot…</p>
                  ) : proofUrl ? (
                    <a href={proofUrl} target="_blank" rel="noreferrer" className="block max-h-[420px]">
                      <img src={proofUrl} alt="Customer payment proof"
                        className="mx-auto max-h-[420px] max-w-full rounded-lg object-contain" />
                    </a>
                  ) : (
                    <p className="text-sm text-red-600">Screenshot unavailable. Check storage path and bucket permissions.</p>
                  )}
                </div>
              </div>

              {selectedPayment.payment_status === "pending" && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#34363B]">
                    Rejection reason (required only when rejecting)
                  </label>
                  <textarea value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    rows={3} maxLength={1000}
                    placeholder="Explain why this payment cannot be verified..."
                    className="w-full rounded-xl border border-[#E1DDD1] px-4 py-3 text-sm outline-none focus:border-[#C6A82D] focus:ring-2 focus:ring-[#E9CA43]/20" />
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#EDEAE0] bg-white px-6 py-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={closePaymentReview} disabled={reviewingPayment}
                className="rounded-xl border border-[#E1DDD1] px-5 py-3 text-sm font-semibold text-[#24262B] hover:bg-[#F8F7F2] disabled:opacity-50">
                Close
              </button>
              {selectedPayment.payment_status === "pending" && (
                <>
                  <button type="button" onClick={rejectSelectedPayment}
                    disabled={reviewingPayment || !rejectionReason.trim()}
                    className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">
                    {reviewingPayment ? "Processing…" : "Reject payment"}
                  </button>
                  <button type="button" onClick={approveSelectedPayment}
                    disabled={reviewingPayment || proofLoading || !proofUrl}
                    className="rounded-xl bg-[#24262B] px-5 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">
                    {reviewingPayment ? "Processing…" : "Approve & activate"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MANAGE SUBSCRIPTION MODAL */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17191D]/55 p-4 backdrop-blur-[5px] transition-opacity duration-200 max-sm:items-end max-sm:p-0"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeEditor();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-subscription-title"
            className="flex max-h-[94vh] w-full max-w-[900px] flex-col overflow-hidden rounded-3xl border border-[#EDEAE0] bg-white shadow-[0_20px_55px_rgba(36,38,43,0.12)] transition-all duration-200 max-sm:max-h-[94dvh] max-sm:rounded-b-none max-sm:rounded-t-3xl"
          >
            {/* MODAL HEADER */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#EDEAE0] px-7 py-6">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#F8F2D8] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#806A16]">
                  <FiSettings />
                  Admin Controls
                </div>

                <h2
                  id="manage-subscription-title"
                  className="text-xl font-bold tracking-tight text-[#24262B] sm:text-2xl"
                >
                  Manage Subscription
                </h2>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {selected.businesses?.name || "Unknown Business"}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <FiUsers />
                    Active customers:
                    <strong className="font-semibold text-[#24262B]">
                      {selected.active_customer_count ?? 0}
                    </strong>
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <FiCalendar />
                    Current expiry:
                    <strong className="font-semibold text-[#24262B]">
                      {selected.ends_at
                        ? new Date(
                            selected.ends_at
                          ).toLocaleDateString("en-IN")
                        : "—"}
                    </strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                aria-label="Close modal"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EDEAE0] bg-white text-gray-500 transition hover:bg-[#F8F7F2] hover:text-[#24262B] disabled:opacity-50"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* MODAL FORM */}
            <form
              onSubmit={saveSubscription}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-7 py-6">
                {message && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />
                    <span>{message}</span>
                  </div>
                )}

                {/* SUBSCRIPTION DETAILS */}
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <FiCreditCard className="text-lg text-[#927719]" />
                    <h3 className="text-sm font-bold text-[#24262B]">
                      Subscription Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                    <Field label="Subscription Plan">
                      <select
                        required
                        value={form.plan_id}
                        onChange={(e) =>
                          updateField("plan_id", e.target.value)
                        }
                        className="h-[46px] w-full min-w-0 rounded-xl border border-[#E1DDD1] bg-white px-3 text-sm text-[#24262B] outline-none transition placeholder:text-gray-400 hover:border-[#D2CDBF] focus:border-[#C6A82D] focus:ring-[3px] focus:ring-[#E9CA43]/15"
                      >
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}
                            {plan.max_customers != null
                              ? ` (${plan.max_customers} customers)`
                              : " (Custom limit required)"}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Subscription Status">
                      <select
                        value={form.status}
                        onChange={(e) =>
                          updateField("status", e.target.value)
                        }
                        className="h-[46px] w-full min-w-0 rounded-xl border border-[#E1DDD1] bg-white px-3 text-sm text-[#24262B] outline-none transition placeholder:text-gray-400 hover:border-[#D2CDBF] focus:border-[#C6A82D] focus:ring-[3px] focus:ring-[#E9CA43]/15"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Billing Cycle">
                      <select
                        value={form.billing_cycle}
                        onChange={(e) =>
                          updateField("billing_cycle", e.target.value)
                        }
                        className="h-[46px] w-full min-w-0 rounded-xl border border-[#E1DDD1] bg-white px-3 text-sm text-[#24262B] outline-none transition placeholder:text-gray-400 hover:border-[#D2CDBF] focus:border-[#C6A82D] focus:ring-[3px] focus:ring-[#E9CA43]/15"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="custom">Custom</option>
                      </select>
                    </Field>

                    <Field label="Custom Customer Limit">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.custom_customer_limit}
                        onChange={(e) =>
                          updateField(
                            "custom_customer_limit",
                            e.target.value
                          )
                        }
                        placeholder="Leave blank to use plan limit"
                        className="h-[46px] w-full min-w-0 rounded-xl border border-[#E1DDD1] bg-white px-3 text-sm text-[#24262B] outline-none transition placeholder:text-gray-400 hover:border-[#D2CDBF] focus:border-[#C6A82D] focus:ring-[3px] focus:ring-[#E9CA43]/15"
                      />
                    </Field>

                    <Field label="Access Expiry (optional)">
                      <input
                        type="datetime-local"
                        value={form.access_expires_at}
                        onChange={(e) =>
                          updateField(
                            "access_expires_at",
                            e.target.value
                          )
                        }
                        className="h-[46px] w-full min-w-0 rounded-xl border border-[#E1DDD1] bg-white px-3 text-sm text-[#24262B] outline-none transition placeholder:text-gray-400 hover:border-[#D2CDBF] focus:border-[#C6A82D] focus:ring-[3px] focus:ring-[#E9CA43]/15"
                      />
                    </Field>

                    <Field label="Grant Reason">
                      <input
                        value={form.grant_reason}
                        onChange={(e) =>
                          updateField("grant_reason", e.target.value)
                        }
                        placeholder="Reason for admin access or adjustment"
                        className="h-[46px] w-full min-w-0 rounded-xl border border-[#E1DDD1] bg-white px-3 text-sm text-[#24262B] outline-none transition placeholder:text-gray-400 hover:border-[#D2CDBF] focus:border-[#C6A82D] focus:ring-[3px] focus:ring-[#E9CA43]/15"
                      />
                    </Field>
                  </div>
                </div>

                {/* ACCESS PERMISSIONS */}
                <div className="rounded-2xl border border-[#EDEAE0] bg-[#F8F7F2] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <FiShield className="text-lg text-[#927719]" />

                    <div>
                      <h3 className="text-sm font-bold text-[#24262B]">
                        Access Permissions
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Configure special access privileges.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <PermissionOption
                      icon={<FiGift />}
                      title="Complimentary Subscription"
                      description="Mark this subscription as complimentary."
                      checked={form.is_complimentary}
                      onChange={(value) =>
                        updateField("is_complimentary", value)
                      }
                    />

                    <div className="border-t border-[#E9E5D9]" />

                    <PermissionOption
                      icon={<FiShield />}
                      title="Grant Full Access Override"
                      description="Bypass the subscription plan's customer limit."
                      checked={form.full_access_override}
                      onChange={(value) =>
                        updateField("full_access_override", value)
                      }
                    />
                  </div>

                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#EDEAE0] bg-white px-4 py-3">
                    <FiAlertCircle className="mt-0.5 shrink-0 text-[#927719]" />
                    <p className="text-xs leading-5 text-gray-500">
                      Full access bypasses the customer limit. Set an expiry
                      date when the override should be temporary. Without an
                      expiry, the override remains active until revoked.
                    </p>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#EDEAE0] bg-white px-7 py-4 max-sm:flex-col-reverse max-sm:items-stretch max-sm:px-5">
                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#E1DDD1] bg-white px-5 py-3 text-[13px] font-semibold text-[#24262B] transition hover:border-[#D2CDBF] hover:bg-[#F8F7F2] disabled:cursor-not-allowed disabled:opacity-50 max-sm:w-full"
                >
                  <FiX />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#24262B] bg-[#24262B] px-5 py-3 text-[13px] font-semibold text-white shadow-sm transition hover:bg-black hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 max-sm:w-full"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <FiSave />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentDetail({ label, value }) {
  return (
    <div className="rounded-xl border border-[#EDEAE0] bg-[#FCFBF8] p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold capitalize text-[#24262B]">{value}</p>
    </div>
  );
}

function PaymentManagementPanel({
  payments,
  pendingPayments,
  successfulPayments,
  totalRevenue,
  onReview,
}) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const filteredPayments = payments.filter((payment) => {
    const matchesStatus = filter === "all" || payment.payment_status === filter;
    const searchText = [
      payment.businesses?.name,
      payment.businesses?.email,
      payment.reference_no,
      payment.subscription_plans?.name,
      payment.id,
    ].filter(Boolean).join(" ").toLowerCase();
    return matchesStatus && searchText.includes(query.toLowerCase().trim());
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending verification" value={pendingPayments.length}
          description="Awaiting admin review" icon={<FiClock />} accent="gold" />
        <StatCard label="Successful payments" value={successfulPayments.length}
          description="Verified payments" icon={<FiCheckCircle />} accent="green" />
        <StatCard label="Subscription revenue"
          value={`₹${Number(totalRevenue || 0).toLocaleString("en-IN")}`}
          description="Successful payments only" icon={<FiCreditCard />} accent="default" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#EDEAE0] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#EDEAE0] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-[#24262B]">Subscription payments</h2>
            <p className="mt-1 text-xs text-gray-500">
              {filteredPayments.length} payment records · {pendingPayments.length} pending
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Search business, UTR or plan..."
              className="h-11 min-w-0 rounded-xl border border-[#E1DDD1] px-4 text-sm outline-none focus:border-[#C6A82D] sm:w-64" />
            <select value={filter} onChange={(event) => setFilter(event.target.value)}
              className="h-11 rounded-xl border border-[#E1DDD1] bg-white px-3 text-sm outline-none focus:border-[#C6A82D]">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="successful">Successful</option>
              <option value="rejected">Rejected</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <FiCreditCard className="mx-auto text-3xl text-gray-300" />
            <p className="mt-3 font-semibold text-[#24262B]">No payment records found</p>
            <p className="mt-1 text-sm text-gray-500">Payments will appear here after business checkout submissions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full text-left text-sm">
              <thead className="bg-[#F8F7F2] text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4">Business</th>
                  <th className="px-5 py-4">Plan</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Reference</th>
                  <th className="px-5 py-4">Submitted</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-t border-[#F0EEE7]">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#24262B]">{payment.businesses?.name || "Unknown business"}</p>
                      <p className="mt-1 text-xs text-gray-500">{payment.businesses?.email || "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#24262B]">{payment.subscription_plans?.name || "Unknown plan"}</p>
                      <p className="mt-1 text-xs capitalize text-gray-400">{payment.billing_cycle || "—"}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold tabular-nums text-[#24262B]">
                      {payment.currency || "INR"} {Number(payment.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600">{payment.reference_no || "—"}</td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      {payment.created_at ? new Date(payment.created_at).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={payment.payment_status} /></td>
                    <td className="px-5 py-4 text-right">
                      <button type="button" onClick={() => onReview(payment)}
                        className="rounded-lg border border-[#E1DDD1] px-3 py-2 text-xs font-semibold text-[#24262B] hover:border-[#C6A82D] hover:bg-[#F8F7F2]">
                        {payment.payment_status === "pending" ? "Review payment" : "View details"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================
   STAT CARD
========================================= */

function StatCard({
  label,
  value,
  description,
  icon,
  accent = "default",
}) {
  const accents = {
    default: "bg-[#F7F6F0] text-[#24262B]",
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    gold: "bg-[#F8F2D8] text-[#927719]",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#EDEAE0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-[#24262B]">
            {Number(value || 0).toLocaleString("en-IN")}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${accents[accent]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================
   FIELD
========================================= */

function Field({ label, children }) {
  return (
    <div className="min-w-0 space-y-2">
      <label className="block text-sm font-semibold text-[#34363B]">
        {label}
      </label>
      {children}
    </div>
  );
}

/* =========================================
   PERMISSION OPTION
========================================= */

function PermissionOption({
  icon,
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[#B89A22]"
      />

      <span className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#927719] shadow-sm">
          {icon}
        </span>

        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#24262B]">
            {title}
          </span>
          <span className="mt-0.5 block text-xs text-gray-500">
            {description}
          </span>
        </span>
      </span>
    </label>
  );
}

/* =========================================
   STATUS BADGE
========================================= */

function StatusBadge({ status }) {
  const styles = {
    active: "bg-green-50 text-green-700",
    trialing: "bg-blue-50 text-blue-700",
    past_due: "bg-amber-50 text-amber-700",
    cancelled: "bg-gray-100 text-gray-600",
    expired: "bg-red-50 text-red-700",
    suspended: "bg-red-50 text-red-700",
    pending: "bg-amber-50 text-amber-700",
    successful: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    failed: "bg-red-50 text-red-700",
    refunded: "bg-purple-50 text-purple-700",
  };

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold capitalize ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status?.replace("_", " ") || "Unknown"}
    </span>
  );
}
