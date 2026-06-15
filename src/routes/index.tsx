import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { AppHeader } from "@/components/AppHeader";
import { PublicListingCard, PublicDemandCard, type PublicListing, type PublicDemand } from "@/components/PublicCards";
import { supabase } from "@/integrations/my-supabase/client";
import { useLangPick, inSeasonNow } from "@/lib/lang";
import { cropShowcasePhotos, communityFeature } from "@/lib/galleryPhotos";
import { konjacPhotos, konjacFieldHero } from "@/lib/konjacPhotos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Special Zone 6 — Pa-O Farmer & Buyer Marketplace" },
      {
        name: "description",
        content:
          "Bilingual platform connecting Pa-O farmers directly with buyers — browse what's in season, this month's prices, and live demand.",
      },
      { property: "og:title", content: "Special Zone 6 Economic Initiative" },
      {
        property: "og:description",
        content:
          "Pa-O Self-Administered Zone marketplace, demand board, committee prices, and 12-month seasonal calendar.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t, i18n } = useTranslation();
  const pick = useLangPick();
  const isMy = i18n.language?.startsWith("my");

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

  const latestPrices = useQuery({
    queryKey: ["prices-latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_board")
        .select(`id, reference_price, currency, month, crop:crops(id,name_en,name_my,unit)`)
        .order("month", { ascending: false })
        .limit(50);
      if (error) throw error;
      const seen = new Set<string>();
      const out: any[] = [];
      for (const row of (data ?? []) as any[]) {
        const crop = Array.isArray(row.crop) ? row.crop[0] : row.crop;
        const cid = crop?.id;
        if (!cid || seen.has(cid)) continue;
        seen.add(cid);
        out.push({ ...row, crop });
      }
      return out;
    },
  });

  const recentListings = useQuery({
    queryKey: ["listings", "anon", "landing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`id, quantity, unit, price_per_unit, available_from, location, status, created_at,
                 crop:crops(id,name_en,name_my,unit,harvest_months)`)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as PublicListing[];
    },
  });

  const openDemand = useQuery({
    queryKey: ["demand", "open", "landing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demand")
        .select(`id, quantity, target_price, needed_by, status, created_at,
                 crop:crops(id,name_en,name_my,unit)`)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as PublicDemand[];
    },
  });

  const inSeason = (crops.data ?? []).filter((c: any) => inSeasonNow(c.harvest_months));
  const nowMonth = new Date().getMonth() + 1;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        <section className="relative overflow-hidden rounded-2xl border border-border">
          <img
            src={konjacFieldHero}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/40" />
          <div className="relative z-10 p-8 md:p-12">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              {t("app.name")}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">{t("app.tagline")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/market"
                className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
              >
                {t("nav.market")}
              </Link>
              <Link
                to="/processing"
                className="inline-flex h-11 items-center rounded-md border border-input bg-background/80 px-6 text-sm font-semibold text-foreground backdrop-blur hover:bg-accent hover:text-accent-foreground"
              >
                {t("processing.landingCta")}
              </Link>
              <Link
                to="/auth"
                className="inline-flex h-11 items-center rounded-md border border-input bg-background/80 px-6 text-sm font-semibold text-foreground backdrop-blur hover:bg-accent hover:text-accent-foreground"
              >
                {t("landing.ctaSignIn")}
              </Link>
            </div>
          </div>
        </section>

        <Section title={t("home.inSeason")} subtitle={t("home.inSeasonSub")}>
          {crops.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : inSeason.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("home.inSeasonEmpty")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {inSeason.map((c: any) => (
                <span
                  key={c.id}
                  className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary"
                >
                  {pick(c, "name")}
                </span>
              ))}
            </div>
          )}
        </Section>

        <Section title={t("nav.market")} subtitle={t("market.subtitle")} link={{ to: "/market", label: t("common.viewAll") }}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {cropShowcasePhotos.map((photo) => (
              <Link
                key={photo.url}
                to="/market"
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <img
                  src={photo.url}
                  alt={isMy ? photo.alt_my : photo.alt_en}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="border-t border-border px-3 py-2 text-sm font-medium text-card-foreground">
                  {isMy ? photo.title_my : photo.title_en}
                </div>
              </Link>
            ))}
          </div>
        </Section>

        <Section
          title={t("home.pricesTitle")}
          subtitle={t("home.pricesSub")}
          link={{ to: "/prices", label: t("common.viewAll") }}
        >
          {latestPrices.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : (latestPrices.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("prices.empty")}</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-secondary-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">{t("market.filterCrop")}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t("prices.month")}</th>
                    <th className="px-4 py-3 text-right font-semibold">{t("prices.ref")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(latestPrices.data ?? []).slice(0, 8).map((p: any) => {
                    const d = new Date(p.month);
                    return (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-4 py-3">{p.crop ? pick(p.crop, "name") : "—"}</td>
                        <td className="px-4 py-3">
                          {t(`months.${d.getMonth() + 1}`)} {d.getFullYear()}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {p.reference_price} {p.currency} / {p.crop?.unit ?? "kg"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section
          title={t("home.available")}
          subtitle={t("home.availableSub")}
          link={{ to: "/market", label: t("common.viewAll") }}
        >
          {recentListings.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : (recentListings.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("market.empty")}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(recentListings.data ?? []).map((l) => (
                <PublicListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </Section>

        <Section
          title={t("home.demand")}
          subtitle={t("home.demandSub")}
          link={{ to: "/demand", label: t("common.viewAll") }}
        >
          {openDemand.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : (openDemand.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("demand.empty")}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(openDemand.data ?? []).map((d) => (
                <PublicDemandCard key={d.id} demand={d} />
              ))}
            </div>
          )}
        </Section>

        <Section
          title={t("home.calendar")}
          subtitle={t("home.calendarSub")}
          link={{ to: "/calendar", label: t("common.viewAll") }}
        >
          {(crops.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-secondary-foreground">
                  <tr>
                    <th className="sticky left-0 bg-secondary px-3 py-2 text-left font-semibold">
                      {t("market.filterCrop")}
                    </th>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <th
                        key={m}
                        className={`px-2 py-2 text-center font-semibold ${m === nowMonth ? "text-primary" : ""}`}
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
                            <span
                              className={`inline-block h-4 w-4 rounded ${
                                on ? (m === nowMonth ? "bg-primary" : "bg-primary/60") : "bg-muted"
                              }`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section
          title={t("processing.landingTitle")}
          subtitle={t("processing.landingSub")}
          link={{ to: "/processing", label: t("processing.landingCta") }}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {konjacPhotos.slice(0, 5).map((p) => (
              <Link
                key={p.url}
                to="/processing"
                className="group relative overflow-hidden rounded-lg border border-border bg-card"
              >
                <img
                  src={p.url}
                  alt={p[isMy ? "caption_my" : "caption_en"]}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition group-hover:scale-105"
                />
              </Link>
            ))}
          </div>
        </Section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid md:grid-cols-[1.2fr_0.8fr]">
          <img
            src={communityFeature.url}
            alt={isMy ? communityFeature.alt_my : communityFeature.alt_en}
            loading="lazy"
            className="h-full min-h-64 w-full object-cover"
          />
          <div className="flex flex-col justify-center p-6 md:p-8">
            <p className="text-sm font-medium text-primary">{t("nav.demand")}</p>
            <h2 className="mt-2 text-2xl font-bold text-card-foreground">{t("landing.for.committee")}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{t("landing.for.committeeBody")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/demand"
                className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                {t("nav.demand")}
              </Link>
              <Link
                to="/auth"
                className="inline-flex h-10 items-center rounded-md border border-input bg-background px-5 text-sm font-semibold text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {t("landing.ctaSignIn")}
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {(["farmers", "buyers", "committee"] as const).map((k) => (
            <article key={k} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-card-foreground">{t(`landing.for.${k}`)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t(`landing.for.${k}Body`)}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

function Section({
  title,
  subtitle,
  link,
  children,
}: {
  title: string;
  subtitle?: string;
  link?: { to: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground md:text-2xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {link && (
          <Link to={link.to} className="text-sm font-medium text-primary hover:underline">
            {link.label} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

