import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";

export default function AuthConfirmedPage() {
  const [status, setStatus] = useState("Verifying your email...");

  useEffect(() => {
    let active = true;

    async function verifyEmail() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        const user = data?.session?.user;

        if (!user?.email_confirmed_at) {
          throw new Error("Email verification could not be confirmed.");
        }

        // Keep the newly verified account signed out.
        const { error: signOutError } = await supabase.auth.signOut({
          scope: "local",
        });

        if (signOutError) throw signOutError;

        if (active) {
          setStatus("Email verified successfully. You can now log in.");
        }
      } catch (error) {
        if (active) {
          setStatus(
            error.message || "Verification failed. Please try again."
          );
        }
      }
    }

    verifyEmail();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-5">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">
          Amrit Jal
        </h1>

        <p className="mt-4 text-slate-600">{status}</p>

        <Link
          to="/login"
          className="mt-6 inline-flex rounded-xl bg-cyan-600 px-6 py-3 font-semibold text-white"
        >
          Continue to Login
        </Link>
      </div>
    </main>
  );
}