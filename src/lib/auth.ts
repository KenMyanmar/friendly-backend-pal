import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/my-supabase/client";

export type StaffRole = "committee" | "village_rep" | "admin";
export type Role = StaffRole | "farmer" | "buyer";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null as User | null, loading };
}

export function useMyRoles() {
  const { user, loading } = useSession();
  const q = useQuery({
    queryKey: ["my-roles", user?.id ?? null],
    enabled: !loading && !!user,
    queryFn: async (): Promise<Role[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as Role);
    },
  });
  return {
    roles: q.data ?? [],
    loading: loading || q.isLoading,
    hasRole: (r: Role) => (q.data ?? []).includes(r),
    isStaff: (q.data ?? []).some((r) => r === "committee" || r === "village_rep" || r === "admin"),
    isCommitteeOrAdmin: (q.data ?? []).some((r) => r === "committee" || r === "admin"),
  };
}
