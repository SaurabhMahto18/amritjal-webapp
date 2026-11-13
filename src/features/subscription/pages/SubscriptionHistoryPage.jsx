import { Link } from "react-router-dom";

import {
  getMyPayments,
} from "../services/subscriptionService";

import {
  dateText,
  money,
  Notice,
  PageShell,
  Panel,
  StatusPill,
  useAsync,
} from "./subscriptionUi";

export default function SubscriptionHistoryPage() {
  const {
    data: payments,
    loading,
    error,
  } = useAsync(getMyPayments, []);

  return (
    <PageShell
      title="Subscription history"
      subtitle="Review your subscription payments, transaction references and verification status."
    >
      <Panel>

        {/* HEADER */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">
              Payment records
            </h2>

            <p className="mt-1 text-sm text-[#686961]">
              Your previous subscription transactions.
            </p>
          </div>

          <Link
            to="/subscriptions"
            className="rounded-xl bg-[#24262B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#3B3D42]"
          >
            View plans
          </Link>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-[#F7F6F0]"
              />
            ))}
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <Notice type="error">
            {error}
          </Notice>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && !payments?.length && (
          <div className="py-12 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#F7F6F0] text-[#8A7620]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-7"
              >
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />

                <path
                  d="M3 10h18M7 15h4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h3 className="mt-4 text-lg font-bold">
              No subscription payments yet
            </h3>

            <p className="mt-2 text-sm text-[#686961]">
              Your subscription payment history will appear here.
            </p>

            <Link
              to="/subscriptions"
              className="mt-5 inline-flex rounded-xl bg-[#24262B] px-5 py-3 text-sm font-bold text-white"
            >
              Explore plans
            </Link>
          </div>
        )}

        {/* PAYMENT TABLE */}
        {!loading && !error && payments?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">

              <thead>
                <tr className="border-b border-[#EDEAE0] text-xs uppercase tracking-wider text-[#85857D]">
                  <th className="px-3 py-4">
                    Date
                  </th>

                  <th className="px-3 py-4">
                    Reference
                  </th>

                  <th className="px-3 py-4">
                    Amount
                  </th>

                  <th className="px-3 py-4">
                    Cycle
                  </th>

                  <th className="px-3 py-4">
                    Status
                  </th>

                  <th className="px-3 py-4">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-[#F0EEE7] last:border-0 hover:bg-[#FAF9F5]"
                  >
                    <td className="px-3 py-4">
                      {dateText(payment.created_at)}
                    </td>

                    <td className="max-w-44 truncate px-3 py-4 font-medium">
                      {payment.reference_no || "—"}
                    </td>

                    <td className="px-3 py-4 font-bold">
                      {money(payment.amount)}
                    </td>

                    <td className="px-3 py-4 capitalize">
                      {payment.billing_cycle || "—"}
                    </td>

                    <td className="px-3 py-4">
                      <StatusPill
                        status={payment.payment_status}
                      />
                    </td>

                    <td className="px-3 py-4">
                      <Link
                        className="font-semibold text-[#796516] underline"
                        to={`/subscription/payment-status?paymentId=${encodeURIComponent(
                          payment.id
                        )}`}
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </Panel>
    </PageShell>
  );
}