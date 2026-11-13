
import { useCallback, useEffect, useState } from "react";
import {
  UserRound,
  LockKeyhole,
  Wallet,
  Building2,
  Landmark,
  Smartphone,
  MapPin,
  FileText,
  ChevronRight,
  Droplets,
  RefreshCw,
} from "lucide-react";

import UserProfileForm from "../components/UserProfileForm";
import UpdatePasswordForm from "../components/UpdatePasswordForm";
import WalletAmountForm from "../components/WalletAmountForm";
import BusinessProfileForm from "../components/BusinessProfileForm";
import BankDetailsForm from "../components/BankDetailsForm";
import UPIDetailsForm from "../components/UPIDetailsForm";
import AgencyLocationForm from "../components/AgencyLocationForm";
import AdditionalDetailsForm from "../components/AdditionalDetailsForm";
import { jarService } from "../../jars/services/jarService";
import { getOwnerWallet } from "../services/walletService";

function AdditionalDetails() {
  return (
    <div className="space-y-6">
      <AdditionalDetailsForm />
    </div>
  );
}

const settingsGroups = [
  {
    title: "User Profile",
    items: [
      {
        id: "profile",
        label: "User Profile",
        description: "Update your basic details.",
        icon: UserRound,
        component: UserProfileForm,
      },
      {
        id: "password",
        label: "Update Password",
        description: "Change your account password.",
        icon: LockKeyhole,
        component: UpdatePasswordForm,
      },
      {
        id: "wallet",
        label: "Update Wallet Amount",
        description: "Update your wallet balance.",
        icon: Wallet,
        component: WalletAmountForm,
      },
    ],
  },
  {
    title: "Agency Profile",
    items: [
      {
        id: "agency",
        label: "Agency Profile",
        description: "Agency profile details.",
        icon: Building2,
        component: BusinessProfileForm,
      },
      {
        id: "bank",
        label: "Bank Details",
        description: "Bank account information.",
        icon: Landmark,
        component: BankDetailsForm,
      },
      {
        id: "upi",
        label: "UPI Details",
        description: "UPI & QR payment setup.",
        icon: Smartphone,
        component: UPIDetailsForm,
      },
      {
        id: "location",
        label: "Agency Location",
        description: "Update agency location.",
        icon: MapPin,
        component: AgencyLocationForm,
      },
      {
        id: "additional",
        label: "Additional Details",
        description: "Signature, invoice & messaging.",
        icon: FileText,
        component: AdditionalDetails,
      },
    ],
  },
];

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function BalanceCard({ title, value, icon: Icon, loading, error }) {
  return (
    <div className="rounded-2xl border border-[#DCE8EA] bg-[#F0F6F7] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[#8299A5]">
          {title}
        </p>

        <Icon size={17} className="text-[#087F8C]" />
      </div>

      <p className="mt-2 break-words text-2xl font-bold text-[#102D3A]">
        {loading ? "Loading..." : error ? "Unavailable" : value}
      </p>

      {error && (
        <p className="mt-1 text-xs text-red-600">
          Could not load balance
        </p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");

  const [jarBalance, setJarBalance] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);

  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceErrors, setBalanceErrors] = useState({
    jars: false,
    wallet: false,
  });

  const loadBalances = useCallback(async () => {
    setBalanceLoading(true);

    const [jarResult, walletResult] = await Promise.allSettled([
      jarService.getInventorySummary(),
      getOwnerWallet(),
    ]);

    if (jarResult.status === "fulfilled") {
      setJarBalance(Number(jarResult.value.available));
    }

    if (walletResult.status === "fulfilled") {
      setWalletBalance(Number(walletResult.value.balance));
    }

    setBalanceErrors({
      jars: jarResult.status === "rejected",
      wallet: walletResult.status === "rejected",
    });

    setBalanceLoading(false);
  }, []);

  useEffect(() => {
    void loadBalances();

    const handleJarUpdate = () => {
      void loadBalances();
    };

    const handleWalletUpdate = () => {
      void loadBalances();
    };

    window.addEventListener(
      "amrit-jal-jars-updated",
      handleJarUpdate
    );

    window.addEventListener(
      "amrit-jal-wallet-updated",
      handleWalletUpdate
    );

    return () => {
      window.removeEventListener(
        "amrit-jal-jars-updated",
        handleJarUpdate
      );

      window.removeEventListener(
        "amrit-jal-wallet-updated",
        handleWalletUpdate
      );
    };
  }, [loadBalances]);

  const activeItem = settingsGroups
    .flatMap((group) => group.items)
    .find((item) => item.id === activeSection);

  const ActiveComponent = activeItem?.component;


  useEffect(() => {
    const pageTitle = "Settings | Amrit Jal";
    const pageDescription =
      "Manage your Amrit Jal account, agency profile, wallet, bank details, UPI settings and business information.";

    document.title = pageTitle;

    const setMeta = (name, content) => {
      let element = document.querySelector(
        `meta[name="${name}"]`
      );

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("name", name);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    setMeta("description", pageDescription);
    setMeta("robots", "noindex, nofollow, noarchive");
    setMeta("googlebot", "noindex, nofollow, noarchive");

    return () => {
      setMeta("robots", "noindex, nofollow, noarchive");
      setMeta("googlebot", "noindex, nofollow, noarchive");
    };
  }, []);

  
  return (
    <div className="min-h-screen bg-[#F3F7F8] px-4 py-5 sm:px-6 lg:px-7">
      <div className="mx-auto max-w-[1600px] space-y-6">

       
      

        {/* Main Layout */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[425px_minmax(0,1fr)]">

          {/* LEFT SIDEBAR */}
          <aside className="overflow-hidden rounded-2xl border border-[#DCE8EA] bg-white shadow-[0_3px_12px_rgba(16,45,58,0.04)]">

            {/* Live Balance Cards */}
            <div className="grid grid-cols-2 gap-3 p-4 sm:p-5">
              <BalanceCard
                title="Balance Jar"
                value={
                  jarBalance === null ? "—" : `${jarBalance} Jars`
                }
                icon={Droplets}
                loading={balanceLoading && jarBalance === null}
                error={balanceErrors.jars}
              />

              <BalanceCard
                title="Wallet Amount"
                value={
                  walletBalance === null
                    ? "—"
                    : currency(walletBalance)
                }
                icon={Wallet}
                loading={balanceLoading && walletBalance === null}
                error={balanceErrors.wallet}
              />
            </div>

            {/* Balance Refresh */}
            <div className="flex justify-end px-5 pb-2">
              <button
                type="button"
                onClick={() => void loadBalances()}
                disabled={balanceLoading}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#087F8C] hover:text-[#066A75] disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={balanceLoading ? "animate-spin" : ""}
                />
                Refresh balances
              </button>
            </div>

            {/* Navigation */}
            <div className="px-3 pb-4 sm:px-4">
              {settingsGroups.map((group) => (
                <div
                  key={group.title}
                  className="mb-5 last:mb-0"
                >
                  <h3 className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-[#8BA0AA]">
                    {group.title}
                  </h3>

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveSection(item.id)}
                          aria-current={
                            isActive ? "page" : undefined
                          }
                          className={`group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 ${
                            isActive
                              ? "border-[#B8DEDC] bg-[#EAF6F4] text-[#102D3A] shadow-sm"
                              : "border-transparent bg-white text-[#405866] hover:border-[#E1EBED] hover:bg-[#F6FAFA]"
                          }`}
                        >
                          <span
                            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                              isActive
                                ? "bg-[#087F8C] text-white"
                                : "bg-[#EFF4F5] text-[#087F8C] group-hover:bg-[#DDF4F1]"
                            }`}
                          >
                            <Icon size={20} strokeWidth={1.9} />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-[#102D3A]">
                              {item.label}
                            </span>

                            <span className="mt-0.5 block text-xs text-[#879BA5]">
                              {item.description}
                            </span>
                          </span>

                          <ChevronRight
                            size={19}
                            className={`shrink-0 ${
                              isActive
                                ? "text-[#087F8C]"
                                : "text-[#9BAEB6] group-hover:text-[#087F8C]"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* RIGHT CONTENT */}
          <main className="min-w-0">
            {ActiveComponent && <ActiveComponent />}
          </main>

        </div>
      </div>
    </div>
  );
}
