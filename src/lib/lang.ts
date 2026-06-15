import { useTranslation } from "react-i18next";

/**
 * Pick a bilingual value from a row that has `${key}_en` / `${key}_my` columns.
 * Falls back to the English value if Myanmar is missing.
 */
export function useLangPick() {
  const { i18n } = useTranslation();
  const isMy = i18n.language?.startsWith("my");
  return function pick<T extends Record<string, unknown>>(row: T, key: string): string {
    const my = row[`${key}_my`] as string | undefined;
    const en = row[`${key}_en`] as string | undefined;
    return (isMy && my) || en || my || "";
  };
}

export function inSeasonNow(months: number[] | null | undefined): boolean {
  if (!months || months.length === 0) return false;
  const m = new Date().getMonth() + 1;
  return months.includes(m);
}
