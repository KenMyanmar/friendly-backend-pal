import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { supabase } from "@/integrations/my-supabase/client";
import { useLangPick, inSeasonNow } from "@/lib/lang";

export const Route = createFileRoute("/market")({
  component: MarketPage,
});

function MarketPage() {
  const { t } = useTranslation();
  const pick = useLangPick();
  const [cropFilter, setCropFilter] = useState<string>("");
  const [townshipFilter, setTownshipFilter] = useState<string>("");
  const [seasonOnly, setSeasonOnly] = useState(false);

  const crops = useQuery({
    queryKey: ["crops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crops")
        .select("id,name_en,name_my,unit,harvest_months,category")
        .order("name_en");
      if (error) throw error;
      return data ?? [];
    },
  });

  const listings = useQuery({
    queryKey: ["listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          id, quantity, unit, price_per_unit, available_from, location, status, created_at,
          crop:crops ( id, name_en, name_my, unit, harvest_months ),
          farmer:profiles!farmer_profile_id ( id, full_name, full_name_my, village, township )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const townships = useMemo(() => {
    const s = new Set<string>();
    (listings.data ?? []).forEach((l: any) => l.farmer?.township && s.add(l.farmer.township));
    return Array.from(s).sort();
  }, [listings.data]);

  const filtered = useMemo(() => {
    return (listings.data ?? []).filter((l: any) => {
      if (cropFilter && l.crop?.id !== cropFilter) return false;
      if (townshipFilter && l.farmer?.township !== townshipFilter) return false;
      if (seasonOnly && !inSeasonNow(l.crop?.harvest_months)) return false;
      return true;
    });
  }, [listings.data, cropFilter, townshipFilter, seasonOnly]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t("market.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("market.subtitle")}</p>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="min-w-40 flex-1">
          <label className="block text-xs font-medium text-muted-foreground">{t("market.filterCrop")}</label>
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{t("market.all")}</option>
            {(crops.data ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>{pick(c, "name")}</option>
            ))}
          </select>
        </div>
        <div className="min-w-40 flex-1">
          <label className="block text-xs font-medium text-muted-foreground">{t("market.filterTownship")}</label>
          <select
            value={townshipFilter}
            onChange={(e) => setTownshipFilter(e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">{t("market.all")}</option>
            {townships.map((tn) => (
              <option key={tn} value={tn}>{tn}</option>
            ))}
          </select>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={seasonOnly} onChange={(e) => setSeasonOnly(e.target.checked)} />
          {t("market.inSeasonOnly")}
        </label>
      </div>

      {listings.isLoading && <p className="mt-6 text-sm text-muted-foreground">{t("common.loading")}</p>}

      {!listings.isLoading && filtered.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">{t("market.empty")}</p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((l: any) => {
          const inSeason = inSeasonNow(l.crop?.harvest_months);
          return (
            <article key={l.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-card-foreground">
                  {l.crop ? pick(l.crop, "name") : "—"}
                </h3>
                {inSeason && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                    {t("common.inSeason")}
                  </span>
                )}
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <Row label={t("market.qty")} value={`${l.quantity} ${l.unit}`} />
                <Row label={t("market.price")} value={`${l.price_per_unit} MMK / ${l.unit}`} />
                {l.available_from && <Row label={t("market.from")} value={l.available_from} />}
                {l.farmer && (
                  <Row
                    label={t("market.filterTownship")}
                    value={[l.farmer.village, l.farmer.township].filter(Boolean).join(", ")}
                  />
                )}
                <Row label={t("market.status")} value={t(`status.${l.status}`)} />
              </dl>
            </article>
          );
        })}
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
