# Quietly Krowned · The Mirror V2

A small 30-day beta journaling app. The browser stores journal entries locally; serverless functions handle opt-in AI reflections and content-free participation analytics.

## Files
- `index.html`: private local journal, challenge, opt-in AI reflections, backup tools
- `admin.html`: admin analytics dashboard
- `api/mirror.js`: server-side Anthropic request
- `api/analytics.js`: validated content-free event ingestion
- `api/admin-stats.js`: protected aggregated event counts

## Vercel Production environment variables
- `ANTHROPIC_API_KEY` (secret)
- `SUPABASE_URL` (config)
- `SUPABASE_SECRET_KEY` (secret)
- `ADMIN_TOKEN` (secret, strong random value)
- Optional: `ANTHROPIC_MODEL` (config, supported Anthropic model ID; default in code may need updating)

## Supabase table
The database requires `public.qk_events` with columns `id`, `participant_id`, `event_type`, `challenge_day`, and `created_at`, and RLS enabled. Do not store journal text in the analytics table. Only the serverless functions should use the secret key.

## Deploy safely
1. Download the ZIP and extract it locally.
2. Upload the files and `api` directory to a **new test branch** of your existing GitHub repository, or use a separate staging repository. Do not overwrite the current production `index.html` until testing is complete.
3. Ensure Vercel Preview has the needed environment variables (Production-only secrets will not automatically be available to Preview). Never commit `.env` or API keys.
4. Test local save → refresh, opt-in analytics, explicit reflection consent, backup/export/import, delete, and admin access.
5. Once all tests pass, merge to `main` and verify the new Vercel deployment. The old app's temporary in-memory entries do not migrate.

## Privacy and operational limitations
- Browser localStorage is **not encrypted** and is accessible to anyone with access to the browser profile. Clearing browser storage or using a different device can lose entries. Exported backups are unencrypted.
- AI reflection explicitly sends selected writing to Anthropic via the server. The app intentionally does not log request bodies, but service providers may process request data and technical logs according to their policies.
- Analytics participant IDs are pseudonymous, not guaranteed fully anonymous. Participants can opt out of activity reporting. Events are not proof of unique humans; public event ingestion can be spammed. Protect admin token and consider rate limits, CAPTCHA, monitoring, and stronger authentication before wider launch.
- `ADMIN_TOKEN` is checked server-side, and the admin page stores it only in sessionStorage for the tab session. Use a private browser and clear it when finished.
- Current beta analytics aggregate from up to 10,000 events. For larger use, implement database aggregation and pagination.
- Verify Anthropic model availability and billing. API funds are separate from subscriptions.
- Avoid including confidential personal data in AI reflections. This tool is not therapy or emergency support.
