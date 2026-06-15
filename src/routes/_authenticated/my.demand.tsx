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
import { useSession } from "@/lib/auth";
import { useLangPick } from "@/lib/lang";

export const Route = createFileRoute("/_authenticated/my/demand")({
  component: MyDemandPage,
});

type Crop = { id: string; name_en: string; name_my: string; unit: string };
type Profile = { id: string; full_name: string; full_name_my: string | null };
type Demand = {
  id: string;
  quantity: number;
  target_price: number | null;
  needed_by: string | null;
  status: "open" | "matched" | "fulfilled";
  created_at: string;
  crop: Crop | null;
  buyer: { full_name: string } | null;
};

const schema = z.object({
  buyer_profile_id: z.string().uuid("Pick a buyer"),
  crop_id: z.string().uuid("Pick a crop"),
  quantity: z.coerce.number().positive("Must be > 0"),
  target_price: z
    .union([z.coerce.number().min(0, "Must be ≥ 0"), z.literal("")])
    .optional(),
  needed_by: z.string().optional().or(z.literal("")),
  status: z.enum(["open", "matched", "fulfilled"]),
});

const empty = {
  buyer_profile_id: "",
  crop_id: "",
  quantity: "",
  target_price: "",
  needed_by: "",
  status: "open" as const,
};

function MyDemandPage() {
  const { t } = useTranslation();
  const pick = useLangPick();
  const { user } = useSession();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [err, setErr] = useState<string | null>(null);

  const buyers = useQuery({
    queryKey: ["my-profiles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,full_name_my")
        .eq("created_by", user!.id)
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

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

  const items = useQuery({
    queryKey: ["my-demand", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demand")
        .select(
          `id, quantity, target_price, needed_by, status, created_at,
           crop:crops ( id, name_en, name_my, unit ),
           buyer:profiles!buyer_profile_id ( full_name )`,
        )
        .eq("posted_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Demand[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse(form);
      const payload = {
        buyer_profile_id: parsed.buyer_profile_id,
        crop_id: parsed.crop_id,
        quantity: parsed.quantity,
        target_price:
          parsed.target_price === "" || parsed.target_price === undefined
            ? null
            : parsed.target_price,
        needed_by: parsed.needed_by || null,
        status: parsed.status,
      };
      if (editingId) {
        const { error } = await supabase.from("demand").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("demand").insert({ ...payload, posted_by: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setEditingId(null);
      setForm(empty);
      setErr(null);
      qc.invalidateQueries({ queryKey: ["my-demand"] });
      qc.invalidateQueries({ queryKey: ["demand"] });
    },
    onError: (e: unknown) => setErr(e instanceof Error ? e.message : String(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("demand").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-demand"] });
      qc.invalidateQueries({ queryKey: ["demand"] });
    },
  });

  function startEdit(d: Demand) {
    setEditingId(d.id);
    setForm({
      buyer_profile_id: "",
      crop_id: d.crop?.id ?? "",
      quantity: String(d.quantity),
      target_price: d.target_price != null ? String(d.target_price) : "",
      needed_by: d.needed_by ?? "",
      status: d.status,
    });
  }
  function cancel() {
    setEditingId(null);
    setForm(empty);
    setErr(null);
  }

  const hasBuyers = (buyers.data ?? []).length > 0;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">{t("nav.myDemand")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("demandMy.subtitle")}</p>

        {!hasBuyers && !buyers.isLoading && (
          <p className="mt-4 rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
            {t("demandMy.noBuyers")}
          </p>
        )}

        <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">
            {editingId ? t("demandMy.editTitle") : t("demandMy.addTitle")}
          </h2>
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <Field label={t("demandMy.buyer") + " *"}>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={form.buyer_profile_id}
                onChange={(e) => setForm({ ...form, buyer_profile_id: e.target.value })}
                required
              >
                <option value="">—</option>
                {(buyers.data ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.full_name}
                    {b.full_name_my ? ` (${b.full_name_my})` : ""}
                  </option>
                ))}
              </select>
            </Field>
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
            <Field label={t("market.qty") + " *"}>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </Field>
            <Field label={t("demand.targetPrice") + " (MMK)"}>
              <Input
                type="number"
                step="1"
                min="0"
                value={form.target_price}
                onChange={(e) => setForm({ ...form, target_price: e.target.value })}
              />
            </Field>
            <Field label={t("demand.neededBy")}>
              <Input
                type="date"
                value={form.needed_by}
                onChange={(e) => setForm({ ...form, needed_by: e.target.value })}
              />
            </Field>
            <Field label={t("market.status")}>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
              >
                <option value="open">{t("status.open")}</option>
                <option value="matched">{t("status.matched")}</option>
                <option value="fulfilled">{t("status.fulfilled")}</option>
              </select>
            </Field>
            {err && <p className="text-sm text-destructive sm:col-span-2">{err}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={save.isPending || !hasBuyers}>
                {save.isPending ? t("common.loading") : t("common.save")}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={cancel}>
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">{t("demandMy.listTitle")}</h2>
          {items.isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : (items.data ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("demandMy.empty")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
              {items.data!.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-card-foreground">
                      {d.crop ? pick(d.crop, "name") : "—"} · {d.quantity}
                      {d.target_price != null ? ` · ${d.target_price} MMK` : ""}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {d.buyer?.full_name ?? "—"}
                      {d.needed_by ? ` · ${d.needed_by}` : ""} · {t(`status.${d.status}`)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="secondary" onClick={() => startEdit(d)}>
                      {t("common.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm(t("common.confirmDelete"))) remove.mutate(d.id);
                      }}
                    >
                      {t("common.delete")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
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
