# Tom & Bryony Wedding Site

An invite-only wedding website built with Astro, Supabase, and deployed on Cloudflare Workers.

## Development

```bash
npm install       # Install dependencies
npm run dev       # Start local dev server at localhost:4321
npm run build     # Build production site to ./dist/
npm run preview   # Preview the build locally
```

### Dev auth bypass

To skip Supabase auth locally, add the following to `.env.local`:

```
PUBLIC_DEV_BYPASS_AUTH=true
PUBLIC_DEV_BYPASS_GROUP_ID=<a real group_id from your invited_emails table>
```

RSVP data will be stored in `localStorage` instead of Supabase when this is enabled.

## Inviting guests

Guests are invited via the `scripts/invite.mjs` script. It reads a CSV of guests, adds them to the Supabase `invited_emails` table, and sends each person with an email address either an invite email (first time) or an OTP sign-in email (returning user).

### 1. Prepare your CSV

Edit `guests.csv` in the project root. The file is gitignored and will not be committed. See `guests.example.csv` for the expected format.

Required columns: `first_name`, `last_name`, `email`, `group`

```csv
first_name,last_name,email,group
John,Smith,john@example.com,smith-family
Jane,Smith,jane@example.com,smith-family
,Smith,,smith-family
```

- **`group`** — a label that groups people together (e.g. a couple or family). Everyone in the same group shares one RSVP.
- **`email`** — leave blank for members who don't have an email (children, etc.). They will be added to the group but won't receive an invite or have a login.
- **`first_name`** — used in the invite email greeting.
- **`last_name`** — combined with `first_name` to form the display name shown on the RSVP page.

### 2. Set up `.env.local`

The script requires these variables in `.env.local`:

```
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SUPABASE_ANON_KEY=<anon key>
SITE_URL=https://<your-production-url>   # controls the redirect link in invite emails
```

### 3. Run the script

**Dry run** (no emails sent, no database writes):
```bash
node scripts/invite.mjs --dry-run
```

**Live run**:
```bash
node scripts/invite.mjs
```

To use a different CSV file:
```bash
node scripts/invite.mjs path/to/other.csv
node scripts/invite.mjs path/to/other.csv --dry-run
```

The script is safe to re-run. Existing users receive a fresh OTP sign-in email rather than a new invite. Database rows are upserted so no duplicates are created.

## Database

The site uses Supabase. Before running the invite script for the first time, ensure the `invited_emails` table has a `display_name` column:

```sql
ALTER TABLE invited_emails ADD COLUMN IF NOT EXISTS display_name text;
```
