
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";

import { useAuthContext } from "../providers/AuthProvider";

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
}

export default function SignupPage() {
const {
  signUp,
  resendSignupConfirmation,
} = useAuthContext();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // SEO metadata for an authentication page.
  useEffect(() => {
    const previousTitle = document.title;

    document.title = SEO_TITLE;

    updateMeta("description", SEO_DESCRIPTION);
    updateMeta("robots", "noindex, nofollow");
    updateMeta("theme-color", "#F3FBFF");

    return () => {
      document.title = previousTitle;
    };
  }, []);

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
      setError("Business name cannot exceed 120 characters.");
      return;
    }

    if (!normalizedEmail) {
      setError("Please enter your email address.");
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
      setError(err.message || "Registration could not be completed.");
    } finally {
      setLoading(false);
    }
  }

 
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
      err.message || "Could not resend the confirmation email."
    );
  } finally {
    setResending(false);
  }
}


  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50";

  return (
    <main className="min-h-screen bg-[#F3FBFF] text-slate-800">
      {/* Responsive header */}
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

      <div className="mx-auto grid min-h-[calc(100vh-77px)] max-w-7xl items-center gap-10 px-4 py-7 sm:px-6 sm:py-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:px-8">
        {/* Brand / desktop section */}
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
                  <div key={item.title} className="flex items-center gap-4">
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

        {/* Signup card */}
        <section className="mx-auto w-full max-w-lg">
          <div className="mb-6 lg:hidden">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-800">
              <Droplets size={15} />
              Water business management
            </div>

            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
              {emailSent
                ? "Check your inbox"
                : "Grow your water business."}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {emailSent
                ? "One final step to activate your account."
                : "Everything your water business needs, in one place."}
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5">
            <div className="h-1.5 bg-cyan-700" />

            <div className="p-5 sm:p-8">
              {!emailSent ? (
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

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
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
                        />
                      </div>
                    </div>

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
                        />

                        <button
                          type="button"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
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
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          placeholder="Re-enter your password"
                          className={`${inputClass} pl-11 pr-12`}
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
                      disabled={loading}
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
              ) : (
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
                    We sent a confirmation link to the email address below.
                    Open that email and click the confirmation link to
                    verify your account.
                  </p>

                  <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
                    <Mail size={20} className="shrink-0 text-cyan-700" />
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
                        Return to Amrit Jal and sign in.
                      </li>
                    </ul>
                  </div>

                  {message && (
                    <p role="status" className="mt-4 text-sm text-emerald-700">
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
                      <LoaderCircle size={17} className="animate-spin" />
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
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-600" />
              Secure registration
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-cyan-700" />
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
