import { supabase } from "./supabaseClient";
import { DEV_BYPASS_AUTH } from "./requireInvite";

/**
 * Check whether a group is an evening-only group by looking at the
 * `is_evening` flag on their `invited_emails` rows.
 */
export async function getIsEvening(groupId: string): Promise<boolean> {
  if (DEV_BYPASS_AUTH) {
    return import.meta.env.PUBLIC_DEV_BYPASS_EVENING === "true";
  }

  const { data, error } = await supabase
    .from("invited_emails")
    .select("is_evening")
    .eq("group_id", groupId)
    .limit(1)
    .single();

  if (error || !data) return false;

  return data.is_evening === true;
}
