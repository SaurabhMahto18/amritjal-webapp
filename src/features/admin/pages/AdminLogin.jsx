
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import {
  loginPlatformAdmin,
  verifyPlatformAdmin,
} from "../services/adminService";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState(
    location.state?.error || ""
  );

  useEffect(() => {
    let mounted = true;

    async function checkExistingSession() {
      try {
        const result = await verifyPlatformAdmin();

        if (!mounted) return;

        if (result.isAdmin) {
          navigate("/admin/dashboard", { replace: true });
          return;
        }
      } catch (err) {
        console.error("Admin session verification:", err);
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      await loginPlatformAdmin(email, password);

      navigate("/admin/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error("Admin login error:", err);

      setError(
        err.message ||
          "Unable to login. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />
          <p className="mt-4 text-sm text-slate-500">
            Verifying admin access...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B192B] text-3xl font-bold text-white shadow-lg">
            A
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Amrit Jal
          </h1>

          <p className="mt-1 text-sm font-medium text-cyan-700">
            Platform Administration
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Admin Login
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sign in to manage the Amrit Jal platform.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Address
              </label>

              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter admin email"
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0B192B] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#132C49] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verifying access..." : "Secure Admin Login"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <Link
              to="/"
              className="text-sm font-medium text-slate-500 transition hover:text-cyan-700"
            >
              ← Back to Amrit Jal
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Restricted access · Authorised platform administrators only
        </p>
      </div>
    </main>
  );
}
