import { supabase } from "./supabaseClient";

export async function requireInvited() {
  const { data: sessionRes } = await supabase.auth.getSession();
  const session = sessionRes.session;

  if (!session) {
    window.location.replace("/login-error");
    return null;
  }

  const userId = session.user.id;

  const { data: me, error } = await supabase
    .from("app_users")
    .select("group_id")
    .eq("user_id", userId)
    .single();

  if (error || !me?.group_id) {
    window.location.replace("/not-invited");
    return null;
  }

  return { session, groupId: me.group_id };
}
