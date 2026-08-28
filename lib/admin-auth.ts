import { getAuthorizedAdminEmail, isSupabasePublicConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getVerifiedAdmin() {
  if (!isSupabasePublicConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const authorized = getAuthorizedAdminEmail();
  if (!userData.user || !authorized || userData.user.email?.toLocaleLowerCase() !== authorized) return null;
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!factors?.totp.some((factor) => factor.status === "verified") || assurance?.currentLevel !== "aal2") return null;
  return userData.user;
}
