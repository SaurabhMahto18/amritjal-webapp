
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { verifyPlatformAdmin } from "../services/adminService";

export default function ProtectedAdminRoute() {
  const location = useLocation();

  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let mounted = true;

    async function verifyAccess() {
      try {
        const result = await verifyPlatformAdmin();

        if (!mounted) return;

        setStatus(result.isAdmin ? "authorized" : "unauthorized");
      } catch (error) {
        console.error("Admin route verification:", error);

        if (mounted) {
          setStatus("unauthorized");
        }
      }
    }

    verifyAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        if (mounted) {
          setStatus("unauthorized");
        }
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Verify after the auth callback has completed.
        Promise.resolve().then(() => {
          if (mounted) verifyAccess();
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />

          <p className="mt-4 text-sm text-slate-500">
            Checking administrator permissions...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          error: "Please sign in with an authorised platform admin account.",
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}
