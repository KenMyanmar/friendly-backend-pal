import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

import { useSession } from "@/lib/auth";
import { inSeasonNow } from "@/lib/lang";

type Crop = {
  id: string;
  name_en: string;
  name_my: string;
  unit: string | null;
  harvest_months: number[] | null;
} | null;

export type PublicListing = {
  id: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  available_from: string | null;
  location: string | null;
  status: string;
  crop: Crop;
  /** Joined farmer row — only used by signed-in staff. Hidden for anon. */
  farmer?: { township: string | null; village: string | null } | null;
};

export function PublicListingCard({ listing }: { listing: PublicListing }) {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const isMy = i18n.language?.startsWith("my");
  const cropName = listing.crop ? (isMy && listing.crop.name_my) || listing.crop.name_en : "—";
  const inSeason = inSeasonNow(listing.crop?.harvest_months ?? null);

  const joined = [listing.farmer?.village, listing.farmer?.township].filter(Boolean).join(", ");
  const where = listing.location ?? (joined || null);

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-card-foreground">{cropName}</h3>
        {inSeason && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
            {t("common.inSeason")}
          </span>
        )}
      </div>
      <dl className="mt-3 space-y-1 text-sm">
        <Row label={t("market.qty")} value={`${listing.quantity} ${listing.unit}`} />
        <Row label={t("market.price")} value={`${listing.price_per_unit} MMK / ${listing.unit}`} />
        {listing.available_from && <Row label={t("market.from")} value={listing.available_from} />}
        {where && <Row label={t("market.filterTownship")} value={where} />}
        <Row label={t("market.status")} value={t(`status.${listing.status}`)} />
      </dl>
      {!user && (
        <Link
          to="/auth"
          className="mt-3 inline-flex h-8 items-center rounded-md bg-secondary px-3 text-xs font-medium text-secondary-foreground hover:opacity-90"
        >
          {t("public.signInToContact")}
        </Link>
      )}
    </article>
  );
}

export type PublicDemand = {
  id: string;
  quantity: number;
  target_price: number | null;
  needed_by: string | null;
  status: string;
  crop: Crop;
};

export function PublicDemandCard({ demand }: { demand: PublicDemand }) {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const isMy = i18n.language?.startsWith("my");
  const cropName = demand.crop ? (isMy && demand.crop.name_my) || demand.crop.name_en : "—";
  const unit = demand.crop?.unit ?? "kg";
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="text-base font-semibold text-card-foreground">{cropName}</h3>
      <dl className="mt-3 space-y-1 text-sm">
        <Row label={t("market.qty")} value={`${demand.quantity} ${unit}`} />
        {demand.target_price != null && (
          <Row label={t("demand.targetPrice")} value={`${demand.target_price} MMK`} />
        )}
        {demand.needed_by && <Row label={t("demand.neededBy")} value={demand.needed_by} />}
        <Row label={t("market.status")} value={t(`status.${demand.status}`)} />
      </dl>
      {!user && (
        <Link
          to="/auth"
          className="mt-3 inline-flex h-8 items-center rounded-md bg-secondary px-3 text-xs font-medium text-secondary-foreground hover:opacity-90"
        >
          {t("public.signInToContact")}
        </Link>
      )}
    </article>
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
