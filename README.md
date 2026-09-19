# Multan Dental & Aesthetics

Independent clinic website, booking system, and owner desk. React 19, TanStack Start, Vite, Node.js, and a local SQLite database. The application has no editor-platform SDK, telemetry, asset proxy, or external database dependency.

## Run it

Use Node.js **24.15+** (Node 24 LTS is recommended for deployment).

```sh
npm ci --legacy-peer-deps
npm run setup
npm run build
npm start
```

The production server defaults to port 3000. Set `PORT` and `HOST` in the process environment to change it. For development: `npm run dev` (127.0.0.1:5173).

The setup command creates `.data/clinic.sqlite` and an owner account. On first setup, it generates a strong password and saves the credentials to **`.data/OWNER-ACCESS.txt`**. This file and the database are excluded from version control. Visit `/owner`, sign in, and change the password in **Hours & account**. Subsequent setup runs preserve the existing account and data. You can supply `OWNER_USERNAME` and `OWNER_PASSWORD` as environment variables on the first setup instead.

Copy `.env.example` to `.env` to customize the database path or public origin. Server-side settings never use the `VITE_` prefix.

## What works

- Patient booking: actual available slots, two-step form, persistent receipt, downloadable private reference, status lookup, cancellation.
- Owner desk: cookie-based login, appointments/search/date filters, confirmation, rescheduling, cancellation, completion, enquiries, read/unread tracking, weekly hours, closed dates, password changes, and logout.
- Clinic hours on public pages follow the database. Appointments use Asia/Karachi and 30-minute slots, with a 90-day booking window.
- Simultaneous requests cannot book the same slot. Pending appointments reserve a slot until the owner confirms or cancels them.
- Contact messages appear in the owner inbox. Phone, WhatsApp, maps, and email reply links are functional. The app does **not** send automatic email/SMS notifications; the clinic contacts the patient or the patient checks their reference.
- Old gallery, testimonial, and membership URLs redirect to current pages. Unverified testimonials, ratings, membership prices, and duplicate before/after imagery were removed.

## Data and security

Patient records stay in your SQLite database. Private reference hashes, salted scrypt password hashes, hashed session tokens, eight-hour HttpOnly/SameSite cookies, server validation, origin checks, body limits, persistent rate limits, transaction-protected slot changes, and an appointment audit table are implemented. Only authenticated owners can read the appointment list, enquiries, or change the schedule.

On a public deployment, set `SITE_URL=https://your-domain.com` and `COOKIE_SECURE=true`, use HTTPS, and keep the database on a persistent private disk. Use **one Node instance per database file**. This is not an ephemeral/serverless database setup. Configure `TRUST_PROXY=true` only behind a trusted reverse proxy that overwrites `X-Forwarded-For`; otherwise request limits intentionally share a conservative client bucket. Put access controls on your host and keep backups private because the SQLite file contains patient contact information.

Run `npm run backup` to create a consistent SQLite snapshot in `.data/backups/`. For a restore, stop the server, keep a safety copy of the current database, replace `clinic.sqlite` with a chosen backup, remove stale `-wal`/`-shm` files if present, and restart. Test your restore process before relying on it. An owner password can be administratively reset with `npm run reset-owner`; the command revokes sessions and writes new credentials locally.

## Your own hosting

The included Dockerfile builds a standalone Node server. `compose.yaml` keeps `/app/.data` in a named volume so deployments preserve records. `deploy/Caddyfile` is a reverse-proxy example for a domain you control. Replace `dental.example.com`, point DNS at your server, and allow ports 80/443 for HTTPS. No hosting account or domain was available during implementation, so public deployment has not been performed.

```sh
docker compose up --build -d
```

Bind the application privately behind your reverse proxy. The local compose default is `http://127.0.0.1:3000`. Avoid committing `.data`, `.env`, owner credentials, database exports, or test artifacts.

## Verification

```sh
npm test
npm run typecheck
npm run build
npm run test:browser
```

Backend tests use disposable databases, never the clinic database. Browser tests start a separate production instance on port 5180 with an isolated SQLite file and a test-only owner. On Windows they use installed Edge headlessly; on other platforms run `npx playwright install chromium` first. Screenshots and failure traces are saved under `artifacts/` (ignored). Test traces may include test-only passwords and references.

Reference documentation: [TanStack hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting), [Node SQLite](https://nodejs.org/api/sqlite.html), [WCAG 2.2](https://www.w3.org/TR/WCAG22/). These informed the self-hosting setup and accessibility work; this repository does not claim a formal accessibility certification.
