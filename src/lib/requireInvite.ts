import { supabase } from "./supabaseClient";

export const DEV_BYPASS_AUTH =
  import.meta.env.DEV && import.meta.env.PUBLIC_DEV_BYPASS_AUTH === "true";

if (!import.meta.env.DEV && import.meta.env.PUBLIC_DEV_BYPASS_AUTH === "true") {
  throw new Error("PUBLIC_DEV_BYPASS_AUTH must not be enabled in production.");
}

export async function requireInvited(): Promise<null | { groupId: string }> {
  if (DEV_BYPASS_AUTH) {
    return {
      groupId:
        import.meta.env.PUBLIC_DEV_BYPASS_GROUP_ID ??
        "00000000-0000-0000-0000-000000000001",
    };
  }

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

  return { groupId: me.group_id };
}
