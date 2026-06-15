import { useTranslation } from "react-i18next";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const next = i18n.language?.startsWith("my") ? "en" : "my";
  return (
    <button
      type="button"
      onClick={() => void i18n.changeLanguage(next)}
      className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
      aria-label="Toggle language"
    >
      {t("lang.toggle")}
    </button>
  );
}
