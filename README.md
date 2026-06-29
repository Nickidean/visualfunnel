# Journey Funnel

A lightweight internal tool for mapping a customer journey as a visual funnel.
Add a screen per step, attach notes, links and per-device data, see where
customers drop off, and present the whole thing in a walkthrough.

Built with Next.js (App Router) + React, with Supabase for persistence and
storage, deployable on Netlify.

## Features

- **Journey library** — create, open, rename and delete multiple journeys.
  Journeys persist across reloads and sessions.
- **Horizontal funnel** — left-to-right with retention bars that narrow down
  the funnel, drop-off chips between steps, and an overall conversion figure.
- **Branching** — forks with named lanes, each showing its traffic share,
  rejoining at the next shared step. Add/remove/rename lanes.
- **Per-device data** — every step holds desktop and mobile visitor numbers and
  an availability setting (`both` / `desktop only` / `mobile only`).
- **Device view toggle** — Desktop / Mobile / Combined, in both the editor and
  present mode. All derived figures (retention, drop-off, lane share, overall
  conversion) recompute from the selected device. Combined sums desktop +
  mobile per step.
- **Notes & links** — multi-line notes and labelled links per step (so a link
  reads as "A/B test deck", not a raw URL). An indicator on each card shows
  which steps have notes or links.
- **Screenshots** — upload, drag or paste. Stored in Supabase Storage; click
  any screenshot to view it full size (lightbox). Thumbnails render at a fixed
  width with their natural height (full image, never cropped), so a taller page
  just makes a taller card. Capture desktop screenshots at a single consistent
  width — 1280px is recommended (see `lib/layout.js`) — and they line up neatly.
- **Present overview** — a board view of the whole journey at once: drag to pan,
  scroll (mouse wheel) to zoom, "Fit" to frame everything, and click any step to
  jump into the walkthrough there.
- **Export** — the journey as a text outline, including branches and links,
  respecting the selected device.
- **Present mode** — full-screen walkthrough, one step at a time, screenshot
  shown large with the title, device-specific numbers, drop-off or path share,
  notes and clickable links beside it. Walks each lane in turn at a fork.
  Keyboard navigation (← / → arrows, Esc to exit) plus on-screen controls.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Without Supabase credentials the app runs against **browser localStorage**, so
you can try everything immediately. Data lives only in that browser.

## Connecting Supabase (real persistence + team sign-in)

Journeys are stored per-user: each teammate signs in with their email
(passwordless magic link) and sees only their own journeys, enforced by
row-level security.

1. **Create a Supabase project.**
2. **Run the schema.** Paste [`supabase/schema.sql`](supabase/schema.sql) into
   the SQL editor and run it. It creates the `journeys` table with row-level
   security and a public `screenshots` storage bucket.
3. **Enable email auth.** In the Supabase dashboard → **Authentication →
   Providers → Email**, make sure Email is enabled (magic link works out of the
   box). Under **Authentication → URL Configuration**, set:
   - **Site URL** to your app URL (e.g. `https://your-site.netlify.app`, or
     `http://localhost:3000` for local dev).
   - **Redirect URLs**: add both your Netlify URL and `http://localhost:3000`.
4. **Restrict who can join (small team).** To keep it to trusted people, either
   turn **off** "Allow new users to sign up" (Authentication → Sign In / Up) and
   invite teammates via **Authentication → Users → Invite**, or leave sign-ups
   on and share the URL only with your team.
5. **Set env vars.** Copy `.env.example` to `.env.local` and fill in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_SUPABASE_BUCKET=screenshots
   ```

   (Find URL + anon key under **Project Settings → API**.)

Once these are set the app shows a sign-in screen; after signing in, journeys
and screenshots persist to Supabase and sync across sessions and devices.
Without the env vars the app skips sign-in and saves to browser localStorage.

## Data model

`journeys` table: `id`, `owner`, `name`, `updated_at`, and a JSONB `structure`
column holding the ordered sections, lanes and steps — including each step's
title, notes, links, per-device numbers and availability. Screenshots live in
Supabase Storage; their URLs are referenced inside `structure`.

```
structure = {
  sections: [
    { type: "step", step: Step },
    { type: "fork", id, lanes: [ { id, name, steps: [Step] } ] }
  ]
}

Step = {
  id, title, screenshotUrl,
  notes, links: [ { id, label, url } ],
  data: { desktop: number|null, mobile: number|null },
  availability: "both" | "desktop" | "mobile"
}
```

Keeping the whole journey in one record is simple to load, save and version.
Normalise into separate tables later only if cross-journey querying is needed.

## Deploying to Netlify

1. Push this repo to GitHub and **Add new site → Import an existing project** in
   Netlify, pointing at the repo. The included `netlify.toml` already sets the
   build command (`npm run build`) and the Next.js runtime plugin.
2. In **Site settings → Environment variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_BUCKET` (`screenshots`)
3. Deploy. Then copy your site's URL into the Supabase **Site URL** and
   **Redirect URLs** (step 3 above) so the magic-link emails return to your app.
4. Visit the site, sign in with your email, and you're live. Invite teammates
   by sharing the URL (and inviting them in Supabase if sign-ups are off).

## Out of scope (for now)

AI critique, analytics integrations, and real-time multi-user editing.
