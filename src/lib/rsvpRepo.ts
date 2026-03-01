import { supabase } from "./supabaseClient";
import { getMyGroupId } from "./getMyGroupId";

/**
 * RSVP record for a group. The `name`, `dietary_requirements`, and
 * `access_needs` columns store per-member data as JSON arrays:
 *
 *   name:                 '[{"email":"a@x.com","name":"Alice"},{"email":"b@x.com","name":"Bob"}]'
 *   dietary_requirements: '[{"email":"a@x.com","value":"vegetarian"},{"email":"b@x.com","value":""}]'
 *   access_needs:         '[{"email":"a@x.com","value":""},{"email":"b@x.com","value":""}]'
 *
 * Legacy rows may contain plain strings (pre-migration); the client handles both.
 * `additional_guests` is the count of additional guests (plus-ones, children) beyond the named members.
 */
export type Rsvp = {
  group_id: string;
  name: string;
  additional_guests: number;
  dietary_requirements: string | null;
  access_needs: string | null;
  additional_guest_names: string | null;
  additional_guest_details: string | null;
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
  additional_guests: number;
  dietary_requirements?: string;
  access_needs?: string;
  additional_guest_names?: string;
  additional_guest_details?: string;
}) {
  const groupId = await getMyGroupId();

  const payload = {
    group_id: groupId,
    name: input.name.trim(),
    additional_guests: input.additional_guests,
    dietary_requirements: input.dietary_requirements?.trim() || null,
    access_needs: input.access_needs?.trim() || null,
    additional_guest_names: input.additional_guest_names?.trim() || null,
    additional_guest_details: input.additional_guest_details?.trim() || null,
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
