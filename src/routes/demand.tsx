import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { supabase } from "@/integrations/my-supabase/client";
import { useLangPick } from "@/lib/lang";

export const Route = createFileRoute("/demand")({
  component: DemandPage,
});

function DemandPage() {
  const { t } = useTranslation();
  const pick = useLangPick();

  const q = useQuery({
    queryKey: ["demand"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demand")
        .select(`
          id, quantity, target_price, needed_by, status, created_at,
          crop:crops ( id, name_en, name_my, unit ),
          buyer:profiles!buyer_profile_id ( id, full_name, full_name_my, township )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t("demand.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("demand.subtitle")}</p>

      {q.isLoading && <p className="mt-6 text-sm text-muted-foreground">{t("common.loading")}</p>}
      {!q.isLoading && (q.data ?? []).length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">{t("demand.empty")}</p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(q.data ?? []).map((d: any) => (
          <article key={d.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-base font-semibold text-card-foreground">
              {d.crop ? pick(d.crop, "name") : "—"}
            </h3>
            <dl className="mt-3 space-y-1 text-sm">
              <Row label={t("market.qty")} value={`${d.quantity}`} />
              {d.target_price != null && (
                <Row label={t("demand.targetPrice")} value={`${d.target_price} MMK`} />
              )}
              {d.needed_by && <Row label={t("demand.neededBy")} value={d.needed_by} />}
              <Row label={t("market.status")} value={t(`status.${d.status}`)} />
            </dl>
          </article>
        ))}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
