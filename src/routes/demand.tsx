import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { AppHeader } from "@/components/AppHeader";
import { PublicDemandCard, type PublicDemand } from "@/components/PublicCards";
import { supabase } from "@/integrations/my-supabase/client";

export const Route = createFileRoute("/demand")({
  head: () => ({
    meta: [
      { title: "Demand board — Special Zone 6" },
      {
        name: "description",
        content: "Confirmed buyer demand for Pa-O crops. Grow with certainty — every order is pre-committed.",
      },
      { property: "og:title", content: "Special Zone 6 — Buyer Demand" },
      {
        property: "og:description",
        content: "Crops buyers are actively looking for, with target prices and deadlines.",
      },
    ],
  }),
  component: DemandPage,
});

function DemandPage() {
  const { t } = useTranslation();

  const q = useQuery({
    queryKey: ["demand"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demand")
        .select(`id, quantity, target_price, needed_by, status, created_at,
                 crop:crops ( id, name_en, name_my, unit )`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PublicDemand[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">{t("demand.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("demand.subtitle")}</p>

        {q.isLoading && <p className="mt-6 text-sm text-muted-foreground">{t("common.loading")}</p>}
        {!q.isLoading && (q.data ?? []).length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">{t("demand.empty")}</p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(q.data ?? []).map((d) => (
            <PublicDemandCard key={d.id} demand={d} />
          ))}
        </div>
      </main>
    </div>
  );
}
