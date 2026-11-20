
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";

import {
  CheckCircle2,
  Clock3,
  AlertCircle,
  Loader2,
  Building2,
} from "lucide-react";

export default function AuthConfirmedPage() {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState(
    "Please wait while we verify your email."
  );

  useEffect(() => {
    let active = true;

    async function verifyEmailAndSubmitRequest() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const user = session?.user;

        if (!user) {
          throw new Error(
            "Verification session not found. Please open the latest confirmation email."
          );
        }

        if (!user.email_confirmed_at) {
          throw new Error(
            "Email verification could not be confirmed."
          );
        }

        // Existing business owners should not submit a new request.
        const { data: businessAccess, error: accessError } =
          await supabase.rpc("get_my_business_access");

        if (accessError) throw accessError;

        if (Array.isArray(businessAccess) && businessAccess.length > 0) {
          if (active) {
            setStatus("existing");
            setMessage(
              "Your existing business account is verified. You can continue to your dashboard."
            );
          }
          return;
        }

        // Read business name saved during signup.
        const businessName =
          user.user_metadata?.business_name?.trim();

        if (!businessName) {
          throw new Error(
            "Business name was not found in your signup details. Please contact support."
          );
        }

        // Submit the registration request.
        // The database RPC is idempotent for an existing pending request.
        const { data, error } = await supabase.rpc(
          "submit_business_registration",
          {
            p_business_name: businessName,
          }
        );

        if (error) throw error;

        const request = Array.isArray(data) ? data[0] : data;

        if (!request?.request_id) {
          throw new Error(
            "Registration request could not be confirmed. Please try again."
          );
        }

        if (active) {
          setStatus("pending");
          setMessage(
            "Your email is verified and your business registration request has been submitted. Our admin team will review your application."
          );
        }
      } catch (error) {
        console.error(
          "Email confirmation / registration failed:",
          error
        );

        if (active) {
          setStatus("error");
          setMessage(
            error?.message ||
              "Verification failed. Please try again."
          );
        }
      }
    }

    verifyEmailAndSubmitRequest();

    return () => {
      active = false;
    };
  }, []);

  const isPending = status === "pending";
  const isExisting = status === "existing";
  const isError = status === "error";
  const isLoading = status === "verifying";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
          {isLoading && (
            <Loader2 size={30} className="animate-spin" />
          )}

          {isPending && <Clock3 size={30} />}

          {isExisting && <CheckCircle2 size={30} />}

          {isError && <AlertCircle size={30} />}
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Amrit Jal
        </h1>

        <h2 className="mt-3 text-lg font-semibold text-slate-800">
          {isLoading && "Verifying your email"}
          {isPending && "Registration under review"}
          {isExisting && "Account verified"}
          {isError && "Verification unsuccessful"}
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {message}
        </p>

        {isPending && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
            <div className="flex items-start gap-3">
              <Building2
                size={20}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  What happens next?
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-800">
                  An administrator will review your business
                  registration. Your business dashboard will
                  become available after approval.
                </p>
              </div>
            </div>
          </div>
        )}

        {isPending && (
          <Link
            to="/registration-pending"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-cyan-700 px-6 py-3 font-semibold text-white transition hover:bg-cyan-800"
          >
            View registration status
          </Link>
        )}

        {isExisting && (
          <Link
            to="/dashboard"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-cyan-700 px-6 py-3 font-semibold text-white transition hover:bg-cyan-800"
          >
            Continue to Dashboard
          </Link>
        )}

        {isError && (
          <Link
            to="/login"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-cyan-700 px-6 py-3 font-semibold text-white transition hover:bg-cyan-800"
          >
            Continue to Login
          </Link>
        )}

      </div>
    </main>
  );
}
