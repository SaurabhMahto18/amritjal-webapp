
import { useCallback, useEffect, useState } from "react";
import {
  MapPin,
  Navigation,
  Building2,
  AlertCircle,
  MapPinned,
  LoaderCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";

const COLORS = {
  navy: "#102D3A",
  teal: "#087F8C",
  aqua: "#DDF4F1",
  background: "#F3F7F8",
  border: "#DCE8EA",
  muted: "#8299A5",
};

function getMapsUrl(address) {
  if (!address?.trim()) return "";

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;
}

function getAddressParts(address) {
  if (!address?.trim()) return [];

  return address
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function InfoItem({ label, value }) {
  if (!value) return null;

  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>
      <p className="break-words text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  children,
  onClick,
  disabled = false,
  variant = "secondary",
}) {
  const primary = variant === "primary";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        primary
          ? "bg-[#087F8C] text-white hover:bg-[#066B76]"
          : "border border-[#DCE8EA] bg-white text-[#102D3A] hover:bg-[#F3F7F8]"
      }`}
    >
      <Icon size={17} />
      {children}
    </button>
  );
}

export default function AgencyLocationForm() {
  const [business, setBusiness] = useState(null);
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const loadLocation = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Please sign in to view agency location.");
      }

      // Load the logged-in owner's business.
      const { data: businessData, error: businessError } =
        await supabase
          .from("businesses")
          .select("id, name")
          .eq("owner_id", user.id)
          .maybeSingle();

      if (businessError) throw businessError;

      if (!businessData) {
        throw new Error(
          "No business profile found. Please set up your agency profile first."
        );
      }

      setBusiness(businessData);

      // Load saved address and agency logo.
      const { data: settings, error: settingsError } =
        await supabase
          .from("business_invoice_settings")
          .select("business_address, business_logo_url")
          .eq("business_id", businessData.id)
          .maybeSingle();

      if (settingsError) throw settingsError;

      setAddress(settings?.business_address || "");
      setLogoUrl(settings?.business_logo_url || "");
    } catch (err) {
      console.error("Load agency location failed:", err);
      setError(
        err.message || "Unable to load agency location."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  async function handleCopyAddress() {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Copy address failed:", err);
      setError("Unable to copy address. Please copy it manually.");
    }
  }

  function handleOpenMaps() {
    if (!address) return;

    const mapsUrl = getMapsUrl(address);
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  }

  const addressParts = getAddressParts(address);
  const mapsUrl = getMapsUrl(address);

  if (loading) {
    return (
      <section className="flex min-h-[350px] items-center justify-center rounded-2xl border border-[#DCE8EA] bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <LoaderCircle
            size={21}
            className="animate-spin text-[#087F8C]"
          />
          Loading agency location...
        </div>
      </section>
    );
  }

  if (error && !business) {
    return (
      <section className="rounded-2xl border border-[#DCE8EA] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>

        <button
          type="button"
          onClick={loadLocation}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#087F8C] px-4 py-3 text-sm font-semibold text-white hover:bg-[#066B76]"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#DCE8EA] bg-white shadow-sm">
      {/* Header */}
      <div className="p-5 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#DDF4F1] text-[#087F8C]">
            <MapPin size={23} />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#102D3A]">
              Agency Location
            </h2>

            <p className="mt-1 text-sm text-[#8299A5]">
              View your registered agency address and location details.
            </p>
          </div>
        </div>

        <div className="my-6 border-t border-[#DCE8EA]" />

        {/* Mobile App Notice */}
        <div className="mb-7 flex items-start gap-3 rounded-xl border border-[#DCE8EA] bg-[#F3F7F8] p-4">
          <Building2
            size={19}
            className="mt-0.5 shrink-0 text-[#087F8C]"
          />

          <div>
            <p className="text-sm font-semibold text-[#102D3A]">
              Location managed from mobile app
            </p>

            <p className="mt-1 text-xs leading-5 text-[#8299A5]">
              Your agency location is managed through the mobile
              application. This section displays the saved address.
            </p>
          </div>
        </div>

        {/* Agency identity */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#DCE8EA] bg-[#F3F7F8] shadow-sm">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Agency logo"
                className="size-full object-contain p-2"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <ImageIcon
                size={32}
                className="text-[#8299A5]"
              />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="break-words text-lg font-bold text-[#102D3A]">
              {business?.name || "Agency Name"}
            </h3>

            <div className="mt-1 flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <p className="text-sm text-[#8299A5]">
                Registered agency
              </p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="text-sm font-semibold text-[#102D3A]">
              Registered Address
              <span className="ml-1 text-red-500">*</span>
            </label>

            {address && (
              <span className="rounded-full bg-[#DDF4F1] px-3 py-1 text-xs font-semibold text-[#087F8C]">
                Saved Address
              </span>
            )}
          </div>

          {address ? (
            <div className="rounded-xl border border-[#DCE8EA] bg-[#F3F7F8] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <MapPin
                  size={19}
                  className="mt-0.5 shrink-0 text-[#087F8C]"
                />

                <p className="text-sm leading-7 text-[#102D3A] sm:text-base">
                  {address}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#DCE8EA] bg-[#F8FAFB] p-6 text-center">
              <MapPinned
                size={30}
                className="mx-auto mb-3 text-[#8299A5]"
              />

              <p className="text-sm font-semibold text-[#102D3A]">
                No agency address available
              </p>

              <p className="mt-1 text-xs text-[#8299A5]">
                Add your address from the mobile application.
              </p>
            </div>
          )}
        </div>

        {/* Address breakdown */}
        {addressParts.length > 0 && (
          <div className="mt-6 rounded-xl border border-[#DCE8EA] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <MapPinned size={18} className="text-[#087F8C]" />

              <h3 className="text-sm font-bold text-[#102D3A]">
                Location Details
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem
                label="Address / Locality"
                value={addressParts.slice(0, -3).join(", ") || addressParts[0]}
              />

              <InfoItem
                label="State / Region"
                value={addressParts.length >= 3
                  ? addressParts[addressParts.length - 3]
                  : ""}
              />

              <InfoItem
                label="Country"
                value={addressParts[addressParts.length - 2] || ""}
              />

              <InfoItem
                label="PIN Code"
                value={addressParts[addressParts.length - 1]?.match(/^\d{6}$/)
                  ? addressParts[addressParts.length - 1]
                  : ""}
              />
            </div>
          </div>
        )}

        {/* Address preview */}
        {address && (
          <div className="mt-6 rounded-xl border border-[#DCE8EA] bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <Building2 size={18} className="text-[#087F8C]" />

              <h3 className="text-sm font-bold text-[#102D3A]">
                Address Preview
              </h3>
            </div>

            <p className="text-sm leading-6 text-slate-600">
              {business?.name}
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {address}
            </p>

            <p className="mt-3 text-xs text-[#8299A5]">
              This address can be used in your business records and invoices.
            </p>
          </div>
        )}

        {/* Actions */}
        {address && (
          <div className="mt-6 flex flex-col gap-3 border-t border-[#DCE8EA] pt-5 sm:flex-row sm:justify-end">
            <ActionButton
              icon={copied ? CheckCircle2 : Copy}
              onClick={handleCopyAddress}
            >
              {copied ? "Address Copied" : "Copy Address"}
            </ActionButton>

            <ActionButton
              icon={ExternalLink}
              onClick={handleOpenMaps}
              variant="primary"
            >
              Open in Google Maps
            </ActionButton>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </section>
  );
}
