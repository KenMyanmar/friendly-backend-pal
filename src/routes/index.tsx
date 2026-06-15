import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Special Zone 6 — Pa-O Farmer & Buyer Marketplace" },
      {
        name: "description",
        content:
          "Bilingual platform connecting Pa-O farmers directly with buyers — grow only what's already sold.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <section className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 md:p-14">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            {t("app.name")}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            {t("app.tagline")}
          </p>
          <div className="mt-8">
            <Link
              to="/auth"
              className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
            >
              {t("landing.ctaSignIn")}
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {(["farmers", "buyers", "committee"] as const).map((k) => (
            <article key={k} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-card-foreground">
                {t(`landing.for.${k}`)}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`landing.for.${k}Body`)}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
