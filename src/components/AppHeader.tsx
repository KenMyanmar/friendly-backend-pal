import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LanguageToggle } from "./LanguageToggle";
import { useMyRoles, useSession } from "@/lib/auth";
import { supabase } from "@/integrations/my-supabase/client";

export function AppHeader() {
  const { t } = useTranslation();
  const { user } = useSession();
  const { isStaff, isCommitteeOrAdmin } = useMyRoles();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="inline-block h-6 w-6 rounded-md bg-primary" aria-hidden />
          <span className="hidden sm:inline">{t("app.name")}</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm">
          <NavLink to="/market">{t("nav.market")}</NavLink>
          <NavLink to="/demand">{t("nav.demand")}</NavLink>
          <NavLink to="/prices">{t("nav.prices")}</NavLink>
          <NavLink to="/calendar">{t("nav.calendar")}</NavLink>
          <NavLink to="/processing">{t("nav.processing")}</NavLink>
          {isStaff && <NavLink to="/my/farmers">{t("nav.myFarmers")}</NavLink>}
          {isStaff && <NavLink to="/my/listings">{t("nav.myListings")}</NavLink>}
          {isStaff && <NavLink to="/my/demand">{t("nav.myDemand")}</NavLink>}
          {isCommitteeOrAdmin && <NavLink to="/admin">{t("nav.admin")}</NavLink>}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          {user ? (
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                await navigate({ to: "/" });
              }}
              className="inline-flex h-9 items-center rounded-md bg-secondary px-3 text-sm font-medium text-secondary-foreground hover:opacity-90"
            >
              {t("nav.signOut")}
            </button>
          ) : (
            <Link
              to="/auth"
              className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {t("nav.signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:text-foreground"
      activeProps={{ className: "active" }}
    >
      {children}
    </Link>
  );
}
