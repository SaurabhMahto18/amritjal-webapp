
import { supabase } from "../../../lib/supabase/client";

const LOGO_BUCKET = "business-logos";

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Please log in to access Settings.");

  return user;
}

async function getCurrentBusiness() {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("businesses")
    .select(`
      id,
      owner_id,
      name,
      gst_number,
      pan_number,
      registration_number,
      created_at,
      updated_at
    `)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error("No business profile found for your account.");
  }

  return data;
}

export async function getBusinessProfile() {
  return getCurrentBusiness();
}

export async function updateBusinessProfile(name) {
  const business = await getCurrentBusiness();
  const businessName = String(name ?? "").trim();

  if (!businessName) {
    throw new Error("Agency name is required.");
  }

  if (businessName.length > 120) {
    throw new Error("Agency name cannot exceed 120 characters.");
  }

  const { data, error } = await supabase
    .from("businesses")
    .update({ name: businessName })
    .eq("id", business.id)
    .eq("owner_id", business.owner_id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getAgencyProfile() {
  const [user, business] = await Promise.all([
    getCurrentUser(),
    getCurrentBusiness(),
  ]);

  const { data: settings, error } = await supabase
    .from("business_invoice_settings")
    .select(`
      business_phone,
      business_address,
      business_logo_url,
      signature_name
    `)
    .eq("business_id", business.id)
    .maybeSingle();

  if (error) throw error;

  return {
    business,
    settings,
    email: user.email || "",
  };
}

export async function uploadAgencyLogo(file, businessId) {
  const user = await getCurrentUser();

  if (!file || !businessId) {
    throw new Error("Logo file and business profile are required.");
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Choose a PNG, JPG or WebP image.");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Logo must be smaller than 2 MB.");
  }

  const extensionByType = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };

  const extension = extensionByType[file.type];
  const logoPath = `${user.id}/${businessId}/agency-logo-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(logoPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(LOGO_BUCKET)
    .getPublicUrl(logoPath);

  if (!data?.publicUrl) {
    throw new Error("Logo uploaded, but public URL could not be created.");
  }

  return data.publicUrl;
}


export async function saveAgencyProfile(values) {
  const name = String(values.name ?? "").trim();
  const phone = String(values.phone ?? "").trim();
  const address = String(values.address ?? "").trim();
  const gst = String(values.gstNumber ?? "").trim().toUpperCase();
  const pan = String(values.panNumber ?? "").trim().toUpperCase();
  const registration = String(values.registrationNumber ?? "").trim();

  if (!name) {
    throw new Error("Agency name is required.");
  }

  if (name.length > 120) {
    throw new Error("Agency name cannot exceed 120 characters.");
  }

  if (phone && !/^[+()\-\s\d,]{7,40}$/.test(phone)) {
    throw new Error("Enter a valid contact number.");
  }

  if (gst && !/^[0-9A-Z]{15}$/.test(gst)) {
    throw new Error("Enter a valid 15-character GST number.");
  }

  if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    throw new Error("Enter a valid PAN number.");
  }

  const { data, error } = await supabase.rpc("save_agency_profile", {
    p_name: name,
    p_phone: phone || null,
    p_address: address || null,
    p_gst_number: gst || null,
    p_pan_number: pan || null,
    p_registration_number: registration || null,
    p_logo_url: values.logoUrl || null,
  });

  if (error) throw error;

  return data;
}


// Existing Invoice Settings functions
export async function getInvoiceSettings() {
  const business = await getCurrentBusiness();

  const { data, error } = await supabase
    .from("business_invoice_settings")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();

  if (error) throw error;

  return { business, settings: data };
}

export async function saveInvoiceSettings(values) {
  const business = await getCurrentBusiness();

  const allowedFields = [
    "bank_account_name",
    "bank_name",
    "bank_account_number",
    "bank_ifsc",
    "upi_id",
    "upi_phone",
    "payment_qr_url",
    "invoice_terms",
    "thermal_jar_charge",
    "capsule_jar_charge",
    "dispenser_jar_charge",
    "security_deposit_note",
    "business_phone",
    "business_address",
    "business_logo_url",
    "signature_name",
    "signature_image_url",
  ];

  const payload = { business_id: business.id };

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(values, field)) {
      payload[field] = values[field];
    }
  }

  for (const field of [
    "thermal_jar_charge",
    "capsule_jar_charge",
    "dispenser_jar_charge",
  ]) {
    if (payload[field] !== undefined) {
      const amount = Number(payload[field]);

      if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(
          `${field.replaceAll("_", " ")} must be zero or greater.`
        );
      }

      payload[field] = amount;
    }
  }

  const { data, error } = await supabase
    .from("business_invoice_settings")
    .upsert(payload, { onConflict: "business_id" })
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export const settingsService = {
  getBusinessProfile,
  updateBusinessProfile,
  getAgencyProfile,
  saveAgencyProfile,
  uploadAgencyLogo,
  getInvoiceSettings,
  saveInvoiceSettings,
};
