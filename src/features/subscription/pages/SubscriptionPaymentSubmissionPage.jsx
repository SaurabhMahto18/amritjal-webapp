import { useEffect, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  attachPaymentProof,
} from "../services/subscriptionService";

import {
  Field,
  inputClass,
  Notice,
  PageShell,
  Panel,
  PrimaryButton,
} from "./subscriptionUi";

export default function SubscriptionPaymentSubmissionPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const paymentId = params.get("paymentId");

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Create and clean up screenshot preview URL
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  // Validate selected file
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setError("");
    setFile(null);

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file.");
      event.target.value = "";
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Allowed formats: JPG, PNG and WEBP.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Screenshot must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  // Submit payment proof
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!paymentId) {
      setError(
        "Payment ID is missing. Please return to checkout."
      );
      return;
    }

    if (!file) {
      setError("Please upload your payment screenshot.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await attachPaymentProof(paymentId, file);

      navigate(
        `/subscription/payment-status?paymentId=${encodeURIComponent(
          paymentId
        )}`,
        {
          replace: true,
        }
      );
    } catch (error) {
      setError(
        error.message || "Unable to upload payment proof."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Submit payment proof"
      subtitle="Upload a clear screenshot of your successful UPI or bank transfer. Your payment will be sent for admin verification."
    >
      <div className="mx-auto max-w-2xl">
        <Panel>

          {/* PAYMENT REQUEST INFORMATION */}
          <div className="mb-6 rounded-2xl bg-[#F7F6F0] p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#E9CA43]/25 text-[#746015]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-6"
                >
                  <path
                    d="M5 12.5 9.5 17 19 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <p className="text-sm font-bold">
                  Payment request created
                </p>

                <p className="mt-1 text-xs text-[#77766F]">
                  Upload your transaction screenshot to continue.
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-[#E5E2D8] pt-3">
              <p className="text-xs text-[#85857D]">
                Payment Reference ID
              </p>

              <p className="mt-1 break-all text-sm font-semibold">
                {paymentId || "Missing payment ID"}
              </p>
            </div>
          </div>

          {/* UPLOAD FORM */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <Field
              label="Payment screenshot"
              hint="JPG, PNG or WEBP. Maximum size 5 MB."
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className={inputClass}
                required
              />
            </Field>

            {/* IMAGE PREVIEW */}
            {preview && (
              <div className="overflow-hidden rounded-2xl border border-[#EDEAE0] bg-[#F7F6F0] p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">
                    Screenshot preview
                  </p>

                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Remove
                  </button>
                </div>

                <img
                  src={preview}
                  alt="Selected payment proof"
                  className="max-h-80 w-full rounded-xl object-contain"
                />

                <p className="mt-3 truncate text-xs text-[#77766F]">
                  {file?.name}
                </p>

                <p className="mt-1 text-xs text-[#85857D]">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}

            {/* PAYMENT INSTRUCTIONS */}
            <div className="rounded-xl border border-[#E9CA43]/40 bg-[#E9CA43]/10 p-4">
              <p className="text-sm font-bold text-[#665711]">
                Before submitting
              </p>

              <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs leading-5 text-[#74651D]">
                <li>Make sure the transaction is successful.</li>
                <li>Transaction amount and reference should be readable.</li>
                <li>Upload the original payment screenshot.</li>
                <li>Do not upload an edited or altered screenshot.</li>
              </ul>
            </div>

            {error && (
              <Notice type="error">
                {error}
              </Notice>
            )}

            {/* SUBMIT */}
            <PrimaryButton
              type="submit"
              disabled={saving || !file || !paymentId}
              className="w-full"
            >
              {saving
                ? "Uploading payment proof..."
                : "Upload proof & submit for review"}
            </PrimaryButton>

            <p className="text-center text-xs leading-5 text-[#85857D]">
              Your subscription will not activate until an
              administrator verifies and approves your payment.
            </p>
          </form>
        </Panel>
      </div>
    </PageShell>
  );
}