
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

import {
  ShieldCheck,
  ShieldAlert,
  UserRound,
  Mail,
  CalendarDays,
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  KeyRound,
  LogOut,
  RefreshCw,
  Clock3,
  Fingerprint,
  AlertTriangle,
  Check,
} from "lucide-react";

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(email = "") {
  return email.split("@")[0].slice(0, 2).toUpperCase() || "AD";
}

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "Not entered" };

  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score: 1, label: "Weak" };
  if (score <= 4) return { score: 2, label: "Medium" };
  return { score: 3, label: "Strong" };
}

function Alert({ type = "error", children, onClose }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${styles[type]}`}
    >
      {type === "success" ? (
        <CheckCircle2 size={18} className="shrink-0" />
      ) : (
        <AlertTriangle size={18} className="shrink-0" />
      )}

      <div className="flex-1">{children}</div>

      {onClose && (
        <button onClick={onClose} aria-label="Dismiss">
          <XCircle size={17} />
        </button>
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#EDEAE0] bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-5 sm:px-6">
        <div className="rounded-xl bg-[#F7F6F0] p-2.5 text-[#8B7420]">
          <Icon size={20} />
        </div>

        <div>
          <h2 className="font-bold text-[#24262B]">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-[#FCFCFA] p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon size={14} />
        {label}
      </div>

      <p className="mt-2 break-all text-sm font-semibold text-[#24262B]">
        {value || "—"}
      </p>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
      <CheckCircle2 size={13} />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
      <XCircle size={13} />
      Inactive
    </span>
  );
}

export default function AdminSettings() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        throw new Error("Unable to load your administrator account.");
      }

      const { data: adminData, error: adminError } = await supabase
        .from("platform_admins")
        .select("user_id, role, is_active, created_at, updated_at")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (adminError) throw adminError;

      setUser(currentUser);
      setAdmin(adminData);
    } catch (err) {
      setError(err.message || "Unable to load admin settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isAuthorized = Boolean(
    user &&
    admin &&
    admin.user_id === user.id &&
    admin.is_active
  );

  const strength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  async function updatePassword(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!isAuthorized) {
      setError("Active platform admin verification is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (strength.score < 2) {
      setError("Please choose a stronger password.");
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setMessage("Your password has been updated successfully.");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      setError(err.message || "Password update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    const confirmed = window.confirm(
      "Are you sure you want to sign out of the admin panel?"
    );

    if (!confirmed) return;

    setSigningOut(true);
    setError("");

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) throw signOutError;

      window.location.replace("/admin/login");
    } catch (err) {
      setError(err.message || "Unable to sign out.");
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center bg-[#F7F6F0]">
        <div className="text-center">
          <LoaderCircle
            size={32}
            className="mx-auto animate-spin text-[#B69A27]"
          />
          <p className="mt-3 text-sm text-slate-500">
            Loading administrator settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#F7F6F0] p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#9A8540]">
            <ShieldCheck size={15} />
            Platform administration
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#24262B] sm:text-3xl">
            Admin Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your administrator account and security preferences.
          </p>
        </div>

        <button
          onClick={loadProfile}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E1D6] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-stone-50"
        >
          <RefreshCw size={16} />
          Refresh profile
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert type="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {message && (
        <Alert type="success" onClose={() => setMessage("")}>
          {message}
        </Alert>
      )}

      {!isAuthorized && (
        <Alert type="warning">
          Your account does not have active platform administrator access.
          Password changes are disabled. Contact another Super Admin.
        </Alert>
      )}

      {/* Profile card */}
      <SectionCard
        icon={UserRound}
        title="Administrator Profile"
        description="Your authenticated platform account information."
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#F7EFC9] text-xl font-bold text-[#806B19]">
              {getInitials(user?.email)}
            </div>

            <div className="min-w-0">
              <h3 className="break-all text-base font-bold text-[#24262B]">
                {user?.email || "Administrator"}
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Platform administrator account
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge active={isAuthorized} />

                {admin?.role && (
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                    {admin.role.replaceAll("_", " ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-[#FCFCFA] px-4 py-3 text-xs text-slate-500">
            {isAuthorized ? (
              <>
                <ShieldCheck size={17} className="text-emerald-600" />
                Verified admin access
              </>
            ) : (
              <>
                <ShieldAlert size={17} className="text-red-600" />
                Access not verified
              </>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t border-stone-100 pt-6 sm:grid-cols-2">
          <InfoItem
            icon={Fingerprint}
            label="Account ID"
            value={user?.id}
          />

          <InfoItem
            icon={CalendarDays}
            label="Account created"
            value={formatDate(user?.created_at)}
          />

          <InfoItem
            icon={Mail}
            label="Email verification"
            value={
              user?.email_confirmed_at
                ? "Verified"
                : "Not verified"
            }
          />

          <InfoItem
            icon={ShieldCheck}
            label="Admin status"
            value={admin?.is_active ? "Active" : "Inactive"}
          />

          <InfoItem
            icon={Clock3}
            label="Last profile update"
            value={formatDate(admin?.updated_at)}
          />

          <InfoItem
            icon={KeyRound}
            label="Admin role"
            value={admin?.role?.replaceAll("_", " ")}
          />
        </div>
      </SectionCard>

      {/* Security */}
      <SectionCard
        icon={LockKeyhole}
        title="Account Security"
        description="Change the password associated with your admin login."
      >
        <div className="mb-5 rounded-xl border border-[#EDEAE0] bg-[#FCFCFA] p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <ShieldCheck size={18} />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#24262B]">
                Password security
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Use a unique password with uppercase and lowercase letters,
                numbers and special characters. Never share your password.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={updatePassword} className="max-w-xl space-y-5">

          {/* New password */}
          <Field
            label="New Password"
            hint="Minimum 8 characters. A strong, unique password is recommended."
          >
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your new password"
                disabled={!isAuthorized || saving}
                className="w-full rounded-xl border border-stone-200 bg-[#FCFCFA] px-4 py-3 pr-12 text-sm text-[#24262B] outline-none transition focus:border-[#D9BB3C] focus:ring-2 focus:ring-[#E9CA43]/20 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {password && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">
                    Password strength
                  </span>

                  <span
                    className={`font-bold ${
                      strength.score === 3
                        ? "text-emerald-600"
                        : strength.score === 2
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {strength.label}
                  </span>
                </div>

                <div className="mt-2 flex gap-1.5">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full ${
                        level <= strength.score
                          ? strength.score === 3
                            ? "bg-emerald-500"
                            : strength.score === 2
                            ? "bg-amber-500"
                            : "bg-red-500"
                          : "bg-stone-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </Field>

          {/* Confirm password */}
          <Field label="Confirm New Password">
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your new password"
                disabled={!isAuthorized || saving}
                className="w-full rounded-xl border border-stone-200 bg-[#FCFCFA] px-4 py-3 pr-12 text-sm text-[#24262B] outline-none transition focus:border-[#D9BB3C] focus:ring-2 focus:ring-[#E9CA43]/20 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {confirmPassword && (
              <p
                className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
                  passwordsMatch ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {passwordsMatch ? (
                  <Check size={14} />
                ) : (
                  <XCircle size={14} />
                )}

                {passwordsMatch
                  ? "Passwords match"
                  : "Passwords do not match"}
              </p>
            )}
          </Field>

          <div className="border-t border-stone-100 pt-5">
            <button
              type="submit"
              disabled={
                saving ||
                !isAuthorized ||
                !password ||
                !confirmPassword ||
                !passwordsMatch
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#24262B] px-6 py-3 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Updating password...
                </>
              ) : (
                <>
                  <LockKeyhole size={17} />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Session */}
      <SectionCard
        icon={LogOut}
        title="Session Management"
        description="Securely end your current administrator session."
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-[#24262B]">
              Sign out from this device
            </p>
            <p className="mt-1 text-xs text-slate-500">
              You will need to authenticate again to access the admin panel.
            </p>
          </div>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            {signingOut ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <LogOut size={17} />
            )}
            {signingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </SectionCard>

      <p className="pb-3 text-center text-xs text-slate-400">
        Amrit Jal Platform Administration · Secure Account Settings
      </p>
    </div>
  );
}
