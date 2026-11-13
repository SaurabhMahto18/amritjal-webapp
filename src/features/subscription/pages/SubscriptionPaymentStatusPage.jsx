import { useEffect, useState } from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  getPaymentById,
} from "../services/subscriptionService";

import {
  dateText,
  money,
  Notice,
  PageShell,
  Panel,
  PrimaryButton,
  StatusPill,
} from "./subscriptionUi";

export default function SubscriptionPaymentStatusPage() {
  const [params] = useSearchParams();

  const paymentId = params.get("paymentId");

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayment = async () => {
    setLoading(true);
    setError("");

    try {
      if (!paymentId) {
        throw new Error("Payment ID is missing.");
      }

      const result = await getPaymentById(paymentId);

      if (!result) {
        throw new Error("Payment record not found.");
      }

      setPayment(result);
    } catch (err) {
      setError(err.message || "Unable to load payment status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const status = payment?.payment_status;

  return (
    <PageShell
      title="Payment status"
      subtitle="Track the verification progress of your subscription payment."
    >
      <div className="mx-auto max-w-2xl">
        <Panel>

          {loading ? (
            <div className="py-10 text-center">
              <div className="mx-auto size-9 animate-spin rounded-full border-4 border-[#EDEAE0] border-t-[#E9CA43]" />

              <p className="mt-4 text-sm text-[#686961]">
                Loading payment status...
              </p>
            </div>
          ) : error ? (
            <div className="space-y-5">
              <Notice type="error">{error}</Notice>

              <button
                type="button"
                onClick={loadPayment}
                className="rounded-xl bg-[#24262B] px-5 py-3 text-sm font-bold text-white"
              >
                Try again
              </button>
            </div>
          ) : payment ? (
            <>
              {/* STATUS HEADER */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#85857D]">
                    Payment status
                  </p>

                  <h2 className="mt-2 text-3xl font-extrabold">
                    {money(payment.amount)}
                  </h2>
                </div>

                <StatusPill status={status} />
              </div>

              {/* STATUS MESSAGE */}
              <div className="mt-6">
                {status === "pending" && (
                  <Notice>
                    Your payment proof has been submitted.
                    Our admin team will verify the transaction.
                    Your subscription is not active yet.
                  </Notice>
                )}

                {status === "successful" && (
                  <Notice type="success">
                    Your payment has been approved. Your
                    subscription has been activated or queued
                    according to your current plan validity.
                  </Notice>
                )}

                {status === "rejected" && (
                  <Notice type="error">
                    Your payment was rejected by the admin.
                    Please check the reason below.
                  </Notice>
                )}

                {status === "failed" && (
                  <Notice type="error">
                    This payment was marked as failed.
                    Please contact support for assistance.
                  </Notice>
                )}

                {status === "refunded" && (
                  <Notice>
                    This payment has been marked as refunded.
                  </Notice>
                )}
              </div>

              {/* PAYMENT INFORMATION */}
              <div className="mt-7">
                <h3 className="text-sm font-bold">
                  Transaction details
                </h3>

                <div className="mt-4 grid gap-4 rounded-2xl bg-[#F7F6F0] p-4 sm:grid-cols-2">

                  <div>
                    <p className="text-xs text-[#85857D]">
                      Transaction reference
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold">
                      {payment.reference_no || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#85857D]">
                      Submitted on
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {dateText(payment.created_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#85857D]">
                      Payment method
                    </p>

                    <p className="mt-1 text-sm font-semibold capitalize">
                      {String(payment.payment_method || "—").replaceAll(
                        "_",
                        " "
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#85857D]">
                      Billing cycle
                    </p>

                    <p className="mt-1 text-sm font-semibold capitalize">
                      {payment.billing_cycle || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#85857D]">
                      Payment ID
                    </p>

                    <p className="mt-1 break-all text-xs font-semibold">
                      {payment.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#85857D]">
                      Last updated
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {dateText(payment.updated_at)}
                    </p>
                  </div>

                </div>
              </div>

              {/* REJECTION REASON */}
              {status === "rejected" && (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-bold text-rose-800">
                    Admin rejection reason
                  </p>

                  <p className="mt-2 text-sm leading-6 text-rose-700">
                    {payment.rejection_reason ||
                      "No rejection reason was provided. Please contact support."}
                  </p>
                </div>
              )}

              {/* ACTIONS */}
              <div className="mt-7 flex flex-wrap gap-3">

                <Link to="/subscription/history">
                  <PrimaryButton>
                    Payment history
                  </PrimaryButton>
                </Link>

                <Link
                  to="/subscription/my-plan"
                  className="inline-flex items-center rounded-xl border border-[#E5E2D8] px-5 py-3 text-sm font-bold text-[#24262B] hover:bg-[#F7F6F0]"
                >
                  My subscription
                </Link>

                {status === "rejected" && (
                  <Link
                    to="/subscription/upgrade"
                    className="inline-flex items-center rounded-xl border border-[#E5E2D8] px-5 py-3 text-sm font-bold text-[#24262B] hover:bg-[#F7F6F0]"
                  >
                    Choose another plan
                  </Link>
                )}

              </div>
            </>
          ) : null}

        </Panel>
      </div>
    </PageShell>
  );
}