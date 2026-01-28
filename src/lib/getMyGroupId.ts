import { supabase } from "./supabaseClient";

export async function getMyGroupId(): Promise<string> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Not signed in");

  const { data: me, error: meErr } = await supabase
    .from("app_users")
    .select("group_id")
    .eq("user_id", userId)
    .single();

  if (meErr) throw meErr;
  if (!me?.group_id) throw new Error("You are not on the invite list.");

  return me.group_id;
}
