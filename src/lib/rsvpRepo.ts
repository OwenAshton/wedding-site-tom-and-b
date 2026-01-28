import { supabase } from "./supabaseClient";
import { getMyGroupId } from "./getMyGroupId";

export type Rsvp = {
  group_id: string;
  name: string;
  party_size: number;
  dietary_requirements: string | null;
  access_needs: string | null;
};

export async function getMyRsvp(): Promise<Rsvp | null> {
  const groupId = await getMyGroupId();

  const { data, error } = await supabase
    .from("rsvp")
    .select("*")
    .eq("group_id", groupId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertMyRsvp(input: {
  name: string;
  party_size: number;
  dietary_requirements?: string;
  access_needs?: string;
}) {
  const groupId = await getMyGroupId();

  const payload = {
    group_id: groupId,
    name: input.name.trim(),
    party_size: input.party_size,
    dietary_requirements: input.dietary_requirements?.trim() || null,
    access_needs: input.access_needs?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("rsvp")
    .upsert(payload, { onConflict: "group_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}
