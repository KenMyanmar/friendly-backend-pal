import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { AppHeader } from "@/components/AppHeader";
import { PublicDemandCard, type PublicDemand } from "@/components/PublicCards";
import { supabase } from "@/integrations/my-supabase/client";
import { communityFeature } from "@/lib/galleryPhotos";

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
  const { t, i18n } = useTranslation();
  const isMy = i18n.language?.startsWith("my");

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

        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid md:grid-cols-[0.95fr_1.05fr]">
          <img
            src={communityFeature.url}
            alt={isMy ? communityFeature.alt_my : communityFeature.alt_en}
            loading="lazy"
            className="h-full min-h-64 w-full object-cover"
          />
          <div className="flex flex-col justify-center p-6 md:p-8">
            <h2 className="text-xl font-bold text-card-foreground">{t("nav.demand")}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{t("landing.for.buyersBody")}</p>
          </div>
        </section>

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

