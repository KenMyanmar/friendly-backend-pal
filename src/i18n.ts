import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import my from "./locales/my.json";

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, my: { translation: my } },
    fallbackLng: "en",
    lng: "en",
    supportedLngs: ["en", "my"],
    interpolation: { escapeValue: false },
  });
}

export default i18n;
