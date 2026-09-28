# Shree Mahaganpati Enterprises — website

Company website (React + Vite) with a Supabase backend for customer enquiries.

## Pages

`/` Home · `/about` (founder section at `/about#founder`) · `/products` · `/services` · `/industries` · `/how-we-work` · `/contact` · `/admin` (private)

## How enquiries work

1. A customer fills in the form on `/contact` (or clicks **Enquire about this** on a product, which pre-selects the category).
2. The form calls the Supabase Edge Function `submit-enquiry`. It validates the input, drops spam (hidden honeypot field, max 5 enquiries per visitor per 10 minutes), saves the enquiry to the `enquiries` table and, if configured, emails it to the business.
3. The customer sees a confirmation and can also forward the same requirement by WhatsApp or email.
4. The owner signs in at `/admin` with an emailed sign-in link to see, search, filter, update status (New / In progress / Closed), add notes, delete, and export enquiries to CSV. New enquiries appear live.

Security: the database is locked with row-level security. Website visitors cannot read or change any stored data; only emails listed in `admin_emails` can read or manage enquiries.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build in dist/
npm run preview    # serve the production build
```

Settings are in `.env` (the Supabase URL and anon key are public, browser-safe values). Before building for production set `VITE_SITE_URL` to the live domain, e.g. `https://www.shreemahaganpati.com` — it is used for canonical URLs, `sitemap.xml` and `robots.txt`.

## Deploy

Any static host works. `vercel.json` (Vercel) and `public/_redirects` (Netlify) make page URLs like `/about` work on refresh.

After deploying, in the Supabase dashboard → **Authentication → URL Configuration**:
- set **Site URL** to the live domain, and
- add `https://<your-domain>/admin` to **Redirect URLs**,

otherwise admin sign-in links will point to localhost.

## Email alerts for new enquiries (optional)

1. Create a free account at resend.com (ideally with Shreemahaganapati72@gmail.com) and create an API key.
2. Supabase dashboard → **Edge Functions → Secrets**: add `RESEND_API_KEY`.
3. Optional secrets: `NOTIFY_EMAIL` (recipient, default Shreemahaganapati72@gmail.com) and `RESEND_FROM` (sender; needs a domain verified in Resend, default `onboarding@resend.dev`, which can only send to the Resend account's own email).

Without the key, enquiries are still saved and visible in `/admin`.

## Admin users

Add or remove admins in the Supabase SQL editor:

```sql
insert into public.admin_emails (email) values ('someone@example.com');
delete from public.admin_emails where email = 'someone@example.com';
```

Emails must be lowercase.

## Backend source

- `supabase/migrations/` — database tables, security rules and realtime setup (already applied to project `gvivdgryatugomqoolpm`).
- `supabase/functions/submit-enquiry/` — the enquiry Edge Function (already deployed). Redeploy with `supabase functions deploy submit-enquiry`.
