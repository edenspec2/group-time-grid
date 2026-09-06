# Render + Supabase Deployment Handoff

Use this document when maintaining or troubleshooting the production deployment with another agent.

## Current production setup

- Application: https://group-time-grid.onrender.com
- Health check: https://group-time-grid.onrender.com/health
- Render service: `group-time-grid`
- Supabase project URL: `https://azazdxzktcehsaajdhue.supabase.co`
- Supabase Storage bucket: `group-time-grid`
- The bucket must be private.
- The retired URL `https://prgwjlqmrsezjcnshvh.supabase.co` does not resolve and must not be used.

The latest successful Render startup printed:

```text
Group Time Grid on http://0.0.0.0:10000
Your service is live
```

## Architecture

Render runs one Node process that serves:

- The built React/Vite frontend
- The Express API
- WebSocket live updates
- Uploaded material downloads

The production commands are:

```text
Build: npm ci && npm run build
Start: npm start
Health check: /health
```

`server/index.js` calls `initializeStore()` before opening the HTTP port. If the startup message appears, Supabase initialization completed successfully.

`server/store.js` provides persistence:

- Event state is stored as `events.json` in the private Supabase bucket.
- Uploaded files are stored under `uploads/<event-id>/<stored-name>`.
- Local development falls back to `data/events.json` and `data/uploads/`.
- Render's local filesystem is ephemeral and must not be relied on for production durability.

## Required Render environment variables

Configure these under Render service **Environment**:

```text
NODE_ENV=production
SUPABASE_URL=https://azazdxzktcehsaajdhue.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<Supabase secret or legacy service_role key>
SUPABASE_BUCKET=group-time-grid
```

Important:

- `SUPABASE_URL` is the base project URL only.
- Do not append `/rest/v1/`, `/storage/v1/`, or any other path.
- Do not add quotes.
- The Supabase client adds the correct API path automatically.
- `SUPABASE_SERVICE_ROLE_KEY` must contain a server-side `sb_secret_...` key or legacy `service_role` key.
- Do not use the publishable or `anon` key.
- Never print, commit, or expose the secret key to the browser.

The Supabase dashboard may display the Data API URL as:

```text
https://azazdxzktcehsaajdhue.supabase.co/rest/v1/
```

For `SUPABASE_URL`, remove `/rest/v1/`:

```text
https://azazdxzktcehsaajdhue.supabase.co
```

## Supabase setup

1. Open https://supabase.com/dashboard.
2. Confirm the project is **Active/Healthy**.
3. Open **Storage**.
4. Confirm a private bucket named exactly `group-time-grid` exists.
5. Open **Project Settings → API** or **API Keys**.
6. Copy the base Project URL.
7. Copy a server-side secret key or legacy `service_role` key.
8. Put those values into Render's environment settings; never put them in source control.

The application can create the bucket automatically when the server key has sufficient permissions, but creating it manually makes the configuration easy to verify.

## Render deployment workflow

1. Push the intended commit to the branch connected to Render.
2. Open https://dashboard.render.com.
3. Select the `group-time-grid` service.
4. Confirm the environment variables above.
5. Select **Manual Deploy → Deploy latest commit**, or allow auto-deploy.
6. Watch the runtime logs after the build completes.
7. Confirm the startup line:

   ```text
   Group Time Grid on http://0.0.0.0:<port>
   ```

8. Confirm https://group-time-grid.onrender.com/health returns:

   ```json
   {"ok":true}
   ```

A successful build does not prove the service started. Always inspect the lines after `Deploying...`.

## Durable-storage verification

Use this procedure after changing storage configuration:

1. Create a clearly labeled test meeting in the production app.
2. Save its `/m/<event-id>` URL.
3. In Supabase, open **Storage → group-time-grid** and confirm `events.json` exists.
4. Restart the Render service or deploy the latest commit.
5. Wait for `/health` to return `{"ok":true}`.
6. Reopen the exact meeting URL.
7. Confirm the event name, schedule, participants, marks, and materials are still present.

An existing QA event was created for this purpose:

```text
https://group-time-grid.onrender.com/m/0789b791cb117f20e92cc45a964a6db4
```

It was confirmed before restart with the name `Durable Storage QA 2026-09-06`. Reopen it after a restart or deployment to finish the persistence check. Do not request or expose its manager password.

## Common failures

### `StorageApiError: Invalid path specified in request URL`

Likely cause: `SUPABASE_URL` contains `/rest/v1/`.

Fix:

```text
Wrong: https://<project-ref>.supabase.co/rest/v1/
Right: https://<project-ref>.supabase.co
```

### `getaddrinfo ENOTFOUND <project-ref>.supabase.co`

The hostname does not exist. Common causes:

- An incorrect project reference
- A paused, deleted, or failed Supabase project
- Supabase DNS provisioning failure

Confirm the hostname with a public DNS lookup and copy the current Project URL directly from Supabase. The old `prgwjlqmrsezjcnshvh` project reference produced this error.

### `StorageUnknownError: fetch failed`

Inspect the nested cause. If it contains `ENOTFOUND`, fix the Supabase hostname. If DNS resolves, check Supabase project health and Render outbound connectivity.

### Unauthorized or permission errors

Likely cause: the publishable or `anon` key was used.

Replace it with a server-side `sb_secret_...` or legacy `service_role` key. Keep the Render variable name as `SUPABASE_SERVICE_ROLE_KEY`.

### Bucket not found

Create a private bucket named exactly `group-time-grid`, or confirm:

```text
SUPABASE_BUCKET=group-time-grid
```

### Render says the build passed but exits with status 1

The frontend build succeeded, but the Node server failed during startup. Read the runtime stack trace below `Deploying...`; storage initialization errors happen before the server begins listening.

### The public app still works after a failed deployment

Render keeps the previous healthy deployment active when a replacement fails. This does not mean the new storage configuration succeeded. Verify the deployment timestamp and startup logs.

## Relevant files

- `render.yaml` — Render service commands and environment-variable declarations
- `server/store.js` — Supabase bucket initialization, event persistence, and uploaded files
- `server/index.js` — Server startup, API routes, downloads, and health endpoint
- `package.json` — Node scripts and Supabase dependency
- `README.md` — General local and deployment documentation

## Agent safety checklist

- Never ask the user to paste the Supabase secret key into chat.
- Never print Render environment secrets in logs or terminal output.
- Do not put the service key in a `VITE_` variable; that would expose it to the browser.
- Do not make the storage bucket public.
- Do not replace Supabase with Render's local disk for production.
- Do not assume a successful build means a successful deployment.
- Do not alter billing plans or enable paid resources without explicit user approval.
- Avoid modifying or deleting real events during tests; use clearly labeled QA data.
