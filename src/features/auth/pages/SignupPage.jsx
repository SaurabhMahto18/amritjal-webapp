
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Droplets,
  Mail,
  LockKeyhole,
  LoaderCircle,
  ArrowRight,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Building2,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowLeft,
  Check,
  Clock3,
  AlertCircle,
} from "lucide-react";

import { useAuthContext } from "../providers/AuthProvider";
import { supabase } from "../../../lib/supabase/client";

const SEO_TITLE = "Create Account | Amrit Jal";

const SEO_DESCRIPTION =
  "Create your Amrit Jal account to manage water delivery, customers, jar inventory and business payments.";

function updateMeta(name, content, attribute = "name") {
  let element = document.head.querySelector(
    `meta[${attribute}="${name}"]`
  );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);

  return element;
}

export default function SignupPage() {
  const {
    signUp,
    resendSignupConfirmation,
  } = useAuthContext();

  const navigate = useNavigate();
  const googleCallbackHandled = useRef(false);

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [emailSent, setEmailSent] = useState(false);
  const [googleSignupComplete, setGoogleSignupComplete] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ======================================
  // SEO METADATA
  // ======================================

  useEffect(() => {
    const previousTitle = document.title;

    const previousDescription = document.head.querySelector(
      'meta[name="description"]'
    )?.getAttribute("content");

    const previousRobots = document.head.querySelector(
      'meta[name="robots"]'
    )?.getAttribute("content");

    const previousThemeColor = document.head.querySelector(
      'meta[name="theme-color"]'
    )?.getAttribute("content");

    document.title = SEO_TITLE;

    updateMeta("description", SEO_DESCRIPTION);
    updateMeta("robots", "noindex, nofollow");
    updateMeta("theme-color", "#F3FBFF");

    return () => {
      document.title = previousTitle;

      const restoreMeta = (name, previousValue) => {
        const element = document.head.querySelector(
          `meta[name="${name}"]`
        );

        if (!element) return;

        if (previousValue === null || previousValue === undefined) {
          element.remove();
        } else {
          element.setAttribute("content", previousValue);
        }
      };

      restoreMeta("description", previousDescription);
      restoreMeta("robots", previousRobots);
      restoreMeta("theme-color", previousThemeColor);
    };
  }, []);



  // ======================================
  // GOOGLE OAUTH CALLBACK
  // ======================================

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const isGoogleSignup =
      params.get("google_signup") === "1";

    const returnedBusinessName =
      params.get("business_name")?.trim() || "";

    if (!isGoogleSignup || googleCallbackHandled.current) {
      return;
    }

    googleCallbackHandled.current = true;

    async function completeGoogleSignup() {
      setGoogleLoading(true);
      setError("");
      setMessage("");

      try {
        // Check OAuth callback errors
        const oauthError =
          params.get("error_description") ||
          params.get("error");

        if (oauthError) {
          throw new Error(
            decodeURIComponent(oauthError.replace(/\+/g, " "))
          );
        }

        // Validate business name
        if (
          !returnedBusinessName ||
          returnedBusinessName.length > 120
        ) {
          throw new Error(
            "A valid business name is required."
          );
        }

        // Get authenticated Google session.
        // Supabase automatically handles the PKCE callback
        // because detectSessionInUrl is enabled.
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session?.user) {
          throw new Error(
            "Google authentication session was not found. Please try again."
          );
        }

        if (!session.user.email) {
          throw new Error(
            "Google account email could not be verified."
          );
        }

        console.log(
          "Google user authenticated:",
          session.user.id
        );

        // Check whether user already has business access
        const {
          data: accessData,
          error: accessError,
        } = await supabase.rpc("get_my_business_access");

        if (accessError) throw accessError;

        const existingBusiness = Array.isArray(accessData)
          ? accessData[0]
          : accessData;

        if (existingBusiness?.business_id) {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          navigate("/dashboard", { replace: true });
          return;
        }

        // Update authenticated user metadata
        const { error: updateError } =
          await supabase.auth.updateUser({
            data: {
              business_name: returnedBusinessName,
            },
          });

        if (updateError) throw updateError;

        // Submit business registration request ONCE
        const {
          data: registrationData,
          error: registrationError,
        } = await supabase.rpc(
          "submit_business_registration",
          {
            p_business_name: returnedBusinessName,
          }
        );

        console.log(
          "Registration response:",
          registrationData
        );

        console.log(
          "Registration error:",
          registrationError
        );

        if (registrationError) {
          throw registrationError;
        }

        if (
          !Array.isArray(registrationData) ||
          registrationData.length === 0
        ) {
          throw new Error(
            "Registration request was not returned by the server."
          );
        }

        // Show success only after successful registration
        setEmail(session.user.email);
        setBusinessName(returnedBusinessName);
        setGoogleSignupComplete(true);

        // Clean callback query parameters
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

      } catch (err) {
        console.error(
          "Google registration failed:",
          err
        );

        setError(
          err?.message ||
          "Google registration could not be completed."
        );

      } finally {
        setGoogleLoading(false);
      }
    }

    completeGoogleSignup();

  }, [navigate]);


  // ======================================
  // EMAIL / PASSWORD SIGNUP
  // ======================================

  async function handleSignup(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedBusinessName = businessName.trim();

    if (!normalizedBusinessName) {
      setError("Please enter your business name.");
      return;
    }

    if (normalizedBusinessName.length > 120) {
      setError(
        "Business name cannot exceed 120 characters."
      );
      return;
    }

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (loading || googleLoading) return;

    setLoading(true);

    try {
      await signUp(
        normalizedEmail,
        password,
        normalizedBusinessName
      );

      setEmail(normalizedEmail);
      setEmailSent(true);

      setPassword("");
      setConfirmPassword("");

      setMessage(
        "Your confirmation email has been sent successfully."
      );
    } catch (err) {
      console.error("Email signup failed:", err);

      setError(
        err?.message ||
        "Registration could not be completed."
      );
    } finally {
      setLoading(false);
    }
  }

  // ======================================
  // GOOGLE SIGNUP
  // ======================================

  async function handleGoogleSignup() {
    setError("");

    const normalizedBusinessName = businessName.trim();

    if (!normalizedBusinessName) {
      setError("Please enter your business name first.");
      return;
    }

    if (normalizedBusinessName.length > 120) {
      setError("Business name cannot exceed 120 characters.");
      return;
    }

    setGoogleLoading(true);

    try {
      const redirectUrl = new URL(
        "/signup",
        window.location.origin
      );

      redirectUrl.searchParams.set("google_signup", "1");

      redirectUrl.searchParams.set(
        "business_name",
        normalizedBusinessName
      );

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl.toString(),
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Google signup failed:", error);

      setError(
        error.message || "Google signup could not be started."
      );

      setGoogleLoading(false);
    }
  }

  // ======================================
  // RESEND CONFIRMATION EMAIL
  // ======================================

  async function handleResendEmail() {
    if (!email || resending) return;

    setError("");
    setMessage("");
    setResending(true);

    try {
      await resendSignupConfirmation(email);

      setMessage(
        "A new confirmation email has been requested. Please check your inbox."
      );
    } catch (err) {
      setError(
        err?.message ||
        "Could not resend the confirmation email."
      );
    } finally {
      setResending(false);
    }
  }

  // ======================================
  // INPUT STYLES
  // ======================================

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50";

  const isSubmitting = loading || googleLoading;

  // ======================================
  // RENDER
  // ======================================

  return (
    <main className="min-h-screen bg-[#F3FBFF] text-slate-800">

      {/* HEADER */}

      <header className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          <Link
            to="/login"
            aria-label="Amrit Jal home"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-700 text-white">
              <Droplets size={25} />
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                Amrit<span className="text-cyan-700"> Jal</span>
              </h1>

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Water Business Management
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-sm">
            <span className="hidden text-slate-500 sm:inline">
              Already have an account?
            </span>

            <Link
              to="/login"
              className="rounded-lg px-3 py-2 font-bold text-cyan-800 transition hover:bg-cyan-50"
            >
              Sign in
            </Link>
          </div>

        </div>
      </header>

      {/* MAIN CONTENT */}

      <div className="mx-auto grid min-h-[calc(100vh-77px)] max-w-7xl items-center gap-10 px-4 py-7 sm:px-6 sm:py-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:px-8">

        {/* BRAND SECTION */}

        <section className="hidden lg:block">
          <div className="max-w-xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white px-4 py-2 text-sm font-semibold text-cyan-800 shadow-sm">
              <Droplets size={17} />
              Smarter water business management
            </div>

            <h2 className="mt-7 text-5xl font-extrabold leading-[1.15] tracking-tight text-slate-900 xl:text-6xl">
              Manage your business.
              <span className="mt-2 block text-cyan-700">
                Make every drop count.
              </span>
            </h2>

            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
              Organize customers, jar inventory, daily deliveries
              and payments with one simple business management
              platform.
            </p>

            <div className="mt-10 space-y-5">
              {[
                {
                  icon: Building2,
                  title: "Business management",
                  description: "Keep your operations organized.",
                },
                {
                  icon: Truck,
                  title: "Delivery tracking",
                  description: "Manage daily jar deliveries.",
                },
                {
                  icon: ShieldCheck,
                  title: "Secure account",
                  description: "Verified email and protected access.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex items-center gap-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm ring-1 ring-slate-100">
                      <Icon size={22} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* SIGNUP CARD */}

        <section className="mx-auto w-full max-w-lg">

          <div className="mb-6 lg:hidden">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-800">
              <Droplets size={15} />
              Water business management
            </div>

            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
              {emailSent || googleSignupComplete
                ? "Account setup"
                : "Grow your water business."}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {emailSent
                ? "One final step to activate your account."
                : googleSignupComplete
                  ? "Your registration is submitted for review."
                  : "Everything your water business needs, in one place."}
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5">

            <div className="h-1.5 bg-cyan-700" />

            <div className="p-5 sm:p-8">

              {/* ==================================
                  REGISTRATION FORM
              ================================== */}

              {!emailSent && !googleSignupComplete && (
                <>
                  <div className="mb-7">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                      <Building2 size={24} />
                    </div>

                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                      Business registration
                    </p>

                    <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                      Create your account
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Enter your business details to get started.
                    </p>
                  </div>

                  {/* BUSINESS NAME */}

                  <div className="mb-5">
                    <label
                      htmlFor="business-name"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Business name
                    </label>

                    <div className="relative">
                      <Building2
                        size={18}
                        aria-hidden="true"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="business-name"
                        name="organization"
                        type="text"
                        required
                        maxLength={120}
                        autoComplete="organization"
                        value={businessName}
                        onChange={(event) =>
                          setBusinessName(event.target.value)
                        }
                        placeholder="Enter business name"
                        className={`${inputClass} pl-11`}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* GOOGLE SIGNUP */}

                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={isSubmitting}
                    className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {googleLoading ? (
                      <LoaderCircle
                        size={19}
                        className="animate-spin"
                      />
                    ) : (
                      <svg
                        viewBox="0 0 48 48"
                        width="20"
                        height="20"
                        aria-hidden="true"
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.73 7.18l7.66 5.95c4.48-4.13 7.11-10.22 7.11-17.6z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.91-5.85l-7.66-5.95c-2.13 1.43-4.86 2.27-8.25 2.27-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                      </svg>
                    )}

                    {googleLoading
                      ? "Connecting to Google..."
                      : "Continue with Google"}
                  </button>

                  <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />

                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Or sign up with email
                    </span>

                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  {/* EMAIL SIGNUP */}

                  <form
                    onSubmit={handleSignup}
                    className="space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="signup-email"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Email address
                      </label>

                      <div className="relative">
                        <Mail
                          size={18}
                          aria-hidden="true"
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="signup-email"
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(event) =>
                            setEmail(event.target.value)
                          }
                          placeholder="you@example.com"
                          className={`${inputClass} pl-11`}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="signup-password"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Password
                      </label>

                      <div className="relative">
                        <LockKeyhole
                          size={18}
                          aria-hidden="true"
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="signup-password"
                          name="new-password"
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={password}
                          onChange={(event) =>
                            setPassword(event.target.value)
                          }
                          placeholder="Minimum 8 characters"
                          className={`${inputClass} pl-11 pr-12`}
                          disabled={isSubmitting}
                        />

                        <button
                          type="button"
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          onClick={() =>
                            setShowPassword((value) => !value)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showPassword ? (
                            <EyeOff size={19} />
                          ) : (
                            <Eye size={19} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Confirm password
                      </label>

                      <div className="relative">
                        <LockKeyhole
                          size={18}
                          aria-hidden="true"
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="confirm-password"
                          name="confirm-password"
                          type={
                            showConfirmPassword ? "text" : "password"
                          }
                          required
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          placeholder="Re-enter your password"
                          className={`${inputClass} pl-11 pr-12`}
                          disabled={isSubmitting}
                        />

                        <button
                          type="button"
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                          onClick={() =>
                            setShowConfirmPassword((value) => !value)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={19} />
                          ) : (
                            <Eye size={19} />
                          )}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <p
                        role="alert"
                        className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
                      >
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3.5 font-bold text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <LoaderCircle
                            size={19}
                            className="animate-spin"
                          />
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create account
                          <ArrowRight size={19} />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

              {/* ==================================
                  GOOGLE REGISTRATION SUCCESS
              ================================== */}

              {googleSignupComplete && (
                <div className="py-3 text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Clock3 size={32} />
                  </div>

                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                    Registration submitted
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                    Application under review
                  </h2>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                    Your Google account has been authenticated
                    and your business registration has been
                    submitted successfully.
                  </p>

                  <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Business name
                    </p>

                    <p className="mt-1 break-words font-bold text-slate-900">
                      {businessName}
                    </p>

                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Google account
                    </p>

                    <p className="mt-1 break-all text-sm font-medium text-slate-800">
                      {email}
                    </p>

                  </div>

                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <ShieldCheck size={18} />
                      Awaiting admin approval
                    </div>

                    <p className="mt-2 text-sm leading-6 text-amber-800">
                      Your business dashboard will become
                      available after an administrator approves
                      your registration.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/registration-pending", {
                        replace: true,
                      })
                    }
                    className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 font-bold text-white transition hover:bg-cyan-800"
                  >
                    View registration status
                    <ArrowRight size={18} />
                  </button>

                </div>
              )}

              {/* ==================================
                  EMAIL CONFIRMATION SCREEN
              ================================== */}

              {emailSent && (
                <div className="py-3 text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Mail size={30} />
                  </div>

                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                    Confirmation email sent
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                    Verify your email
                  </h2>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                    We sent a confirmation link to the email
                    address below. Open that email and click
                    the confirmation link to verify your account.
                  </p>

                  <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
                    <Mail
                      size={20}
                      className="shrink-0 text-cyan-700"
                    />

                    <p className="break-all text-sm font-bold text-slate-800">
                      {email}
                    </p>
                  </div>

                  <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-left">

                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <CheckCircle2 size={19} />
                      What happens next?
                    </div>

                    <ul className="mt-3 space-y-2 text-sm text-emerald-800">
                      <li className="flex gap-2">
                        <Check size={16} className="mt-0.5 shrink-0" />
                        Open your confirmation email.
                      </li>

                      <li className="flex gap-2">
                        <Check size={16} className="mt-0.5 shrink-0" />
                        Click Confirm email address.
                      </li>

                      <li className="flex gap-2">
                        <Check size={16} className="mt-0.5 shrink-0" />
                        Your business registration will be submitted for review.
                      </li>

                      <li className="flex gap-2">
                        <Check size={16} className="mt-0.5 shrink-0" />
                        Wait for admin approval.
                      </li>
                    </ul>

                  </div>

                  {message && (
                    <p
                      role="status"
                      className="mt-4 text-sm text-emerald-700"
                    >
                      {message}
                    </p>
                  )}

                  {error && (
                    <p
                      role="alert"
                      className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={resending}
                    className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    {resending ? (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <RefreshCw size={17} />
                    )}

                    Resend confirmation email
                  </button>

                  <Link
                    to="/login"
                    className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 font-bold text-white transition hover:bg-cyan-800"
                  >
                    Continue to login
                    <ArrowRight size={18} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setEmailSent(false);
                      setError("");
                      setMessage("");
                    }}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-cyan-700"
                  >
                    <ArrowLeft size={16} />
                    Back to registration
                  </button>

                </div>
              )}

              {/* GOOGLE CALLBACK ERROR */}

              {error && googleLoading === false &&
                !emailSent &&
                !googleSignupComplete &&
                new URLSearchParams(window.location.search).get(
                  "google_signup"
                ) === "1" && (
                  <div
                    role="alert"
                    className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
                  >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

            </div>
          </div>

          {/* SECURITY FOOTER */}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">

            <span className="flex items-center gap-1.5">
              <ShieldCheck
                size={15}
                className="text-emerald-600"
              />
              Secure registration
            </span>

            <span className="flex items-center gap-1.5">
              <CheckCircle2
                size={15}
                className="text-cyan-700"
              />
              Email verification
            </span>

          </div>

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            By creating an account, you agree to use Amrit Jal responsibly.
          </p>

        </section>
      </div>
    </main>
  );
}
