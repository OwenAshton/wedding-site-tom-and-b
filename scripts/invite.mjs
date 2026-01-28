import "dotenv/config";
import fs from "node:fs";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.SITE_URL || "http://localhost:4321";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function parseCsv(path) {
  const raw = fs.readFileSync(path, "utf8").trim();
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const idxEmail = headers.indexOf("email");
  const idxPartner = headers.indexOf("partner_email");

  if (idxEmail === -1) throw new Error("CSV must include a header column named: email");
  // partner_email is optional

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const email = (cols[idxEmail] || "").toLowerCase();
    const partner_email = idxPartner >= 0 ? (cols[idxPartner] || "").toLowerCase() : "";

    if (!email) continue;

    rows.push({ email, partner_email: partner_email || null });
  }
  return rows;
}

async function upsertInvitedEmail(email, groupId) {
  const { error } = await supabase
    .from("invited_emails")
    .upsert({ email, group_id: groupId }, { onConflict: "email" });

  if (error) throw error;
}

async function inviteEmail(email) {
  // Sends an invite email from Supabase Auth
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback`,
  });

  if (error) {
    // Common case: user already exists
    console.warn(`Invite issue for ${email}: ${error.message}`);
    return { ok: false, error: error.message };
  }

  console.log(`Invited: ${email} (userId: ${data.user?.id ?? "n/a"})`);
  return { ok: true };
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

  for (const r of rows) {
    const groupId = crypto.randomUUID();

    const emails = [r.email, r.partner_email].filter(Boolean);

    console.log(`\nGroup ${groupId}: ${emails.join(" + ")}`);

    if (!dryRun) {
      // 1) Write allowlist/group mapping first
      for (const e of emails) {
        await upsertInvitedEmail(e, groupId);
      }

      // 2) Send invites
      for (const e of emails) {
        await inviteEmail(e);
      }
    }
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error("\nFAILED:", e);
  process.exit(1);
});