# Fix the live site: env vars + raw translation keys

## What's wrong (two distinct bugs, both real)

**Bug A — Supabase env vars not in the client bundle.**
The published bundle (`index-CoGHU8KY.js`, `AppHeader-DsCxRA45.js`) is unchanged from the last error report. `src/integrations/my-supabase/client.ts` reads `import.meta.env.MY_SUPABASE_URL` / `MY_SUPABASE_ANON_KEY`. Lovable runtime secrets without a `VITE_` prefix are not injected into the Vite client build, so both values bundle as `""` and the lazy proxy throws `Missing MY_SUPABASE_URL or MY_SUPABASE_ANON_KEY` the moment `AppHeader` touches `supabase.auth.*`. The `define` shim in `vite.config.ts` doesn't help because `process.env.MY_SUPABASE_*` is also undefined at build time. The red console errors are all this one error, repeated by React's render retry — not three separate failures.

**Bug B — i18next never initialized on most pages.**
Worker logs show `react-i18next: NO_I18NEXT_INSTANCE` on every SSR, and the session replay shows literal keys (`prices.empty`, `market.empty`, `demand.empty`). `src/i18n.ts` initializes at module scope, but only `src/routes/processing.tsx` imports `@/i18n`. Every other route uses `useTranslation()` without ever pulling the init module in.

Database, RLS, and worker health are unaffected. Site returns 200 everywhere; this is content + client-side runtime, not a crash on the server path.

## Changes

### 1. `src/integrations/my-supabase/client.ts` — read `VITE_`-prefixed names
Switch the two reads:

```ts
const url = (import.meta.env.VITE_MY_SUPABASE_URL as string) || "";
const anonKey = (import.meta.env.VITE_MY_SUPABASE_ANON_KEY as string) || "";
```

Keep the lazy proxy fallback intact — it's the right SSR-safety behavior.

### 2. `vite.config.ts` — remove the `define` shim
Delete the `vite.define` block entirely. `VITE_*` env vars are auto-injected by the Lovable Vite config; the shim becomes dead code and is a footgun for the next person.

### 3. Add the two `VITE_`-prefixed secrets (user action via secret prompt)
Required new secrets, with values copied from the existing unprefixed ones:
- `VITE_MY_SUPABASE_URL`
- `VITE_MY_SUPABASE_ANON_KEY`

The existing `MY_SUPABASE_URL`, `MY_SUPABASE_ANON_KEY`, and `MY_SUPABASE_SERVICE_ROLE_KEY` stay — they're still used by any server-side code paths.

### 4. `src/routes/__root.tsx` — initialize i18n once, globally
Add a side-effect import at the top:

```ts
import "@/i18n";
```

`__root.tsx` is in every route's module graph, so this guarantees init runs once on server and once on client before any `useTranslation()` call. No other changes to that file.

### 5. `src/routes/processing.tsx` — drop the redundant import
Remove the now-duplicate `import i18n from "@/i18n";`. Cosmetic.

### 6. `public/robots.txt` — stop the recurring 404
```
User-agent: *
Allow: /
```

(Sitemap line omitted until we actually generate one.)

## Verification after redeploy

1. Bundle filenames change (content hashes flip) — confirms a fresh build shipped.
2. `https://www.paoh6.com/` loads without the red `Missing MY_SUPABASE_...` console error.
3. `curl -s https://www.paoh6.com/ | grep -E "(prices|market|demand)\.empty"` returns nothing.
4. Worker logs no longer contain `NO_I18NEXT_INSTANCE`.
5. `curl -I https://www.paoh6.com/robots.txt` → 200.

## Out of scope

- Cookie-based SSR locale detection (one-frame English flash for Burmese visitors stays for now).
- Generating a real `sitemap.xml`.
- The three known low-severity advisor warnings on auth-only RPC helpers — unchanged from prior decision.
- Any DB / RLS / schema work — backend is healthy.
