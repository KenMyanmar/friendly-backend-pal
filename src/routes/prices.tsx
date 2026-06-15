import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { supabase } from "@/integrations/my-supabase/client";
import { useLangPick } from "@/lib/lang";

export const Route = createFileRoute("/prices")({
  component: PricesPage,
});

function PricesPage() {
  const { t, i18n } = useTranslation();
  const pick = useLangPick();

  const q = useQuery({
    queryKey: ["price-board"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_board")
        .select(`id, reference_price, currency, month, notes, crop:crops(id,name_en,name_my,unit)`)
        .order("month", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  function fmtMonth(dateStr: string) {
    const d = new Date(dateStr);
    const m = d.getMonth() + 1;
    return `${t(`months.${m}`)} ${d.getFullYear()}`;
  }

  void i18n; // re-render on language change for fmtMonth

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t("prices.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("prices.subtitle")}</p>

      {q.isLoading && <p className="mt-6 text-sm text-muted-foreground">{t("common.loading")}</p>}
      {!q.isLoading && (q.data ?? []).length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">{t("prices.empty")}</p>
      )}

      {(q.data ?? []).length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{t("market.filterCrop")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("prices.month")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("prices.ref")}</th>
              </tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((p: any) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">{p.crop ? pick(p.crop, "name") : "—"}</td>
                  <td className="px-4 py-3">{fmtMonth(p.month)}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {p.reference_price} {p.currency} / {p.crop?.unit ?? "kg"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
