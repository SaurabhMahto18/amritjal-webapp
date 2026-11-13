
import { supabase } from "../../../lib/supabase";

const SETTING_KEYS = [
  "general",
  "billing",
  "subscriptions",
  "notifications",
  "platform",
];

export async function getPlatformConfiguration() {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("setting_key, setting_value, updated_at, updated_by")
    .in("setting_key", SETTING_KEYS);

  if (error) throw error;

  const result = {};

  (data || []).forEach((item) => {
    result[item.setting_key] = item.setting_value;
  });

  return result;
}

export async function savePlatformSetting(key, value) {
  if (!SETTING_KEYS.includes(key)) {
    throw new Error("Invalid configuration section.");
  }

  const { data, error } = await supabase.rpc(
    "set_platform_setting",
    {
      p_key: key,
      p_value: value,
    }
  );

  if (error) throw error;

  return data;
}
