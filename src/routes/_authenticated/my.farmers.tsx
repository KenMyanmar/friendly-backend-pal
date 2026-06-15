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

export const Route = createFileRoute("/_authenticated/my/farmers")({
  component: MyFarmersPage,
});

type Profile = {
  id: string;
  full_name: string;
  full_name_my: string | null;
  phone: string | null;
  village: string | null;
  township: string | null;
  created_at: string;
};

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(120),
  full_name_my: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  village: z.string().trim().max(80).optional().or(z.literal("")),
  township: z.string().trim().max(80).optional().or(z.literal("")),
});

function MyFarmersPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    full_name_my: "",
    phone: "",
    village: "",
    township: "",
  });
  const [err, setErr] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["my-profiles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,full_name_my,phone,village,township,created_at")
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = profileSchema.parse(form);
      const payload = {
        full_name: parsed.full_name,
        full_name_my: parsed.full_name_my || null,
        phone: parsed.phone || null,
        village: parsed.village || null,
        township: parsed.township || null,
      };
      if (editing) {
        const { error } = await supabase.from("profiles").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert({ ...payload, created_by: user!.id, user_id: null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setEditing(null);
      setForm({ full_name: "", full_name_my: "", phone: "", village: "", township: "" });
      setErr(null);
      qc.invalidateQueries({ queryKey: ["my-profiles"] });
    },
    onError: (e: unknown) => setErr(e instanceof Error ? e.message : String(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-profiles"] }),
  });

  function startEdit(p: Profile) {
    setEditing(p);
    setForm({
      full_name: p.full_name,
      full_name_my: p.full_name_my ?? "",
      phone: p.phone ?? "",
      village: p.village ?? "",
      township: p.township ?? "",
    });
  }
  function cancel() {
    setEditing(null);
    setForm({ full_name: "", full_name_my: "", phone: "", village: "", township: "" });
    setErr(null);
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">{t("nav.myFarmers")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("farmers.subtitle")}</p>

        <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">
            {editing ? t("farmers.editTitle") : t("farmers.addTitle")}
          </h2>
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <Field label={t("farmers.fullName") + " *"}>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
                maxLength={120}
              />
            </Field>
            <Field label={t("farmers.fullNameMy")}>
              <Input
                value={form.full_name_my}
                onChange={(e) => setForm({ ...form, full_name_my: e.target.value })}
                maxLength={120}
              />
            </Field>
            <Field label={t("farmers.phone")}>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                maxLength={40}
              />
            </Field>
            <Field label={t("farmers.village")}>
              <Input
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                maxLength={80}
              />
            </Field>
            <Field label={t("farmers.township")}>
              <Input
                value={form.township}
                onChange={(e) => setForm({ ...form, township: e.target.value })}
                maxLength={80}
              />
            </Field>
            {err && (
              <p className="text-sm text-destructive sm:col-span-2">{err}</p>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? t("common.loading") : t("common.save")}
              </Button>
              {editing && (
                <Button type="button" variant="secondary" onClick={cancel}>
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">{t("farmers.listTitle")}</h2>
          {list.isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : (list.data ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("farmers.empty")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
              {list.data!.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-card-foreground">
                      {p.full_name}
                      {p.full_name_my ? <span className="ml-2 text-muted-foreground">({p.full_name_my})</span> : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[p.village, p.township].filter(Boolean).join(", ") || "—"}
                      {p.phone ? ` · ${p.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="secondary" onClick={() => startEdit(p)}>
                      {t("common.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm(t("common.confirmDelete"))) remove.mutate(p.id);
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
