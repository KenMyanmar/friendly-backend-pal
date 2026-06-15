import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import my from "./locales/my.json";

const isBrowser = typeof window !== "undefined";
const storedLanguage = isBrowser ? window.localStorage.getItem("sz6_lang") : null;
const initialLanguage = storedLanguage?.startsWith("my") ? "my" : "en";

if (!i18n.isInitialized) {
  const instance = i18n.use(initReactI18next);
  if (isBrowser) instance.use(LanguageDetector);

  void instance.init({
    resources: { en: { translation: en }, my: { translation: my } },
    fallbackLng: "en",
    lng: initialLanguage,
    supportedLngs: ["en", "my"],
    interpolation: { escapeValue: false },
    detection: isBrowser
      ? {
          order: ["localStorage", "navigator"],
          caches: ["localStorage"],
          lookupLocalStorage: "sz6_lang",
        }
      : undefined,
  });
}

export default i18n;
