import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/my-supabase/client";
import { useMyRoles, useSession } from "@/lib/auth";
import { useLangPick } from "@/lib/lang";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

type Crop = { id: string; name_en: string; name_my: string; unit: string };
type PriceRow = {
  id: string;
  reference_price: number;
  currency: string;
  month: string;
  notes: string | null;
  crop: Crop | null;
};

const priceSchema = z.object({
  crop_id: z.string().uuid("Pick a crop"),
  reference_price: z.coerce.number().min(0, "Must be ≥ 0"),
  currency: z.string().trim().min(1).max(8),
  month: z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

function firstOfMonth(yyyyMm: string): string {
  return `${yyyyMm}-01`;
}

function AdminPage() {
  const { t } = useTranslation();
  const { user } = useSession();
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
      <>
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-2xl font-bold text-foreground">{t("admin.title")}</h1>
          <p className="mt-3 text-sm text-destructive">{t("admin.onlyAdmin")}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">{t("admin.title")}</h1>
        <PriceBoardSection userId={user!.id} />
      </main>
    </>
  );
}

function PriceBoardSection({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const pick = useLangPick();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    crop_id: "",
    reference_price: "",
    currency: "MMK",
    month: new Date().toISOString().slice(0, 7),
    notes: "",
  });
  const [err, setErr] = useState<string | null>(null);

  const crops = useQuery({
    queryKey: ["crops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crops")
        .select("id,name_en,name_my,unit")
        .order("name_en");
      if (error) throw error;
      return (data ?? []) as Crop[];
    },
  });

  const rows = useQuery({
    queryKey: ["price_board", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_board")
        .select(
          `id, reference_price, currency, month, notes,
           crop:crops ( id, name_en, name_my, unit )`,
        )
        .order("month", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as PriceRow[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = priceSchema.parse(form);
      const payload = {
        crop_id: parsed.crop_id,
        reference_price: parsed.reference_price,
        currency: parsed.currency,
        month: firstOfMonth(parsed.month),
        notes: parsed.notes || null,
      };
      if (editingId) {
        const { error } = await supabase.from("price_board").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("price_board")
          .insert({ ...payload, set_by: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setEditingId(null);
      setForm({
        crop_id: "",
        reference_price: "",
        currency: "MMK",
        month: new Date().toISOString().slice(0, 7),
        notes: "",
      });
      setErr(null);
      qc.invalidateQueries({ queryKey: ["price_board"] });
    },
    onError: (e: unknown) => setErr(e instanceof Error ? e.message : String(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("price_board").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["price_board"] }),
  });

  function startEdit(r: PriceRow) {
    setEditingId(r.id);
    setForm({
      crop_id: r.crop?.id ?? "",
      reference_price: String(r.reference_price),
      currency: r.currency,
      month: r.month.slice(0, 7),
      notes: r.notes ?? "",
    });
  }

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold text-foreground">{t("admin.priceBoard")}</h2>

      <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-semibold text-card-foreground">
          {editingId ? t("priceBoard.editTitle") : t("priceBoard.addTitle")}
        </h3>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Field label={t("listings.crop") + " *"}>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={form.crop_id}
              onChange={(e) => setForm({ ...form, crop_id: e.target.value })}
              required
            >
              <option value="">—</option>
              {(crops.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {pick(c, "name")}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("priceBoard.month") + " *"}>
            <Input
              type="month"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
              required
            />
          </Field>
          <Field label={t("priceBoard.refPrice") + " *"}>
            <Input
              type="number"
              step="1"
              min="0"
              value={form.reference_price}
              onChange={(e) => setForm({ ...form, reference_price: e.target.value })}
              required
            />
          </Field>
          <Field label={t("priceBoard.currency")}>
            <Input
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              maxLength={8}
            />
          </Field>
          <Field label={t("priceBoard.notes")}>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              maxLength={500}
            />
          </Field>
          {err && <p className="text-sm text-destructive sm:col-span-2">{err}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? t("common.loading") : t("common.save")}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    crop_id: "",
                    reference_price: "",
                    currency: "MMK",
                    month: new Date().toISOString().slice(0, 7),
                    notes: "",
                  });
                  setErr(null);
                }}
              >
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="mt-6">
        {rows.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (rows.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("prices.empty")}</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {rows.data!.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-card-foreground">
                    {r.crop ? pick(r.crop, "name") : "—"} · {r.reference_price} {r.currency}
                    {r.crop?.unit ? ` / ${r.crop.unit}` : ""}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.month.slice(0, 7)}
                    {r.notes ? ` · ${r.notes}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(r)}>
                    {t("common.edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(t("common.confirmDelete"))) remove.mutate(r.id);
                    }}
                  >
                    {t("common.delete")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
