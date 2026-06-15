# Fix published-site SSR 500

Two module-scope bugs crash the Cloudflare Worker on import. Dev/Node has shims so it works locally; the Worker doesn't, so every request 500s and h3 swallows the stack.

## 1. `src/i18n.ts` — don't touch `localStorage`/`navigator` during SSR

Replace the file with a guarded init: only attach `LanguageDetector` and `detection` in the browser; pin `lng: "en"` on the server.

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import my from "./locales/my.json";

const isBrowser = typeof window !== "undefined";

if (!i18n.isInitialized) {
  const instance = i18n.use(initReactI18next);
  if (isBrowser) instance.use(LanguageDetector);

  void instance.init({
    resources: { en: { translation: en }, my: { translation: my } },
    fallbackLng: "en",
    lng: isBrowser ? undefined : "en",
    supportedLngs: ["en", "my"],
    interpolation: { escapeValue: false },
    detection: isBrowser
      ? { order: ["localStorage", "navigator"], caches: ["localStorage"], lookupLocalStorage: "sz6_lang" }
      : undefined,
  });
}

export default i18n;
```

One-frame English flash on hydration for Myanmar visitors is acceptable; cookie-based SSR locale is a later polish.

## 2. `src/integrations/my-supabase/client.ts` — don't `createClient("")` at module scope

`MY_SUPABASE_URL` and `MY_SUPABASE_ANON_KEY` are present as project secrets (confirmed via `fetch_secrets`), and `vite.config.ts` inlines them via `define`. So the published build should have real values. But the file still calls `createClient(url, anonKey)` with empty-string fallbacks — if the define ever misses (preview vs prod, missing build env), `new URL("")` throws at import and the whole Worker dies the same way.

Harden it so an unconfigured env degrades gracefully instead of blowing up SSR:

- If `url`/`anonKey` are empty, export a lazy proxy `supabase` that throws **only when actually used**, not at import.
- Otherwise behave exactly as today.

This keeps SSR boot safe and surfaces a clear error at the first real query if secrets ever go missing.

## 3. Verify the fix

After edits, the build runs automatically. Then hit the published URL and confirm 200 + rendered HTML. If still 500, pull `stack_modern--server-function-logs` (deployment=`published`) — with the i18n landmine removed, the real stack (if any) should now reach logs via the existing `error-capture` + `server.ts` wrapper.

## Out of scope

- Cookie-based SSR locale detection.
- Touching `server.ts`, `error-capture.ts`, or routes — the wrapper is already correctly wired per the SSR error-handling card.
- Any DB/RLS changes — backend is verified healthy.
