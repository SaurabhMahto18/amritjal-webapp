
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, LogOut, LoaderCircle } from "lucide-react";

import { useAuthContext } from "../providers/AuthProvider";

export default function SuspendedBusinessPage() {
  const { businessAccess, signOut } = useAuthContext();

  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      await signOut();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout failed:", error);

      setLogoutError(
        error?.message || "Logout nahi ho paya. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm sm:p-8">

        {/* ICON */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ShieldAlert
            size={34}
            className="text-red-600"
          />
        </div>

        {/* HEADING */}
        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-red-600">
          Business Access Restricted
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Account Suspended
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Access to this business account has been temporarily suspended
          by the platform administrator.
        </p>

        {/* BUSINESS DETAILS */}
        {businessAccess?.businessName && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
            <p className="text-xs font-medium text-slate-500">
              Business
            </p>

            <p className="mt-1 break-words font-semibold text-slate-900">
              {businessAccess.businessName}
            </p>
          </div>
        )}

        {/* SUSPENSION REASON */}
        {businessAccess?.suspensionReason && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-left">
            <p className="text-xs font-semibold text-red-700">
              Suspension Reason
            </p>

            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-red-800">
              {businessAccess.suspensionReason}
            </p>
          </div>
        )}

        {/* SUPPORT MESSAGE */}
        <p className="mt-5 text-sm leading-6 text-slate-500">
          Please contact the platform administrator for assistance
          regarding your business account.
        </p>

        {/* LOGOUT ERROR */}
        {logoutError && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-left text-sm text-red-700"
          >
            {logoutError}
          </div>
        )}

        {/* LOGOUT BUTTON */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loggingOut ? (
            <>
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
              Signing Out...
            </>
          ) : (
            <>
              <LogOut size={17} />
              Sign Out
            </>
          )}
        </button>

        <p className="mt-4 text-xs text-slate-400">
          Amrit Jal Business Console
        </p>

      </section>
    </main>
  );
}
