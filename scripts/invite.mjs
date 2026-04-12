import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "node:fs";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SITE_URL = process.env.SITE_URL || "http://localhost:4321";

if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

// Admin client (service role) for DB + admin auth calls
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// Public/anon client used ONLY to trigger "signInWithOtp" emails
const supabasePublic = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false },
});

function parseCsv(path) {
  const raw = fs.readFileSync(path, "utf8").trim();
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const idxGroup = headers.indexOf("group");
  const idxEmail = headers.indexOf("email");
  const idxFirstName = headers.indexOf("first_name");
  const idxLastName = headers.indexOf("last_name");
  const idxIsEvening = headers.indexOf("is_evening");

  if (idxEmail === -1) throw new Error("CSV must include a header column named: email");
  if (idxGroup === -1) throw new Error("CSV must include a header column named: group");

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());

    const email = (cols[idxEmail] || "").toLowerCase() || null;
    const group = cols[idxGroup] || "";
    if (!group) {
      console.warn(`Row ${i + 1}: skipping — no group specified`);
      continue;
    }

    const first_name = idxFirstName >= 0 ? cols[idxFirstName] || null : null;
    const last_name = idxLastName >= 0 ? cols[idxLastName] || null : null;
    const is_evening = idxIsEvening >= 0 ? (cols[idxIsEvening] || "").toLowerCase() === "true" : false;

    // Rows without an email are emailless members (no login, no invite sent)
    rows.push({ group, email, first_name, last_name, is_evening });
  }

  return rows;
}

function groupRows(rows) {
  const groups = new Map(); // group label -> array of { email, first_name, ... }
  for (const r of rows) {
    if (!groups.has(r.group)) groups.set(r.group, []);
    groups.get(r.group).push({ email: r.email, first_name: r.first_name, last_name: r.last_name, is_evening: r.is_evening });
  }
  return groups;
}

async function upsertInvitedEmail(email, groupId, displayName = null, isEvening = false) {
  const { error } = await supabaseAdmin
    .from("invited_emails")
    .upsert({ email, group_id: groupId, display_name: displayName, is_evening: isEvening }, { onConflict: "email" });

  if (error) throw error;
}

async function fetchAllUsersByEmail() {
  const map = new Map(); // email(lower) -> user
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users ?? [];
    for (const u of users) {
      if (u?.email) map.set(u.email.toLowerCase(), u);
    }

    if (users.length < perPage) break;
    page += 1;
  }

  return map;
}

async function inviteEmail(firstName, email) {
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${SITE_URL}/welcome`,
    data: { first_name: firstName ?? email },
  });

  if (error) {
    console.warn(`  Invite issue for ${email}: ${error.message}`);
    return { ok: false, mode: "invite", error: error.message };
  }

  console.log(`  Invited: ${email} (userId: ${data.user?.id ?? "n/a"})`);
  return { ok: true, mode: "invite" };
}

async function updateFirstNameIfNeeded(userId, firstName, email) {
  const desired = firstName ?? email;

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { first_name: desired },
  });

  if (error) {
    console.warn(`  Could not update metadata for ${email}: ${error.message}`);
  }
}

async function sendOtpSignIn(email) {
  const { error } = await supabasePublic.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    console.warn(`  OTP sign-in issue for ${email}: ${error.message}`);
    return { ok: false, mode: "otp", error: error.message };
  }

  console.log(`  Sent OTP sign-in: ${email}`);
  return { ok: true, mode: "otp" };
}

async function inviteOrOtp(existingUsersByEmail, firstName, email) {
  const existing = existingUsersByEmail.get(email.toLowerCase());

  if (existing) {
    await updateFirstNameIfNeeded(existing.id, firstName, email);
    return await sendOtpSignIn(email);
  }

  return await inviteEmail(firstName, email);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const csvPath = args.find((a) => !a.startsWith("--")) ?? "guests.csv";

  const rows = parseCsv(csvPath);
  if (rows.length === 0) {
    console.log("No rows found in CSV.");
    return;
  }

  const groups = groupRows(rows);

  console.log(`Loaded ${rows.length} guests in ${groups.size} groups from ${csvPath}`);
  console.log(dryRun ? "Running in DRY RUN mode (no writes/emails)." : "Running LIVE.");

  // Load existing users once
  const existingUsersByEmail = await fetchAllUsersByEmail();

  for (const [groupLabel, members] of groups) {
    const groupId = crypto.randomUUID();

    const label = members
      .map((m) => {
        const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || null;
        return m.email ? `${name ?? m.email} <${m.email}>` : `${name ?? "Guest"} (no email)`;
      })
      .join(" + ");

    console.log(`\nGroup "${groupLabel}" (${groupId}): ${label}`);

    if (!dryRun) {
      for (const m of members) {
        if (m.email) {
          // 1) allowlist/group mapping — display_name is full name for the RSVP page
          const displayName = [m.first_name, m.last_name].filter(Boolean).join(" ") || null;
          await upsertInvitedEmail(m.email, groupId, displayName, m.is_evening);
          // 2) send email (invite or OTP sign-in)
          await inviteOrOtp(existingUsersByEmail, m.first_name, m.email);
        } else {
          // Emailless member — add to group with synthetic key, no login
          const syntheticKey = `__guest__${crypto.randomUUID()}`;
          const displayName = [m.first_name, m.last_name].filter(Boolean).join(" ") || "Guest";
          await upsertInvitedEmail(syntheticKey, groupId, displayName, m.is_evening);
          console.log(`  Emailless member added: "${displayName}" (key: ${syntheticKey})`);
        }
      }
    }
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error("\nFAILED:", e);
  process.exit(1);
});
