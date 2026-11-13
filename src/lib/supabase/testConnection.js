import { supabase } from "./client";

export async function testSupabaseConnection() {
  const { error } = await supabase
    .from("customers")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Supabase connection test failed:", error.message);
    return false;
  }

  console.log("Supabase database connection successful.");
  return true;
}