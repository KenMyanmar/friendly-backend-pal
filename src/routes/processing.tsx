import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AppHeader } from "@/components/AppHeader";
import { konjacPhotos, konjacHero } from "@/lib/konjacPhotos";
import i18n from "@/i18n";

export const Route = createFileRoute("/processing")({
  head: () => ({
    meta: [
      { title: "Processing plant — Konjac (ဝဥ) | Special Zone 6" },
      {
        name: "description",
        content:
          "Cooperative konjac (ဝဥ) processing: field, harvest, washing line, drying racks, and warehouse — Pa-O Self-Administered Zone.",
      },
      { property: "og:title", content: "Konjac processing — Special Zone 6" },
      {
        property: "og:description",
        content: "From field to finished sack: the cooperative's konjac (ဝဥ) supply chain in photos.",
      },
      { property: "og:image", content: konjacHero },
      { property: "twitter:image", content: konjacHero },
    ],
  }),
  component: ProcessingPage,
});

const stages = ["field", "harvest", "processing", "drying", "warehouse"] as const;

function ProcessingPage() {
  const { t } = useTranslation();
  const lang = i18n.language?.startsWith("my") ? "my" : "en";
  const captionKey = lang === "my" ? "caption_my" : "caption_en";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <section className="relative h-[42vh] min-h-[260px] w-full overflow-hidden">
        <img
          src={konjacHero}
          alt={t("processing.heroAlt")}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="relative z-10 mx-auto flex h-full max-w-6xl items-end px-4 pb-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              {t("processing.eyebrow")}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground md:text-5xl">
              {t("processing.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
              {t("processing.subtitle")}
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 space-y-12">
        {stages.map((stage) => {
          const items = konjacPhotos.filter((p) => p.stage === stage);
          if (items.length === 0) return null;
          return (
            <section key={stage}>
              <h2 className="mb-4 text-xl font-bold text-foreground md:text-2xl">
                {t(`processing.stage.${stage}`)}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                  <figure
                    key={p.url}
                    className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                  >
                    <img
                      src={p.url}
                      alt={p[captionKey]}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <figcaption className="p-3 text-sm text-muted-foreground">
                      {p[captionKey]}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
