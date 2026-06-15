import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/my-supabase/client";
import { useLangPick, inSeasonNow } from "@/lib/lang";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Seasonal calendar — Special Zone 6" },
      {
        name: "description",
        content: "12-month harvest calendar for Pa-O crops: avocado, strawberry, mango, pineapple, Maymyo fruit, and vegetables.",
      },
      { property: "og:title", content: "Special Zone 6 — Seasonal Calendar" },
      {
        property: "og:description",
        content: "When each crop is harvested in the Pa-O Self-Administered Zone — plan orders ahead of the season.",
      },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { t } = useTranslation();
  const pick = useLangPick();
  const now = new Date().getMonth() + 1;

  const crops = useQuery({
    queryKey: ["crops-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crops")
        .select("id,name_en,name_my,unit,harvest_months,category")
        .order("name_en");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">{t("calendar.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("calendar.subtitle")}</p>

        {crops.isLoading && <p className="mt-6 text-sm text-muted-foreground">{t("common.loading")}</p>}

        {(crops.data ?? []).length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-secondary-foreground">
                <tr>
                  <th className="sticky left-0 bg-secondary px-3 py-2 text-left font-semibold">
                    {t("market.filterCrop")}
                  </th>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <th
                      key={m}
                      className={`px-2 py-2 text-center font-semibold ${
                        m === now ? "text-primary" : ""
                      }`}
                    >
                      {t(`months.${m}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(crops.data ?? []).map((c: any) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="sticky left-0 bg-card px-3 py-2 font-medium text-foreground">
                      {pick(c, "name")}
                    </td>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                      const on = (c.harvest_months as number[]).includes(m);
                      return (
                        <td key={m} className="px-1 py-2 text-center">
                          {on ? (
                            <span
                              className={`inline-block h-5 w-5 rounded ${
                                m === now ? "bg-primary" : "bg-primary/60"
                              }`}
                              aria-label={t("common.inSeason")}
                            />
                          ) : (
                            <span className="inline-block h-5 w-5 rounded bg-muted" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          <span className="mr-2 inline-block h-3 w-3 rounded bg-primary align-middle" /> {t("calendar.legendNow")}
          <span className="ml-4 mr-2 inline-block h-3 w-3 rounded bg-primary/60 align-middle" /> {t("calendar.legendIn")}
        </p>

        <p className="mt-6 text-sm text-muted-foreground">
          {(crops.data ?? []).filter((c: any) => inSeasonNow(c.harvest_months)).length}{" "}
          {t("calendar.cropsInSeason")}
        </p>
      </main>
    </div>
  );
}
