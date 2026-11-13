
import { useEffect, useState } from "react";
import {
  suspendBusiness,
  reactivateBusiness,
} from "../services/businessStatusService";

export default function BusinessStatusModal({
  business,
  accessStatus,
  onClose,
  onSuccess,
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(false);

  const suspended = accessStatus?.is_suspended === true;

  useEffect(() => {
    setReason(accessStatus?.suspension_reason || "");
  }, [accessStatus]);

  if (!business) return null;

  async function handleAction() {
    setLoading(true);
    setError("");

    try {
      let updatedStatus;

      if (suspended) {
        updatedStatus = await reactivateBusiness(business.id);
      } else {
        if (reason.trim().length < 5) {
          setError("Please provide a reason of at least 5 characters.");
          setLoading(false);
          return;
        }

        updatedStatus = await suspendBusiness(
          business.id,
          reason
        );
      }

      await onSuccess?.(updatedStatus);
      onClose();
    } catch (err) {
      setError(err.message || "Unable to update business access.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-status-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="business-status-title"
              className="text-xl font-bold text-slate-900"
            >
              {suspended ? "Reactivate Business" : "Suspend Business"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {business.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="rounded-lg px-3 py-1 text-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {suspended ? (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">
              This business is currently suspended.
            </p>

            <p className="mt-2 text-sm text-red-700">
              Reason: {accessStatus?.suspension_reason || "Not provided"}
            </p>

            <p className="mt-2 text-xs text-red-600">
              Suspended on:{" "}
              {accessStatus?.suspended_at
                ? new Date(accessStatus.suspended_at).toLocaleString("en-IN")
                : "Unknown"}
            </p>

            <p className="mt-2 text-xs text-red-700">
              Reactivating will remove the suspension restriction.
              The business's original account status will remain unchanged.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                Confirm business suspension
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700">
                Suspending a business should prevent its users from
                accessing protected business operations after the
                access checks are integrated.
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Suspension Reason
              </span>

              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
                minLength={5}
                maxLength={1000}
                placeholder="Enter the reason for suspending this business..."
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50"
              />

              <span className="mt-1 block text-right text-xs text-slate-400">
                {reason.length}/1000
              </span>
            </label>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {confirmation && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">
              {suspended
                ? "Are you sure you want to reactivate this business?"
                : "Are you sure you want to suspend this business?"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAction}
                disabled={loading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : suspended
                    ? "Confirm Reactivation"
                    : "Confirm Suspension"}
              </button>

              <button
                type="button"
                onClick={() => setConfirmation(false)}
                disabled={loading}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {!confirmation && (
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");

                if (!suspended && reason.trim().length < 5) {
                  setError("Please provide a reason of at least 5 characters.");
                  return;
                }

                setConfirmation(true);
              }}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${
                suspended
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {suspended ? "Reactivate Business" : "Suspend Business"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
