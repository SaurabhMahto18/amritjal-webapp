
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Save,
  ImagePlus,
  Trash2,
  Eye,
  EyeOff,
  Bell,
  MessageSquare,
  MessageCircle,
  ReceiptText,
  ShoppingBag,
  Percent,
  CalendarClock,
  AlertCircle,
  LoaderCircle,
  CheckCircle2,
  RefreshCw,
  Upload,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";

const BUCKET = "business-signatures";
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const DEFAULT_SETTINGS = {
  hideFixedQuantity: false,
  deliveryNotification: true,
  smsMessaging: true,
  whatsappMessaging: true,
  splitGst: false,
  productSubscriptionAdvancePayment: false,
  collectPastDueOnBooking: false,
  enableEStore: false,
};

const COLORS = {
  navy: "#102D3A",
  teal: "#087F8C",
  border: "#DCE8EA",
  muted: "#8299A5",
};

const INPUT_CLASS =
  "w-full rounded-xl border border-[#DCE8EA] bg-white px-4 py-3 text-sm text-[#102D3A] outline-none transition placeholder:text-[#8299A5] focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10";

function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#DCE8EA] px-4 py-5 last:border-b-0 sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#DDF4F1] text-[#087F8C]">
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#102D3A]">
            {title}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#8299A5]">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-[#087F8C]" : "bg-slate-300"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
            checked ? "left-[26px]" : "left-1"
          }`}
        />
      </button>

      <span
        className={`hidden w-16 shrink-0 text-xs font-medium sm:block ${
          checked ? "text-[#087F8C]" : "text-[#8299A5]"
        }`}
      >
        {checked ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}

function SectionHeading({ title, description }) {
  return (
    <div className="mb-6 border-b border-[#DCE8EA] pb-5">
      <h2 className="text-lg font-bold text-[#102D3A]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-[#8299A5]">
        {description}
      </p>
    </div>
  );
}

export default function AdditionalDetailsForm() {
  const fileInputRef = useRef(null);

  const [businessId, setBusinessId] = useState(null);
  const [userId, setUserId] = useState(null);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState("");
  const [removeSignature, setRemoveSignature] = useState(false);
  const [invoiceRemark, setInvoiceRemark] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState("idle");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) {
        throw new Error("Please log in to manage Additional Details.");
      }

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (businessError) throw businessError;
      if (!business) {
        throw new Error("No business profile found.");
      }

      setUserId(user.id);
      setBusinessId(business.id);

      const { data, error } = await supabase
        .from("business_invoice_settings")
        .select(
          "signature_image_url, additional_settings, invoice_remark"
        )
        .eq("business_id", business.id)
        .maybeSingle();

      if (error) throw error;

      setSignatureUrl(data?.signature_image_url || "");
      setSignaturePreview(data?.signature_image_url || "");
      setInvoiceRemark(data?.invoice_remark || "");

      setSettings({
        ...DEFAULT_SETTINGS,
        ...(data?.additional_settings || {}),
      });

      setSignatureFile(null);
      setRemoveSignature(false);
    } catch (error) {
      console.error("Load additional details failed:", error);
      setSaveState("error");
      setMessage(error.message || "Unable to load Additional Details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    return () => {
      if (signaturePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(signaturePreview);
      }
    };
  }, [signaturePreview]);

  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaveState("idle");
    setMessage("");
  }

  function handleSignatureSelect(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setMessage("Choose a PNG, JPG or WebP signature image.");
      setSaveState("error");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage("Signature image must be smaller than 2 MB.");
      setSaveState("error");
      event.target.value = "";
      return;
    }

    if (signaturePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(signaturePreview);
    }

    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));
    setRemoveSignature(false);
    setSaveState("idle");
    setMessage("");
  }

  function handleRemoveSignature() {
    if (signaturePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(signaturePreview);
    }

    setSignatureFile(null);
    setSignaturePreview("");
    setRemoveSignature(true);
    setSaveState("idle");
    setMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadSignature() {
    if (!signatureFile) return signatureUrl;

    const extension = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    }[signatureFile.type];

    const path = `${userId}/${businessId}/signature-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, signatureFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: signatureFile.type,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    if (!data?.publicUrl) {
      throw new Error("Signature uploaded but public URL is unavailable.");
    }

    return data.publicUrl;
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!businessId || !userId) {
      setSaveState("error");
      setMessage("Business profile is unavailable. Reload this page.");
      return;
    }

    setSaving(true);
    setSaveState("idle");
    setMessage("");

    let uploadedPath = null;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user || user.id !== userId) {
        throw new Error("Your login session has changed. Please reload.");
      }

      let nextSignatureUrl = signatureUrl;

      if (signatureFile) {
        const extension = {
          "image/png": "png",
          "image/jpeg": "jpg",
          "image/webp": "webp",
        }[signatureFile.type];

        uploadedPath = `${userId}/${businessId}/signature-${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(uploadedPath, signatureFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: signatureFile.type,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(uploadedPath);

        nextSignatureUrl = data.publicUrl;
      }

      if (removeSignature) {
        nextSignatureUrl = null;
      }

      const payload = {
        business_id: businessId,
        signature_image_url: nextSignatureUrl,
        invoice_remark: invoiceRemark.trim() || null,
        additional_settings: settings,
      };

      const { error: saveError } = await supabase
        .from("business_invoice_settings")
        .upsert(payload, { onConflict: "business_id" });

      if (saveError) throw saveError;

      setSignatureUrl(nextSignatureUrl || "");
      setSignatureFile(null);
      setRemoveSignature(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSaveState("success");
      setMessage("Additional Details saved successfully.");
    } catch (error) {
      console.error("Save Additional Details failed:", error);

      if (uploadedPath) {
        await supabase.storage
          .from(BUCKET)
          .remove([uploadedPath]);
      }

      setSaveState("error");
      setMessage(error.message || "Unable to save Additional Details.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="flex min-h-56 items-center justify-center rounded-2xl border border-[#DCE8EA] bg-white p-8">
        <LoaderCircle
          size={22}
          className="animate-spin text-[#087F8C]"
        />
        <span className="ml-3 text-sm text-[#8299A5]">
          Loading Additional Details...
        </span>
      </section>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <section className="rounded-2xl border border-[#DCE8EA] bg-white p-5 shadow-sm sm:p-8">
        <SectionHeading
          title="Additional Details"
          description="Signature, invoice preferences and messaging."
        />

        {/* Signature */}
        <div className="mb-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-24 w-48 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#DCE8EA] bg-[#F3F7F8]">
              {signaturePreview ? (
                <img
                  src={signaturePreview}
                  alt="Signature preview"
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <div className="text-center text-[#8299A5]">
                  <ImagePlus size={26} className="mx-auto mb-2" />
                  <span className="text-xs">No signature uploaded</span>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="mb-2 text-sm font-semibold text-[#102D3A]">
                Signature Image
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleSignatureSelect}
                  className="block max-w-full text-sm text-[#8299A5] file:mr-3 file:rounded-lg file:border-0 file:bg-[#087F8C] file:px-4 file:py-2.5 file:font-semibold file:text-white hover:file:bg-[#066B76]"
                />

                {signaturePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveSignature}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                )}
              </div>

              <p className="mt-2 text-xs text-[#8299A5]">
                PNG, JPG or WebP. Maximum 2 MB.
              </p>
            </div>
          </div>
        </div>

        {/* Invoice settings */}
        <div className="mb-7 overflow-hidden rounded-xl border border-[#DCE8EA]">
          <ToggleRow
            icon={EyeOff}
            title="Hide Fixed Quantity"
            description="Hide the quantity of fixed products on the invoice."
            checked={settings.hideFixedQuantity}
            onChange={(value) =>
              updateSetting("hideFixedQuantity", value)
            }
          />

          <ToggleRow
            icon={Bell}
            title="Enable Delivery Notification"
            description="Notify the owner whenever a distributor delivers a product."
            checked={settings.deliveryNotification}
            onChange={(value) =>
              updateSetting("deliveryNotification", value)
            }
          />

          <ToggleRow
            icon={MessageSquare}
            title="SMS Messaging"
            description="Enable or disable SMS messaging for this agency."
            checked={settings.smsMessaging}
            onChange={(value) =>
              updateSetting("smsMessaging", value)
            }
          />

          <ToggleRow
            icon={MessageCircle}
            title="WhatsApp Messaging"
            description="Enable or disable WhatsApp messaging for this agency."
            checked={settings.whatsappMessaging}
            onChange={(value) =>
              updateSetting("whatsappMessaging", value)
            }
          />

          <ToggleRow
            icon={Percent}
            title="Split GST into CGST & SGST"
            description="Show CGST and SGST separately on invoices instead of one combined GST line."
            checked={settings.splitGst}
            onChange={(value) =>
              updateSetting("splitGst", value)
            }
          />

          <ToggleRow
            icon={CalendarClock}
            title="Enable Product Subscription Advance Payment"
            description="Require customers to pay in advance for product subscriptions."
            checked={settings.productSubscriptionAdvancePayment}
            onChange={(value) =>
              updateSetting("productSubscriptionAdvancePayment", value)
            }
          />

          <ToggleRow
            icon={ReceiptText}
            title="Collect Past Due On New Event Booking"
            description="Add pending amounts from previous events to a new event booking checkout."
            checked={settings.collectPastDueOnBooking}
            onChange={(value) =>
              updateSetting("collectPastDueOnBooking", value)
            }
          />

          <ToggleRow
            icon={ShoppingBag}
            title="Enable E-Store"
            description="Allow customers to place orders through a public link."
            checked={settings.enableEStore}
            onChange={(value) =>
              updateSetting("enableEStore", value)
            }
          />
        </div>

        {settings.enableEStore && (
          <div className="mb-7 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              E-Store is enabled in settings
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              A public ordering page and order-processing workflow must
              also be configured before customers can place orders.
            </p>
          </div>
        )}

        {/* Invoice remark */}
        <div className="border-t border-[#DCE8EA] pt-6">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#102D3A]">
              Invoice Remark
            </h3>
            <p className="mt-1 text-sm text-[#8299A5]">
              Shown at the bottom of every invoice.
            </p>
          </div>

          <label className="mb-2 block text-sm font-semibold text-[#102D3A]">
            Invoice Remark
          </label>

          <textarea
            rows={5}
            maxLength={2000}
            value={invoiceRemark}
            onChange={(event) => {
              setInvoiceRemark(event.target.value);
              setSaveState("idle");
              setMessage("");
            }}
            placeholder="Dear Customer :)&#10;Thank you for your business!"
            className={`${INPUT_CLASS} resize-y`}
          />

          <p className="mt-2 text-right text-xs text-[#8299A5]">
            {invoiceRemark.length}/2000 characters
          </p>
        </div>

        {/* Status */}
        {message && (
          <div
            role="status"
            className={`mt-6 flex items-start gap-2 rounded-xl border p-3 text-sm ${
              saveState === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {saveState === "success" ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#DCE8EA] pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={loadSettings}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE8EA] bg-white px-4 py-3 text-sm font-semibold text-[#102D3A] hover:bg-[#F3F7F8] disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Reload Saved Settings
          </button>

          <button
            type="submit"
            disabled={saving || !businessId}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087F8C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#066B76] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            {saving ? "Saving..." : "Save Additional Details"}
          </button>
        </div>
      </section>
    </form>
  );
}
