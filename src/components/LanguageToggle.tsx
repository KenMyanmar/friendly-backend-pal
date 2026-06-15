import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const next = i18n.language?.startsWith("my") ? "en" : "my";

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("sz6_lang");
    const preferredLanguage = storedLanguage?.startsWith("my") ? "my" : "en";
    if (i18n.language !== preferredLanguage) {
      void i18n.changeLanguage(preferredLanguage);
    }
  }, [i18n]);

  return (
    <button
      type="button"
      onClick={() => {
        window.localStorage.setItem("sz6_lang", next);
        void i18n.changeLanguage(next);
      }}
      className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-label="Toggle language"
    >
      {t("lang.toggle")}
    </button>
  );
}


