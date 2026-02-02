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

  const idxEmail = headers.indexOf("email");
  const idxPartner = headers.indexOf("partner_email");
  const idxFirstName = headers.indexOf("first_name");

  if (idxEmail === -1) throw new Error("CSV must include a header column named: email");

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());

    const email = (cols[idxEmail] || "").toLowerCase();
    if (!email) continue;

    const partner_email = idxPartner >= 0 ? (cols[idxPartner] || "").toLowerCase() : null;
    const first_name = idxFirstName >= 0 ? cols[idxFirstName] || null : null;

    rows.push({ email, first_name, partner_email });
  }

  return rows;
}

async function upsertInvitedEmail(email, groupId) {
  const { error } = await supabaseAdmin
    .from("invited_emails")
    .upsert({ email, group_id: groupId }, { onConflict: "email" });

  if (error) throw error;
}

async function fetchAllUsersByEmail() {
  const map = new Map(); // email(lower) -> user
  let page = 1;
  const perPage = 200; // plenty for your user count

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
    redirectTo: `${SITE_URL}/auth/callback`,
    data: { first_name: firstName ?? email },
  });

  if (error) {
    console.warn(`Invite issue for ${email}: ${error.message}`);
    return { ok: false, mode: "invite", error: error.message };
  }

  console.log(`Invited: ${email} (userId: ${data.user?.id ?? "n/a"})`);
  return { ok: true, mode: "invite" };
}

async function updateFirstNameIfNeeded(userId, firstName, email) {
  // Optional: keep metadata in sync with your CSV
  const desired = firstName ?? email;

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { first_name: desired },
  });

  if (error) {
    console.warn(`Could not update metadata for ${email}: ${error.message}`);
  }
}

async function sendOtpSignIn(email) {
  // This triggers the normal "magic link / OTP" email flow.
  // shouldCreateUser:false prevents accidental signup. :contentReference[oaicite:2]{index=2}
  const { error } = await supabasePublic.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/callback`,
      shouldCreateUser: false,
    },
  });

  if (error) {
    console.warn(`OTP sign-in issue for ${email}: ${error.message}`);
    return { ok: false, mode: "otp", error: error.message };
  }

  console.log(`Sent OTP/magic-link sign-in: ${email}`);
  return { ok: true, mode: "otp" };
}

async function inviteOrOtp(existingUsersByEmail, firstName, email) {
  const existing = existingUsersByEmail.get(email.toLowerCase());

  if (existing) {
    // user already exists -> send a fresh sign-in email
    await updateFirstNameIfNeeded(existing.id, firstName, email);
    return await sendOtpSignIn(email);
  }

  // user doesn't exist -> invite creates user + sends invite email
  return await inviteEmail(firstName, email);
}

async function main() {
  const csvPath = process.argv[2] || "guests.csv";
  const dryRun = process.argv.includes("--dry-run");

  const rows = parseCsv(csvPath);
  if (rows.length === 0) {
    console.log("No rows found in CSV.");
    return;
  }

  console.log(`Loaded ${rows.length} rows from ${csvPath}`);
  console.log(dryRun ? "Running in DRY RUN mode (no writes/emails)." : "Running LIVE.");

  // Load existing users once
  const existingUsersByEmail = await fetchAllUsersByEmail();

  for (const r of rows) {
    const groupId = crypto.randomUUID();

    const emails = [r.email, r.partner_email].filter(Boolean);
    const label = [
      r.first_name ? `${r.first_name} <${r.email}>` : r.email,
      r.partner_email ? r.partner_email : null,
    ].filter(Boolean);

    console.log(`\nGroup ${groupId}: ${label.join(" + ")}`);

    if (!dryRun) {
      // 1) allowlist/group mapping
      for (const e of emails) await upsertInvitedEmail(e, groupId);

      // 2) send email (invite or OTP sign-in)
      for (const e of emails) {
        const firstName = e === r.email ? r.first_name : null;
        const res = await inviteOrOtp(existingUsersByEmail, firstName, e);

        // If we invited a brand new user, update our cache so future rows won't re-invite them
        if (res?.mode === "invite" && res.ok) {
          // refresh cache entry (optional). simplest: reload everything is overkill,
          // but for small runs you can ignore. If you want, we can fetch user by listing again.
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
