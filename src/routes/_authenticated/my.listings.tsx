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

export const Route = createFileRoute("/_authenticated/my/listings")({
  component: MyListingsPage,
});

type Crop = { id: string; name_en: string; name_my: string; unit: string };
type Profile = { id: string; full_name: string; full_name_my: string | null };
type Listing = {
  id: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  available_from: string | null;
  location: string | null;
  status: "available" | "reserved" | "sold";
  created_at: string;
  crop: Crop | null;
  farmer: { full_name: string } | null;
};

const schema = z.object({
  farmer_profile_id: z.string().uuid("Pick a farmer"),
  crop_id: z.string().uuid("Pick a crop"),
  quantity: z.coerce.number().positive("Must be > 0"),
  unit: z.string().trim().min(1).max(20),
  price_per_unit: z.coerce.number().min(0, "Must be ≥ 0"),
  available_from: z.string().optional().or(z.literal("")),
  location: z.string().trim().max(160).optional().or(z.literal("")),
  status: z.enum(["available", "reserved", "sold"]),
});

const empty = {
  farmer_profile_id: "",
  crop_id: "",
  quantity: "",
  unit: "kg",
  price_per_unit: "",
  available_from: "",
  location: "",
  status: "available" as const,
};

function MyListingsPage() {
  const { t } = useTranslation();
  const pick = useLangPick();
  const { user } = useSession();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [err, setErr] = useState<string | null>(null);

  const farmers = useQuery({
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

  const listings = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(
          `id, quantity, unit, price_per_unit, available_from, location, status, created_at,
           crop:crops ( id, name_en, name_my, unit ),
           farmer:profiles!farmer_profile_id ( full_name )`,
        )
        .eq("posted_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Listing[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse(form);
      const payload = {
        farmer_profile_id: parsed.farmer_profile_id,
        crop_id: parsed.crop_id,
        quantity: parsed.quantity,
        unit: parsed.unit,
        price_per_unit: parsed.price_per_unit,
        available_from: parsed.available_from || null,
        location: parsed.location || null,
        status: parsed.status,
      };
      if (editingId) {
        const { error } = await supabase.from("listings").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("listings").insert({ ...payload, posted_by: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setEditingId(null);
      setForm(empty);
      setErr(null);
      qc.invalidateQueries({ queryKey: ["my-listings"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (e: unknown) => setErr(e instanceof Error ? e.message : String(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-listings"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
    },
  });

  function startEdit(l: Listing) {
    setEditingId(l.id);
    setForm({
      farmer_profile_id: "", // not selected in select query; user re-picks if changing
      crop_id: l.crop?.id ?? "",
      quantity: String(l.quantity),
      unit: l.unit,
      price_per_unit: String(l.price_per_unit),
      available_from: l.available_from ?? "",
      location: l.location ?? "",
      status: l.status,
    });
  }
  function cancel() {
    setEditingId(null);
    setForm(empty);
    setErr(null);
  }

  const hasFarmers = (farmers.data ?? []).length > 0;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">{t("nav.myListings")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("listings.subtitle")}</p>

        {!hasFarmers && !farmers.isLoading && (
          <p className="mt-4 rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
            {t("listings.noFarmers")}
          </p>
        )}

        <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">
            {editingId ? t("listings.editTitle") : t("listings.addTitle")}
          </h2>
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <Field label={t("listings.farmer") + " *"}>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={form.farmer_profile_id}
                onChange={(e) => setForm({ ...form, farmer_profile_id: e.target.value })}
                required
              >
                <option value="">—</option>
                {(farmers.data ?? []).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.full_name}
                    {f.full_name_my ? ` (${f.full_name_my})` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("listings.crop") + " *"}>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={form.crop_id}
                onChange={(e) => {
                  const c = (crops.data ?? []).find((x) => x.id === e.target.value);
                  setForm({ ...form, crop_id: e.target.value, unit: c?.unit ?? form.unit });
                }}
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
            <Field label={t("listings.unit") + " *"}>
              <Input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                maxLength={20}
                required
              />
            </Field>
            <Field label={t("market.price") + " (MMK / " + (form.unit || "kg") + ") *"}>
              <Input
                type="number"
                step="1"
                min="0"
                value={form.price_per_unit}
                onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })}
                required
              />
            </Field>
            <Field label={t("market.from")}>
              <Input
                type="date"
                value={form.available_from}
                onChange={(e) => setForm({ ...form, available_from: e.target.value })}
              />
            </Field>
            <Field label={t("listings.location")}>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                maxLength={160}
              />
            </Field>
            <Field label={t("market.status")}>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
              >
                <option value="available">{t("status.available")}</option>
                <option value="reserved">{t("status.reserved")}</option>
                <option value="sold">{t("status.sold")}</option>
              </select>
            </Field>
            {err && <p className="text-sm text-destructive sm:col-span-2">{err}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={save.isPending || !hasFarmers}>
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
          <h2 className="text-lg font-semibold text-foreground">{t("listings.listTitle")}</h2>
          {listings.isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : (listings.data ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("listings.empty")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
              {listings.data!.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-card-foreground">
                      {l.crop ? pick(l.crop, "name") : "—"} · {l.quantity} {l.unit} · {l.price_per_unit} MMK
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.farmer?.full_name ?? "—"}
                      {l.location ? ` · ${l.location}` : ""}
                      {l.available_from ? ` · ${l.available_from}` : ""} · {t(`status.${l.status}`)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="secondary" onClick={() => startEdit(l)}>
                      {t("common.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm(t("common.confirmDelete"))) remove.mutate(l.id);
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
