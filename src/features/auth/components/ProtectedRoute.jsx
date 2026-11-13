
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoaderCircle, ShieldAlert, RefreshCw } from "lucide-react";

import { useAuthContext } from "../providers/AuthProvider";
import SuspendedBusinessPage from "../pages/SuspendedBusinessPage";

function AccessLoader({ message }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-sm">
        <LoaderCircle
          size={32}
          className="animate-spin text-teal-700"
        />
        <p className="mt-4 text-sm font-medium text-slate-700">
          {message}
        </p>
      </div>
    </main>
  );
}

export default function ProtectedRoute() {
  const {
    isAuthenticated,
    loading,
    accessLoading,
    accessError,
    businessAccess,
    isBusinessSuspended,
    refreshBusinessAccess,
  } = useAuthContext();

  const location = useLocation();

  if (loading) {
    return <AccessLoader message="Session check ho raha hai..." />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Initial verification only:
  // Do not unmount the application during background verification.
  if (!businessAccess && (accessLoading || !accessError)) {
    return (
      <AccessLoader message="Business access verify ho raha hai..." />
    );
  }

  // Fail closed if access is unavailable.
  if (accessError || !businessAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-7 text-center shadow-sm">
          <ShieldAlert
            size={36}
            className="mx-auto text-amber-600"
          />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Business access unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            We could not verify your business access. Application access
            is blocked until verification succeeds.
          </p>

          {accessError && (
            <p className="mt-3 break-words text-xs text-red-600">
              {accessError}
            </p>
          )}

          <button
            type="button"
            onClick={refreshBusinessAccess}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            <RefreshCw size={16} />
            Retry verification
          </button>
        </section>
      </main>
    );
  }

  if (isBusinessSuspended) {
    return <SuspendedBusinessPage />;
  }

  return <Outlet />;
}
