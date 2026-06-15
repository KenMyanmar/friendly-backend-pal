import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useMyRoles } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { t } = useTranslation();
  const { isCommitteeOrAdmin, loading } = useMyRoles();

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      </main>
    );
  }

  if (!isCommitteeOrAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground">{t("admin.title")}</h1>
        <p className="mt-3 text-sm text-destructive">{t("admin.onlyAdmin")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">{t("admin.title")}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { k: "members" },
          { k: "crops" },
          { k: "priceBoard" },
        ].map((c) => (
          <article key={c.k} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-card-foreground">{t(`admin.${c.k}`)}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              CRUD UI ships next. Schema and RLS are already enforced server-side.
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
