import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { AppHeader } from "@/components/AppHeader";
import { PublicListingCard, type PublicListing } from "@/components/PublicCards";
import { supabase } from "@/integrations/my-supabase/client";
import { useSession } from "@/lib/auth";
import { useLangPick, inSeasonNow } from "@/lib/lang";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Marketplace — Special Zone 6" },
      {
        name: "description",
        content:
          "Browse crops available from Pa-O cooperatives. Filter by crop, township, and what's in season now.",
      },
      { property: "og:title", content: "Special Zone 6 Marketplace" },
      {
        property: "og:description",
        content: "Browse available crops from Pa-O cooperatives — quantity, price, and location.",
      },
    ],
  }),
  component: MarketPage,
});

function MarketPage() {
  const { t } = useTranslation();
  const pick = useLangPick();
  const { user } = useSession();
  const [cropFilter, setCropFilter] = useState("");
  const [townshipFilter, setTownshipFilter] = useState("");
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

  // Anonymous users can't read profiles (RLS denies it), so don't even try to join.
  const listingsSelect = user
    ? `id, quantity, unit, price_per_unit, available_from, location, status, created_at,
       crop:crops ( id, name_en, name_my, unit, harvest_months ),
       farmer:profiles!farmer_profile_id ( village, township )`
    : `id, quantity, unit, price_per_unit, available_from, location, status, created_at,
       crop:crops ( id, name_en, name_my, unit, harvest_months )`;

  const listings = useQuery({
    queryKey: ["listings", user ? "auth" : "anon"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(listingsSelect)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PublicListing[];
    },
  });

  const townships = useMemo(() => {
    const s = new Set<string>();
    (listings.data ?? []).forEach((l) => {
      const tn = l.farmer?.township ?? extractTownship(l.location);
      if (tn) s.add(tn);
    });
    return Array.from(s).sort();
  }, [listings.data]);

  const filtered = useMemo(() => {
    return (listings.data ?? []).filter((l) => {
      if (cropFilter && l.crop?.id !== cropFilter) return false;
      if (townshipFilter) {
        const tn = l.farmer?.township ?? extractTownship(l.location);
        if (tn !== townshipFilter) return false;
      }
      if (seasonOnly && !inSeasonNow(l.crop?.harvest_months ?? null)) return false;
      return true;
    });
  }, [listings.data, cropFilter, townshipFilter, seasonOnly]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">{t("market.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("market.subtitle")}</p>

        <div className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
          <div className="min-w-40 flex-1">
            <label className="block text-xs font-medium text-muted-foreground">
              {t("market.filterCrop")}
            </label>
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">{t("market.all")}</option>
              {(crops.data ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {pick(c, "name")}
                </option>
              ))}
            </select>
          </div>
          {townships.length > 0 && (
            <div className="min-w-40 flex-1">
              <label className="block text-xs font-medium text-muted-foreground">
                {t("market.filterTownship")}
              </label>
              <select
                value={townshipFilter}
                onChange={(e) => setTownshipFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{t("market.all")}</option>
                {townships.map((tn) => (
                  <option key={tn} value={tn}>
                    {tn}
                  </option>
                ))}
              </select>
            </div>
          )}
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={seasonOnly}
              onChange={(e) => setSeasonOnly(e.target.checked)}
            />
            {t("market.inSeasonOnly")}
          </label>
        </div>

        {listings.isLoading && (
          <p className="mt-6 text-sm text-muted-foreground">{t("common.loading")}</p>
        )}
        {!listings.isLoading && filtered.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">{t("market.empty")}</p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <PublicListingCard key={l.id} listing={l} />
          ))}
        </div>

        {!user && filtered.length > 0 && (
          <p className="mt-6 text-xs text-muted-foreground">
            <Link to="/auth" className="underline">
              {t("public.signInToContact")}
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}

function extractTownship(loc: string | null): string | null {
  if (!loc) return null;
  const parts = loc.split(",").map((s) => s.trim());
  return parts[parts.length - 1] || null;
}
