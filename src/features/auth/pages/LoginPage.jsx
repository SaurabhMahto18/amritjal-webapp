
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Droplets,
  Mail,
  LockKeyhole,
  LoaderCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Building2,
} from "lucide-react";

import { useAuthContext } from "../providers/AuthProvider";

export default function LoginPage() {
  const { signIn } = useAuthContext();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Login | Amrit Jal";

    const metadata = {
      description:
        "Sign in to Amrit Jal to manage customers, water jar inventory, deliveries and business payments.",
      robots: "noindex, nofollow",
      "theme-color": "#F3FBFF",
    };

    Object.entries(metadata).forEach(([name, content]) => {
      let meta = document.head.querySelector(
        `meta[name="${name}"]`
      );

      if (!meta) {
        meta = document.createElement("meta");
        meta.name = name;
        document.head.appendChild(meta);
      }

      meta.content = content;
    });

    return () => {
      document.title = previousTitle;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await signIn(email.trim().toLowerCase(), password);

      const destination = location.state?.from;

      navigate(
        destination
          ? `${destination.pathname || "/dashboard"}${destination.search || ""}${destination.hash || ""}`
          : "/dashboard",
        { replace: true }
      );
    } catch (err) {
      setError(
        err.message || "Login nahi ho paya. Details check karein."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-transparent py-3.5 text-sm text-slate-800 outline-none placeholder:text-slate-400";

  return (
    <main className="min-h-screen bg-[#F3FBFF] text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/login"
            aria-label="Amrit Jal login"
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

          <Link
            to="/signup"
            className="rounded-lg px-3 py-2 text-sm font-bold text-cyan-800 transition hover:bg-cyan-50"
          >
            Create account
          </Link>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-77px)] max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-2 lg:gap-16 lg:px-8">

        {/* Desktop brand section */}
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white px-4 py-2 text-sm font-semibold text-cyan-800 shadow-sm">
              <Droplets size={17} />
              Smart water business management
            </div>

            <h2 className="mt-7 text-5xl font-extrabold leading-tight tracking-tight text-slate-900 xl:text-6xl">
              Every drop.
              <span className="mt-2 block text-cyan-700">
                Managed smarter.
              </span>
            </h2>

            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              Manage customers, jar deliveries, inventory and
              payments with one organized business platform.
            </p>

            <div className="mt-10 space-y-5">
              {[
                {
                  icon: Building2,
                  title: "Organized customers",
                  description: "Keep your customer records accessible.",
                },
                {
                  icon: Truck,
                  title: "Smooth deliveries",
                  description: "Manage daily jar delivery operations.",
                },
                {
                  icon: ShieldCheck,
                  title: "Secure account",
                  description: "Protected access to your business.",
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

            <div className="mt-10 flex flex-wrap gap-5 text-sm font-medium text-slate-600">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Simple management
              </span>

              <span className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-cyan-700" />
                Secure login
              </span>
            </div>
          </div>
        </section>

        {/* Login form */}
        <section className="mx-auto w-full max-w-lg">
          <div className="mb-6 lg:hidden">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
              Welcome back
            </p>

            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Your business, one login away.
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in to continue managing your water business.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5">
            <div className="h-1.5 bg-cyan-700" />

            <div className="p-5 sm:p-9">
              <div className="mb-7">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <LockKeyhole size={24} />
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                  Account access
                </p>

                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Login to Amrit Jal
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your registered email and password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email address
                  </label>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-50">
                    <Mail
                      size={19}
                      aria-hidden="true"
                      className="shrink-0 text-slate-400"
                    />

                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="login-password"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Password
                    </label>

                    <Link
                      to="/reset-password"
                      className="text-xs font-semibold text-cyan-700 hover:text-cyan-900"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-50">
                    <LockKeyhole
                      size={19}
                      aria-hidden="true"
                      className="shrink-0 text-slate-400"
                    />

                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="shrink-0 text-slate-400 hover:text-cyan-700"
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-700"
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
                      <LoaderCircle size={19} className="animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login to your account
                      <ArrowRight size={19} />
                    </>
                  )}
                </button>
              </form>

              <div className="my-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-semibold tracking-wider text-slate-400">
                  NEW TO AMRIT JAL?
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <Link
                to="/signup"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-800 transition hover:bg-cyan-100"
              >
                Create a new account
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
            <ShieldCheck size={15} className="text-emerald-600" />
            Secure access to your business
          </div>
        </section>
      </div>
    </main>
  );
}
